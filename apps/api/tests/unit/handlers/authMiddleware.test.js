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

function timeoutError() {
	const error = new Error('timeout of 5000ms exceeded')
	error.code = 'ECONNABORTED'
	return error
}

test('requireAuth() — injects req.user and calls next() with no error on a valid token', async () => {
	axiosMock.queueResponse({ status: 200, data: { success: true, message: 'Success!', statusCode: 200, content: { user: { id: 'u1', role: 'user' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = fakeReq('good-token')
	let nextArg = 'not-called'

	await middleware(req, {}, (err) => { nextArg = err })

	assert.equal(nextArg, undefined)
	assert.deepEqual(req.user, { id: 'u1', role: 'user' })
	assert.deepEqual(axiosMock.calls, [{ url: '/auth/validate', body: { token: 'good-token' } }])
})

test('requireAuth() — rejects with UnauthorizedError when the Authorization header is missing', async () => {
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = fakeReq()
	let nextArg

	await middleware(req, {}, (err) => { nextArg = err })

	assert.equal(nextArg.name, 'UnauthorizedError')
	assert.equal(axiosMock.calls.length, 0)
})

test('requireAuth() — rejects with UnauthorizedError when the header is not a Bearer token', async () => {
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } }
	let nextArg

	await middleware(req, {}, (err) => { nextArg = err })

	assert.equal(nextArg.name, 'UnauthorizedError')
})

test('requireAuth() — rejects with UnauthorizedError when auth-service reports the token invalid (content: null)', async () => {
	axiosMock.queueResponse({ status: 401, data: { success: false, message: 'Invalid token.', statusCode: 401, content: null } })
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	let nextArg

	await middleware(fakeReq('bad-token'), {}, (err) => { nextArg = err })

	assert.equal(nextArg.name, 'UnauthorizedError')
})

test('requireAuth() — retries once on a timeout and succeeds if the retry responds', async () => {
	axiosMock.queueResponse(timeoutError())
	axiosMock.queueResponse({ status: 200, data: { content: { user: { id: 'u1', role: 'user' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	const req = fakeReq('good-token')
	let nextArg = 'not-called'

	await middleware(req, {}, (err) => { nextArg = err })

	assert.equal(nextArg, undefined)
	assert.deepEqual(req.user, { id: 'u1', role: 'user' })
	assert.equal(axiosMock.calls.length, 2)
})

test('requireAuth() — fails closed (UnauthorizedError) when the retry after a timeout also fails', async () => {
	axiosMock.queueResponse(timeoutError())
	axiosMock.queueResponse(timeoutError())
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	let nextArg

	await middleware(fakeReq('good-token'), {}, (err) => { nextArg = err })

	assert.equal(nextArg.name, 'UnauthorizedError')
	assert.equal(axiosMock.calls.length, 2)
})

test('requireAuth() — a non-timeout failure is not retried and propagates unmodified (maps to 502 upstream)', async () => {
	const connectionError = new Error('connect ECONNREFUSED')
	connectionError.isAxiosError = true
	connectionError.code = 'ECONNREFUSED'
	axiosMock.queueResponse(connectionError)
	const middleware = AuthMiddlewareHandler.getInstance().requireAuth()
	let nextArg

	await middleware(fakeReq('good-token'), {}, (err) => { nextArg = err })

	assert.equal(nextArg, connectionError)
	assert.equal(axiosMock.calls.length, 1)
})

test("requireRole('admin') — calls next() with no error when the resolved user has that role", async () => {
	axiosMock.queueResponse({ status: 200, data: { content: { user: { id: 'u1', role: 'admin' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireRole('admin')
	let nextArg = 'not-called'

	await middleware(fakeReq('good-token'), {}, (err) => { nextArg = err })

	assert.equal(nextArg, undefined)
})

test("requireRole('admin') — rejects with ForbiddenError when the resolved user has a different role", async () => {
	axiosMock.queueResponse({ status: 200, data: { content: { user: { id: 'u1', role: 'user' } } } })
	const middleware = AuthMiddlewareHandler.getInstance().requireRole('admin')
	let nextArg

	await middleware(fakeReq('good-token'), {}, (err) => { nextArg = err })

	assert.equal(nextArg.name, 'ForbiddenError')
})
