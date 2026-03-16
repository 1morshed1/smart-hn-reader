import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBookmarks, createBookmark, deleteBookmark } from '../api/bookmarks'

export function useBookmarks(search = '') {
  return useQuery({
    queryKey: ['bookmarks', search],
    queryFn: () => fetchBookmarks(search),
    staleTime: 60 * 1000,
  })
}

export function useAddBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBookmark,
    onMutate: async (newBookmark) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['bookmarks'] })
      queryClient.setQueriesData({ queryKey: ['bookmarks'] }, (old) => {
        if (!Array.isArray(old)) return old
        return [...old, { ...newBookmark, bookmarked_at: new Date().toISOString() }]
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBookmark,
    onMutate: async (storyId) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['bookmarks'] })
      queryClient.setQueriesData({ queryKey: ['bookmarks'] }, (old) => {
        if (!Array.isArray(old)) return old
        return old.filter((b) => b.story_id !== storyId)
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}
