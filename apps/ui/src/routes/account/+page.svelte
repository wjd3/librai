<script lang="ts">
	import { currentUser, isAuthLoading } from '$lib/stores'
	import { authToken } from '$lib/stores/auth'
	import { fade } from 'svelte/transition'
	import { quartInOut } from 'svelte/easing'
	import DOMPurify from 'dompurify'

	let showLogoutConfirm = $state(false)
	let isLoggingOut = $state(false)
	let isUpdating = $state(false)
	let showChangePassword = $state(false)
	let showChangeEmail = $state(false)

	// Profile form
	let name = $state($currentUser?.name || '')
	let error = $state('')
	let success = $state('')

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
			const cleanName = DOMPurify.sanitize(name)

			const response = await fetch('/api/auth/update', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$authToken}`
				},
				body: JSON.stringify({ name: cleanName })
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

	async function changePassword(e: Event) {
		e.preventDefault()
		error = ''
		success = ''
		isUpdating = true

		try {
			if (newPassword !== passwordConfirm) {
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
					oldPassword,
					password: newPassword,
					passwordConfirm
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
	<div class="bg-primary-card-bg rounded-lg shadow-sm">
		<div class="px-6 py-4 border-b border-form-border">
			<h2 class="text-2xl font-medium">Profile Settings</h2>
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
						class="input w-full"
						maxlength="700"
						placeholder="Enter your name"
					/>
				</div>

				<!-- Email Field -->
				<div class="space-y-2">
					<div class="flex items-center justify-between p-3 bg-page-bg rounded-lg">
						<span class="opacity-90">{$currentUser?.email}</span>
						<button
							type="button"
							class="secondary text-sm px-3"
							onclick={() => (showChangeEmail = true)}
							disabled={isUpdating}
						>
							Change Email
						</button>
					</div>
				</div>

				<!-- Password Field -->
				<div class="space-y-2">
					<div class="flex items-center justify-between p-3 bg-page-bg rounded-lg">
						<span class="opacity-90">••••••••</span>
						<button
							type="button"
							class="secondary text-sm px-3"
							onclick={() => (showChangePassword = true)}
							disabled={isUpdating}
						>
							Change Password
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded">{error}</p>
				{/if}

				{#if success}
					<p class="text-green-500 text-sm bg-green-500/10 px-3 py-2 rounded">{success}</p>
				{/if}

				<div class="flex items-center justify-between pt-4 border-t border-form-border">
					<button
						type="button"
						class="secondary px-4 text-sm"
						onclick={() => (showLogoutConfirm = true)}
						disabled={isUpdating}
					>
						<div class="flex items-center space-x-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="!fill-none"
							>
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
								<polyline points="16 17 21 12 16 7" />
								<line x1="21" x2="9" y1="12" y2="12" />
							</svg>
							<span>Logout</span>
						</div>
					</button>

					<button type="submit" class="primary px-4" disabled={isUpdating}>
						<div class="flex items-center space-x-2">
							{#if isUpdating}
								<svg
									class="!fill-none animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
									<path d="M21 3v5h-5" />
								</svg>
								<span>Saving...</span>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="!fill-none"
								>
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
									<polyline points="17 21 17 13 7 13 7 21" />
									<polyline points="7 3 7 8 15 8" />
								</svg>
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
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl mb-4">Change Password</h2>

			<form onsubmit={changePassword} class="space-y-4">
				<div>
					<label for="oldPassword" class="block mb-1">Current Password</label>
					<input
						type="password"
						id="oldPassword"
						bind:value={oldPassword}
						required
						class="input w-full"
						minlength="8"
					/>
				</div>

				<div>
					<label for="newPassword" class="block mb-1">New Password</label>
					<input
						type="password"
						id="newPassword"
						bind:value={newPassword}
						required
						class="input w-full"
						minlength="8"
					/>
				</div>

				<div>
					<label for="passwordConfirm" class="block mb-1">Confirm New Password</label>
					<input
						type="password"
						id="passwordConfirm"
						bind:value={passwordConfirm}
						required
						class="input w-full"
						minlength="8"
					/>
				</div>

				{#if error}
					<p class="text-red-500 text-sm">{error}</p>
				{/if}

				<div class="flex justify-end space-x-4">
					<button
						type="button"
						class="secondary"
						onclick={() => (showChangePassword = false)}
						disabled={isUpdating}
					>
						Cancel
					</button>
					<button type="submit" class="primary" disabled={isUpdating}>
						{#if isUpdating}
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
							>
								<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
								<path d="M21 3v5h-5" />
							</svg>
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
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl mb-4">Change Email</h2>

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
						class="secondary"
						onclick={() => (showChangeEmail = false)}
						disabled={isUpdating}
					>
						Cancel
					</button>
					<button type="submit" class="primary" disabled={isUpdating}>
						{#if isUpdating}
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
							>
								<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
								<path d="M21 3v5h-5" />
							</svg>
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
			class="bg-page-bg p-6 rounded-lg max-w-sm w-full mx-4 relative z-10"
			transition:fade={{ duration: 200, easing: quartInOut }}
		>
			<h2 class="text-xl mb-4">Confirm Logout</h2>
			<p class="mb-6">Are you sure you want to log out?</p>

			<div class="flex justify-end space-x-4">
				<button
					type="button"
					class="secondary"
					onclick={() => (showLogoutConfirm = false)}
					disabled={isLoggingOut}
				>
					Cancel
				</button>
				<button type="button" class="primary" onclick={logout} disabled={isLoggingOut}>
					{#if isLoggingOut}
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
						>
							<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
							<path d="M21 3v5h-5" />
						</svg>
					{:else}
						Logout
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
