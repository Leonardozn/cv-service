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
	// contract-filtered by its own service).
	async execute({ educationService, experienceService, certificateService, curriculumId }) {
		const [education, experience, certificate] = await Promise.all([
			educationService.list({ query: { query: { curriculum: curriculumId } } }),
			experienceService.list({ query: { query: { curriculum: curriculumId } } }),
			certificateService.list({ query: { query: { curriculum: curriculumId } } })
		])

		return {
			education: education.records,
			experience: experience.records,
			certificate: certificate.records
		}
	}
}

module.exports = LoadCurriculumEntries
