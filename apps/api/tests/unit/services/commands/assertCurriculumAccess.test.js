const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../../support/mock-repository-preload')
const CurriculumService = require('../../../../src/services/curriculum')
const AssertCurriculumAccess = require('../../../../src/services/commands/assertCurriculumAccess')

beforeEach(() => {
	MockRepository.reset()
})

test('AssertCurriculumAccess — returns the Curriculum when the caller is its owner', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = AssertCurriculumAccess.getInstance()
	const created = await curriculumService.add({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await command.execute({ curriculumService, curriculumId: created.id, user: { id: 'user-1', role: 'user' } })

	assert.equal(result.id, created.id)
})

test('AssertCurriculumAccess — returns the Curriculum when the caller is an admin, regardless of owner (FR admin override)', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = AssertCurriculumAccess.getInstance()
	const created = await curriculumService.add({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await command.execute({ curriculumService, curriculumId: created.id, user: { id: 'admin-1', role: 'admin' } })

	assert.equal(result.id, created.id)
})

test('AssertCurriculumAccess — throws a NotFoundError when the Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = AssertCurriculumAccess.getInstance()
	const created = await curriculumService.add({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	await assert.rejects(
		() => command.execute({ curriculumService, curriculumId: created.id, user: { id: 'someone-else', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('AssertCurriculumAccess — throws a NotFoundError when the Curriculum does not exist', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = AssertCurriculumAccess.getInstance()

	await assert.rejects(
		() => command.execute({ curriculumService, curriculumId: '64b0c0ffee1234567890abcd', user: { id: 'user-1', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})
