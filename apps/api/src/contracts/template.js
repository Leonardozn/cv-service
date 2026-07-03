class TemplateContract {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new TemplateContract()
		return this.instance
	}

	getContract() {
		return {
			name: true,
			key: true,
			description: true,
			active: true,
		}
	}
}

module.exports = TemplateContract
