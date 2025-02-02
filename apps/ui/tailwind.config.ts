import forms from '@tailwindcss/forms'
import { addIconSelectors } from '@iconify/tailwind'
import type { Config } from 'tailwindcss'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	darkMode: ['selector', '[data-mode="dark"]'],

	theme: {
		extend: {
			colors: {
				// Charcoal
				'wild-sand': {
					'50': '#f5f5f5',
					'100': '#efefef',
					'200': '#dcdcdc',
					'300': '#bdbdbd',
					'400': '#989898',
					'500': '#7c7c7c',
					'600': '#656565',
					'700': '#525252',
					'800': '#464646',
					'900': '#3d3d3d',
					'950': '#292929'
				},
				'mine-shaft': {
					'50': '#f5f6f6',
					'100': '#e5e7e8',
					'200': '#cdd1d4',
					'300': '#aab1b6',
					'400': '#808b90',
					'500': '#657075',
					'600': '#565e64',
					'700': '#4a5054',
					'800': '#414549',
					'900': '#393c40',
					'950': '#2d3033'
				},
				iron: {
					'50': '#f5f7f8',
					'100': '#edeff2',
					'200': '#dfe2e6',
					'300': '#d1d5db',
					'400': '#b5b9c4',
					'500': '#a1a5b3',
					'600': '#8b8fa0',
					'700': '#777a8b',
					'800': '#626471',
					'900': '#52555d',
					'950': '#303136'
				},

				// Leaf
				sage: {
					'50': '#f3f6f3',
					'100': '#e5e8e3',
					'200': '#cbd2c8',
					'300': '#a6b3a2',
					'400': '#7c8f78',
					'500': '#5b7158',
					'600': '#465843',
					'700': '#374636',
					'800': '#2e392c',
					'900': '#262f25',
					'950': '#141a14'
				},
				'tea-rose': {
					'50': '#faf5f2',
					'100': '#f4e8e0',
					'200': '#e4c8b5',
					'300': '#d9b098',
					'400': '#c98b6e',
					'500': '#be7051',
					'600': '#b05c46',
					'700': '#924a3c',
					'800': '#763e36',
					'900': '#60342e',
					'950': '#331917'
				},
				asparagus: {
					'50': '#f5f8f5',
					'100': '#e9efe9',
					'200': '#d5ded4',
					'300': '#b1c4b1',
					'400': '#88a187',
					'500': '#658265',
					'600': '#506950',
					'700': '#445844',
					'800': '#364536',
					'900': '#2e392e',
					'950': '#161d16'
				},

				// Twilight
				lavender: {
					'50': '#f9f7fd',
					'100': '#f3effa',
					'200': '#e8def5',
					'300': '#d6c4ed',
					'400': '#be9de1',
					'500': '#a67ad5',
					'600': '#8d5cc2',
					'700': '#764aa7',
					'800': '#624088',
					'900': '#50386e',
					'950': '#2f1d47'
				},
				periwinkle: {
					'50': '#f5f6fd',
					'100': '#eaebfa',
					'200': '#d9dcf5',
					'300': '#b9bfec',
					'400': '#939ce0',
					'500': '#7379d3',
					'600': '#5d5fc3',
					'700': '#504eaa',
					'800': '#43428a',
					'900': '#3a396f',
					'950': '#242344'
				},
				orchid: {
					'50': '#fdf6f9',
					'100': '#fbeef3',
					'200': '#f7dbe7',
					'300': '#f1bed3',
					'400': '#e795b7',
					'500': '#da6a97',
					'600': '#c44a7a',
					'700': '#a53862',
					'800': '#893052',
					'900': '#722b46',
					'950': '#441325'
				},

				// Ocean
				matisse: {
					'50': '#f3f8fc',
					'100': '#e6f0f8',
					'200': '#c8e0ef',
					'300': '#97c6e2',
					'400': '#60a9d0',
					'500': '#3b8ebc',
					'600': '#296d98',
					'700': '#245b80',
					'800': '#214e6b',
					'900': '#20425a',
					'950': '#152a3c'
				},
				mystic: {
					'50': '#f6f9f9',
					'100': '#ecf2f2',
					'200': '#dee7e7',
					'300': '#b2c7c7',
					'400': '#88a8a7',
					'500': '#698e8d',
					'600': '#547575',
					'700': '#455f5f',
					'800': '#3b5151',
					'900': '#354445',
					'950': '#232e2e'
				},
				'blue-dianne': {
					'50': '#ecfffe',
					'100': '#cffefe',
					'200': '#a5fbfc',
					'300': '#66f5fa',
					'400': '#21e7ef',
					'500': '#05cad5',
					'600': '#07a1b3',
					'700': '#0d8091',
					'800': '#156775',
					'900': '#165563',
					'950': '#0a4958'
				},

				// Volcano
				'cocoa-brown': {
					'50': '#f5f4f1',
					'100': '#e7e2da',
					'200': '#d1c7b7',
					'300': '#b6a58e',
					'400': '#a1896e',
					'500': '#927860',
					'600': '#7d6351',
					'700': '#654d43',
					'800': '#57423c',
					'900': '#4c3b37',
					'950': '#2a1f1d'
				},
				cinnabar: {
					'50': '#fef3f2',
					'100': '#fee5e2',
					'200': '#fecfca',
					'300': '#fcada5',
					'400': '#f77e72',
					'500': '#ee5445',
					'600': '#de4839',
					'700': '#b82b1d',
					'800': '#98271c',
					'900': '#7e271e',
					'950': '#450f0a'
				},
				'almond-frost': {
					'50': '#f5f2f1',
					'100': '#e5e0dc',
					'200': '#cdc3bb',
					'300': '#b09f94',
					'400': '#9a8478',
					'500': '#8a7368',
					'600': '#765f58',
					'700': '#604b48',
					'800': '#524241',
					'900': '#493a3a',
					'950': '#291f1f'
				},

				// CSS Variable mappings remain unchanged
				'btn-bg': 'var(--btn-bg)',
				'btn-hover-bg': 'var(--btn-hover-bg)',
				'btn-text': 'var(--btn-text)',
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
				'highlight-dark': 'var(--highlight-dark)',
				'btn-secondary-bg': 'var(--btn-secondary-bg)',
				'btn-secondary-hover-bg': 'var(--btn-secondary-hover-bg)'
			}
		}
	},

	plugins: [forms, addIconSelectors(['lucide'])]
} as Config
