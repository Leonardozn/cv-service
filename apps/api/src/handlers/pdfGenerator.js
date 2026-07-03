const PdfGenerator = require('@cv-service/pdf-generator')

class PdfGeneratorHandler {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	pdfGenerator

	constructor() {
		this.pdfGenerator = PdfGenerator.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new PdfGeneratorHandler()
		return this.instance
	}

	getTemplateKeys() {
		return this.pdfGenerator.getTemplateKeys()
	}

	async renderCurriculum(config = {}) {
		return await this.pdfGenerator.renderCurriculum(config)
	}
}

module.exports = PdfGeneratorHandler
