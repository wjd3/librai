<script lang="ts">
	import { isAuthenticated, currentUser, isAuthLoading } from '$lib/stores/index'
	import { authToken } from '$lib/stores/auth'
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import DOMPurify from 'isomorphic-dompurify'
	import DropdownMenu from './DropdownMenu.svelte'

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
	let registrationSuccess = $state(false)
	let registrationMessage = $state('')
	let showPassword = $state(false)
	let showPasswordConfirm = $state(false)

	const maxPasswordLength = 128

	const openAuthModal = (register: boolean) => {
		isRegistering = register
		showAuthModal = true
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

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (honeypot) {
			showAuthModal = false
			return
		}

		isAuthLoading.set(true)
		error = ''

		const cleanName = DOMPurify.sanitize(name.trim())
		const cleanEmail = DOMPurify.sanitize(email.trim())
		const cleanPassword = DOMPurify.sanitize(password.trim())
		const cleanPasswordConfirm = DOMPurify.sanitize(passwordConfirm.trim())

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

				const data = await response.json()

				if (!response.ok) throw new Error(data.message || 'Registration failed')

				// Show success message instead of auto-login
				registrationSuccess = true
				registrationMessage = data.message
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

				const data = await response.json()

				if (!response.ok) throw new Error(data.message || 'Invalid credentials')

				authToken.set(data.token)
				localStorage.setItem('auth_token', data.token)
				isAuthenticated.set(true)
				currentUser.set(data.user)
				showAuthModal = false
			}
		} catch (e) {
			console.error('Auth error:', e)
			error = e instanceof Error ? e.message : 'Authentication failed'
		}

		isAuthLoading.set(false)
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

