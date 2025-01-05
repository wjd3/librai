import { OpenAIService } from '$lib/server/services/openAiService'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import type { EnhancedSearchResult } from './qdrantService'

class ChatService {
	constructor() {}

	async summarizeConversation(history: Array<ChatCompletionMessageParam>) {
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

	buildEnhancedContext(searchResults: EnhancedSearchResult[]) {
		const primaryContext = searchResults[0]
		const supportingContext = searchResults.slice(1, 3)

		return `
    Primary Source (Relevance: ${primaryContext ? primaryContext.score.toFixed(2) : 'N/A'}):
    ${primaryContext ? primaryContext.payload.content : 'N/A'}
    
    Supporting Context:
    ${supportingContext
			?.map(
				(ctx) =>
					`[Relevance: ${ctx.score.toFixed(2)}]
       ${ctx.payload.content}`
			)
			.join('\n\n')
			.trim()}
    
    Source Information:
    ${primaryContext?.payload?.metadata ? primaryContext.payload.metadata.bookTitle : 'N/A'}
      `.trim()
	}
}

export const chatService = new ChatService()
