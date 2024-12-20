import { json } from '@sveltejs/kit'
import { pb } from '$lib/server/pocketbase'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization')
	const token = authHeader?.replace('Bearer ', '')

	if (!token) {
		return new Response('Unauthorized', { status: 401 })
	}

	try {
		pb.authStore.save(token)
		await pb.collection('users').authRefresh()

		if (!pb.authStore.isValid) {
			return new Response('Invalid token', { status: 401 })
		}

		return json({
			token: pb.authStore.token,
			user: {
				id: pb.authStore.model?.id,
				email: pb.authStore.model?.email,
				name: pb.authStore.model?.name
			}
		})
	} catch (error) {
		console.error('Auth status error:', error)
		return new Response('Unauthorized', { status: 401 })
	}
}
