document.addEventListener('alpine:init', () => {
	Alpine.data('fileUploader', () => ({
		isDragging: false,
		selectedFiles: [],
		isUploading: false,
		errorMessage: '',
		successMessage: '',
		result: null,
		conceptsList: '',

		handleDrop(event) {
			this.isDragging = false
			const files = Array.from(event.dataTransfer.files)
			files.forEach((file) => this.handleFile(file))
		},

		handleFileSelect(event) {
			const files = Array.from(event.target.files)
			files.forEach((file) => this.handleFile(file))
		},

		handleFile(file) {
			// Reset error messages
			this.errorMessage = ''
			this.successMessage = ''

			// Validate file size
			if (file.size > 100000000) {
				this.errorMessage = `File ${file.name} exceeds 100MB limit`
				return
			}

			// Validate file type
			const fileType = file.name.split('.').pop().toLowerCase()
			const allowedTypes = ['pdf', 'epub', 'txt', 'md']
			if (!allowedTypes.includes(fileType)) {
				this.errorMessage = `File ${file.name} is not supported. Please upload PDF, EPUB, TXT, or MD files.`
				return
			}

			// Add pageRange property for PDFs
			const fileObj = {
				file,
				name: file.name,
				pageRange: ''
			}

			this.selectedFiles.push(fileObj)
		},

		removeFile(index) {
			this.selectedFiles.splice(index, 1)
		},

		parsePageRanges(pageRange) {
			if (!pageRange?.trim()) return null

			try {
				const ranges = pageRange.split(',').map((range) => range.trim())
				return ranges.map((range) => {
					if (range.includes('-')) {
						const [start, end] = range.split('-').map((num) => parseInt(num.trim()))
						if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
							throw new Error('Invalid range format')
						}
						return { start, end }
					} else {
						const page = parseInt(range)
						if (isNaN(page) || page < 1) {
							throw new Error('Invalid page number')
						}
						return { start: page, end: page }
					}
				})
			} catch (error) {
				this.errorMessage = 'Invalid page range format. Please use format like "1-4, 7, 9-12"'
				return null
			}
		},

		parseConceptsList() {
			return this.conceptsList
				.split('\n')
				.map((concept) => concept.trim())
				.filter((concept) => concept.length > 0)
		},

		async submitFile() {
			if (this.selectedFiles.length === 0 || this.isUploading) return

			this.isUploading = true
			this.errorMessage = ''
			this.successMessage = ''
			this.result = null

			const results = []
			const concepts = this.parseConceptsList()

			for (const fileObj of this.selectedFiles) {
				const formData = new FormData()
				formData.append('file', fileObj.file)

				if (fileObj.name.toLowerCase().endsWith('.pdf')) {
					const pageRanges = this.parsePageRanges(fileObj.pageRange)
					if (pageRanges) {
						formData.append('excludePages', JSON.stringify(pageRanges))
					}
				}

				if (concepts.length > 0) {
					formData.append('conceptsList', JSON.stringify(concepts))
				}

				try {
					const response = await fetch('/api/files/upload', {
						method: 'POST',
						body: formData
					})

					const data = await response.json()

					if (response.ok) {
						results.push({ file: fileObj.name, ...data })
					} else {
						this.errorMessage = `Failed to upload ${fileObj.name}: ${data.error || 'Upload failed'}`
						break
					}
				} catch (error) {
					this.errorMessage = `Error uploading ${fileObj.name}`
					console.error('Upload error:', error)
					break
				}
			}

			if (results.length > 0) {
				this.successMessage = 'Files processed successfully!'
				this.result = results
				this.selectedFiles = []
			}

			this.isUploading = false
		}
	}))
})
