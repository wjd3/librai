// src/routes/api/chatbot/+server.ts

import { json } from '@sveltejs/kit'
import { getSemanticResults } from '$lib/server/services/qdrantService'
import { OpenAIService } from '$lib/server/services/openaiService'
import { systemMessage, humanTemplate } from '$lib/prompts'
import DOMPurify from 'isomorphic-dompurify'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export const POST = async ({ request }) => {
	const { query, history } = await request.json()

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
		// Retrieve context from Qdrant
		const searchResults = await getSemanticResults(sanitizedQuery)
		const context = searchResults.map((result) => `\n\n${result.content}`).join('')

		// Format the prompt with context and history
		const queryWithContext = humanTemplate
			.replace('{query}', sanitizedQuery)
			.replace('{context}', context)

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
			{ role: 'system', content: systemMessage },
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
							controller.enqueue(content)
						}
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
				Connection: 'keep-alive'
			}
		})
	} catch (error) {
		console.error('Error in chatbot route:', error)
		return json({ error: 'Error processing your request.' }, { status: 500 })
	}
}
