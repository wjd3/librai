import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const manifest = {
	name: process.env.PUBLIC_APP_TITLE || 'Librai UI',
	short_name: process.env.PUBLIC_APP_SHORT_TITLE || 'Librai',
	description:
		process.env.PUBLIC_APP_DESCRIPTION || 'A modern chat interface for AI conversations.',
	display: 'standalone',
	background_color: '#ffffff',
	theme_color: '#ffffff',
	start_url: '/',
	scope: '/',
	icons: [
		{
			src: '/android-chrome-192x192.png',
			sizes: '192x192',
			type: 'image/png'
		},
		{
			src: '/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any maskable'
		},
		{
			src: '/apple-touch-icon.png',
			sizes: '180x180',
			type: 'image/png'
		},
		{
			src: '/favicon-32x32.png',
			sizes: '32x32',
			type: 'image/png'
		}
	]
}

const manifestPath = path.join(process.cwd(), 'static/manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log('PWA manifest.json file generated successfully.')
