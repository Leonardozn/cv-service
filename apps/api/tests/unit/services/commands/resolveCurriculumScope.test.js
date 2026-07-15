const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../../support/mock-repository-preload')
const CurriculumService = require('../../../../src/services/curriculum')
const ResolveCurriculumScope = require('../../../../src/services/commands/resolveCurriculumScope')

beforeEach(() => {
	MockRepository.reset()
})

test('ResolveCurriculumScope — an admin is unscoped (sees everything)', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = ResolveCurriculumScope.getInstance()

	const result = await command.execute({ curriculumService, user: { id: 'admin-1', role: 'admin' } })

	assert.deepEqual(result, { scoped: false })
})

test('ResolveCurriculumScope — a non-admin user is scoped to their own Curriculum id', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = ResolveCurriculumScope.getInstance()
	const created = await curriculumService.add({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await command.execute({ curriculumService, user: { id: 'user-1', role: 'user' } })

	assert.deepEqual(result, { scoped: true, curriculumId: created.id })
})

test('ResolveCurriculumScope — a non-admin user without a Curriculum yet resolves a null curriculumId', async () => {
	const curriculumService = CurriculumService.getInstance()
	const command = ResolveCurriculumScope.getInstance()

	const result = await command.execute({ curriculumService, user: { id: 'user-1', role: 'user' } })

	assert.deepEqual(result, { scoped: true, curriculumId: null })
})
