const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../../support/run-app')

// Generic request/response wiring for every 'curriculum' route (DB mocked) - this tier checks
// the envelope and routing, not exhaustive field coverage (that's tests/crud/curriculum.test.js).
// Every route now requires an authenticated user (auth-service itself is mocked - see
// mock-external-api-config-preload.js's fixed-token fallback); 'user-token' resolves to the
// 'fixture-user' id, matching SAMPLE.user below, so the ownership check passes for it.
// 'other-user-token' resolves to a genuinely different non-admin user, used to prove the 404
// ownership check (never 403 - existence of someone else's record is never revealed); 'admin-token'
// resolves to an admin, who may act on any Curriculum regardless of owner (FR admin override).
const OWNER_AUTH = { Authorization: 'Bearer user-token' }
const OTHER_USER_AUTH = { Authorization: 'Bearer other-user-token' }
const ADMIN_AUTH = { Authorization: 'Bearer admin-token' }

const SAMPLE = {
		"user": "fixture-user",
		"fullName": "sample text",
		"headline": ["sample text"],
		"city": "sample text",
		"photo": "sample text",
		"profileSummary": "sample text",
		"skills": [
			"sample text"
		],
		"contactLinks": [
			{
				"label": "sample text",
				"url": "sample text"
			}
		]
	}

const SEED_ID = '64b0c0ffee1234567890abcf'

function seededEnv() {
	return {
		MOCK_SEED_SCHEMA: 'curriculum',
		MOCK_SEED_ID: SEED_ID,
		MOCK_SEED_RECORD: JSON.stringify(SAMPLE)
	}
}

test('curriculum routes — POST creates a record', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/curriculum`, SAMPLE, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.success, true)
		assert.equal(res.body.statusCode, 200)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST returns 401 without a token', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/curriculum`, SAMPLE)

		assert.equal(res.status, 401)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET by id returns the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/curriculum/${SEED_ID}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET by id returns 401 without a token', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/curriculum/${SEED_ID}`)

		assert.equal(res.status, 401)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET by id returns 404 when the record does not exist', async () => {
	const app = await runApp()

	try {
		const res = await app.request('GET', `${app.path}/curriculum/${SEED_ID}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET by id returns 404 when the Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/curriculum/${SEED_ID}`, undefined, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.message, 'Curriculum not found.')
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET by id lets an admin read a Curriculum owned by someone else (FR admin override)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/curriculum/${SEED_ID}`, undefined, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET list returns the envelope shape', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/curriculum`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.deepEqual(res.body.content.records, [{ ...SAMPLE, id: SEED_ID }])
	} finally {
		await app.stop()
	}
})

test('curriculum routes — GET list only returns the caller\'s own Curriculum for a non-admin user', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('GET', `${app.path}/curriculum`, undefined, OTHER_USER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 0)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — PATCH updates the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PATCH', `${app.path}/curriculum/${SEED_ID}`, SAMPLE, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('curriculum routes — PATCH returns 404 when the Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PATCH', `${app.path}/curriculum/${SEED_ID}`, SAMPLE, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.message, 'Curriculum not found.')
	} finally {
		await app.stop()
	}
})

test('curriculum routes — PATCH lets an admin update a Curriculum owned by someone else (FR admin override)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PATCH', `${app.path}/curriculum/${SEED_ID}`, { ...SAMPLE, headline: ['Updated by admin'] }, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content.headline, ['Updated by admin'])
	} finally {
		await app.stop()
	}
})

test('curriculum routes — PUT replaces the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PUT', `${app.path}/curriculum/${SEED_ID}`, SAMPLE, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.deepEqual(res.body.content, { ...SAMPLE, id: SEED_ID })
	} finally {
		await app.stop()
	}
})

