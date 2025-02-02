<script lang="ts">
	import { page } from '$app/state'
</script>

<div class="container max-w-4xl mx-auto px-4 pt-24 pb-12">
	<div class="flex flex-col md:flex-row gap-8">
		<!-- Sidebar -->
		<aside class="flex md:flex-col gap-2 md:w-16">
			<a
				href="/account"
				class="flex items-center justify-center w-full p-3 rounded-xl transition duration-200 hover:scale-[1.02] active:scale-[0.98] border border-form-border"
				class:bg-primary-card-bg={page.url.pathname === '/account'}
				aria-label="Profile"
			>
				<span class="iconify lucide--user"></span>
			</a>

			<a
				href="/account/chats"
				class="flex items-center justify-center w-full p-3 rounded-xl transition duration-200 hover:scale-[1.02] active:scale-[0.98] border border-form-border"
				class:bg-primary-card-bg={page.url.pathname === '/account/chats'}
				aria-label="Chats"
			>
				<span class="iconify lucide--message-square-text"></span>
			</a>
		</aside>

		<slot />
	</div>
</div>
