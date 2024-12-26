<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import { page } from '$app/stores'
	import { marked } from 'marked'
	import DOMPurify from 'dompurify'
	import CopyButton from '$lib/components/CopyButton.svelte'
	import { PUBLIC_APP_TITLE, PUBLIC_APP_URL } from '$env/static/public'
	import type { Conversation } from '$lib/server/services/pocketbaseService'
	import { goto } from '$app/navigation'

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

	async function newMessage() {
		await goto('/')
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

<section class="container max-w-2xl mx-auto">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-4xl">Shared Conversation</h1>
		<button class="primary px-4" onclick={newMessage}> New Message </button>
	</div>

	{#if isLoading}
		<p>Loading shared conversation...</p>
	{:else if error}
		<div class="bg-red-500/10 p-4 rounded-lg">
			<p class="text-red-500">{error}</p>
		</div>
	{:else if conversation}
		<div class="space-y-6">
			<h1 class="text-2xl">{conversation.title}</h1>
			<div class="space-y-6 flex flex-col">
				{#each conversation.messages as message, i}
					<div
						class={`chat-message ${message.isUser ? 'is-user' : ''}`}
						transition:fade={{ duration: 200, easing: cubicInOut }}
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
