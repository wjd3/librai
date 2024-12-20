// See https://svelte.dev/docs/kit/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string
				email: string
				name?: string
			}
			token?: string
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
