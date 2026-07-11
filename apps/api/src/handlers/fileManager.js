const FileManager = require('@cv-service/file-manager')

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
		this.fileManager = new FileManager({}, 'api')
	}

	static getInstance() {
		if (!this.instance) this.instance = new FileManagerHandler()
		return this.instance
	}

	getMiddleware() {
		return this.fileManager.getMiddleware()
	}

	// Validated upload middleware (size cap + mimetype restriction, 400 on violation), owned by the
	// file-manager package. Mount it AFTER requireAuth so an unauthenticated request is rejected
	// before any file is written to disk.
	getUploadMiddleware() {
		return this.fileManager.getUploadMiddleware()
	}

	getProvider() {
		return this.fileManager.getProvider()
	}
}

module.exports = FileManagerHandler
