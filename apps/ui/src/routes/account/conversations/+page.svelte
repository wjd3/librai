<script lang="ts">
	import { fade } from 'svelte/transition'
	import { quartOut, quartInOut } from 'svelte/easing'
	import { currentConversation, chatHistory } from '$lib/stores/index'
	import { goto } from '$app/navigation'
	import { PUBLIC_APP_URL } from '$env/static/public'
	import { authToken } from '$lib/stores/auth'
	import { preventDefault } from '$lib/utils'
	import type { Conversation } from '$lib/server/services/pocketbaseService'

	let conversations = $state<Conversation[]>([])
	let isLoading = $state(true)
	let shareUrl = $state('')
	let showShareDialog = $state(false)
	let showDeleteDialog = $state(false)
	let conversationToDelete = $state<string | null>(null)
	let copiedShareIndex = $state<number | null>(null)
	let shareTimeout: NodeJS.Timeout
	let shareHoneypot = $state('')
	let editingTitleId = $state<string | null>(null)
	let editedTitle = $state('')
	let isSavingTitle = $state(false)

	$effect(() => {
		if ($authToken) {
			loadConversations()
		}
	})

	async function loadConversations() {
		try {
			const response = await fetch('/api/conversations', {
				headers: {
					Authorization: `Bearer ${$authToken}`
				}
			})
			if (response.ok) {
				conversations = await response.json()
			}
		} catch (error) {
			console.error('Error loading conversations:', error)
		}
		isLoading = false
	}

	async function loadConversation(conversation: Conversation) {
		goto(`/conversations/${conversation.id}`)
	}

	function confirmDelete(id: string) {
		conversationToDelete = id
		showDeleteDialog = true
	}

	let isDeleting = $state(false)

	async function deleteConversation() {
		if (!conversationToDelete) return

		try {
			isDeleting = true

			const response = await fetch(`/api/conversations/${conversationToDelete}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${$authToken}`
				}
			})

			if (!response.ok) throw new Error('Failed to delete conversation')

			conversations = conversations.filter((c) => c.id !== conversationToDelete)
			showDeleteDialog = false
			conversationToDelete = null
			isDeleting = false
		} catch (error) {
			console.error('Error deleting conversation:', error)
			isDeleting = false
		}
	}

	function getShareUrl(shareId: string) {
		return `${PUBLIC_APP_URL}/share/${shareId}`
	}

	let isSharing = $state(false)
	let isSharingIndex = $state<number | null>(null)

	async function shareConversation(conversation: Conversation, index: number) {
		try {
			isSharing = true
			isSharingIndex = index

			const response = await fetch(`/api/conversations/${conversation.id}/share`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${$authToken}`
				}
			})

			if (!response.ok) throw new Error('Failed to share conversation')

			const updated = await response.json()
			conversations = conversations.map((c) => (c.id === updated.id ? updated : c))

			if (!updated.shareId) {
				throw new Error(`Share ID is missing for conversation: ${updated.id}`)
			}

			shareUrl = getShareUrl(updated.shareId)
			showShareDialog = true
		} catch (error) {
			console.error('Error sharing conversation:', error)
		}
		isSharing = false
		isSharingIndex = null
	}

	async function unshareConversation(conversation: Conversation) {
		try {
			isSharing = true
			const response = await fetch(`/api/conversations/${conversation.id}/share`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${$authToken}`
				}
			})

			if (!response.ok) throw new Error('Failed to unshare conversation')

			const updated = await response.json()
			conversations = conversations.map((c) => (c.id === updated.id ? updated : c))
		} catch (error) {
			console.error('Error unsharing conversation:', error)
		}
		isSharing = false
	}

	function copyShareUrl(specificShareUrl?: string, index?: number) {
		navigator.clipboard.writeText(specificShareUrl || shareUrl)
		copiedShareIndex = index != null ? index : -1
		clearTimeout(shareTimeout)
		shareTimeout = setTimeout(() => {
			copiedShareIndex = null
		}, 3000)
	}

	async function newMessage() {
		currentConversation.set(null)
		chatHistory.set([])
		await goto('/')
	}

	async function updateConversationTitle(conversation: Conversation) {
		if (!editedTitle.trim()) {
			editingTitleId = null
			return
		}

		try {
			isSavingTitle = true
			const response = await fetch(`/api/conversations/${conversation.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$authToken}`
				},
				body: JSON.stringify({ title: editedTitle.trim() })
			})

			if (!response.ok) throw new Error('Failed to update title')

			const updated = await response.json()
			conversations = conversations.map((c) => (c.id === updated.id ? updated : c))
			editingTitleId = null
		} catch (error) {
			console.error('Error updating title:', error)
		} finally {
			isSavingTitle = false
		}
	}

	function startEditing(conversation: Conversation) {
		editingTitleId = conversation.id
		editedTitle = conversation.title
	}

	function handleTitleKeydown(event: KeyboardEvent, conversation: Conversation) {
		if (event.key === 'Enter') {
			event.preventDefault()
			updateConversationTitle(conversation)
		} else if (event.key === 'Escape') {
			editingTitleId = null
		}
	}
</script>

