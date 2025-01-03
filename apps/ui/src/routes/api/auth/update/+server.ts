import { json } from '@sveltejs/kit'
import { pb } from '$lib/server/pocketbase'
import type { RequestHandler } from './$types'
import { validateToken } from '$lib/server/auth'
import DOMPurify from 'isomorphic-dompurify'

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		// Validate auth token
		const user = await validateToken(request)
		if (!user) {
			return new Response('Unauthorized', { status: 401 })
		}

		// Get request body
		const { name } = await request.json()

		// Sanitize and validate name
		const sanitizedName = DOMPurify.sanitize(name).trim()
		if (!sanitizedName || sanitizedName.length > 700) {
			return new Response('Invalid name', { status: 400 })
		}

		// Update user in database
		const updated = await pb.collection('users').update(user.id, {
			name: sanitizedName
		})

		return json(updated)
	} catch (error) {
		console.error('Profile update error:', error)
		return new Response('Internal server error', { status: 500 })
	}
}
