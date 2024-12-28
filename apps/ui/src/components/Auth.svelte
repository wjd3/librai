<script lang="ts">
	import { isAuthenticated, currentUser, isAuthLoading } from '$lib/stores/index'
	import { authToken } from '$lib/stores/auth'
	import { fade } from 'svelte/transition'
	import DOMPurify from 'dompurify'
	import { goto } from '$app/navigation'
	import { quartInOut } from 'svelte/easing'

	let showAuth = $state(false)
	let showLogoutConfirm = $state(false)
	let isLoggingOut = $state(false)
	let isRegistering = $state(false)
	let email = $state('')
	let password = $state('')
	let passwordConfirm = $state('')
	let name = $state('')
	let error = $state('')
	let honeypot = $state('')

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (honeypot) {
			showAuth = false
			return
		}

		isAuthLoading.set(true)
		error = ''

		const cleanName = DOMPurify.sanitize(name)
		const cleanEmail = DOMPurify.sanitize(email)
		const cleanPassword = DOMPurify.sanitize(password)
		const cleanPasswordConfirm = DOMPurify.sanitize(passwordConfirm)

		try {
			if (isRegistering) {
				if (!cleanName || !cleanEmail || !cleanPassword || !cleanPasswordConfirm) {
					isAuthLoading.set(false)
					return
				}

				if (cleanPassword !== cleanPasswordConfirm) {
					error = 'Passwords do not match'
					isAuthLoading.set(false)
					return
				}

				// Register API call
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: cleanEmail,
						password: cleanPassword,
						passwordConfirm: cleanPasswordConfirm,
						name: cleanName
					})
				})

				if (!response.ok) throw new Error('Registration failed')

				// Login after registration
				const loginResponse = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: cleanEmail,
						password: cleanPassword
					})
				})

				const auth = await loginResponse.json()

				authToken.set(auth.token)
				localStorage.setItem('auth_token', auth.token)
				isAuthenticated.set(true)
				currentUser.set(auth.user)
			} else {
				if (!cleanEmail || !cleanPassword) {
					isAuthLoading.set(false)
					return
				}

				// Regular login
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: cleanEmail,
						password: cleanPassword
					})
				})

				if (!response.ok) throw new Error('Invalid credentials')

				const auth = await response.json()

				authToken.set(auth.token)
				localStorage.setItem('auth_token', auth.token)
				isAuthenticated.set(true)
				currentUser.set(auth.user)
			}

			showAuth = false
		} catch (e) {
			console.error('Auth error:', e)
			error = isRegistering ? 'Registration failed' : 'Invalid credentials'
		}

		isAuthLoading.set(false)
	}

	async function logout() {
		isLoggingOut = true
		await fetch('/api/auth/logout', { method: 'POST' })
		authToken.set(null)
		localStorage.removeItem('auth_token')
		isAuthenticated.set(false)
		currentUser.set(null)
		showLogoutConfirm = false
		await goto('/')
		isLoggingOut = false
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
		class="secondary px-4 py-2"
		onclick={() => (showLogoutConfirm = true)}
		aria-label="Logout"
	>
		<svg
			class="!fill-none"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
				points="16 17 21 12 16 7"
			/><line x1="21" x2="9" y1="12" y2="12" /></svg
		>
	</button>
{:else}
	<button
		class="primary px-4"
		onclick={() => {
			showAuth = true
			isRegistering = true
			resetForm()
		}}
		aria-label="Sign Up"
	>
		<svg
			class="!fill-none"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line
				x1="19"
				x2="19"
				y1="8"
				y2="14"
			/><line x1="22" x2="16" y1="11" y2="11" /></svg
		>
	</button>

	<button
		class="secondary px-4"
		onclick={() => {
			showAuth = true
			isRegistering = false
			resetForm()
		}}
		aria-label="Login"
	>
		<svg
			class="!fill-none"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline
				points="10 17 15 12 10 7"
			/><line x1="15" x2="3" y1="12" y2="12" /></svg
		>
	</button>
{/if}

{#if showLogoutConfirm}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0 h-[100lvh]"
		transition:fade={{ duration: 200, easing: quartInOut }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => {
				if (!isLoggingOut) {
					showLogoutConfirm = false
				}
			}}
		></div>

		<div
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl mb-4">Confirm Logout</h2>
			<p class="mb-6">Are you sure you want to log out?</p>

			<div class="flex justify-end space-x-4">
				<button
					disabled={isLoggingOut}
					type="button"
					class="secondary"
					onclick={() => (showLogoutConfirm = false)}
				>
					Cancel
				</button>
				<button disabled={isLoggingOut} type="button" class="primary" onclick={logout}>
					{isLoggingOut ? 'Logging out...' : 'Logout'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showAuth}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0 h-[100lvh]"
		transition:fade={{ duration: 200, easing: quartInOut }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => {
				if (!$isAuthLoading) {
					showAuth = false
				}
			}}
		></div>

		<div
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, easing: quartInOut }}
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
						disabled={$isAuthLoading}
					>
						Cancel
					</button>
					<button type="submit" class="primary" disabled={$isAuthLoading}>
						{$isAuthLoading ? 'Hang tight...' : isRegistering ? 'Sign Up' : 'Login'}
					</button>
				</div>

				<div class="text-sm text-center flex flex-col items-center space-y-2">
					{#if isRegistering}
						<p>Already have an account?</p>
						<button
							type="button"
							class="secondary"
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
							class="secondary"
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
