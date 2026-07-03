const ExperienceService = require('../services/experience')
const HandleResponseHandler = require('../handlers/handleResponse')

class ExperienceController {
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
	experienceService

	constructor() {
		this.handleResponseHandler = HandleResponseHandler.getInstance()
		this.responseBody = this.handleResponseHandler.getResponseBody()

		this.experienceService = ExperienceService.getInstance()

		this.add = this.add.bind(this)
		this.findOne = this.findOne.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.replace = this.replace.bind(this)
		this.remove = this.remove.bind(this)
	}

	static getInstance() {
		if (!this.instance) this.instance = new ExperienceController()
		return this.instance
	}

	async add(req, res) {
		try {
			const experience = await this.experienceService.add({ body: req.body, files: req.files })
			const response = this.handleResponseHandler.buildResponse(experience)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
	
	async findOne(req, res) {
		try {
			const experience = await this.experienceService.findOne({ id: req.params.id, query: req.query })
			const response = this.handleResponseHandler.buildResponse(experience)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)
			
			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
	
	async list(req, res) {
		try {
			const experience_list = await this.experienceService.list({ query: req.query })
			const response = this.handleResponseHandler.buildResponse(experience_list)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
	
	async update(req, res) {
		try {
			const experience = await this.experienceService.update({ body: req.body, id: req.params.id, files: req.files })
			const response = this.handleResponseHandler.buildResponse(experience)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async replace(req, res) {
		try {
			const experience = await this.experienceService.replace({ body: req.body, id: req.params.id, files: req.files })
			const response = this.handleResponseHandler.buildResponse(experience)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
	
	async remove(req, res) {
		try {
			const experience = await this.experienceService.remove({ id: req.params.id })
			const response = this.handleResponseHandler.buildResponse(experience)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)
	
			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
}

module.exports = ExperienceController