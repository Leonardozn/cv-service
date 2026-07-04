const TemplateController = require('../controllers/template')

/**
 * @openapi
 * tags:
 *   - name: Template
 *     description: |
 *       Catalog of CV layout designs, selected by the user when generating the PDF. Reading is
 *       public; per the Catalog contract, writing (create/update/delete) will be restricted to
 *       admin (`requireRole('admin')`) once the auth middleware is wired in (task 4) — these
 *       routes are open for now.
 *
 * /template:
 *   post:
 *     tags: [Template]
 *     summary: Create a Template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, key, active]
 *             properties:
 *               name: { type: string, description: "Visible name, e.g. 'Classic two columns'" }
 *               key: { type: string, description: "Technical key of the react-pdf layout component" }
 *               description: { type: string }
 *               active: { type: boolean, description: "Whether it's available to choose" }
 *           example: { name: "Classic two columns", key: "classic-two-columns", description: "Two-column layout with a sidebar", active: true }
 *     responses:
 *       200:
 *         description: Template created
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Classic two columns", key: "classic-two-columns", description: "Two-column layout with a sidebar", active: true } } } }
 *       400:
 *         description: |
 *           Validation error (missing/invalid field). Observed against the running app for a
 *           request missing `key` and `active`: both `message` and `content` become arrays.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: ["Invalid input", "Invalid input"]
 *               statusCode: 400
 *               content:
 *                 - { code: invalid_type, expected: string, received: undefined, path: [key], message: Required }
 *                 - { code: invalid_type, expected: boolean, received: undefined, path: [active], message: Required }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   get:
 *     tags: [Template]
 *     summary: List Templates
 *     description: |
 *       Powers the design selector on the Curriculum form: call with `query[active]=true` to get
 *       only the Templates the user is allowed to choose from.
 *
 *       Paginated list with filtering, operators, sorting and pagination.
 *         - Equality filter:  `query[field]=value`            (e.g. query[active]=true)
 *         - Operator filter:  `query[field][operator]=value`  (e.g. query[name][like]=classic)
 *       Operators by type — name/key/description (string): eq, ne, like, notLike, in, notIn, or;
 *       active (boolean): eq, ne, in, notIn, or.
 *     parameters:
 *       - in: query
 *         name: query[field]
 *         schema: { type: string }
 *         description: Equality filter, e.g. `query[active]=true`
 *       - in: query
 *         name: query[field][operator]
 *         schema: { type: string }
 *         description: Operator filter, e.g. `query[name][like]=classic`
 *       - in: query
 *         name: sort[field]
 *         schema: { type: integer, enum: [1, -1] }
 *         description: Sort ascending (1) or descending (-1), e.g. `sort[name]=1`
 *       - in: query
 *         name: size
 *         schema: { type: integer }
 *         description: Records per page
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: 1-based page number
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
 *                 records: [{ id: "665f...", name: "Classic two columns", key: "classic-two-columns", description: "Two-column layout with a sidebar", active: true }]
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
 * /template/{id}:
 *   get:
 *     tags: [Template]
 *     summary: Get a Template by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Template ObjectId
 *     responses:
 *       200:
 *         description: Template found
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Classic two columns", key: "classic-two-columns", description: "Two-column layout with a sidebar", active: true } } } }
 *       400:
 *         description: No Template matches the given id (generated findOne raises BadRequestError; observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Template not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when `id` is not a syntactically valid
 *           ObjectId — the cast throws outside the Zod/BadRequestError paths and surfaces as a
 *           generic 500.
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 *   put:
 *     tags: [Template]
 *     summary: Replace a Template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Template ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               key: { type: string }
 *               description: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Template replaced
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Classic two columns", key: "classic-two-columns", description: "Updated description", active: false } } } }
 *       400:
 *         description: Validation error, or no Template matches the given id
 *         content: { application/json: { example: { success: false, message: "Template not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   patch:
 *     tags: [Template]
 *     summary: Update a Template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Template ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               active: { type: boolean }
 *           example: { active: false }
 *     responses:
 *       200:
 *         description: Template updated
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Classic two columns", key: "classic-two-columns", description: "Two-column layout with a sidebar", active: false } } } }
 *       400:
 *         description: Validation error, or no Template matches the given id
 *         content: { application/json: { example: { success: false, message: "Template not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   delete:
 *     tags: [Template]
 *     summary: Delete a Template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Template ObjectId
 *     responses:
 *       200:
 *         description: Template deleted
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { deletedCount: 1 } } } }
 *       400:
 *         description: No Template matches the given id
 *         content: { application/json: { example: { success: false, message: "Template not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 */
class TemplateRouter {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	templateController

	constructor() {
		this.templateController = TemplateController.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new TemplateRouter()
		return this.instance
	}

	getRoutes() {
		return {
			modelPath: '/template',
			paths: [
				{ requestMethod: 'post', path: '', controllerMethod: this.templateController.add },
				{ requestMethod: 'get', path: '/:id', controllerMethod: this.templateController.findOne },
				{ requestMethod: 'get', path: '', controllerMethod: this.templateController.list },
				{ requestMethod: 'put', path: '/:id', controllerMethod: this.templateController.replace },
				{ requestMethod: 'patch', path: '/:id', controllerMethod: this.templateController.update },
				{ requestMethod: 'delete', path: '/:id', controllerMethod: this.templateController.remove }
			]
		}
	}
}

module.exports = TemplateRouter