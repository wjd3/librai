<script lang="ts">
	import '$styles/main.css'
	import { createScrollSpy } from '$lib/scroll'
	import { onMount } from 'svelte'
	import { PUBLIC_THEME, PUBLIC_APP_TITLE, PUBLIC_APP_DESCRIPTION } from '$env/static/public'
	import { themes, type Theme } from '$lib/constants/theme'
	import { fade } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing'
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

	$effect(() => {
		console.log('isVisible', $isVisible)
	})
</script>

<svelte:head>
	<title>{PUBLIC_APP_TITLE || 'Librai UI'}</title>
	<meta
		name="description"
		content={PUBLIC_APP_DESCRIPTION ||
			'A chatbot UI for interacting with an OpenAI chatbot trained on your data.'}
	/>
</svelte:head>

<div
	id="scroll-spy"
	aria-hidden="true"
	class="absolute top-0 left-0 right-0 w-0 h-16 bg-transparent z-[-1]"
></div>

<header
	class={`fixed flex items-center justify-between top-0 left-0 w-screen bg-chat-bar-bg border-b border-form-border transition-all duration-200 ease-out will-change-transform z-50 ${
		!$isVisible ? 'h-14 translate-y-0' : 'h-20 bg-transparent border-transparent translate-y-0'
	}`}
>
	<div class="px-8">
		{#if $page.url.pathname !== '/'}
			<a
				class="inline-block p-0 border-none"
				href="/"
				transition:fade={{ duration: 200, easing: quadInOut }}
			>
				<h1 class={`transition-all duration-200 ${!$isVisible ? 'text-lg' : 'text-xl'}`}>
					{#if PUBLIC_APP_TITLE}
						{PUBLIC_APP_TITLE}
					{:else}
						Librai UI
					{/if}
				</h1>
			</a>
		{/if}
	</div>

	<div class="flex items-center space-x-4 px-8">
		{#if !$isAuthLoading && !isCheckingConversations}
			{#if $isAuthenticated && hasConversations}
				<a href="/conversations" class="secondary px-4"> History </a>
			{/if}

			<Auth />
		{/if}

		<DarkModeToggle {isDarkMode} {toggleDarkMode} />
	</div>
</header>

<main class="relative z-40">
	{@render children()}
</main>
