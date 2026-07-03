const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'curriculum' (DB mocked, L4-style) -
// records are created through the real POST endpoint (contracts hide '_id', so identifying
// records by a known field value - not a learned id - is what makes these assertions possible).
const RECORDS = [
		{
			"user": "item-1",
			"fullName": "sample text",
			"headline": "sample text",
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
		},
		{
			"user": "item-2",
			"fullName": "sample text",
			"headline": "sample text",
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
		},
		{
			"user": "item-3",
			"fullName": "sample text",
			"headline": "sample text",
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
	]

test('curriculum create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/curriculum`, RECORDS[0])

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

test('curriculum list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/curriculum`, record)

		const res = await app.request('GET', `${app.path}/curriculum`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('curriculum list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/curriculum`, record)

		const res = await app.request('GET', `${app.path}/curriculum?size=2&page=1`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
		assert.equal(res.body.content.records.length, 2)
	} finally {
		await app.stop()
	}
})

test('curriculum list — equality filter on user (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/curriculum`, record)

		const res = await app.request('GET', `${app.path}/curriculum?query[user]=${RECORDS[1].user}`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].user, RECORDS[1].user)
	} finally {
		await app.stop()
	}
})

test('curriculum list — sort by user (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/curriculum`, record)

		const res = await app.request('GET', `${app.path}/curriculum?sort[user]=-1`)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.user)
		assert.deepEqual(values, [...RECORDS].map(r => r.user).sort().reverse())
	} finally {
		await app.stop()
	}
})

