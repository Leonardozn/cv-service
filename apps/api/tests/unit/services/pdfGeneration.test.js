const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../support/mock-repository-preload')
const PdfGenerationService = require('../../../src/services/pdfGeneration')

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
		headline: 'Backend Engineer',
		city: 'Bogotá',
		profileSummary: 'Summary.',
		skills: ['Node.js'],
		contactLinks: [],
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

test('PdfGenerationService generatePdf() — throws when no Template is active and none was requested', async () => {
	seedCurriculum()
	const service = PdfGenerationService.getInstance()

	await assert.rejects(
		() => service.generatePdf({ id: CURRICULUM_ID, body: {}, user: OWNER }),
		{ message: 'No active Template is configured.' }
	)
})
