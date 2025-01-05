import { encode, decode } from 'gpt-tokenizer'

interface ChunkMetadata {
	bookTitle: string
	chunkIndex: number
	totalChunks: number
	prevChunkPreview?: string
	nextChunkPreview?: string
	startParagraph: string
	endParagraph: string
}

export interface TextChunk {
	content: string
	metadata: ChunkMetadata
}

export class ChunkingService {
	private static MAX_TOKENS_PER_CHUNK = 512
	private static OVERLAP_TOKENS = 50

	static async createChunks(text: string, bookTitle: string): Promise<TextChunk[]> {
		// Encode text into tokens
		const tokens = encode(text)

		// Create chunks with overlap
		const chunks: TextChunk[] = []
		let currentIndex = 0

		while (currentIndex < tokens.length) {
			const chunkTokens = tokens.slice(
				Math.max(0, currentIndex - this.OVERLAP_TOKENS),
				Math.min(currentIndex + this.MAX_TOKENS_PER_CHUNK, tokens.length)
			)

			const chunkText = decode(chunkTokens)

			// Find paragraph boundaries
			const paragraphs = chunkText.split('\n\n')
			const cleanedText = this.cleanChunkBoundaries(paragraphs)

			// Create chunk metadata
			const metadata: ChunkMetadata = {
				bookTitle,
				chunkIndex: chunks.length,
				totalChunks: Math.ceil(tokens.length / this.MAX_TOKENS_PER_CHUNK),
				prevChunkPreview:
					chunks.length > 0 ? chunks[chunks.length - 1].content.slice(-100) : undefined,
				nextChunkPreview:
					currentIndex + this.MAX_TOKENS_PER_CHUNK < tokens.length
						? decode(
								tokens.slice(
									currentIndex + this.MAX_TOKENS_PER_CHUNK,
									currentIndex + this.MAX_TOKENS_PER_CHUNK + 100
								)
							)
						: undefined,
				startParagraph: paragraphs[0],
				endParagraph: paragraphs[paragraphs.length - 1]
			}

			chunks.push({
				content: cleanedText,
				metadata
			})

			currentIndex += this.MAX_TOKENS_PER_CHUNK - this.OVERLAP_TOKENS
		}

		return chunks
	}

	private static cleanChunkBoundaries(paragraphs: string[]): string {
		// Ensure chunks break at paragraph boundaries
		return paragraphs.filter((p) => p.trim().length > 0).join('\n\n')
	}
}
