<script lang="ts">
	import { marked } from 'marked'
	import DOMPurify from 'dompurify'
	import { PUBLIC_CHATBOT_THINKING_TEXT } from '$env/static/public'
	import { chatHistory, currentConversation, shouldStartChat } from '$lib/stores/index'
	import { authToken } from '$lib/stores/auth'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { quartInOut, quartOut } from 'svelte/easing'
	import { tick } from 'svelte'
	import CopyButton from './CopyButton.svelte'
	import { goto } from '$app/navigation'

	onMount(() => promptInput?.focus())

	let promptInput: HTMLTextAreaElement | null = $state(null)
	let isDisabled = $state(true)
	let isSubmitting = $state(false)
	let userInput = $state('')
	let honeypot = $state('')
	let remainingMessages = $state<number | null>(null)
	let rateLimitResetAt = $state<Date | null>(null)

	$effect(() => {
		if (isSubmitting) {
			isDisabled = true
		} else {
			isDisabled = userInput.length < 1
		}
	})

	async function sendMessage(message?: string, { skipPush }: { skipPush?: boolean } = {}) {
		isSubmitting = true

		if (honeypot) {
			isSubmitting = false
			return
		}

		const query = message || DOMPurify.sanitize(userInput || '').trim()
		if (!query || query.length < 1) {
			isSubmitting = false
			return
		}

		const conversationHistory = JSON.stringify([...$chatHistory])

		if (!skipPush) {
			chatHistory.update((history) => [...history, { message: query, isUser: true }])
		}

		userInput = ''

		await tick()
		scrollToBottom()

		try {
			const response = await fetch('/api/chatbot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$authToken}`
				},
				body: JSON.stringify({
					query,
					history: conversationHistory,
					conversationId: $currentConversation?.id
				})
			})

			if (response.status === 429) {
				const data = await response.json()
				chatHistory.update((history) => [
					...history,
					{
						message: `⚠️ ${data.error}`,
						isUser: false
					}
				])
				isSubmitting = false
				return
			}

			if (!response.ok || !response.body) {
				throw new Error('Network response was not ok')
			}

			const newConversationId = response.headers.get('X-Conversation-Id')
			if (newConversationId && !$currentConversation?.id) {
				// Redirect to the new conversation if this was a new conversation
				goto(`/conversations/${newConversationId}`)
				return
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let message = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const text = decoder.decode(value)
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

			remainingMessages = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
			rateLimitResetAt = new Date(response.headers.get('X-RateLimit-Reset') || '')
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

<section class="min-h-[100svh] relative z-40 flex flex-col items-center justify-start">
	<div class="container flex flex-col justify-center items-center">
		<!-- Chat History -->
		{#if $chatHistory.length > 0}
			<div class="chat-history" in:fade={{ duration: 400, easing: quartInOut }}>
				<div class="flex flex-col space-y-6">
					{#each $chatHistory as { message, isUser }, i}
						<div class="chat-message" class:is-user={isUser}>
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

							{#if !isUser && !(isSubmitting && $chatHistory.length - 1 === i)}
								<CopyButton {message} messageIndex={i} />
							{/if}
						</div>
					{/each}

					{#if isSubmitting && $chatHistory.length > 0 && $chatHistory[$chatHistory.length - 1].isUser}
						<div class="rounded-t-lg rounded-br-lg self-start animate-pulse">
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
			class={`${$chatHistory.length > 0 ? 'fixed bottom-0 left-0 right-0 pt-3 pb-2 md:py-3 flex flex-col space-y-2 z-40 bg-chat-bar-bg max-sm:px-2' : 'max-w-lg w-full'}`}
		>
			<form
				class="flex flex-row items-center justify-center space-x-4 w-full h-12"
				onsubmit={async (e) => {
					e.preventDefault()
					await sendMessage()
				}}
			>
				<div
					class={`w-full h-full ${$chatHistory.length > 0 ? 'max-w-[280px] sm:max-w-xs md:max-w-lg lg:max-w-xl xl:max-w-2xl' : ''}`}
				>
					<label for="chat-input" class="sr-only">Query the custom Librai AI chatbot.</label>
					<textarea
						required
						minlength={1}
						maxlength="4096"
						id="chat-input"
						placeholder="Ask a question..."
						bind:this={promptInput}
						bind:value={userInput}
						class="textarea resize-none w-full h-full"
						onkeydown={async (e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								await sendMessage()
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
					class="primary w-16 h-full flex items-center justify-center"
					class:self-end={!$chatHistory.length}
					class:animate-pulse={isSubmitting}
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

		{#if !isAtBottom && $chatHistory.length && !$shouldStartChat}
			<button
				class="fixed left-1/2 -translate-x-1/2 z-50 p-2 bg-btn-bg rounded-full shadow hover:translate-y-2 bottom-32"
				in:fade={{ duration: 200, easing: quartOut }}
				out:fade={{ duration: 200, easing: quartOut }}
				onclick={scrollToBottom}
				aria-label="Scroll to bottom"
			>
				<svg
					class="fill-btn-text stroke-btn-text w-5 h-5"
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

{#if typeof remainingMessages === 'number'}
	<p class="text-xs text-center opacity-70">
		{remainingMessages} message{remainingMessages === 1 ? '' : 's'} remaining
		{#if remainingMessages < 5}
			(resets at {rateLimitResetAt?.toLocaleTimeString()})
		{/if}
	</p>
{/if}
