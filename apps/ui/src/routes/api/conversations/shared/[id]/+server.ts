import { json } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'

export const GET = async ({ params }) => {
	try {
		const conversation = await PocketbaseService.getSharedConversation(params.id)
		if (!conversation) {
			return json({ error: 'Conversation not found' }, { status: 404 })
		}
		return json(conversation)
	} catch (error) {
		console.error('Error fetching shared conversation:', error)
		return json({ error: 'Error fetching shared conversation' }, { status: 500 })
	}
}
