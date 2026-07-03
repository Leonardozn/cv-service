const ExperienceController = require('../controllers/experience')

/**
 * @openapi
 * tags:
 *   - name: Experience
 *     description: |
 *       CRUD of a Curriculum's work experience entries. Each entry references its parent
 *       Curriculum (`curriculum`). Not yet behind the auth middleware — ownership scoping (parent
 *       Curriculum belongs to the caller) is added when the auth middleware is wired in.
 *
 * /experience:
 *   post:
 *     tags: [Experience]
 *     summary: Create an Experience entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [curriculum, position, company, startDate, description]
 *             properties:
 *               curriculum: { type: string, description: "Parent Curriculum ObjectId" }
 *               position: { type: string }
 *               company: { type: string }
 *               location: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date, description: "Empty/omitted = current job" }
 *               description: { type: string }
 *           example: { curriculum: "665f1c2b8f1b2c0012a3b456", position: "Backend Engineer", company: "Acme Corp", location: "Remote", startDate: "2021-03-01", description: "Built and maintained payment services." }
 *     responses:
 *       200:
 *         description: Experience entry created
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", position: "Backend Engineer", company: "Acme Corp", location: "Remote", startDate: "2021-03-01", description: "Built and maintained payment services." } } } }
 *       400:
 *         description: |
 *           Validation error (missing/invalid field, including an invalid `curriculum` ObjectId).
 *           Observed against the running app for a request missing `curriculum`, `company`,
 *           `startDate` and `description`: both `message` and `content` become arrays.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: ["The value is not a valid ObjectId.", "Invalid input", "Required", "Invalid input"]
 *               statusCode: 400
 *               content:
 *                 - { code: custom, message: "The value is not a valid ObjectId.", path: [curriculum] }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [company], message: Required }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [startDate], message: Required }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [description], message: Required }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   get:
 *     tags: [Experience]
 *     summary: List Experience entries
 *     description: |
 *       Paginated list with filtering, operators, sorting and pagination.
 *         - Equality filter:  `query[field]=value`            (e.g. query[curriculum]=665f...)
 *         - Operator filter:  `query[field][operator]=value`  (e.g. query[company][like]=acme)
 *       Operators by type — curriculum (objectId): eq, ne, in, notIn, or; position/company/
 *       location/description (string): eq, ne, like, notLike, in, notIn, or; startDate/endDate
 *       (date): eq, ne, gt, gte, lt, lte, between, notBetween, in, notIn, or.
 *     parameters:
 *       - in: query
 *         name: query[field]
 *         schema: { type: string }
 *         description: Equality filter, e.g. `query[company]=Acme Corp`
 *       - in: query
 *         name: query[field][operator]
 *         schema: { type: string }
 *         description: Operator filter, e.g. `query[startDate][gte]=2021-01-01`
 *       - in: query
 *         name: sort[field]
 *         schema: { type: integer, enum: [1, -1] }
 *         description: Sort ascending (1) or descending (-1), e.g. `sort[startDate]=-1`
 *       - in: query
 *         name: size
 *         schema: { type: integer }
 *         description: Records per page
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: 1-based page number
 *       - in: query
 *         name: relations[curriculum]
 *         schema: { type: string }
 *         description: Populate the parent Curriculum (`relations[curriculum]=1`)
 *     responses:
 *       200:
 *         description: List retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Success!
 *               statusCode: 200
 *               content:
 *                 count: 1
 *                 records: [{ id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", position: "Backend Engineer", company: "Acme Corp", startDate: "2021-03-01", description: "Built and maintained payment services." }]
 *       400:
 *         description: Invalid filter, operator, or value type (e.g. an operator not supported by that field's type)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unrecognized key(s) in object: 'gte'"
 *               statusCode: 400
 *               content: { code: "unrecognized_keys", keys: ["gte"], path: ["position"], message: "Unrecognized key(s) in object: 'gte'" }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *
 * /experience/{id}:
 *   get:
 *     tags: [Experience]
 *     summary: Get an Experience entry by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Experience ObjectId
 *       - in: query
 *         name: relations[curriculum]
 *         schema: { type: string }
 *         description: Populate the parent Curriculum
 *     responses:
 *       200:
 *         description: Experience entry found
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", position: "Backend Engineer", company: "Acme Corp", startDate: "2021-03-01", description: "Built and maintained payment services." } } } }
 *       400:
 *         description: No Experience entry matches the given id (generated findOne raises BadRequestError; observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Experience not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when `id` is not a syntactically valid
 *           ObjectId — the cast throws outside the Zod/BadRequestError paths and surfaces as a
 *           generic 500.
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 *   put:
 *     tags: [Experience]
 *     summary: Replace an Experience entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Experience ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               curriculum: { type: string }
 *               position: { type: string }
 *               company: { type: string }
 *               location: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Experience entry replaced
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", position: "Senior Backend Engineer", company: "Acme Corp", startDate: "2021-03-01", endDate: "2023-06-01", description: "Led the payments platform migration." } } } }
 *       400:
 *         description: Validation error, or no Experience entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Experience not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   patch:
 *     tags: [Experience]
 *     summary: Update an Experience entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Experience ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate: { type: string, format: date }
 *               description: { type: string }
 *           example: { endDate: "2023-06-01" }
 *     responses:
 *       200:
 *         description: Experience entry updated
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", position: "Backend Engineer", company: "Acme Corp", startDate: "2021-03-01", endDate: "2023-06-01", description: "Built and maintained payment services." } } } }
 *       400:
 *         description: Validation error, or no Experience entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Experience not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   delete:
 *     tags: [Experience]
 *     summary: Delete an Experience entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Experience ObjectId
 *     responses:
 *       200:
 *         description: Experience entry deleted
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { deletedCount: 1 } } } }
 *       400:
 *         description: No Experience entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Experience not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 */
class ExperienceRouter {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	experienceController

	constructor() {
		this.experienceController = ExperienceController.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new ExperienceRouter()
		return this.instance
	}

	getRoutes() {
		return {
			modelPath: '/experience',
			paths: [
				{ requestMethod: 'post', path: '', controllerMethod: this.experienceController.add },
				{ requestMethod: 'get', path: '/:id', controllerMethod: this.experienceController.findOne },
				{ requestMethod: 'get', path: '', controllerMethod: this.experienceController.list },
				{ requestMethod: 'put', path: '/:id', controllerMethod: this.experienceController.replace },
				{ requestMethod: 'patch', path: '/:id', controllerMethod: this.experienceController.update },
				{ requestMethod: 'delete', path: '/:id', controllerMethod: this.experienceController.remove }
			]
		}
	}
}

module.exports = ExperienceRouter