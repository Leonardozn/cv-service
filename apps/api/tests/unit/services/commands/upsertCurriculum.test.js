const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../../support/mock-repository-preload')
const CurriculumService = require('../../../../src/services/curriculum')
const UpsertCurriculum = require('../../../../src/services/commands/upsertCurriculum')

beforeEach(() => {
	MockRepository.reset()
})

test('UpsertCurriculum — creates the user\'s first Curriculum when none exists yet', async () => {
	const command = UpsertCurriculum.getInstance()
	const body = { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', profileSummary: 'Summary.' }

	const result = await command.execute({ curriculumService: CurriculumService.getInstance(), body, files: [] })

	assert.equal(result.user, 'user-1')
	assert.equal(result.fullName, 'Jane Doe')
	assert.match(result.id, /^[0-9a-f]{24}$/)
})

test('UpsertCurriculum — updates the user\'s existing Curriculum instead of creating a second one', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = UpsertCurriculum.getInstance()
	const created = await curriculumService.add({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', profileSummary: 'Summary.' }
	})

	const result = await command.execute({
		curriculumService,
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Senior Backend Engineer'], city: 'Bogotá', profileSummary: 'Summary.' }
	})

	assert.equal(result.id, created.id)
	assert.deepEqual(result.headline, ['Senior Backend Engineer'])

	const all = await curriculumService.list({})
	assert.equal(all.count, 1)
})
