// Import necessary types
import type { Handle } from '@sveltejs/kit'
import { defaultTheme } from '$lib/constants/theme'
import { config as dotenvConfig } from 'dotenv'
import { pb } from '$lib/clients/pocketbase'

dotenvConfig()

// Define the handle hook
export const handle: Handle = async ({ event, resolve }) => {
	// Get the auth cookie
	const cookie = event.request.headers.get('cookie')
	if (cookie) {
		try {
			// Load the auth store from the cookie
			pb.authStore.loadFromCookie(cookie)
			// Validate the token
			if (pb.authStore.isValid) {
				event.locals.user = {
					id: pb.authStore.model?.id,
					email: pb.authStore.model?.email,
					name: pb.authStore.model?.name
				}
			}
		} catch (error) {
			console.error('Error loading auth store:', error)

			// Clear the auth store if validation fails
			pb.authStore.clear()
		}
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('%DATA_THEME%', process.env.PUBLIC_THEME || defaultTheme)
		}
	})

	// Set the auth cookie in the response
	response.headers.append('set-cookie', pb.authStore.exportToCookie())

	return response
}
