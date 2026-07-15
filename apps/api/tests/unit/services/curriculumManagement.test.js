const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

// curriculumManagement.js opens a real transaction session via handlers/dbConnections, which
// requires '@cv-service/db-connections' directly (a real Mongo connect side effect) - the
// repository mock alone never reaches that path, so it needs its own interception too.
require('../../support/mock-db-connections-preload')
const MockRepository = require('../../support/mock-repository-preload')
const CurriculumManagementService = require('../../../src/services/curriculumManagement')
const SkillService = require('../../../src/services/skill')

const OWNER = { id: 'user-1', role: 'user' }
const ADMIN = { id: 'admin-1', role: 'admin' }

beforeEach(() => {
	MockRepository.reset()
})

test('CurriculumManagementService save() — creates the user\'s first Curriculum and registers new skills', async () => {
	const service = CurriculumManagementService.getInstance()

	const result = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.', skills: ['Node.js', 'MongoDB'] }
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
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const second = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Senior Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	assert.equal(second.id, first.id)
	assert.deepEqual(second.headline, ['Senior Backend Engineer'])
})

test('CurriculumManagementService save() — does not register a skill that is already in the catalog', async () => {
	const service = CurriculumManagementService.getInstance()
	await SkillService.getInstance().add({ body: { name: 'Node.js', active: true } })

	await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.', skills: ['Node.js'] }
	})

	const skills = await SkillService.getInstance().list({})
	assert.equal(skills.count, 1)
})

test('CurriculumManagementService saveEntry() — updates the given Curriculum and registers new skills', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await service.saveEntry({ id: created.id, body: { headline: ['Senior Backend Engineer'], skills: ['Kubernetes'] }, user: OWNER })

	assert.deepEqual(result.headline, ['Senior Backend Engineer'])
	const skills = await SkillService.getInstance().list({})
	assert.equal(skills.count, 1)
	assert.equal(skills.records[0].name, 'Kubernetes')
})

test('CurriculumManagementService saveEntry() — throws a NotFoundError when the Curriculum belongs to a different user (FR ownership)', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	await assert.rejects(
		() => service.saveEntry({ id: created.id, body: { headline: ['Hijacked'] }, user: { id: 'someone-else', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('CurriculumManagementService saveEntry() — an admin can update a Curriculum owned by someone else (FR admin override)', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await service.saveEntry({ id: created.id, body: { headline: ['Updated by admin'] }, user: ADMIN })

	assert.deepEqual(result.headline, ['Updated by admin'])
})

test('CurriculumManagementService findOne() — returns the caller\'s own Curriculum', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await service.findOne({ id: created.id, user: OWNER })

	assert.equal(result.id, created.id)
})

test('CurriculumManagementService findOne() — throws a NotFoundError when the Curriculum belongs to a different user (FR ownership)', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	await assert.rejects(
		() => service.findOne({ id: created.id, user: { id: 'someone-else', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('CurriculumManagementService findOne() — an admin can read a Curriculum owned by someone else (FR admin override)', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await service.findOne({ id: created.id, user: ADMIN })

	assert.equal(result.id, created.id)
})

test('CurriculumManagementService list() — a non-admin user only sees their own Curriculum', async () => {
	const service = CurriculumManagementService.getInstance()
	await service.save({ body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' } })
	await service.save({ body: { user: 'user-2', fullName: 'John Roe', headline: ['Frontend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' } })

	const result = await service.list({ query: {}, user: OWNER })

	assert.equal(result.count, 1)
	assert.equal(result.records[0].user, 'user-1')
})

test('CurriculumManagementService list() — an admin sees every Curriculum (FR admin override)', async () => {
	const service = CurriculumManagementService.getInstance()
	await service.save({ body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' } })
	await service.save({ body: { user: 'user-2', fullName: 'John Roe', headline: ['Frontend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' } })

	const result = await service.list({ query: {}, user: ADMIN })

	assert.equal(result.count, 2)
})

test('CurriculumManagementService replaceEntry() — replaces the caller\'s own Curriculum', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	const result = await service.replaceEntry({
		id: created.id,
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Replaced'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' },
		user: OWNER
	})

	assert.deepEqual(result.headline, ['Replaced'])
})

test('CurriculumManagementService replaceEntry() — throws a NotFoundError when the Curriculum belongs to a different user (FR ownership)', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	await assert.rejects(
		() => service.replaceEntry({ id: created.id, body: { user: 'user-1', fullName: 'Hijacked' }, user: { id: 'someone-else', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('CurriculumManagementService removeEntry() — removes the caller\'s own Curriculum', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	await service.removeEntry({ id: created.id, user: OWNER })

	const result = await service.list({ query: {}, user: ADMIN })
	assert.equal(result.count, 0)
})

test('CurriculumManagementService removeEntry() — throws a NotFoundError when the Curriculum belongs to a different user (FR ownership)', async () => {
	const service = CurriculumManagementService.getInstance()
	const created = await service.save({
		body: { user: 'user-1', fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})

	await assert.rejects(
		() => service.removeEntry({ id: created.id, user: { id: 'someone-else', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})
