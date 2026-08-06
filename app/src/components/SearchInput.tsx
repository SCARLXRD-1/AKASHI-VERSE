import { useEffect, useRef, useState, forwardRef } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  autoFocus?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'topbar' | 'page' | 'inline'
  showIcon?: boolean
  clearable?: boolean
  debounceMs?: number
  onDebouncedChange?: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar...',
  ariaLabel = 'Buscar',
  autoFocus = false,
  size = 'md',
  variant = 'page',
  showIcon = true,
  clearable = true,
  debounceMs = 300,
  onDebouncedChange,
  onKeyDown,
}, ref) => {
  const [focused, setFocused] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    setShowClear(clearable && value.length > 0 && focused)
  }, [value, focused, clearable])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    if (onDebouncedChange) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onDebouncedChange(newValue)
      }, debounceMs)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault()
      onSubmit(value.trim())
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      inputRef.current?.blur()
      if (clearable) onChange('')
    }
    onKeyDown?.(e)
  }

  const handleClear = (_e: React.MouseEvent<HTMLButtonElement>) => {
    onChange('')
    inputRef.current?.focus()
  }

  const baseClasses = 'search-input'
  const sizeClasses = {
    sm: 'search-input--sm',
    md: 'search-input--md',
    lg: 'search-input--lg',
  }
  const variantClasses = {
    topbar: 'search-input--topbar',
    page: 'search-input--page',
    inline: 'search-input--inline',
  }
  const stateClasses = [
    focused && 'search-input--focused',
    value.length > 0 && 'search-input--has-value',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses}`}
      role="search"
      onMouseEnter={() => setShowClear(clearable && value.length > 0)}
      onMouseLeave={() => !focused && setShowClear(false)}
    >
      {showIcon && (
        <svg className="search-input__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )}
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="focusable"
        data-nav
      />
      {showClear && value.length > 0 && (
        <button
          type="button"
          className="search-input__clear"
          onClick={handleClear}
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Limpiar búsqueda"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      <span className="search-input__hint" aria-hidden="true">
        <kbd>⌘</kbd><kbd>K</kbd>
      </span>
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

export default SearchInput
export type { SearchInputProps }