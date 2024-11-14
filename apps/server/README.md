# Librai Server - Document Processing and Embedding Service

## Description

This project is a Node.js application that processes documents into embeddings using the OpenAI API and stores them in a Qdrant vector database. It features a modern web interface for file uploads and provides a backend service that can be consumed by chatbot front-ends for enhanced document-based interactions.

Pairs with [librai-ui](https://github.com/wjd3/librai-ui).

## Features

- Modern, responsive web interface built with Alpine.js and Tailwind CSS
- Drag-and-drop file upload support
- Progress tracking for file uploads
- Optional page range exclusion for PDF and EPUB files
- Supports PDF, EPUB, TXT, and MD file formats
- Extracts and processes text content from uploaded files
- Generates embeddings using OpenAI's API
- Stores embeddings in Qdrant for efficient retrieval
- RESTful API endpoints for programmatic access

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:

   ```plaintext
   PORT=3000
   OPENAI_API_KEY=<your-openai-api-key>
   OPENAI_EMBEDDINGS_MODEL=<your-openai-embeddings-model>
   QDRANT_API_URL=<your-qdrant-api-url>
   QDRANT_API_KEY=<your-qdrant-api-key>
   QDRANT_COLLECTION=<your-qdrant-collection-name>
   ```

## Usage

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Start the server**:

   ```bash
   npm start
   ```

3. **Access the web interface**:
   Open your browser and navigate to `http://localhost:3000`

   Or use the API programmatically:

   ```bash
   curl -X POST http://localhost:3000/api/files/upload -F 'file=@/path/to/your/file.pdf'
   ```

## Development

For development purposes, you can run the server in watch mode:

```bash
npm run dev
```

To enable hot reloading of CSS, run this command in a separate terminal:

```bash
npm run dev:css
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the LICENSE.txt file for more details.
