<script lang="ts">
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import { currentConversation, chatHistory } from '$lib/stores/index'

	onMount(() => {
		// Clear any existing conversation data and start fresh
		currentConversation.set(null)
		chatHistory.set([])
	})
</script>

<div class="flex flex-col items-center justify-center min-h-svh space-y-4">
	<h1 class="text-3xl font-bold">
		{page.status}:
		{page.error?.message}
	</h1>
	<a class="primary" href="/">Return Home</a>
</div>
