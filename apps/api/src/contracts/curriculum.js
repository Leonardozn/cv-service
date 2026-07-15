class CurriculumContract {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new CurriculumContract()
		return this.instance
	}

	getContract() {
		return {
			id: true,
			user: true,
			fullName: true,
			headline: true,
			city: true,
			state: true,
			country: true,
			photo: true,
			profileSummary: true,
			skills: true,
			phones: true,
			contactLinks: [{
				label: true,
				url: true,
			}],
		}
	}
}

module.exports = CurriculumContract
