import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private'
import DOMPurify from 'isomorphic-dompurify'
import { json } from '@sveltejs/kit'
import { OpenAIService } from '$lib/server/services/openAiService'
import { PocketbaseService, type Conversation } from '$lib/server/services/pocketbaseService'
import { RateLimitService } from '$lib/server/services/rateLimitService'
import { searchWithHybrid } from '$lib/server/services/qdrantService'
import { chatService } from '$lib/server/services/chatService'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export const POST = async ({ request, locals, getClientAddress }) => {
	const { query, history, conversationId } = await request.json()

	const userId = locals.user?.id
	const headers: Record<string, string> = {}

	// Rate limit in production
	if (import.meta.env.PROD) {
		const clientIp = getClientAddress()
		const identifier = userId || clientIp

		// Check rate limit
		const rateLimit = await RateLimitService.checkRateLimit(identifier, !!userId)

		// Add rate limit headers to response
		headers['X-RateLimit-Remaining'] = rateLimit.remaining.toString()
		headers['X-RateLimit-Reset'] = rateLimit.resetAt.toISOString()

		if (!rateLimit.allowed) {
			const resetAt = rateLimit.resetAt.toLocaleTimeString()
			return json(
				{
					error: `Rate limit exceeded. Please try again after ${resetAt}.`,
					remaining: rateLimit.remaining,
					resetAt: rateLimit.resetAt
				},
				{
					status: 429,
					headers
				}
			)
		}
	}

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
		let conversation: Conversation | null = null
		let responseMessage = ''

		if (userId) {
			if (conversationId) {
				// Update existing conversation
				conversation = await PocketbaseService.updateConversation(conversationId, [
					...JSON.parse(history || '[]'),
					{ message: sanitizedQuery, isUser: true, created: new Date().toISOString() }
				])
			} else {
				// Create new conversation and redirect
				const title = await OpenAIService.generateAITitle(sanitizedQuery)
				conversation = await PocketbaseService.createConversation({
					userId,
					firstMessage: sanitizedQuery,
					title
				})
			}
		}

		// Use hybrid search for better results
		const searchResults = await searchWithHybrid({ query: sanitizedQuery })
		const enhancedContext = chatService.buildEnhancedContext(searchResults)

		const systemPrompt = `
${PRIVATE_SYSTEM_PROMPT || ''}

You are a knowledgeable assistant with access to specific source materials.
When answering:
1. Primarily use the provided context
2. Cite specific parts of the source material
3. If the context doesn't contain relevant information, say so
4. Maintain conversation history for continuity
5. Use clear formatting for readability

Context:
${enhancedContext}
		`.trim()

		// Construct message array for OpenAI
		const conversationHistory = JSON.parse(history || '[]')
		const parsedConversationHistory = conversationHistory.map(
			(message: { message: string; isUser: boolean }) => ({
				role: message.isUser ? 'user' : 'assistant',
				content: message.message
			})
		)

		const messages: Array<ChatCompletionMessageParam> = [
			{ role: 'system', content: systemPrompt },
			...parsedConversationHistory
		]

		// Add a summary of older messages if needed
		if (JSON.parse(history || '[]').length > 10) {
			const summary = await chatService.summarizeConversation(JSON.parse(history || '[]'))

			if (summary) {
				messages.unshift({
					role: 'system',
					content: `Previous conversation summary: ${summary}`
				})
			}
		}

		// Set up streaming response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					const stream = await OpenAIService.getChatCompletion(messages)

					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content
						if (content) {
							responseMessage += content
							controller.enqueue(content)
						}
					}

					// Ensure we have some content before closing
					if (!responseMessage) {
						throw new Error('No content received from OpenAI')
					}

					// Update conversation after stream completes
					if (userId && conversation) {
						try {
							const updatedConversation = [
								{ message: sanitizedQuery, isUser: true, created: new Date().toISOString() },
								{ message: responseMessage, isUser: false, created: new Date().toISOString() }
							]

							const conversationHistory = JSON.parse(history || '[]')
							if (Array.isArray(conversationHistory)) {
								const lastMessage = conversationHistory[conversationHistory.length - 1]
								const isNewConversation =
									conversationHistory.length === 1 &&
									lastMessage?.isUser &&
									lastMessage.message === sanitizedQuery

								if (!isNewConversation) {
									updatedConversation.unshift(...conversationHistory)
								}
							}

							await PocketbaseService.updateConversation(conversation.id, updatedConversation)
						} catch (error) {
							console.error('Error updating conversation:', error)
							// Don't throw here - we still want to close the stream successfully
						}
					}

					controller.close()
				} catch (error) {
					console.error('Stream error:', error)
					// Ensure we send an error message before closing
					controller.enqueue('An error occurred while processing your request.')
					controller.error(error)
				}
			}
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'X-Conversation-Id': conversation?.id || '',
				...headers
			}
		})
	} catch (error) {
		console.error('Chatbot error:', error)

		return json(
			{ error: 'Error processing your request.' },
			{
				status: 500,
				headers
			}
		)
	}
}
