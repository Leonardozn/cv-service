const SecurityHeaders = require('@cv-service/security-headers')
const envVars = require('./envVariables')

class SecurityHeadersHandler {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	securityHeaders

	/**
	 * @private
	 */
	constructor() {
		this.securityHeaders = new SecurityHeaders()
	}

	static getInstance() {
		if (!this.instance) this.instance = new SecurityHeadersHandler()
		return this.instance
	}

	// Builds the helmet middleware for this service:
	// - contentSecurityPolicy is OFF: these are JSON APIs (CSP guards HTML pages, which the frontend
	//   serves) and helmet's default CSP would also break the Swagger UI page's inline scripts.
	// - HSTS only outside develop mode — it only makes sense over HTTPS, so it's off on local HTTP.
	// - Cross-Origin-Resource-Policy defaults to 'cross-origin' here because this service serves the
	//   uploaded Curriculum photos under /api/files, which the client embeds as <img> from another
	//   origin; 'same-origin' would make the browser block those. Overridable via env.
	getMiddleware() {
		const isDev = envVars.DEVELOP_MODE === 'true'

		return this.securityHeaders.getMiddleware({
			contentSecurityPolicy: false,
			hsts: !isDev,
			crossOriginResourcePolicy: { policy: envVars.SECURITY_CORP_POLICY || 'cross-origin' }
		})
	}
}

module.exports = SecurityHeadersHandler
