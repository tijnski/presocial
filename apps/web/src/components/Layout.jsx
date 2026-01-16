import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div className="flex">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="fixed w-72 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar p-4">
            <Sidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Right sidebar for trending - hidden on smaller screens */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="fixed w-80 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar p-4">
            <TrendingSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrendingSidebar() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Trending Topics</h3>
      <div className="space-y-2 text-sm text-gray-400">
        <p className="text-xs">Loading trending topics...</p>
      </div>
    </div>
  );
}

export default Layout;
