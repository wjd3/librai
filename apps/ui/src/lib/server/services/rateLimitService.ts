import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import {
	PRIVATE_UPSTASH_REDIS_REST_URL,
	PRIVATE_UPSTASH_REDIS_REST_TOKEN
} from '$env/static/private'

const UNAUTHENTICATED_LIMIT = 30
const AUTHENTICATED_LIMIT = 60
const WINDOW_SIZE_MS = 60 * 60 * 1000 // 1 hour in milliseconds

// Initialize Upstash Redis client
const redis = new Redis({
	url: PRIVATE_UPSTASH_REDIS_REST_URL || '',
	token: PRIVATE_UPSTASH_REDIS_REST_TOKEN || ''
})

// Initialize separate rate limiters for authenticated and unauthenticated users
const unauthenticatedRatelimit = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(UNAUTHENTICATED_LIMIT, '1 h'),
	analytics: true,
	prefix: 'ratelimit:unauth'
})

const authenticatedRatelimit = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(AUTHENTICATED_LIMIT, '1 h'),
	analytics: true,
	prefix: 'ratelimit:auth'
})

export class RateLimitService {
	static async checkRateLimit(
		identifier: string,
		isAuthenticated: boolean
	): Promise<{
		allowed: boolean
		remaining: number
		resetAt: Date
	}> {
		try {
			// Hash the identifier if it's an IP address to ensure consistent length
			const hashedIdentifier = identifier.includes(':')
				? `ip_${Buffer.from(identifier).toString('base64')}`
				: identifier

			// Use appropriate rate limiter based on auth status
			const ratelimiter = isAuthenticated ? authenticatedRatelimit : unauthenticatedRatelimit

			const { success, remaining, reset } = await ratelimiter.limit(hashedIdentifier)

			return {
				allowed: success,
				remaining,
				resetAt: new Date(reset)
			}
		} catch (error) {
			console.error('Rate limit error:', error)
			// If there's an error checking rate limits, we'll allow the request but log the error
			return {
				allowed: true,
				remaining: 0,
				resetAt: new Date(Date.now() + WINDOW_SIZE_MS)
			}
		}
	}
}
