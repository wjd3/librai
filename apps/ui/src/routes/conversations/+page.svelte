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

<section class="container max-w-2xl mx-auto !pb-12">
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
			<svg
				class="!fill-none"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path
					d="M12 7v6"
				/><path d="M9 10h6" /></svg
			>
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
	{:else if conversations.length === 0}
		<p>No conversations yet.</p>
	{:else}
		<div class="space-y-4">
			{#each conversations as conversation, i}
				<div
					class="bg-primary-card-bg px-4 pt-2 pb-4 rounded-lg group"
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
									class="secondary py-1"
									disabled={isSavingTitle}
									onclick={() => (editingTitleId = null)}
									title="Cancel"
									aria-label="Cancel"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24">
										<path
											fill="none"
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M18 6L6 18M6 6l12 12"
										/>
									</svg>
								</button>

								<button
									class="secondary p-1"
									disabled={editedTitle === conversation.title || isSavingTitle}
									onclick={() => updateConversationTitle(conversation)}
									title="Save"
									aria-label="Save"
								>
									{#if isSavingTitle}
										<svg
											class="!fill-none"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path
												d="M21 3v5h-5"
											/></svg
										>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
										>
											<path
												fill="none"
												stroke="currentColor"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{/if}
								</button>
							</div>
						{:else}
							<div class="min-h-[48px] flex items-center">
								<h2 class="text-xl flex-1 truncate w-[310px]">{conversation.title}</h2>
							</div>

							<button
								class="secondary px-2 py-1 ml-4"
								onclick={() => startEditing(conversation)}
								title="Edit title"
								aria-label="Edit title"
							>
								<svg
									class="!fill-none"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
								>
									<path
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
									/>
									<path
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
									/>
								</svg>
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
							<svg
								class="stroke-btn-text text-btn-text"
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
								<button
									disabled={isSharing}
									class="secondary px-4"
									onclick={() => unshareConversation(conversation)}
									aria-label="Unshare Conversation"
								>
									{#if isSharing}
										<svg
											class="!fill-none"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path
												d="M21 3v5h-5"
											/></svg
										>
									{:else}
										<svg
											class="!fill-none"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path
												d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"
											/><path
												d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"
											/><line x1="8" x2="8" y1="2" y2="5" /><line
												x1="2"
												x2="5"
												y1="8"
												y2="8"
											/><line x1="16" x2="16" y1="19" y2="22" /><line
												x1="19"
												x2="22"
												y1="16"
												y2="16"
											/></svg
										>
									{/if}
								</button>

								<button
									class="secondary px-4"
									onclick={() =>
										conversation.shareId && copyShareUrl(getShareUrl(conversation.shareId), i)}
								>
									{#if copiedShareIndex === i}
										<svg
											class="!fill-none"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
										>
									{:else}
										<svg
											class="!fill-none"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path
												d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
											/></svg
										>
									{/if}
								</button>
							{:else}
								<button
									disabled={isSharing}
									class="secondary px-4"
									onclick={() => shareConversation(conversation, i)}
								>
									{#if isSharing && isSharingIndex === i}
										<svg
											class="!fill-none"
											class:animate-spin={isSharing && isSharingIndex === i}
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
											<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path
												d="M21 3v5h-5"
											/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path
												d="M8 16H3v5"
											/></svg
										>
									{:else}
										<svg
											class="!fill-none"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
												d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
											/></svg
										>
									{/if}
								</button>
							{/if}

							<button
								aria-label="Continue Conversation"
								class="primary px-4"
								onclick={() => loadConversation(conversation)}
							>
								<svg
									class="!fill-none"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="6" x2="6" y1="4" y2="20" /><polygon points="10,4 20,12 10,20" /></svg
								>
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
								<svg
									class="!fill-none"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
								>
							{:else}
								<svg
									class="!fill-none"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path
										d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
									/></svg
								>
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
