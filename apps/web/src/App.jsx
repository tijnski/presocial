import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VoteProvider } from './context/VoteContext';
import { BookmarkProvider } from './context/BookmarkContext';
import Layout from './components/Layout';
import FeedPage from './pages/FeedPage';
import TrendingPage from './pages/TrendingPage';
import CommunitiesPage from './pages/CommunitiesPage';
import PostPage from './pages/PostPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import SavedPage from './pages/SavedPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <VoteProvider>
        <BookmarkProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<FeedPage />} />
              <Route path="trending" element={<TrendingPage />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="saved" element={<SavedPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="post/:id" element={<PostPage />} />
              <Route path="user/:userId" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BookmarkProvider>
      </VoteProvider>
    </AuthProvider>
  );
}

export default App;
