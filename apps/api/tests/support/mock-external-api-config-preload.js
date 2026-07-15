'use strict'

// Mock for @cv-service/external-api-config, used wherever the app boots with auth-middleware in
// the request path, so no real HTTP call to auth-service ever happens. Intercepts
// require('@cv-service/external-api-config') and hands back a fake ExternalApiConfig whose
// createInstance() always returns the SAME shared axios-like instance.
//
// Two consumption modes:
//  - In-process unit tests (tests/unit/handlers/authMiddleware.test.js) hold a direct reference
//    to `sharedAxiosInstance` and queueResponse() the exact canned response/error per assertion.
//  - Subprocess e2e/crud tests (booted via run-app.js) run in a separate process, so they can't
//    reach into this module's queue - for those, POST /auth/validate falls back to a fixed,
//    deterministic rule keyed off the bearer token string itself (see FIXED_USERS_BY_TOKEN),
//    so a test only needs to choose which fake token to send.
const Module = require('node:module')

// Mirrors auth-service's real user contract, which exposes only `_id` (never `id`) - see
// auth-middleware's _normalizeUser(), which derives req.user.id from this at the boundary.
const FIXED_USERS_BY_TOKEN = {
	'admin-token': { _id: 'fixture-admin', role: 'admin' },
	'user-token': { _id: 'fixture-user', role: 'user' },
	'other-user-token': { _id: 'fixture-other-user', role: 'user' },
	'third-user-token': { _id: 'fixture-third-user', role: 'user' }
}

class MockAxiosInstance {
	constructor() {
		this.reset()
	}

	reset() {
		this.queue = []
		this.calls = []
	}

	// test-only: queue a canned axios-like response ({ status, data }) or an Error to throw,
	// consumed in order (FIFO) by each post() call - takes priority over the fixed-token fallback.
	queueResponse(response) {
		this.queue.push(response)
	}

	async post(url, body) {
		this.calls.push({ url, body })

		if (this.queue.length > 0) {
			const next = this.queue.shift()
			if (next instanceof Error) throw next
			return next
		}

		if (url === '/auth/validate') return this._fallbackAuthValidate(body.token)
		throw new Error(`MockAxiosInstance: no queued response for ${url}`)
	}

	/**
	 * @private
	 */
	_fallbackAuthValidate(token) {
		const user = FIXED_USERS_BY_TOKEN[token]
		if (user) return { status: 200, data: { success: true, message: 'Success!', statusCode: 200, content: { user } } }
		return { status: 401, data: { success: false, message: 'Invalid token.', statusCode: 401, content: null } }
	}
}

const sharedAxiosInstance = new MockAxiosInstance()

class MockExternalApiConfig {
	createInstance() {
		return sharedAxiosInstance
	}
}

MockExternalApiConfig.sharedAxiosInstance = sharedAxiosInstance

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
	if (request === '@cv-service/external-api-config') return MockExternalApiConfig
	return originalLoad.apply(this, arguments)
}

module.exports = MockExternalApiConfig
