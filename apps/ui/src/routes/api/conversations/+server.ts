import { json } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'
import { OpenAIService } from '$lib/server/services/openaiService'

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
		let generatedTitle = title

		if (!generatedTitle && messages[0]?.message) {
			// Generate title using OpenAI if not provided
			generatedTitle = await OpenAIService.generateAITitle(messages[0].message)
		}

		// Create new conversation
		const conversation = await PocketbaseService.createConversation(
			userId,
			messages[0]?.message || '',
			generatedTitle || 'New Conversation'
		)

		// If messages were provided (forking case), add them to the conversation
		if (messages && messages.length > 0) {
			await PocketbaseService.updateConversation(conversation.id, messages)
		}

		return json(conversation)
	} catch (error) {
		console.error('Error saving conversation:', error)
		return json({ error: 'Error saving conversation' }, { status: 500 })
	}
}
