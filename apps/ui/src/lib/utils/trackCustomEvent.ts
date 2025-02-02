type CustomEventCallback = () => void

declare global {
	interface Window {
		sa_event?: (event: string, callback?: CustomEventCallback) => void
		sa_event_q?: Array<[string, CustomEventCallback?]>
	}
}

/**
 * Track a custom event using Simple Analytics
 * @param event The name of the event (alphanumeric and underscores only, max 200 chars)
 * @param callback Optional callback function to execute after tracking
 */
export async function trackCustomEvent(
	event: string,
	callback?: CustomEventCallback
): Promise<void> {
	// Validate and format event name
	const formattedEvent = event
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
		.slice(0, 200)

	// Check for Do Not Track
	const dntActive = parseInt(navigator.doNotTrack || window.navigator.doNotTrack || '0', 10) === 1
	if (dntActive) {
		if (callback) callback()
		return
	}

	// If sa_event is available, use it directly
	if (window.sa_event) {
		window.sa_event(formattedEvent, callback)
		return
	}

	// Initialize queue if not exists
	if (!window.sa_event_q) {
		window.sa_event_q = []
	}
	// Queue the event
	window.sa_event_q.push([formattedEvent, callback])
}
