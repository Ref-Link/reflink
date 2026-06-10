import { redirect } from 'next/navigation'

export default function HistoryPage() {
  redirect('/assignments?tab=history')
}
