import { onMount, onDestroy } from 'svelte'
import { browser } from '$app/environment'
import { writable, type Writable } from 'svelte/store'

interface ScrollSpyOptions {
	offset?: number
	sections?: string[]
}

export function createScrollSpy({ offset = 0, sections = [] }: ScrollSpyOptions = {}): {
	activeSection: Writable<string>
	isVisible: Writable<boolean>
	init: () => void
	destroy: () => void
} {
	const activeSection = writable<string>('')
	const isVisible = writable<boolean>(true)
	let ticking = false
	let resizeTimeout: ReturnType<typeof setTimeout>

	// Store section elements and their positions
	const sectionPositions = new Map<string, number>()

	function updateSectionPositions() {
		if (browser) {
			sectionPositions.clear()

			sections.forEach((sectionId) => {
				const element = document.getElementById(sectionId)
				if (element) {
					const rect = element.getBoundingClientRect()
					sectionPositions.set(sectionId, rect.top + window.scrollY - offset)
				}
			})
		}
	}

	function onScroll() {
		if (browser && !ticking) {
			window.requestAnimationFrame(() => {
				const scrollPosition = window.scrollY
				const headerElement = document.getElementById(sections[0])

				if (headerElement) {
					const rect = headerElement.getBoundingClientRect()
					isVisible.set(rect.top > -rect.height)
				}

				let currentSection = ''
				for (const [sectionId, position] of sectionPositions) {
					if (scrollPosition >= position) {
						currentSection = sectionId
					} else {
						break
					}
				}

				activeSection.set(currentSection)
				ticking = false
			})
			ticking = true
		}
	}

	const onResize = () => {
		clearTimeout(resizeTimeout)
		resizeTimeout = setTimeout(updateSectionPositions, 100)
	}

	function init() {
		updateSectionPositions()

		if (browser) {
			window.addEventListener('scroll', onScroll, { passive: true })
			window.addEventListener('resize', onResize, { passive: true })
		}

		onScroll()
	}

	function destroy() {
		if (browser) {
			window.removeEventListener('scroll', onScroll)
			window.removeEventListener('resize', onResize)
		}

		clearTimeout(resizeTimeout)
		sectionPositions.clear()
	}

	onMount(init)
	onDestroy(destroy)

	return {
		activeSection,
		isVisible,
		init,
		destroy
	}
}
