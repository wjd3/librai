// src/lib/services/openaiService.ts
import {
	PRIVATE_CHAT_API_KEY,
	PRIVATE_EMBEDDINGS_MODEL,
	PRIVATE_CHAT_MODEL,
	PRIVATE_CHAT_BASE_URL,
	PRIVATE_EMBEDDINGS_API_KEY
} from '$env/static/private'
import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

const openaiEmbeddings = new OpenAI({
	apiKey: PRIVATE_EMBEDDINGS_API_KEY
})

const openaiChat = new OpenAI({
	apiKey: PRIVATE_CHAT_API_KEY,
	...(PRIVATE_CHAT_BASE_URL ? { baseURL: PRIVATE_CHAT_BASE_URL } : {})
})

export class OpenAIService {
	static async getEmbedding(text: string): Promise<number[]> {
		const response = await openaiEmbeddings.embeddings.create({
			model: PRIVATE_EMBEDDINGS_MODEL,
			input: text,
			// 1536 for text-embedding-3-small or 3072 for text-embedding-3-large
			dimensions: 3072
		})
		return response.data[0].embedding
	}

	static async getChatCompletion(messages: Array<ChatCompletionMessageParam>) {
		const response = await openaiChat.chat.completions.create({
			model: PRIVATE_CHAT_MODEL,
			messages,
			stream: true
		})

		return response
	}

	static async generateAITitle(message: string): Promise<string> {
		try {
			const messages: Array<ChatCompletionMessageParam> = [
				{
					role: 'system',
					content:
						'You are a helpful assistant that generates short, descriptive titles. Generate a concise title (4-6 words and fewer than 151 characters) that captures the main topic or question. Respond with only the title, no quotes or punctuation.'
				},
				{
					role: 'user',
					content: `Generate a short title for this message: ${message}`
				}
			]

			const stream = await this.getChatCompletion(messages)
			let title = ''

			for await (const chunk of stream) {
				const content = chunk.choices[0]?.delta?.content
				if (content) {
					title += content
				}
			}

			// Cleanup and validate the title
			title = title.trim()
			return title || 'New Conversation'
		} catch (error) {
			console.error('Error generating title:', error)
			return message.slice(0, 50).trim() + '...'
		}
	}
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
	const response = await openaiEmbeddings.embeddings.create({
		model: PRIVATE_EMBEDDINGS_MODEL,
		input: query,
		dimensions: 3072
	})
	return response.data[0].embedding
}
