const CurriculumService = require('./curriculum')
const EducationService = require('./education')
const ExperienceService = require('./experience')
const CertificateService = require('./certificate')
const TemplateService = require('./template')
const PdfGeneratorHandler = require('../handlers/pdfGenerator')
const LoadCurriculumEntries = require('./commands/loadCurriculumEntries')
const ResolveTemplate = require('./commands/resolveTemplate')
const AssertCurriculumAccess = require('./commands/assertCurriculumAccess')
const ResolveCurriculumPhoto = require('./commands/resolveCurriculumPhoto')

class PdfGenerationService {
	/**
	 * @private
	 * @static
	 */
	instance

	constructor() {
		this.curriculumService = CurriculumService.getInstance()
		this.educationService = EducationService.getInstance()
		this.experienceService = ExperienceService.getInstance()
		this.certificateService = CertificateService.getInstance()
		this.templateService = TemplateService.getInstance()
		this.pdfGeneratorHandler = PdfGeneratorHandler.getInstance()

		this.loadCurriculumEntries = LoadCurriculumEntries.getInstance()
		this.resolveTemplate = ResolveTemplate.getInstance()
		this.assertCurriculumAccess = AssertCurriculumAccess.getInstance()
		this.resolveCurriculumPhoto = ResolveCurriculumPhoto.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new PdfGenerationService()
		return this.instance
	}

	// Renders a Curriculum's PDF on-demand (never persisted): loads the Curriculum and its
	// entries, resolves the requested (or default active) Template, and renders the buffer.
	// `user` is the caller injected by the auth middleware (requireAuth) - required.
	async generatePdf(config = {}) {
		const { id, body = {}, user } = config

		// Step 1: load the Curriculum, confirming it belongs to the caller unless they're admin
		// (404 either way for a non-admin, so a Curriculum that exists but belongs to someone else
		// is indistinguishable from one that doesn't exist at all)
		const curriculum = await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: id, user })

		// Step 2: load its Education/Experience/Certificate entries
		const entries = await this.loadCurriculumEntries.execute({
			educationService: this.educationService,
			experienceService: this.experienceService,
			certificateService: this.certificateService,
			curriculumId: id
		})

		// Step 3: resolve the requested Template, or the active default
		const template = await this.resolveTemplate.execute({
			templateService: this.templateService,
			templateId: body.template
		})

		// Step 4: read the stored photo file into image data the renderer can embed directly
		const photo = await this.resolveCurriculumPhoto.execute({ photo: curriculum.photo })

		// Step 5: render the PDF with the resolved design
		return await this.pdfGeneratorHandler.renderCurriculum({
			curriculum: { ...curriculum, ...entries, photo },
			templateKey: template.key
		})
	}
}

module.exports = PdfGenerationService
