import { pb } from '../pocketbase'
import type { RecordModel } from 'pocketbase'

const UNAUTHENTICATED_LIMIT = 30
const AUTHENTICATED_LIMIT = 60
const WINDOW_SIZE_MS = 60 * 60 * 1000 // 1 hour in milliseconds

interface RateLimit extends RecordModel {
	identifier: string
	count: number
	reset_at: string
}

interface MemoryRateLimit {
	count: number
	resetAt: Date
}

// In-memory store for unauthenticated users
const memoryStore = new Map<string, MemoryRateLimit>()

// Clean up expired entries periodically
setInterval(() => {
	const now = new Date()
	for (const [key, value] of memoryStore.entries()) {
		if (value.resetAt <= now) {
			memoryStore.delete(key)
		}
	}
}, 60000) // Clean up every minute

export class RateLimitService {
	static async checkRateLimit(
		identifier: string,
		isAuthenticated: boolean
	): Promise<{
		allowed: boolean
		remaining: number
		resetAt: Date
	}> {
		const now = new Date()
		const limit = isAuthenticated ? AUTHENTICATED_LIMIT : UNAUTHENTICATED_LIMIT

		// Use in-memory rate limiting for unauthenticated users
		if (!isAuthenticated) {
			return this.checkMemoryRateLimit(identifier, limit, now)
		}

		// Database rate limiting for authenticated users
		try {
			let rateLimit: RateLimit | null = null
			try {
				rateLimit = await pb
					.collection('rate_limits')
					.getFirstListItem(`identifier="${identifier}"`)
			} catch (e) {
				// Record doesn't exist yet
				console.error(e)
			}

			// If no record exists or the reset time has passed, create/reset the record
			if (!rateLimit || new Date(rateLimit.reset_at) <= now) {
				const resetAt = new Date(now.getTime() + WINDOW_SIZE_MS)

				rateLimit = await pb.collection('rate_limits').create({
					identifier,
					count: 1,
					reset_at: resetAt.toISOString()
				})

				return {
					allowed: true,
					remaining: limit - 1,
					resetAt
				}
			}

			// Check if limit is exceeded
			if (rateLimit.count >= limit) {
				return {
					allowed: false,
					remaining: 0,
					resetAt: new Date(rateLimit.reset_at)
				}
			}

			// Increment count
			rateLimit = await pb.collection('rate_limits').update(rateLimit.id, {
				count: rateLimit.count + 1
			})

			return {
				allowed: true,
				remaining: limit - (rateLimit?.count || 0),
				resetAt: new Date(rateLimit?.reset_at || '')
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

	private static checkMemoryRateLimit(
		identifier: string,
		limit: number,
		now: Date
	): {
		allowed: boolean
		remaining: number
		resetAt: Date
	} {
		let rateLimit = memoryStore.get(identifier)

		// If no record exists or the reset time has passed, create/reset the record
		if (!rateLimit || rateLimit.resetAt <= now) {
			const resetAt = new Date(now.getTime() + WINDOW_SIZE_MS)
			rateLimit = {
				count: 1,
				resetAt
			}
			memoryStore.set(identifier, rateLimit)

			return {
				allowed: true,
				remaining: limit - 1,
				resetAt
			}
		}

		// Check if limit is exceeded
		if (rateLimit.count >= limit) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: rateLimit.resetAt
			}
		}

		// Increment count
		rateLimit.count += 1
		memoryStore.set(identifier, rateLimit)

		return {
			allowed: true,
			remaining: limit - rateLimit.count,
			resetAt: rateLimit.resetAt
		}
	}
}
