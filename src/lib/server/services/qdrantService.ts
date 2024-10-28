// src/lib/services/qdrantService.ts

import { OpenAIService } from './openaiService'
import { QdrantClient } from '@qdrant/js-client-rest'
import {
	PRIVATE_QDRANT_ENDPOINT_URL,
	PRIVATE_QDRANT_COLLECTION_NAME,
	PRIVATE_QDRANT_API_KEY
} from '$env/static/private'

// Initialize Qdrant Client
const qdrantClient = new QdrantClient({
	url: PRIVATE_QDRANT_ENDPOINT_URL,
	apiKey: PRIVATE_QDRANT_API_KEY
})

export async function getSemanticResults(query: string, topK: number = 5) {
	const queryEmbedding = await OpenAIService.getEmbedding(query)
	const searchResults = await qdrantClient.search(PRIVATE_QDRANT_COLLECTION_NAME, {
		vector: queryEmbedding,
		limit: topK // topK specifies the number of top results to return from the search,
	})

	return searchResults.map((result) => ({
		title: result.payload?.title,
		content: result.payload?.content
	}))
}
