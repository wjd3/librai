import { writable } from 'svelte/store'

export const chatHistory = writable<{ message: string; isUser: boolean }[]>([])
