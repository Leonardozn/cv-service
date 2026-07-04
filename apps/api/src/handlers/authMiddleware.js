const AuthMiddleware = require('@cv-service/auth-middleware')

class AuthMiddlewareHandler {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	authMiddleware

	constructor() {
		this.authMiddleware = new AuthMiddleware()
	}

	static getInstance() {
		if (!this.instance) this.instance = new AuthMiddlewareHandler()
		return this.instance
	}

	requireAuth() {
		return this.authMiddleware.requireAuth()
	}

	requireRole(role) {
		return this.authMiddleware.requireRole(role)
	}
}

module.exports = AuthMiddlewareHandler
