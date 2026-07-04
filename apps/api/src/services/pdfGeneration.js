const path = require('path')
const CurriculumService = require('./curriculum')
const EducationService = require('./education')
const ExperienceService = require('./experience')
const CertificateService = require('./certificate')
const TemplateService = require('./template')
const PdfGeneratorHandler = require('../handlers/pdfGenerator')
const envVariables = require('../handlers/envVariables')
const { NotFoundError } = require('../handlers/handleErrors')
const LoadCurriculumEntries = require('./commands/loadCurriculumEntries')
const ResolveTemplate = require('./commands/resolveTemplate')

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
	}

	static getInstance() {
		if (!this.instance) this.instance = new PdfGenerationService()
		return this.instance
	}

	// Renders a Curriculum's PDF on-demand (never persisted): loads the Curriculum and its
	// entries, resolves the requested (or default active) Template, and renders the buffer.
	async generatePdf(config = {}) {
		const { id, body = {} } = config

		// Step 1: load the Curriculum (404 when no Curriculum exists with this id)
		const curriculum = await this._findCurriculumOrFail(id)

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

		// Step 4: render the PDF with the resolved design
		return await this.pdfGeneratorHandler.renderCurriculum({
			curriculum: { ...curriculum, ...entries, photo: this._resolvePhotoPath(curriculum.photo) },
			templateKey: template.key
		})
	}

	/**
	 * @private
	 */
	async _findCurriculumOrFail(id) {
		try {
			return await this.curriculumService.findOne({ id })
		} catch {
			throw new NotFoundError('Curriculum not found.')
		}
	}

	/**
	 * @private
	 */
	_resolvePhotoPath(photo) {
		if (!photo) return undefined
		const destinationPath = envVariables.API_UPLOAD_PATH || path.join(process.cwd(), 'api-uploads')
		return path.join(destinationPath, photo)
	}
}

module.exports = PdfGenerationService
