const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'experience' (DB mocked, L4-style) -
// records are created through the real POST endpoint, which now requires an authenticated user
// and confirms the referenced parent Curriculum belongs to the caller (auth-service itself is
// mocked - see mock-external-api-config-preload.js's fixed-token fallback). A real Curriculum is
// created first so the ownership check has something legitimate to find. The contract exposes
// the record as 'id' (not Mongo's own '_id'), but list/filter/sort assertions below identify
// records by a known field value rather than the generated id.
const OWNER_AUTH = { Authorization: 'Bearer user-token' }

function records(curriculumId) {
	return [
		{ curriculum: curriculumId, position: 'item-1', company: 'sample text', location: 'sample text', startDate: '2024-01-01', endDate: '2024-01-01', description: 'sample text' },
		{ curriculum: curriculumId, position: 'item-2', company: 'sample text', location: 'sample text', startDate: '2024-01-01', endDate: '2024-01-01', description: 'sample text' },
		{ curriculum: curriculumId, position: 'item-3', company: 'sample text', location: 'sample text', startDate: '2024-01-01', endDate: '2024-01-01', description: 'sample text' }
	]
}

async function createOwnCurriculum(app) {
	const res = await app.request('POST', `${app.path}/curriculum`, { fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.' }, OWNER_AUTH)
	return res.body.content.id
}

test('experience create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		const res = await app.request('POST', `${app.path}/experience`, RECORDS[0], OWNER_AUTH)

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

test('experience list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/experience`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/experience`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('experience list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/experience`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/experience?size=2&page=1`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
		assert.equal(res.body.content.records.length, 2)
	} finally {
		await app.stop()
	}
})

test('experience list — equality filter on position (FR-G8)', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/experience`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/experience?query[position]=${RECORDS[1].position}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].position, RECORDS[1].position)
	} finally {
		await app.stop()
	}
})

test('experience list — sort by position (FR-G8)', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/experience`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/experience?sort[position]=-1`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.position)
		assert.deepEqual(values, [...RECORDS].map(r => r.position).sort().reverse())
	} finally {
		await app.stop()
	}
})
