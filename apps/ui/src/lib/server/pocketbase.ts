import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL
if (!pocketbaseUrl) {
	throw new Error('VITE_POCKETBASE_URL environment variable is not set')
}

// Create a singleton instance for server-side use only
const pb = new PocketBase(pocketbaseUrl)
pb.autoCancellation(false)

export { pb }
