<script lang="ts">
	import { marked } from 'marked'
	import { writable } from 'svelte/store'
	import DOMPurify from 'dompurify'
	import { PUBLIC_APP_TITLE } from '$env/static/public'
	import { chatHistory } from '$lib/stores'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { cubicInOut, cubicOut } from 'svelte/easing'
	import { tick } from 'svelte'

	let isDisabled = $state(true)
	let isSubmitting = $state(false)

	$effect(() => {
		if (isSubmitting) {
			isDisabled = true
		}
	})

	const userInput = writable('')
	userInput.subscribe((value) => {
		if (!isSubmitting) {
			isDisabled = value.length < 1
		}
	})

	const minQueryLength = 8

	// Function to send query and get response
	async function sendMessage() {
		isSubmitting = true

		const query = DOMPurify.sanitize($userInput || '').trim()
		if (!query || query.length < minQueryLength) {
			return
		}

		// Add user message to chat history and scroll
		chatHistory.update((history) => [...history, { message: query, isUser: true }])
		userInput.set('')

		// Wait for DOM update and scroll
		await tick()
		scrollToBottom()

		// Send query to chatbot API
		try {
			const res = await fetch('/api/chatbot', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query })
			})
			const data = await res.json()

			if (data.response) {
				// Add bot response to chat history
				chatHistory.update((history) => [...history, { message: data.response, isUser: false }])
			}
		} catch (error) {
			console.error('Error fetching response:', error)
			chatHistory.update((history) => [
				...history,
				{ message: 'Error fetching response', isUser: false }
			])
		}

		// Wait for DOM update and scroll
		await tick()
		scrollToBottom()

		isSubmitting = false
		isDisabled = false
	}

	// Scroll to bottom button logic
	let isAtBottom = $state(false)
	$effect(() => {
		console.log('isAtBottom', isAtBottom)
	})

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

	// Copy to clipboard logic
	let copiedIndex = $state(0)
	let isCopied = $state(false)
	let copyTimeout: NodeJS.Timeout
	const copyToClipboard = (text: string, index: number) => {
		clearTimeout(copyTimeout)

		navigator.clipboard.writeText(text)

		copiedIndex = index

		isCopied = true
		copyTimeout = setTimeout(() => {
			isCopied = false
		}, 3250)
	}
</script>

<section class="min-h-[100dvh] relative z-40 flex flex-col justify-center items-center">
	<div class="container flex flex-col justify-center items-center">
		<!-- Title -->
		{#if $chatHistory.length === 0}
			<h1 class="mb-4">
				{#if PUBLIC_APP_TITLE}
					{PUBLIC_APP_TITLE}
				{:else}
					Librai UI
				{/if}
			</h1>
		{/if}

		<!-- Form -->
		<form
			class={`${$chatHistory.length > 0 ? 'fixed bottom-0 left-0 right-0 py-4 flex flex-row items-center justify-center space-x-4 z-40 bg-chat-bar-bg' : 'max-w-lg w-full flex flex-col space-y-4'}`}
			onsubmit={sendMessage}
		>
			<div
				class={`${$chatHistory.length > 0 ? 'max-w-[280px] sm:max-w-xs md:max-w-lg lg:max-w-xl xl:max-w-2xl w-full' : ''}`}
			>
				<label for="chat-input" class="sr-only"> Query the custom Librai AI chatbot. </label>
				<input
					required
					minlength={minQueryLength}
					maxlength="200"
					id="chat-input"
					type="text"
					placeholder="Ask a question..."
					bind:value={$userInput}
					onkeydown={(e) => e.key === 'Enter' && sendMessage()}
				/>
			</div>

			<button
				disabled={isDisabled}
				type="submit"
				class={`primary self-end w-16 h-11 flex items-center justify-center ${isSubmitting ? 'animate-pulse' : ''}`}
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
			<div
				class="chat-history w-80 md:w-96 lg:w-[600px]"
				in:fade={{ duration: 500, easing: cubicInOut }}
			>
				<!-- Chat display -->
				<div class="flex flex-col space-y-6">
					{#each $chatHistory as { message, isUser }, i}
						<div class={`chat-message ${isUser ? 'is-user' : ''}`}>
							{#if isUser}
								<p>{DOMPurify.sanitize(message)}</p>
							{:else if typeof window != 'undefined'}
								{@html marked.parse(DOMPurify.sanitize(message))}
							{/if}

							{#if !isUser}
								<button
									class="w-fit self-end secondary mt-2 p-2"
									onclick={() => copyToClipboard(message, i)}
									aria-label="Copy to clipboard"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="1em"
										height="1em"
										viewBox="0 0 24 24"
										class="fill-text-color stroke-text-color w-5 h-5"
									>
										{#if isCopied && copiedIndex === i}
											<path
												d="M18.577 6.183a1 1 0 0 1 .24 1.394l-5.666 8.02c-.36.508-.665.94-.94 1.269c-.287.34-.61.658-1.038.86a2.83 2.83 0 0 1-2.03.153c-.456-.137-.82-.406-1.149-.702c-.315-.285-.672-.668-1.09-1.116l-1.635-1.753a1 1 0 1 1 1.462-1.364l1.606 1.722c.455.487.754.806.998 1.027c.24.216.344.259.385.271c.196.06.405.045.598-.046c.046-.022.149-.085.36-.338c.216-.257.473-.62.863-1.171l5.642-7.986a1 1 0 0 1 1.394-.24"
											/>
										{:else}
											<g
												fill="none"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="1.5"
											>
												<path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2H9z" />
												<path
													d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
												/>
											</g>
										{/if}
									</svg>
								</button>
							{/if}
						</div>
					{/each}

					<!-- Thinking... -->
					{#if isSubmitting}
						<div class="rounded-t-lg rounded-br-lg self-start animate-pulse">
							<span class="opacity-80 text-text-color">Thinking...</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if !isAtBottom && $chatHistory.length > 0}
			<button
				class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 p-2 bg-btn-bg rounded-full shadow hover:translate-y-2"
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
