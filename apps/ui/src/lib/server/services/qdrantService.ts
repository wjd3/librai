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

export interface EnhancedSearchResult extends QdrantSearchResult {
	score: number // Already included in QdrantSearchResult but explicitly defined here
}

const parseSemanticResults = (
	searchResults: QdrantSearchResult[]
): { title: string; content: string }[] =>
	searchResults.reduce((acc: { title: string; content: string }[], result) => {
		const title = result.payload?.title || result.payload?.metadata?.bookTitle
		if (title && result.payload?.content) {
			acc.push({
				title,
				content: result.payload.content
			})
		}
		return acc
	}, [])

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
export async function searchWithHybrid({
	query,
	limit = 5
}: {
	query: string
	limit?: number
}): Promise<EnhancedSearchResult[]> {
	const queryEmbedding = await OpenAIService.getEmbedding(query)

	const searchResults = await qdrantClient.search(PRIVATE_QDRANT_COLLECTION_NAME, {
		vector: queryEmbedding,
		limit: limit * 2,
		with_payload: true,
		with_vector: true
	})

	// Filter out results that are not relevant
	const HIGH_RELEVANCE_THRESHOLD = 0.46
	const LOW_RELEVANCE_THRESHOLD = 0.35

	// The score property in the response is the vector similarity score from Qdrant
	const highRelevanceResults = searchResults.filter(
		(result) => result.score >= HIGH_RELEVANCE_THRESHOLD
	)
	const lowRelevanceResults = searchResults.filter(
		(result, index) =>
			result.score >= LOW_RELEVANCE_THRESHOLD &&
			result.score < HIGH_RELEVANCE_THRESHOLD &&
			highRelevanceResults.length + index + 1 <= limit
	)

	const filteredResults =
		highRelevanceResults.length < limit
			? [...highRelevanceResults, ...lowRelevanceResults]
			: highRelevanceResults.filter((_, index) => index + 1 <= limit)

	if (highRelevanceResults.length < limit) {
		console.log(
			`Only ${highRelevanceResults.length} high relevance result${
				highRelevanceResults.length === 1 ? '' : 's'
			} found. ${limit} results requested. Returning ${lowRelevanceResults.length} additional low relevance result${
				lowRelevanceResults.length === 1 ? '' : 's'
			}.`
		)
	}
	console.log(
		`${filteredResults.length} results out of ${searchResults.length} vector results kept as relevant.`
	)

	// Sort and limit the results
	const sortedResults = filteredResults.sort((a, b) => b.score - a.score)
	const limitedResults = sortedResults.slice(0, limit)

	return limitedResults as EnhancedSearchResult[]
}
