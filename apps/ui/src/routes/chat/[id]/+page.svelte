<script lang="ts">
	import { page } from '$app/state'
	import { beforeNavigate, goto } from '$app/navigation'
	import { chatHistory, currentConversation, shouldStartChat } from '$lib/stores/index'
	import { authToken, isAuthLoading, isAuthenticated } from '$lib/stores/auth'
	import Chat from '$components/Chat.svelte'

	type Message = {
		content: string
		isUser: boolean
		created: string
	}

	let isLoading = $state(true)

	$effect(() => {
		;(async () => {
			if (isLoading && !$isAuthLoading) {
				if (!$isAuthenticated) {
					// For non-logged in users, check if we have a temporary conversation
					const tempConversation = $currentConversation
					if (tempConversation && tempConversation.id === page.params.id) {
						isLoading = false
						shouldStartChat.set(true)
						return
					}
					await goto('/')
				} else {
					try {
						const response = await fetch(`/api/conversations/${page.params.id}`, {
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
						const messages =
							conversation.messages?.map((message: Message) =>
								message.created ? message : { ...message, created: conversation.created }
							) || []
						chatHistory.set(messages)
						isLoading = false

						// Only trigger chat if there are no AI responses yet
						if (
							messages.length === 1 &&
							messages[0].isUser &&
							!messages.some((message: Message) => !message.isUser)
						) {
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

	// Add cleanup when navigating away
	beforeNavigate(() => {
		currentConversation.set(null)
		chatHistory.set([])
		shouldStartChat.set(false)
	})
</script>

{#if isLoading}
	<div
		class="flex justify-center items-center min-h-svh bg-gradient-to-t from-page-bg to-primary-card-bg transition-colors duration-200"
	>
		<div class="relative">
			<div class="absolute inset-0 animate-ping rounded-full bg-btn-bg opacity-25 w-12 h-12"></div>
			<div class="relative rounded-full bg-btn-bg w-12 h-12 animate-pulse"></div>
			<span class="absolute inset-0 flex items-center justify-center">
				<span class="iconify lucide--loader animate-spin w-6 h-6 text-btn-text"></span>
			</span>
		</div>
	</div>
{:else}
	<Chat />
{/if}
