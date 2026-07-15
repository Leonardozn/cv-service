const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'certificate' (DB mocked, L4-style) -
// records are created through the real POST endpoint, which now requires an authenticated user
// and confirms the referenced parent Curriculum belongs to the caller (auth-service itself is
// mocked - see mock-external-api-config-preload.js's fixed-token fallback). A real Curriculum is
// created first so the ownership check has something legitimate to find. The contract exposes
// the record as 'id' (not Mongo's own '_id'), but list/filter/sort assertions below identify
// records by a known field value rather than the generated id.
const OWNER_AUTH = { Authorization: 'Bearer user-token' }

function records(curriculumId) {
	return [
		{ curriculum: curriculumId, name: 'item-1', date: '2024-01-01' },
		{ curriculum: curriculumId, name: 'item-2', date: '2024-01-01' },
		{ curriculum: curriculumId, name: 'item-3', date: '2024-01-01' }
	]
}

async function createOwnCurriculum(app) {
	const res = await app.request('POST', `${app.path}/curriculum`, { fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }, OWNER_AUTH)
	return res.body.content.id
}

test('certificate create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		const res = await app.request('POST', `${app.path}/certificate`, RECORDS[0], OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.match(res.body.content.id, /^[0-9a-f]{24}$/)
		assert.deepEqual(res.body, {
			success: true,
			message: 'Success!',
			statusCode: 200,
			content: { ...RECORDS[0], id: res.body.content.id }
		})
	} finally {
		await app.stop()
	}
})

test('certificate list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/certificate`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/certificate`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('certificate list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/certificate`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/certificate?size=2&page=1`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
		assert.equal(res.body.content.records.length, 2)
	} finally {
		await app.stop()
	}
})

test('certificate list — equality filter on name (FR-G8)', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/certificate`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/certificate?query[name]=${RECORDS[1].name}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].name, RECORDS[1].name)
	} finally {
		await app.stop()
	}
})

test('certificate list — sort by name (FR-G8)', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/certificate`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/certificate?sort[name]=-1`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.name)
		assert.deepEqual(values, [...RECORDS].map(r => r.name).sort().reverse())
	} finally {
		await app.stop()
	}
})