test('curriculum routes — PUT returns 404 when the Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('PUT', `${app.path}/curriculum/${SEED_ID}`, SAMPLE, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — DELETE removes the seeded record', async () => {
	const app = await runApp(seededEnv())

	try {
		const del = await app.request('DELETE', `${app.path}/curriculum/${SEED_ID}`, undefined, OWNER_AUTH)
		assert.equal(del.status, 200)

		const after = await app.request('GET', `${app.path}/curriculum/${SEED_ID}`, undefined, OWNER_AUTH)
		assert.equal(after.status, 404)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — DELETE returns 404 when the Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('DELETE', `${app.path}/curriculum/${SEED_ID}`, undefined, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — DELETE lets an admin remove a Curriculum owned by someone else (FR admin override)', async () => {
	const app = await runApp(seededEnv())

	try {
		const del = await app.request('DELETE', `${app.path}/curriculum/${SEED_ID}`, undefined, ADMIN_AUTH)

		assert.equal(del.status, 200)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST :id/generate-pdf returns 401 without a token', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/curriculum/${SEED_ID}/generate-pdf`)

		assert.equal(res.status, 401)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST :id/generate-pdf returns 404 when the Curriculum does not exist', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/curriculum/${SEED_ID}/generate-pdf`, undefined, OWNER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.success, false)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST :id/generate-pdf returns 404 when the Curriculum belongs to a different user (FR ownership)', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('POST', `${app.path}/curriculum/${SEED_ID}/generate-pdf`, undefined, OTHER_USER_AUTH)

		assert.equal(res.status, 404)
		assert.equal(res.body.message, 'Curriculum not found.')
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST :id/generate-pdf returns 400 when no Template is active', async () => {
	const app = await runApp(seededEnv())

	try {
		const res = await app.request('POST', `${app.path}/curriculum/${SEED_ID}/generate-pdf`, undefined, OWNER_AUTH)

		assert.equal(res.status, 400)
		assert.equal(res.body.message, 'No active Template is configured.')
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST :id/generate-pdf renders a real PDF binary using the active default Template', async () => {
	const app = await runApp(seededEnv())

	try {
		await app.request('POST', `${app.path}/template`, { name: 'Classic two columns', key: 'classic-two-columns', description: 'Two-column layout', active: true }, { Authorization: 'Bearer admin-token' })

		const res = await fetch(`${app.baseUrl}${app.path}/curriculum/${SEED_ID}/generate-pdf`, { method: 'POST', headers: OWNER_AUTH })
		const buffer = Buffer.from(await res.arrayBuffer())

		assert.equal(res.status, 200)
		assert.equal(res.headers.get('content-type'), 'application/pdf')
		assert.equal(res.headers.get('content-disposition'), 'attachment; filename="curriculum.pdf"')
		assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST :id/generate-pdf lets an admin render a PDF for a Curriculum owned by someone else (FR admin override)', async () => {
	const app = await runApp(seededEnv())

	try {
		await app.request('POST', `${app.path}/template`, { name: 'Classic two columns', key: 'classic-two-columns', description: 'Two-column layout', active: true }, { Authorization: 'Bearer admin-token' })

		const res = await fetch(`${app.baseUrl}${app.path}/curriculum/${SEED_ID}/generate-pdf`, { method: 'POST', headers: ADMIN_AUTH })
		const buffer = Buffer.from(await res.arrayBuffer())

		assert.equal(res.status, 200)
		assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST /curriculum twice with the same user updates it instead of creating a second one (FR save)', async () => {
	const app = await runApp()

	try {
		const first = await app.request('POST', `${app.path}/curriculum`, SAMPLE, OWNER_AUTH)
		const second = await app.request('POST', `${app.path}/curriculum`, { ...SAMPLE, headline: ['Updated headline'] }, OWNER_AUTH)

		assert.equal(second.body.content.id, first.body.content.id)
		assert.deepEqual(second.body.content.headline, ['Updated headline'])

		const list = await app.request('GET', `${app.path}/curriculum`, undefined, OWNER_AUTH)
		assert.equal(list.body.content.count, 1)
	} finally {
		await app.stop()
	}
})

test('curriculum routes — POST /curriculum registers any new skill in the Skill catalog (FR save)', async () => {
	const app = await runApp()

	try {
		await app.request('POST', `${app.path}/curriculum`, { ...SAMPLE, skills: ['Node.js', 'MongoDB'] }, OWNER_AUTH)

		const skills = await app.request('GET', `${app.path}/skill`, undefined, OWNER_AUTH)
		assert.equal(skills.body.content.count, 2)
		assert.deepEqual(skills.body.content.records.map(skill => skill.name).sort(), ['MongoDB', 'Node.js'])
		assert.ok(skills.body.content.records.every(skill => skill.active === true))
	} finally {
		await app.stop()
	}
})
