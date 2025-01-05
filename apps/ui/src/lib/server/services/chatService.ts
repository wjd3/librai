// src/lib/server/services/chatService.ts
import { OpenAIService } from '$lib/server/services/openAiService'
import type {
	ChatCompletionMessageParam,
	ChatCompletionSystemMessageParam,
	ChatCompletionUserMessageParam
} from 'openai/resources/index.mjs'
import type { QdrantSearchResult } from './qdrantService'
import type { ChatCompletionAssistantMessageParam } from 'openai/src/resources/index.js'

class ChatService {
	// Maximum number of messages to keep in full context
	private readonly MAX_RECENT_MESSAGES = 10
	// Maximum total messages before summarization
	private readonly MAX_TOTAL_MESSAGES = 20

	constructor() {}

	async summarizeConversation(history: Array<{ message: string; isUser: boolean }>) {
		if (history.length <= this.MAX_RECENT_MESSAGES) return null

		// Convert history to OpenAI format
		const convertHistoryToOpenAIFormat = (
			history: { message: string; isUser: boolean }[]
		): ChatCompletionMessageParam[] => {
			const systemMessage: ChatCompletionSystemMessageParam = {
				role: 'system',
				content: `Summarize the key points of this conversation in a concise way. 
                  Focus on: 
                  1. Main topics discussed
                  2. Important decisions or conclusions
                  3. Any specific context that would be important for continuing the conversation
                  Be specific but brief.`
			}

			const convertedMessages: (
				| ChatCompletionUserMessageParam
				| ChatCompletionAssistantMessageParam
			)[] = history.map((msg) => ({
				role: msg.isUser ? ('user' as const) : ('assistant' as const),
				content: msg.message
			}))

			return [systemMessage, ...convertedMessages]
		}

		const messages = convertHistoryToOpenAIFormat(history)
		const stream = await OpenAIService.getChatCompletion(messages)
		let summary = ''

		for await (const chunk of stream) {
			const content = chunk.choices[0]?.delta?.content
			if (content) {
				summary += content
			}
		}

		return summary
	}

	async prepareConversationHistory(history: Array<{ message: string; isUser: boolean }>) {
		const messages: Array<ChatCompletionMessageParam> = []

		if (history.length > this.MAX_TOTAL_MESSAGES) {
			// Get older messages for summarization
			const olderMessages = history.slice(0, -this.MAX_RECENT_MESSAGES)
			const summary = await this.summarizeConversation(olderMessages)

			if (summary) {
				messages.push({
					role: 'system',
					content: `Previous conversation context: ${summary}`
				})
			}

			// Add recent messages in full
			const recentMessages = history.slice(-this.MAX_RECENT_MESSAGES)
			messages.push(
				...recentMessages.map((msg) => ({
					role: msg.isUser ? ('user' as const) : ('assistant' as const),
					content: msg.message
				}))
			)
		} else {
			// If under threshold, include all messages
			messages.push(
				...history.map((msg) => ({
					role: msg.isUser ? ('user' as const) : ('assistant' as const),
					content: msg.message
				}))
			)
		}

		return messages
	}

	buildEnhancedContext(searchResults: QdrantSearchResult[]) {
		if (!searchResults.length) return ''

		const primaryContext = searchResults[0]
		const supportingContext = searchResults.slice(1, 3)

		const contextParts = []

		// Add primary context with relevance score
		if (primaryContext) {
			contextParts.push(`Primary Source (Relevance: ${primaryContext.score.toFixed(2)}):
${primaryContext.payload.content.trim()}`)
		}

		// Add supporting context if available
		if (supportingContext.length) {
			contextParts.push(`Supporting Context:
${supportingContext
	.map(
		(ctx) => `[Relevance: ${ctx.score.toFixed(2)}]
${ctx.payload.content.trim()}`
	)
	.join('\n\n')}`)
		}

		// Add source information
		if (primaryContext?.payload?.metadata?.bookTitle) {
			contextParts.push(`Source: ${primaryContext.payload.metadata.bookTitle}`)
		}

		return contextParts.join('\n\n')
	}

	constructSystemPrompt({
		enhancedContext,
		conversationSummary,
		customPrompt,
		userActualName
	}: {
		enhancedContext: string
		conversationSummary?: string
		customPrompt?: string
		userActualName?: string
	}) {
		const promptParts = [
			// Include the private system prompt if provided or fall back to the default assistant behavior
			customPrompt
				? customPrompt
				: `You are a knowledgeable assistant with access to specific source materials.
When answering:
1. Primarily use the provided context
2. Cite specific parts of the source material
3. If the context doesn't contain relevant information, do not say so
4. Maintain consistent personality and knowledge across the conversation
5. Use clear formatting for readability`,

			userActualName && `User Name: ${userActualName}`,

			enhancedContext && `Context:\n${enhancedContext}`,

			conversationSummary && `Previous Conversation Summary:\n${conversationSummary}`
		].filter(Boolean)

		return promptParts.join('\n\n')
	}
}

export const chatService = new ChatService()
