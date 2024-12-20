import { pb } from '../../clients/pocketbase'

export type ChatMessage = {
	message: string
	isUser: boolean
	created: string
}

export type Conversation = {
	id: string
	user: string
	title: string
	messages: ChatMessage[]
	created: string
	updated: string
	isPublic: boolean
	shareId?: string
}

export class PocketbaseService {
	static async createConversation(userId: string, firstMessage: string): Promise<Conversation> {
		const conversation = await pb.collection<Conversation>('conversations').create({
			user: userId,
			title: firstMessage.slice(0, 100) + (firstMessage.length > 100 ? '...' : ''),
			messages: [
				{
					message: firstMessage,
					isUser: true,
					created: new Date().toISOString()
				}
			],
			isPublic: false
		})
		console.log('Created conversation:', conversation.id)
		return conversation
	}

	static async updateConversation(id: string, messages: ChatMessage[]): Promise<Conversation> {
		const conversation = await pb.collection<Conversation>('conversations').update(id, {
			messages,
			updated: new Date().toISOString()
		})
		console.log('Updated conversation:', conversation.id)
		return conversation
	}

	static async getConversations(userId: string): Promise<Conversation[]> {
		return await pb.collection('conversations').getFullList({
			filter: `user = "${userId}"`,
			sort: '-updated'
		})
	}

	static async shareConversation(id: string): Promise<Conversation> {
		const shareId = Math.random().toString(36).substring(2, 15)

		return await pb.collection('conversations').update(id, {
			isPublic: true,
			shareId,
			updated: new Date().toISOString()
		})
	}

	static async unshareConversation(id: string): Promise<Conversation> {
		return await pb.collection('conversations').update(id, {
			isPublic: false,
			shareId: null,
			updated: new Date().toISOString()
		})
	}

	static async getSharedConversation(shareId: string): Promise<Conversation | null> {
		try {
			const records = await pb.collection<Conversation>('conversations').getFullList({
				filter: `shareId = "${shareId}" && isPublic = true`
			})

			if (records.length === 0) {
				return null
			}

			return records[0]
		} catch (error) {
			console.error('Error fetching shared conversation:', error)
			return null
		}
	}
}
