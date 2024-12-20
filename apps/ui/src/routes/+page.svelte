<script lang="ts">
	import { marked } from 'marked'
	import DOMPurify from 'dompurify'
	import { PUBLIC_APP_TITLE, PUBLIC_CHATBOT_DESCRIPTION } from '$env/static/public'
	import {
		chatHistory,
		currentConversation,
		currentUser,
		isAuthenticated,
		pendingConversation
	} from '$lib/stores'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { cubicInOut, cubicOut } from 'svelte/easing'
	import { tick } from 'svelte'
	import { pb } from '$lib/clients/pocketbase'
	import CopyButton from '$lib/components/CopyButton.svelte'
	import type { Conversation } from '$lib/server/services/pocketbaseService'

	let promptInput: HTMLTextAreaElement | null = $state(null)
	onMount(() => {
		if (promptInput) {
			promptInput.focus()
		}
	})

	let isDisabled = $state(true)
	let isSubmitting = $state(false)

	$effect(() => {
		if (isSubmitting) {
			isDisabled = true
		}
	})

	let userInput = $state('')
	$effect(() => {
		if (!isSubmitting) {
			isDisabled = userInput.length < 1
		}
	})

	const minQueryLength = 1

	let honeypot = $state('')

	let conversationId = $state<string | null>(null)

	// Function to send query and get response
	async function sendMessage() {
		isSubmitting = true

		if (honeypot) {
			isSubmitting = false
			return
		}

		const query = DOMPurify.sanitize(userInput || '').trim()
		if (!query || query.length < minQueryLength) {
			isSubmitting = false
			return
		}

		// Prepare the conversation history for the API request
		const conversationHistory = JSON.stringify([...$chatHistory])

		// Add user message to chat history and scroll
		chatHistory.update((history) => [...history, { message: query, isUser: true }])
		userInput = ''

		// Wait for DOM update and scroll
		await tick()
		scrollToBottom()

		// Send query to chatbot API
		try {
			const response = await fetch('/api/chatbot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${pb.authStore.token}`
				},
				body: JSON.stringify({
					query,
					history: conversationHistory,
					conversationId: $currentConversation?.id
				})
			})

			if (!response.ok || !response.body) {
				throw new Error('Network response was not ok')
			}

			const newConversationId = response.headers.get('X-Conversation-Id')

			if (newConversationId && $isAuthenticated && $currentUser) {
				conversationId = newConversationId

				if (!$currentConversation) {
					try {
						const conversation = await pb
							.collection<Conversation>('conversations')
							.getOne(newConversationId)
						currentConversation.set(conversation)
					} catch (error) {
						console.error('Error loading conversation:', error)
					}
				}
			} else if (!$isAuthenticated && $chatHistory.length > 0) {
				pendingConversation.set(true)
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()

			let message = ''
			let messageAdded = false

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const text = decoder.decode(value)
				message += text

				// Update UI with partial message
				if (!messageAdded) {
					messageAdded = true
					chatHistory.update((history) => [...history, { message, isUser: false }])
				} else {
					chatHistory.update((history) => {
						history[history.length - 1].message += text
						return history
					})
				}
			}
		} catch (error) {
			console.error('Error:', error)
			chatHistory.update((history) => [
				...history,
				{ message: 'Error fetching response', isUser: false }
			])
		}

		isSubmitting = false
		isDisabled = false
	}

	// Load conversation if user is authenticated
	$effect(() => {
		;(async () => {
			if ($isAuthenticated && $currentUser && conversationId) {
				// Load conversation from PocketBase
				try {
					const conversation = await pb
						.collection<Conversation>('conversations')
						.getOne(conversationId)
					currentConversation.set(conversation)
					chatHistory.set(conversation.messages)
				} catch (error) {
					console.error('Error loading conversation:', error)
				}
			}
		})()
	})

	// Scroll to bottom button logic
	let isAtBottom = $state(false)
	function scrollToBottom() {
		window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
	}
	function checkScroll() {
		isAtBottom = document.body.scrollHeight - window.scrollY <= window.innerHeight
	}

	// Add event listener to check scroll position
	onMount(() => {
		window.addEventListener('scroll', checkScroll)
		checkScroll() // Check scroll position on mount
		return () => {
			window.removeEventListener('scroll', checkScroll)
		}
	})
</script>

<section
	class={`min-h-[100svh] relative z-40 flex flex-col items-center ${$chatHistory.length > 0 ? 'justify-start' : 'justify-center'}`}
