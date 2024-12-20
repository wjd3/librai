import { json } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'

export const GET = async ({ locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const conversations = await PocketbaseService.getConversations(userId)
		return json(conversations)
	} catch (error) {
		console.error('Error fetching conversations:', error)
		return json({ error: 'Error fetching conversations' }, { status: 500 })
	}
}

export const POST = async ({ request, locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { messages, title } = await request.json()
		const conversation = await PocketbaseService.createConversation(userId, title)
		await PocketbaseService.updateConversation(conversation.id, messages)
		return json({ success: true })
	} catch (error) {
		console.error('Error saving conversation:', error)
		return json({ error: 'Error saving conversation' }, { status: 500 })
	}
}
