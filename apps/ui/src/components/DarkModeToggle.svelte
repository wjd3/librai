<script lang="ts">
	let { isDarkMode, toggleDarkMode } = $props()
</script>

<button
	class="bg-chat-bar-bg border border-form-border rounded-full p-3 text-text-color hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-form-focus-border transition-colors"
	onclick={toggleDarkMode}
>
	{#if isDarkMode}
		<span class="iconify lucide--moon"> </span>
	{:else}
		<span class="iconify lucide--sun"> </span>
	{/if}
</button>
