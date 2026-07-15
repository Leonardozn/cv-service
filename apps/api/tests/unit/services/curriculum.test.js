const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

// envVariables.js reads process.env once at require time (via dotenv, relative to cwd) - set it
// explicitly before anything transitively requires it, so the file-cleanup path this test
// exercises (services/curriculum.js's _getFilePaths(), gated on API_FILE_FIELDS) behaves the same
// whether this file runs via `npm test`, `npm test --workspace=apps/api`, or a bare `node --test`
// (each changes cwd, so relying on a real .env would make this test cwd-dependent).
process.env.API_FILE_FIELDS = process.env.API_FILE_FIELDS || 'photo'

const MockRepository = require('../../support/mock-repository-preload')
const MockFileManagerHandler = require('../../support/mock-file-manager-preload')
const CurriculumService = require('../../../src/services/curriculum')

// A complete record matching every field declared for 'curriculum' in settings.json - used as
// both the create payload and the expectation, since contract filtering + create/update
// validation are value-preserving for these types (see data-validator/contract templates).
const SAMPLE = {
		"user": "sample text",
		"fullName": "sample text",
		"headline": ["sample text"],
		"city": "sample text",
		"state": "sample text",
		"country": "sample text",
		"photo": "sample text",
		"profileSummary": "sample text",
		"skills": [
			"sample text"
		],
		"phones": [
			"sample text"
		],
		"contactLinks": [
			{
				"label": "sample text",
				"url": "sample text"
			}
		]
	}

const SEED_ID = '64b0c0ffee1234567890abce'

function seed() {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('curriculum').set(SEED_ID, { _id: SEED_ID, ...SAMPLE, createdAt: now, updatedAt: now })
	return repo
}

beforeEach(() => {
	MockRepository.reset()
	MockFileManagerHandler.reset()
})

function fakeUploadedFile(originalname = 'photo.png') {
	return { fieldname: 'photo', originalname, path: '/tmp/upload-src', destination: '/tmp', mimetype: 'image/png' }
}

test('curriculum service add() — creates and returns the contract-filtered record', async () => {
	const service = CurriculumService.getInstance()

	const result = await service.add({ body: SAMPLE })

	assert.match(result.id, /^[0-9a-f]{24}$/)
	assert.deepEqual(result, { ...SAMPLE, id: result.id })
})

test('curriculum service findOne() — returns the contract-filtered record by id', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.findOne({ id: SEED_ID })

	assert.deepEqual(result, { ...SAMPLE, id: SEED_ID })
})

test('curriculum service findOne() — throws when the record does not exist', async () => {
	MockRepository.getInstance()
	const service = CurriculumService.getInstance()

	await assert.rejects(() => service.findOne({ id: SEED_ID }))
})

test('curriculum service list() — returns count and contract-filtered records', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.list({})

	assert.equal(result.count, 1)
	assert.deepEqual(result.records, [{ ...SAMPLE, id: SEED_ID }])
})

test('curriculum service update() — patches and returns the contract-filtered record', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.update({ id: SEED_ID, body: SAMPLE })

	assert.deepEqual(result, { ...SAMPLE, id: SEED_ID })
})

test('curriculum service replace() — replaces and returns the contract-filtered record', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.replace({ id: SEED_ID, body: SAMPLE })

	assert.deepEqual(result, { ...SAMPLE, id: SEED_ID })
})

test('curriculum service remove() — deletes the record', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.remove({ id: SEED_ID })

	assert.equal(result.deletedCount, 1)

	await assert.rejects(() => service.findOne({ id: SEED_ID }))
})

test('curriculum service add() — saves an uploaded photo and stores the returned filename (FR photo upload)', async () => {
	const service = CurriculumService.getInstance()
	const body = { ...SAMPLE }
	delete body.photo

	const result = await service.add({ body, files: [fakeUploadedFile('me.png')] })

	assert.match(result.photo, /^curriculum-[^-]+(-[^-]+){4}-me\.png$/)
	const storage = MockFileManagerHandler.getInstance().getProvider()
	assert.deepEqual(storage.saved.map(s => s.newFilename), [result.photo])
})

test('curriculum service update() — uploading a new photo deletes the previous file and stores the new one', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.update({ id: SEED_ID, body: {}, files: [fakeUploadedFile('new.png')] })

	assert.match(result.photo, /^curriculum-[^-]+(-[^-]+){4}-new\.png$/)
	const storage = MockFileManagerHandler.getInstance().getProvider()
	assert.deepEqual(storage.deleted.map(d => d.filename), [SAMPLE.photo])
})

test('curriculum service update() — patching an unrelated field preserves the existing photo (no deletion)', async () => {
	seed()
	const service = CurriculumService.getInstance()

	const result = await service.update({ id: SEED_ID, body: { headline: ['Updated headline'] } })

	assert.equal(result.photo, SAMPLE.photo)
	assert.deepEqual(result.headline, ['Updated headline'])
	const storage = MockFileManagerHandler.getInstance().getProvider()
	assert.deepEqual(storage.deleted, [])
})
