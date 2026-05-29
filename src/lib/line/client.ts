import { messagingApi, validateSignature } from '@line/bot-sdk'

const channelSecret = process.env.LINE_CHANNEL_SECRET!
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!

const client = new messagingApi.MessagingApiClient({
  channelAccessToken,
})

export function verifySignature(body: string, signature: string): boolean {
  return validateSignature(body, channelSecret, signature)
}

export async function pushMessage(
  to: string,
  messages: messagingApi.Message[]
): Promise<void> {
  await client.pushMessage({ to, messages })
}

export async function replyMessage(
  replyToken: string,
  messages: messagingApi.Message[]
): Promise<void> {
  await client.replyMessage({ replyToken, messages })
}

export async function pushTextMessage(to: string, text: string): Promise<void> {
  await pushMessage(to, [{ type: 'text', text }])
}

export async function replyTextMessage(replyToken: string, text: string): Promise<void> {
  await replyMessage(replyToken, [{ type: 'text', text }])
}

export async function pushFlexMessage(
  to: string,
  altText: string,
  contents: Record<string, unknown>
): Promise<void> {
  await pushMessage(to, [
    {
      type: 'flex',
      altText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: contents as any,
    },
  ])
}

export { client as lineClient }
