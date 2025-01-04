import { pb } from '$lib/server/pocketbase'
import { themes } from '$lib/constants/theme'

import type { Handle } from '@sveltejs/kit'
import { getThemeColorValues } from '$lib/color'

export const handle: Handle = async ({ event, resolve }) => {
	const hasAuthHeader = event.request.headers.has('Authorization')

	if (hasAuthHeader) {
		try {
			const authHeader = event.request.headers.get('Authorization')
			const token = authHeader?.replace('Bearer ', '') || ''

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
		} catch (e) {
			console.error('Error validating token:', e)
			pb.authStore.clear()
		}
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			const theme = process.env.PUBLIC_THEME || themes[0]

			const { light, dark } = getThemeColorValues('page-bg')

			return html
				.replace('%DATA_THEME%', theme)
				.replace('content="%DATA_THEME_COLOR%"', light ? `content="${light}"` : 'content=""')
				.replace('content="%DATA_DARK_THEME_COLOR%"', dark ? `content="${dark}"` : 'content=""')
		}
	})

	return response
}
