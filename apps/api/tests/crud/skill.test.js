const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'skill' (DB mocked, L4-style) -
// records are created through the real POST endpoint, which requires the admin role (auth-service
// itself is mocked - see mock-external-api-config-preload.js's fixed 'admin-token'). The contract
// exposes the record as 'id' (not Mongo's own '_id'), but list/filter/sort assertions below
// identify records by a known field value rather than the generated id.
const ADMIN_AUTH = { Authorization: 'Bearer admin-token' }
const RECORDS = [
		{
			"name": "item-1",
			"active": true
		},
		{
			"name": "item-2",
			"active": true
		},
		{
			"name": "item-3",
			"active": true
		}
	]

test('skill create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/skill`, RECORDS[0], ADMIN_AUTH)

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

test('skill list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/skill`, record, ADMIN_AUTH)

		const res = await app.request('GET', `${app.path}/skill`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('skill list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/skill`, record, ADMIN_AUTH)

		const res = await app.request('GET', `${app.path}/skill?size=2&page=1`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
		assert.equal(res.body.content.records.length, 2)
	} finally {
		await app.stop()
	}
})

test('skill list — equality filter on name (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/skill`, record, ADMIN_AUTH)

		const res = await app.request('GET', `${app.path}/skill?query[name]=${RECORDS[1].name}`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].name, RECORDS[1].name)
	} finally {
		await app.stop()
	}
})

test('skill list — sort by name (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (const record of RECORDS) await app.request('POST', `${app.path}/skill`, record, ADMIN_AUTH)

		const res = await app.request('GET', `${app.path}/skill?sort[name]=-1`)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.name)
		assert.deepEqual(values, [...RECORDS].map(r => r.name).sort().reverse())
	} finally {
		await app.stop()
	}
})

test('skill list — query[active]=true returns only the active Skills offered as autocomplete suggestions', async () => {
	const app = await runApp()

	try {
		await app.request('POST', `${app.path}/skill`, { name: 'Node.js', active: true }, ADMIN_AUTH)
		await app.request('POST', `${app.path}/skill`, { name: 'MongoDB', active: true }, ADMIN_AUTH)
		await app.request('POST', `${app.path}/skill`, { name: 'COBOL', active: false }, ADMIN_AUTH)

		const res = await app.request('GET', `${app.path}/skill?query[active]=true`)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 2)
		assert.deepEqual(res.body.content.records.map(r => r.name).sort(), ['MongoDB', 'Node.js'])
	} finally {
		await app.stop()
	}
})

