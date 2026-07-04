const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

// curriculumManagement.js opens a real transaction session via handlers/dbConnections, which
// requires '@cv-service/db-connections' directly (a real Mongo connect side effect) - the
// repository mock alone never reaches that path, so it needs its own interception too.
require('../../support/mock-db-connections-preload')
const MockRepository = require('../../support/mock-repository-preload')
const CurriculumManagementService = require('../../../src/services/curriculumManagement')
const SkillService = require('../../../src/services/skill')

beforeEach(() => {
	MockRepository.reset()
})

test('CurriculumManagementService save() — creates the user\'s first Curriculum and registers new skills', async () => {
	const service = CurriculumManagementService.getInstance()

	const result = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.', skills: ['Node.js', 'MongoDB'] }
	})

	assert.equal(result.fullName, 'Jane Doe')
	assert.deepEqual(result.skills, ['Node.js', 'MongoDB'])

	const skills = await SkillService.getInstance().list({})
	assert.equal(skills.count, 2)
	assert.deepEqual(skills.records.map(skill => skill.name).sort(), ['MongoDB', 'Node.js'])
})

test('CurriculumManagementService save() — updates the user\'s existing Curriculum instead of creating a second one', async () => {
	const service = CurriculumManagementService.getInstance()
	const first = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.' }
	})

	const second = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: 'Senior Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.' }
	})

	assert.equal(second.id, first.id)
	assert.equal(second.headline, 'Senior Backend Engineer')
})

test('CurriculumManagementService save() — does not register a skill that is already in the catalog', async () => {
	const service = CurriculumManagementService.getInstance()
	await SkillService.getInstance().add({ body: { name: 'Node.js', active: true } })

	await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.', skills: ['Node.js'] }
	})

	const skills = await SkillService.getInstance().list({})
	assert.equal(skills.count, 1)
})

test('CurriculumManagementService saveEntry() — updates the given Curriculum and registers new skills', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: 'Backend Engineer', city: 'Bogotá', profileSummary: 'Summary.' }
	})

	const result = await service.saveEntry({ id: created.id, body: { headline: 'Senior Backend Engineer', skills: ['Kubernetes'] } })

	assert.equal(result.headline, 'Senior Backend Engineer')
	const skills = await SkillService.getInstance().list({})
	assert.equal(skills.count, 1)
	assert.equal(skills.records[0].name, 'Kubernetes')
})
