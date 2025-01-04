import { OpenAI } from 'openai'
import { v4 as uuidv4 } from 'uuid'
import type { EmbeddingModel } from 'openai/resources'

const completionsModel = process.env.OPENAI_COMPLETIONS_MODEL as OpenAI.Chat.ChatModel
const embeddingsModel = process.env.OPENAI_EMBEDDINGS_MODEL as EmbeddingModel
const apiKey = process.env.OPENAI_API_KEY
const conceptsPrompt = process.env.OPENAI_CONCEPTS_PROMPT

if (!apiKey || !completionsModel || !embeddingsModel || !conceptsPrompt) {
	throw new Error(
		'One or more required environment variables are undefined: OPENAI_API_KEY, OPENAI_COMPLETIONS_MODEL, OPENAI_EMBEDDINGS_MODEL, OPENAI_CONCEPTS_PROMPT'
	)
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateConceptsList(content: string): Promise<string[]> {
	const prompt = `${conceptsPrompt}

Text to analyze: "${content}"

Return only a comma-separated list of 1-3 word concepts, no explanations. If you cannot identify any concepts, return "none".`

	const response = await openai.chat.completions.create({
		model: completionsModel,
		messages: [{ role: 'user', content: prompt }],
		temperature: 0.1
	})

	console.log('Concepts response:', response.choices[0].message.content)

	return (
		response.choices[0].message.content
			?.split(',')
			.map((concept) => concept.trim())
			.filter((concept) => concept !== 'none') || []
	)
}

async function identifyConcepts(content: string, conceptsList: string[]): Promise<string[]> {
	const prompt = `Given the following text, identify which concepts from the list are discussed or mentioned. Only return concepts that are actually present in the text. Concepts list: ${conceptsList.join(', ')}

Text: "${content}"

Return only the relevant concepts as a comma-separated list, or "none" if no concepts match.`

	const response = await openai.chat.completions.create({
		model: completionsModel,
		messages: [{ role: 'user', content: prompt }],
		temperature: 0.1
	})

	const conceptsString = response.choices[0].message.content || 'none'
	return conceptsString === 'none' ? [] : conceptsString.split(',').map((concept) => concept.trim())
}

const generatePoints = async ({
	content,
	title,
	conceptsList = [] // Add conceptsList parameter with default empty array
}: {
	content: string
	title: string
	conceptsList?: string[]
}): Promise<{ id: string; vector: number[]; payload: Record<any, any> }[]> => {
	const maxCharactersPerCall = 2750
	let embeddings: { id: string; vector: number[]; payload: Record<any, any> }[] = []

	// If no concepts provided, generate them for the entire content first
	let concepts = conceptsList
	if (concepts.length === 0) {
		console.log('No concepts provided, generating concepts from content...')
		concepts = await generateConceptsList(content)
		console.log('Generated concepts:', concepts.join(', '))
	}

	// Split content into chunks if it exceeds the max character limit
	for (let i = 0; i < content.length; i += maxCharactersPerCall) {
		const chunkEnd = Math.min(i + maxCharactersPerCall, content.length)
		const chunkStart = content.lastIndexOf(' ', i)
		const chunk = content.slice(chunkStart === -1 ? 0 : chunkStart, chunkEnd)

		// Get embeddings and identify concepts in parallel
		const [response, chunkConcepts] = await Promise.all([
			openai.embeddings.create({
				model: embeddingsModel,
				input: chunk,
				dimensions: 3072
			}),
			identifyConcepts(chunk, concepts)
		])

		const id = uuidv4()

		embeddings.push({
			id,
			vector: response.data[0].embedding,
			payload: {
				title,
				date: new Date().getTime(),
				content: chunk,
				concepts: chunkConcepts
			}
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
			`Embedding #${embeddings.length} generated at ${localizedDate} for file "${title}". Concepts: ${chunkConcepts.join(', ') || 'none'}`
		)
	}

	return embeddings
}

export default generatePoints
