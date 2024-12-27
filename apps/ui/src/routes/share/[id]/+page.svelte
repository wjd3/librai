<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import { page } from '$app/stores'
	import { marked } from 'marked'
	import DOMPurify from 'dompurify'
	import CopyButton from '$components/CopyButton.svelte'
	import { PUBLIC_APP_TITLE, PUBLIC_APP_URL } from '$env/static/public'
	import { goto } from '$app/navigation'
	import { isAuthenticated, authToken } from '$lib/stores/auth'
	import { currentConversation, chatHistory } from '$lib/stores/index'
	import type { Conversation } from '$lib/server/services/pocketbaseService'

	let conversation = $state<Conversation | null>(null)
	let isLoading = $state(true)
	let error = $state('')

	// Generate OG image URL
	function generateOgImageUrl(title: string, userMessage: string, aiMessage: string) {
		const ogImageUrl = new URL('https://og.tailgraph.com/og')
		ogImageUrl.searchParams.set('fontFamily', 'Inter')
		ogImageUrl.searchParams.set('title', `${PUBLIC_APP_TITLE || 'Librai UI'} - ${title}`)
		ogImageUrl.searchParams.set('titleTailwind', 'text-4xl font-bold text-text-color mb-4')
		ogImageUrl.searchParams.set(
			'text',
			userMessage.slice(0, 100) + (userMessage.length > 100 ? '...' : '')
		)
		ogImageUrl.searchParams.set('textTailwind', 'text-lg text-text-color/80 mb-2')
		ogImageUrl.searchParams.set(
			'footer',
			aiMessage.slice(0, 150) + (aiMessage.length > 150 ? '...' : '')
		)
		ogImageUrl.searchParams.set('footerTailwind', 'text-sm text-text-color/70')
		ogImageUrl.searchParams.set('bgTailwind', 'bg-page-bg')
		ogImageUrl.searchParams.set(
			'containerTailwind',
			'flex flex-col items-start justify-center p-16 bg-primary-card-bg rounded-lg border border-form-border'
		)
		return ogImageUrl.toString()
	}

	$effect(() => {
		if (conversation) {
			const userMessage = conversation.messages.find((m) => m.isUser)?.message || ''
			const aiMessage = conversation.messages.find((m) => !m.isUser)?.message || ''
			const ogImageUrl = generateOgImageUrl(conversation.title, userMessage, aiMessage)

			// Update meta tags dynamically
			document.title = conversation.title
			document
				.querySelector('meta[property="og:title"]')
				?.setAttribute('content', conversation.title)
			document
				.querySelector('meta[property="og:description"]')
				?.setAttribute('content', `${userMessage.slice(0, 200)}...`)
			document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImageUrl)
			document
				.querySelector('meta[property="og:url"]')
				?.setAttribute('content', `${PUBLIC_APP_URL}/share/${$page.params.id}`)
			document
				.querySelector('meta[name="twitter:title"]')
				?.setAttribute('content', conversation.title)
			document
				.querySelector('meta[name="twitter:description"]')
				?.setAttribute('content', `${userMessage.slice(0, 200)}...`)
			document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', ogImageUrl)
		}
	})

	onMount(async () => {
		const shareId = $page.params.id
		if (!shareId) {
			error = 'Invalid share link'
			isLoading = false
			return
		}

		try {
			const response = await fetch(`/api/conversations/shared/${shareId}`)
			if (!response.ok) {
				error = 'Conversation not found or no longer shared.'
			} else {
				conversation = await response.json()
			}
		} catch (err) {
			console.error('Error loading shared conversation:', err)
			error = 'Error loading conversation.'
		}

		isLoading = false
	})

	async function forkConversation() {
		if (!conversation) return

		if ($isAuthenticated) {
			// Check if this is the user's own conversation
			try {
				const response = await fetch(`/api/conversations/${conversation.id}`, {
					headers: {
						Authorization: `Bearer ${$authToken}`
					}
				})

				if (response.ok) {
					// User owns this conversation, redirect to continue it
					await goto(`/conversations/${conversation.id}`)
					return
				}
			} catch (error) {
				console.error('Error checking conversation ownership:', error)
			}

			// User is logged in but doesn't own the conversation - create a new one
			try {
				const response = await fetch('/api/conversations', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${$authToken}`
					},
					body: JSON.stringify({
						title: conversation.title,
						messages: conversation.messages
					})
				})

				if (response.ok) {
					const result = await response.json()
					await goto(`/conversations/${result.id}`)
				}
			} catch (error) {
				console.error('Error forking conversation:', error)
			}
		} else {
			// For non-logged-in users, create a temporary conversation
			const tempId = crypto.randomUUID()
			currentConversation.set({
				id: tempId,
				title: conversation.title,
				messages: conversation.messages,
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				isPublic: false,
				shareId: undefined,
				user: ''
			})
			chatHistory.set(conversation.messages)
			await goto(`/conversations/${tempId}`)
		}
	}
</script>

<svelte:head>
	<title>{conversation?.title || 'Shared Conversation'}</title>
	<meta property="og:title" content="" />
	<meta property="og:description" content="" />
	<meta property="og:image" content="" />
	<meta property="og:url" content="" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="" />
	<meta name="twitter:description" content="" />
	<meta name="twitter:image" content="" />
</svelte:head>

<section class="container max-w-2xl mx-auto !pb-16">
	<div class="flex justify-between items-center mb-6">
		<h1 class={`text-3xl ${isLoading ? 'animate-pulse' : ''}`}>
			{#if isLoading}
				Loading Conversation...
			{:else if conversation}
				{conversation.title}
			{/if}
		</h1>
		<button disabled={isLoading} class="primary px-4" onclick={forkConversation}>
			Continue Chat
		</button>
	</div>

	{#if isLoading}
		<svg
			class="w-6 h-6 animate-spin mx-auto mt-8"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" fill="transparent" /><path
				d="M21 3v5h-5"
			/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" fill="transparent" /><path
				d="M8 16H3v5"
			/>
			<path d="M8 16H3v5" />
		</svg>
	{:else if error}
		<div class="bg-red-500/10 p-4 rounded-lg">
			<p class="text-red-500">{error}</p>
		</div>
	{:else if conversation}
		<div class="space-y-6">
			<div class="space-y-6 flex flex-col">
				{#each conversation.messages as message, i}
					<div
						class="chat-message"
						class:is-user={message.isUser}
						transition:fade={{ duration: 200, easing: quartInOut }}
					>
						{#if message.isUser}
							<h2 class="sr-only">User said:</h2>
							<p>{DOMPurify.sanitize(message.message)}</p>
						{:else}
							<h2 class="sr-only">AI said:</h2>
							{@html marked.parse(DOMPurify.sanitize(message.message))}
							<CopyButton {message} messageIndex={i} />
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
