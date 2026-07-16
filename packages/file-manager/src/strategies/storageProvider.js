class StorageProvider {
	/**
	 * Rename and move a file to its final destination.
	 * @param {Object} file - The file object to save
	 * @param {string} newFilename - The new filename
	 * @returns {Promise<string>} - The final filename or URL
	 */
	async saveFile(file, newFilename) {
		throw new Error('Method not implemented')
	}

	/**
	 * Delete a file.
	 * @param {string} filename - The name of the file
	 * @param {string} destinationPath - The path where the file is stored
	 * @returns {Promise<void>}
	 */
	async deleteFile(filename, destinationPath) {
		throw new Error('Method not implemented')
	}

	/**
	 * Read a stored file's contents.
	 * @param {string} filename - The name of the file
	 * @param {string} destinationPath - The path where the file is stored (ignored by strategies
	 *   that don't need it, e.g. a bucket where the location is already fixed in its own config)
	 * @returns {Promise<Buffer|null>} The file's contents, or null if it doesn't exist
	 */
	async getFile(filename, destinationPath) {
		throw new Error('Method not implemented')
	}
}

module.exports = StorageProvider