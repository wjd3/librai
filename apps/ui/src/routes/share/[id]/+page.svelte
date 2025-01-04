<script lang="ts">
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import { marked } from 'marked'
	import DOMPurify from 'isomorphic-dompurify'
	import CopyButton from '$components/CopyButton.svelte'
	import { isAuthenticated, authToken } from '$lib/stores/auth'
	import { currentConversation, chatHistory } from '$lib/stores/index'
	import { goto } from '$app/navigation'

	let { data } = $props()
	const { conversation, meta } = data

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

			// User is logged in but doesn't own the conversation - fork it
			try {
				const response = await fetch('/api/conversations/fork', {
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
	<title>{meta.title}</title>
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={meta.ogImage} />
	<meta property="og:url" content={meta.ogUrl} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.ogImage} />
</svelte:head>

<section class="container max-w-2xl mx-auto !pb-16">
	<div class="space-y-3 mb-6">
		<button class="primary px-2" onclick={forkConversation} aria-label="Continue Chat">
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
				><line x1="6" x2="6" y1="4" y2="20" /><polygon points="10,4 20,12 10,20" /></svg
			>
		</button>

		<h1 class="text-2xl sm:text-3xl">
			{conversation.title}
		</h1>
	</div>

	<div class="flex flex-col space-y-6">
		<div class="space-y-6 flex flex-col">
			{#each conversation.messages as { message, isUser }, i}
				<div
					class="chat-message"
					class:is-user={isUser}
					transition:fade={{ duration: 200, easing: quartInOut }}
				>
					{#if isUser}
						<h2 class="sr-only">User said:</h2>
						<p>{DOMPurify.sanitize(message)}</p>
					{:else}
						<h2 class="sr-only">AI said:</h2>
						{@html marked.parse(DOMPurify.sanitize(message), { async: false })}
						<CopyButton {message} messageIndex={i} />
					{/if}
				</div>
			{/each}
		</div>

		<button class="primary px-2 self-end" onclick={forkConversation} aria-label="Continue Chat">
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
				><line x1="6" x2="6" y1="4" y2="20" /><polygon points="10,4 20,12 10,20" /></svg
			>
		</button>
	</div>
</section>
