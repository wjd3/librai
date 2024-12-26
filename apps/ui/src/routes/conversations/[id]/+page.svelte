<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { chatHistory, currentConversation } from '$lib/stores'
	import { authToken, isAuthLoading, isAuthenticated } from '$lib/stores/auth'
	import ChatInterface from '$lib/components/ChatInterface.svelte'

	let isLoading = $state(true)

	$effect(() => {
		;(async () => {
			if (isLoading && !$isAuthLoading) {
				if (!$isAuthenticated) {
					await goto('/')
				} else {
					try {
						const response = await fetch(`/api/conversations/${$page.params.id}`, {
							headers: {
								Authorization: `Bearer ${$authToken}`
							}
						})

						if (!response.ok) {
							// Conversation not found or user doesn't have access
							await goto('/')
							return
						}

						const conversation = await response.json()
						currentConversation.set(conversation)
						chatHistory.set(conversation.messages)
					} catch (err) {
						console.error('Error loading conversation:', err)
						await goto('/')
						return
					} finally {
						isLoading = false
					}
				}
			}
		})()
	})
</script>

{#if isLoading}
	<div class="flex justify-center items-center min-h-screen">
		<p>Loading conversation...</p>
	</div>
{:else}
	<ChatInterface />
{/if}
