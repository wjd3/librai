import { writable } from 'svelte/store'
import type { Conversation } from '$lib/server/services/pocketbaseService'

export const chatHistory = writable<{ message: string; isUser: boolean; created?: string }[]>([])
export const isAuthenticated = writable(false)
export const isAuthLoading = writable(true)
export const currentUser = writable<{
	id: string
	email: string
	name?: string
} | null>(null)
export const currentConversation = writable<Conversation | null>(null)
export const pendingConversation = writable(false)
