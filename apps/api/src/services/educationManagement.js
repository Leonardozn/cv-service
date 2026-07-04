const EducationService = require('./education')
const CurriculumService = require('./curriculum')
const { NotFoundError } = require('../handlers/handleErrors')
const AssertCurriculumAccess = require('./commands/assertCurriculumAccess')
const ResolveCurriculumScope = require('./commands/resolveCurriculumScope')

// Scopes Education CRUD to the caller: a non-admin user may only act on entries under their own
// Curriculum (an admin may act on any). Multi-model (Education + Curriculum), so this is its own
// exclusive service per arch-service-granularity, reusing EducationService's own methods as the
// last step of each action.
class EducationManagementService {
	/**
	 * @private
	 * @static
	 */
	instance

	constructor() {
		this.educationService = EducationService.getInstance()
		this.curriculumService = CurriculumService.getInstance()
		this.assertCurriculumAccess = AssertCurriculumAccess.getInstance()
		this.resolveCurriculumScope = ResolveCurriculumScope.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new EducationManagementService()
		return this.instance
	}

	// POST /education: confirms the referenced parent Curriculum belongs to the caller (unless admin).
	async add(config = {}) {
		const { body = {}, files = [], user } = config
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: body.curriculum, user })
		return await this.educationService.add({ body, files })
	}

	// GET /education/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async findOne(config = {}) {
		const { id, user } = config
		const education = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: education.curriculum, user })
		return education
	}

	// GET /education: an admin sees every entry; a non-admin user only entries under their own
	// Curriculum (at most one) - any client-supplied `curriculum` filter is overridden.
	async list(config = {}) {
		const { user, query = {} } = config
		const scope = await this.resolveCurriculumScope.execute({ curriculumService: this.curriculumService, user })
		if (!scope.scoped) return await this.educationService.list({ query })
		if (!scope.curriculumId) return { count: 0, records: [] }

		const scopedQuery = { ...query, query: { ...(query.query || {}), curriculum: scope.curriculumId } }
		return await this.educationService.list({ query: scopedQuery })
	}

	// PATCH /education/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async update(config = {}) {
		const { id, body = {}, files = [], user } = config
		const education = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: education.curriculum, user })
		return await this.educationService.update({ id, body, files })
	}

	// PUT /education/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async replace(config = {}) {
		const { id, body = {}, files = [], user } = config
		const education = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: education.curriculum, user })
		return await this.educationService.replace({ id, body, files })
	}

	// DELETE /education/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async remove(config = {}) {
		const { id, user } = config
		const education = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: education.curriculum, user })
		return await this.educationService.remove({ id })
	}

	/**
	 * @private
	 */
	async _findOrFail(id) {
		try {
			return await this.educationService.findOne({ id })
		} catch {
			throw new NotFoundError('Education not found.')
		}
	}
}

module.exports = EducationManagementService
