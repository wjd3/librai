import { json } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'

export const POST = async ({ params, locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const conversation = await PocketbaseService.shareConversation(params.id)
		return json(conversation)
	} catch (error) {
		console.error('Error sharing conversation:', error)
		return json({ error: 'Error sharing conversation' }, { status: 500 })
	}
}

export const DELETE = async ({ params, locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const conversation = await PocketbaseService.unshareConversation(params.id)
		return json(conversation)
	} catch (error) {
		console.error('Error unsharing conversation:', error)
		return json({ error: 'Error unsharing conversation' }, { status: 500 })
	}
}
