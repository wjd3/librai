import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import DOMPurify from 'isomorphic-dompurify'

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json()

	try {
		// Sanitize all string inputs
		const sanitizedData = Object.fromEntries(
			Object.entries(data).map(([key, value]) => [
				key,
				typeof value === 'string' ? DOMPurify.sanitize(value).trim() : value
			])
		)

		// Validate required fields
		if (!sanitizedData.email || !sanitizedData.password) {
			return new Response('Missing required fields', { status: 400 })
		}

		const user = await pb.collection('users').create(sanitizedData)
		return json(user)
	} catch (error) {
		console.error('Registration error:', error)
		return new Response('Registration failed', { status: 400 })
	}
}
