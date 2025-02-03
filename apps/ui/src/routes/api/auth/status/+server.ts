import { json } from '@sveltejs/kit'
import { pb } from '$lib/server/pocketbase'
import { ClientResponseError } from 'pocketbase'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ request }) => {
	const token = request.headers.get('Authorization')?.replace('Bearer ', '')

	if (!token) {
		return json({
			token: null,
			user: null
		})
	}

	try {
		pb.authStore.save(token)
		await pb.collection('users').authRefresh()
		if (!pb.authStore.isValid) {
			return json({
				token: null,
				user: null
			})
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
		if (error instanceof ClientResponseError && error.status === 401) {
			return json({
				token: null,
				user: null
			})
		}

		return new Response('Unauthorized', { status: 401 })
	}
}
