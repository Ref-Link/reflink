interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-lg border border-dashed border-gray-300 py-12 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
