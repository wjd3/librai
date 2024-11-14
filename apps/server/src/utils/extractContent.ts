import { parseEpub } from 'epub2md'
import { dynamicImport } from 'tsimportlib'
import fs from 'fs/promises'

// TODO: add support for other file types - docx, html, csv, and xml

export default async function extractContent(
	filePath: string,
	fileType: string,
	excludePages?: Array<{ start: number; end: number }>
): Promise<string> {
	if (fileType === 'pdf') {
		const pdfJs = await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs', module)

		const pdfBuffer = await fs.readFile(filePath)
		const pdfUint8Array = new Uint8Array(pdfBuffer)
		const pdfDocument = await pdfJs.getDocument({ data: pdfUint8Array }).promise
		const numPages = pdfDocument.numPages
		let text = ''

		for (let i = 1; i <= numPages; i++) {
			if (excludePages && excludePages.some((range) => i >= range.start && i <= range.end)) {
				continue
			}

			const page = await pdfDocument.getPage(i)
			const content = await page.getTextContent()
			const pageText = content.items.map((item: any) => item.str).join(' ')
			text += pageText + ' '
		}

		if (!text) {
			throw new Error('No text found in PDF file.')
		}

		return text.trim()
	} else if (fileType === 'epub') {
		const epubContent = await parseEpub(filePath)
		if (epubContent?.sections) {
			let sections = epubContent.sections

			if (excludePages) {
				sections = sections.filter((_, index) => {
					const pageNum = index + 1
					return !excludePages.some((range) => pageNum >= range.start && pageNum <= range.end)
				})
			}

			const markdownContent = sections.map((section) => section.toMarkdown()).join('\n\n') || ''

			return markdownContent
		} else {
			throw new Error('No text found in EPUB file.')
		}
	} else if (fileType === 'txt' || fileType === 'md') {
		const fileContent = await fs.readFile(filePath, 'utf8')

		if (!fileContent) {
			throw new Error(`No text found in ${fileType.toUpperCase()} file.`)
		}

		return fileContent
	} else {
		throw new Error('Unsupported file type.')
	}
}
