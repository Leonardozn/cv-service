const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../../support/mock-repository-preload')
const EducationService = require('../../../../src/services/education')
const ExperienceService = require('../../../../src/services/experience')
const CertificateService = require('../../../../src/services/certificate')
const LoadCurriculumEntries = require('../../../../src/services/commands/loadCurriculumEntries')

const CURRICULUM_ID = '64b0c0ffee1234567890abcd'
const OTHER_CURRICULUM_ID = '64b0c0ffee1234567890abce'

beforeEach(() => {
	MockRepository.reset()
})

function seed() {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('education').set('e1', { _id: 'e1', curriculum: CURRICULUM_ID, title: 'B.Sc.', institution: 'U', startDate: '2016-01-01', createdAt: now, updatedAt: now })
	repo._collection('experience').set('x1', { _id: 'x1', curriculum: CURRICULUM_ID, position: 'Dev', company: 'Acme', startDate: '2020-01-01', description: 'Work', createdAt: now, updatedAt: now })
	repo._collection('certificate').set('c1', { _id: 'c1', curriculum: CURRICULUM_ID, name: 'AWS', date: '2022-01-01', createdAt: now, updatedAt: now })
	// A different curriculum's entries must never leak into the result.
	repo._collection('education').set('e2', { _id: 'e2', curriculum: OTHER_CURRICULUM_ID, title: 'Other', institution: 'Other U', startDate: '2016-01-01', createdAt: now, updatedAt: now })
}

test('LoadCurriculumEntries — loads only the given Curriculum\'s Education/Experience/Certificate entries', async () => {
	seed()
	const command = LoadCurriculumEntries.getInstance()

	const result = await command.execute({
		educationService: EducationService.getInstance(),
		experienceService: ExperienceService.getInstance(),
		certificateService: CertificateService.getInstance(),
		curriculumId: CURRICULUM_ID
	})

	assert.equal(result.education.length, 1)
	assert.equal(result.education[0].title, 'B.Sc.')
	assert.equal(result.experience.length, 1)
	assert.equal(result.experience[0].position, 'Dev')
	assert.equal(result.certificate.length, 1)
	assert.equal(result.certificate[0].name, 'AWS')
})

test('LoadCurriculumEntries — orders Education/Experience by startDate and Certificate by date, most recent first', async () => {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('education').set('e-old', { _id: 'e-old', curriculum: CURRICULUM_ID, title: 'B.Sc.', institution: 'U', startDate: '2016-01-01', createdAt: now, updatedAt: now })
	repo._collection('education').set('e-new', { _id: 'e-new', curriculum: CURRICULUM_ID, title: 'M.Sc.', institution: 'U', startDate: '2021-01-01', createdAt: now, updatedAt: now })
	repo._collection('experience').set('x-old', { _id: 'x-old', curriculum: CURRICULUM_ID, position: 'Junior Dev', company: 'Acme', startDate: '2018-01-01', description: 'Work', createdAt: now, updatedAt: now })
	repo._collection('experience').set('x-new', { _id: 'x-new', curriculum: CURRICULUM_ID, position: 'Senior Dev', company: 'Acme', startDate: '2022-01-01', description: 'Work', createdAt: now, updatedAt: now })
	repo._collection('certificate').set('c-old', { _id: 'c-old', curriculum: CURRICULUM_ID, name: 'AWS', date: '2019-01-01', createdAt: now, updatedAt: now })
	repo._collection('certificate').set('c-new', { _id: 'c-new', curriculum: CURRICULUM_ID, name: 'GCP', date: '2023-01-01', createdAt: now, updatedAt: now })

	const command = LoadCurriculumEntries.getInstance()
	const result = await command.execute({
		educationService: EducationService.getInstance(),
		experienceService: ExperienceService.getInstance(),
		certificateService: CertificateService.getInstance(),
		curriculumId: CURRICULUM_ID
	})

	assert.deepEqual(result.education.map(e => e.title), ['M.Sc.', 'B.Sc.'])
	assert.deepEqual(result.experience.map(e => e.position), ['Senior Dev', 'Junior Dev'])
	assert.deepEqual(result.certificate.map(c => c.name), ['GCP', 'AWS'])
})

test('LoadCurriculumEntries — returns empty arrays when the Curriculum has no entries', async () => {
	const command = LoadCurriculumEntries.getInstance()

	const result = await command.execute({
		educationService: EducationService.getInstance(),
		experienceService: ExperienceService.getInstance(),
		certificateService: CertificateService.getInstance(),
		curriculumId: CURRICULUM_ID
	})

	assert.deepEqual(result, { education: [], experience: [], certificate: [] })
})
