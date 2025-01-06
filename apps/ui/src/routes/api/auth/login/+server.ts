import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import DOMPurify from 'isomorphic-dompurify'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const { email, password } = await request.json()

	try {
		// Sanitize inputs
		const sanitizedEmail = DOMPurify.sanitize(email).trim()
		const sanitizedPassword = DOMPurify.sanitize(password)

		if (!sanitizedEmail || !sanitizedPassword) {
			throw new Error('Invalid credentials')
		}

		// Attempt login and check if user is verified
		const auth = await pb.collection('users').authWithPassword(sanitizedEmail, sanitizedPassword)
		if (!auth.record.verified) {
			pb.authStore.clear()
			throw new Error('Please verify your email before logging in')
		}

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
		return new Response(
			JSON.stringify({
				success: false,
				message: error instanceof Error ? error.message : 'Invalid credentials'
			}),
			{
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
