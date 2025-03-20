<script lang="ts">
	import { themes, type Theme } from '$lib/constants/themes'
	import DropdownMenu from './DropdownMenu.svelte'

	let { currentTheme, isDarkMode, toggleDarkMode } = $props()

	const themeIcons: { [key in Theme]: string } = {
		charcoal: 'lucide--cuboid',
		leaf: 'lucide--leaf',
		twilight: 'lucide--sparkles',
		volcano: 'lucide--flame',
		ocean: 'lucide--waves'
	} as const

	const setTheme = (theme: Theme) => {
		document.documentElement.setAttribute('data-theme', theme)
		currentTheme = theme
		localStorage.setItem('theme', theme)
	}
</script>

<DropdownMenu>
	{#snippet trigger()}
		<button
			class="bg-chat-bar-bg border border-form-border rounded-full p-2 text-text-color hover:bg-opacity-80 hover:ring-2 hover:ring-form-focus-border focus:outline-none focus:ring-2 focus:ring-form-focus-border transition"
			aria-label="App settings"
		>
			<span class="iconify lucide--settings"></span>
		</button>
	{/snippet}

	{#snippet content()}
		<div class="px-4 py-2 text-sm font-medium text-text-color opacity-70">Theme</div>
		{#each themes as theme, themeIndex}
			<button
				class="border-none w-full px-4 py-2 text-left text-sm hover:bg-primary-card-bg flex items-center gap-2 rounded-none"
				onclick={() => setTheme(theme)}
			>
				<span class="iconify {themeIcons[theme]}"></span>
				<span class="capitalize">{theme}</span>
				{#if theme === currentTheme}
					<span class="iconify lucide--check ml-auto !w-5 !h-5"></span>
				{/if}
			</button>
		{/each}
		<div class="border-t border-form-border" aria-hidden="true"></div>

		<div class="px-4 py-2 text-sm font-medium text-text-color opacity-70">Mode</div>
		<button
			class="border-none w-full px-4 py-2 text-left text-sm hover:bg-primary-card-bg flex items-center gap-2 rounded-t-none"
			onclick={toggleDarkMode}
		>
			{#if isDarkMode}
				<span class="iconify lucide--moon" data-dropdown-element></span>
				<span data-dropdown-element>Dark Mode</span>
			{:else}
				<span class="iconify lucide--sun" data-dropdown-element></span>
				<span data-dropdown-element>Light Mode</span>
			{/if}
		</button>
	{/snippet}
</DropdownMenu>
