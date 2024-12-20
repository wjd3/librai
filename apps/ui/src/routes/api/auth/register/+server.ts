import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json()

	try {
		const user = await pb.collection('users').create(data)
		return json(user)
	} catch (error) {
		console.error('Registration error:', error)
		return new Response('Registration failed', { status: 400 })
	}
}
