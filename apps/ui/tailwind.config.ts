import forms from '@tailwindcss/forms'
import type { Config } from 'tailwindcss'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	darkMode: ['selector', '[data-mode="dark"]'],

	theme: {
		extend: {
			colors: {
				// Simple
				mamba: {
					'50': '#f9f8fa',
					'100': '#f3f2f5',
					'200': '#e9e8ec',
					'300': '#d6d5dd',
					'400': '#bfbdc8',
					'500': '#a5a2b0',
					'600': '#8c8799',
					'700': '#7d7889',
					'800': '#696473',
					'900': '#57535f',
					'950': '#38363f'
				},
				kashmir: {
					'50': '#f6f7f9',
					'100': '#eceef2',
					'200': '#d4dae3',
					'300': '#aebbcb',
					'400': '#8295ae',
					'500': '#607590',
					'600': '#4e617b',
					'700': '#404e64',
					'800': '#384354',
					'900': '#323a48',
					'950': '#212630'
				},
				fuchsia: {
					'50': '#fef4ff',
					'100': '#fce8ff',
					'200': '#f8d0fe',
					'300': '#f1abfc',
					'400': '#e879f9',
					'500': '#d946ef',
					'600': '#bc26d3',
					'700': '#9c1caf',
					'800': '#80198f',
					'900': '#691a75',
					'950': '#44044e'
				},
				// Leaf
				eucalyptus: {
					'50': '#f1f8f4',
					'100': '#deede3',
					'200': '#bfdbc9',
					'300': '#94c1a8',
					'400': '#66a182',
					'500': '#4b906e',
					'600': '#32694f',
					'700': '#285440',
					'800': '#224335',
					'900': '#1d372c',
					'950': '#0f1f18'
				},
				wisteria: {
					'50': '#faf9ec',
					'100': '#f3f0ce',
					'200': '#e8dfa0',
					'300': '#dac86a',
					'400': '#cfb240',
					'500': '#b89731',
					'600': '#a47d2a',
					'700': '#845d24',
					'800': '#6e4c25',
					'900': '#5f4024',
					'950': '#372211'
				},

				lightning: {
					'50': '#fefce8',
					'100': '#fffbc2',
					'200': '#fff487',
					'300': '#ffe743',
					'400': '#ffd310',
					'500': '#efba03',
					'600': '#ce9000',
					'700': '#a46604',
					'800': '#884f0b',
					'900': '#734110',
					'950': '#432105'
				},
				// Blush
				mandy: {
					'50': '#fef2f3',
					'100': '#fce7e9',
					'200': '#f9d2d8',
					'300': '#f4adb8',
					'400': '#ed7f93',
					'500': '#e14f6d',
					'600': '#cd3158',
					'700': '#ac244a',
					'800': '#912043',
					'900': '#7c1f3f',
					'950': '#450c1e'
				},
				zest: {
					'50': '#fdf8ed',
					'100': '#f8ebcd',
					'200': '#f1d496',
					'300': '#eab85f',
					'400': '#e5a03a',
					'500': '#de852a',
					'600': '#c3611c',
					'700': '#a2441b',
					'800': '#84361c',
					'900': '#6d2e1a',
					'950': '#3e160a'
				},
				cornflower: {
					'50': '#eef6ff',
					'100': '#d9eaff',
					'200': '#bcdbff',
					'300': '#8ec5ff',
					'400': '#59a4ff',
					'500': '#468cff',
					'600': '#1b5ff5',
					'700': '#144ae1',
					'800': '#173cb6',
					'900': '#19378f',
					'950': '#142357'
				},
				// Glow
				fern: {
					'50': '#f1fcf4',
					'100': '#dff9e7',
					'200': '#c0f2cf',
					'300': '#8fe6aa',
					'400': '#56d27e',
					'500': '#2fb65b',
					'600': '#229748',
					'700': '#1e773b',
					'800': '#1c5f33',
					'900': '#194e2c',
					'950': '#082b16'
				},
				java: {
					'50': '#f0fdfb',
					'100': '#cdfaf6',
					'200': '#9af5ed',
					'300': '#60e8e2',
					'400': '#2fd2cf',
					'500': '#17bbbb',
					'600': '#0f9092',
					'700': '#107275',
					'800': '#125a5d',
					'900': '#144b4d',
					'950': '#052a2e'
				},
				pumpkin: {
					'50': '#fff4ed',
					'100': '#ffe6d5',
					'200': '#feccaa',
					'300': '#fdac74',
					'400': '#fb8a3c',
					'500': '#f97316',
					'600': '#ea670c',
					'700': '#c2570c',
					'800': '#9a4a12',
					'900': '#7c3d12',
					'950': '#432007'
				},
				// Ocean
				curious: {
					'50': '#f0f9ff',
					'100': '#e0f1fe',
					'200': '#b9e5fe',
					'300': '#7cd1fd',
					'400': '#36bbfa',
					'500': '#0ca2eb',
					'600': '#0082c9',
					'700': '#0266a2',
					'800': '#065786',
					'900': '#0b486f',
					'950': '#072e4a'
				},
				meadow: {
					'50': '#ecfdf7',
					'100': '#d1faec',
					'200': '#a7f3da',
					'300': '#6ee7bf',
					'400': '#34d39e',
					'500': '#10b981',
					'600': '#059666',
					'700': '#047852',
					'800': '#065f42',
					'900': '#064e36',
					'950': '#022c1e'
				},
				magenta: {
					'50': '#fef4ff',
					'100': '#fce8ff',
					'200': '#f8d0fe',
					'300': '#f1abfc',
					'400': '#e879f9',
					'500': '#d946ef',
					'600': '#bc26d3',
					'700': '#9c1caf',
					'800': '#80198f',
					'900': '#691a75',
					'950': '#44044e'
				},

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
