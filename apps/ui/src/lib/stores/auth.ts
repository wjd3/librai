import { writable } from 'svelte/store'

type User = {
	id: string
	email: string
	name?: string
} | null

export const authToken = writable<string | null>(null)
export const currentUser = writable<User>(null)
export const isAuthenticated = writable(false)
export const isAuthLoading = writable(true)

// Subscribe to authToken to automatically update isAuthenticated
authToken.subscribe((token) => {
	isAuthenticated.set(!!token)
})
