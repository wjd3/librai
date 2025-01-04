<script lang="ts">
	import { themes, type Theme } from '$lib/constants/themes'

	let { currentTheme }: { currentTheme: Theme } = $props()

	const themeIcons: { [key in Theme]: string } = {
		charcoal: 'lucide--cuboid',
		leaf: 'lucide--leaf',
		sunset: 'lucide--sunset',
		volcano: 'lucide--flame',
		ocean: 'lucide--waves'
	} as const

	const getNextTheme = (current: Theme): Theme => {
		const currentIndex = themes.indexOf(current)
		const nextIndex = (currentIndex + 1) % themes.length
		return themes[nextIndex]
	}

	const cycleTheme = () => {
		const nextTheme = getNextTheme(currentTheme)
		document.documentElement.setAttribute('data-theme', nextTheme)
		currentTheme = nextTheme
		localStorage.setItem('theme', nextTheme)
	}
</script>

<button
	onclick={cycleTheme}
	class="bg-chat-bar-bg border border-form-border rounded-full p-3 text-text-color hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-form-focus-border transition-colors"
	aria-label={`Visual theme switcher. Current theme is ${currentTheme}`}
>
	<span class={`text-xl leading-none block iconify ${themeIcons[currentTheme]}`}></span>
</button>
