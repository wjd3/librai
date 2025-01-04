<script lang="ts">
	import { onMount } from 'svelte'
	import HomeChatInterface from '$components/HomeChatInterface.svelte'
	import { currentConversation, chatHistory } from '$lib/stores/index'
	import { parseMarkdownToHtml } from '$lib/parse'

	onMount(() => {
		currentConversation.set(null)
		chatHistory.set([])
	})
</script>

{@html parseMarkdownToHtml(
	'$$\\text{Slope Ratio} = \\frac{\text{Vertical Drop}}{\text{Horizontal Distance}}$$'
)}

<HomeChatInterface />
