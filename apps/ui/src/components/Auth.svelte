<script lang="ts">
	import { isAuthenticated, currentUser, isAuthLoading } from '$lib/stores/index'
	import { authToken } from '$lib/stores/auth'
	import { fade } from 'svelte/transition'
	import DOMPurify from 'isomorphic-dompurify'
	import { quartInOut } from 'svelte/easing'

	let showAuthModal = $state(false)
	let isRegistering = $state(false)
	let isResettingPassword = $state(false)
	let email = $state('')
	let password = $state('')
	let passwordConfirm = $state('')
	let name = $state('')
	let error = $state('')
	let honeypot = $state('')
	let resetEmail = $state('')
	let resetSuccess = $state(false)

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (honeypot) {
			showAuthModal = false
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

			showAuthModal = false
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
		resetEmail = ''
		resetSuccess = false
	}

	async function handlePasswordReset(e: Event) {
		e.preventDefault()
		if (honeypot) {
			showAuthModal = false
			return
		}

		isAuthLoading.set(true)
		error = ''

		try {
			const cleanEmail = DOMPurify.sanitize(resetEmail)
			if (!cleanEmail) {
				error = 'Please enter your email'
				isAuthLoading.set(false)
				return
			}

			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: cleanEmail })
			})

			if (!response.ok) throw new Error('Password reset request failed')

			resetSuccess = true
		} catch (e) {
			console.error('Password reset error:', e)
			error = 'Failed to send password reset email'
		}

		isAuthLoading.set(false)
	}

	function showPasswordReset() {
		isResettingPassword = true
		resetEmail = ''
		error = ''
		resetSuccess = false
	}

	function backToLogin() {
		isResettingPassword = false
		resetEmail = ''
		error = ''
		resetSuccess = false
	}
</script>

{#if !$isAuthenticated}
	<button
		class="secondary px-4"
		onclick={() => {
			showAuthModal = true
			isRegistering = true
			isResettingPassword = false
			resetForm()
		}}
		disabled={$isAuthLoading}
		transition:fade={{ duration: 200, easing: quartInOut }}
		aria-label="Sign Up"
	>
		<span class="iconify lucide--user-plus"> </span>
	</button>

	<button
		class="secondary px-4"
		onclick={() => {
			showAuthModal = true
			isRegistering = false
			isResettingPassword = false
			resetForm()
		}}
		disabled={$isAuthLoading}
		transition:fade={{ duration: 200, easing: quartInOut }}
		aria-label="Login"
	>
		<span class="iconify lucide--log-in"> </span>
	</button>
{:else}
	<a href="/account" class="secondary px-4 py-2" aria-label="Account">
		<span class="iconify lucide--user"> </span>
	</a>
{/if}

{#if showAuthModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0 h-[100lvh]"
		transition:fade={{ duration: 200, easing: quartInOut }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => {
				if (!$isAuthLoading) {
					showAuthModal = false
				}
			}}
		></div>
		<div
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			{#if isResettingPassword}
				<h2 class="text-xl mb-4">Reset Password</h2>
				{#if resetSuccess}
					<div class="text-center py-4">
						<p class="mb-4">Password reset email sent!</p>
						<p class="text-sm mb-4">
							Please check your email for instructions to reset your password.
						</p>
						<button type="button" class="primary" onclick={backToLogin}>Back to Login</button>
					</div>
				{:else}
					<form onsubmit={handlePasswordReset} class="space-y-4">
						<div>
							<label for="resetEmail" class="block mb-1">Email</label>
							<input
								type="email"
								id="resetEmail"
								bind:value={resetEmail}
								required
								class="input w-full"
								maxlength="254"
								autocomplete="email"
							/>
						</div>

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
								onclick={backToLogin}
								disabled={$isAuthLoading}
							>
								Back
							</button>
							<button type="submit" class="primary" disabled={$isAuthLoading}>
								{#if $isAuthLoading}
									<span class="iconify lucide--rotate-cw animate-spin"> </span>
								{:else}
									Send Reset Link
								{/if}
							</button>
						</div>
					</form>
				{/if}
			{:else}
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
							onclick={() => (showAuthModal = false)}
							disabled={$isAuthLoading}
						>
							Cancel
						</button>
						<button type="submit" class="primary" disabled={$isAuthLoading}>
							{#if $isAuthLoading}
								<span class="iconify lucide--rotate-cw animate-spin"> </span>
							{:else if isRegistering}
								Sign Up
							{:else}
								Login
							{/if}
						</button>
					</div>
					{#if !isRegistering}
						<div class="text-center mt-2">
							<button
								type="button"
								class="text-sm primary"
								onclick={showPasswordReset}
								disabled={$isAuthLoading}
							>
								Forgot Password?
							</button>
						</div>
					{/if}
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
								Login
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
								Sign Up
							</button>
						{/if}
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}
