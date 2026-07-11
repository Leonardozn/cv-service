const FileManager = require('@cv-service/file-manager')

const envVars = require('./envVariables')
const HandleResponseHandler = require('./handleResponse')
const { BadRequestError } = require('./handleErrors')

class FileManagerHandler {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	fileManager

	/**
	 * @private
	 */
	constructor() {
		// Size/format limits come from env vars (code-config-env-fallbacks) with safe fallbacks: a
		// 5 MB cap and image-only formats. When a var is unset the fallback still enforces validation,
		// so an upload is never unbounded or arbitrary-typed by default.
		const settings = {}

		const maxFileSize = Number(envVars.API_UPLOAD_MAX_FILE_SIZE || 5242880)
		if (Number.isFinite(maxFileSize) && maxFileSize > 0) settings.maxFileSize = maxFileSize

		const formats = (envVars.API_UPLOAD_ALLOWED_FORMATS || 'image/jpeg,image/png,image/webp')
			.split(',').map(format => format.trim()).filter(Boolean)
		if (formats.length > 0) settings.allowedFormats = formats

		this.fileManager = new FileManager(settings, 'api')
	}

	static getInstance() {
		if (!this.instance) this.instance = new FileManagerHandler()
		return this.instance
	}

	getMiddleware() {
		return this.fileManager.getMiddleware()
	}

	// Upload middleware ready to mount: runs multer (.any()) and translates its rejections — a file
	// over the size cap or of a disallowed type — into a clean 400 JSON envelope. Without this,
	// multer would call next(err) and fall through to Express's default (non-JSON) error handler,
	// since this project has no global error middleware (see auth-middleware). Mount it AFTER
	// requireAuth so an unauthenticated request is rejected before any file is written to disk.
	getUploadMiddleware() {
		const upload = this.fileManager.getMiddleware().any()
		const handleResponse = HandleResponseHandler.getInstance()
		const responseBody = handleResponse.getResponseBody()

		return (req, res, next) => {
			upload(req, res, error => {
				if (!error) return next()

				const response = handleResponse.buildResponse(new BadRequestError(error.message))
				res.status(response[responseBody.STATUS]).json(response)
			})
		}
	}

	getProvider() {
		return this.fileManager.getProvider()
	}
}

module.exports = FileManagerHandler
