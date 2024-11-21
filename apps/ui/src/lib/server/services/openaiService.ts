// src/lib/services/openaiService.ts

import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import {
	PRIVATE_OPENAI_API_KEY,
	PRIVATE_OPENAI_EMBEDDINGS_MODEL,
	PRIVATE_OPENAI_CHAT_MODEL
} from '$env/static/private'

const openai = new OpenAI({ apiKey: PRIVATE_OPENAI_API_KEY })

export class OpenAIService {
	static async getEmbedding(text: string): Promise<number[]> {
		const response = await openai.embeddings.create({
			model: PRIVATE_OPENAI_EMBEDDINGS_MODEL,
			input: text,
			// 1536 for text-embedding-3-small or 3072 for text-embedding-3-large
			dimensions: 3072
		})
		return response.data[0].embedding
	}

	static async getChatCompletion(messages: Array<ChatCompletionMessageParam>) {
		const response = await openai.chat.completions.create({
			model: PRIVATE_OPENAI_CHAT_MODEL,
			messages,
			stream: true
		})

		return response
	}
}
