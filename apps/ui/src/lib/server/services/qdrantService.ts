// src/lib/services/qdrantService.ts

import { OpenAIService } from './openAiService'
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

type QdrantSearchResult = {
	id: string | number
	version: number
	score: number
	payload?: {
		title?: string
		content?: string
		concepts?: string[]
	} | null
	vector?:
		| Record<string, unknown>
		| number[]
		| number[][]
		| {
				[key: string]:
					| number[]
					| number[][]
					| {
							text: string
							model?: string | null | undefined
					  }
					| {
							indices: number[]
							values: number[]
					  }
					| undefined
		  }
		| {
				text: string
				model?: string | null | undefined
		  }
		| null
		| undefined
	shard_key?: string | number | Record<string, unknown> | null | undefined
	order_value?: number | Record<string, unknown> | null | undefined
}

const parseSemanticResults = (searchResults: QdrantSearchResult[]) =>
	searchResults.reduce((acc: { title: string; content: string; concepts?: string[] }[], result) => {
		if (result.payload?.title && result.payload?.content) {
			acc.push({
				title: result.payload.title,
				content: result.payload.content,
				concepts: result.payload.concepts || []
			})
		}
		return acc
	}, [])

export async function getSemanticResults(query: string, topK: number = 40) {
	// Get concepts from the query
	const queryConcepts = await OpenAIService.extractConcepts(query)

	// Convert the query to an embedding
	const queryEmbedding = await OpenAIService.getEmbedding(query)

	// Search the Qdrant collection with both vector similarity and concept filtering
	const searchResults = await qdrantClient.search(PRIVATE_QDRANT_COLLECTION_NAME, {
		vector: queryEmbedding,
		limit: topK,
		filter:
			queryConcepts.length > 0
				? {
						must: [
							{
								should: queryConcepts.map((concept) => ({
									key: 'concepts',
									match: { value: concept }
								}))
							}
						]
					}
				: undefined
	})

	// Parse and sort results by relevance
	const parsedResults = parseSemanticResults(searchResults)

	// Sort results to prioritize those with matching concepts
	return parsedResults.sort((a, b) => {
		const aMatchCount = a.concepts?.filter((c) => queryConcepts.includes(c)).length || 0
		const bMatchCount = b.concepts?.filter((c) => queryConcepts.includes(c)).length || 0
		return bMatchCount - aMatchCount
	})
}
