class EducationContract {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new EducationContract()
		return this.instance
	}

	getContract() {
		return {
			id: true,
			curriculum: true,
			title: true,
			institution: true,
			startDate: true,
			endDate: true,
		}
	}
}

module.exports = EducationContract
