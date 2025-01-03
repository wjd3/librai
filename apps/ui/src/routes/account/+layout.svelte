<script lang="ts">
	import { page } from '$app/state'
</script>

<div class="container max-w-4xl mx-auto px-4 pt-24 pb-12">
	<div class="flex flex-col md:flex-row gap-8">
		<!-- Sidebar -->
		<aside class="flex md:flex-col gap-2 md:w-16">
			<a
				href="/account"
				class="flex items-center justify-center w-full px-4 py-3 rounded-lg transition-colors hover:bg-primary-card-bg duration-300"
				class:bg-primary-card-bg={page.url.pathname === '/account'}
				aria-label="Profile"
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
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</a>

			<a
				href="/account/conversations"
				class="flex items-center justify-center w-full px-4 py-3 rounded-lg transition-colors hover:bg-primary-card-bg duration-300"
				class:bg-primary-card-bg={page.url.pathname === '/account/conversations'}
				aria-label="Conversations"
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
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				</svg>
			</a>
		</aside>

		<slot />
	</div>
</div>
