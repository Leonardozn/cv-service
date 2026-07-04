const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../../support/mock-repository-preload')
const SkillService = require('../../../../src/services/skill')
const RegisterNewSkills = require('../../../../src/services/commands/registerNewSkills')

beforeEach(() => {
	MockRepository.reset()
})

test('RegisterNewSkills — adds an active Skill entry for each name not already in the catalog', async () => {
	const skillService = SkillService.getInstance()
	await skillService.add({ body: { name: 'Node.js', active: true } })
	const command = RegisterNewSkills.getInstance()

	const created = await command.execute({ skillService, skills: ['Node.js', 'MongoDB', 'Docker'] })

	assert.equal(created.length, 2)
	assert.deepEqual(created.map(skill => skill.name).sort(), ['Docker', 'MongoDB'])
	assert.ok(created.every(skill => skill.active === true))

	const all = await skillService.list({})
	assert.equal(all.count, 3)
})

test('RegisterNewSkills — does nothing when every named skill already exists', async () => {
	const skillService = SkillService.getInstance()
	await skillService.add({ body: { name: 'Node.js', active: true } })
	const command = RegisterNewSkills.getInstance()

	const created = await command.execute({ skillService, skills: ['Node.js'] })

	assert.deepEqual(created, [])
	const all = await skillService.list({})
	assert.equal(all.count, 1)
})

test('RegisterNewSkills — returns an empty array and does not query when no skills are submitted', async () => {
	const skillService = SkillService.getInstance()
	const command = RegisterNewSkills.getInstance()

	const created = await command.execute({ skillService, skills: [] })

	assert.deepEqual(created, [])
})
