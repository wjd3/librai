import { json } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'

export const POST = async ({ request, locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { title, messages } = await request.json()

		// Create new conversation specifically for fork
		const conversation = await PocketbaseService.createConversation({
			userId,
			firstMessage: messages[0]?.message,
			title: title
		})

		// Add all messages from the original conversation
		await PocketbaseService.updateConversation(conversation.id, messages)

		return json(conversation)
	} catch (error) {
		console.error('Error forking conversation:', error)
		return json({ error: 'Error forking conversation' }, { status: 500 })
	}
}
