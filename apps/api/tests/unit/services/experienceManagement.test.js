const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../support/mock-repository-preload')
const CurriculumService = require('../../../src/services/curriculum')
const ExperienceManagementService = require('../../../src/services/experienceManagement')

const OWNER = { id: 'user-1', role: 'user' }
const OTHER_USER = { id: 'user-2', role: 'user' }
const ADMIN = { id: 'admin-1', role: 'admin' }

beforeEach(() => {
	MockRepository.reset()
})

async function seedCurriculum(user) {
	return await CurriculumService.getInstance().add({
		body: { user, fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', profileSummary: 'Summary.' }
	})
}

const ENTRY_FIELDS = { position: 'Backend Engineer', company: 'Acme Corp', location: 'Remote', startDate: '2020-01-01', endDate: '2022-01-01', description: 'Built things.' }

test('ExperienceManagementService add() — creates an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()

	const result = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	assert.equal(result.curriculum, curriculum.id)
})

test('ExperienceManagementService add() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()

	await assert.rejects(
		() => service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('ExperienceManagementService add() — an admin can add an entry under any Curriculum (FR admin override)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()

	const result = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: ADMIN })

	assert.equal(result.curriculum, curriculum.id)
})

test('ExperienceManagementService findOne() — returns an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.findOne({ id: created.id, user: OWNER })

	assert.equal(result.id, created.id)
})

test('ExperienceManagementService findOne() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.findOne({ id: created.id, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('ExperienceManagementService findOne() — throws a NotFoundError when the entry does not exist', async () => {
	const service = ExperienceManagementService.getInstance()

	await assert.rejects(
		() => service.findOne({ id: '64b0c0ffee1234567890abcf', user: OWNER }),
		{ name: 'NotFoundError', message: 'Experience not found.' }
	)
})

test('ExperienceManagementService list() — a non-admin user only sees entries under their own Curriculum', async () => {
	const ownCurriculum = await seedCurriculum('user-1')
	const otherCurriculum = await seedCurriculum('user-2')
	const service = ExperienceManagementService.getInstance()
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: ownCurriculum.id }, user: OWNER })
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: otherCurriculum.id }, user: OTHER_USER })

	const result = await service.list({ query: {}, user: OWNER })

	assert.equal(result.count, 1)
	assert.equal(result.records[0].curriculum, ownCurriculum.id)
})

test('ExperienceManagementService list() — an admin sees every entry (FR admin override)', async () => {
	const ownCurriculum = await seedCurriculum('user-1')
	const otherCurriculum = await seedCurriculum('user-2')
	const service = ExperienceManagementService.getInstance()
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: ownCurriculum.id }, user: OWNER })
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: otherCurriculum.id }, user: OTHER_USER })

	const result = await service.list({ query: {}, user: ADMIN })

	assert.equal(result.count, 2)
})

test('ExperienceManagementService list() — a non-admin user without a Curriculum yet gets an empty list', async () => {
	const service = ExperienceManagementService.getInstance()

	const result = await service.list({ query: {}, user: OWNER })

	assert.deepEqual(result, { count: 0, records: [] })
})

test('ExperienceManagementService update() — patches an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.update({ id: created.id, body: { position: 'Staff Engineer' }, user: OWNER })

	assert.equal(result.position, 'Staff Engineer')
})

test('ExperienceManagementService update() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.update({ id: created.id, body: { position: 'Hijacked' }, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('ExperienceManagementService replace() — replaces an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.replace({ id: created.id, body: { ...ENTRY_FIELDS, curriculum: curriculum.id, position: 'Replaced' }, user: OWNER })

	assert.equal(result.position, 'Replaced')
})

test('ExperienceManagementService remove() — removes an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.remove({ id: created.id, user: OWNER })

	assert.equal(result.deletedCount, 1)
})

test('ExperienceManagementService remove() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = ExperienceManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.remove({ id: created.id, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})
