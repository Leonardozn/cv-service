const CurriculumService = require('../services/curriculum')
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

	/**
	 * @private
	 */
	curriculumService

	constructor() {
		this.handleResponseHandler = HandleResponseHandler.getInstance()
		this.responseBody = this.handleResponseHandler.getResponseBody()

		this.curriculumService = CurriculumService.getInstance()
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
			const curriculum = await this.curriculumService.add({ body: req.body, files: req.files })
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
			const curriculum = await this.curriculumService.findOne({ id: req.params.id, query: req.query })
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
			const curriculum_list = await this.curriculumService.list({ query: req.query })
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
			const curriculum = await this.curriculumService.update({ body: req.body, id: req.params.id, files: req.files })
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
			const curriculum = await this.curriculumService.replace({ body: req.body, id: req.params.id, files: req.files })
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
			const curriculum = await this.curriculumService.remove({ id: req.params.id })
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
			const buffer = await this.pdfGenerationService.generatePdf({ id: req.params.id, body: req.body })

			res.status(200).set('Content-Type', 'application/pdf').send(buffer)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
}

module.exports = CurriculumController