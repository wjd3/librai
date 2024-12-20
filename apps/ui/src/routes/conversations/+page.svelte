<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import { pb } from '$lib/clients/pocketbase'
	import {
		currentUser,
		isAuthenticated,
		currentConversation,
		chatHistory,
		isAuthLoading
	} from '$lib/stores'
	import { goto } from '$app/navigation'
	import { PUBLIC_APP_URL } from '$env/static/public'
	import type { Conversation } from '$lib/server/services/pocketbaseService'

	let conversations = $state<Conversation[]>([])
	let isLoading = $state(true)
	let shareUrl = $state('')
	let showShareDialog = $state(false)
	let showDeleteDialog = $state(false)
	let conversationToDelete = $state<string | null>(null)
	let copiedShare = $state(false)
	let shareTimeout: NodeJS.Timeout
	let shareHoneypot = $state('')

	onMount(async () => {
		if (!$isAuthenticated && !$isAuthLoading) {
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

	function confirmDelete(id: string) {
		conversationToDelete = id
		showDeleteDialog = true
	}

	async function deleteConversation() {
		if (!conversationToDelete) return

		try {
			await pb.collection('conversations').delete(conversationToDelete)
			conversations = conversations.filter((c) => c.id !== conversationToDelete)
			showDeleteDialog = false
			conversationToDelete = null
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

	async function newMessage() {
		currentConversation.set(null)
		chatHistory.set([])
		await goto('/')
	}
</script>

<section class="container max-w-2xl mx-auto">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-4xl">Your Conversations</h1>
		<button class="primary px-4" onclick={newMessage}> New Message </button>
	</div>

	{#if isLoading}
		<p>Loading conversations...</p>
	{:else if conversations.length === 0}
		<p>No conversations yet.</p>
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
					<div class="flex justify-between space-x-2">
						<button
							aria-label="Delete Conversation"
							class="secondary px-4"
							onclick={() => confirmDelete(conversation.id)}
						>
							<svg
								class="w-4 h-4"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								><path
									fill="none"
									stroke="currentColor"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6"
								/></svg
							>
						</button>

						<div class="flex space-x-2">
							{#if conversation.isPublic}
								<button class="secondary px-4" onclick={() => unshareConversation(conversation)}>
									Unshare
								</button>
							{:else}
								<button class="secondary px-4" onclick={() => shareConversation(conversation)}>
									Share
								</button>
							{/if}

							<button class="primary px-4" onclick={() => loadConversation(conversation)}>
								Continue
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showShareDialog}
		<div
			class="fixed inset-0 flex items-center justify-center z-50 !ml-0"
			transition:fade={{ duration: 200 }}
		>
			<div
				aria-hidden="true"
				class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
				onclick={() => (showShareDialog = false)}
			></div>

			<div
				class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative"
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
							maxlength="4096"
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

	{#if showDeleteDialog}
		<div
			class="fixed inset-0 flex items-center justify-center z-50 !ml-0"
			transition:fade={{ duration: 200 }}
		>
			<div
				aria-hidden="true"
				class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
				onclick={() => (showDeleteDialog = false)}
			></div>

			<div
				class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative"
				transition:fade={{ duration: 200, delay: 100 }}
			>
				<h2 class="text-xl mb-4">Delete Conversation</h2>
				<p class="mb-6">
					Are you sure you want to delete this conversation? This action cannot be undone.
				</p>

				<div class="flex justify-end space-x-4">
					<button class="secondary px-4" onclick={() => (showDeleteDialog = false)}>
						Cancel
					</button>
					<button class="primary px-4" onclick={deleteConversation}> Delete </button>
				</div>
			</div>
		</div>
	{/if}
</section>
