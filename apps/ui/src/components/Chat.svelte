<script lang="ts">
	import { parseMarkdownToHtml } from '$lib/utils/parse'
	import DOMPurify from 'isomorphic-dompurify'
	import { PUBLIC_CHATBOT_THINKING_TEXT } from '$env/static/public'
	import { chatHistory, currentConversation, shouldStartChat } from '$lib/stores/index'
	import { authToken } from '$lib/stores/auth'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { quartInOut, quartOut } from 'svelte/easing'
	import { tick } from 'svelte'
	import CopyButton from './CopyButton.svelte'
	import { goto, beforeNavigate } from '$app/navigation'
	import { currentUser, isAuthLoading } from '$lib/stores'
	// import { censorText } from '$lib/utils/censor'

	onMount(() => promptInput?.focus())

	let promptInput: HTMLTextAreaElement | null = $state(null)
	let isDisabled = $state(true)
	let isSubmitting = $state(false)
	let userInput = $state('')
	let honeypot = $state('')
	let remainingMessages = $state<number | null>(null)
	let rateLimitResetAt = $state<Date | null>(null)
	let activeController: AbortController | null = $state(null)

	$effect(() => {
		if (isSubmitting) {
			isDisabled = true
		} else {
			isDisabled = userInput.length < 1
		}
	})

	beforeNavigate(() => {
		if (activeController) {
			if (!activeController.signal.aborted) {
				activeController.abort()
			}
			activeController = null
		}
	})

	async function sendMessage(message?: string, { skipPush }: { skipPush?: boolean } = {}) {
		isSubmitting = true

		if (honeypot) {
			isSubmitting = false
			return
		}

		const query = message || DOMPurify.sanitize(userInput || '').trim()
		if (!query) {
			isSubmitting = false
			return
		}

		// const censoredQuery = censorText(query)

		const conversationHistory = JSON.stringify(
			[...$chatHistory].map((msg) => ({
				...msg,
				created: msg.created || new Date().toISOString()
			}))
		)

		if (!skipPush) {
			chatHistory.update((history) => [
				...history,
				{
					message: query,
					isUser: true,
					created: new Date().toISOString()
				}
			])
		}

		userInput = ''

		await tick()
		scrollToBottom()

		try {
			// Create new AbortController for this request
			activeController = new AbortController()

			const response = await fetch('/api/chatbot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...($authToken ? { Authorization: `Bearer ${$authToken}` } : {})
				},
				body: JSON.stringify({
					query,
					history: conversationHistory,
					conversationId: $currentConversation?.id,
					name: $currentUser?.name
				}),
				// Add signal to the request
				signal: activeController.signal
			})

			if (!response.ok) {
				const errorData = await response.text()
				throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`)
			}
			if (!response.body) {
				throw new Error('Response body is null')
			}

			const newConversationId = response.headers.get('X-Conversation-Id')
			if (newConversationId && !$currentConversation?.id) {
				// Redirect to the new conversation if this was a new conversation
				goto(`/chat/${newConversationId}`)
				return
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let message = ''
			let hasReceivedContent = false

			while (true) {
				const { done, value } = await reader.read()

				if (done) {
					if (!hasReceivedContent) {
						throw new Error('Stream completed without content')
					}
					break
				}

				const text = decoder.decode(value)
				if (text) {
					hasReceivedContent = true
					message += text

					chatHistory.update((history) => {
						const lastMessage = history[history.length - 1]
						if (!lastMessage || lastMessage.isUser) {
							return [...history, { message, isUser: false }]
						} else {
							return history.map((msg, i) => (i === history.length - 1 ? { ...msg, message } : msg))
						}
					})
				}
			}

			const remainingMessagesHeader = response.headers.get('X-RateLimit-Remaining')
			const rateLimitResetHeader = response.headers.get('X-RateLimit-Reset')
			remainingMessages = remainingMessagesHeader ? parseInt(remainingMessagesHeader) : null
			rateLimitResetAt = rateLimitResetHeader ? new Date(rateLimitResetHeader) : null
		} catch (error) {
			// Check if this was an abort error
			if ((error as Error).name === 'AbortError') {
				console.log('Request was aborted')
				return
			}

			console.error('Error:', error)
			chatHistory.update((history) => [
				...history,
				{
					message: `Error: ${(error as Error).message || 'An unexpected error occurred'}`,
					isUser: false
				}
			])
		} finally {
			// Clear the active controller
			activeController = null
			isSubmitting = false
			isDisabled = false
		}
	}

	let isAtBottom = $state(false)
	function scrollToBottom() {
		window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
	}
	function checkScroll() {
		isAtBottom = document.body.scrollHeight - window.scrollY <= window.innerHeight
	}

	$effect(() => {
		if ($shouldStartChat && !isSubmitting) {
			;(async () => {
				shouldStartChat.set(false)

				const lastMessage = $chatHistory[$chatHistory.length - 1]
				if (lastMessage?.isUser && !$chatHistory.some((m) => !m.isUser)) {
					await sendMessage(lastMessage.message, { skipPush: true })
				}
			})()
		}
	})

	onMount(() => {
		checkScroll()

		window.addEventListener('scroll', checkScroll)
		return () => window.removeEventListener('scroll', checkScroll)
	})
</script>

<section
	class="min-h-[100svh] relative z-40 flex flex-col items-center justify-start bg-gradient-to-b from-page-bg to-primary-card-bg"
>
	<div class="container flex flex-col justify-center items-center px-2 md:px-8 max-w-4xl mx-auto">
		<!-- Chat History -->
		{#if $chatHistory.length > 0}
			<div class="chat-history w-full" in:fade={{ duration: 400, easing: quartInOut }}>
				<div class="flex flex-col space-y-6 mb-4">
					{#each $chatHistory as { message, isUser }, i}
						<div
							class="chat-message p-6 rounded-2xl shadow-lg border border-form-border transition duration-200"
							class:is-user={isUser}
						>
							{#if isUser}
								<h2 class="sr-only">You said:</h2>
							{:else}
								<h2 class="sr-only">The AI chatbot said:</h2>
							{/if}

							{#if isUser}
								<p class="text-lg leading-relaxed">{DOMPurify.sanitize(message)}</p>
							{:else}
								<div class="prose prose-lg max-w-none">
									{@html parseMarkdownToHtml(message)}
								</div>
							{/if}

							{#if !isUser && !(isSubmitting && $chatHistory.length - 1 === i)}
								<div class="mt-2">
									<CopyButton {message} messageIndex={i} />
								</div>
							{/if}
						</div>
					{/each}

					{#if isSubmitting && $chatHistory.length > 0 && $chatHistory[$chatHistory.length - 1].isUser}
						<div
							class="p-4 rounded-2xl shadow-lg border border-form-border self-start animate-pulse"
						>
							<span class="opacity-80 text-text-color text-base">
								{PUBLIC_CHATBOT_THINKING_TEXT || 'Thinking...'}
							</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Input Form -->
		<div
			class={`${$chatHistory.length > 0 ? 'fixed bottom-0 left-0 right-0 py-4 md:py-6 flex flex-col space-y-2 z-40 border-t border-form-border backdrop-blur' : 'max-w-2xl w-full'}`}
			style="background-color: color-mix(in srgb, var(--chat-bar-bg) 80%, transparent);"
		>
			<form
				class="mx-auto w-full max-w-2xl"
				onsubmit={async (e) => {
					e.preventDefault()
					await sendMessage()
				}}
			>
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

				<div class="flex flex-row items-start justify-center gap-4 px-4">
					<div class="flex-grow flex">
						<textarea
							required
							minlength={1}
							maxlength="4096"
							id="chat-input"
							placeholder="Ask a question..."
							bind:this={promptInput}
							bind:value={userInput}
							class="input w-full resize-y min-h-12 max-h-24 h-12 transition duration-200 focus:shadow-lg"
							onkeydown={async (e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									await sendMessage()
								}
							}}
						></textarea>
					</div>

					<button
						disabled={isDisabled || $isAuthLoading}
						type="submit"
						class="primary h-12 md:w-16 flex items-center justify-center hover:scale-105 active:scale-95 disabled:active:scale-100 disabled:hover:scale-100 transition duration-200"
						class:animate-pulse={isSubmitting}
						class:opacity-70={isDisabled || $isAuthLoading}
					>
						{#if isSubmitting}
							<span class="iconify lucide--ellipsis w-6 h-6"> </span>
						{:else}
							<span class="iconify lucide--arrow-up w-6 h-6"> </span>
						{/if}
					</button>
				</div>
			</form>

			{#if $chatHistory.length > 0}
				<p class="text-sm text-center opacity-70">
					Check answers for accuracy. {#if remainingMessages && remainingMessages <= 0}
						No messages remaining
						{#if rateLimitResetAt}
							until {new Date(rateLimitResetAt).toLocaleTimeString()}.
						{:else}
							until later.
						{/if}
					{/if}
				</p>
			{/if}
		</div>

		{#if !isAtBottom && $chatHistory.length && !$shouldStartChat && !isSubmitting}
			<button
				class="fixed left-1/2 -translate-x-1/2 z-50 p-2 bg-btn-bg rounded-full shadow-lg hover:shadow-xl hover:translate-y-2 bottom-40 transition-all duration-300 group"
				in:fade={{ duration: 300, easing: quartOut }}
				out:fade={{ duration: 300, easing: quartOut }}
				onclick={scrollToBottom}
				aria-label="Scroll to bottom"
			>
				<span class="text-btn-text iconify lucide--arrow-down w-4 h-4"> </span>
			</button>
		{/if}
	</div>
</section>
