import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// Runs an async loader once on mount (and whenever a dep in `deps` changes).
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let alive = true
    loader()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (alive)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Request failed',
          })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
