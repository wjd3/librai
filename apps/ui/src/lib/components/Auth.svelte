<script lang="ts">
	import { pb } from '$lib/clients/pocketbase'
	import { isAuthenticated, currentUser } from '$lib/stores'
	import { fade } from 'svelte/transition'
	import { cubicInOut } from 'svelte/easing'
	import DOMPurify from 'dompurify'

	let showAuth = $state(false)
	let isRegistering = $state(false)
	let email = $state('')
	let password = $state('')
	let passwordConfirm = $state('')
	let name = $state('')
	let isLoading = $state(false)
	let error = $state('')
	let honeypot = $state('')

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (honeypot) {
			showAuth = false
			return
		}

		isLoading = true
		error = ''

		const cleanName = DOMPurify.sanitize(name)
		const cleanEmail = DOMPurify.sanitize(email)
		const cleanPassword = DOMPurify.sanitize(password)
		const cleanPasswordConfirm = DOMPurify.sanitize(passwordConfirm)

		try {
			if (isRegistering) {
				if (!cleanName || !cleanEmail || !cleanPassword || !cleanPasswordConfirm) {
					isLoading = false
					return
				}

				if (cleanPassword !== cleanPasswordConfirm) {
					error = 'Passwords do not match'
					isLoading = false
					return
				}

				// Create user
				await pb.collection('users').create({
					email: cleanEmail,
					password: cleanPassword,
					passwordConfirm: cleanPasswordConfirm,
					name: cleanName
				})

				// Login after registration
				await pb.collection('users').authWithPassword(cleanEmail, cleanPassword)
			} else {
				if (!cleanEmail || !cleanPassword) {
					isLoading = false
					return
				}

				// Regular login
				await pb.collection('users').authWithPassword(cleanEmail, cleanPassword)
			}

			isAuthenticated.set(true)
			currentUser.set({
				id: pb.authStore.model?.id,
				email: pb.authStore.model?.email,
				name: pb.authStore.model?.name
			})
			showAuth = false
		} catch (e) {
			error = isRegistering ? 'Registration failed' : 'Invalid credentials'
		}

		isLoading = false
	}

	async function logout() {
		pb.authStore.clear()
		isAuthenticated.set(false)
		currentUser.set(null)
	}

	function resetForm() {
		email = ''
		password = ''
		passwordConfirm = ''
		name = ''
		error = ''
		honeypot = ''
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
		onclick={() => {
			showAuth = true
			isRegistering = false
			resetForm()
		}}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		Login
	</button>
	<button
		class="primary px-4"
		onclick={() => {
			showAuth = true
			isRegistering = true
			resetForm()
		}}
		transition:fade={{ duration: 200, easing: cubicInOut }}
	>
		Sign Up
	</button>
{/if}

{#if showAuth}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0"
		transition:fade={{ duration: 200 }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => (showAuth = false)}
		></div>

		<div
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, delay: 100 }}
		>
			<h2 class="text-xl mb-4">{isRegistering ? 'Sign Up' : 'Login'}</h2>

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if isRegistering}
					<div>
						<label for="name" class="block mb-1">Name</label>
						<input
							type="text"
							id="name"
							bind:value={name}
							required
							class="input w-full"
							maxlength="700"
						/>
					</div>
				{/if}

				<div>
					<label for="email" class="block mb-1">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="input w-full"
						maxlength="254"
					/>
				</div>

				<div>
					<label for="password" class="block mb-1">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						minlength="8"
						maxlength="72"
						class="input w-full"
					/>
				</div>

				{#if isRegistering}
					<div>
						<label for="passwordConfirm" class="block mb-1">Confirm Password</label>
						<input
							type="password"
							id="passwordConfirm"
							bind:value={passwordConfirm}
							required
							minlength="8"
							maxlength="72"
							class="input w-full"
						/>
					</div>
				{/if}

				<!-- Honeypot field -->
				<div class="sr-only">
					<label for="website">Leave this empty:</label>
					<input
						bind:value={honeypot}
						type="text"
						id="website"
						name="website"
						maxlength="4096"
						autocomplete="off"
						tabindex="-1"
					/>
				</div>

				{#if error}
					<p class="text-red-500 text-sm">{error}</p>
				{/if}

				<div class="flex justify-end space-x-4">
					<button
						type="button"
						class="secondary"
						onclick={() => (showAuth = false)}
						disabled={isLoading}
					>
						Cancel
					</button>
					<button type="submit" class="primary" disabled={isLoading}>
						{isLoading ? 'Loading...' : isRegistering ? 'Sign Up' : 'Login'}
					</button>
				</div>

				<div class="text-sm text-center flex flex-col items-center space-y-2">
					{#if isRegistering}
						<p>Already have an account?</p>
						<button
							type="button"
							class="text-primary-color hover:underline"
							onclick={() => {
								isRegistering = false
								resetForm()
							}}
						>
							Login instead
						</button>
					{:else}
						<p>Need an account?</p>
						<button
							type="button"
							class="text-primary-color hover:underline"
							onclick={() => {
								isRegistering = true
								resetForm()
							}}
						>
							Sign up
						</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
{/if}
