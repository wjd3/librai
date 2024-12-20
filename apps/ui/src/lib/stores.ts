import { writable } from 'svelte/store'
import type { Conversation } from '$lib/server/services/pocketbaseService'

export const chatHistory = writable<{ message: string; isUser: boolean; created?: string }[]>([])
export const currentConversation = writable<Conversation | null>(null)
export const pendingConversation = writable(false)

// Re-export auth stores for backward compatibility
export { currentUser, isAuthenticated, isAuthLoading } from './stores/auth'
