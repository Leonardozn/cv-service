const CurriculumService = require('./curriculum')
const SkillService = require('./skill')
const DbConnectionHandler = require('../handlers/dbConnections')
const UpsertCurriculum = require('./commands/upsertCurriculum')
const RegisterNewSkills = require('./commands/registerNewSkills')
const AssertCurriculumAccess = require('./commands/assertCurriculumAccess')

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
		this.assertCurriculumAccess = AssertCurriculumAccess.getInstance()
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

	// PATCH /curriculum/:id: confirms the Curriculum belongs to the caller (unless admin), updates
	// it, then auto-registers any new skill named in the submitted list (same catalog rule as save()).
	async saveEntry(config = {}) {
		const { id, body = {}, files = [], user } = config
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: id, user })

		return await this._withTransaction(async (session) => {
			// Step 1: update the Curriculum
			const curriculum = await this.curriculumService.update({ id, body, files, options: { session } })
			// Step 2: auto-register any skill from the submitted list not already in the catalog
			await this.registerNewSkills.execute({ skillService: this.skillService, skills: body.skills, session })

			return curriculum
		})
	}

	// GET /curriculum/:id: an admin may read any Curriculum; a non-admin user only their own.
	async findOne(config = {}) {
		const { id, user } = config
		return await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: id, user })
	}

	// GET /curriculum: an admin sees every Curriculum; a non-admin user only their own (at most
	// one, per the unique `user` field) - any client-supplied `user` filter is overridden.
	async list(config = {}) {
		const { user, query = {} } = config
		if (user.role === 'admin') return await this.curriculumService.list({ query })

		const scopedQuery = { ...query, query: { ...(query.query || {}), user: user.id } }
		return await this.curriculumService.list({ query: scopedQuery })
	}

	// PUT /curriculum/:id: confirms the Curriculum belongs to the caller (unless admin), then replaces it.
	async replaceEntry(config = {}) {
		const { id, body = {}, files = [], user } = config
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: id, user })
		return await this.curriculumService.replace({ id, body, files })
	}

	// DELETE /curriculum/:id: confirms the Curriculum belongs to the caller (unless admin), then removes it.
	async removeEntry(config = {}) {
		const { id, user } = config
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: id, user })
		return await this.curriculumService.remove({ id })
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
