class UpsertCurriculum {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new UpsertCurriculum()
		return this.instance
	}

	// Creates the user's first Curriculum, or updates the existing one - max one per user
	// (Curriculum.user is unique).
	async execute({ curriculumService, body = {}, files = [], session }) {
		const existing = await curriculumService.list({ query: { query: { user: body.user } }, options: { session } })
		const current = existing.records[0]

		if (current) return await curriculumService.update({ id: current.id, body, files, options: { session } })
		return await curriculumService.add({ body, files, options: { session } })
	}
}

module.exports = UpsertCurriculum
