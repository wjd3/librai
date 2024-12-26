import { json } from '@sveltejs/kit'
import { getSemanticResults } from '$lib/server/services/qdrantService'
import { OpenAIService } from '$lib/server/services/openaiService'
import { PocketbaseService, type Conversation } from '$lib/server/services/pocketbaseService'
import DOMPurify from 'isomorphic-dompurify'
import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { RateLimitService } from '$lib/server/services/rateLimitService'

export const POST = async ({ request, locals, getClientAddress }) => {
	const { query, history, conversationId } = await request.json()
	const userId = locals.user?.id
	const identifier = userId || getClientAddress()

	// Check rate limit
	const rateLimit = await RateLimitService.checkRateLimit(identifier, !!userId)

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
				headers: {
					'X-RateLimit-Remaining': rateLimit.remaining.toString(),
					'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
				}
			}
		)
	}

	// Add rate limit headers to response
	const headers = {
		'X-RateLimit-Remaining': rateLimit.remaining.toString(),
		'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
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
				// Only update with the user's message initially
				conversation = await PocketbaseService.updateConversation(conversationId, [
					...JSON.parse(history || '[]'),
					{ message: sanitizedQuery, isUser: true, created: new Date().toISOString() }
				])
			} else {
				// Create new conversation with AI-generated title
				const title = await OpenAIService.generateAITitle(sanitizedQuery)
				conversation = await PocketbaseService.createConversation(userId, sanitizedQuery, title)
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

		// Set up streaming response
		const stream = new ReadableStream({
			async start(controller) {
				const stream = await OpenAIService.getChatCompletion(messages)

				try {
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content
						if (content) {
							responseMessage += content
							controller.enqueue(content)
						}
					}

					// Update conversation with complete response after stream ends
					if (userId && conversation) {
						await PocketbaseService.updateConversation(conversation.id, [
							...JSON.parse(history || '[]'),
							{ message: sanitizedQuery, isUser: true, created: new Date().toISOString() },
							{ message: responseMessage, isUser: false, created: new Date().toISOString() }
						])
					}

					controller.close()
				} catch (error) {
					console.error('Stream error:', error)
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
		console.error('Error in chatbot route:', error)
		return json(
			{ error: 'Error processing your request.' },
			{
				status: 500,
				headers
			}
		)
	}
}
