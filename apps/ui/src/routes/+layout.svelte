<script lang="ts">
	import '$styles/main.css'
	import { createScrollSpy } from '$lib/utils/scroll'
	import { onMount } from 'svelte'
	import {
		PUBLIC_THEME,
		PUBLIC_APP_TITLE,
		PUBLIC_APP_DESCRIPTION,
		PUBLIC_APP_OG_IMAGE,
		PUBLIC_APP_TWITTER_IMAGE,
		PUBLIC_UMAMI_WEBSITE_ID
	} from '$env/static/public'
	import { themes, type Theme } from '$lib/constants/themes'
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import AuthMenu from '$components/AuthMenu.svelte'
	import AppMenu from '$components/AppMenu.svelte'
	import { page } from '$app/state'
	import { authToken, currentUser, isAuthenticated, isAuthLoading } from '$lib/stores/auth'

	let { children } = $props()

	const metaOverride = page.data.meta

	// Themes
	let currentTheme = $state<Theme>(
		(themes.includes(PUBLIC_THEME as Theme) ? PUBLIC_THEME : themes[0]) as Theme
	)

	const setTheme = () => {
		// Check for saved theme in localStorage
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme && themes.includes(savedTheme as Theme)) {
			currentTheme = savedTheme as Theme
		}
		document.documentElement.setAttribute('data-theme', currentTheme)
	}

	// Dark mode
	let isDarkMode = $state(false)

	let themeColorMeta: HTMLMetaElement
	let darkThemeColorMeta: HTMLMetaElement
	let themeColor: string
	let darkThemeColor: string
	onMount(() => {
		themeColorMeta = document.getElementById('theme-color') as HTMLMetaElement
		if (themeColorMeta) {
			themeColor = themeColorMeta.content
		}

		darkThemeColorMeta = document.getElementById('dark-theme-color') as HTMLMetaElement
		if (darkThemeColorMeta) {
			darkThemeColor = darkThemeColorMeta.content
		}
	})

	const setIsDarkMode = () => {
		document.documentElement.setAttribute('data-mode', isDarkMode ? 'dark' : 'light')

		if (themeColor && darkThemeColor) {
			themeColorMeta.content = isDarkMode ? darkThemeColor : themeColor
		}
	}

	let isCheckingConversations = $state(false)
	let hasConversations = $state(false)

	$effect(() => {
		if ($authToken && $currentUser) {
			isCheckingConversations = true

			fetch('/api/conversations', {
				headers: {
					Authorization: `Bearer ${$authToken}`
				}
			})
				.then((response) => response.json())
				.then((data) => {
					hasConversations = data.length > 0
				})
				.catch((error) => {
					console.error('Error checking conversations:', error)
					hasConversations = false
				})
				.finally(() => {
					isCheckingConversations = false
				})
		} else {
			hasConversations = false
		}
	})

	onMount(async () => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		isDarkMode = mediaQuery.matches
		mediaQuery.addEventListener('change', (event) => {
			isDarkMode = event.matches
			setIsDarkMode()
		})

		setIsDarkMode()
		setTheme()

		// Check auth status on mount
		const token = localStorage.getItem('auth_token')
		if (token) {
			const response = await fetch('/api/auth/status', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})
			if (response.ok) {
				const data = await response.json()

				if (data.token && data.user) {
					authToken.set(data.token)
					currentUser.set(data.user)
					isAuthenticated.set(true)
				}
			}
		}

		isAuthLoading.set(false)
	})

	const toggleDarkMode = () => {
		isDarkMode = !isDarkMode
		setIsDarkMode()
	}

	const sectionIds = ['scroll-spy']
	const { isVisible } = createScrollSpy({
		sections: sectionIds,
		offset: 32
	})

	const appTitle = PUBLIC_APP_TITLE || 'Librai UI'
	const appDescription =
		PUBLIC_APP_DESCRIPTION ||
		'A chatbot UI for interacting with an OpenAI chatbot trained on your data.'
</script>

<svelte:head>
	{#if !metaOverride}
		<title>{appTitle}</title>
		<meta name="description" content={appDescription} />

		<meta property="og:image" content={PUBLIC_APP_OG_IMAGE} />
		<meta property="og:image:alt" content={appDescription} />

		{#if PUBLIC_APP_OG_IMAGE}
			<meta property="og:image" content={PUBLIC_APP_OG_IMAGE} />
			<meta property="og:image:alt" content={appDescription} />
		{/if}

		{#if PUBLIC_APP_TWITTER_IMAGE}
			<meta property="twitter:image" content={PUBLIC_APP_TWITTER_IMAGE} />
			<meta name="twitter:card" content="summary_large_image" />
			<meta property="twitter:image:alt" content={appDescription} />
		{/if}
	{/if}

	<!-- Katex -->
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.19/dist/katex.min.css"
		integrity="sha256-NKg8QXp7tt8XVGCRSD7mBlZe7t3UK8Jyrh2CPTByCWY="
		crossorigin="anonymous"
	/>

	{#if !import.meta.env.DEV && PUBLIC_UMAMI_WEBSITE_ID}
		<script
			defer
			src="https://cloud.umami.is/script.js"
			data-website-id={PUBLIC_UMAMI_WEBSITE_ID}
		></script>
	{/if}
</svelte:head>

<div
	id="scroll-spy"
	aria-hidden="true"
	class="absolute top-0 left-0 right-0 w-0 h-8 bg-transparent z-[-1]"
></div>

<header
	class={`fixed top-0 left-0 w-screen transition duration-300 ease-out will-change-transform z-50 h-16 ${
		$isVisible ? 'bg-transparent border-transparent' : 'bg-chat-bar-bg border-b border-form-border'
	}`}
>
	<div class="h-full flex items-center justify-between max-w-7xl mx-auto">
		<div class="flex-shrink-0">
			{#if page.url.pathname !== '/'}
				<a
					class="inline-flex items-center space-x-2 py-2 px-1 lg:px-0 rounded-lg border-0"
					href="/"
					in:fade={{ duration: 200, easing: quartInOut }}
				>
					<h1
						class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-btn-bg to-btn-hover-bg"
					>
						{PUBLIC_APP_TITLE || 'Librai UI'}
					</h1>
				</a>
			{/if}
		</div>

		<div class="flex items-center space-x-3 max-md:pr-1">
			{#if !isCheckingConversations}
				<AuthMenu />
			{/if}

			<AppMenu {currentTheme} {isDarkMode} {toggleDarkMode} />
		</div>
	</div>
</header>

<main class="relative z-40">
	{@render children()}
</main>
