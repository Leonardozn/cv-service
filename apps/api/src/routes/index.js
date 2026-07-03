const CertificateRouter = require('./certificate')
const ExperienceRouter = require('./experience')
const EducationRouter = require('./education')
const CurriculumRouter = require('./curriculum')
const HealthRouter = require('./health')

class Routes {	/**
	 * @private
   */
	certificateRouter

	/**
	 * @private
   */
	experienceRouter

	/**
	 * @private
   */
	educationRouter

	/**
	 * @private
   */
	curriculumRouter


	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	healthRouter

	constructor() {
		this.healthRouter = HealthRouter.getInstance().getRoutes()
		this.curriculumRouter = CurriculumRouter.getInstance().getRoutes()
		this.educationRouter = EducationRouter.getInstance().getRoutes()
		this.experienceRouter = ExperienceRouter.getInstance().getRoutes()
		this.certificateRouter = CertificateRouter.getInstance().getRoutes()
	}

	static getInstance() {
		if (!this.instance) this.instance = new Routes()
		return this.instance
	}

	getRoutes() {
		return {
			certificateRouter: this.certificateRouter,
			experienceRouter: this.experienceRouter,
			educationRouter: this.educationRouter,
			curriculumRouter: this.curriculumRouter,
			healthRouter: this.healthRouter
		}
	}
}

module.exports = Routes