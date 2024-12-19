import { writable } from 'svelte/store'
import type { Conversation } from '$lib/server/services/pocketbaseService'

export const chatHistory = writable<{ message: string; isUser: boolean }[]>([])
export const isAuthenticated = writable(false)
export const currentUser = writable<{
	id: string
	email: string
	name?: string
} | null>(null)
export const currentConversation = writable<Conversation | null>(null)
