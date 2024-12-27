# Librai UI - AI Chat Interface

## Description

A SvelteKit-based application providing an interactive AI chatbot interface for querying document collections. Features OpenAI integration, Qdrant vector search, and PocketBase authentication.

## Features

- Interactive AI chatbot with context-aware responses
- Multiple theme support:
  - Simple (light/dark)
  - Leaf (light/dark)
  - Blush (light/dark)
  - Glow (light/dark)
  - Ocean (light/dark)
- User authentication via PocketBase
- Conversation management:
  - Save and resume conversations
  - Delete conversations
  - Share via public links
- Responsive design with Tailwind CSS
- Real-time updates with streaming responses

## Prerequisites

- Node.js (version 16+)
- PocketBase (version 0.20.0+)
- OpenAI API access
- Qdrant vector database

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure PocketBase:

   - [Download and install PocketBase](https://pocketbase.io/docs/)
   - Start PocketBase: `./pocketbase serve`
   - Access admin UI at `http://127.0.0.1:8090/_/`
   - Create required collections (see schema below)

3. Create `.env` file:

```plaintext
PRIVATE_OPENAI_API_KEY=your_api_key
PRIVATE_OPENAI_CHAT_MODEL=gpt-4-turbo-preview
PRIVATE_QDRANT_ENDPOINT_URL=your_qdrant_url
PRIVATE_QDRANT_API_KEY=your_qdrant_key
VITE_POCKETBASE_URL=http://127.0.0.1:8090
PUBLIC_APP_TITLE=Librai
PUBLIC_THEME=default
```

## Development

Start the development server:

```bash
npm run dev
```

## Production

Build and preview:

```bash
npm run build
npm run preview
```

## PocketBase Schema

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

## License

GNU Affero General Public License v3.0 (AGPL-3.0)
