const DataValidatorHandler = require('../handlers/dataValidator')
  
class ExperienceInterfaces {
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
			curriculum: { type: this.types.objectId },
			position: { type: this.types.string },
			company: { type: this.types.string },
			location: { type: this.types.string, optional: true },
			startDate: { type: this.types.date },
			endDate: { type: this.types.date, optional: true },
			description: { type: this.types.string }
		})
  
		this.updateInterface = this.dataValidatorHandler.validate({
			curriculum: { type: this.types.objectId, optional: true },
			position: { type: this.types.string, optional: true },
			company: { type: this.types.string, optional: true },
			location: { type: this.types.string, optional: true },
			startDate: { type: this.types.date, optional: true },
			endDate: { type: this.types.date, optional: true },
			description: { type: this.types.string, optional: true },
			createdAt: { type: this.types.datetime, optional: true },
			updatedAt: { type: this.types.datetime, optional: true }
		})
  
		this.queryInterface = this.dataValidatorHandler.validate({
			_id: { type: this.types.objectId, optional: true, transform: true, allowAdvance: true },
			curriculum: { type: this.types.objectId, optional: true, transform: true, allowAdvance: true },
			position: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			company: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			location: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			startDate: { type: this.types.date, optional: true, transform: true, allowAdvance: true },
			endDate: { type: this.types.date, optional: true, transform: true, allowAdvance: true },
			description: { type: this.types.string, optional: true, transform: true, allowAdvance: true },
			createdAt: { type: this.types.datetime, optional: true, transform: true },
			updatedAt: { type: this.types.datetime, optional: true, transform: true }
		})
  
		this.virtualsInterface = this.dataValidatorHandler.validate({
			_id: { type: this.types.string, optional: true, isVirtual: true },
			curriculum: { type: this.types.objectId, optional: true, isVirtual: true },
			position: { type: this.types.string, optional: true, isVirtual: true },
			company: { type: this.types.string, optional: true, isVirtual: true },
			location: { type: this.types.string, optional: true, isVirtual: true },
			startDate: { type: this.types.date, optional: true, isVirtual: true },
			endDate: { type: this.types.date, optional: true, isVirtual: true },
			description: { type: this.types.string, optional: true, isVirtual: true },
			createdAt: { type: this.types.datetime, optional: true, isVirtual: true },
			updatedAt: { type: this.types.datetime, optional: true, isVirtual: true }
		})
  
		this.relationsInterface = this.dataValidatorHandler.validate({
			curriculum: { type: this.types.string, optional: true, isVirtual: true }
		})
	}

	static getInstance() {
		if (!this.instance) this.instance = new ExperienceInterfaces()
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

module.exports = ExperienceInterfaces