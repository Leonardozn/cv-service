class LoadCurriculumEntries {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new LoadCurriculumEntries()
		return this.instance
	}

	// Loads a Curriculum's Education/Experience/Certificate entries (each already
	// contract-filtered by its own service), most recent first — the PDF lists a
	// curriculum's history newest-to-oldest, matching how cv-client already orders
	// these same entries in the editing UI.
	async execute({ educationService, experienceService, certificateService, curriculumId }) {
		const [education, experience, certificate] = await Promise.all([
			educationService.list({ query: { query: { curriculum: curriculumId }, sort: { field: 'startDate', type: -1 } } }),
			experienceService.list({ query: { query: { curriculum: curriculumId }, sort: { field: 'startDate', type: -1 } } }),
			certificateService.list({ query: { query: { curriculum: curriculumId }, sort: { field: 'date', type: -1 } } })
		])

		return {
			education: education.records,
			experience: experience.records,
			certificate: certificate.records
		}
	}
}

module.exports = LoadCurriculumEntries
