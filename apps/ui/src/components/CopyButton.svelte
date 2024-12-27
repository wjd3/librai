<script lang="ts">
	import { cubicInOut } from 'svelte/easing'
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
	class="w-fit self-end secondary mt-1 md:mt-2 p-2"
	onclick={() => copyToClipboard(message, messageIndex)}
	aria-label="Copy to clipboard"
	in:fade={{ duration: 250, easing: cubicInOut }}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		class="fill-text-color stroke-text-color w-5 h-5"
	>
		{#if isCopied && copiedIndex === messageIndex}
			<path
				d="M18.577 6.183a1 1 0 0 1 .24 1.394l-5.666 8.02c-.36.508-.665.94-.94 1.269c-.287.34-.61.658-1.038.86a2.83 2.83 0 0 1-2.03.153c-.456-.137-.82-.406-1.149-.702c-.315-.285-.672-.668-1.09-1.116l-1.635-1.753a1 1 0 1 1 1.462-1.364l1.606 1.722c.455.487.754.806.998 1.027c.24.216.344.259.385.271c.196.06.405.045.598-.046c.046-.022.149-.085.36-.338c.216-.257.473-.62.863-1.171l5.642-7.986a1 1 0 0 1 1.394-.24"
			/>
		{:else}
			<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
				<path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2H9z" />
				<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
			</g>
		{/if}
	</svg>
</button>
