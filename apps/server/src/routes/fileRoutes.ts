import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { storeFileEmbeddingsInQdrant } from '../services/qdrantService'
import { processFile } from '../services/fileService'

const router = express.Router()

// Configure multer with file type validation
const upload = multer({
	dest: 'temp/uploads/',
	limits: { fileSize: 100000000 }, // 100MB
	fileFilter: (_, file, cb) => {
		const allowedExtensions = ['.pdf', '.epub', '.txt', '.md']

		const ext = path.extname(file.originalname).toLowerCase()
		if (allowedExtensions.includes(ext)) {
			cb(null, true)
		} else {
			cb(new Error('Invalid file type. Only PDF, EPUB, TXT, and MD files are allowed.'))
		}
	}
})

// Serve the home page
router.get('/', (_: Request, res: Response) => {
	res.sendFile(path.join(__dirname, '../public/index.html'))
})

router.post(
	'/upload',
	upload.single('file'),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { file } = req
			const excludePagesJson = req.body.excludePages

			if (!file) {
				res.status(400).json({ error: 'No file uploaded' })
				return
			}

			let excludePages: Array<{ start: number; end: number }> | undefined
			if (excludePagesJson) {
				try {
					excludePages = JSON.parse(excludePagesJson)
				} catch (e) {
					res.status(400).json({ error: 'Invalid page range format' })
					return
				}
			}

			console.log('Processing file:', file.originalname)
			const fileContent = await processFile(file, excludePages)
			const fileTitle = file.originalname

			console.log('Generating and storing embeddings in Qdrant...')
			const result = await storeFileEmbeddingsInQdrant({
				fileContent,
				fileTitle
			})

			res.json({
				success: true,
				message: `File processed successfully: ${fileTitle}`,
				result
			})
		} catch (error: unknown) {
			console.error('Error processing file:', error)
			if (error instanceof Error) {
				res.status(500).json({ error: error.message })
			} else {
				res.status(500).json({ error: 'An unknown error occurred' })
			}
		}
	}
)

export default router
