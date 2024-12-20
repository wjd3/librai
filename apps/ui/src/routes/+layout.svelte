<script lang="ts">
	import '$styles/main.css'
	import { onMount } from 'svelte'
	import { PUBLIC_THEME, PUBLIC_APP_TITLE } from '$env/static/public'
	import { defaultTheme, themes } from '$lib/constants/theme'
	import { chatHistory, isAuthenticated, currentUser } from '$lib/stores'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import Auth from '$lib/components/Auth.svelte'
	import { pb } from '$lib/clients/pocketbase'
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte'

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

	let hasConversations = $state(false)

	$effect(() => {
		if ($isAuthenticated && $currentUser) {
			pb.collection('conversations')
				.getList(1, 1, {
					filter: `user = "${$currentUser.id}"`
				})
				.then((result) => {
					hasConversations = result.totalItems > 0
				})
				.catch((error) => {
					console.error('Error checking conversations:', error)
					hasConversations = false
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

		// Initialize auth state
		isAuthenticated.set(pb.authStore.isValid)
		if (pb.authStore.model) {
			currentUser.set({
				id: pb.authStore.model.id,
				email: pb.authStore.model.email,
				name: pb.authStore.model.name
			})
		}

		// Check if user is already authenticated
		if (pb.authStore.isValid) {
			try {
				// Try to refresh the token
				await pb.collection('users').authRefresh()
			} catch (error) {
				console.error('Error refreshing auth:', error)
				pb.authStore.clear()
				isAuthenticated.set(false)
				currentUser.set(null)
			}
		}
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

		<div
			class="fixed z-50 top-6 md:top-8 lg:top-10 xl:top-12 right-8 md:right-12 lg:right-16 xl:right-24 flex items-center space-x-4"
		>
			{#if $isAuthenticated && hasConversations}
				<a href="/conversations" class="secondary px-4"> History </a>
			{/if}

			<Auth />

			<DarkModeToggle {isDarkMode} {toggleDarkMode} />
		</div>
	</div>
</header>

<main>
	{@render children()}
</main>
