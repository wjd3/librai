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
	if (!sanitizedQuery || sanitizedQuery.length < 8) {
		return json({ error: 'Invalid query.' }, { status: 400 })
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

		// Get OpenAI response
		const botResponse = await OpenAIService.getChatCompletion(messages)
		return json({ response: botResponse })
	} catch (error) {
		console.error('Error in chatbot route:', error)
		return json({ error: 'Error processing your request.' }, { status: 500 })
	}
}
