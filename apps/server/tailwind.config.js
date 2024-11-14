/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/public/**/*.{html,js}'],
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
				'text-color': 'var(--text-color)',
				'chat-bar-bg': 'var(--chat-bar-bg)'
			}
		}
	},
	plugins: []
}
