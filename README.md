# Librai - AI-Powered Document Processing & Chat Platform

## Overview

Librai is a monorepo containing a full-stack application that enables users to process documents and interact with them through an AI chatbot interface. The platform consists of two main applications:

- **librai-server**: A document processing service that handles file uploads, text extraction, and vector embeddings
- **librai-ui**: A modern chat interface for interacting with processed documents using AI

## Key Features

### Document Processing (librai-server)

- File upload support with progress tracking
- Support for multiple file formats:
  - PDF (with page range exclusion)
  - EPUB (with section exclusion)
  - TXT
  - MD
- Smart text chunking with metadata preservation
- OpenAI embeddings generation (text-embedding-3-large)
- Qdrant vector database integration
- Express.js REST API

### Chat Interface (librai-ui)

- Interactive AI chatbot with context-aware responses
- Multiple theme support:
  - Charcoal (light/dark)
  - Leaf (light/dark)
  - Sunset (light/dark)
  - Volcano (light/dark)
  - Ocean (light/dark)
- UI built with SvelteKit
- User authentication via PocketBase
- Conversation management:
  - Save and resume conversations
  - Delete conversations
  - Share via public links
  - Edit conversation titles
- Rate limiting with Upstash Redis
- Real-time streaming responses
- Markdown and LaTeX support
- Responsive design with Tailwind CSS

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/librai.git
cd librai
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Create `.env` files in both apps/server and apps/ui directories using their respective `.env.example` files as templates.

4. Start the development servers:

```bash
pnpm dev
```

## Environment Variables

### Server (.env)

```plaintext
PORT=3000
OPENAI_API_KEY=your_api_key
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-large
QDRANT_API_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
QDRANT_COLLECTION=your_collection_name
```

### UI (.env)

```plaintext
# OpenAI Configuration
PRIVATE_CHAT_API_KEY=your_openai_key
PRIVATE_EMBEDDINGS_API_KEY=your_openai_key
PRIVATE_EMBEDDINGS_MODEL=text-embedding-3-large
PRIVATE_CHAT_MODEL=gpt-4o-mini
PRIVATE_CHAT_BASE_URL=your_openai_base_url

# Qdrant Configuration
PRIVATE_QDRANT_ENDPOINT_URL=your_qdrant_url
PRIVATE_QDRANT_COLLECTION_NAME=your_collection_name
PRIVATE_QDRANT_API_KEY=your_qdrant_key

# System Configuration
PRIVATE_SYSTEM_PROMPT=your_custom_prompt

# Redis Configuration
PRIVATE_UPSTASH_REDIS_REST_URL=your_upstash_url
PRIVATE_UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# PocketBase Configuration
VITE_POCKETBASE_URL=http://127.0.0.1:8090

# Application Settings
PUBLIC_APP_TITLE=Librai
PUBLIC_APP_DESCRIPTION=Your app description
PUBLIC_APP_SHORT_TITLE=Librai
PUBLIC_THEME=charcoal
PUBLIC_APP_URL=your_app_url

# Chatbot Configuration
PUBLIC_CHATBOT_DESCRIPTION=Your chatbot description
PUBLIC_CHATBOT_THINKING_TEXT=Your thinking text

# OpenGraph/Social Media
PUBLIC_APP_OG_IMAGE=your_og_image_url
PUBLIC_APP_TWITTER_IMAGE=your_twitter_image_url
```

## Documentation

- [Server Documentation](apps/server/README.md)
- [UI Documentation](apps/ui/README.md)

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
