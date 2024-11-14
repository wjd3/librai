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

type QdrantSearchResult = {
	id: string | number
	version: number
	score: number
	payload?:
		| Record<string, unknown>
		| {
				[key: string]: unknown
		  }
		| null
		| undefined
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
	searchResults.reduce((acc: { title: string; content: string }[], result) => {
		if (result.payload?.title && result.payload?.content) {
			acc.push({
				title: result.payload.title as string,
				content: result.payload.content as string
			})
		}
		return acc
	}, [])

export async function getSemanticResults(query: string, topK: number = 40) {
	// Convert the query to an embedding
	const queryEmbedding = await OpenAIService.getEmbedding(query)

	// Search the Qdrant collection for the query embedding
	const searchResults: QdrantSearchResult[] = await qdrantClient.search(
		PRIVATE_QDRANT_COLLECTION_NAME,
		{
			vector: queryEmbedding,
			limit: topK // topK specifies the number of top results to return from the search
		}
	)

	// Parse the search results to give context to the AI API
	const parsedResults = parseSemanticResults(searchResults)
	return parsedResults
}
