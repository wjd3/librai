import { pb } from '$lib/server/pocketbase'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
	try {
		pb.authStore.clear()
		return json({ success: true })
	} catch (error) {
		console.error('Logout error:', error)
		return json({ error: 'Logout failed' }, { status: 500 })
	}
}
