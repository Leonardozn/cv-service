class ResolveCurriculumScope {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new ResolveCurriculumScope()
		return this.instance
	}

	// Resolves how a caller's access to Curriculum-owned data (Education/Experience/Certificate
	// entries) should be scoped: an admin sees everything (scoped: false); a non-admin user is
	// limited to their own single Curriculum (scoped: true, curriculumId: <id>, or null if they
	// don't have one yet - in which case the caller should return an empty list rather than query).
	async execute({ curriculumService, user }) {
		if (user.role === 'admin') return { scoped: false }

		const result = await curriculumService.list({ query: { query: { user: user.id } } })
		const curriculum = result.records[0]
		return { scoped: true, curriculumId: curriculum ? curriculum.id : null }
	}
}

module.exports = ResolveCurriculumScope
