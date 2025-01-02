<script lang="ts">
	import { onMount } from 'svelte'
	import HomeChatInterface from '$components/HomeChatInterface.svelte'
	import { currentConversation, chatHistory } from '$lib/stores/index'

	onMount(() => {
		currentConversation.set(null)
		chatHistory.set([])
	})
</script>

<HomeChatInterface />
