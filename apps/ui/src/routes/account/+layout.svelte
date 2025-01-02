<script lang="ts">
	import { page } from '$app/stores'
</script>

<div class="container max-w-4xl mx-auto px-4 py-8">
	<div class="flex flex-col md:flex-row gap-8">
		<!-- Sidebar -->
		<aside class="w-full md:w-64 space-y-2">
			<a
				href="/account"
				class="block w-full px-4 py-2 rounded-lg transition-colors"
				class:bg-primary-card-bg={$page.url.pathname === '/account'}
			>
				Profile
			</a>
			<a
				href="/account/conversations"
				class="block w-full px-4 py-2 rounded-lg transition-colors"
				class:bg-primary-card-bg={$page.url.pathname === '/account/conversations'}
			>
				Conversations
			</a>
		</aside>

		<!-- Main content -->
		<main class="flex-1">
			<slot />
		</main>
	</div>
</div>
