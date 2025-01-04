<script lang="ts">
	import '$styles/main.css'
	import { createScrollSpy } from '$lib/scroll'
	import { onMount } from 'svelte'
	import {
		PUBLIC_THEME,
		PUBLIC_APP_TITLE,
		PUBLIC_APP_DESCRIPTION,
		PUBLIC_APP_OG_IMAGE,
		PUBLIC_APP_TWITTER_IMAGE
	} from '$env/static/public'
	import { themes, type Theme } from '$lib/constants/theme'
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import Auth from '$components/Auth.svelte'
	import DarkModeToggle from '$components/DarkModeToggle.svelte'
	import { page } from '$app/state'
	import { authToken, currentUser, isAuthenticated, isAuthLoading } from '$lib/stores/auth'

	let { children } = $props()

	const metaOverride = page.data.meta

	// Themes
	const theme = themes.includes(PUBLIC_THEME as Theme) ? PUBLIC_THEME : themes[0]
	const setTheme = () => {
		document.documentElement.setAttribute('data-theme', theme)
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
				authToken.set(data.token)
				currentUser.set(data.user)
				isAuthenticated.set(true)
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
			<meta property="twitter:image:alt" content={appDescription} />
		{/if}
	{/if}
</svelte:head>

<div
	id="scroll-spy"
	aria-hidden="true"
	class="absolute top-0 left-0 right-0 w-0 h-8 bg-transparent z-[-1]"
></div>

<header
	class={`fixed top-0 left-0 w-screen bg-chat-bar-bg border-b border-form-border transition-colors duration-200 ease-out will-change-transform z-50 h-16 ${
		$isVisible ? 'bg-transparent border-transparent' : ''
	}`}
>
	<div class="h-full flex items-center justify-between">
		<div class="flex-shrink-0">
			{#if page.url.pathname !== '/'}
				<a
					class="inline-block p-0 border-none"
					href="/"
					in:fade={{ duration: 200, easing: quartInOut }}
				>
					<h1 class="text-xl">
						{PUBLIC_APP_TITLE || 'Librai UI'}
					</h1>
				</a>
			{/if}
		</div>

		<div class="flex items-center space-x-4">
			{#if !isCheckingConversations}
				<Auth />
			{/if}

			<DarkModeToggle {isDarkMode} {toggleDarkMode} />
		</div>
	</div>
</header>

<main class="relative z-40">
	{@render children()}
</main>
