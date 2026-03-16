import { useQuery } from '@tanstack/react-query'
import { fetchStory } from '../api/stories'

export function useStory(id) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => fetchStory(id),
    enabled: !!id,
  })
}
