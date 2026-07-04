const { BadRequestError } = require('../../handlers/handleErrors')

class ResolveTemplate {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new ResolveTemplate()
		return this.instance
	}

	// Resolves the Template to render with: the requested id, or the active default when
	// none is given (today there is a single design, so the first active one is used).
	async execute({ templateService, templateId }) {
		if (templateId) return await templateService.findOne({ id: templateId })

		const activeTemplates = await templateService.list({ query: { query: { active: true }, size: 1, page: 1 } })
		const template = activeTemplates.records[0]
		if (!template) throw new BadRequestError('No active Template is configured.')

		return template
	}
}

module.exports = ResolveTemplate
