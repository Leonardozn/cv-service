'use strict'

// Storage-provider mock for unit tests that exercise a model's generated file-upload branch
// (see data-file-fields) without touching the real filesystem. Intercepts
// require('../handlers/fileManager') and hands back a fake FileManagerHandler whose
// storageProvider.saveFile/deleteFile are in-memory stubs - mirrors the require-interception
// approach of mock-repository-preload.js, applied to file-manager instead of the repository.

const Module = require('node:module')

class MockStorageProvider {
	constructor() {
		this.saved = []
		this.deleted = []
	}

	async saveFile(file, newFilename) {
		this.saved.push({ file, newFilename })
		return newFilename
	}

	async deleteFile(filename, destinationPath) {
		this.deleted.push({ filename, destinationPath })
	}

	async getFile(filename) {
		return this.files?.[filename] || null
	}
}

class MockFileManagerHandler {
	static instance

	constructor() {
		this.storageProvider = new MockStorageProvider()
	}

	static getInstance() {
		if (!this.instance) this.instance = new MockFileManagerHandler()
		return this.instance
	}

	// test-only escape hatch: clears saved/deleted history between test() blocks. Mutates the
	// same storageProvider instance in place (rather than replacing it) because a service built
	// earlier in the file already cached that exact object via getProvider() in its constructor -
	// swapping in a new instance would leave that cached reference pointing at stale data.
	static reset() {
		if (this.instance) {
			this.instance.storageProvider.saved = []
			this.instance.storageProvider.deleted = []
		}
	}

	getProvider() {
		return this.storageProvider
	}
}

// Matched by request string, not resolved path - services/*.js requires '../handlers/fileManager',
// while services/commands/*.js (one directory deeper, e.g. resolveCurriculumPhoto.js) requires
// '../../handlers/fileManager'. Both must resolve to the same mock instance.
const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
	if (request === '../handlers/fileManager' || request === '../../handlers/fileManager') return MockFileManagerHandler
	return originalLoad.apply(this, arguments)
}

module.exports = MockFileManagerHandler
