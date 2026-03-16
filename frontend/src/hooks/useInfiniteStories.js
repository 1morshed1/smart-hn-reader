import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchStories } from '../api/stories'

export function useInfiniteStories(feed) {
  return useInfiniteQuery({
    queryKey: ['stories', feed],
    queryFn: ({ pageParam }) => fetchStories({ feed, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
  })
}
