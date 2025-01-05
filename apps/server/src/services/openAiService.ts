import { OpenAI } from 'openai'
import { ChunkingService, type TextChunk } from './chunkingService'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

export async function generateEmbedding(chunk: TextChunk): Promise<number[]> {
	// Create rich embedding prompt including metadata
	const embeddingPrompt = `
Title: ${chunk.metadata.bookTitle}
Chunk ${chunk.metadata.chunkIndex + 1} of ${chunk.metadata.totalChunks}

Previous Context: ${chunk.metadata.prevChunkPreview || 'N/A'}

Content:
${chunk.content}

Following Context: ${chunk.metadata.nextChunkPreview || 'N/A'}
	`.trim()

	const response = await openai.embeddings.create({
		model: 'text-embedding-3-large',
		input: embeddingPrompt,
		dimensions: 3072 // Using full dimensions for maximum accuracy
	})

	return response.data[0].embedding
}

export async function generatePoints(params: { content: string; title: string }) {
	// Create chunks using the new chunking service
	const chunks = await ChunkingService.createChunks(params.content, params.title)

	// Generate embeddings for each chunk
	const points = await Promise.all(
		chunks.map(async (chunk, index) => {
			const embedding = await generateEmbedding(chunk)

			return {
				id: Date.now() + index, // Unique ID for each point
				vector: embedding,
				payload: {
					content: chunk.content,
					metadata: chunk.metadata
				}
			}
		})
	)

	return points
}
