import { json } from '@sveltejs/kit'
import { pb } from '$lib/server/pocketbase'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const conversation = await pb.collection('conversations').getOne(params.id)
		return json(conversation)
	} catch (error) {
		console.error('Error fetching conversation:', error)
		return json({ error: 'Error fetching conversation' }, { status: 500 })
	}
}

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const userId = locals.user?.id
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		await pb.collection('conversations').delete(params.id)
		return json({ success: true })
	} catch (error) {
		console.error('Error deleting conversation:', error)
		return json({ error: 'Error deleting conversation' }, { status: 500 })
	}
}
