const CurriculumController = require('../controllers/curriculum')

/**
 * @openapi
 * tags:
 *   - name: Curriculum
 *     description: |
 *       CRUD of the authenticated user's Curriculum. Max one Curriculum per user (`user` is
 *       unique). `photo` holds the uploaded file's stored name (file-manager wiring added when
 *       the Curriculum contract is implemented). These routes are not yet behind the auth
 *       middleware — ownership scoping and 401/403 responses are added when the auth middleware
 *       is wired in.
 *
 * /curriculum:
 *   post:
 *     tags: [Curriculum]
 *     summary: Create a Curriculum
 *     description: |
 *       Accepts either a JSON body, or `multipart/form-data` when uploading the profile photo as
 *       a file (field name `photo`) - the stored filename is what ends up in the `photo` response
 *       field, never the file itself. `contactLinks`/`skills` are not uploadable as multipart
 *       array fields in this API; send those via the JSON variant.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user, fullName, headline, city, profileSummary]
 *             properties:
 *               user: { type: string, description: "Owner's User id from auth-service" }
 *               fullName: { type: string }
 *               headline: { type: string }
 *               city: { type: string }
 *               photo: { type: string, description: "Uploaded file's stored name" }
 *               profileSummary: { type: string }
 *               skills:
 *                 type: array
 *                 items: { type: string }
 *               contactLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [label, url]
 *                   properties:
 *                     label: { type: string }
 *                     url: { type: string }
 *           example:
 *             user: "665f1c2b8f1b2c0012a3b456"
 *             fullName: "Jane Doe"
 *             headline: "Backend Engineer"
 *             city: "Bogotá"
 *             profileSummary: "5+ years building distributed systems."
 *             skills: ["Node.js", "MongoDB"]
 *             contactLinks: [{ label: "LinkedIn", url: "linkedin.com/in/janedoe" }]
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [user, fullName, headline, city, profileSummary]
 *             properties:
 *               user: { type: string }
 *               fullName: { type: string }
 *               headline: { type: string }
 *               city: { type: string }
 *               profileSummary: { type: string }
 *               photo: { type: string, format: binary, description: "Profile photo file upload" }
 *     responses:
 *       200:
 *         description: Curriculum created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Success!
 *               statusCode: 200
 *               content:
 *                 id: "665f1c2b8f1b2c0012a3b457"
 *                 user: "665f1c2b8f1b2c0012a3b456"
 *                 fullName: "Jane Doe"
 *                 headline: "Backend Engineer"
 *                 city: "Bogotá"
 *                 photo: "jane-photo.png"
 *                 profileSummary: "5+ years building distributed systems."
 *                 skills: ["Node.js", "MongoDB"]
 *                 contactLinks: [{ label: "LinkedIn", url: "linkedin.com/in/janedoe" }]
 *       400:
 *         description: |
 *           Validation error — one or more required fields are missing/invalid. Zod reports the
 *           generic message "Invalid input" per failing field; both `message` and `content` become
 *           arrays when more than one field fails (observed against the running app).
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: ["Invalid input", "Invalid input", "Invalid input", "Invalid input"]
 *               statusCode: 400
 *               content:
 *                 - { code: invalid_type, expected: string, received: undefined, path: [user], message: Required }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [headline], message: Required }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [city], message: Required }
 *                 - { code: invalid_type, expected: string, received: undefined, path: [profileSummary], message: Required }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   get:
 *     tags: [Curriculum]
 *     summary: List Curriculums
 *     description: |
 *       Paginated list with filtering, operators, sorting and pagination.
 *         - Equality filter:  `query[field]=value`            (e.g. query[city]=Bogotá)
 *         - Operator filter:  `query[field][operator]=value`  (e.g. query[fullName][like]=jane)
 *       Operators by type — user/fullName/headline/city/photo/profileSummary (string): eq, ne,
 *       like, notLike, in, notIn, or. `skills` (array of string, no allowAdvance) only supports
 *       direct equality (matches records whose array contains the value). `contactLinks.label`
 *       and `contactLinks.url` (nested string subfields) support the same string operators.
 *     parameters:
 *       - in: query
 *         name: query[field]
 *         schema: { type: string }
 *         description: Equality filter, e.g. `query[city]=Bogotá`
 *       - in: query
 *         name: query[field][operator]
 *         schema: { type: string }
 *         description: Operator filter, e.g. `query[fullName][like]=jane`
 *       - in: query
 *         name: sort[field]
 *         schema: { type: integer, enum: [1, -1] }
 *         description: Sort ascending (1) or descending (-1), e.g. `sort[createdAt]=-1`
 *       - in: query
 *         name: size
 *         schema: { type: integer }
 *         description: Records per page
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: 1-based page number
 *       - in: query
 *         name: virtuals
 *         schema: { type: string }
 *         description: Field projection (e.g. `virtuals[fullName]=1`); empty returns every field
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
 *                 records: [{ id: "665f...", user: "665f1c2b8f1b2c0012a3b456", fullName: "Jane Doe", headline: "Backend Engineer", city: "Bogotá", profileSummary: "5+ years building distributed systems.", skills: ["Node.js"], contactLinks: [] }]
 *       400:
 *         description: |
 *           Invalid filter/operator (e.g. an operator not supported by that field's type; observed
 *           against the running app for `query[user][gte]=a`, `gte` is not valid on a string field).
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unrecognized key(s) in object: 'gte'"
 *               statusCode: 400
 *               content: { code: "unrecognized_keys", keys: ["gte"], path: ["user"], message: "Unrecognized key(s) in object: 'gte'" }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *
 * /curriculum/{id}:
 *   get:
 *     tags: [Curriculum]
 *     summary: Get a Curriculum by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Curriculum ObjectId
 *     responses:
 *       200:
 *         description: Curriculum found
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", user: "665f1c2b8f1b2c0012a3b456", fullName: "Jane Doe", headline: "Backend Engineer", city: "Bogotá", profileSummary: "5+ years building distributed systems." } } } }
 *       400:
 *         description: No Curriculum matches the given id (generated findOne raises BadRequestError; observed against the running app)
 *         content: { application/json: { example: { success: false, message: "Curriculum not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when `id` is not a syntactically valid
 *           ObjectId (e.g. `/curriculum/not-an-id`) — the cast throws outside the Zod/BadRequestError
 *           paths and surfaces as a generic 500.
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 *   put:
 *     tags: [Curriculum]
 *     summary: Replace a Curriculum
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Curriculum ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user: { type: string }
 *               fullName: { type: string }
 *               headline: { type: string }
 *               city: { type: string }
 *               photo: { type: string }
 *               profileSummary: { type: string }
 *               skills: { type: array, items: { type: string } }
 *               contactLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties: { label: { type: string }, url: { type: string } }
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               user: { type: string }
 *               fullName: { type: string }
 *               headline: { type: string }
 *               city: { type: string }
 *               profileSummary: { type: string }
 *               photo: { type: string, format: binary, description: "Replaces the profile photo file" }
 *     responses:
 *       200:
 *         description: Curriculum replaced
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", user: "665f1c2b8f1b2c0012a3b456", fullName: "Jane Doe", headline: "Backend Engineer", city: "Bogotá", profileSummary: "Updated summary." } } } }
 *       400:
 *         description: Validation error, or no Curriculum matches the given id
 *         content: { application/json: { example: { success: false, message: "Curriculum not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   patch:
 *     tags: [Curriculum]
 *     summary: Update a Curriculum
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Curriculum ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               headline: { type: string }
 *               city: { type: string }
 *               profileSummary: { type: string }
 *           example: { headline: "Senior Backend Engineer" }
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               headline: { type: string }
 *               city: { type: string }
 *               profileSummary: { type: string }
 *               photo: { type: string, format: binary, description: "Replaces the profile photo file (any other omitted field is left unchanged)" }
 *     responses:
 *       200:
 *         description: Curriculum updated
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { id: "665f...", user: "665f1c2b8f1b2c0012a3b456", fullName: "Jane Doe", headline: "Senior Backend Engineer", city: "Bogotá", profileSummary: "5+ years building distributed systems." } } } }
 *       400:
 *         description: Validation error, or no Curriculum matches the given id
 *         content: { application/json: { example: { success: false, message: "Curriculum not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *   delete:
 *     tags: [Curriculum]
 *     summary: Delete a Curriculum
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Curriculum ObjectId
 *     responses:
 *       200:
 *         description: Curriculum deleted
 *         content: { application/json: { example: { success: true, message: "Success!", statusCode: 200, content: { deletedCount: 1 } } } }
 *       400:
 *         description: No Curriculum matches the given id
 *         content: { application/json: { example: { success: false, message: "Curriculum not found.", statusCode: 400, content: null } } }
 *       500:
 *         description: Unexpected server error
 *         content: { application/json: { example: { success: false, message: "An error occurred", statusCode: 500, content: null } } }
 *
 * /curriculum/{id}/generate-pdf:
 *   post:
 *     tags: [Curriculum]
 *     summary: Generate the Curriculum's PDF
 *     description: |
 *       Renders the Curriculum (with its Education/Experience/Certificate entries) into a PDF
 *       using the given Template's design, on-demand and without persisting any history. The PDF
 *       is returned as a binary download (`Content-Type: application/pdf`), not the standard
 *       `{ success, message, statusCode, content }` envelope - only error responses use that
 *       envelope.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Curriculum ObjectId
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template: { type: string, description: "Template ObjectId to render with; omit to use the active default Template" }
 *           example: { template: "665f1c2b8f1b2c0012a3b999" }
 *     responses:
 *       200:
 *         description: PDF generated
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: |
 *           The requested `template` id is a syntactically valid ObjectId but matches no Template
 *           (generated findOne raises BadRequestError), or no Template is active and none was
 *           requested.
 *         content: { application/json: { example: { success: false, message: "Template not found.", statusCode: 400, content: null } } }
 *       404:
 *         description: |
 *           No Curriculum matches the given id. Observed against the running app for both a
 *           well-formed id that matches nothing and a syntactically invalid `id` (e.g.
 *           `/curriculum/not-an-id/generate-pdf`) - this action's Curriculum lookup maps any
 *           failure to resolve it to 404, unlike the generic CRUD `findOne` (which lets a
 *           malformed id surface as a 500).
 *         content: { application/json: { example: { success: false, message: "Curriculum not found.", statusCode: 404, content: null } } }
 *       500:
 *         description: |
 *           Unexpected server error. Also observed when a supplied `template` id is not a
 *           syntactically valid ObjectId - that cast throws outside the Zod/BadRequestError paths
 *           and surfaces as a generic 500 (unlike a malformed Curriculum `id`, which this action
 *           maps to 404 - see above).
 *         content: { application/json: { example: { success: false, message: "An unexpected error occurred. Please try again later.", statusCode: 500, content: null } } }
 */
class CurriculumRouter {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	curriculumController

	constructor() {
		this.curriculumController = CurriculumController.getInstance()
	}

	static getInstance() {
		if (!this.instance) this.instance = new CurriculumRouter()
		return this.instance
	}

	getRoutes() {
		return {
			modelPath: '/curriculum',
			paths: [
				{ requestMethod: 'post', path: '', controllerMethod: this.curriculumController.add },
				{ requestMethod: 'get', path: '/:id', controllerMethod: this.curriculumController.findOne },
				{ requestMethod: 'get', path: '', controllerMethod: this.curriculumController.list },
				{ requestMethod: 'put', path: '/:id', controllerMethod: this.curriculumController.replace },
				{ requestMethod: 'patch', path: '/:id', controllerMethod: this.curriculumController.update },
				{ requestMethod: 'delete', path: '/:id', controllerMethod: this.curriculumController.remove },
				{ requestMethod: 'post', path: '/:id/generate-pdf', controllerMethod: this.curriculumController.generatePdf }
			]
		}
	}
}

module.exports = CurriculumRouter