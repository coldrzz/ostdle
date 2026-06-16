import { useQuery } from '@tanstack/react-query';
import { gamesApi } from '@/services/gamesApi';
import { useDebounce } from './useDebounce';

export function useGameSearch(query: string, enabled = true) {
  const debouncedQuery = useDebounce(query, 400);

  return useQuery({
    queryKey: ['games', 'search', debouncedQuery],
    queryFn: () => gamesApi.search(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 30_000,
  });
}
