# Librai UI - AI Chat Interface

A SvelteKit-based application that provides an interactive AI chatbot interface for querying document collections. The application integrates OpenAI's capabilities with Qdrant vector search and PocketBase authentication to deliver a powerful document-aware chat experience.

## Features

- **Interactive Chatbot**: AI-powered chat interface with context-aware responses
- **Authentication**: Full user authentication system via PocketBase
- **Conversation Management**:
  - Save and resume conversations
  - Delete conversations
  - Share conversations via public links
- **Responsive Design**: Modern UI with Tailwind CSS
- **Theme Support**: Multiple themes with dark mode
- **Real-time Updates**: Live chat interface with streaming responses
- **Document Context**: Leverages vector search for relevant document context

## Prerequisites

- Node.js (version 16 or higher)
- npm (Node package manager)
- PocketBase (version 0.20.0 or higher)
- Access to OpenAI API
- Access to a Qdrant vector database

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PocketBase

1. [Download and install PocketBase](https://pocketbase.io/docs/)
2. Start PocketBase: `./pocketbase serve`
3. Access admin UI at `http://127.0.0.1:8090/_/`
4. Create required collections:

#### Conversations Collection Schema

| Field Name | Type     | Required | Options                  |
| ---------- | -------- | -------- | ------------------------ |
| user       | Relation | Yes      | Users Collection         |
| title      | Text     | Yes      | Min length: 1            |
| messages   | JSON     | Yes      | Array of message objects |
| isPublic   | Boolean  | Auto     | Default: false           |
| shareId    | Text     | No       | Must be unique           |
| created    | Date     | Yes      | Auto: Create             |
| updated    | Date     | Yes      | Auto: Update             |

### 3. Environment Setup

Create a `.env` file:

```bash
# OpenAI Configuration
PRIVATE_OPENAI_API_KEY=your_openai_api_key
PRIVATE_OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
PRIVATE_OPENAI_CHAT_MODEL=gpt-4-turbo-preview

# Qdrant Configuration
PRIVATE_QDRANT_ENDPOINT_URL=your_qdrant_url
PRIVATE_QDRANT_COLLECTION_NAME=your_collection
PRIVATE_QDRANT_API_KEY=your_qdrant_key

# PocketBase Configuration
VITE_POCKETBASE_URL=http://127.0.0.1:8090
PUBLIC_APP_URL=http://localhost:5173

# App Configuration
PUBLIC_THEME=default
PUBLIC_APP_TITLE=Librai
PRIVATE_SYSTEM_PROMPT=your_system_prompt
```

### 4. Development

Start the development server:

```bash
npm run dev
```

### 5. Production Build

```bash
npm run build
npm run preview
```

## Development Tools

- **Formatting**: `npm run format`
- **Linting**: `npm run lint`
- **Type Checking**: `npm run check`

## License

GNU Affero General Public License v3.0 (AGPL-3.0)
