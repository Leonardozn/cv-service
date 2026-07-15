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
	 * @param { Object } [settings] - Forwarded to FileManager. `settings.uploadPath` (absolute) is
	 *   the destination folder, computed once in index.js so writes and static serving share it.
	 */
	constructor(settings = {}) {
		this.fileManager = new FileManager(settings, 'api')
	}

	static getInstance(settings = {}) {
		if (!this.instance) this.instance = new FileManagerHandler(settings)
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
