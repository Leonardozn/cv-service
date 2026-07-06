const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../support/mock-repository-preload')
const PdfGenerationService = require('../../../src/services/pdfGeneration')
const { decodePdfText } = require('../../support/decodePdfText')

const CURRICULUM_ID = '64b0c0ffee1234567890abcd'
const TEMPLATE_ID = '64b0c0ffee1234567890abce'
const OWNER = { id: 'user-1', role: 'user' }

beforeEach(() => {
	MockRepository.reset()
})

function seedCurriculum(overrides = {}) {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('curriculum').set(CURRICULUM_ID, {
		_id: CURRICULUM_ID,
		user: 'user-1',
		fullName: 'Jane Doe',
		headline: ['Backend Engineer'],
		city: 'Bogotá',
		profileSummary: 'Summary.',
		skills: ['Node.js'],
		contactLinks: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	})
}

// Mirrors what a real Mongoose document's toObject() returns for a Date-typed field (a native
// Date instance, not an ISO string) - the mock repository otherwise only ever sees whatever the
// interface layer parsed, which for 'experience'/'education' createInterface (no transform: true
// on startDate/endDate) stays a plain string, so seeding directly is the only way to reproduce
// the real repository's shape here.
function seedExperience(overrides = {}) {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('experience').set('64b0c0ffee1234567890abcc', {
		_id: '64b0c0ffee1234567890abcc',
		curriculum: CURRICULUM_ID,
		position: 'Backend Engineer',
		company: 'Acme Corp',
		startDate: new Date('2021-03-01T00:00:00.000Z'),
		description: 'Built and maintained payment services.',
		createdAt: now,
		updatedAt: now,
		...overrides
	})
}

function seedTemplate(overrides = {}) {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('template').set(TEMPLATE_ID, {
		_id: TEMPLATE_ID,
		name: 'Classic two columns',
		key: 'classic-two-columns',
		description: 'Two-column layout',
		active: true,
		createdAt: now,
		updatedAt: now,
		...overrides
	})
}

test('PdfGenerationService generatePdf() — renders a real PDF for a Curriculum with no entries and the active default Template', async () => {
	seedCurriculum()
	seedTemplate()
	const service = PdfGenerationService.getInstance()

	const buffer = await service.generatePdf({ id: CURRICULUM_ID, body: {}, user: OWNER })

	assert.equal(Buffer.isBuffer(buffer), true)
	assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
})

test('PdfGenerationService generatePdf() — Experience dates keep the year end-to-end when the repository returns native Date objects (FR date year)', async () => {
	seedCurriculum()
	seedExperience()
	seedTemplate()
	const service = PdfGenerationService.getInstance()

	const buffer = await service.generatePdf({ id: CURRICULUM_ID, body: {}, user: OWNER })

	assert.match(decodePdfText(buffer), /2021-03-01 - Present/)
})

test('PdfGenerationService generatePdf() — renders with an explicitly requested Template id', async () => {
	seedCurriculum()
	seedTemplate({ active: false })
	const service = PdfGenerationService.getInstance()

	const buffer = await service.generatePdf({ id: CURRICULUM_ID, body: { template: TEMPLATE_ID }, user: OWNER })

	assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
})

test('PdfGenerationService generatePdf() — throws a NotFoundError when the Curriculum does not exist', async () => {
	seedTemplate()
	const service = PdfGenerationService.getInstance()

	await assert.rejects(
		() => service.generatePdf({ id: CURRICULUM_ID, body: {}, user: OWNER }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('PdfGenerationService generatePdf() — throws a NotFoundError when the Curriculum belongs to a different user (FR ownership)', async () => {
	seedCurriculum({ user: 'user-1' })
	seedTemplate()
	const service = PdfGenerationService.getInstance()

	await assert.rejects(
		() => service.generatePdf({ id: CURRICULUM_ID, body: {}, user: { id: 'someone-else', role: 'user' } }),
		{ name: 'NotFoundError', message: 'Curriculum not found.' }
	)
})

test('PdfGenerationService generatePdf() — an admin can render a PDF for a Curriculum owned by someone else (FR admin override)', async () => {
	seedCurriculum({ user: 'user-1' })
	seedTemplate()
	const service = PdfGenerationService.getInstance()

	const buffer = await service.generatePdf({ id: CURRICULUM_ID, body: {}, user: { id: 'admin-1', role: 'admin' } })

	assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
})

test('PdfGenerationService generatePdf() — throws when no Template is active and none was requested', async () => {
	seedCurriculum()
	const service = PdfGenerationService.getInstance()

	await assert.rejects(
		() => service.generatePdf({ id: CURRICULUM_ID, body: {}, user: OWNER }),
		{ message: 'No active Template is configured.' }
	)
})
