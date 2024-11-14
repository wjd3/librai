import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private'

if (!PRIVATE_SYSTEM_PROMPT) {
	throw new Error(
		"PRIVATE_SYSTEM_PROMPT environment variable is not set. Your chatbot will likely not know what to do with the information you're passing it from your database. Please set this variable using the instructions from the README."
	)
}
const systemMessage = PRIVATE_SYSTEM_PROMPT

const humanTemplate = `
    User Query: {query}

    Relevant Transcript Snippets: {context}
`

export { systemMessage, humanTemplate }
