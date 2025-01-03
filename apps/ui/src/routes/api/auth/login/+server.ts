import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import DOMPurify from 'isomorphic-dompurify'

export const POST: RequestHandler = async ({ request }) => {
	const { email, password } = await request.json()

	try {
		// Sanitize inputs
		const sanitizedEmail = DOMPurify.sanitize(email).trim()
		const sanitizedPassword = DOMPurify.sanitize(password)

		if (!sanitizedEmail || !sanitizedPassword) {
			return new Response('Invalid credentials', { status: 400 })
		}

		const auth = await pb.collection('users').authWithPassword(sanitizedEmail, sanitizedPassword)

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
