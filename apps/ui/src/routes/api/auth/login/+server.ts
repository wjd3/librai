import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const { email, password } = await request.json()

	try {
		const auth = await pb.collection('users').authWithPassword(email, password)

		return json({
			token: auth.token,
			user: {
				id: auth.record.id,
				email: auth.record.email,
				name: auth.record.name
			}
		})
	} catch (error) {
		console.error('Login error:', error)
		return new Response('Invalid credentials', { status: 401 })
	}
}
