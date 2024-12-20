import type { Handle } from '@sveltejs/kit'
import { pb } from '$lib/server/pocketbase'
import { defaultTheme } from '$lib/constants/theme'

export const handle: Handle = async ({ event, resolve }) => {
	const authHeader = event.request.headers.get('Authorization')
	const token = authHeader?.replace('Bearer ', '')

	if (token) {
		try {
			pb.authStore.save(token)
			await pb.collection('users').authRefresh()

			if (pb.authStore.isValid) {
				event.locals.user = {
					id: pb.authStore.model?.id,
					email: pb.authStore.model?.email,
					name: pb.authStore.model?.name
				}
				event.locals.token = token
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
