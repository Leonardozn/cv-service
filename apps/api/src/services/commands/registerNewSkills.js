class RegisterNewSkills {
	/**
	 * @private
	 * @static
	 */
	instance

	static getInstance() {
		if (!this.instance) this.instance = new RegisterNewSkills()
		return this.instance
	}

	// Adds an active Skill catalog entry for each name in `skills` that isn't there yet.
	async execute({ skillService, skills = [], session }) {
		if (!skills.length) return []

		const existing = await skillService.list({ query: { query: { name: { in: skills } } }, options: { session } })
		const existingNames = new Set(existing.records.map(record => record.name))
		const missingNames = skills.filter(name => !existingNames.has(name))

		const created = []
		for (const name of missingNames) {
			created.push(await skillService.add({ body: { name, active: true }, options: { session } }))
		}

		return created
	}
}

module.exports = RegisterNewSkills
