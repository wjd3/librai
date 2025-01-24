<script lang="ts">
	import { currentUser } from '$lib/stores'
	import { authToken, isAuthLoading } from '$lib/stores/auth'
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import DOMPurify from 'isomorphic-dompurify'

	let showLogoutConfirm = $state(false)
	let isLoggingOut = $state(false)
	let isUpdating = $state(false)
	let showChangePassword = $state(false)
	let showChangeEmail = $state(false)

	let showNewPassword = $state(false)
	let showPasswordConfirm = $state(false)

	// Profile form
	let name = $state($currentUser?.name || '')
	let error = $state('')
	let success = $state('')

	let isNameSet = $state(false)
	$effect(() => {
		if (!isNameSet && !$isAuthLoading) {
			if (!name && $currentUser?.name) {
				name = $currentUser.name
			}

			isNameSet = true
		}
	})

	// Password change form
	let oldPassword = $state('')
	let newPassword = $state('')
	let passwordConfirm = $state('')

	// Email change form
	let newEmail = $state('')
	let confirmPassword = $state('')

	async function updateProfile(e: Event) {
		e.preventDefault()
		error = ''
		success = ''
		isUpdating = true

		try {
			const sanitizedName = DOMPurify.sanitize(name)

			const response = await fetch('/api/auth/update', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$authToken}`
				},
				body: JSON.stringify({ name: sanitizedName })
			})

			if (!response.ok) throw new Error('Failed to update profile')

			const updated = await response.json()
			currentUser.set(updated)
			success = 'Profile updated successfully'
		} catch (e) {
			console.error('Update error:', e)
			error = 'Failed to update profile'
		}

		isUpdating = false
	}

	const maxPasswordLength = 128
	async function changePassword(e: Event) {
		e.preventDefault()
		error = ''
		success = ''
		isUpdating = true

		const sanitizedOldPassword = DOMPurify.sanitize(oldPassword)
		const sanitizedNewPassword = DOMPurify.sanitize(newPassword.trim())
		const sanitizedPasswordConfirm = DOMPurify.sanitize(passwordConfirm.trim())

		try {
			if (
				!sanitizedOldPassword ||
				!sanitizedPasswordConfirm ||
				sanitizedPasswordConfirm.length > maxPasswordLength
			) {
				error = 'Invalid password'
				return
			}

			if (sanitizedNewPassword !== sanitizedPasswordConfirm) {
				error = 'Passwords do not match'
				return
			}

			const response = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$authToken}`
				},
				body: JSON.stringify({
					oldPassword: sanitizedOldPassword,
					password: sanitizedNewPassword,
					passwordConfirm: sanitizedPasswordConfirm
				})
			})

			if (!response.ok) throw new Error('Failed to change password')

			success = 'Password changed successfully'
			showChangePassword = false
			oldPassword = ''
			newPassword = ''
			passwordConfirm = ''
		} catch (e) {
			console.error('Password change error:', e)
			error = 'Failed to change password'
		}

		isUpdating = false
	}

	async function changeEmail(e: Event) {
		e.preventDefault()
		error = ''
		success = ''
		isUpdating = true

		try {
			const response = await fetch('/api/auth/change-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$authToken}`
				},
				body: JSON.stringify({
					newEmail,
					password: confirmPassword
				})
			})

			if (!response.ok) throw new Error('Failed to request email change')

			success = 'Please check your email to confirm the change'
			showChangeEmail = false
			newEmail = ''
			confirmPassword = ''
		} catch (e) {
			console.error('Email change error:', e)
			error = 'Failed to request email change'
		}

		isUpdating = false
	}

	async function logout() {
		isLoggingOut = true
		await fetch('/api/auth/logout', { method: 'POST' })
		authToken.set(null)
		localStorage.removeItem('auth_token')
		window.location.href = '/'
	}
</script>

