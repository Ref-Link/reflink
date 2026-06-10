import type { messagingApi } from '@line/bot-sdk'
import type { AgeGroup } from '@/types/domain'
import { AGE_GROUP_LABELS } from '@/types/domain'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`
}

function formatStartTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export interface MatchNotificationParams {
  assignmentId: string
  title: string
  match_date: string
  start_time: string
  venue: string
  age_group: string
  compensation: number | null
  role: 'referee' | 'assistant_referee'
}

export function buildMatchNotificationMessage(
  params: MatchNotificationParams
): messagingApi.FlexMessage {
  const { assignmentId, title, match_date, start_time, venue, age_group, compensation, role } = params

  const dateFormatted = formatMatchDate(match_date)
  const timeFormatted = formatStartTime(start_time)

  const bodyContents: messagingApi.FlexComponent[] = [
    {
      type: 'text',
      text: role === 'referee' ? '【主審募集】' : '【副審募集】',
      weight: 'bold',
      size: 'sm',
      color: '#1DB446',
    } as messagingApi.FlexText,
    {
      type: 'text',
      text: title,
      weight: 'bold',
      size: 'md',
      wrap: true,
      margin: 'sm',
    } as messagingApi.FlexText,
    {
      type: 'text',
      text: `${dateFormatted} ${timeFormatted}`,
      size: 'sm',
      color: '#555555',
      margin: 'sm',
    } as messagingApi.FlexText,
    {
      type: 'text',
      text: venue,
      size: 'sm',
      color: '#555555',
      margin: 'xs',
    } as messagingApi.FlexText,
    {
      type: 'text',
      text: `年代: ${AGE_GROUP_LABELS[age_group as AgeGroup] ?? age_group}`,
      size: 'sm',
      color: '#555555',
      margin: 'xs',
    } as messagingApi.FlexText,
  ]

  if (compensation != null) {
    bodyContents.push({
      type: 'text',
      text: `報酬: ${compensation.toLocaleString()}円`,
      size: 'sm',
      color: '#555555',
      margin: 'xs',
    } as messagingApi.FlexText)
  }

  const contents: messagingApi.FlexBubble = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: bodyContents,
    } as messagingApi.FlexBox,
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '参加',
            data: `action=accept&assignmentId=${assignmentId}`,
          },
          style: 'primary',
          flex: 1,
        } as messagingApi.FlexButton,
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '辞退',
            data: `action=decline&assignmentId=${assignmentId}`,
          },
          style: 'secondary',
          flex: 1,
        } as messagingApi.FlexButton,
      ],
    } as messagingApi.FlexBox,
  }

  return {
    type: 'flex',
    altText: `${role === 'referee' ? '【主審募集】' : '【副審募集】'}${title} ${dateFormatted}`,
    contents,
  }
}
