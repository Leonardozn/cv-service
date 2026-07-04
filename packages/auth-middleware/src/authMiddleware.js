const ExternalApiConfig = require('@cv-service/external-api-config')
const { UnauthorizedError, ForbiddenError } = require('@cv-service/handle-errors')
const { HandleResponse, ResponseBody } = require('@cv-service/handle-response')
const envVariables = require('@cv-service/env-variables')

const BEARER_PATTERN = /^Bearer (.+)$/i

// Generic, reusable authentication technique: forwards the caller's bearer token to an
// auth-service's `POST /auth/validate`, never interpreting it locally, and injects the
// resolved `user` (with its `role`) into `req.user`. Any easy-node service can reuse this
// package as-is - it only needs AUTH_SERVICE_URL pointed at its own auth-service.
class AuthMiddleware {
	constructor() {
		this.externalApiConfig = new ExternalApiConfig()
		this.handleResponse = new HandleResponse()
		this.instance = this.externalApiConfig.createInstance({
			baseURL: envVariables.AUTH_SERVICE_URL || 'http://localhost:4000',
			timeout: 5000,
			// auth-service reports an invalid/expired token as a real 401 - treat it as a normal
			// response (content: null) instead of letting axios throw, so it can be told apart
			// from a genuine auth-service failure (network error, 5xx, timeout).
			validateStatus: status => status === 200 || status === 401
		})
	}

	// Any authenticated user - validates the token and injects req.user.
	requireAuth() {
		return async (req, res, next) => {
			try {
				req.user = await this._resolveUser(req)
				next()
			} catch (error) {
				this._sendError(res, error)
			}
		}
	}

	// Only a user whose role matches - runs the same validation, then checks req.user.role.
	requireRole(role) {
		return async (req, res, next) => {
			try {
				req.user = await this._resolveUser(req)
				if (req.user.role !== role) throw new ForbiddenError(`This action requires the '${role}' role.`)
				next()
			} catch (error) {
				this._sendError(res, error)
			}
		}
	}

	/**
	 * @private
	 * This project (like any easy-node service) has no global Express error-handling
	 * middleware - every layer builds and sends its own error response via handle-response,
	 * exactly like a controller's own try/catch does. A middleware is no exception: it must
	 * own its error response rather than call next(error), which would fall through to
	 * Express's default (non-JSON) error handler.
	 */
	_sendError(res, error) {
		const response = this.handleResponse.buildResponse(error)
		res.status(response[ResponseBody.STATUS]).json(response)
	}

	/**
	 * @private
	 */
	async _resolveUser(req) {
		const header = req.headers && req.headers.authorization
		const match = typeof header === 'string' && header.match(BEARER_PATTERN)
		if (!match) throw new UnauthorizedError('Missing or malformed Authorization header.')

		const user = await this._validateWithRetry(match[1])
		if (!user) throw new UnauthorizedError('Invalid or expired session.')
		return user
	}

	/**
	 * @private
	 */
	async _validateWithRetry(token) {
		try {
			return await this._callValidate(token)
		} catch (firstError) {
			// Only a timeout gets a retry (per the auth-service consumption contract); any other
			// failure (e.g. a genuine connection error) is not explicitly handled here and bubbles
			// up as-is - handle-response already maps an unhandled Axios error to 502.
			if (!this._isTimeout(firstError)) throw firstError

			try {
				return await this._callValidate(token)
			} catch {
				// The retry also failed - fail closed rather than let the caller through.
				throw new UnauthorizedError('auth-service did not respond in time.')
			}
		}
	}

	/**
	 * @private
	 */
	async _callValidate(token) {
		const response = await this.instance.post('/auth/validate', { token })
		const user = (response.data && response.data.content && response.data.content.user) || null
		return user && this._normalizeUser(user)
	}

	/**
	 * @private
	 * auth-service's own contract exposes the user's Mongo id as `_id`, not `id` (see this
	 * project's own services, which hit the identical `_id`/`id` mismatch on their generated
	 * contracts). Since any easy-node service can plug in a different auth-service here, this
	 * normalizes once at the boundary so every consumer can rely on a stable `user.id`
	 * regardless of which raw field name the connected auth-service happens to return.
	 */
	_normalizeUser(user) {
		if (user.id !== undefined) return user
		return { ...user, id: user._id }
	}

	/**
	 * @private
	 */
	_isTimeout(error) {
		return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
	}
}

module.exports = AuthMiddleware