<section class="space-y-6 max-w-[600px] w-full pt-0">
	<div class="bg-primary-card-bg rounded-xl shadow-sm border border-form-border">
		<div class="px-6 py-4 border-b border-form-border">
			<h2
				class="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-btn-bg to-btn-hover-bg"
			>
				Profile Settings
			</h2>
		</div>

		<div class="p-6">
			<form onsubmit={updateProfile} class="space-y-6 max-w-xl">
				<!-- Name Field -->
				<div class="space-y-2">
					<label for="name" class="block font-medium">Display Name</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						required
						class="input w-full px-4 py-2 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
						maxlength="700"
						placeholder={$isAuthLoading ? 'Loading name...' : 'Enter your name'}
					/>
				</div>

				<!-- Email Field -->
				<div class="space-y-2">
					<div
						class="flex max-sm:flex-col max-sm:space-y-2 sm:items-center justify-between p-3 bg-page-bg rounded-xl border border-form-border"
					>
						<span class="opacity-90"
							>{$isAuthLoading
								? 'Loading email...'
								: $currentUser?.email
									? $currentUser.email
									: ''}</span
						>
						<button
							type="button"
							class="primary text-sm px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
							onclick={() => (showChangeEmail = true)}
							disabled={isUpdating || $isAuthLoading}
						>
							Change Email
						</button>
					</div>
				</div>

				<!-- Password Field -->
				<div class="space-y-2">
					<div
						class="flex sm:items-center justify-between p-3 bg-page-bg rounded-xl border border-form-border max-sm:flex-col max-sm:space-y-2"
					>
						<span class="opacity-90 text-left"
							>{$isAuthLoading ? 'Loading password...' : '••••••••••••'}</span
						>
						<button
							type="button"
							class="primary text-sm px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
							onclick={() => (showChangePassword = true)}
							disabled={isUpdating || $isAuthLoading}
						>
							Change Password
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-red-500 text-sm bg-red-500/10 px-4 py-2 rounded-xl">{error}</p>
				{/if}

				{#if success}
					<p class="text-green-500 text-sm bg-green-500/10 px-4 py-2 rounded-xl">{success}</p>
				{/if}

				<div
					class="flex sm:items-center justify-between pt-4 border-t border-form-border max-sm:flex-col-reverse max-sm:space-y-2 max-sm:space-y-reverse"
				>
					<button
						type="button"
						class="secondary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200 text-sm"
						onclick={() => (showLogoutConfirm = true)}
						disabled={isUpdating || $isAuthLoading}
					>
						<div class="flex items-center space-x-2 max-sm:justify-center">
							<span class="iconify lucide--log-out !text-lg !w-[18px] !h-[18px]"></span>
							<span>Logout</span>
						</div>
					</button>

					<button
						type="submit"
						class="primary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
						disabled={isUpdating || $isAuthLoading}
					>
						<div class="flex items-center space-x-2 max-sm:justify-center">
							{#if isUpdating}
								<span class="iconify lucide--rotate-cw animate-spin"></span>
							{:else}
								<span class="iconify lucide--save !text-lg !w-[18px] !h-[18px]"></span>
								<span>Save Changes</span>
							{/if}
						</div>
					</button>
				</div>
			</form>
		</div>
	</div>
</section>

<!-- Modals -->
{#if showChangePassword}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0"
		transition:fade={{ duration: 200, easing: quartInOut }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => (showChangePassword = false)}
		></div>

		<div
			class="bg-page-bg p-6 rounded-xl max-w-sm w-full mx-4 relative z-10 shadow-lg border border-form-border"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl font-semibold mb-4">Change Password</h2>
			<form onsubmit={changePassword} class="space-y-4">
				<div>
					<label for="oldPassword" class="block mb-1">Current Password</label>
					<div class="relative">
						<input
							type="password"
							id="oldPassword"
							bind:value={oldPassword}
							required
							class="input w-full px-4 py-2 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
							minlength="8"
						/>
					</div>
				</div>

				<div>
					<label for="newPassword" class="block mb-1">New Password</label>
					<div class="relative">
						<input
							type={showNewPassword ? 'text' : 'password'}
							id="newPassword"
							bind:value={newPassword}
							required
							class="input w-full px-4 py-2 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
							minlength="8"
							maxlength={maxPasswordLength}
						/>
						<button
							type="button"
							class="absolute right-0 py-3 border-0 top-1/2 -translate-y-1/2"
							onclick={() => (showNewPassword = !showNewPassword)}
							aria-label="Toggle new password visibility"
						>
							<span
								class="iconify"
								class:lucide--eye={showNewPassword}
								class:lucide--eye-off={!showNewPassword}
							></span>
						</button>
					</div>
				</div>

				<div>
					<label for="passwordConfirm" class="block mb-1">Confirm New Password</label>
					<div class="relative">
						<input
							type={showPasswordConfirm ? 'text' : 'password'}
							id="passwordConfirm"
							bind:value={passwordConfirm}
							required
							class="input w-full px-4 py-2 rounded-xl bg-primary-card-bg border border-form-border focus:border-btn-bg transition duration-200"
							minlength="8"
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

				{#if error}
					<p class="text-red-500 text-sm">{error}</p>
				{/if}

				<div class="flex justify-end space-x-4">
					<button
						type="button"
						class="secondary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
						onclick={() => (showChangePassword = false)}
						disabled={isUpdating || $isAuthLoading}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="primary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
						disabled={isUpdating || $isAuthLoading}
					>
						{#if isUpdating}
							<span class="iconify lucide--rotate-cw animate-spin"></span>
						{:else}
							Change Password
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showChangeEmail}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0"
		transition:fade={{ duration: 200, easing: quartInOut }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => (showChangeEmail = false)}
		></div>

		<div
			class="bg-page-bg p-6 rounded-xl max-w-sm w-full mx-4 relative z-10 shadow-lg border border-form-border"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl font-semibold mb-4">Change Email</h2>

			<form onsubmit={changeEmail} class="space-y-4">
				<div>
					<label for="newEmail" class="block mb-1">New Email</label>
					<input type="email" id="newEmail" bind:value={newEmail} required class="input w-full" />
				</div>

				<div>
					<label for="confirmPassword" class="block mb-1">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
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
						class="secondary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
						onclick={() => (showChangeEmail = false)}
						disabled={isUpdating || $isAuthLoading}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="primary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
						disabled={isUpdating || $isAuthLoading}
					>
						{#if isUpdating}
							<span class="iconify lucide--rotate-cw animate-spin"></span>
						{:else}
							Change Email
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showLogoutConfirm}
	<div
		class="fixed inset-0 flex items-center justify-center z-50 !ml-0"
		transition:fade={{ duration: 200, easing: quartInOut }}
	>
		<div
			aria-hidden="true"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"
			onclick={() => (showLogoutConfirm = false)}
		></div>

		<div
			class="bg-page-bg p-6 rounded-xl max-w-sm w-full mx-4 relative z-10 shadow-lg border border-form-border"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl font-semibold mb-4">Confirm Logout</h2>
			<p class="mb-6">Are you sure you want to log out?</p>

			<div class="flex justify-end space-x-4">
				<button
					type="button"
					class="secondary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
					onclick={() => (showLogoutConfirm = false)}
					disabled={isLoggingOut}
				>
					Cancel
				</button>
				<button
					type="button"
					class="primary px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200"
					onclick={logout}
					disabled={isLoggingOut}
				>
					{#if isLoggingOut}
						<span class="iconify lucide--rotate-cw animate-spin"></span>
					{:else}
						Logout
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
