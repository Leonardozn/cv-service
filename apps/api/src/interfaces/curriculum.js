const DataValidatorHandler = require('../handlers/dataValidator')
  
class CurriculumInterfaces {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	dataValidatorHandler

	/**
	 * @private
	 */
	createInterface

	/**
	 * @private
	 */
	updateInterface

	/**
	 * @private
	 */
	queryInterface

	/**
	 * @private
	 */
	virtualsInterface

	/**
	 * @private
	 */
	relationsInterface

	/**
	 * @private
	 */
	types

	constructor() {
		this.dataValidatorHandler = DataValidatorHandler.getInstance()
		this.types = this.dataValidatorHandler.getTypes()

		this.createInterface = this.dataValidatorHandler.validate({
			user: { type: this.types.string },
			fullName: { type: this.types.string },
			headline: { type: this.types.string },
			city: { type: this.types.string },
			photo: { type: this.types.string, optional: true },
			profileSummary: { type: this.types.string },
			skills: {
				type: this.types.array,
				contentType: this.types.string,
				optional: true
			},
			contactLinks: {
				type: this.types.array,
				contentType: this.types.object,
				structure: {
					label: { type: this.types.string },
					url: { type: this.types.string }
				},
				optional: true
			}
		})
  
		this.updateInterface = this.dataValidatorHandler.validate({
			user: { type: this.types.string, optional: true },
			fullName: { type: this.types.string, optional: true },
			headline: { type: this.types.string, optional: true },
			city: { type: this.types.string, optional: true },
			photo: { type: this.types.string, optional: true },
			profileSummary: { type: this.types.string, optional: true },
			skills: {
				type: this.types.array,
				contentType: this.types.string,
				optional: true
			},
			contactLinks: {
				type: this.types.array,
				contentType: this.types.object,
				structure: {
					label: { type: this.types.string, optional: true },
					url: { type: this.types.string, optional: true }
				},
				optional: true
			},
			createdAt: { type: this.types.datetime, optional: true },
			updatedAt: { type: this.types.datetime, optional: true }
		})
  
		this.queryInterface = this.dataValidatorHandler.validate({
			_id: { type: this.types.objectId, optional: true, transform: true, allowAdvance: true },
			user: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			fullName: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			headline: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			city: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			photo: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			profileSummary: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			skills: {
				type: this.types.array,
				contentType: this.types.string,
				optional: true
			},
			contactLinks: {
				type: this.types.array,
				contentType: this.types.object,
				structure: {
					label: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
					url: { type: this.types.string, optional: true, transform: true, allowAdvance: true }
				},
				optional: true
			},
			createdAt: { type: this.types.datetime, optional: true, transform: true },
			updatedAt: { type: this.types.datetime, optional: true, transform: true }
		})
  
		this.virtualsInterface = this.dataValidatorHandler.validate({
			_id: { type: this.types.string, optional: true, isVirtual: true },
			user: { type: this.types.string, optional: true, isVirtual: true },
			fullName: { type: this.types.string, optional: true, isVirtual: true },
			headline: { type: this.types.string, optional: true, isVirtual: true },
			city: { type: this.types.string, optional: true, isVirtual: true },
			photo: { type: this.types.string, optional: true, isVirtual: true },
			profileSummary: { type: this.types.string, optional: true, isVirtual: true },
			skills: {
				type: this.types.array,
				contentType: this.types.string,
				optional: true,
				canBeVirtual: true
			},
			contactLinks: {
				type: this.types.array,
				contentType: this.types.object,
				structure: {
					label: { type: this.types.string, optional: true, isVirtual: true },
					url: { type: this.types.string, optional: true, isVirtual: true }
				},
				optional: true,
				canBeVirtual: true
			},
			createdAt: { type: this.types.datetime, optional: true, isVirtual: true },
			updatedAt: { type: this.types.datetime, optional: true, isVirtual: true }
		})
  
		this.relationsInterface = this.dataValidatorHandler.validate({

		})
	}

	static getInstance() {
		if (!this.instance) this.instance = new CurriculumInterfaces()
		return this.instance
	}
	
	getCreateInterface() {
		return this.createInterface
	}

	getUpdateInterface() {
		return this.updateInterface
	}

	getQueryInterface() {
		return this.queryInterface
	}

	getVirtualsInterface() {
		return this.virtualsInterface
	}

	getRelationsInterface() {
		return this.relationsInterface
	}
}

module.exports = CurriculumInterfaces