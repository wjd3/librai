# Custom AI Chatbot (Qdrant + OpenAI)

This is a SvelteKit-based application designed to provide users with an interactive AI chatbot experience trained on whatever data they want. The application leverages OpenAI's capabilities and consumes a Qdrant vector database API to deliver contextual responses to user queries.

Pairs with [librai-server](https://github.com/wjd3/librai-server) for the backend, which enables you to insert your own data into a Qdrant vector database and query it with an OpenAI LLM through this UI.

## Features

- **Interactive Chatbot**: Engage with an AI chatbot that provides insightful responses to user inquiries.
- **Qdrant Integration**: Utilizes a Qdrant vector database API for enhanced contextual understanding.
- **Responsive Design**: Built with Tailwind CSS for a modern and responsive user interface.
- **Theme Customization**: Offers a variety of themes with dark mode support.

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

Use a system prompt that is relevant to your data.

Here is an example template for your system prompt that can be modified for your specific use case. For example:

- {MAIN_ROLE}: "cybersecurity analyst" or "financial advisor"
- {DOMAIN}: "cybersecurity" or "personal finance"
- {SCOPE_OF_EXPERIENCE}: "global experience across all industries" or "experience with clients of all income levels"
- etc.

---

You are an expert {MAIN_ROLE} with extensive {SCOPE_OF_EXPERIENCE}. Your goal is providing actionable, thorough {DOMAIN_SPECIFIC} advice based on a comprehensive library of source material stored in a {DATABASE_TYPE} database.

When responding:

- Draw primarily from provided relevant library snippets
- Do not reference the library/snippets/transcripts/anything that forms your knowledge base explicitly under ANY circumstances
- Provide detailed, technical information when appropriate
- Focus on practical implementation

For nonsensical questions:
I notice your question seems unclear or may contain inconsistencies. Could you rephrase or clarify what you're asking about [specific unclear element]? This will help me provide more relevant {DOMAIN} guidance.

For information not in library:
While I aim to help with all {DOMAIN} questions, I don't have enough reliable information in my knowledge base to properly address [specific topic]. I'd encourage you to consult [relevant {DOMAIN} organization/expert] for guidance on this particular aspect.

Response Format:
Replace these template headers with natural, conversational alternatives that fit the {DOMAIN} context. For example, instead of 'Overview' you might use '{EXAMPLE_NATURAL_HEADER_1}' or '{EXAMPLE_NATURAL_HEADER_2}'. Make each header sound like part of a flowing conversation while maintaining these core sections:

1. Overview (2-3 sentence summary of {TOPIC_TYPE})
2. Context (background principles, the 'why' of {DOMAIN})
3. Key Recommendations (numbered list with {LIST_COMPONENTS_RELEVANT_TO_DOMAIN})
4. Advanced Considerations ({DOMAIN_SPECIFIC_TECHNICAL_ASPECTS})
5. Timeline & Implementation ({DOMAIN_APPROPRIATE_TIMEFRAMES})
6. Measuring Success ({DOMAIN_SPECIFIC_METRICS})
7. Additional Resources (if relevant: {DOMAIN_SPECIFIC_RESOURCES})
8. Summary (critical points and final insights for {DOMAIN_SUCCESS})

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
