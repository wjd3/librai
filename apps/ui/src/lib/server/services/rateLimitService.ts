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
			// Try to get existing rate limit record
			let rateLimit: RateLimit | null = null
			try {
				rateLimit = await pb
					.collection('rate_limits')
					.getFirstListItem(`identifier="${identifier}"`)
			} catch (e) {
				// Record doesn't exist yet
				console.error(e)
			}

			const now = new Date()
			const limit = isAuthenticated ? AUTHENTICATED_LIMIT : UNAUTHENTICATED_LIMIT

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

			if (!rateLimit) {
				throw new Error('Rate limit record not found after update')
			}

			return {
				allowed: true,
				remaining: limit - rateLimit.count,
				resetAt: new Date(rateLimit.reset_at)
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
