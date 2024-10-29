<script lang="ts">
	import '$styles/main.css'
	import { onMount } from 'svelte'
	import { PUBLIC_THEME, PUBLIC_APP_TITLE } from '$env/static/public'
	import { defaultTheme, themes } from '$lib/constants/theme'
	import { chatHistory } from '$lib/stores'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'

	let { children } = $props()

	// Themes
	const theme = themes.includes(PUBLIC_THEME) ? PUBLIC_THEME : defaultTheme
	const setTheme = () => {
		document.documentElement.setAttribute('data-theme', theme)
	}

	// Dark mode
	let isDarkMode = $state(false)
	const setIsDarkMode = () => {
		document.documentElement.setAttribute('data-mode', isDarkMode ? 'dark' : 'light')
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		isDarkMode = mediaQuery.matches
		mediaQuery.addEventListener('change', (event) => {
			isDarkMode = event.matches
			setIsDarkMode()
		})

		setIsDarkMode()

		setTheme()
	})
	const toggleDarkMode = () => {
		isDarkMode = !isDarkMode
		setIsDarkMode()
	}
</script>

<svelte:head>
	<title>{PUBLIC_APP_TITLE || 'Librai UI'}</title>
	<meta
		name="description"
		content="A chatbot UI for interacting with an OpenAI chatbot trained on your data."
	/>
</svelte:head>

<header>
	<div class="container relative">
		<div
			class="hidden md:block fixed top-6 md:top-8 lg:top-10 xl:top-12 left-8 md:left-12 lg:left-16 xl:left-24 z-50"
		>
			{#if $chatHistory.length > 0}
				<h1 class="text-xl" in:fade={{ duration: 500, easing: cubicInOut }}>
					{#if PUBLIC_APP_TITLE}
						{PUBLIC_APP_TITLE}
					{:else}
						Librai UI
					{/if}
				</h1>
			{/if}
		</div>

		<button
			class="border-0 rounded-full fixed z-50 top-6 md:top-8 lg:top-10 xl:top-12 right-8 md:right-12 lg:right-16 xl:right-24 p-0 max-md:bg-chat-bar-bg max-md:p-2"
			onclick={toggleDarkMode}
		>
			<svg
				class="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				width="1em"
				height="1em"
				viewBox="0 0 24 24"
			>
				{#if isDarkMode}
					<path
						d="M9.272 2.406a1 1 0 0 0-1.23-1.355C6.59 1.535 5.432 2.488 4.37 3.55a11.4 11.4 0 0 0 0 16.182c4.518 4.519 11.51 4.261 15.976-.205c1.062-1.062 2.014-2.22 2.498-3.673A1 1 0 0 0 21.55 14.6c-3.59 1.322-7.675.734-10.433-2.025C8.35 9.808 7.788 5.744 9.272 2.406"
					/>
				{:else}
					<g>
						<g clip-path="url(#siSunFill0)">
							<path
								d="M12 0a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V1a1 1 0 0 1 1-1M0 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1m21-1a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm-8 10a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0zm-6.657-3.343a1 1 0 0 1 0 1.414L4.93 20.485a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0M20.485 3.515a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0m-16.97 0a1 1 0 0 1 1.414 0l1.414 1.414A1 1 0 1 1 4.93 6.343L3.515 4.93a1 1 0 0 1 0-1.414m14.142 14.141a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 1 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 0-1.414M5 12a7 7 0 1 1 14 0a7 7 0 0 1-14 0"
							/>
						</g>
						<defs>
							<clipPath id="siSunFill0"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath>
						</defs>
					</g>
				{/if}
			</svg>
		</button>
	</div>
</header>

<main>
	{@render children()}
</main>
