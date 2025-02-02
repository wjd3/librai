# Librai Server - Document Processing and Embedding Service

## Description

A Node.js/Express application that processes documents into embeddings using the OpenAI API and stores them in a Qdrant vector database. Features intelligent text chunking and metadata preservation for improved context retrieval.

## Features

- File upload support with progress tracking
- Multiple file format support:
  - PDF with page range exclusion
  - EPUB with section exclusion
  - TXT files
  - Markdown files
- Smart text chunking:
  - Configurable chunk sizes
  - Overlap for context preservation
  - Rich metadata generation
- OpenAI embeddings integration:
  - text-embedding-3-large model
  - 3072-dimensional embeddings
- Qdrant vector database integration
- Express.js REST API

## Installation

1. Clone the repository and navigate to the server directory:

```bash
cd apps/server
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file:

```plaintext
PORT=3000
OPENAI_API_KEY=your_api_key
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-large
QDRANT_API_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
QDRANT_COLLECTION=your_collection_name
```

## Development

Start the development server with hot reloading:

```bash
pnpm dev
```

## Production

Build and start the server:

```bash
pnpm build
pnpm start
```

## API Endpoints

### File Upload

```bash
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: File (required)
- excludePages: JSON string (optional, for PDF/EPUB)
  Format: [{"start": number, "end": number}]
```

## Technical Details

### Text Chunking

- Maximum tokens per chunk: 512
- Overlap tokens: 50
- Preserves paragraph boundaries
- Includes metadata:
  - Book title
  - Chunk index/total
  - Previous/next chunk previews
  - Start/end paragraphs

### Embeddings

- Uses OpenAI's text-embedding-3-large
- 3072-dimensional embeddings
- Rich context including metadata
- Batch processing support

## License

GNU Affero General Public License v3.0 (AGPL-3.0)
