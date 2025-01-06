import { error } from '@sveltejs/kit'
import { PocketbaseService } from '$lib/server/services/pocketbaseService'
import { PUBLIC_APP_TITLE, PUBLIC_APP_URL } from '$env/static/public'
import { getThemeColorValues } from '$lib/utils/color'

const generateOgImageUrl = async (title: string, userMessage: string, aiMessage: string) => {
	const { light: lightTextColor } = getThemeColorValues('text-color')
	const { light: lightUserBubbleBg } = getThemeColorValues('user-bubble-bg')
	const { light: lightBotBubbleBg } = getThemeColorValues('bot-bubble-bg')
	const { light: lightPageBg } = getThemeColorValues('page-bg')
	const { light: lightPrimaryCardBg } = getThemeColorValues('primary-card-bg')

	const ogImageUrl = new URL('https://og.tailgraph.com/og')
	ogImageUrl.searchParams.set('fontFamily', 'system-ui')
	ogImageUrl.searchParams.set('title', `${title} | ${PUBLIC_APP_TITLE || 'Librai UI'}`)
	ogImageUrl.searchParams.set('titleTailwind', `text-4xl font-bold text-[${lightTextColor}] mb-6`)
	ogImageUrl.searchParams.set(
		'text',
		userMessage.slice(0, 100) + (userMessage.length > 100 ? '...' : '')
	)
	ogImageUrl.searchParams.set(
		'textTailwind',
		`text-lg text-[${lightTextColor}] bg-[${lightUserBubbleBg}] rounded-lg p-4 mb-4 w-fit mx-auto`
	)
	ogImageUrl.searchParams.set(
		'footer',
		aiMessage.slice(0, 150) + (aiMessage.length > 150 ? '...' : '')
	)
	ogImageUrl.searchParams.set(
		'footerTailwind',
		`text-lg text-[${lightTextColor}] bg-[${lightBotBubbleBg}] rounded-lg p-4 w-full truncate`
	)
	ogImageUrl.searchParams.set('bgTailwind', `bg-[${lightPageBg}]`)
	ogImageUrl.searchParams.set(
		'containerTailwind',
		`flex flex-col items-start justify-center p-16 bg-[${lightPrimaryCardBg}] rounded-lg`
	)
	return ogImageUrl.toString()
}

export const load = async ({ params }) => {
	try {
		const conversation = await PocketbaseService.getSharedConversation(params.id)
		if (!conversation) {
			throw error(404, 'Conversation not found or no longer shared.')
		}

		const userMessage = conversation.messages.find((m) => m.isUser)?.message || ''
		const aiMessage = conversation.messages.find((m) => !m.isUser)?.message || ''
		const ogImageUrl = await generateOgImageUrl(conversation.title, userMessage, aiMessage)

		return {
			conversation,
			meta: {
				title: conversation.title,
				description: userMessage.slice(0, 200) + '...',
				ogImage: ogImageUrl,
				ogUrl: `${PUBLIC_APP_URL}/share/${params.id}`
			}
		}
	} catch (err) {
		console.error('Error loading shared conversation:', err)
		throw error(500, 'Error loading conversation.')
	}
}
