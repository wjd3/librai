// src/routes/api/conversations/+server.ts
import { json } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'
import { OpenAIService } from '$lib/server/services/openAiService'
import DOMPurify from 'isomorphic-dompurify'

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

		const sanitizedFirstMessage = DOMPurify.sanitize(messages[0]?.message)
		let generatedTitle = DOMPurify.sanitize(title)

		if (!generatedTitle && sanitizedFirstMessage) {
			// Generate title using OpenAI if not provided
			generatedTitle = await OpenAIService.generateAITitle(sanitizedFirstMessage)
		}

		// Create new conversation
		const conversation = await PocketbaseService.createConversation({
			userId,
			firstMessage: sanitizedFirstMessage,
			title: generatedTitle
		})

		return json(conversation)
	} catch (error) {
		console.error('Error saving conversation:', error)
		return json({ error: 'Error saving conversation' }, { status: 500 })
	}
}
