import PocketBase from 'pocketbase'
import { PUBLIC_POCKETBASE_URL } from '$env/static/public'

const url = PUBLIC_POCKETBASE_URL
export const pocketbaseClient = new PocketBase(url)
