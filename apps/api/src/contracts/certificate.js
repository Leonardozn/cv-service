class CertificateContract {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new CertificateContract()
		return this.instance
	}

	getContract() {
		return {
			id: true,
			curriculum: true,
			name: true,
			date: true,
		}
	}
}

module.exports = CertificateContract
