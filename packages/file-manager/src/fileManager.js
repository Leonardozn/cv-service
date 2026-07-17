const multer = require('multer')
const envVariables = require('@cv-service/env-variables')
const { BadRequestError } = require('@cv-service/handle-errors')
const { HandleResponse, ResponseBody } = require('@cv-service/handle-response')
const path = require('path')
const fs = require('fs')

const LocalStorageStrategy = require('./strategies/localStorageStrategy')
const S3StorageStrategy = require('./strategies/s3StorageStrategy')

const DEFAULT_MAX_FILE_SIZE = 5242880 // 5 MB
const DEFAULT_ALLOWED_FORMATS = 'image/jpeg,image/png,image/webp'

// Service root, anchored to this package's on-disk location (packages/file-manager/src), NOT
// process.cwd(). It's the fallback base for the uploads folder when neither the caller nor the env
// provides an absolute path, so the folder is always at <service-root>/<app>-uploads regardless of
// the directory the process was launched from (running from the root vs. from apps/api used to
// scatter two separate api-uploads folders).
const SERVICE_ROOT = path.resolve(__dirname, '..', '..', '..')

class FileManager {
	/**
	 * @private
	 */
	uploadMiddleware

	/**
	 * @private
	 */
	storageStrategy

	/**
	 * @private
	 */
	destinationPath

	constructor(settings = {}, appName) {
		if (!appName) throw new Error('App name is required to initialize FileManager')

		const envPrefix = appName.toUpperCase().replaceAll('-', '_')

		// Destination resolution — single source of truth is the app's index.js, which computes the
		// absolute path and passes it as settings.uploadPath. Priority: explicit setting > env
		// (`<APP>_UPLOAD_PATH`) > `<service-root>/<app>-uploads`.
		const destinationPath = settings.uploadPath || envVariables[`${envPrefix}_UPLOAD_PATH`] || path.join(SERVICE_ROOT, `${appName.toLowerCase()}-uploads`)

		const isS3 = typeof destinationPath === 'string' && destinationPath.startsWith('s3://')

		let storage

		if (isS3) {
			// The bucket name is the s3:// URI's own "host" segment (s3://<bucket>); endpoint,
			// region and credentials aren't part of that convention, so they come from their
			// own env vars instead - same <APP>_ prefix as every other setting here.
			const bucket = destinationPath.replace('s3://', '')

			this.storageStrategy = new S3StorageStrategy({
				bucket,
				endpoint: envVariables[`${envPrefix}_S3_ENDPOINT`],
				region: envVariables[`${envPrefix}_S3_REGION`],
				accessKeyId: envVariables[`${envPrefix}_S3_ACCESS_KEY_ID`],
				secretAccessKey: envVariables[`${envPrefix}_S3_SECRET_ACCESS_KEY`]
			})

			// The upload arrives fully in memory (file.buffer) - the S3 strategy uploads it
			// straight from there, so the ephemeral local disk (wiped on every redeploy) is
			// never touched at all, not even as a staging step.
			storage = multer.memoryStorage()
		} else {
			// Kept so the directory can be created lazily (see _ensureDestination), only when an upload
			// middleware is actually mounted — a service that never uploads should not create an empty
			// folder just by wiring the handler.
			this.destinationPath = destinationPath

			storage = multer.diskStorage({
				destination: (req, file, cb) => {
					cb(null, this.destinationPath)
				},
				filename: function (req, file, cb) {
					const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
					cb(null, uniqueSuffix + '-' + file.originalname)
				}
			})

			// Instanciamos el proveedor para el manejo interno en otros lados
			this.storageStrategy = new LocalStorageStrategy()
		}

		const multerOptions = { storage: storage }

		// Maximum file size (bytes): explicit setting > env (`<APP>_UPLOAD_MAX_FILE_SIZE`) > 5 MB. The
		// fallback keeps every upload bounded even when nothing is configured, so a file is never
		// unbounded by default.
		const maxFileSize = Number(settings.maxFileSize || envVariables[`${envPrefix}_UPLOAD_MAX_FILE_SIZE`] || DEFAULT_MAX_FILE_SIZE)
		if (Number.isFinite(maxFileSize) && maxFileSize > 0) {
			multerOptions.limits = { fileSize: maxFileSize }
		}

		// Allowed mimetypes: explicit setting (array) > env (`<APP>_UPLOAD_ALLOWED_FORMATS`, comma-
		// separated) > image formats. Rejections raise a BadRequestError so the wrapper below maps
		// them to a 400 rather than a generic 500.
		const allowedFormats = Array.isArray(settings.allowedFormats)
			? settings.allowedFormats
			: (envVariables[`${envPrefix}_UPLOAD_ALLOWED_FORMATS`] || DEFAULT_ALLOWED_FORMATS).split(',').map(format => format.trim()).filter(Boolean)

		if (allowedFormats.length > 0) {
			multerOptions.fileFilter = (req, file, cb) => {
				if (allowedFormats.includes(file.mimetype)) {
					cb(null, true)
				} else {
					cb(new BadRequestError(`Formato no permitido. Solo se acepta: ${allowedFormats.join(', ')}`), false)
				}
			}
		}

		this.uploadMiddleware = multer(multerOptions)
	}

	// Creates the destination folder on first use rather than at construction, so only a service that
	// actually mounts an upload middleware materializes the folder. No-op for the S3 strategy (no
	// local destinationPath) and idempotent.
	_ensureDestination() {
		if (this.destinationPath && !fs.existsSync(this.destinationPath)) {
			fs.mkdirSync(this.destinationPath, { recursive: true })
		}
	}

	getMiddleware() {
		this._ensureDestination()
		return this.uploadMiddleware
	}

	// Validated, ready-to-mount upload middleware: runs multer (`.any()`) and translates any rejection
	// — a file over the size cap or of a disallowed type — into a clean 400 JSON envelope. Without
	// this, multer would call next(err) and fall through to Express's default (non-JSON) error
	// handler, since easy-node services have no global error middleware (same reason auth-middleware
	// sends its own error response). Mount it AFTER the auth middleware so an unauthenticated request
	// is rejected before any file is written to disk.
	getUploadMiddleware() {
		this._ensureDestination()
		const upload = this.uploadMiddleware.any()
		const handleResponse = new HandleResponse()

		return (req, res, next) => {
			upload(req, res, error => {
				if (!error) return next()

				const badRequest = error instanceof BadRequestError ? error : new BadRequestError(error.message)
				const response = handleResponse.buildResponse(badRequest)
				res.status(response[ResponseBody.STATUS]).json(response)
			})
		}
	}

	getProvider() {
		return this.storageStrategy
	}
}

module.exports = FileManager
