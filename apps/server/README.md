# Librai Server - Document Processing and Embedding Service

## Description

A Node.js application that processes documents into embeddings using the OpenAI API and stores them in a Qdrant vector database. Features a modern web interface for file uploads and provides a backend service that can be consumed by chatbot front-ends.

## Features

- Modern web interface with Alpine.js and Tailwind CSS
- Drag-and-drop file upload support
- Progress tracking for file uploads
- Optional page range exclusion for PDF and EPUB files
- Supports PDF, EPUB, TXT, and MD file formats
- OpenAI embeddings generation
- Qdrant vector database integration
- RESTful API endpoints

## Installation

1. Clone the repository and navigate to the server directory:

```bash
cd apps/server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```plaintext
PORT=3000
OPENAI_API_KEY=your_api_key
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
QDRANT_API_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
QDRANT_COLLECTION=your_collection_name
```

## Development

Start the development server with hot reloading:

```bash
npm run dev
```

Build CSS separately (optional):

```bash
npm run dev:css
```

## Production

Build and start the server:

```bash
npm run build
npm start
```

## API Endpoints

### File Upload

```bash
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: File (required)
- excludePages: JSON string (optional, for PDF/EPUB)
```

## License

GNU Affero General Public License v3.0 (AGPL-3.0)
