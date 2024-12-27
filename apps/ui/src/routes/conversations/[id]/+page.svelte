<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { chatHistory, currentConversation, shouldStartChat } from '$lib/stores/index'
	import { authToken, isAuthLoading, isAuthenticated } from '$lib/stores/auth'
	import ChatInterface from '$lib/components/ChatInterface.svelte'

	let isLoading = $state(true)

	$effect(() => {
		;(async () => {
			if (isLoading && !$isAuthLoading) {
				if (!$isAuthenticated) {
					// For non-logged in users, check if we have a temporary conversation
					const tempConversation = $currentConversation
					if (tempConversation && tempConversation.id === $page.params.id) {
						isLoading = false
						shouldStartChat.set(true)
						return
					}
					await goto('/')
				} else {
					try {
						const response = await fetch(`/api/conversations/${$page.params.id}`, {
							headers: {
								Authorization: `Bearer ${$authToken}`
							}
						})

						if (!response.ok) {
							await goto('/')
							return
						}

						const conversation = await response.json()
						currentConversation.set(conversation)
						chatHistory.set(conversation.messages || [])
						isLoading = false

						// Trigger initial chat response if this is a new conversation
						if (conversation.messages?.length === 1 && conversation.messages[0].isUser) {
							shouldStartChat.set(true)
						}
					} catch (err) {
						console.error('Error loading conversation:', err)
						await goto('/')
						return
					}
				}
			}
		})()
	})
</script>

{#if isLoading}
	<div class="flex justify-center items-center min-h-[100lvh]">
		<p>Loading conversation...</p>
	</div>
{:else}
	<ChatInterface />
{/if}
