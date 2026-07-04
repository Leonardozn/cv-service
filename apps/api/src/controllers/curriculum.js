const CurriculumManagementService = require('../services/curriculumManagement')
const PdfGenerationService = require('../services/pdfGeneration')
const HandleResponseHandler = require('../handlers/handleResponse')

class CurriculumController {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	handleResponseHandler

	constructor() {
		this.handleResponseHandler = HandleResponseHandler.getInstance()
		this.responseBody = this.handleResponseHandler.getResponseBody()

		this.curriculumManagementService = CurriculumManagementService.getInstance()
		this.pdfGenerationService = PdfGenerationService.getInstance()

		this.add = this.add.bind(this)
		this.findOne = this.findOne.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.replace = this.replace.bind(this)
		this.remove = this.remove.bind(this)
		this.generatePdf = this.generatePdf.bind(this)
	}

	static getInstance() {
		if (!this.instance) this.instance = new CurriculumController()
		return this.instance
	}

	async add(req, res) {
		try {
			// The Curriculum being saved is always the caller's own - never trust a client-supplied
			// `user`, always use the one the auth middleware resolved.
			const body = { ...req.body, user: req.user.id }
			const curriculum = await this.curriculumManagementService.save({ body, files: req.files })
			const response = this.handleResponseHandler.buildResponse(curriculum)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async findOne(req, res) {
		try {
			const curriculum = await this.curriculumManagementService.findOne({ id: req.params.id, user: req.user })
			const response = this.handleResponseHandler.buildResponse(curriculum)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async list(req, res) {
		try {
			const curriculum_list = await this.curriculumManagementService.list({ query: req.query, user: req.user })
			const response = this.handleResponseHandler.buildResponse(curriculum_list)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async update(req, res) {
		try {
			const curriculum = await this.curriculumManagementService.saveEntry({ body: req.body, id: req.params.id, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(curriculum)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async replace(req, res) {
		try {
			const curriculum = await this.curriculumManagementService.replaceEntry({ body: req.body, id: req.params.id, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(curriculum)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async remove(req, res) {
		try {
			const curriculum = await this.curriculumManagementService.removeEntry({ id: req.params.id, user: req.user })
			const response = this.handleResponseHandler.buildResponse(curriculum)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async generatePdf(req, res) {
		try {
			const buffer = await this.pdfGenerationService.generatePdf({ id: req.params.id, body: req.body, user: req.user })

			res.status(200).set('Content-Type', 'application/pdf').send(buffer)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
}

module.exports = CurriculumController