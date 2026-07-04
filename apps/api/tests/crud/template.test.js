const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'template' (DB mocked, L4-style) -
// records are created through the real POST endpoint. The contract exposes the record as 'id'
// (not Mongo's own '_id'), but list/filter/sort assertions below identify records by a known
// field value rather than the generated id.
const RECORDS = [
		{
			"name": "item-1",
			"key": "sample text",
			"description": "sample text",
			"active": true
		},
		{
			"name": "item-2",
			"key": "sample text",
			"description": "sample text",
			"active": true
		},
		{
			"name": "item-3",
			"key": "sample text",
			"description": "sample text",
			"active": true
		}
	]

test('template create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/template`, RECORDS[0])

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

test('template list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/template`, record)

		const res = await app.request('GET', `${app.path}/template`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('template list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/template`, record)

		const res = await app.request('GET', `${app.path}/template?size=2&page=1`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
		assert.equal(res.body.content.records.length, 2)
	} finally {
		await app.stop()
	}
})

test('template list — equality filter on name (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/template`, record)

		const res = await app.request('GET', `${app.path}/template?query[name]=${RECORDS[1].name}`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].name, RECORDS[1].name)
	} finally {
		await app.stop()
	}
})

test('template list — sort by name (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/template`, record)

		const res = await app.request('GET', `${app.path}/template?sort[name]=-1`)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.name)
		assert.deepEqual(values, [...RECORDS].map(r => r.name).sort().reverse())
	} finally {
		await app.stop()
	}
})

test('template list — query[active]=true returns only the active Templates offered in the design selector', async () => {
	const app = await runApp()

	try {
		await app.request('POST', `${app.path}/template`, { name: 'Classic two columns', key: 'classic-two-columns', description: 'Two-column layout', active: true })
		await app.request('POST', `${app.path}/template`, { name: 'Retired design', key: 'retired-design', description: 'No longer offered', active: false })

		const res = await app.request('GET', `${app.path}/template?query[active]=true`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].name, 'Classic two columns')
	} finally {
		await app.stop()
	}
})

