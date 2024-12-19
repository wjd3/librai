<script lang="ts">
	import { pb } from '$lib/clients/pocketbase'
	import { isAuthenticated, currentUser } from '$lib/stores'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'

	let showLogin = $state(false)
	let email = $state('')
	let password = $state('')
	let isLoading = $state(false)
	let error = $state('')

	async function login(e: Event) {
		e.preventDefault()
		isLoading = true
		error = ''

		try {
			const auth = await pb.collection('users').authWithPassword(email, password)
			isAuthenticated.set(true)
			currentUser.set({
				id: auth.record.id,
				email: auth.record.email,
				name: auth.record.name
			})
			showLogin = false
		} catch (e) {
			error = 'Invalid credentials'
		}

		isLoading = false
	}

	async function logout() {
		pb.authStore.clear()
		isAuthenticated.set(false)
		currentUser.set(null)
	}
</script>

{#if $isAuthenticated}
	<button
		class="secondary px-4"
		onclick={logout}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		Logout
	</button>
{:else}
	<button
		class="secondary px-4"
		onclick={() => (showLogin = true)}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		Login
	</button>
{/if}

{#if showLogin}
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 !ml-0"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4"
			transition:fade={{ duration: 200, delay: 100 }}
		>
			<h2 class="text-xl mb-4">Login</h2>

			<form onsubmit={login} class="space-y-4">
				<div>
					<label for="email" class="block mb-1">Email</label>
					<input type="email" id="email" bind:value={email} required class="input w-full" />
				</div>

				<div>
					<label for="password" class="block mb-1">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						class="input w-full"
					/>
				</div>

				{#if error}
					<p class="text-red-500 text-sm">{error}</p>
				{/if}

				<div class="flex justify-end space-x-4">
					<button
						type="button"
						class="secondary"
						onclick={() => (showLogin = false)}
						disabled={isLoading}
					>
						Cancel
					</button>
					<button type="submit" class="primary" disabled={isLoading}>
						{isLoading ? 'Loading...' : 'Login'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
