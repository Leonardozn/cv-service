const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../../support/run-app')

// Generic request/response wiring for every 'certificate' route (DB mocked) - this tier checks
// the envelope and routing, not exhaustive field coverage (that's tests/crud/certificate.test.js).
// Every route now requires an authenticated user and confirms the entry's parent Curriculum
// belongs to the caller (auth-service itself is mocked - see
// mock-external-api-config-preload.js's fixed-token fallback). 'user-token' resolves to the
// 'fixture-user' id, matching the seeded parent Curriculum's owner, so the ownership check
// passes for it; 'other-user-token' is a genuinely different non-admin user (404, never 403 -
// existence of someone else's record is never revealed); 'admin-token' may act on any entry
// regardless of owner (FR admin override).
const OWNER_AUTH = { Authorization: 'Bearer user-token' }
const OTHER_USER_AUTH = { Authorization: 'Bearer other-user-token' }
const ADMIN_AUTH = { Authorization: 'Bearer admin-token' }

const CURRICULUM_ID = '64b0c0ffee1234567890abcd'
const SAMPLE = {
		"curriculum": CURRICULUM_ID,
		"name": "sample text",
		"date": "2024-01-01"
	}

const SEED_ID = '64b0c0ffee1234567890abcf'

function seededCurriculumEnv() {
	return {
		MOCK_SEED_EXTRA: JSON.stringify([{ schema: 'curriculum', id: CURRICULUM_ID, record: { user: 'fixture-user', fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.' } }])
	}
}

function seededEnv() {
	return {
		MOCK_SEED_SCHEMA: 'certificate',
		MOCK_SEED_ID: SEED_ID,
		MOCK_SEED_RECORD: JSON.stringify(SAMPLE),
		...seededCurriculumEnv()
	}
}

test('certificate routes — POST creates a record', async () => {
	const app = await runApp(seededCurriculumEnv())

	try {
		const res = await app.request('POST', `${app.path}/certificate`, SAMPLE, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.success, true)
		assert.equal(res.body.statusCode, 200)
	} finally {
		await app.stop()
	}
})

test('certificate routes — POST returns 401 without a token', async () => {
	const app = await runApp(seededCurriculumEnv())

	try {
		const res = await app.request('POST', `${app.path}/certificate`, SAMPLE)

		assert.equal(res.status, 401)
	} finally {
		await app.stop()
	}
})

test('certificate routes — POST returns 404 when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededCurriculumEnv())

	try {
		const res = await app.request('POST', `${app.path}/certificate`, SAMPLE, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.message, 'Curriculum not found.')
	} finally {
		await app.stop()
	}
})

test('certificate routes — GET by id returns the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/certificate/${SEED_ID}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('certificate routes — GET by id returns 404 when the record does not exist', async () => {
	const app = await runApp()

	try {
		const res = await app.request('GET', `${app.path}/certificate/${SEED_ID}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('certificate routes — GET by id returns 404 when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/certificate/${SEED_ID}`, undefined, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
	} finally {
		await app.stop()
	}
})

test('certificate routes — GET by id lets an admin read an entry owned by someone else (FR admin override)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/certificate/${SEED_ID}`, undefined, ADMIN_AUTH)

		assert.equal(res.status, 200)
	} finally {
		await app.stop()
	}
})

test('certificate routes — GET list returns the envelope shape', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/certificate`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.deepEqual(res.body.content.records, [{ ...SAMPLE, id: SEED_ID }])
	} finally {
		await app.stop()
	}
})

test('certificate routes — PATCH updates the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PATCH', `${app.path}/certificate/${SEED_ID}`, SAMPLE, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('certificate routes — PATCH returns 404 when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PATCH', `${app.path}/certificate/${SEED_ID}`, SAMPLE, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
	} finally {
		await app.stop()
	}
})

test('certificate routes — PUT replaces the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PUT', `${app.path}/certificate/${SEED_ID}`, SAMPLE, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('certificate routes — DELETE removes the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const del = await app.request('DELETE', `${app.path}/certificate/${SEED_ID}`, undefined, OWNER_AUTH)
		assert.equal(del.status, 200)

		const after = await app.request('GET', `${app.path}/certificate/${SEED_ID}`, undefined, OWNER_AUTH)
		assert.equal(after.status, 404)
	} finally {
		await app.stop()
	}
})

test('certificate routes — DELETE returns 404 when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('DELETE', `${app.path}/certificate/${SEED_ID}`, undefined, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
	} finally {
		await app.stop()
	}
})
