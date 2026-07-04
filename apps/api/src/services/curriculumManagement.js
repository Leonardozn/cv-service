const CurriculumService = require('./curriculum')
const SkillService = require('./skill')
const DbConnectionHandler = require('../handlers/dbConnections')
const UpsertCurriculum = require('./commands/upsertCurriculum')
const RegisterNewSkills = require('./commands/registerNewSkills')

class CurriculumManagementService {
	/**
	 * @private
	 * @static
	 */
	instance

	constructor() {
		this.curriculumService = CurriculumService.getInstance()
		this.skillService = SkillService.getInstance()
		this.dbConnectionHandler = DbConnectionHandler.getInstance()

		this.upsertCurriculum = UpsertCurriculum.getInstance()
		this.registerNewSkills = RegisterNewSkills.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new CurriculumManagementService()
		return this.instance
	}

	// POST /curriculum: creates the user's first Curriculum, or updates their existing one
	// (max one per user), then auto-registers any new skill named in the submitted list.
	async save(config = {}) {
		const { body = {}, files = [] } = config

		return await this._withTransaction(async (session) => {
			// Step 1: create the user's first Curriculum, or update their existing one
			const curriculum = await this.upsertCurriculum.execute({ curriculumService: this.curriculumService, body, files, session })
			// Step 2: auto-register any skill from the submitted list not already in the catalog
			await this.registerNewSkills.execute({ skillService: this.skillService, skills: body.skills, session })

			return curriculum
		})
	}

	// PATCH /curriculum/:id: updates the given Curriculum, then auto-registers any new skill
	// named in the submitted list (same catalog rule as save()).
	async saveEntry(config = {}) {
		const { id, body = {}, files = [] } = config

		return await this._withTransaction(async (session) => {
			// Step 1: update the Curriculum
			const curriculum = await this.curriculumService.update({ id, body, files, options: { session } })
			// Step 2: auto-register any skill from the submitted list not already in the catalog
			await this.registerNewSkills.execute({ skillService: this.skillService, skills: body.skills, session })

			return curriculum
		})
	}

	/**
	 * @private
	 */
	async _withTransaction(fn) {
		const { cvMongodb } = this.dbConnectionHandler.getConnection()
		const session = await cvMongodb.startSession()

		let result
		try {
			await session.withTransaction(async () => {
				result = await fn(session)
			})
		} finally {
			session.endSession()
		}

		return result
	}
}

module.exports = CurriculumManagementService
