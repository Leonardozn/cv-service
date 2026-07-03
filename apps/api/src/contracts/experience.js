class ExperienceContract {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new ExperienceContract()
		return this.instance
	}

	getContract() {
		return {
			curriculum: true,
			position: true,
			company: true,
			location: true,
			startDate: true,
			endDate: true,
			description: true,
		}
	}
}

module.exports = ExperienceContract
