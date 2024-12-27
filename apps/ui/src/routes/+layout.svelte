<script lang="ts">
	import '$styles/main.css'
	import { onMount } from 'svelte'
	import { PUBLIC_THEME, PUBLIC_APP_TITLE, PUBLIC_APP_DESCRIPTION } from '$env/static/public'
	import { themes, type Theme } from '$lib/constants/theme'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import Auth from '$lib/components/Auth.svelte'
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte'
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
</script>

<svelte:head>
	<title>{PUBLIC_APP_TITLE || 'Librai UI'}</title>
	<meta
		name="description"
		content={PUBLIC_APP_DESCRIPTION ||
			'A chatbot UI for interacting with an OpenAI chatbot trained on your data.'}
	/>
</svelte:head>

<header>
	<div class="container relative">
		<div
			class="hidden md:block fixed top-6 md:top-8 lg:top-10 xl:top-12 left-8 md:left-12 lg:left-16 xl:left-24 z-50"
		>
			{#if $page.url.pathname !== '/'}
				<a class="inline-block p-0 border-none" href="/">
					<h1 class="text-xl" in:fade={{ duration: 500, easing: cubicInOut }}>
						{#if PUBLIC_APP_TITLE}
							{PUBLIC_APP_TITLE}
						{:else}
							Librai UI
						{/if}
					</h1>
				</a>
			{/if}
		</div>

		<div
			class="fixed z-50 top-6 md:top-8 lg:top-10 xl:top-12 right-8 md:right-12 lg:right-16 xl:right-24 flex items-center space-x-4"
		>
			{#if !$isAuthLoading && !isCheckingConversations}
				{#if $isAuthenticated && hasConversations}
					<a href="/conversations" class="secondary px-4"> History </a>
				{/if}

				<Auth />
			{/if}

			<DarkModeToggle {isDarkMode} {toggleDarkMode} />
		</div>
	</div>
</header>

<main>
	{@render children()}
</main>
