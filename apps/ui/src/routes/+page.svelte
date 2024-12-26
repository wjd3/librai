<script lang="ts">
	import { onMount } from 'svelte'
	import ChatInterface from '$lib/components/ChatInterface.svelte'
	import { currentConversation } from '$lib/stores'

	onMount(() => {
		// Clear any existing conversation data when starting fresh
		currentConversation.set(null)
	})
</script>

<ChatInterface />
