<script lang="ts">
	import { isAuthenticated, currentUser, isAuthLoading } from '$lib/stores/index'
	import { authToken } from '$lib/stores/auth'
	import { fade } from 'svelte/transition'
	import DOMPurify from 'dompurify'
	import { quartInOut } from 'svelte/easing'

	let showAuth = $state(false)
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

	function resetForm() {
		email = ''
		password = ''
		passwordConfirm = ''
		name = ''
		error = ''
		honeypot = ''
	}
</script>

{#if !$isAuthenticated}
	<button
		class="secondary px-4"
		onclick={() => {
			showAuth = true
			isRegistering = true
			resetForm()
		}}
		disabled={$isAuthLoading}
		transition:fade={{ duration: 200, easing: quartInOut }}
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
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<line x1="19" x2="19" y1="8" y2="14" />
			<line x1="22" x2="16" y1="11" y2="11" />
		</svg>
	</button>

	<button
		class="secondary px-4"
		onclick={() => {
			showAuth = true
			isRegistering = false
			resetForm()
		}}
		disabled={$isAuthLoading}
		transition:fade={{ duration: 200, easing: quartInOut }}
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
		>
			<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
			<polyline points="10 17 15 12 10 7" />
			<line x1="15" x2="3" y1="12" y2="12" />
		</svg>
	</button>
{:else}
	<a href="/account" class="secondary px-4 py-2" aria-label="Account">
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
		>
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	</a>
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
			<h2 class="text-xl mb-4">
				{#if isRegistering}
					Sign Up
				{:else}
					Login
				{/if}
			</h2>
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
						{#if $isAuthLoading}
							<svg
								class="!fill-none animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path
									d="M21 3v5h-5"
								/></svg
							>
						{:else if isRegistering}
							Sign Up
						{:else}
							Login
						{/if}
					</button>
				</div>
				<div class="text-sm text-center flex flex-col items-center space-y-2">
					{#if isRegistering}
						<p>Already have an account?</p>
						<button
							type="button"
							class="primary"
							onclick={() => {
								isRegistering = false
								resetForm()
							}}
							disabled={$isAuthLoading}
						>
							Login instead
						</button>
					{:else}
						<p>Need an account?</p>
						<button
							type="button"
							class="primary"
							onclick={() => {
								isRegistering = true
								resetForm()
							}}
							disabled={$isAuthLoading}
						>
							Sign up
						</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
{/if}
