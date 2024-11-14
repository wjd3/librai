import { OpenAI } from 'openai'
import { v4 as uuidv4 } from 'uuid'
import type { EmbeddingModel } from 'openai/resources'

if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_EMBEDDINGS_MODEL) {
	throw new Error(
		'One or more required environment variables are undefined: OPENAI_API_KEY, OPENAI_EMBEDDINGS_MODEL'
	)
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const generatePoints = async ({
	content,
	title
}: {
	content: string
	title: string
}): Promise<{ id: string; vector: number[]; payload: Record<any, any> }[]> => {
	const maxCharactersPerCall = 2000
	let embeddings: { id: string; vector: number[]; payload: Record<any, any> }[] = []

	// Split content into chunks if it exceeds the max character limit
	for (let i = 0; i < content.length; i += maxCharactersPerCall) {
		// Ensure the chunk ends at a space, instead of splitting a word
		const chunkEnd = Math.min(i + maxCharactersPerCall, content.length)
		const chunkStart = content.lastIndexOf(' ', i)
		const chunk = content.slice(chunkStart === -1 ? 0 : chunkStart, chunkEnd)

		const response = await openai.embeddings.create({
			model: process.env.OPENAI_EMBEDDINGS_MODEL as EmbeddingModel,
			input: chunk
		})

		const id = uuidv4()

		embeddings.push({
			id,
			vector: response.data[0].embedding,
			payload: { title, date: new Date().getTime(), content: chunk }
		})

		const localizedDate = new Date().toLocaleString('en-US', {
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
		console.log(
			`Embedding #${embeddings.length} generated at ${localizedDate} for file "${title}".`
		)
	}

	return embeddings
}

export default generatePoints
