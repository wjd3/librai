<script lang="ts">
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import type { Snippet } from 'svelte'

	let { trigger, content } = $props<{
		trigger: Snippet
		content: Snippet
	}>()

	let dropdownRef: HTMLDivElement | null = $state(null)
	let triggerRef: HTMLDivElement | null = $state(null)
	let isOpen = $state(false)

	const handleClickOutside = (event: MouseEvent) => {
		if (
			dropdownRef &&
			triggerRef &&
			!dropdownRef.contains(event.target as Node) &&
			!triggerRef.contains(event.target as Node)
		) {
			isOpen = false
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside)
		} else {
			document.removeEventListener('click', handleClickOutside)
		}

		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	})
</script>

<div class="relative">
	<div
		role="button"
		tabindex="0"
		onclick={() => (isOpen = !isOpen)}
		onkeydown={() => (isOpen = !isOpen)}
		bind:this={triggerRef}
		aria-expanded={isOpen}
	>
		{@render trigger()}
	</div>

	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class="absolute right-0 mt-2 w-48 bg-page-bg rounded-xl shadow-lg border border-form-border z-50 overflow-hidden"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			{@render content()}
		</div>
	{/if}
</div>
