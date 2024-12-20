# Librai - AI-Powered Document Processing & Chat Platform

## Overview

Librai is a monorepo containing a full-stack application that enables users to process documents and interact with them through an AI chatbot interface. The platform consists of two main applications:

- **librai-server**: A document processing service that handles file uploads, text extraction, and vector embeddings
- **librai-ui**: A modern chat interface for interacting with processed documents using AI

## Applications

### [librai-server](apps/server)

The server application processes documents and manages the vector database:

- Modern web interface for file uploads with drag-and-drop support
- Supports PDF, EPUB, TXT, and MD file formats
- Generates embeddings using OpenAI's API
- Stores embeddings in Qdrant vector database
- Progress tracking for file processing
- RESTful API endpoints

### [librai-ui](apps/ui)

The user interface for chatting with AI about processed documents:

- Interactive AI chatbot interface
- Authentication system with PocketBase
- Conversation management (save, continue, delete)
- Public sharing capabilities
- Responsive design with Tailwind CSS
- Dark mode and theme support
- Configurable system prompts

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/librai.git
cd librai
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env` in both apps/server and apps/ui
   - Configure the environment variables according to each app's README

4. Start the development servers:

```bash
npm run dev
```

## Technology Stack

- **Backend**: Node.js, Express
- **Frontend**: SvelteKit
- **Authentication**: PocketBase
- **Styling**: Tailwind CSS
- **Vector Database**: Qdrant
- **AI Integration**: OpenAI API
- **Build System**: Turborepo

## Contributing

Contributions are welcome! Please read the contributing guidelines in each application's README for specific details.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the LICENSE.txt file for more details.

## Documentation

- [librai-server Documentation](apps/server/README.md)
- [librai-ui Documentation](apps/ui/README.md)
