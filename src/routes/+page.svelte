<script lang="ts">
	import { marked } from 'marked'
	import { writable } from 'svelte/store'
	import DOMPurify from 'dompurify'
	import { PUBLIC_APP_TITLE } from '$env/static/public'

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
	const chatHistory = writable<{ message: string; isUser: boolean }[]>([])

	// Function to send query and get response
	async function sendMessage() {
		isSubmitting = true

		const query = $userInput.trim()
		if (!query) {
			return
		}

		// Add user message to chat history
		chatHistory.update((history) => [...history, { message: query, isUser: true }])
		userInput.set('')

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

		isSubmitting = false
		isDisabled = false
	}
</script>

<section class="min-h-[100dvh] flex flex-col justify-center items-center">
	<div class="container flex flex-col justify-center items-center relative">
		<h1 class="mb-4">
			{#if PUBLIC_APP_TITLE}
				{PUBLIC_APP_TITLE}
			{:else}
				Librai UI
			{/if}
		</h1>
		<form class="w-full max-w-lg flex flex-col gap-4" onsubmit={sendMessage}>
			<div>
				<label for="chat-input" class="sr-only"> Query the custom Librai AI chatbot. </label>
				<input
					required
					minlength="8"
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
			<div class="chat-history w-[600px] absolute top-56 pb-8">
				<!-- Chat display -->
				<div class="flex flex-col space-y-6">
					{#each $chatHistory as { message, isUser }}
						<div class={`chat-message ${isUser ? 'is-user' : ''}`}>
							<p>
								{#if isUser}
									{message}
								{:else if typeof window != 'undefined'}
									{@html marked.parse(DOMPurify.sanitize(message))}
								{/if}
							</p>

							{#if !isUser}
								<button
									class="w-fit self-end secondary mt-2"
									onclick={() => navigator.clipboard.writeText(message)}
									aria-label="Copy to clipboard"
								>
									Copy
								</button>
							{/if}
						</div>
					{/each}

					{#if isSubmitting}
						<svg
							class="w-8 h-8 rounded-t-lg rounded-br-lg self-start bg-pampas-100 dark:bg-fuscous-gray-500 animate-pulse"
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 256 256"
							><path
								d="M144 128a16 16 0 1 1-16-16a16 16 0 0 1 16 16m-84-16a16 16 0 1 0 16 16a16 16 0 0 0-16-16m136 0a16 16 0 1 0 16 16a16 16 0 0 0-16-16"
							/>
						</svg>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.chat-history {
		animation: fadeIn 0.5s ease-in-out forwards;
		opacity: 0;
	}

	@keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>
