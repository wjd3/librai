// src/routes/api/chatbot/+server.ts
import DOMPurify from 'isomorphic-dompurify'
import { json } from '@sveltejs/kit'
import { OpenAIService } from '$lib/server/services/openAiService'
import {
	PocketbaseService,
	type ChatMessage,
	type Conversation
} from '$lib/server/services/pocketbaseService'
import { RateLimitService } from '$lib/server/services/rateLimitService'
import { searchWithHybrid } from '$lib/server/services/qdrantService'
import { chatService } from '$lib/server/services/chatService'
import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private'

export const POST = async ({ request, locals, getClientAddress }) => {
	const { query: rawQuery, history: rawHistory, conversationId, name } = await request.json()

	// Censor the query and history
	// const censoredQuery = censorText(DOMPurify.sanitize(rawQuery))
	const query = DOMPurify.sanitize(rawQuery)
	const history = JSON.parse(rawHistory || '[]').map((msg: ChatMessage) => ({
		...msg,
		// message: censorText(msg.message)
		message: msg.message
	}))

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

	if (!query || query.length < 1 || query.length > 4096) {
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
		const conversationHistory = history

		if (userId) {
			if (conversationId) {
				// Update existing conversation
				conversation = await PocketbaseService.updateConversation(conversationId, [
					...conversationHistory,
					{ message: query, isUser: true, created: new Date().toISOString() }
				])
			} else {
				// Create new conversation
				const title = await OpenAIService.generateAITitle(query)
				conversation = await PocketbaseService.createConversation({
					userId,
					firstMessage: query,
					title
				})
			}
		}

		// Use hybrid search for better results
		const searchResults = await searchWithHybrid({ query })
		const enhancedContext = chatService.buildEnhancedContext(searchResults)

		// Prepare conversation history with smart summarization
		const messages = await chatService.prepareConversationHistory(conversationHistory)

		// Construct the complete system prompt
		const systemPrompt = chatService.constructSystemPrompt({
			enhancedContext,
			customPrompt: PRIVATE_SYSTEM_PROMPT,
			userActualName: DOMPurify.sanitize(name || '')
		})

		// Add system message at the beginning
		messages.unshift({ role: 'system', content: systemPrompt })

		// Add current user query
		messages.push({ role: 'user', content: query })

		// Set up streaming response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					const stream = await OpenAIService.getChatCompletion(messages)

					// Add event listener for request cancellation
					request.signal.addEventListener('abort', () => {
						controller.close()
					})

					for await (const chunk of stream) {
						// Check if request was aborted
						if (request.signal.aborted) {
							controller.close()
							return
						}

						const content = chunk.choices[0]?.delta?.content
						if (content) {
							responseMessage += content
							controller.enqueue(content)
						}
					}

					if (!responseMessage) {
						throw new Error('No content received from OpenAI')
					}

					// Update conversation after stream completes
					if (userId && conversation) {
						try {
							const isNewConversation =
								conversationHistory.length === 1 && conversationHistory[0].isUser

							// Prepare the updated conversation history
							const updatedConversation = [
								...conversationHistory,
								// Avoid repeating the first message in the conversation history
								...(!isNewConversation
									? [{ message: query, isUser: true, created: new Date().toISOString() }]
									: []),
								{ message: responseMessage, isUser: false, created: new Date().toISOString() }
							]

							await PocketbaseService.updateConversation(conversation.id, updatedConversation)
						} catch (error) {
							console.error('Error updating conversation:', error)
						}
					}

					controller.close()
				} catch (error) {
					console.error('Stream error:', error)
					if ((error as Error).name === 'AbortError') {
						controller.close()
						return
					}
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
