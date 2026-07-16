const fs = require('fs')
const path = require('path')
const StorageProvider = require('./storageProvider')

class LocalStorageStrategy extends StorageProvider {
	async saveFile(file, newFilename, subdir = '') {
		const targetDir = subdir ? path.join(file.destination, subdir) : file.destination

		if (subdir && !fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true })
		}

		const oldPath = file.path
		const newPath = path.join(targetDir, newFilename)

		fs.copyFileSync(oldPath, newPath)
		fs.unlinkSync(oldPath)

		return subdir ? `${subdir}/${newFilename}` : newFilename
	}

	async deleteFile(filename, destinationPath) {
		if (!filename) return
		const oldFilePath = path.join(destinationPath, filename)
		if (fs.existsSync(oldFilePath)) {
			fs.unlinkSync(oldFilePath)
		}
	}

	async getFile(filename, destinationPath) {
		if (!filename) return null
		const filePath = path.join(destinationPath, filename)
		if (!fs.existsSync(filePath)) return null
		return fs.readFileSync(filePath)
	}
}

module.exports = LocalStorageStrategy