'use strict'

// Mock for the raw Mongo connection handler, used only by processes that need a real
// transaction session (see data-transactions-multi-write). apps/api/src/handlers/dbConnections.js
// requires '@cv-service/db-connections' directly, which connects to a real MongoDB as a side
// effect of being required - a plain `require('../repositories')` interception
// (mock-repository-preload.js) never reaches that path, so any service that opens its own
// session needs this second interception too. The fake session isn't a real transaction (the
// in-memory mock repository doesn't model isolation/rollback) - it just runs the callback and
// resolves, so the exact same session-based code path executes safely under test.

const Module = require('node:module')

class MockSession {
	async withTransaction(fn) {
		return await fn()
	}

	async endSession() {}
}

class MockDbConnectionHandler {
	static instance

	static getInstance() {
		if (!this.instance) this.instance = new MockDbConnectionHandler()
		return this.instance
	}

	getConnection() {
		return {
			cvMongodb: {
				startSession: async () => new MockSession()
			}
		}
	}
}

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
	if (request === '../handlers/dbConnections') return MockDbConnectionHandler
	return originalLoad.apply(this, arguments)
}

module.exports = MockDbConnectionHandler
