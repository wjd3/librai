# Librai UI - AI Chat Interface

## Description

A SvelteKit-based application providing an interactive AI chatbot interface for querying document collections. Features OpenAI integration, Qdrant vector search, PocketBase authentication, and real-time streaming responses.

## Features

- Interactive AI chatbot with context-aware responses
- Multiple theme support:
  - Charcoal (light/dark)
  - Leaf (light/dark)
  - Sunset (light/dark)
  - Volcano (light/dark)
  - Ocean (light/dark)
- User authentication via PocketBase:
  - Login/Register
  - Password reset
  - Email verification
  - Profile management
- Conversation management:
  - Save and resume conversations
  - Delete conversations
  - Edit conversation titles
  - Share via public links
- Rate limiting with Upstash Redis
- Real-time streaming responses
- Markdown and LaTeX support
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (version 16+)
- PocketBase (version 0.20.0+)
- OpenAI API access
- Qdrant vector database
- Upstash Redis account

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure PocketBase:

   - [Download and install PocketBase](https://pocketbase.io/docs/)
   - Start PocketBase: `./pocketbase serve`
   - Access admin UI at `http://127.0.0.1:8090/_/`
   - Create required collections (see schema below)

3. Create `.env` file:

```plaintext
PRIVATE_CHAT_API_KEY=your_api_key
PRIVATE_EMBEDDINGS_API_KEY=your_api_key
PRIVATE_CHAT_MODEL=gpt-4o-mini
PRIVATE_EMBEDDINGS_MODEL=text-embedding-3-large
PRIVATE_CHAT_BASE_URL=your_openai_base_url
PRIVATE_QDRANT_ENDPOINT_URL=your_qdrant_url
PRIVATE_QDRANT_API_KEY=your_qdrant_key
PRIVATE_QDRANT_COLLECTION_NAME=your_collection_name
PRIVATE_SYSTEM_PROMPT=your_custom_prompt
PRIVATE_UPSTASH_REDIS_REST_URL=your_upstash_url
PRIVATE_UPSTASH_REDIS_REST_TOKEN=your_upstash_token
VITE_POCKETBASE_URL=http://127.0.0.1:8090
PUBLIC_APP_TITLE=Librai
PUBLIC_APP_DESCRIPTION=Your app description
PUBLIC_THEME=charcoal
```

## Development

Start the development server:

```bash
pnpm dev
```

## Production

Build and preview:

```bash
pnpm build
pnpm preview
```

## PocketBase Schema

### Users Collection

```plaintext
name      : Text
email     : Email
password  : Password
```

### Conversations Collection

```plaintext
user      : Relation (Users Collection)
title     : Text
messages  : JSON
isPublic  : Boolean
shareId   : Text (unique)
created   : Date
updated   : Date
```

## Rate Limiting

- Unauthenticated users: 30 requests per 6 hours
- Authenticated users: 60 requests per 6 hours

## License

GNU Affero General Public License v3.0 (AGPL-3.0)
