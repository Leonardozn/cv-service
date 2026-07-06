const test = require('node:test')
const assert = require('node:assert/strict')
const { runApp } = require('../support/run-app')

// Exhaustive list/filter/sort/pagination coverage for 'curriculum' (DB mocked, L4-style) -
// records are created through the real POST endpoint, which now requires an authenticated user
// (auth-service itself is mocked - see mock-external-api-config-preload.js's fixed-token
// fallback). The controller always forces the saved Curriculum's `user` to the caller's own id
// (never a client-supplied value), so each of the three RECORDS below is created by a distinct
// fixed-token user; only an admin (ADMIN_AUTH) can list/filter/sort across all of them at once.
// The contract exposes the record as 'id' (not Mongo's own '_id'), but list/filter/sort
// assertions below identify records by a known field value rather than the generated id.
const ADMIN_AUTH = { Authorization: 'Bearer admin-token' }
const OWNER_AUTH = { Authorization: 'Bearer user-token' }
const RECORD_AUTHS = [OWNER_AUTH, { Authorization: 'Bearer other-user-token' }, { Authorization: 'Bearer third-user-token' }]
const RECORD_USERS = ['fixture-user', 'fixture-other-user', 'fixture-third-user']
const RECORDS = [
		{
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
		},
		{
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
		},
		{
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
	]

test('curriculum create — complete payload round-trips through the full envelope', async () => {
	const app = await runApp()

	try {
		const res = await app.request('POST', `${app.path}/curriculum`, RECORDS[0], OWNER_AUTH)

		assert.equal(res.status, 200)
		assert.match(res.body.content.id, /^[0-9a-f]{24}$/)
		assert.deepEqual(res.body, {
			success: true,
			message: 'Success!',
			statusCode: 200,
			content: { ...RECORDS[0], user: RECORD_USERS[0], id: res.body.content.id }
		})
	} finally {
		await app.stop()
	}
})

test('curriculum list — count reflects every created record', async () => {
	const app = await runApp()

	try {
		for (let i = 0; i < RECORDS.length; i++) await app.request('POST', `${app.path}/curriculum`, RECORDS[i], RECORD_AUTHS[i])

		const res = await app.request('GET', `${app.path}/curriculum`, undefined, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, RECORDS.length)
	} finally {
		await app.stop()
	}
})

test('curriculum list — pagination slices the result set', async () => {
	const app = await runApp()

	try {
		for (let i = 0; i < RECORDS.length; i++) await app.request('POST', `${app.path}/curriculum`, RECORDS[i], RECORD_AUTHS[i])

		const res = await app.request('GET', `${app.path}/curriculum?size=2&page=1`, undefined, ADMIN_AUTH)

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
		for (let i = 0; i < RECORDS.length; i++) await app.request('POST', `${app.path}/curriculum`, RECORDS[i], RECORD_AUTHS[i])

		const res = await app.request('GET', `${app.path}/curriculum?query[user]=${RECORD_USERS[1]}`, undefined, ADMIN_AUTH)

		assert.equal(res.status, 200)
		assert.equal(res.body.content.count, 1)
		assert.equal(res.body.content.records[0].user, RECORD_USERS[1])
	} finally {
		await app.stop()
	}
})

test('curriculum list — sort by user (FR-G8)', async () => {
	const app = await runApp()

	try {
		for (let i = 0; i < RECORDS.length; i++) await app.request('POST', `${app.path}/curriculum`, RECORDS[i], RECORD_AUTHS[i])

		const res = await app.request('GET', `${app.path}/curriculum?sort[user]=-1`, undefined, ADMIN_AUTH)

		assert.equal(res.status, 200)
		const values = res.body.content.records.map(r => r.user)
		assert.deepEqual(values, [...RECORD_USERS].sort().reverse())
	} finally {
		await app.stop()
	}
})
