<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import { pb } from '$lib/clients/pocketbase'
	import { page } from '$app/stores'
	import { marked } from 'marked'
	import DOMPurify from 'dompurify'
	import type { Conversation } from '$lib/server/services/pocketbaseService'

	let conversation = $state<Conversation | null>(null)
	let isLoading = $state(true)
	let error = $state('')

	onMount(async () => {
		const shareId = $page.params.id
		if (!shareId) {
			error = 'Invalid share link'
			isLoading = false
			return
		}

		try {
			const records = await pb.collection<Conversation>('conversations').getFullList({
				filter: `shareId = "${shareId}" && isPublic = true`
			})

			if (records.length === 0) {
				error = 'Conversation not found or no longer shared'
			} else {
				conversation = records[0]
			}
		} catch (err) {
			console.error('Error loading shared conversation:', err)
			error = 'Error loading conversation'
		}

		isLoading = false
	})
</script>

<div class="container max-w-2xl mx-auto px-4 py-8">
	{#if isLoading}
		<p>Loading shared conversation...</p>
	{:else if error}
		<div class="bg-red-500/10 p-4 rounded-lg">
			<p class="text-red-500">{error}</p>
		</div>
	{:else if conversation}
		<div class="space-y-6">
			<h1 class="text-2xl">{conversation.title}</h1>
			<div class="space-y-6">
				{#each conversation.messages as message}
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
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
