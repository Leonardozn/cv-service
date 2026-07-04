const React = require('react')
const { Document, renderToBuffer } = require('@react-pdf/renderer')
const ClassicTwoColumns = require('./templates/classicTwoColumns')

// Registry of react-pdf design components, keyed by the Template model's `key` field.
const TEMPLATES = {
	'classic-two-columns': ClassicTwoColumns
}

class PdfGenerator {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new PdfGenerator()
		return this.instance
	}

	// Keys of every design this package knows how to render (matches Template.key).
	getTemplateKeys() {
		return Object.keys(TEMPLATES)
	}

	// Renders a Curriculum (with its Education/Experience/Certificate entries already
	// attached) into a PDF buffer, using the design registered under `templateKey`.
	// `curriculum.photo`, if present, must already be a usable react-pdf `Image` src
	// (an absolute path or URL) - resolving the stored filename to that src is the caller's job.
	async renderCurriculum(config = {}) {
		const { curriculum, templateKey } = config
		const Template = TEMPLATES[templateKey]
		if (!Template) throw new Error(`Unknown CV template key: '${templateKey}'.`)

		const document = React.createElement(Document, null, React.createElement(Template, { curriculum }))
		return await renderToBuffer(document)
	}
}

module.exports = PdfGenerator
