const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../../support/run-app')

// Generic request/response wiring for every 'template' route (DB mocked) - this tier checks
// the envelope and routing, not exhaustive field coverage (that's tests/crud/template.test.js).
// Every route requires an authenticated user (see index.js's middlewares wiring); reading
// (list/get by id) accepts any role, writing requires admin specifically. auth-service itself
// is mocked (mock-external-api-config-preload.js), which resolves these fixed tokens deterministically.
const ADMIN_AUTH = { Authorization: 'Bearer admin-token' }
const USER_AUTH = { Authorization: 'Bearer user-token' }

const SAMPLE = {
		"name": "sample text",
		"key": "sample text",
		"description": "sample text",
		"active": true
	}

const SEED_ID = '64b0c0ffee1234567890abcf'

function seededEnv() {
	return {
		MOCK_SEED_SCHEMA: 'template',
		MOCK_SEED_ID: SEED_ID,
		MOCK_SEED_RECORD: JSON.stringify(SAMPLE)
	}
}

test('template routes — POST creates a record when the caller is admin', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/template`, SAMPLE, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.success, true)
		assert.equal(res.body.statusCode, 200)
	} finally {
		await app.stop()
	}
})

test('template routes — POST returns 401 without a token', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/template`, SAMPLE)

		assert.equal(res.status, 401)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('template routes — POST returns 403 when the caller is not admin', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/template`, SAMPLE, USER_AUTH)

		assert.equal(res.status, 403)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('template routes — GET by id returns the seeded record for any authenticated role', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/template/${SEED_ID}`, undefined, USER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('template routes — GET by id returns 401 without a token', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/template/${SEED_ID}`)

		assert.equal(res.status, 401)
	} finally {
		await app.stop()
	}
})

test('template routes — GET by id returns 400 when the record does not exist', async () => {
	const app = await runApp()

	try {
		const res = await app.request('GET', `${app.path}/template/${SEED_ID}`, undefined, USER_AUTH)

		assert.equal(res.status, 400)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('template routes — GET list returns the envelope shape for any authenticated role', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/template`, undefined, USER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.deepEqual(res.body.content.records, [{ ...SAMPLE, id: SEED_ID }])
	} finally {
		await app.stop()
	}
})

test('template routes — GET list returns 401 without a token', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/template`)

		assert.equal(res.status, 401)
	} finally {
		await app.stop()
	}
})

test('template routes — PATCH updates the seeded record when the caller is admin', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PATCH', `${app.path}/template/${SEED_ID}`, SAMPLE, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('template routes — PUT replaces the seeded record when the caller is admin', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PUT', `${app.path}/template/${SEED_ID}`, SAMPLE, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('template routes — DELETE removes the seeded record when the caller is admin', async () => {
	const app = await runApp(seededEnv())

	try {
		const del = await app.request('DELETE', `${app.path}/template/${SEED_ID}`, undefined, ADMIN_AUTH)
		assert.equal(del.status, 200)

		const after = await app.request('GET', `${app.path}/template/${SEED_ID}`, undefined, ADMIN_AUTH)
		assert.equal(after.status, 400)
	} finally {
		await app.stop()
	}
})

test('template routes — DELETE returns 403 when the caller is not admin', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('DELETE', `${app.path}/template/${SEED_ID}`, undefined, USER_AUTH)

		assert.equal(res.status, 403)
	} finally {
		await app.stop()
	}
})
