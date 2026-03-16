import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSummary, generateSummary } from '../api/summaries'

export function useSummary(storyId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['summary', storyId],
    queryFn: () => fetchSummary(storyId),
    enabled: !!storyId,
    staleTime: Infinity,
  })

  const mutation = useMutation({
    mutationFn: () => generateSummary(storyId),
    onSuccess: (data) => {
      queryClient.setQueryData(['summary', storyId], data)
    },
  })

  return { query, mutation }
}
