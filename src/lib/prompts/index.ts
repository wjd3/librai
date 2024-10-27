import { PRIVATE_SYSTEM_PROMPT } from '$env/static/private';

const systemMessage = PRIVATE_SYSTEM_PROMPT || '';

const humanTemplate = `
    User Query: {query}

    Relevant Transcript Snippets: {context}
`;

export { systemMessage, humanTemplate };