>
	<div class="container flex flex-col justify-center items-center">
		<!-- Title -->
		{#if $chatHistory.length === 0}
			<h1 class="mb-2 max-w-sm">
				{#if PUBLIC_APP_TITLE}
					{PUBLIC_APP_TITLE}
				{:else}
					Librai UI
				{/if}
			</h1>

			<p class="text-center text-sm mb-4 max-w-xs sm:max-w-[500px]">
				{PUBLIC_CHATBOT_DESCRIPTION ||
					'This is a chatbot trained on custom data. Check answers for accuracy.'}
			</p>
		{/if}

		<!-- Form -->
		<div
			class={`${$chatHistory.length > 0 ? 'fixed bottom-0 left-0 right-0 pt-3 pb-2 md:py-3 flex flex-col space-y-2 z-40 bg-chat-bar-bg max-sm:px-2' : 'max-w-lg w-full'}`}
		>
			<form
				class="flex flex-row items-center justify-center space-x-4 w-full h-12"
				onsubmit={sendMessage}
			>
				<div
					class={`w-full h-full ${$chatHistory.length > 0 ? 'max-w-[280px] sm:max-w-xs md:max-w-lg lg:max-w-xl xl:max-w-2xl' : ''}`}
				>
					<label for="chat-input" class="sr-only"> Query the custom Librai AI chatbot. </label>
					<textarea
						required
						minlength={minQueryLength}
						maxlength="4096"
						id="chat-input"
						placeholder="Ask a question..."
						bind:this={promptInput}
						bind:value={userInput}
						class="textarea resize-none w-full h-full"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								if (e.shiftKey) {
									return
								}

								e.preventDefault()
								sendMessage()
							}
						}}
					></textarea>
				</div>

				<div class="sr-only">
					<label for="email_2">Leave this field blank:</label>
					<input
						bind:value={honeypot}
						type="text"
						id="email_2"
						name="email_2"
						maxlength="4096"
						autocomplete="off"
						tabindex="-1"
					/>
				</div>

				<button
					disabled={isDisabled}
					type="submit"
					class={`primary w-16 h-full flex items-center justify-center ${$chatHistory.length > 0 ? '' : 'self-end'} ${isSubmitting ? 'animate-pulse' : ''}`}
				>
					{#if isSubmitting}
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
							<path
								d="M144 128a16 16 0 1 1-16-16a16 16 0 0 1 16 16m-84-16a16 16 0 1 0 16 16a16 16 0 0 0-16-16m136 0a16 16 0 1 0 16 16a16 16 0 0 0-16-16"
							/>
						</svg>
					{:else}
						Ask
					{/if}
				</button>
			</form>

			{#if $chatHistory.length > 0}
				<p class="text-xs text-center select-none opacity-70">Check answers for accuracy.</p>
			{/if}
		</div>

		{#if $chatHistory.length > 0}
			<div class="chat-history" in:fade={{ duration: 500, easing: cubicInOut }}>
				<!-- Chat display -->
				<div class="flex flex-col space-y-6">
					{#each $chatHistory as { message, isUser }, i}
						<div class={`chat-message ${isUser ? 'is-user' : ''}`}>
							{#if isUser}
								<h2 class="sr-only">You said:</h2>
							{:else}
								<h2 class="sr-only">The AI chatbot said:</h2>
							{/if}

							{#if isUser}
								<p>{DOMPurify.sanitize(message)}</p>
							{:else if typeof window != 'undefined'}
								{@html marked.parse(DOMPurify.sanitize(message))}
							{/if}

							<!-- Show copy to clipboard button if it's not a user message and the message isn't still being printed -->
							{#if !isUser && !(isSubmitting && $chatHistory.length - 1 === i)}
								<CopyButton {message} messageIndex={i} />
							{/if}
						</div>
					{/each}

					<!-- Waiting for chatbot response from server -->
					{#if isSubmitting && $chatHistory.length > 0 && $chatHistory[$chatHistory.length - 1].isUser}
						<div class="rounded-t-lg rounded-br-lg self-start animate-pulse">
							<span class="opacity-80 text-text-color text-base">Thinking...</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if !isAtBottom && $chatHistory.length > 0}
			<button
				class={`fixed left-1/2 -translate-x-1/2 z-50 p-2 bg-btn-bg rounded-full shadow hover:translate-y-2 ${!$isAuthenticated && $chatHistory.length > 0 ? 'bottom-40' : 'bottom-32'}`}
				in:fade={{ duration: 250, easing: cubicOut }}
				out:fade={{ duration: 250, easing: cubicOut }}
				onclick={scrollToBottom}
				aria-label="Scroll to bottom"
			>
				<svg
					class="fill-text-color stroke-text-color w-5 h-5"
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 24 24"
				>
					<path
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M12 4.5v15m0 0l-6-5.625m6 5.625l6-5.625"
					/>
				</svg>
			</button>
		{/if}
	</div>
</section>

{#if !$isAuthenticated && $chatHistory.length > 0}
	<div
		class="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-chat-bar-bg px-4 py-2 rounded-lg shadow text-sm"
		transition:fade={{ duration: 250, easing: cubicInOut }}
	>
		<span class="cursor-default select-none">Login to save your conversations.</span>
	</div>
{/if}
