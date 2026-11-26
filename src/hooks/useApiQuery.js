import { useCallback, useEffect, useState } from 'react'

/**
 * Hook declarativo para consultas à API com AbortController e recarregamento manual.
 */
export function useApiQuery(fetcher, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => {
    setTick((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const controller = new AbortController()
    let active = true

    Promise.resolve()
      .then(() => {
        if (!active || controller.signal.aborted) return null
        setLoading(true)
        setError(null)
        return fetcher(controller.signal)
      })
      .then((result) => {
        if (active && !controller.signal.aborted) {
          setData(result)
        }
      })
      .catch((err) => {
        if (active && err?.name !== 'AbortError' && !controller.signal.aborted) {
          setError(err)
        }
      })
      .finally(() => {
        if (active && !controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps])

  return { data, setData, loading: enabled ? loading : false, error, refetch }
}
