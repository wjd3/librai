// Import necessary types
import type { Handle } from '@sveltejs/kit'
import { defaultTheme } from '$lib/constants/theme'
import { config as dotenvConfig } from 'dotenv'
import { pb } from '$lib/clients/pocketbase'

dotenvConfig()

// Define the handle hook
export const handle: Handle = async ({ event, resolve }) => {
	// Get the auth token from Authorization header
	const authHeader = event.request.headers.get('Authorization')
	const token = authHeader?.replace('Bearer ', '')

	if (token) {
		try {
			// Load the auth store with the token
			pb.authStore.save(token)
			await pb.collection('users').authRefresh()

			// Validate the token
			if (pb.authStore.isValid) {
				event.locals.user = {
					id: pb.authStore.model?.id,
					email: pb.authStore.model?.email,
					name: pb.authStore.model?.name
				}
			}
		} catch (error) {
			console.error('Error validating token:', error)
			pb.authStore.clear()
		}
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('%DATA_THEME%', process.env.PUBLIC_THEME || defaultTheme)
		}
	})

	return response
}
