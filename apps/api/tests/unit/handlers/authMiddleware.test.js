const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockExternalApiConfig = require('../../support/mock-external-api-config-preload')
const AuthMiddlewareHandler = require('../../../src/handlers/authMiddleware')

const axiosMock = MockExternalApiConfig.sharedAxiosInstance

beforeEach(() => {
	axiosMock.reset()
})

function fakeReq(token) {
	return { headers: token ? { authorization: `Bearer ${token}` } : {} }
}

// No global Express error-handling middleware exists in this project - a middleware that fails
// must build and send its own JSON error envelope (like a controller's own try/catch does),
// rather than call next(error). This fake res captures exactly that response.
function fakeRes() {
	const res = {
		statusCode: undefined,
		body: undefined,
		status(code) { res.statusCode = code; return res },
		json(body) { res.body = body; return res }
	}
	return res
}

function timeoutError() {
	const error = new Error('timeout of 5000ms exceeded')
	error.code = 'ECONNABORTED'
	return error
}

test('requireAuth() — injects req.user and calls next() with no error on a valid token', async () => {
	axiosMock.queueResponse({ status: 200, data: { success: true, message: 'Success!', statusCode: 200, content: { user: { id: 'u1', role: 'user' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = fakeReq('good-token')
	const res = fakeRes()
	let nextCalled = false

	await middleware(req, res, () => { nextCalled = true })

	assert.equal(nextCalled, true)
	assert.equal(res.statusCode, undefined)
	assert.deepEqual(req.user, { id: 'u1', role: 'user' })
	assert.deepEqual(axiosMock.calls, [{ url: '/auth/validate', body: { token: 'good-token' } }])
})

test('requireAuth() — responds 401 when the Authorization header is missing', async () => {
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = fakeReq()
	const res = fakeRes()
	let nextCalled = false

	await middleware(req, res, () => { nextCalled = true })

	assert.equal(nextCalled, false)
	assert.equal(res.statusCode, 401)
	assert.equal(res.body.success, false)
	assert.equal(axiosMock.calls.length, 0)
})

test('requireAuth() — responds 401 when the header is not a Bearer token', async () => {
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } }
	const res = fakeRes()

	await middleware(req, res, () => {})

	assert.equal(res.statusCode, 401)
})

test('requireAuth() — responds 401 when auth-service reports the token invalid (content: null)', async () => {
	axiosMock.queueResponse({ status: 401, data: { success: false, message: 'Invalid token.', statusCode: 401, content: null } })
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const res = fakeRes()

	await middleware(fakeReq('bad-token'), res, () => {})

	assert.equal(res.statusCode, 401)
})

test('requireAuth() — retries once on a timeout and succeeds if the retry responds', async () => {
	axiosMock.queueResponse(timeoutError())
	axiosMock.queueResponse({ status: 200, data: { content: { user: { id: 'u1', role: 'user' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = fakeReq('good-token')
	const res = fakeRes()
	let nextCalled = false

	await middleware(req, res, () => { nextCalled = true })

	assert.equal(nextCalled, true)
	assert.equal(res.statusCode, undefined)
	assert.deepEqual(req.user, { id: 'u1', role: 'user' })
	assert.equal(axiosMock.calls.length, 2)
})

test('requireAuth() — fails closed (401) when the retry after a timeout also fails', async () => {
	axiosMock.queueResponse(timeoutError())
	axiosMock.queueResponse(timeoutError())
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const res = fakeRes()

	await middleware(fakeReq('good-token'), res, () => {})

	assert.equal(res.statusCode, 401)
	assert.equal(axiosMock.calls.length, 2)
})

test('requireAuth() — a non-timeout failure is not retried and maps to 502 (unhandled Axios error)', async () => {
	const connectionError = new Error('connect ECONNREFUSED')
	connectionError.isAxiosError = true
	connectionError.code = 'ECONNREFUSED'
	axiosMock.queueResponse(connectionError)
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const res = fakeRes()

	await middleware(fakeReq('good-token'), res, () => {})

	assert.equal(res.statusCode, 502)
	assert.equal(axiosMock.calls.length, 1)
})

test("requireRole('admin') — calls next() with no error when the resolved user has that role", async () => {
	axiosMock.queueResponse({ status: 200, data: { content: { user: { id: 'u1', role: 'admin' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireRole('admin')
	const res = fakeRes()
	let nextCalled = false

	await middleware(fakeReq('good-token'), res, () => { nextCalled = true })

	assert.equal(nextCalled, true)
	assert.equal(res.statusCode, undefined)
})

test("requireRole('admin') — responds 403 when the resolved user has a different role", async () => {
	axiosMock.queueResponse({ status: 200, data: { content: { user: { id: 'u1', role: 'user' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireRole('admin')
	const res = fakeRes()

	await middleware(fakeReq('good-token'), res, () => {})

	assert.equal(res.statusCode, 403)
})
