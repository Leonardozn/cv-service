const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../support/mock-repository-preload')
const CurriculumService = require('../../../src/services/curriculum')
const EducationManagementService = require('../../../src/services/educationManagement')

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

const ENTRY_FIELDS = { title: 'B.Sc. Computer Science', institution: 'Universidad Nacional', startDate: '2018-01-01', endDate: '2022-01-01' }

test('EducationManagementService add() — creates an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()

	const result = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	assert.equal(result.curriculum, curriculum.id)
})

test('EducationManagementService add() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()

	await assert.rejects(
		() => service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('EducationManagementService add() — an admin can add an entry under any Curriculum (FR admin override)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()

	const result = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: ADMIN })

	assert.equal(result.curriculum, curriculum.id)
})

test('EducationManagementService findOne() — returns an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.findOne({ id: created.id, user: OWNER })

	assert.equal(result.id, created.id)
})

test('EducationManagementService findOne() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.findOne({ id: created.id, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('EducationManagementService findOne() — throws a NotFoundError when the entry does not exist', async () => {
	const service = EducationManagementService.getInstance()

	await assert.rejects(
		() => service.findOne({ id: '64b0c0ffee1234567890abcf', user: OWNER }),
		{ name: 'NotFoundError', message: 'Education not found.' }
	)
})

test('EducationManagementService list() — a non-admin user only sees entries under their own Curriculum', async () => {
	const ownCurriculum = await seedCurriculum('user-1')
	const otherCurriculum = await seedCurriculum('user-2')
	const service = EducationManagementService.getInstance()
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: ownCurriculum.id }, user: OWNER })
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: otherCurriculum.id }, user: OTHER_USER })

	const result = await service.list({ query: {}, user: OWNER })

	assert.equal(result.count, 1)
	assert.equal(result.records[0].curriculum, ownCurriculum.id)
})

test('EducationManagementService list() — an admin sees every entry (FR admin override)', async () => {
	const ownCurriculum = await seedCurriculum('user-1')
	const otherCurriculum = await seedCurriculum('user-2')
	const service = EducationManagementService.getInstance()
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: ownCurriculum.id }, user: OWNER })
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: otherCurriculum.id }, user: OTHER_USER })

	const result = await service.list({ query: {}, user: ADMIN })

	assert.equal(result.count, 2)
})

test('EducationManagementService list() — a non-admin user without a Curriculum yet gets an empty list', async () => {
	const service = EducationManagementService.getInstance()

	const result = await service.list({ query: {}, user: OWNER })

	assert.deepEqual(result, { count: 0, records: [] })
})

test('EducationManagementService update() — patches an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.update({ id: created.id, body: { title: 'M.Sc. Software Engineering' }, user: OWNER })

	assert.equal(result.title, 'M.Sc. Software Engineering')
})

test('EducationManagementService update() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.update({ id: created.id, body: { title: 'Hijacked' }, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('EducationManagementService replace() — replaces an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.replace({ id: created.id, body: { ...ENTRY_FIELDS, curriculum: curriculum.id, title: 'Replaced' }, user: OWNER })

	assert.equal(result.title, 'Replaced')
})

test('EducationManagementService remove() — removes an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.remove({ id: created.id, user: OWNER })

	assert.equal(result.deletedCount, 1)
})

test('EducationManagementService remove() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = EducationManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.remove({ id: created.id, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})
