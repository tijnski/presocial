import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FeedPage from './pages/FeedPage';
import TrendingPage from './pages/TrendingPage';
import CommunitiesPage from './pages/CommunitiesPage';
import PostPage from './pages/PostPage';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<FeedPage />} />
        <Route path="trending" element={<TrendingPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="post/:id" element={<PostPage />} />
      </Route>
    </Routes>
  );
}

export default App;
