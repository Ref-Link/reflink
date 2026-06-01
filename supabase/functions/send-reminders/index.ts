import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') ?? ''

async function sendLineTextMessage(lineUserId: string, text: string): Promise<void> {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE push error: ${res.status} ${body}`)
  }
}

Deno.serve(async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      id,
      user_id,
      match_id,
      matches!inner(title, match_date, venue),
      users!inner(line_user_id)
    `)
    .eq('status', 'confirmed')
    .eq('matches.match_date', tomorrowStr)
    .is('reminder_sent_at', null)

  if (error) {
    console.error('Query error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  const errors: string[] = []

  for (const row of assignments ?? []) {
    const assignment = row as {
      id: string
      match_id: string
      matches: { title: string; match_date: string; venue: string }
      users: { line_user_id: string | null }
    }

    if (!assignment.users?.line_user_id) continue

    try {
      const text = `【リマインド】明日の試合があります: ${assignment.matches.title} ${assignment.matches.venue}`
      await sendLineTextMessage(assignment.users.line_user_id, text)

      await supabase
        .from('assignments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', assignment.id)

      sent++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${assignment.id}: ${msg}`)
      console.error(`Reminder failed for assignment ${assignment.id}:`, msg)
    }
  }

  return new Response(JSON.stringify({ sent, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
