const EducationManagementService = require('../services/educationManagement')
const HandleResponseHandler = require('../handlers/handleResponse')

class EducationController {
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

		this.educationManagementService = EducationManagementService.getInstance()

		this.add = this.add.bind(this)
		this.findOne = this.findOne.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.replace = this.replace.bind(this)
		this.remove = this.remove.bind(this)
	}

	static getInstance() {
		if (!this.instance) this.instance = new EducationController()
		return this.instance
	}

	async add(req, res) {
		try {
			const education = await this.educationManagementService.add({ body: req.body, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(education)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async findOne(req, res) {
		try {
			const education = await this.educationManagementService.findOne({ id: req.params.id, user: req.user })
			const response = this.handleResponseHandler.buildResponse(education)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async list(req, res) {
		try {
			const education_list = await this.educationManagementService.list({ query: req.query, user: req.user })
			const response = this.handleResponseHandler.buildResponse(education_list)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async update(req, res) {
		try {
			const education = await this.educationManagementService.update({ body: req.body, id: req.params.id, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(education)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async replace(req, res) {
		try {
			const education = await this.educationManagementService.replace({ body: req.body, id: req.params.id, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(education)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async remove(req, res) {
		try {
			const education = await this.educationManagementService.remove({ id: req.params.id, user: req.user })
			const response = this.handleResponseHandler.buildResponse(education)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
}

module.exports = EducationController
