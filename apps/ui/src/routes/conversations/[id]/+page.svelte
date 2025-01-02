<script lang="ts">
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import { chatHistory, currentConversation, shouldStartChat } from '$lib/stores/index'
	import { authToken, isAuthLoading, isAuthenticated } from '$lib/stores/auth'
	import ChatInterface from '$components/ChatInterface.svelte'

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
</script>

{#if isLoading}
	<div class="flex justify-center items-center min-h-[100lvh]">
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
	</div>
{:else}
	<ChatInterface />
{/if}
