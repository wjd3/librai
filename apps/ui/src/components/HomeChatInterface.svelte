<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify'
	import { PUBLIC_APP_TITLE, PUBLIC_CHATBOT_DESCRIPTION } from '$env/static/public'
	import { chatHistory, currentConversation } from '$lib/stores/index'
	import { authToken, isAuthenticated, isAuthLoading } from '$lib/stores/auth'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { preventDefault } from '$lib/utils'

	let promptInput: HTMLTextAreaElement | null = $state(null)
	let isDisabled = $state(true)
	let isSubmitting = $state(false)
	let userInput = $state('')
	let honeypot = $state('')

	onMount(() => {
		if (promptInput) {
			promptInput.focus()
		}
	})

	$effect(() => {
		if (!isSubmitting) {
			isDisabled = userInput.length < 1
		}
	})

	const minQueryLength = 1

	async function startConversation() {
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

		try {
			if ($isAuthenticated) {
				// Create permanent conversation in database
				const response = await fetch('/api/conversations', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${$authToken}`
					},
					body: JSON.stringify({
						messages: [{ message: query, isUser: true }]
					})
				})

				if (!response.ok) {
					throw new Error('Failed to create conversation')
				}

				const conversation = await response.json()
				await goto(`/conversations/${conversation.id}`)
			} else {
				// Create temporary conversation in memory
				const tempId = crypto.randomUUID()

				currentConversation.set({
					id: tempId,
					messages: [{ message: query, isUser: true, created: new Date().toISOString() }],
					user: '',
					title: 'New Conversation',
					created: new Date().toISOString(),
					updated: new Date().toISOString(),
					isPublic: false,
					shareId: undefined
				})
				chatHistory.set([{ message: query, isUser: true }])

				await goto(`/conversations/${tempId}`)
			}
		} catch (error) {
			console.error('Error starting conversation:', error)
			isSubmitting = false
		}
	}
</script>

<section class="min-h-[100svh] relative z-40 flex flex-col items-center justify-center">
	<div class="container flex flex-col justify-center items-center">
		<!-- Title -->
		<h1 class="mb-2 max-w-sm">
			{#if PUBLIC_APP_TITLE}
				{PUBLIC_APP_TITLE}
			{:else}
				Librai UI
			{/if}
		</h1>

		<p class="text-center text-base mb-4 max-w-[500px]">
			{PUBLIC_CHATBOT_DESCRIPTION ||
				'This is a chatbot trained on custom data. Check answers for accuracy.'}
		</p>

		<!-- Input Form -->
		<div class="max-w-lg w-full">
			<form
				class="flex flex-row items-center justify-center space-x-4 w-full h-12"
				onsubmit={preventDefault(startConversation)}
			>
				<div class="w-full h-full">
					<label for="chat-input" class="sr-only">Query the custom Librai AI chatbot.</label>
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
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								startConversation()
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
					disabled={isDisabled || $isAuthLoading}
					type="submit"
					class="primary w-16 h-full flex items-center justify-center self-end"
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
		</div>
	</div>
</section>
