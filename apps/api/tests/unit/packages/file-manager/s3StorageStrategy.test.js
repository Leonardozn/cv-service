const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { S3Client } = require('@aws-sdk/client-s3')
const S3StorageStrategy = require('../../../../../../packages/file-manager/src/strategies/s3StorageStrategy')

const CONFIG = {
	bucket: 'test-bucket',
	endpoint: 'https://s3.example.test',
	region: 'auto',
	accessKeyId: 'test-access-key',
	secretAccessKey: 'test-secret-key'
}

let originalSend
let calls

beforeEach(() => {
	calls = []
	originalSend = S3Client.prototype.send
})

afterEach(() => {
	S3Client.prototype.send = originalSend
})

function mockSend(handler) {
	S3Client.prototype.send = async function (command) {
		calls.push(command)
		return handler(command)
	}
}

test('S3StorageStrategy.saveFile() — uploads the in-memory buffer and returns the key', async () => {
	mockSend(() => ({}))
	const strategy = new S3StorageStrategy(CONFIG)
	const file = { buffer: Buffer.from('fake image bytes'), mimetype: 'image/png' }

	const result = await strategy.saveFile(file, 'photo.png')

	assert.equal(result, 'photo.png')
	assert.equal(calls.length, 1)
	assert.equal(calls[0].constructor.name, 'PutObjectCommand')
	assert.equal(calls[0].input.Bucket, 'test-bucket')
	assert.equal(calls[0].input.Key, 'photo.png')
	assert.equal(calls[0].input.Body, file.buffer)
	assert.equal(calls[0].input.ContentType, 'image/png')
})

test('S3StorageStrategy.saveFile() — prefixes the key with subdir when given', async () => {
	mockSend(() => ({}))
	const strategy = new S3StorageStrategy(CONFIG)
	const file = { buffer: Buffer.from('x'), mimetype: 'image/png' }

	const result = await strategy.saveFile(file, 'photo.png', 'curriculum-photos')

	assert.equal(result, 'curriculum-photos/photo.png')
	assert.equal(calls[0].input.Key, 'curriculum-photos/photo.png')
})

test('S3StorageStrategy.deleteFile() — deletes by key, ignoring a missing/irrelevant filename', async () => {
	mockSend(() => ({}))
	const strategy = new S3StorageStrategy(CONFIG)

	await strategy.deleteFile('photo.png')

	assert.equal(calls.length, 1)
	assert.equal(calls[0].constructor.name, 'DeleteObjectCommand')
	assert.equal(calls[0].input.Bucket, 'test-bucket')
	assert.equal(calls[0].input.Key, 'photo.png')
})

test('S3StorageStrategy.deleteFile() — no-ops without hitting the client when filename is falsy', async () => {
	mockSend(() => ({}))
	const strategy = new S3StorageStrategy(CONFIG)

	await strategy.deleteFile(undefined)

	assert.equal(calls.length, 0)
})

test('S3StorageStrategy.getFile() — returns the object body as a Buffer', async () => {
	const { Readable } = require('node:stream')
	mockSend(() => ({ Body: Readable.from([Buffer.from('hello '), Buffer.from('world')]) }))
	const strategy = new S3StorageStrategy(CONFIG)

	const result = await strategy.getFile('photo.png')

	assert.ok(Buffer.isBuffer(result))
	assert.equal(result.toString(), 'hello world')
	assert.equal(calls[0].constructor.name, 'GetObjectCommand')
	assert.equal(calls[0].input.Key, 'photo.png')
})

test('S3StorageStrategy.getFile() — returns null when the object does not exist', async () => {
	mockSend(() => {
		const error = new Error('The specified key does not exist.')
		error.name = 'NoSuchKey'
		throw error
	})
	const strategy = new S3StorageStrategy(CONFIG)

	const result = await strategy.getFile('missing.png')

	assert.equal(result, null)
})

test('S3StorageStrategy.getFile() — returns null without hitting the client when filename is falsy', async () => {
	mockSend(() => ({}))
	const strategy = new S3StorageStrategy(CONFIG)

	const result = await strategy.getFile(undefined)

	assert.equal(result, null)
	assert.equal(calls.length, 0)
})

test('S3StorageStrategy.getFile() — rethrows an unexpected error', async () => {
	mockSend(() => {
		throw new Error('Network error')
	})
	const strategy = new S3StorageStrategy(CONFIG)

	await assert.rejects(() => strategy.getFile('photo.png'), /Network error/)
})
