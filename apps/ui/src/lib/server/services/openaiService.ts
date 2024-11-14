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
			input: text
		})
		return response.data[0].embedding
	}

	static async getChatCompletion(messages: Array<ChatCompletionMessageParam>) {
		const response = await openai.chat.completions.create({
			model: PRIVATE_OPENAI_CHAT_MODEL,
			messages
		})
		return response.choices[0].message.content
	}
}
