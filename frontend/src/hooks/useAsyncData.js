import { useEffect, useState } from 'react';

export function useAsyncData(loader, deps = [], intervalMs = 0, initialData = null) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setError('');
      setData(await loader());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    if (!intervalMs) return undefined;
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, deps);

  return { data, error, loading, refresh };
}
