import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FeedPage from './pages/FeedPage'
import StoryPage from './pages/StoryPage'
import BookmarksPage from './pages/BookmarksPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
