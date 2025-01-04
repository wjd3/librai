<script lang="ts">
	import { quartInOut } from 'svelte/easing'
	import { fade } from 'svelte/transition'

	let { message, messageIndex } = $props()

	let isCopied = $state(false)
	let copiedIndex = $state(0)

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

<button
	class="w-fit self-end primary mt-1 md:mt-2 p-2"
	onclick={() => copyToClipboard(message, messageIndex)}
	aria-label="Copy to clipboard"
	in:fade={{ duration: 200, easing: quartInOut }}
>
	{#if isCopied && copiedIndex === messageIndex}
		<span class="iconify lucide--check !text-xl !w-5 !h-5"> </span>
	{:else}
		<span class="iconify lucide--copy !text-xl !w-5 !h-5"> </span>
	{/if}
</button>
