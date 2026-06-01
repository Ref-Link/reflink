type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

interface LoadingSpinnerProps {
  size?: Size
  label?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', label = '読み込み中...', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={['flex flex-col items-center justify-center gap-2', className].filter(Boolean).join(' ')}
    >
      <span
        aria-hidden
        className={[
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          SIZE_CLASSES[size],
        ].join(' ')}
      />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  )
}
