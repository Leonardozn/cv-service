const { NotFoundError } = require('../../handlers/handleErrors')

class AssertCurriculumAccess {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new AssertCurriculumAccess()
		return this.instance
	}

	// Loads the Curriculum by id and confirms the caller may access it: an admin may act on any
	// Curriculum; a non-admin user only on their own. Throws NotFoundError otherwise - never
	// reveals whether a Curriculum exists for someone else, same treatment as a genuinely missing one.
	async execute({ curriculumService, curriculumId, user }) {
		let curriculum
		try {
			curriculum = await curriculumService.findOne({ id: curriculumId })
		} catch {
			throw new NotFoundError('Curriculum not found.')
		}

		if (user.role !== 'admin' && curriculum.user !== user.id) throw new NotFoundError('Curriculum not found.')
		return curriculum
	}
}

module.exports = AssertCurriculumAccess
