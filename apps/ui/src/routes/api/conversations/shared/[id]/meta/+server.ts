import { PocketbaseService } from '$lib/server/services/pocketbaseService'
import { error } from '@sveltejs/kit'
import { PUBLIC_APP_URL } from '$env/static/public'

export const GET = async ({ params, setHeaders }) => {
	try {
		const conversation = await PocketbaseService.getSharedConversation(params.id)
		if (!conversation) {
			throw error(404, 'Conversation not found')
		}

		// Get first message from user and first response from AI
		const userMessage = conversation.messages.find((m) => m.isUser)?.message || ''
		const aiMessage = conversation.messages.find((m) => !m.isUser)?.message || ''

		// Create the OG image URL with TailGraph
		const ogImageUrl = new URL('https://og.tailgraph.com/og')
		ogImageUrl.searchParams.set('fontFamily', 'Inter')
		ogImageUrl.searchParams.set('title', conversation.title)
		ogImageUrl.searchParams.set('titleTailwind', 'text-4xl font-bold text-white mb-4')
		ogImageUrl.searchParams.set(
			'text',
			userMessage.slice(0, 100) + (userMessage.length > 100 ? '...' : '')
		)
		ogImageUrl.searchParams.set('textTailwind', 'text-lg text-gray-200 mb-2')
		ogImageUrl.searchParams.set(
			'footer',
			aiMessage.slice(0, 150) + (aiMessage.length > 150 ? '...' : '')
		)
		ogImageUrl.searchParams.set('footerTailwind', 'text-sm text-gray-300')
		ogImageUrl.searchParams.set('bgTailwind', 'bg-gradient-to-br from-gray-900 to-gray-800')
		ogImageUrl.searchParams.set(
			'containerTailwind',
			'flex flex-col items-start justify-center px-16'
		)

		// Return meta tags
		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<title>${conversation.title}</title>
					<meta property="og:title" content="${conversation.title}" />
					<meta property="og:description" content="${userMessage.slice(0, 200)}..." />
					<meta property="og:image" content="${ogImageUrl.toString()}" />
					<meta property="og:url" content="${PUBLIC_APP_URL}/share/${params.id}" />
					<meta property="og:type" content="website" />
					<meta name="twitter:card" content="summary_large_image" />
					<meta name="twitter:title" content="${conversation.title}" />
					<meta name="twitter:description" content="${userMessage.slice(0, 200)}..." />
					<meta name="twitter:image" content="${ogImageUrl.toString()}" />
					<meta http-equiv="refresh" content="0;url=${PUBLIC_APP_URL}/share/${params.id}">
				</head>
			</html>
		`

		setHeaders({
			'Content-Type': 'text/html'
		})

		return new Response(html)
	} catch (err) {
		console.error('Error generating meta tags:', err)
		throw error(500, 'Error generating meta tags')
	}
}
