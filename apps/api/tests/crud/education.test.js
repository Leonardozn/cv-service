const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'education' (DB mocked, L4-style) -
// records are created through the real POST endpoint (contracts hide '_id', so identifying
// records by a known field value - not a learned id - is what makes these assertions possible).
const RECORDS = [
		{
			"curriculum": "64b0c0ffee1234567890abcd",
			"title": "item-1",
			"institution": "sample text",
			"startDate": "2024-01-01",
			"endDate": "2024-01-01"
		},
		{
			"curriculum": "64b0c0ffee1234567890abcd",
			"title": "item-2",
			"institution": "sample text",
			"startDate": "2024-01-01",
			"endDate": "2024-01-01"
		},
		{
			"curriculum": "64b0c0ffee1234567890abcd",
			"title": "item-3",
			"institution": "sample text",
			"startDate": "2024-01-01",
			"endDate": "2024-01-01"
		}
	]

test('education create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/education`, RECORDS[0])

		assert.equal(res.status, 200)
		assert.deepEqual(res.body, {
			success: true,
			message: 'Success!',
			statusCode: 200,
			content: RECORDS[0]
		})
	} finally {
		await app.stop()
	}
})

test('education list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record)

		const res = await app.request('GET', `${app.path}/education`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('education list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record)

		const res = await app.request('GET', `${app.path}/education?size=2&page=1`)

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
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record)

		const res = await app.request('GET', `${app.path}/education?query[title]=${RECORDS[1].title}`)

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
		for (const record of RECORDS) await app.request('POST', `${app.path}/education`, record)

		const res = await app.request('GET', `${app.path}/education?sort[title]=-1`)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.title)
		assert.deepEqual(values, [...RECORDS].map(r => r.title).sort().reverse())
	} finally {
		await app.stop()
	}
})

