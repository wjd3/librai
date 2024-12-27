<script lang="ts">
	import { onMount } from 'svelte'
	import HomeChatInterface from '$lib/components/HomeChatInterface.svelte'
	import { currentConversation, chatHistory } from '$lib/stores'

	onMount(() => {
		// Clear any existing conversation data when starting fresh
		currentConversation.set(null)
		chatHistory.set([])
	})
</script>

<HomeChatInterface />
