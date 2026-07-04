const CertificateManagementService = require('../services/certificateManagement')
const HandleResponseHandler = require('../handlers/handleResponse')

class CertificateController {
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

		this.certificateManagementService = CertificateManagementService.getInstance()

		this.add = this.add.bind(this)
		this.findOne = this.findOne.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.replace = this.replace.bind(this)
		this.remove = this.remove.bind(this)
	}

	static getInstance() {
		if (!this.instance) this.instance = new CertificateController()
		return this.instance
	}

	async add(req, res) {
		try {
			const certificate = await this.certificateManagementService.add({ body: req.body, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(certificate)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async findOne(req, res) {
		try {
			const certificate = await this.certificateManagementService.findOne({ id: req.params.id, user: req.user })
			const response = this.handleResponseHandler.buildResponse(certificate)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async list(req, res) {
		try {
			const certificate_list = await this.certificateManagementService.list({ query: req.query, user: req.user })
			const response = this.handleResponseHandler.buildResponse(certificate_list)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async update(req, res) {
		try {
			const certificate = await this.certificateManagementService.update({ body: req.body, id: req.params.id, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(certificate)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async replace(req, res) {
		try {
			const certificate = await this.certificateManagementService.replace({ body: req.body, id: req.params.id, files: req.files, user: req.user })
			const response = this.handleResponseHandler.buildResponse(certificate)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}

	async remove(req, res) {
		try {
			const certificate = await this.certificateManagementService.remove({ id: req.params.id, user: req.user })
			const response = this.handleResponseHandler.buildResponse(certificate)

			res.status(response[this.responseBody.STATUS]).json(response)
		} catch (error) {
			console.error(error)
			const response = this.handleResponseHandler.buildResponse(error)

			res.status(response[this.responseBody.STATUS]).json(response)
		}
	}
}

module.exports = CertificateController
