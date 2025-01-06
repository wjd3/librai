import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import DOMPurify from 'isomorphic-dompurify'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json()

	try {
		const {
			email,
			password,
			passwordConfirm,
			name
		}: { email: string; password: string; passwordConfirm: string; name: string } = data || {}

		const sanitizedEmail = DOMPurify.sanitize(email || '').trim()
		const sanitizedPassword = DOMPurify.sanitize(password || '').trim()
		const sanitizedPasswordConfirm = DOMPurify.sanitize(passwordConfirm || '').trim()
		const sanitizedName = DOMPurify.sanitize(name || '').trim()

		// Validate required fields
		if (
			!sanitizedEmail ||
			!sanitizedPassword ||
			!sanitizedPasswordConfirm ||
			sanitizedPassword !== sanitizedPasswordConfirm
		) {
			throw new Error('Missing required fields')
		}
		// Check if the email is already in use
		try {
			const existingUser = await pb
				.collection('users')
				.getFirstListItem(`email = "${sanitizedEmail}"`)
			if (existingUser) {
				throw new Error('Email already in use')
			}
		} catch (err) {
			// Ignore 404 error when user doesn't exist
			if ((err as { status: number }).status !== 404) {
				throw err
			}
		}

		// Create the user
		await pb.collection('users').create({
			email: sanitizedEmail,
			password: sanitizedPassword,
			passwordConfirm: sanitizedPasswordConfirm,
			name: sanitizedName
		})

		// Send verification email
		await pb.collection('users').requestVerification(sanitizedEmail)

		return json({
			success: true,
			message: 'Please check your email to verify your account before logging in.'
		})
	} catch (error) {
		console.error('Registration error:', error)
		return new Response(
			JSON.stringify({
				success: false,
				message: error instanceof Error ? error.message : 'Registration failed'
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
