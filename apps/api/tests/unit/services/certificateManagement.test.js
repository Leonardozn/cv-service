const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../support/mock-repository-preload')
const CurriculumService = require('../../../src/services/curriculum')
const CertificateManagementService = require('../../../src/services/certificateManagement')

const OWNER = { id: 'user-1', role: 'user' }
const OTHER_USER = { id: 'user-2', role: 'user' }
const ADMIN = { id: 'admin-1', role: 'admin' }

beforeEach(() => {
	MockRepository.reset()
})

async function seedCurriculum(user) {
	return await CurriculumService.getInstance().add({
		body: { user, fullName: 'Jane Doe', headline: ['Backend Engineer'], city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', profileSummary: 'Summary.' }
	})
}

const ENTRY_FIELDS = { name: 'AWS Certified Developer', date: '2023-01-01' }

test('CertificateManagementService add() — creates an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()

	const result = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	assert.equal(result.curriculum, curriculum.id)
})

test('CertificateManagementService add() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()

	await assert.rejects(
		() => service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('CertificateManagementService add() — an admin can add an entry under any Curriculum (FR admin override)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()

	const result = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: ADMIN })

	assert.equal(result.curriculum, curriculum.id)
})

test('CertificateManagementService findOne() — returns an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.findOne({ id: created.id, user: OWNER })

	assert.equal(result.id, created.id)
})

test('CertificateManagementService findOne() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.findOne({ id: created.id, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('CertificateManagementService findOne() — throws a NotFoundError when the entry does not exist', async () => {
	const service = CertificateManagementService.getInstance()

	await assert.rejects(
		() => service.findOne({ id: '64b0c0ffee1234567890abcf', user: OWNER }),
		{ name: 'NotFoundError', message: 'Certificate not found.' }
	)
})

test('CertificateManagementService list() — a non-admin user only sees entries under their own Curriculum', async () => {
	const ownCurriculum = await seedCurriculum('user-1')
	const otherCurriculum = await seedCurriculum('user-2')
	const service = CertificateManagementService.getInstance()
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: ownCurriculum.id }, user: OWNER })
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: otherCurriculum.id }, user: OTHER_USER })

	const result = await service.list({ query: {}, user: OWNER })

	assert.equal(result.count, 1)
	assert.equal(result.records[0].curriculum, ownCurriculum.id)
})

test('CertificateManagementService list() — an admin sees every entry (FR admin override)', async () => {
	const ownCurriculum = await seedCurriculum('user-1')
	const otherCurriculum = await seedCurriculum('user-2')
	const service = CertificateManagementService.getInstance()
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: ownCurriculum.id }, user: OWNER })
	await service.add({ body: { ...ENTRY_FIELDS, curriculum: otherCurriculum.id }, user: OTHER_USER })

	const result = await service.list({ query: {}, user: ADMIN })

	assert.equal(result.count, 2)
})

test('CertificateManagementService list() — a non-admin user without a Curriculum yet gets an empty list', async () => {
	const service = CertificateManagementService.getInstance()

	const result = await service.list({ query: {}, user: OWNER })

	assert.deepEqual(result, { count: 0, records: [] })
})

test('CertificateManagementService update() — patches an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.update({ id: created.id, body: { name: 'GCP Certified Architect' }, user: OWNER })

	assert.equal(result.name, 'GCP Certified Architect')
})

test('CertificateManagementService update() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.update({ id: created.id, body: { name: 'Hijacked' }, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('CertificateManagementService replace() — replaces an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.replace({ id: created.id, body: { ...ENTRY_FIELDS, curriculum: curriculum.id, name: 'Replaced' }, user: OWNER })

	assert.equal(result.name, 'Replaced')
})

test('CertificateManagementService remove() — removes an entry under the caller\'s own Curriculum', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	const result = await service.remove({ id: created.id, user: OWNER })

	assert.equal(result.deletedCount, 1)
})

test('CertificateManagementService remove() — throws a NotFoundError when the parent Curriculum belongs to a different user (FR ownership)', async () => {
	const curriculum = await seedCurriculum('user-1')
	const service = CertificateManagementService.getInstance()
	const created = await service.add({ body: { ...ENTRY_FIELDS, curriculum: curriculum.id }, user: OWNER })

	await assert.rejects(
		() => service.remove({ id: created.id, user: OTHER_USER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})
