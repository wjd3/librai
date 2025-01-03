import { pb } from './pocketbase'
import type { BaseAuthStore } from 'pocketbase'

export async function validateToken(request: Request): Promise<BaseAuthStore['model'] | null> {
	const authHeader = request.headers.get('Authorization')
	const token = authHeader?.replace('Bearer ', '')

	if (!token) {
		return null
	}

	try {
		pb.authStore.save(token)
		await pb.collection('users').authRefresh()

		if (!pb.authStore.isValid || !pb.authStore.model) {
			return null
		}

		return pb.authStore.model
	} catch (error) {
		console.error('Token validation error:', error)
		return null
	}
}
