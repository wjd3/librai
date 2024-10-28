// src/routes/api/chatbot/+server.ts

import { json } from '@sveltejs/kit'
import { getSemanticResults } from '$lib/server/services/qdrantService'
import { OpenAIService } from '$lib/server/services/openaiService'
import { systemMessage, humanTemplate } from '$lib/prompts'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export const POST = async ({ request }) => {
	const { query } = await request.json()

	try {
		// Retrieve context from Qdrant
		const searchResults = await getSemanticResults(query)
		const context = searchResults.map((result) => result.content).join('\n\n')

		// Format the prompt with context
		const queryWithContext = humanTemplate.replace('{query}', query).replace('{context}', context)

		// Construct message array for OpenAI
		const messages: Array<ChatCompletionMessageParam> = [
			{ role: 'system', content: systemMessage },
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
