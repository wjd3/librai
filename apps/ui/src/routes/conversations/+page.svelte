<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import { pb } from '$lib/clients/pocketbase'
	import { currentUser, isAuthenticated, currentConversation, chatHistory } from '$lib/stores'
	import { goto } from '$app/navigation'
	import { PUBLIC_APP_URL } from '$env/static/public'
	import type { Conversation } from '$lib/server/services/pocketbaseService'

	let conversations = $state<Conversation[]>([])
	let isLoading = $state(true)
	let shareUrl = $state('')
	let showShareDialog = $state(false)
	let copiedShare = $state(false)
	let shareTimeout: NodeJS.Timeout
	let shareHoneypot = $state('')

	onMount(async () => {
		if (!$isAuthenticated) {
			goto('/')
			return
		}

		try {
			conversations = await pb.collection('conversations').getFullList({
				filter: `user = "${$currentUser?.id}"`,
				sort: '-updated'
			})
		} catch (error) {
			console.error('Error loading conversations:', error)
		}

		isLoading = false
	})

	async function loadConversation(conversation: Conversation) {
		currentConversation.set(conversation)
		chatHistory.set(conversation.messages)
		goto('/')
	}

	async function deleteConversation(id: string) {
		try {
			await pb.collection('conversations').delete(id)
			conversations = conversations.filter((c) => c.id !== id)
		} catch (error) {
			console.error('Error deleting conversation:', error)
		}
	}

	async function shareConversation(conversation: Conversation) {
		if (shareHoneypot) {
			showShareDialog = false
			return
		}

		try {
			const updated = await pb.collection<Conversation>('conversations').update(conversation.id, {
				isPublic: true,
				shareId: conversation.shareId || Math.random().toString(36).substring(2, 15),
				updated: new Date().toISOString()
			})

			conversations = conversations.map((c) => (c.id === updated.id ? updated : c))
			shareUrl = `${PUBLIC_APP_URL}/share/${updated.shareId}`
			showShareDialog = true
		} catch (error) {
			console.error('Error sharing conversation:', error)
		}
	}

	async function unshareConversation(conversation: Conversation) {
		try {
			const updated = await pb.collection<Conversation>('conversations').update(conversation.id, {
				isPublic: false,
				shareId: null,
				updated: new Date().toISOString()
			})

			// Update local state
			conversations = conversations.map((c) => (c.id === updated.id ? updated : c))
		} catch (error) {
			console.error('Error unsharing conversation:', error)
		}
	}

	function copyShareUrl() {
		navigator.clipboard.writeText(shareUrl)
		copiedShare = true
		clearTimeout(shareTimeout)
		shareTimeout = setTimeout(() => {
			copiedShare = false
		}, 3000)
	}

	function preventDefault(fn: (event: Event) => void) {
		return (event: Event) => {
			event.preventDefault()
			fn(event)
		}
	}
</script>

<div class="container max-w-2xl mx-auto px-4 py-8">
	<h1 class="text-2xl mb-6">Your Conversations</h1>

	{#if isLoading}
		<p>Loading conversations...</p>
	{:else if conversations.length === 0}
		<p>No conversations yet</p>
	{:else}
		<div class="space-y-4">
			{#each conversations as conversation}
				<div
					class="bg-chat-bg p-4 rounded-lg"
					transition:fade={{ duration: 200, easing: cubicInOut }}
				>
					<h2 class="text-lg mb-2">{conversation.title}</h2>
					<p class="text-sm opacity-70 mb-4">
						{new Date(conversation.updated).toLocaleDateString()}
					</p>
					<div class="flex justify-end space-x-2">
						{#if conversation.isPublic}
							<button class="secondary px-4" onclick={() => unshareConversation(conversation)}>
								Unshare
							</button>
						{:else}
							<button class="secondary px-4" onclick={() => shareConversation(conversation)}>
								Share
							</button>
						{/if}
						<button class="secondary px-4" onclick={() => deleteConversation(conversation.id)}>
							Delete
						</button>
						<button class="primary px-4" onclick={() => loadConversation(conversation)}>
							Continue
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showShareDialog}
		<div
			class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
			transition:fade={{ duration: 200 }}
		>
			<div
				class="bg-chat-bg p-6 rounded-lg max-w-sm w-full mx-4"
				transition:fade={{ duration: 200, delay: 100 }}
			>
				<h2 class="text-xl mb-4">Share Conversation</h2>

				<form onsubmit={preventDefault(copyShareUrl)} class="space-y-4">
					<div class="flex space-x-2">
						<input type="text" readonly value={shareUrl} class="w-full input" />
						<button type="submit" class="secondary px-4">
							{copiedShare ? 'Copied!' : 'Copy'}
						</button>
					</div>

					<div class="sr-only">
						<label for="share_website">Leave this empty:</label>
						<input
							bind:value={shareHoneypot}
							type="text"
							id="share_website"
							name="share_website"
							autocomplete="off"
							tabindex="-1"
						/>
					</div>

					<div class="flex justify-end">
						<button type="button" class="primary px-4" onclick={() => (showShareDialog = false)}>
							Close
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
