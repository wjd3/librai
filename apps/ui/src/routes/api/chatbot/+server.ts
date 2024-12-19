import { json } from '@sveltejs/kit'
import { getSemanticResults } from '$lib/server/services/qdrantService'
import { OpenAIService } from '$lib/server/services/openaiService'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'
import DOMPurify from 'isomorphic-dompurify'
import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export const POST = async ({ request, locals }) => {
	const { query, history, conversationId } = await request.json()
	const userId = locals.user?.id

	const sanitizedQuery = DOMPurify.sanitize(query)
	if (!sanitizedQuery || sanitizedQuery.length < 1 || sanitizedQuery.length > 4096) {
		return json(
			{
				response: "I'm sorry, I couldn't understand that! Please try again.",
				error: 'Invalid query.'
			},
			{ status: 400 }
		)
	}

	try {
		// Create or update conversation if user is authenticated
		let conversation = null
		if (userId) {
			if (conversationId) {
				conversation = await PocketbaseService.updateConversation(conversationId, [
					...JSON.parse(history || '[]'),
					{ message: sanitizedQuery, isUser: true, created: new Date().toISOString() }
				])
			} else {
				conversation = await PocketbaseService.createConversation(userId, sanitizedQuery)
			}
		}

		// Retrieve context from Qdrant
		const searchResults = await getSemanticResults(sanitizedQuery)
		const context = searchResults.map((result) => `\n\n${result.content}`).join('')

		// Format the prompt with context and history
		const queryWithContext = `
    User Query: ${sanitizedQuery}

    Relevant Transcript Snippets: ${context}
`

		const conversationHistory = JSON.parse(history || '[]').reduce(
			(acc: Array<ChatCompletionMessageParam>, item: { isUser: boolean; message: string }) => {
				const sanitizedContent = DOMPurify.sanitize(item?.message || '')

				if (sanitizedContent) {
					acc.push({
						role: item.isUser ? 'user' : 'assistant',
						content: sanitizedContent
					})
				}

				return acc
			},
			[]
		)

		// Construct message array for OpenAI
		const messages: Array<ChatCompletionMessageParam> = [
			...(PRIVATE_SYSTEM_PROMPT ? [{ role: 'system', content: PRIVATE_SYSTEM_PROMPT }] : []),
			...conversationHistory,
			{ role: 'user', content: queryWithContext }
		]

		// Set up streaming response with conversation ID
		const stream = new ReadableStream({
			async start(controller) {
				const stream = await OpenAIService.getChatCompletion(messages)
				let responseMessage = ''

				try {
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content
						if (content) {
							responseMessage += content
							controller.enqueue(content)
						}
					}

					// Save the AI response if user is authenticated
					if (userId && conversation) {
						await PocketbaseService.updateConversation(conversation.id, [
							...conversation.messages,
							{ message: responseMessage, isUser: false, created: new Date().toISOString() }
						])
					}

					controller.close()
				} catch (error) {
					controller.error(error)
				}
			}
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'X-Conversation-Id': conversation?.id || ''
			}
		})
	} catch (error) {
		console.error('Error in chatbot route:', error)
		return json({ error: 'Error processing your request.' }, { status: 500 })
	}
}
