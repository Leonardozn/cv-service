const CertificateController = require('../controllers/certificate')

/**
 * @openapi
 * tags:
 *   - name: Certificate
 *     description: |
 *       CRUD of a Curriculum's certificate entries. Each entry references its parent Curriculum
 *       (`curriculum`). Not yet behind the auth middleware — ownership scoping (parent Curriculum
 *       belongs to the caller) is added when the auth middleware is wired in.
 *
 * /certificate:
 *   post:
 *     tags: [Certificate]
 *     summary: Create a Certificate entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [curriculum, name, date]
 *             properties:
 *               curriculum: { type: string, description: "Parent Curriculum ObjectId" }
 *               name: { type: string }
 *               date: { type: string, format: date }
 *           example: { curriculum: "665f1c2b8f1b2c0012a3b456", name: "AWS Certified Developer", date: "2022-09-10" }
 *     responses:
 *       200:
 *         description: Certificate entry created
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", name: "AWS Certified Developer", date: "2022-09-10" } } } }
 *       400:
 *         description: |
 *           Validation error (missing/invalid field, including an invalid `curriculum` ObjectId).
 *           Observed against the running app for a request missing `curriculum` and `date`: both
 *           `message` and `content` become arrays.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: ["The value is not a valid ObjectId.", "Required"]
 *               statusCode: 400
 *               content:
 *                 - { code: custom, message: "The value is not a valid ObjectId.", path: [curriculum] }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [date], message: Required }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   get:
 *     tags: [Certificate]
 *     summary: List Certificate entries
 *     description: |
 *       Paginated list with filtering, operators, sorting and pagination.
 *         - Equality filter:  `query[field]=value`            (e.g. query[curriculum]=665f...)
 *         - Operator filter:  `query[field][operator]=value`  (e.g. query[name][like]=aws)
 *       Operators by type — curriculum (objectId): eq, ne, in, notIn, or; name (string): eq, ne,
 *       like, notLike, in, notIn, or; date (date): eq, ne, gt, gte, lt, lte, between, notBetween,
 *       in, notIn, or.
 *     parameters:
 *       - in: query
 *         name: query[field]
 *         schema: { type: string }
 *         description: Equality filter, e.g. `query[name]=AWS Certified Developer`
 *       - in: query
 *         name: query[field][operator]
 *         schema: { type: string }
 *         description: Operator filter, e.g. `query[date][gte]=2022-01-01`
 *       - in: query
 *         name: sort[field]
 *         schema: { type: integer, enum: [1, -1] }
 *         description: Sort ascending (1) or descending (-1), e.g. `sort[date]=-1`
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
 *                 records: [{ id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", name: "AWS Certified Developer", date: "2022-09-10" }]
 *       400:
 *         description: Invalid filter, operator, or value type (e.g. an operator not supported by that field's type)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unrecognized key(s) in object: 'gte'"
 *               statusCode: 400
 *               content: { code: "unrecognized_keys", keys: ["gte"], path: ["name"], message: "Unrecognized key(s) in object: 'gte'" }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *
 * /certificate/{id}:
 *   get:
 *     tags: [Certificate]
 *     summary: Get a Certificate entry by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certificate ObjectId
 *       - in: query
 *         name: relations[curriculum]
 *         schema: { type: string }
 *         description: Populate the parent Curriculum
 *     responses:
 *       200:
 *         description: Certificate entry found
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", name: "AWS Certified Developer", date: "2022-09-10" } } } }
 *       400:
 *         description: No Certificate entry matches the given id (generated findOne raises BadRequestError; observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Certificate not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when `id` is not a syntactically valid
 *           ObjectId — the cast throws outside the Zod/BadRequestError paths and surfaces as a
 *           generic 500.
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 *   put:
 *     tags: [Certificate]
 *     summary: Replace a Certificate entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certificate ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               curriculum: { type: string }
 *               name: { type: string }
 *               date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Certificate entry replaced
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", name: "AWS Certified Solutions Architect", date: "2023-05-20" } } } }
 *       400:
 *         description: Validation error, or no Certificate entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Certificate not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   patch:
 *     tags: [Certificate]
 *     summary: Update a Certificate entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certificate ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               date: { type: string, format: date }
 *           example: { name: "AWS Certified Developer - Associate" }
 *     responses:
 *       200:
 *         description: Certificate entry updated
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", curriculum: "665f1c2b8f1b2c0012a3b456", name: "AWS Certified Developer - Associate", date: "2022-09-10" } } } }
 *       400:
 *         description: Validation error, or no Certificate entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Certificate not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   delete:
 *     tags: [Certificate]
 *     summary: Delete a Certificate entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certificate ObjectId
 *     responses:
 *       200:
 *         description: Certificate entry deleted
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { deletedCount: 1 } } } }
 *       400:
 *         description: No Certificate entry matches the given id
 *         content: { application/json: { example: { success: false, message: "Certificate not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 */
class CertificateRouter {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	certificateController

	constructor() {
		this.certificateController = CertificateController.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new CertificateRouter()
		return this.instance
	}

	getRoutes() {
		return {
			modelPath: '/certificate',
			paths: [
				{ requestMethod: 'post', path: '', controllerMethod: this.certificateController.add },
				{ requestMethod: 'get', path: '/:id', controllerMethod: this.certificateController.findOne },
				{ requestMethod: 'get', path: '', controllerMethod: this.certificateController.list },
				{ requestMethod: 'put', path: '/:id', controllerMethod: this.certificateController.replace },
				{ requestMethod: 'patch', path: '/:id', controllerMethod: this.certificateController.update },
				{ requestMethod: 'delete', path: '/:id', controllerMethod: this.certificateController.remove }
			]
		}
	}
}

module.exports = CertificateRouter