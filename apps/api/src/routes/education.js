const EducationController = require('../controllers/education')

/**
 * @openapi
 * tags:
 *   - name: Education
 *     description: |
 *       CRUD of a Curriculum's education entries. Each entry references its parent Curriculum
 *       (`curriculum`). Not yet behind the auth middleware — ownership scoping (parent Curriculum
 *       belongs to the caller) is added when the auth middleware is wired in.
 *
 * /education:
 *   post:
 *     tags: [Education]
 *     summary: Create an Education entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [curriculum, title, institution, startDate]
 *             properties:
 *               curriculum: { type: string, description: "Parent Curriculum ObjectId" }
 *               title: { type: string }
 *               institution: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date, description: "Empty/omitted = in progress" }
 *           example: { curriculum: "665f1c2b8f1b2c0012a3b456", title: "B.Sc. Computer Science", institution: "Universidad Nacional", startDate: "2016-01-15" }
 *     responses:
 *       200:
 *         description: Education entry created
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", title: "B.Sc. Computer Science", institution: "Universidad Nacional", startDate: "2016-01-15" } } } }
 *       400:
 *         description: |
 *           Validation error (missing/invalid field, including an invalid `curriculum` ObjectId).
 *           Observed against the running app for a request missing `curriculum`, `institution`
 *           and `startDate`: both `message` and `content` become arrays.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: ["The value is not a valid ObjectId.", "Invalid input", "Required"]
 *               statusCode: 400
 *               content:
 *                 - { code: custom, message: "The value is not a valid ObjectId.", path: [curriculum] }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [institution], message: Required }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [startDate], message: Required }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   get:
 *     tags: [Education]
 *     summary: List Education entries
 *     description: |
 *       Paginated list with filtering, operators, sorting and pagination.
 *         - Equality filter:  `query[field]=value`            (e.g. query[curriculum]=665f...)
 *         - Operator filter:  `query[field][operator]=value`  (e.g. query[startDate][gte]=2016-01-01)
 *       Operators by type — curriculum (objectId): eq, ne, in, notIn, or; title/institution
 *       (string): eq, ne, like, notLike, in, notIn, or; startDate/endDate (date): eq, ne, gt, gte,
 *       lt, lte, between, notBetween, in, notIn, or.
 *     parameters:
 *       - in: query
 *         name: query[field]
 *         schema: { type: string }
 *         description: Equality filter, e.g. `query[curriculum]=665f1c2b8f1b2c0012a3b456`
 *       - in: query
 *         name: query[field][operator]
 *         schema: { type: string }
 *         description: Operator filter, e.g. `query[startDate][between]=2016-01-01,2020-01-01`
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
 *                 records: [{ id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", title: "B.Sc. Computer Science", institution: "Universidad Nacional", startDate: "2016-01-15" }]
 *       400:
 *         description: Invalid filter, operator, or value type (e.g. an operator not supported by that field's type)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unrecognized key(s) in object: 'gte'"
 *               statusCode: 400
 *               content: { code: "unrecognized_keys", keys: ["gte"], path: ["title"], message: "Unrecognized key(s) in object: 'gte'" }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *
 * /education/{id}:
 *   get:
 *     tags: [Education]
 *     summary: Get an Education entry by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Education ObjectId
 *       - in: query
 *         name: relations[curriculum]
 *         schema: { type: string }
 *         description: Populate the parent Curriculum
 *     responses:
 *       200:
 *         description: Education entry found
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", title: "B.Sc. Computer Science", institution: "Universidad Nacional", startDate: "2016-01-15" } } } }
 *       400:
 *         description: No Education entry matches the given id (generated findOne raises BadRequestError; observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Education not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when `id` is not a syntactically valid
 *           ObjectId — the cast throws outside the Zod/BadRequestError paths and surfaces as a
 *           generic 500.
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 *   put:
 *     tags: [Education]
 *     summary: Replace an Education entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Education ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               curriculum: { type: string }
 *               title: { type: string }
 *               institution: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Education entry replaced
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", title: "M.Sc. Software Engineering", institution: "Universidad Nacional", startDate: "2020-02-01" } } } }
 *       400:
 *         description: Validation error, or no Education entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Education not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   patch:
 *     tags: [Education]
 *     summary: Update an Education entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Education ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               institution: { type: string }
 *               endDate: { type: string, format: date }
 *           example: { endDate: "2020-01-30" }
 *     responses:
 *       200:
 *         description: Education entry updated
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", title: "B.Sc. Computer Science", institution: "Universidad Nacional", startDate: "2016-01-15", endDate: "2020-01-30" } } } }
 *       400:
 *         description: Validation error, or no Education entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Education not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   delete:
 *     tags: [Education]
 *     summary: Delete an Education entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Education ObjectId
 *     responses:
 *       200:
 *         description: Education entry deleted
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { deletedCount: 1 } } } }
 *       400:
 *         description: No Education entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Education not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 */
class EducationRouter {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	educationController

	constructor() {
		this.educationController = EducationController.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new EducationRouter()
		return this.instance
	}

	getRoutes() {
		return {
			modelPath: '/education',
			paths: [
				{ requestMethod: 'post', path: '', controllerMethod: this.educationController.add },
				{ requestMethod: 'get', path: '/:id', controllerMethod: this.educationController.findOne },
				{ requestMethod: 'get', path: '', controllerMethod: this.educationController.list },
				{ requestMethod: 'put', path: '/:id', controllerMethod: this.educationController.replace },
				{ requestMethod: 'patch', path: '/:id', controllerMethod: this.educationController.update },
				{ requestMethod: 'delete', path: '/:id', controllerMethod: this.educationController.remove }
			]
		}
	}
}

module.exports = EducationRouter