<section class="pt-0 w-full max-w-[664px]">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl" class:animate-pulse={isLoading}>
			{#if isLoading}
				Loading...
			{:else if conversations && !conversations.length}
				No Conversations
			{:else}
				Your Conversations
			{/if}
		</h1>
		<button class="primary px-4" onclick={newMessage} aria-label="New Message">
			<span class="iconify lucide--message-square-plus"></span>
		</button>
	</div>

	{#if isLoading}
		<span class="iconify lucide--rotate-cw animate-spin w-6 h-6 mx-auto mt-8"> </span>
	{:else if conversations.length === 0}
		<p>No conversations yet.</p>
	{:else}
		<div class="space-y-4">
			{#each conversations as conversation, i}
				<div
					class="bg-primary-card-bg px-4 pt-2 pb-4 rounded-lg shadow-sm group"
					transition:fade={{ duration: 200, easing: quartInOut }}
				>
					<div class="flex items-center justify-between mb-2">
						{#if editingTitleId === conversation.id}
							<form
								class="flex-1"
								onsubmit={preventDefault(() => updateConversationTitle(conversation))}
							>
								<input
									type="text"
									bind:value={editedTitle}
									class="input w-full"
									placeholder="Enter title..."
									maxlength="150"
									onkeydown={(e) => handleTitleKeydown(e, conversation)}
								/>
							</form>
							<div class="flex space-x-2 ml-2">
								<button
									class="secondary p-1"
									disabled={isSavingTitle}
									onclick={() => (editingTitleId = null)}
									title="Cancel"
									aria-label="Cancel"
								>
									<span class="iconify lucide--x"></span>
								</button>

								<button
									class="primary p-1"
									disabled={editedTitle === conversation.title || isSavingTitle}
									onclick={() => updateConversationTitle(conversation)}
									title="Save"
									aria-label="Save"
								>
									{#if isSavingTitle}
										<span class="iconify lucide--rotate-cw animate-spin"> </span>
									{:else}
										<span class="iconify lucide--check"></span>
									{/if}
								</button>
							</div>
						{:else}
							<div class="min-h-[48px] flex items-center">
								<h2 class="text-xl flex-1 truncate w-[235px] sm:w-96 md:w-[515px]">
									{conversation.title}
								</h2>
							</div>

							<button
								class="primary px-2 py-1 ml-4"
								onclick={() => startEditing(conversation)}
								title="Edit title"
								aria-label="Edit title"
							>
								<span class="iconify lucide--square-pen"></span>
							</button>
						{/if}
					</div>

					<p class="text-sm opacity-70 mb-4">
						{new Date(conversation.updated).toLocaleDateString()}
					</p>

					<div class="flex justify-between space-x-2">
						<button
							aria-label="Delete Conversation"
							class="secondary px-4"
							onclick={() => confirmDelete(conversation.id)}
						>
							<span class="iconify lucide--trash-2"></span>
						</button>

						<div class="flex space-x-2">
							{#if conversation.isPublic}
								<button
									disabled={isSharing}
									class="secondary px-4"
									onclick={() => unshareConversation(conversation)}
									aria-label="Unshare Conversation"
								>
									{#if isSharing}
										<span class="iconify lucide--rotate-cw animate-spin"> </span>
									{:else}
										<span class="iconify lucide--link-2-off"></span>
									{/if}
								</button>

								<button
									class="primary px-4"
									onclick={() =>
										conversation.shareId && copyShareUrl(getShareUrl(conversation.shareId), i)}
								>
									{#if copiedShareIndex === i}
										<span class="iconify lucide--check"></span>
									{:else}
										<span class="iconify lucide--copy"></span>
									{/if}
								</button>
							{:else}
								<button
									disabled={isSharing}
									class="primary px-4"
									onclick={() => shareConversation(conversation, i)}
								>
									{#if isSharing && isSharingIndex === i}
										<span class="iconify lucide--rotate-cw animate-spin"></span>
									{:else}
										<span class="iconify lucide--link"></span>
									{/if}
								</button>
							{/if}

							<button
								aria-label="Continue Conversation"
								class="primary px-4"
								onclick={() => loadConversation(conversation)}
							>
								<span class="iconify lucide--step-forward"></span>
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
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<div
				aria-hidden="true"
				class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
				onclick={() => (showShareDialog = false)}
			></div>

			<div
				class="bg-page-bg p-6 rounded-lg max-w-[34rem] w-full mx-4 relative"
				transition:fade={{ duration: 200, easing: quartInOut }}
			>
				<h2 class="text-xl mb-4">Share Conversation</h2>

				<form onsubmit={preventDefault(() => copyShareUrl())} class="space-y-4">
					<div class="flex space-x-2">
						<input type="text" readonly value={shareUrl} class="w-full input" />
						<button type="submit" class="secondary px-4">
							{#if copiedShareIndex === -1}
								<span class="iconify lucide--copy"></span>
							{:else}
								<span class="iconify lucide--check"></span>
							{/if}
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
			transition:fade={{ duration: 200, easing: quartOut }}
		>
			<div
				aria-hidden="true"
				class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
				onclick={() => (showDeleteDialog = false)}
			></div>

			<div
				class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative"
				in:fade={{ duration: 200, easing: quartOut }}
				out:fade={{ duration: 200, easing: quartOut }}
			>
				<h2 class="text-xl mb-4">Delete Conversation</h2>
				<p class="mb-6">
					Are you sure you want to delete this conversation? This action cannot be undone.
				</p>

				<div class="flex justify-end space-x-4">
					<button class="secondary px-4" onclick={() => (showDeleteDialog = false)}>
						Cancel
					</button>
					<button disabled={isDeleting} class="primary px-4" onclick={deleteConversation}>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>
