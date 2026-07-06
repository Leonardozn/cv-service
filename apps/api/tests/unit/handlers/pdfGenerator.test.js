const { test } = require('node:test')
const assert = require('node:assert/strict')
const PdfGeneratorHandler = require('../../../src/handlers/pdfGenerator')
const { decodePdfText } = require('../../support/decodePdfText')

const SAMPLE_CURRICULUM = {
	fullName: 'Jane Doe',
	headline: ['Backend Engineer'],
	city: 'Bogotá',
	profileSummary: '5+ years building distributed systems.',
	skills: ['Node.js', 'MongoDB'],
	contactLinks: [{ label: 'LinkedIn', url: 'linkedin.com/in/janedoe' }],
	education: [{ title: 'B.Sc. Computer Science', institution: 'Universidad Nacional', startDate: '2016-01-15', endDate: '2020-01-01' }],
	experience: [{ position: 'Backend Engineer', company: 'Acme Corp', startDate: '2021-03-01', description: 'Built and maintained payment services.' }],
	certificate: [{ name: 'AWS Certified Developer', date: '2022-09-10' }]
}

test('PdfGeneratorHandler getTemplateKeys() — lists the registered design keys', () => {
	const handler = PdfGeneratorHandler.getInstance()

	assert.deepEqual(handler.getTemplateKeys(), ['classic-two-columns'])
})

test('PdfGeneratorHandler renderCurriculum() — renders a real PDF buffer for a known template', async () => {
	const handler = PdfGeneratorHandler.getInstance()

	const buffer = await handler.renderCurriculum({ templateKey: 'classic-two-columns', curriculum: SAMPLE_CURRICULUM })

	assert.equal(Buffer.isBuffer(buffer), true)
	assert.ok(buffer.length > 0)
	assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
})

test('PdfGeneratorHandler renderCurriculum() — renders with empty optional sections (no photo/links/entries)', async () => {
	const handler = PdfGeneratorHandler.getInstance()

	const buffer = await handler.renderCurriculum({
		templateKey: 'classic-two-columns',
		curriculum: { fullName: 'John Roe', headline: ['Developer'], profileSummary: 'Summary.' }
	})

	assert.equal(Buffer.isBuffer(buffer), true)
	assert.equal(buffer.subarray(0, 5).toString('latin1'), '%PDF-')
})

test('PdfGeneratorHandler renderCurriculum() — throws for an unknown template key', async () => {
	const handler = PdfGeneratorHandler.getInstance()

	await assert.rejects(
		() => handler.renderCurriculum({ templateKey: 'does-not-exist', curriculum: SAMPLE_CURRICULUM }),
		{ message: "Unknown CV template key: 'does-not-exist'." }
	)
})

test('PdfGeneratorHandler renderCurriculum() — joins multiple headline entries with "|" (FR headline array)', async () => {
	const handler = PdfGeneratorHandler.getInstance()

	const buffer = await handler.renderCurriculum({
		templateKey: 'classic-two-columns',
		curriculum: { fullName: 'Jane Doe', headline: ['Backend Engineer', '5+ years of experience'], profileSummary: 'Summary.' }
	})

	assert.match(decodePdfText(buffer), /Backend Engineer \| 5\+ years of experience/)
})

// A repository-loaded Experience/Education carries startDate/endDate as native Date objects (see
// services/experience.js's _normalizeContractPayload, which calls the Mongoose document's own
// toObject() rather than re-serializing to JSON) - String(aDateObject) uses Date's
// locale-dependent toString() (e.g. "Sat Mar 01 2021 00:00:00 GMT...") which drops the year (and
// can shift the day) once sliced, unlike String(anIsoString). Assert the rendered PDF text still
// carries the full year for both a native Date and an ISO string input.
test('PdfGeneratorHandler renderCurriculum() — Experience/Education dates keep the year when the repository returns native Date objects (FR date year)', async () => {
	const handler = PdfGeneratorHandler.getInstance()

	const buffer = await handler.renderCurriculum({
		templateKey: 'classic-two-columns',
		curriculum: {
			fullName: 'Jane Doe',
			headline: ['Backend Engineer'],
			profileSummary: 'Summary.',
			education: [{ title: 'B.Sc. Computer Science', institution: 'Universidad Nacional', startDate: new Date('2016-01-15T00:00:00.000Z'), endDate: new Date('2020-01-01T00:00:00.000Z') }],
			experience: [{ position: 'Backend Engineer', company: 'Acme Corp', startDate: new Date('2021-03-01T00:00:00.000Z'), description: 'x' }]
		}
	})

	const text = decodePdfText(buffer)
	assert.match(text, /2016-01-15 - 2020-01-01/)
	assert.match(text, /2021-03-01 - Present/)
})
