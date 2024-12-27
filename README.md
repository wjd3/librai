# Librai - AI-Powered Document Processing & Chat Platform

## Overview

Librai is a monorepo containing a full-stack application that enables users to process documents and interact with them through an AI chatbot interface. The platform consists of two main applications:

- **librai-server**: A document processing service that handles file uploads, text extraction, and vector embeddings
- **librai-ui**: A modern chat interface for interacting with processed documents using AI

## Key Features

### Document Processing (librai-server)

- Modern web interface with drag-and-drop file uploads
- Support for PDF, EPUB, TXT, and MD files
- Page range exclusion for PDF and EPUB files
- OpenAI embeddings generation
- Qdrant vector database integration
- Progress tracking and real-time feedback

### Chat Interface (librai-ui)

- Interactive AI chatbot with context-aware responses
- Multiple theme support with dark mode
- User authentication via PocketBase
- Conversation management (save, resume, delete)
- Public conversation sharing
- Responsive design with Tailwind CSS

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/librai.git
cd librai
```

2. Set up environment variables:
   Create `.env` files in both apps/server and apps/ui directories using their respective `.env.example` files as templates.

3. Install dependencies:

```bash
npm install
```

4. Start the development servers:

```bash
npm run dev
```

## Environment Variables

### Server (.env)

```plaintext
PORT=3000
OPENAI_API_KEY=your_api_key
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
QDRANT_API_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
QDRANT_COLLECTION=your_collection_name
```

### UI (.env)

```plaintext
PRIVATE_OPENAI_API_KEY=your_api_key
PRIVATE_OPENAI_CHAT_MODEL=gpt-4-turbo-preview
PRIVATE_QDRANT_ENDPOINT_URL=your_qdrant_url
PRIVATE_QDRANT_API_KEY=your_qdrant_key
VITE_POCKETBASE_URL=http://127.0.0.1:8090
PUBLIC_APP_TITLE=Librai
PUBLIC_THEME=default
```

## Documentation

- [Server Documentation](apps/server/README.md)
- [UI Documentation](apps/ui/README.md)

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
