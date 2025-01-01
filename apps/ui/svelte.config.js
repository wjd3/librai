import vercelAdapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: vercelAdapter(),

		alias: {
			$styles: './src/styles',
			$components: './src/components'
		},

		env: {
			privatePrefix: 'PRIVATE_',
			publicPrefix: 'PUBLIC_'
		},

		csp: {
			directives: {
				'script-src': ['self']
			},
			// must be specified with either the `report-uri` or `report-to` directives, or both
			reportOnly: {
				'script-src': ['self'],
				'report-uri': ['/']
			}
		}
	}
}

export default config
