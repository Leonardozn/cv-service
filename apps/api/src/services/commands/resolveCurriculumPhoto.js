const fs = require('fs/promises')
const path = require('path')
const envVariables = require('../../handlers/envVariables')

class ResolveCurriculumPhoto {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new ResolveCurriculumPhoto()
		return this.instance
	}

	// Reads the stored photo file into a Buffer for the PDF renderer to embed directly - passing
	// a raw OS filesystem path as the Image `src` breaks on Windows, where react-pdf's URL parser
	// misreads the "C:" drive letter as a URL protocol, treats the path as a remote URL instead of
	// a local file, and silently drops the image when that fetch fails.
	async execute({ photo }) {
		if (!photo) return undefined

		const destinationPath = envVariables.API_UPLOAD_PATH || path.join(process.cwd(), 'api-uploads')
		try {
			return await fs.readFile(path.join(destinationPath, photo))
		} catch {
			return undefined
		}
	}
}

module.exports = ResolveCurriculumPhoto
