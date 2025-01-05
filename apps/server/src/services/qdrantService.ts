import { QdrantClient } from '@qdrant/js-client-rest'
import { generatePoints } from './openAiService'

export class QdrantService {
	private client: QdrantClient

	constructor() {
		if (
			!process.env.QDRANT_API_URL ||
			!process.env.QDRANT_API_KEY ||
			!process.env.QDRANT_COLLECTION
		) {
			throw new Error('Missing required Qdrant environment variables')
		}

		this.client = new QdrantClient({
			url: process.env.QDRANT_API_URL,
			apiKey: process.env.QDRANT_API_KEY
		})
	}

	async storeFileEmbeddings({
		fileContent,
		fileTitle
	}: {
		fileContent: string
		fileTitle: string
	}) {
		try {
			const points = await generatePoints({ content: fileContent, title: fileTitle })

			const result = await this.client.upsert(process.env.QDRANT_COLLECTION as string, {
				points,
				wait: true // Ensure points are indexed before continuing
			})

			console.log(`Embeddings stored for "${fileTitle}"`)
			return result.status
		} catch (error) {
			console.error(`Error storing embeddings for "${fileTitle}":`, error)
			throw error
		}
	}
}

export const qdrantService = new QdrantService()
