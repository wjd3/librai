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
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="!fill-none"><path d="M20 6 9 17l-5-5" /></svg
		>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="!fill-none"
			><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path
				d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
			/></svg
		>
	{/if}
</button>
