const RateLimiter = require('@cv-service/rate-limiter')
const envVars = require('./envVariables')

class RateLimiterHandler {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	rateLimiter

	/**
	 * @private
	 */
	constructor() {
		this.rateLimiter = new RateLimiter()
	}

	static getInstance() {
		if (!this.instance) this.instance = new RateLimiterHandler()
		return this.instance
	}

	// Global baseline: a generous per-IP cap on every API route to blunt scraping / crude DoS
	// without getting in a normal user's way. This service's sensitive endpoints are already behind
	// auth + ownership, so it needs the baseline only (no stricter per-endpoint limit).
	getBaselineLimiter() {
		return this.rateLimiter.createLimiter({
			windowMs: Number(envVars.RATE_LIMIT_WINDOW_MS || 60000),
			max: Number(envVars.RATE_LIMIT_MAX || 300)
		})
	}
}

module.exports = RateLimiterHandler
