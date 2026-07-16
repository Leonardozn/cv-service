const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const StorageProvider = require('./storageProvider')

// Reads a GetObjectCommand's Body (a Node Readable in this SDK's Node runtime) into a single
// Buffer - the same shape callers already get back from LocalStorageStrategy.getFile().
async function streamToBuffer(stream) {
	const chunks = []
	for await (const chunk of stream) chunks.push(chunk)
	return Buffer.concat(chunks)
}

class S3StorageStrategy extends StorageProvider {
	/**
	 * @param {Object} config
	 * @param {string} config.bucket - Bucket name.
	 * @param {string} config.endpoint - S3-compatible endpoint URL.
	 * @param {string} config.region - Region (Railway's bucket uses "auto").
	 * @param {string} config.accessKeyId
	 * @param {string} config.secretAccessKey
	 */
	constructor({ bucket, endpoint, region, accessKeyId, secretAccessKey }) {
		super()
		this.bucket = bucket
		this.client = new S3Client({
			endpoint,
			region,
			credentials: { accessKeyId, secretAccessKey },
			// Railway's bucket (and most non-AWS S3-compatible providers) expects path-style
			// requests (https://<endpoint>/<bucket>/<key>) - virtual-hosted style is AWS-specific.
			forcePathStyle: true
		})
	}

	// `file` here is a multer in-memory file (memoryStorage - see fileManager.js's isS3 branch),
	// so the bytes are already in `file.buffer`; nothing to read off disk first.
	async saveFile(file, newFilename, subdir = '') {
		const key = subdir ? `${subdir}/${newFilename}` : newFilename

		await this.client.send(new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Body: file.buffer,
			ContentType: file.mimetype
		}))

		return key
	}

	// destinationPath is part of the shared StorageProvider signature but unused here - the
	// bucket is already fixed in this strategy's own config, unlike a local base directory.
	async deleteFile(filename) {
		if (!filename) return
		await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }))
	}

	async getFile(filename) {
		if (!filename) return null

		try {
			const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: filename }))
			return await streamToBuffer(result.Body)
		} catch (error) {
			if (error.name === 'NoSuchKey') return null
			throw error
		}
	}
}

module.exports = S3StorageStrategy
