import { pb } from '$lib/server/pocketbase'
import { json, error } from '@sveltejs/kit'
import DOMPurify from 'isomorphic-dompurify'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const { email } = await request.json()

	try {
		const sanitizedEmail = DOMPurify.sanitize(email).trim()
		if (!sanitizedEmail) {
			throw error(400, 'Something went wrong')
		}

		// Request password reset
		await pb.collection('users').requestPasswordReset(sanitizedEmail)

		return json({ success: true })
	} catch (error) {
		console.error('Password reset request error:', error)
		return json({ success: true })
	}
}

export const PATCH: RequestHandler = async ({ request }) => {
	const { token, password, passwordConfirm } = await request.json()

	try {
		// Sanitize inputs
		const sanitizedToken = DOMPurify.sanitize(token).trim()
		const sanitizedPassword = DOMPurify.sanitize(password)
		const sanitizedPasswordConfirm = DOMPurify.sanitize(passwordConfirm)

		if (!sanitizedToken || !sanitizedPassword || !sanitizedPasswordConfirm) {
			return new Response('Invalid request', { status: 400 })
		}

		// Confirm password reset
		await pb
			.collection('users')
			.confirmPasswordReset(sanitizedToken, sanitizedPassword, sanitizedPasswordConfirm)

		return json({ success: true })
	} catch (error) {
		console.error('Password reset confirmation error:', error)
		return new Response('Password reset failed', { status: 400 })
	}
}
