import DOMPurify from 'isomorphic-dompurify'
import { json } from '@sveltejs/kit'
import { getSemanticResults } from '$lib/server/services/qdrantService'
import { OpenAIService } from '$lib/server/services/openAiService'
import { PocketbaseService, type Conversation } from '$lib/server/services/pocketbaseService'
import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private'
import { RateLimitService } from '$lib/server/services/rateLimitService'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

const summarizeConversation = async (history: Array<ChatCompletionMessageParam>) => {
	if (history.length <= 10) return null

	const summaryMessages: Array<ChatCompletionMessageParam> = [
		{
			role: 'system',
			content:
				'Please provide a brief summary of the key points discussed in this conversation. Focus on the main topics and any important conclusions reached.'
		},
		...history
	]

	const summary = await OpenAIService.getChatCompletion(summaryMessages)
	return summary
}

export const POST = async ({ request, locals, getClientAddress }) => {
	const { query, history, conversationId, name } = await request.json()

	// Get user ID or IP address for rate limiting
	const clientIp = getClientAddress()
	const userId = locals.user?.id
	const identifier = userId || clientIp

	// Check rate limit
	const rateLimit = await RateLimitService.checkRateLimit(identifier, !!userId)

	// Add rate limit headers to response
	const headers = {
		'X-RateLimit-Remaining': rateLimit.remaining.toString(),
		'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
	}

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

		// Retrieve context from Qdrant
		const searchResults = await getSemanticResults(sanitizedQuery)
		const context = searchResults.map((result) => `\n\n${result.content}`).join('')

		// Add the user's name to the prompt
		const sanitizedName = DOMPurify.sanitize(name || '')

		// Format the prompt with context and history
		const queryWithContext = `
Context from relevant documents:
${context}

Current query: ${sanitizedQuery}

Please answer the query above, taking into account both the provided context and our conversation history. If the context isn't relevant to the current query, you can ignore it.

${sanitizedName ? `Keep in mind that the user's name is: ${sanitizedName}` : ''}
`

		const conversationHistory = JSON.parse(history || '[]').reduce(
			(
				acc: Array<ChatCompletionMessageParam>,
				item: { isUser: boolean; message: string },
				index: number,
				array: Array<{ isUser: boolean; message: string }>
			) => {
				// Only include last N messages to stay within token limits
				if (array.length - index <= 10) {
					// Adjust number based on your needs
					const sanitizedContent = DOMPurify.sanitize(item?.message || '')
					if (sanitizedContent) {
						acc.push({
							role: item.isUser ? 'user' : 'assistant',
							content: sanitizedContent
						})
					}
				}
				return acc
			},
			[]
		)

		// Add this before constructing the messages array
		const systemPrompt = `${PRIVATE_SYSTEM_PROMPT || ''}

			You are participating in an ongoing conversation. Please:
			1. Maintain context from previous messages
			2. Reference previous parts of the conversation when relevant
			3. If you're unsure about something mentioned earlier, ask for clarification
			4. Use the provided context documents only when they're relevant to the current query`

		// Construct message array for OpenAI
		const messages: Array<ChatCompletionMessageParam> = [
			{ role: 'system', content: systemPrompt },
			...conversationHistory,
			{ role: 'user', content: queryWithContext }
		]

		// Add a summary of older messages if needed
		if (JSON.parse(history || '[]').length > 10) {
			const summary = await summarizeConversation(conversationHistory)

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
