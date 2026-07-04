class SkillContract {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new SkillContract()
		return this.instance
	}

	getContract() {
		return {
			id: true,
			name: true,
			active: true,
		}
	}
}

module.exports = SkillContract
