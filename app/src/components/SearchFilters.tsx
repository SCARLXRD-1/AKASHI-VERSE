import { type KeyboardEvent, useMemo } from 'react'
import SearchInput from './SearchInput'

interface FilterOption {
  value: string
  label: string
}

interface SearchFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: (value: string) => void
  debouncedQuery?: string
  onDebouncedSearchChange?: (value: string) => void
  genre?: string
  onGenreChange?: (value: string) => void
  genres?: FilterOption[]
  contentType?: 'all' | 'movie' | 'series' | 'anime'
  onContentTypeChange?: (value: 'all' | 'movie' | 'series' | 'anime') => void
  year?: string
  onYearChange?: (value: string) => void
  years?: string[]
  animeType?: string
  onAnimeTypeChange?: (value: string) => void
  animeTypes?: FilterOption[]
  isAnime?: boolean
  loading?: boolean
  layout?: 'horizontal' | 'vertical' | 'compact'
  className?: string
}

const contentTypeOptions: FilterOption[] = [
  { value: 'all', label: 'Todo' },
  { value: 'movie', label: 'Películas' },
  { value: 'series', label: 'Series' },
  { value: 'anime', label: 'Anime' },
]

export default function SearchFilters({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  debouncedQuery,
  onDebouncedSearchChange,
  genre,
  onGenreChange,
  genres = [],
  contentType = 'all',
  onContentTypeChange,
  year,
  onYearChange,
  years = [],
  animeType,
  onAnimeTypeChange,
  animeTypes = [],
  isAnime = false,
  loading = false,
  layout = 'horizontal',
  className = '',
}: SearchFiltersProps) {
  const yearOptions = useMemo(() => 
    years.length > 0 ? years : Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i)),
    [years]
  )

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      e.preventDefault()
      onSearchSubmit(searchValue.trim())
    }
  }

  const baseClasses = 'search-filters'
  const layoutClasses = {
    horizontal: 'search-filters--horizontal',
    vertical: 'search-filters--vertical',
    compact: 'search-filters--compact',
  }

  return (
    <section className={`${baseClasses} ${layoutClasses[layout]} ${className}`} aria-label="Filtros de búsqueda">
      <div className="search-filters__row search-filters__row--search">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          onDebouncedChange={onDebouncedSearchChange}
          onSubmit={onSearchSubmit}
          placeholder={`Buscar${isAnime ? ' anime' : contentType !== 'all' ? ` en ${contentType}` : ''}...`}
          ariaLabel="Buscar contenido"
          autoFocus={!debouncedQuery}
          size={layout === 'compact' ? 'sm' : 'md'}
          variant="page"
          clearable={true}
          debounceMs={300}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="search-filters__row search-filters__row--filters">
        {layout !== 'compact' && (
          <>
            <label className="search-filters__select-wrap">
              <span className="search-filters__label">Tipo</span>
              <select
                value={contentType}
                onChange={(e) => onContentTypeChange?.(e.target.value as typeof contentType)}
                className="search-filters__select focusable"
                data-nav
                disabled={loading}
              >
                {contentTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            {genres.length > 0 && (
              <label className="search-filters__select-wrap">
                <span className="search-filters__label">Género</span>
                <select
                  value={genre || ''}
                  onChange={(e) => onGenreChange?.(e.target.value)}
                  className="search-filters__select focusable"
                  data-nav
                  disabled={loading}
                >
                  <option value="">Todos los géneros</option>
                  {genres.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </label>
            )}

            {yearOptions.length > 0 && (
              <label className="search-filters__select-wrap">
                <span className="search-filters__label">Año</span>
                <select
                  value={year || ''}
                  onChange={(e) => onYearChange?.(e.target.value)}
                  className="search-filters__select focusable"
                  data-nav
                  disabled={loading}
                >
                  <option value="">Cualquier año</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {isAnime && animeTypes.length > 0 && (
          <div className="search-filters__chips" role="group" aria-label="Tipo de anime">
            {animeTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`search-filters__chip ${animeType === type.value ? 'active' : ''}`}
                onClick={() => onAnimeTypeChange?.(type.value)}
                disabled={loading}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export type { SearchFiltersProps }