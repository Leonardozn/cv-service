const { CvMongodb } = require('@cv-service/db-connections')

class DbConnectionHandler {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	cvMongodb

	constructor() {
		this.cvMongodb = CvMongodb
	}

	static getInstance() {
		if (!this.instance) this.instance = new DbConnectionHandler()
		return this.instance
	}

	/**
	 * @returns {object} - Databases connections.
	 */
	getConnection() {
		return {
			cvMongodb: this.cvMongodb
		}
	}
}

module.exports = DbConnectionHandler