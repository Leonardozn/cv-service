const ExperienceService = require('./experience')
const CurriculumService = require('./curriculum')
const { NotFoundError } = require('../handlers/handleErrors')
const AssertCurriculumAccess = require('./commands/assertCurriculumAccess')
const ResolveCurriculumScope = require('./commands/resolveCurriculumScope')

// Scopes Experience CRUD to the caller: a non-admin user may only act on entries under their own
// Curriculum (an admin may act on any). Multi-model (Experience + Curriculum), so this is its own
// exclusive service per arch-service-granularity, reusing ExperienceService's own methods as the
// last step of each action.
class ExperienceManagementService {
	/**
	 * @private
	 * @static
	 */
	instance

	constructor() {
		this.experienceService = ExperienceService.getInstance()
		this.curriculumService = CurriculumService.getInstance()
		this.assertCurriculumAccess = AssertCurriculumAccess.getInstance()
		this.resolveCurriculumScope = ResolveCurriculumScope.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new ExperienceManagementService()
		return this.instance
	}

	// POST /experience: confirms the referenced parent Curriculum belongs to the caller (unless admin).
	async add(config = {}) {
		const { body = {}, files = [], user } = config
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: body.curriculum, user })
		return await this.experienceService.add({ body, files })
	}

	// GET /experience/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async findOne(config = {}) {
		const { id, user } = config
		const experience = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: experience.curriculum, user })
		return experience
	}

	// GET /experience: an admin sees every entry; a non-admin user only entries under their own
	// Curriculum (at most one) - any client-supplied `curriculum` filter is overridden.
	async list(config = {}) {
		const { user, query = {} } = config
		const scope = await this.resolveCurriculumScope.execute({ curriculumService: this.curriculumService, user })
		if (!scope.scoped) return await this.experienceService.list({ query })
		if (!scope.curriculumId) return { count: 0, records: [] }

		const scopedQuery = { ...query, query: { ...(query.query || {}), curriculum: scope.curriculumId } }
		return await this.experienceService.list({ query: scopedQuery })
	}

	// PATCH /experience/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async update(config = {}) {
		const { id, body = {}, files = [], user } = config
		const experience = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: experience.curriculum, user })
		return await this.experienceService.update({ id, body, files })
	}

	// PUT /experience/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async replace(config = {}) {
		const { id, body = {}, files = [], user } = config
		const experience = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: experience.curriculum, user })
		return await this.experienceService.replace({ id, body, files })
	}

	// DELETE /experience/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async remove(config = {}) {
		const { id, user } = config
		const experience = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: experience.curriculum, user })
		return await this.experienceService.remove({ id })
	}

	/**
	 * @private
	 */
	async _findOrFail(id) {
		try {
			return await this.experienceService.findOne({ id })
		} catch {
			throw new NotFoundError('Experience not found.')
		}
	}
}

module.exports = ExperienceManagementService
