import { NextResponse } from 'next/server'
import { verifySignature, replyTextMessage } from '@/lib/line/client'
import { createAdminClient } from '@/lib/supabase/admin'

interface LinePostbackEvent {
  type: string
  replyToken?: string
  source?: { type: string; userId?: string }
  postback?: { data: string }
}

interface LineWebhookBody {
  destination: string
  events: LinePostbackEvent[]
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-line-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let body: LineWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ status: 'ok' })
  }

  const supabase = createAdminClient()

  for (const event of body.events ?? []) {
    if (
      event.type !== 'postback' ||
      !event.postback ||
      !event.source?.userId ||
      !event.replyToken
    ) {
      continue
    }

    const lineUserId = event.source.userId
    const replyToken = event.replyToken
    const postbackData = new URLSearchParams(event.postback.data)
    const action = postbackData.get('action')
    const assignmentId = postbackData.get('assignmentId')

    if (!action || !assignmentId || !['accept', 'decline'].includes(action)) {
      await replyTextMessage(replyToken, '処理できませんでした。管理者にお問い合わせください。')
      continue
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single()

    if (!userRecord) {
      await replyTextMessage(replyToken, '処理できませんでした。管理者にお問い合わせください。')
      continue
    }

    const { data: assignment } = await supabase
      .from('assignments')
      .select('id, user_id, status')
      .eq('id', assignmentId)
      .single()

    if (!assignment || assignment.user_id !== userRecord.id) {
      await replyTextMessage(replyToken, '処理できませんでした。管理者にお問い合わせください。')
      continue
    }

    if (assignment.status !== 'notified') {
      const alreadyReplied: Record<string, string> = {
        accepted: '✅ すでに参加のご回答を受け付けています。\n運営者が確定次第、改めてお知らせします。',
        declined: '✅ すでに辞退のご回答を受け付けています。\nまたの機会にご協力をお願いします。',
        confirmed: '✅ このアサインはすでに確定しています。\n当日の会場でお待ちしております。',
      }
      const msg = alreadyReplied[assignment.status] ?? '処理できませんでした。管理者にお問い合わせください。'
      await replyTextMessage(replyToken, msg)
      continue
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    await supabase
      .from('assignments')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('id', assignmentId)

    const replyText =
      action === 'accept'
        ? '参加を受け付けました。\n運営者が確定次第、改めてお知らせします。'
        : '辞退を受け付けました。\nまたの機会にご協力をお願いします。'

    await replyTextMessage(replyToken, replyText)
  }

  return NextResponse.json({ status: 'ok' })
}
