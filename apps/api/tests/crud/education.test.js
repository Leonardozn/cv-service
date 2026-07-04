const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'education' (DB mocked, L4-style) -
// records are created through the real POST endpoint, which now requires an authenticated user
// and confirms the referenced parent Curriculum belongs to the caller (auth-service itself is
// mocked - see mock-external-api-config-preload.js's fixed-token fallback). A real Curriculum is
// created first so the ownership check has something legitimate to find. The contract exposes
// the record as 'id' (not Mongo's own '_id'), but list/filter/sort assertions below identify
// records by a known field value rather than the generated id.
const OWNER_AUTH = { Authorization: 'Bearer user-token' }

function records(curriculumId) {
	return [
		{ curriculum: curriculumId, title: 'item-1', institution: 'sample text', startDate: '2024-01-01', endDate: '2024-01-01' },
		{ curriculum: curriculumId, title: 'item-2', institution: 'sample text', startDate: '2024-01-01', endDate: '2024-01-01' },
		{ curriculum: curriculumId, title: 'item-3', institution: 'sample text', startDate: '2024-01-01', endDate: '2024-01-01' }
	]
}

async function createOwnCurriculum(app) {
	const res = await app.request('POST', `${app.path}/curriculum`, { fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.' }, OWNER_AUTH)
	return res.body.content.id
}

test('education create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		const res = await app.request('POST', `${app.path}/education`, RECORDS[0], OWNER_AUTH)

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

test('education list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/education`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('education list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/education?size=2&page=1`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
		assert.equal(res.body.content.records.length, 2)
	} finally {
		await app.stop()
	}
})

test('education list — equality filter on title (FR-G8)', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/education?query[title]=${RECORDS[1].title}`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].title, RECORDS[1].title)
	} finally {
		await app.stop()
	}
})

test('education list — sort by title (FR-G8)', async () => {
	const app = await runApp()

	try {
		const curriculumId = await createOwnCurriculum(app)
		const RECORDS = records(curriculumId)
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record, OWNER_AUTH)

		const res = await app.request('GET', `${app.path}/education?sort[title]=-1`, undefined, OWNER_AUTH)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.title)
		assert.deepEqual(values, [...RECORDS].map(r => r.title).sort().reverse())
	} finally {
		await app.stop()
	}
})
