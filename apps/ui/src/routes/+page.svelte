<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify'
	import {
		PUBLIC_APP_TITLE,
		PUBLIC_CHATBOT_DESCRIPTION,
		PUBLIC_PROMPT_SUGGESTIONS,
		PUBLIC_PROMPT_SUGGESTION_ICONS
	} from '$env/static/public'
	import { chatHistory, currentConversation, shouldStartChat } from '$lib/stores/index'
	import { authToken, isAuthenticated, isAuthLoading } from '$lib/stores/auth'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { preventDefault } from '$lib/utils'
	import { trackCustomEvent } from '$lib/utils/trackCustomEvent'
	// import { censorText } from '$lib/utils/censor'

	let promptInput: HTMLTextAreaElement | null = $state(null)
	let isDisabled = $state(true)
	let isSubmitting = $state(false)
	let userInput = $state('')
	let honeypot = $state('')
	let promptSuggestions = $state(
		PUBLIC_PROMPT_SUGGESTIONS ? PUBLIC_PROMPT_SUGGESTIONS.split(', ') : []
	)
	let promptSuggestionIcons = $state(
		PUBLIC_PROMPT_SUGGESTION_ICONS ? PUBLIC_PROMPT_SUGGESTION_ICONS.split(', ') : []
	)

	const MIN_TEXTAREA_HEIGHT = 48
	const MAX_TEXTAREA_HEIGHT = 128
	function autoResizeTextarea(textarea: HTMLTextAreaElement) {
		if (!textarea) return

		// Set initial height to MIN_TEXTAREA_HEIGHT if no content
		if (!textarea.value.trim()) {
			textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`
			return
		}

		// Reset height to allow shrinking
		textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`

		// Calculate the scroll height
		const scrollHeight = textarea.scrollHeight

		// Only increase height if content exceeds the single line height
		if (scrollHeight > MIN_TEXTAREA_HEIGHT) {
			const newHeight = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)
			textarea.style.height = `${newHeight}px`
		}
	}

	onMount(() => {
		currentConversation.set(null)
		chatHistory.set([])
		shouldStartChat.set(false)

		if (promptInput) {
			promptInput.focus()
		}
	})

	$effect(() => {
		if (!isSubmitting) {
			isDisabled = userInput.length < 1
		}
	})

	$effect(() => {
		if (promptInput) {
			autoResizeTextarea(promptInput)
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

		// Censor the query before processing
		// const censoredQuery = censorText(query)

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
						messages: [{ message: query, isUser: true, created: new Date().toISOString() }]
					})
				})
				if (!response.ok) {
					throw new Error('Failed to create conversation')
				}
				const conversation = await response.json()

				await trackCustomEvent('authenticated_chat')

				await goto(`/chat/${conversation.id}`)
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
				chatHistory.set([{ message: query, isUser: true, created: new Date().toISOString() }])

				await trackCustomEvent('unauthenticated_chat')

				await goto(`/chat/${tempId}`)
			}
		} catch (error) {
			console.error('Error starting conversation:', error)
			isSubmitting = false
		}
	}
</script>

<section
	class="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-page-bg to-primary-card-bg pt-24 pb-8 md:py-16 px-4"
>
	<div class="container flex flex-col justify-center items-center px-4 md:px-8 max-w-4xl mx-auto">
		<!-- Title -->
		<div class="mb-4 md:mb-8">
			<h1
				class="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-btn-bg to-btn-hover-bg"
			>
				{#if PUBLIC_APP_TITLE}
					{PUBLIC_APP_TITLE}
				{:else}
					Librai UI
				{/if}
			</h1>

			<p class="text-center text-base md:text-lg max-w-[600px] leading-relaxed opacity-90">
				{PUBLIC_CHATBOT_DESCRIPTION ||
					'This is a chatbot trained on custom data. Check answers for accuracy.'}
			</p>
		</div>

		<!-- Input Form -->
		<div
			class="w-full max-w-2xl backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-form-border"
		>
			<form class="w-full" onsubmit={preventDefault(startConversation)}>
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

				<div class="flex flex-col sm:flex-row items-stretch justify-center gap-4">
					<div class="flex-grow flex">
						<label for="chat-input" class="sr-only">Query the chatbot.</label>
						<textarea
							required
							minlength={minQueryLength}
							autocomplete="off"
							maxlength="4096"
							id="chat-input"
							placeholder="Ask a question..."
							bind:this={promptInput}
							bind:value={userInput}
							class="input w-full min-h-12 h-12 resize-none transition duration-200 focus:shadow-lg cursor-text overflow-y-auto"
							style="max-height: {MAX_TEXTAREA_HEIGHT}px"
							oninput={(e) => autoResizeTextarea(e.currentTarget)}
							onkeydown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey && !isDisabled && !$isAuthLoading) {
									e.preventDefault()
									startConversation()
								}
							}}
						></textarea>
					</div>

					<button
						disabled={isDisabled || $isAuthLoading}
						type="submit"
						class="primary h-12 w-full sm:w-16 flex items-center justify-center hover:scale-105 active:scale-95 disabled:active:scale-100 disabled:hover:scale-100 transition duration-200"
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
		</div>

		{#if promptSuggestions.length > 0}
			<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
				{#each promptSuggestions as suggestion, index}
					<button
						onclick={() => {
							userInput = suggestion
							if (promptInput) {
								promptInput.focus()
							}
						}}
						class="text-left px-4 py-3 rounded-xl border border-secondary-card-bg bg-primary-card-bg hover:bg-primary-card-bg hover:border-form-border transition duration-300 shadow-md flex items-center gap-2"
					>
						{#if promptSuggestionIcons[index]}
							<span class={`iconify ${promptSuggestionIcons[index]} w-6 h-6 shrink-0`}></span>
						{/if}
						<span class="text-base opacity-90">{suggestion}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>
