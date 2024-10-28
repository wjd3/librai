# Custom AI Chatbot (Qdrant + OpenAI)

This is a SvelteKit-based application designed to provide users with an interactive AI chatbot experience trained on whatever data they want. The application leverages OpenAI's capabilities and consumes a Qdrant vector database API to deliver contextual responses to user queries.

Pairs with [librai-server](https://github.com/wjd3/librai-server) for the backend, which enables you to insert your own data into a Qdrant vector database and query it with an OpenAI LLM through this UI.

## Features

- **Interactive Chatbot**: Engage with an AI chatbot that provides insightful responses to user inquiries.
- **Qdrant Integration**: Utilizes a Qdrant vector database API for enhanced contextual understanding.
- **Responsive Design**: Built with Tailwind CSS for a modern and responsive user interface.
- **Theme Customization**: Offers a variety of themes, allowing users to personalize their experience with options for light, dark, and minimal aesthetics.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 16 or higher)
- npm (Node package manager)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/wjd3/librai-ui.git
cd librai-ui
```

### Install Dependencies

Install the required dependencies using npm:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of your project and add the following variables:

```bash
PUBLIC_API_URL=your_api_url
PRIVATE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY
PRIVATE_OPENAI_EMBEDDINGS_MODEL=YOUR_EMBEDDINGS_MODEL
PRIVATE_OPENAI_CHAT_MODEL=YOUR_CHAT_MODEL
PRIVATE_QDRANT_ENDPOINT_URL=YOUR_QDRANT_ENDPOINT_URL
PRIVATE_QDRANT_COLLECTION_NAME=YOUR_QDRANT_COLLECTION_NAME
PRIVATE_QDRANT_API_KEY=YOUR_QDRANT_API_KEY
PUBLIC_THEME=YOUR_THEME_CHOICE # see the available themes (including the default theme) in `src/lib/constants/theme.ts`
PUBLIC_APP_TITLE=YOUR_APP_TITLE
PRIVATE_SYSTEM_PROMPT=YOUR_SYSTEM_PROMPT
```

Use a system prompt that is relevant to your data. Here is a template for your system prompt that can be modified for your specific use case:

---

You are a highly skilled [area of expertise] consultant, designer, and educator. You have an in-depth understanding of [principles or concepts related to the field], allowing you to guide users in developing sustainable and resilient [systems, projects, or solutions]. You’re based in a [setting that fits the project or audience, e.g., "prolific web development agency" or "innovative design studio"].

Your purpose is to provide practical, valuable advice and coaching to users. Responses should be direct, practical, and as easy to follow as possible. Keep explanations simple and concise, geared towards helping users apply the guidance independently. Avoid overly complex or technical explanations unless the user requests advanced detail. When speaking to beginners, respond as a knowledgeable, real-world expert might when introducing foundational concepts.

You have access to a robust, specialized knowledge base stored in a Qdrant vector database. This resource includes insights and information covering the full scope of your expertise. When a user provides a query, you’ll receive relevant snippets from this knowledge base. Use these to enhance your response, ensuring both accuracy and depth in your answers. Most of your answers should draw from this knowledge base content.

Be mindful that the snippets provided may not always directly apply to the user's query. Analyze them carefully and only include content that is truly relevant. Avoid creating information or providing unsupported answers. Do not reference the knowledge base or snippets explicitly; use them solely for context and accuracy in crafting responses.

---

### Running the Development Server

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to see your application in action.

### Building for Production

To create a production build of your application, run:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```

## Tailwind CSS Configuration

This project uses Tailwind CSS for styling. The configuration file is located at `tailwind.config.ts`. You can customize the theme and extend the default styles as needed.

## Testing

TODO

To run unit tests, use:

```bash
npm run test
```

## Linting and Formatting

To lint your code, run:

```bash
npm run lint
```

To format your code, use:

```bash
npm run format
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the LICENSE.txt file for more details.
