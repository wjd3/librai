// Import necessary types
import type { Handle } from '@sveltejs/kit';
import { defaultTheme } from '$lib/constants/theme';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

// Define the handle hook
export const handle: Handle = async ({ event, resolve }) => {
	// Your custom logic here (e.g., logging, authentication)

	// Call resolve to continue processing the request
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('%DATA_THEME%', process.env.PUBLIC_THEME || defaultTheme);
		}
	});

	// Optionally modify the response here

	return response;
};