{#if $isAuthenticated}
	<a
		href="/account"
		class="secondary px-4 py-2 rounded-lg transition duration-200"
		aria-label="Account"
	>
		<span class="iconify lucide--user"></span>
	</a>
{:else}
	<DropdownMenu>
		{#snippet trigger()}
			<button
				class="secondary px-4 py-2 rounded-lg transition duration-200"
				aria-label="Authentication menu"
			>
				<span class="iconify lucide--user"></span>
			</button>
		{/snippet}

		{#snippet content()}
			<button
				class="rounded-none border-none w-full px-4 py-2 text-left text-sm hover:bg-primary-card-bg flex items-center gap-2"
				onclick={() => openAuthModal(false)}
				disabled={$isAuthLoading}
			>
				<span class="iconify lucide--log-in"></span>
				<span>Login</span>
			</button>
			<button
				class="rounded-none border-none w-full px-4 py-2 text-left text-sm hover:bg-primary-card-bg flex items-center gap-2"
				onclick={() => openAuthModal(true)}
				disabled={$isAuthLoading}
			>
				<span class="iconify lucide--user-plus"></span>
				<span>Sign Up</span>
			</button>
		{/snippet}
	</DropdownMenu>
{/if}

{#if showAuthModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0 h-lvh"
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
			class="bg-page-bg p-8 rounded-2xl max-w-md w-full mx-4 relative z-10 shadow-xl border border-form-border backdrop-blur-sm"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			{#if isResettingPassword}
				<h2 class="text-2xl font-semibold mb-6">Reset Password</h2>
				{#if resetSuccess}
					<div class="text-center py-4">
						<p class="mb-4">Password reset email sent!</p>
						<p class="text-sm mb-6">
							Please check your email for instructions to reset your password.
						</p>
						<button type="button" class="primary w-full" onclick={backToLogin}>Back to Login</button
						>
					</div>
				{:else}
					<form onsubmit={handlePasswordReset} class="space-y-6">
						<div>
							<label for="resetEmail" class="block text-lg mb-2">Email</label>
							<input
								type="email"
								id="resetEmail"
								bind:value={resetEmail}
								required
								class="input w-full px-4 py-3"
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

						<div class="flex flex-col gap-4">
							<button type="submit" class="primary w-full" disabled={$isAuthLoading}>
								{#if $isAuthLoading}
									<span class="iconify lucide--rotate-cw animate-spin m-auto"> </span>
								{:else}
									Send Reset Link
								{/if}
							</button>
							<button
								type="button"
								class="secondary w-full"
								onclick={backToLogin}
								disabled={$isAuthLoading}
							>
								Back
							</button>
						</div>
					</form>
				{/if}
			{:else}
				<h2 class="text-2xl font-semibold mb-6">
					{#if isRegistering}
						Sign Up
					{:else}
						Login
					{/if}
				</h2>
				{#if registrationSuccess}
					<div class="text-center py-4">
						<h3 class="text-xl mb-4">Registration Successful!</h3>
						<p class="mb-6">{registrationMessage}</p>
						<button
							type="button"
							class="primary w-full"
							onclick={() => {
								isRegistering = false
								registrationSuccess = false
								resetForm()
							}}
						>
							Go to Login
						</button>
					</div>
				{:else}
					<form onsubmit={handleSubmit} class="space-y-4">
						{#if isRegistering}
							<div>
								<label for="name" class="block text-lg mb-2">Name</label>
								<input
									type="text"
									id="name"
									bind:value={name}
									required
									class="input w-full px-4 py-3"
									maxlength="700"
								/>
							</div>
						{/if}
						<div>
							<label for="email" class="block text-lg mb-2">Email</label>
							<input
								type="email"
								id="email"
								bind:value={email}
								required
								class="input w-full px-4 py-3 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
								maxlength="254"
							/>
						</div>
						<div>
							<label for="password" class="block text-lg mb-2">Password</label>
							<div class="relative">
								<input
									type={showPassword && isRegistering ? 'text' : 'password'}
									id="password"
									bind:value={password}
									required
									minlength="8"
									maxlength={maxPasswordLength}
									class="input w-full px-4 py-3 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
								/>
								{#if isRegistering}
									<button
										type="button"
										class="absolute right-0 py-3 border-0 top-1/2 -translate-y-1/2"
										onclick={() => (showPassword = !showPassword)}
										aria-label="Toggle password visibility"
									>
										<span
											class="iconify"
											class:lucide--eye={showPassword}
											class:lucide--eye-off={!showPassword}
										></span>
									</button>
								{/if}
							</div>
						</div>
						{#if isRegistering}
							<div>
								<label for="passwordConfirm" class="block text-lg mb-2">Confirm Password</label>
								<div class="relative">
									<input
										type={showPasswordConfirm ? 'text' : 'password'}
										id="passwordConfirm"
										bind:value={passwordConfirm}
										required
										minlength="8"
										maxlength={maxPasswordLength}
										class="input w-full px-4 py-3 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
									/>
									<button
										type="button"
										class="absolute right-0 py-3 border-0 top-1/2 -translate-y-1/2"
										onclick={() => (showPasswordConfirm = !showPasswordConfirm)}
										aria-label="Toggle confirm password visibility"
									>
										<span
											class="iconify"
											class:lucide--eye={showPasswordConfirm}
											class:lucide--eye-off={!showPasswordConfirm}
										></span>
									</button>
								</div>
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

						<!-- Main action buttons -->
						<div class="flex flex-col gap-4">
							<button
								type="submit"
								class="primary w-full py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
								disabled={$isAuthLoading}
							>
								{#if $isAuthLoading}
									<span class="iconify lucide--rotate-cw animate-spin m-auto"></span>
								{:else if isRegistering}
									Sign Up
								{:else}
									Login
								{/if}
							</button>
							<button
								type="button"
								class="secondary w-full py-3 rounded-xl transition duration-200"
								onclick={() => (showAuthModal = false)}
								disabled={$isAuthLoading}
							>
								Cancel
							</button>
						</div>

						<!-- Secondary actions -->
						<div class="space-y-4 text-center mt-6">
							{#if !isRegistering}
								<button
									type="button"
									class="text-sm hover:text-btn-bg transition duration-200"
									onclick={showPasswordReset}
									disabled={$isAuthLoading}
								>
									Forgot Password?
								</button>
							{/if}

							<div class="space-y-2">
								{#if isRegistering}
									<p class="text-sm opacity-70">Already have an account?</p>
									<button
										type="button"
										class="text-sm primary px-6 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
										onclick={() => {
											isRegistering = false
											resetForm()
										}}
										disabled={$isAuthLoading}
									>
										Login
									</button>
								{:else}
									<p class="text-sm opacity-70">Need an account?</p>
									<button
										type="button"
										class="text-sm primary px-6 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
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
						</div>
					</form>
				{/if}
			{/if}
		</div>
	</div>
{/if}
