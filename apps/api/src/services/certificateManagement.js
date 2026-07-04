const CertificateService = require('./certificate')
const CurriculumService = require('./curriculum')
const { NotFoundError } = require('../handlers/handleErrors')
const AssertCurriculumAccess = require('./commands/assertCurriculumAccess')
const ResolveCurriculumScope = require('./commands/resolveCurriculumScope')

// Scopes Certificate CRUD to the caller: a non-admin user may only act on entries under their own
// Curriculum (an admin may act on any). Multi-model (Certificate + Curriculum), so this is its own
// exclusive service per arch-service-granularity, reusing CertificateService's own methods as the
// last step of each action.
class CertificateManagementService {
	/**
	 * @private
	 * @static
	 */
	instance

	constructor() {
		this.certificateService = CertificateService.getInstance()
		this.curriculumService = CurriculumService.getInstance()
		this.assertCurriculumAccess = AssertCurriculumAccess.getInstance()
		this.resolveCurriculumScope = ResolveCurriculumScope.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new CertificateManagementService()
		return this.instance
	}

	// POST /certificate: confirms the referenced parent Curriculum belongs to the caller (unless admin).
	async add(config = {}) {
		const { body = {}, files = [], user } = config
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: body.curriculum, user })
		return await this.certificateService.add({ body, files })
	}

	// GET /certificate/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async findOne(config = {}) {
		const { id, user } = config
		const certificate = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: certificate.curriculum, user })
		return certificate
	}

	// GET /certificate: an admin sees every entry; a non-admin user only entries under their own
	// Curriculum (at most one) - any client-supplied `curriculum` filter is overridden.
	async list(config = {}) {
		const { user, query = {} } = config
		const scope = await this.resolveCurriculumScope.execute({ curriculumService: this.curriculumService, user })
		if (!scope.scoped) return await this.certificateService.list({ query })
		if (!scope.curriculumId) return { count: 0, records: [] }

		const scopedQuery = { ...query, query: { ...(query.query || {}), curriculum: scope.curriculumId } }
		return await this.certificateService.list({ query: scopedQuery })
	}

	// PATCH /certificate/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async update(config = {}) {
		const { id, body = {}, files = [], user } = config
		const certificate = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: certificate.curriculum, user })
		return await this.certificateService.update({ id, body, files })
	}

	// PUT /certificate/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async replace(config = {}) {
		const { id, body = {}, files = [], user } = config
		const certificate = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: certificate.curriculum, user })
		return await this.certificateService.replace({ id, body, files })
	}

	// DELETE /certificate/:id: confirms the entry's parent Curriculum belongs to the caller (unless admin).
	async remove(config = {}) {
		const { id, user } = config
		const certificate = await this._findOrFail(id)
		await this.assertCurriculumAccess.execute({ curriculumService: this.curriculumService, curriculumId: certificate.curriculum, user })
		return await this.certificateService.remove({ id })
	}

	/**
	 * @private
	 */
	async _findOrFail(id) {
		try {
			return await this.certificateService.findOne({ id })
		} catch {
			throw new NotFoundError('Certificate not found.')
		}
	}
}

module.exports = CertificateManagementService
