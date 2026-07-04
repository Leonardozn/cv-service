'use strict'

// Mock for @cv-service/external-api-config, used by unit tests that exercise auth-middleware
// without making a real HTTP call to auth-service. Intercepts require('@cv-service/external-api-config')
// and hands back a fake ExternalApiConfig whose createInstance() always returns the SAME shared
// axios-like instance, so a test can queue canned responses/errors before invoking the middleware
// and inspect what was called afterwards - regardless of which AuthMiddleware instance triggered it.

const Module = require('node:module')

class MockAxiosInstance {
	constructor() {
		this.reset()
	}

	reset() {
		this.queue = []
		this.calls = []
	}

	// test-only: queue a canned axios-like response ({ status, data }) or an Error to throw,
	// consumed in order (FIFO) by each post() call.
	queueResponse(response) {
		this.queue.push(response)
	}

	async post(url, body) {
		this.calls.push({ url, body })
		const next = this.queue.shift()
		if (next === undefined) throw new Error(`MockAxiosInstance: no queued response for ${url}`)
		if (next instanceof Error) throw next
		return next
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
