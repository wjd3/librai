import forms from '@tailwindcss/forms'
import type { Config } from 'tailwindcss'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	darkMode: ['selector', '[data-mode="dark"]'],

	theme: {
		extend: {
			colors: {
				'btn-bg': 'var(--btn-bg)',
				'btn-hover-bg': 'var(--btn-hover-bg)',
				'page-bg': 'var(--page-bg)',
				'primary-card-bg': 'var(--primary-card-bg)',
				'secondary-card-bg': 'var(--secondary-card-bg)',
				'form-border': 'var(--form-border)',
				'form-focus-border': 'var(--form-focus-border)',
				'form-bg': 'var(--form-bg)',
				'link-color': 'var(--link-color)',
				'link-hover-color': 'var(--link-hover-color)',
				'text-color': 'var(--text-color)',
				'placeholder-color': 'var(--placeholder-color)',
				'user-bubble-bg': 'var(--user-bubble-bg)',
				'bot-bubble-bg': 'var(--bot-bubble-bg)',
				'chat-bar-bg': 'var(--chat-bar-bg)',
				highlight: 'var(--highlight)',
				'highlight-dark': 'var(--highlight-dark)'
			}
		}
	},

	plugins: [forms]
} as Config
