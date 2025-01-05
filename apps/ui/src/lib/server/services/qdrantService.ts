// src/lib/server/services/qdrantService.ts
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

export type QdrantSearchResult = {
	id: string | number
	version: number
	score: number
	payload: {
		content: string
		title?: string // Made optional since it's checked in parseSemanticResults
		metadata: {
			bookTitle: string
			score?: number // Added for the filter in searchWithHybrid
		}
	}
	vector?: Record<string, unknown> | number[] | number[][] | null | undefined
	shard_key?: string | number | Record<string, unknown> | null | undefined
	order_value?: number | Record<string, unknown> | null | undefined
}

const parseSemanticResults = (
	searchResults: QdrantSearchResult[]
): { title: string; content: string }[] => {
	return searchResults.reduce((acc: { title: string; content: string }[], result) => {
		const title = result.payload?.title || result.payload?.metadata?.bookTitle
		if (title && result.payload?.content) {
			acc.push({
				title,
				content: result.payload.content
			})
		}
		return acc
	}, [])
}

export async function getSemanticResults(query: string, topK: number = 40) {
	// Convert the query to an embedding
	const queryEmbedding = await OpenAIService.getEmbedding(query)

	// Search the Qdrant collection for the query embedding
	const searchResults = await qdrantClient.search(PRIVATE_QDRANT_COLLECTION_NAME, {
		vector: queryEmbedding,
		limit: topK // topK specifies the number of top results to return from the search
	})

	// Parse the search results to give context to the AI API
	const parsedResults = parseSemanticResults(searchResults as QdrantSearchResult[])
	return parsedResults
}

interface SearchParams {
	query: string
	limit?: number
}

const RELEVANCE_THRESHOLDS = {
	HIGH: 0.46,
	LOW: 0.35
} as const

export async function searchWithHybrid({
	query,
	limit = 5
}: SearchParams): Promise<QdrantSearchResult[]> {
	// Get embedding and search results
	const queryEmbedding = await OpenAIService.getEmbedding(query)
	const searchResults = await qdrantClient.search(PRIVATE_QDRANT_COLLECTION_NAME, {
		vector: queryEmbedding,
		limit: limit * 2,
		with_payload: true,
		with_vector: true
	})

	// Filter results by relevance
	const highRelevanceResults = searchResults.filter(
		(result) => result.score >= RELEVANCE_THRESHOLDS.HIGH
	)

	// If we have enough high relevance results, return them
	if (highRelevanceResults.length >= limit) {
		return highRelevanceResults.slice(0, limit) as QdrantSearchResult[]
	}

	// Add low relevance results if needed
	const lowRelevanceResults = searchResults.filter(
		(result) => result.score >= RELEVANCE_THRESHOLDS.LOW && result.score < RELEVANCE_THRESHOLDS.HIGH
	)

	const combinedResults = [...highRelevanceResults, ...lowRelevanceResults]

	// Return combined results, or fall back to top results if no relevant matches
	return (combinedResults.length > 0 ? combinedResults : searchResults)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit) as QdrantSearchResult[]
}
