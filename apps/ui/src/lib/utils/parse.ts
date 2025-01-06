import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import DOMPurify from 'isomorphic-dompurify'

export const parseMarkdownToHtml = (markdown: string) => {
	if (!markdown || typeof markdown != 'string') return ''

	const sanitizedMarkdown = DOMPurify.sanitize(markdown)
	if (!sanitizedMarkdown) return ''

	marked.use(markedKatex({ throwOnError: false, nonStandard: true }))
	// const sanitizedMarkdownWithParsedFormulas = sanitizedMarkdown.replace(
	// 	/\[\s*([\s\S]*?)\s*\]/g,
	// 	'$$ $1 $$'
	// )

	return marked.parse(sanitizedMarkdown, { async: false })
	// return marked.parse(sanitizedMarkdownWithParsedFormulas, { async: false })
}
