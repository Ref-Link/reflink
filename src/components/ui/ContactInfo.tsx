import { formatPhoneNumber } from '@/lib/phone'

interface ContactInfoProps {
  readonly phone: string | null
  readonly name?: string | null
}

export function ContactInfo({ phone, name }: ContactInfoProps) {
  if (!phone) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">連絡先未登録</span>
  }

  const formatted = formatPhoneNumber(phone)

  return (
    <div className="space-y-0.5">
      {name && (
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</p>
      )}
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-700 dark:text-gray-300">{formatted}</span>
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
      >
        📞 発信
      </a>
      <a
        href={`sms:${phone}`}
        className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
      >
        💬 SMS
      </a>
    </div>
    </div>
  )
}
