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
	import { page } from '$app/stores'
	import { authToken, currentUser, isAuthenticated, isAuthLoading } from '$lib/stores/auth'

	let { children } = $props()

	// Themes
	const theme = themes.includes(PUBLIC_THEME as Theme) ? PUBLIC_THEME : themes[0]
	const setTheme = () => {
		document.documentElement.setAttribute('data-theme', theme)
	}

	// Dark mode
	let isDarkMode = $state(false)
	const setIsDarkMode = () => {
		document.documentElement.setAttribute('data-mode', isDarkMode ? 'dark' : 'light')
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
		offset: 64
	})

	const appTitle = PUBLIC_APP_TITLE || 'Librai UI'
	const appDescription =
		PUBLIC_APP_DESCRIPTION ||
		'A chatbot UI for interacting with an OpenAI chatbot trained on your data.'
</script>

<svelte:head>
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
</svelte:head>

<div
	id="scroll-spy"
	aria-hidden="true"
	class="absolute top-0 left-0 right-0 w-0 h-16 bg-transparent z-[-1]"
></div>

<header
	class={`fixed top-0 left-0 w-screen bg-chat-bar-bg border-b border-form-border transition-colors duration-200 ease-out will-change-transform z-50 h-16 ${
		$isVisible ? 'bg-transparent border-transparent' : ''
	}`}
>
	<div class="px-4 md:px-8 h-full flex items-center justify-between">
		<div class="flex-shrink-0">
			{#if $page.url.pathname !== '/'}
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

		<div class="flex items-center space-x-2 md:space-x-4">
			{#if !$isAuthLoading && !isCheckingConversations}
				{#if $isAuthenticated && hasConversations}
					<a href="/conversations" class="secondary px-4 py-2" aria-label="History">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="!fill-none"
							><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
								d="M3 3v5h5"
							/><path d="M12 7v5l4 2" /></svg
						>
					</a>
				{/if}

				<Auth />
			{/if}

			<DarkModeToggle {isDarkMode} {toggleDarkMode} />
		</div>
	</div>
</header>

<main class="relative z-40">
	{@render children()}
</main>
