const SkillController = require('../controllers/skill')

/**
 * @openapi
 * tags:
 *   - name: Skill
 *     description: |
 *       Catalog of skills used to autocomplete the Curriculum's `skills` field. Reading is
 *       public; writing (create/update/delete) requires the admin role
 *       (`Authorization: Bearer <token>` resolving to `role: "admin"` — see auth-middleware).
 *       Exception: a new skill's automatic registration when a CV is saved happens in-process
 *       (services/commands/registerNewSkills.js calling SkillService.add() directly), never
 *       through this HTTP route, so it is unaffected by this gate.
 *
 * /skill:
 *   post:
 *     tags: [Skill]
 *     summary: Create a Skill (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, active]
 *             properties:
 *               name: { type: string }
 *               active: { type: boolean, description: "Whether it's offered as a suggestion" }
 *           example: { name: "Node.js", active: true }
 *     responses:
 *       200:
 *         description: Skill created
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Node.js", active: true } } } }
 *       400:
 *         description: |
 *           Validation error (missing/invalid field). Observed against the running app for a
 *           request missing `active`.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid input"
 *               statusCode: 400
 *               content: { code: "invalid_type", expected: "boolean", received: "undefined", path: ["active"], message: "Required" }
 *       401:
 *         description: Missing/malformed Authorization header, or an invalid/expired session (observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Missing or malformed Authorization header.", statusCode: 401, content: null } } }
 *       403:
 *         description: The authenticated user is not admin (observed against the running app)
 *         content: { application/json: { example: { success: false, message: "This action requires the 'admin' role.", statusCode: 403, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   get:
 *     tags: [Skill]
 *     summary: List Skills
 *     description: |
 *       Powers the skills autocomplete on the Curriculum form: call with `query[active]=true` to
 *       get only the Skills offered as suggestions (the user can still type any free-text value -
 *       Skill only suggests, it never restricts what `Curriculum.skills` can contain).
 *
 *       Paginated list with filtering, operators, sorting and pagination.
 *         - Equality filter:  `query[field]=value`            (e.g. query[active]=true)
 *         - Operator filter:  `query[field][operator]=value`  (e.g. query[name][like]=node)
 *       Operators by type — name (string): eq, ne, like, notLike, in, notIn, or; active
 *       (boolean): eq, ne, in, notIn, or.
 *     parameters:
 *       - in: query
 *         name: query[field]
 *         schema: { type: string }
 *         description: Equality filter, e.g. `query[active]=true`
 *       - in: query
 *         name: query[field][operator]
 *         schema: { type: string }
 *         description: Operator filter, e.g. `query[name][like]=node`
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
 *                 records: [{ id: "665f...", name: "Node.js", active: true }]
 *       400:
 *         description: |
 *           Invalid filter/operator (e.g. an operator not supported by that field's type;
 *           observed against the running app for `query[name][gte]=a`).
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
 * /skill/{id}:
 *   get:
 *     tags: [Skill]
 *     summary: Get a Skill by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Skill ObjectId
 *     responses:
 *       200:
 *         description: Skill found
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Node.js", active: true } } } }
 *       400:
 *         description: No Skill matches the given id (generated findOne raises BadRequestError; observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Skill not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when `id` is not a syntactically valid
 *           ObjectId — the cast throws outside the Zod/BadRequestError paths and surfaces as a
 *           generic 500.
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 *   put:
 *     tags: [Skill]
 *     summary: Replace a Skill (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Skill ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Skill replaced
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Node.js", active: false } } } }
 *       400:
 *         description: Validation error, or no Skill matches the given id
 *         content: { application/json: { example: { success: false, message: "Skill not found.", statusCode: 400, content: null } } }
 *       401:
 *         description: Missing/malformed Authorization header, or an invalid/expired session
 *         content: { application/json: { example: { success: false, message: "Missing or malformed Authorization header.", statusCode: 401, content: null } } }
 *       403:
 *         description: The authenticated user is not admin
 *         content: { application/json: { example: { success: false, message: "This action requires the 'admin' role.", statusCode: 403, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   patch:
 *     tags: [Skill]
 *     summary: Update a Skill (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Skill ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               active: { type: boolean }
 *           example: { active: false }
 *     responses:
 *       200:
 *         description: Skill updated
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", name: "Node.js", active: false } } } }
 *       400:
 *         description: Validation error, or no Skill matches the given id
 *         content: { application/json: { example: { success: false, message: "Skill not found.", statusCode: 400, content: null } } }
 *       401:
 *         description: Missing/malformed Authorization header, or an invalid/expired session
 *         content: { application/json: { example: { success: false, message: "Missing or malformed Authorization header.", statusCode: 401, content: null } } }
 *       403:
 *         description: The authenticated user is not admin
 *         content: { application/json: { example: { success: false, message: "This action requires the 'admin' role.", statusCode: 403, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   delete:
 *     tags: [Skill]
 *     summary: Delete a Skill (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Skill ObjectId
 *     responses:
 *       200:
 *         description: Skill deleted
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { deletedCount: 1 } } } }
 *       400:
 *         description: No Skill matches the given id
 *         content: { application/json: { example: { success: false, message: "Skill not found.", statusCode: 400, content: null } } }
 *       401:
 *         description: Missing/malformed Authorization header, or an invalid/expired session (observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Missing or malformed Authorization header.", statusCode: 401, content: null } } }
 *       403:
 *         description: The authenticated user is not admin (observed against the running app)
 *         content: { application/json: { example: { success: false, message: "This action requires the 'admin' role.", statusCode: 403, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 */
class SkillRouter {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	skillController

	constructor() {
		this.skillController = SkillController.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new SkillRouter()
		return this.instance
	}

	getRoutes() {
		return {
			modelPath: '/skill',
			paths: [
				{ requestMethod: 'post', path: '', controllerMethod: this.skillController.add },
				{ requestMethod: 'get', path: '/:id', controllerMethod: this.skillController.findOne },
				{ requestMethod: 'get', path: '', controllerMethod: this.skillController.list },
				{ requestMethod: 'put', path: '/:id', controllerMethod: this.skillController.replace },
				{ requestMethod: 'patch', path: '/:id', controllerMethod: this.skillController.update },
				{ requestMethod: 'delete', path: '/:id', controllerMethod: this.skillController.remove }
			]
		}
	}
}

module.exports = SkillRouter