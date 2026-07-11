const multer = require('multer')
const envVariables = require('@cv-service/env-variables')
const { BadRequestError } = require('@cv-service/handle-errors')
const { HandleResponse, ResponseBody } = require('@cv-service/handle-response')
const path = require('path')
const fs = require('fs')

const LocalStorageStrategy = require('./strategies/localStorageStrategy')

const DEFAULT_MAX_FILE_SIZE = 5242880 // 5 MB
const DEFAULT_ALLOWED_FORMATS = 'image/jpeg,image/png,image/webp'

class FileManager {
	/**
	 * @private
	 */
	uploadMiddleware

	/**
	 * @private
	 */
	storageStrategy

	constructor(settings = {}, appName) {
		if (!appName) throw new Error('App name is required to initialize FileManager')

		const envPrefix = appName.toUpperCase().replaceAll('-', '_')

		const isS3 = envVariables[`${envPrefix}_UPLOAD_PATH`] && envVariables[`${envPrefix}_UPLOAD_PATH`].startsWith('s3://')

		let storage

		if (isS3) {
			// FIXME: Implementation of S3 strategy will go here
			throw new Error('S3 Storage Strategy not implemented yet')
		} else {
			const destinationPath = envVariables[`${envPrefix}_UPLOAD_PATH`] || path.join(process.cwd(), `${appName.toLowerCase()}-uploads`)

			if (!fs.existsSync(destinationPath)) {
				fs.mkdirSync(destinationPath, { recursive: true })
			}

			storage = multer.diskStorage({
				destination: function (req, file, cb) {
					cb(null, destinationPath)
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

	getMiddleware() {
		return this.uploadMiddleware
	}

	// Validated, ready-to-mount upload middleware: runs multer (`.any()`) and translates any rejection
	// — a file over the size cap or of a disallowed type — into a clean 400 JSON envelope. Without
	// this, multer would call next(err) and fall through to Express's default (non-JSON) error
	// handler, since easy-node services have no global error middleware (same reason auth-middleware
	// sends its own error response). Mount it AFTER the auth middleware so an unauthenticated request
	// is rejected before any file is written to disk.
	getUploadMiddleware() {
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
