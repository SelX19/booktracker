import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBooks, getStats } from '../services/api';

const StatCard = ({ label, value, icon, colorClass }) => (
  <div className={`card border ${colorClass} bg-base-100`}>
    <div className="card-body p-5 flex-row items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-display text-3xl font-bold">{value}</p>
        <p className="font-body text-sm text-base-content/60">{label}</p>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, booksRes] = await Promise.all([getStats(), getBooks()]);
        setStats(statsRes.data);
        setRecentBooks(booksRes.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-base-content">
          Welcome back, <span className="text-primary">{user?.username}</span> 👋
        </h1>
        <p className="font-body text-base-content/60 mt-1">Here's your reading overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Books" value={stats?.total || 0} icon="📚" colorClass="border-base-300" />
        <StatCard label="Want to Read" value={stats?.want_to_read || 0} icon="🔖" colorClass="border-accent/30" />
        <StatCard label="Reading" value={stats?.reading || 0} icon="📖" colorClass="border-secondary/30" />
        <StatCard label="Finished" value={stats?.finished || 0} icon="✅" colorClass="border-primary/30" />
      </div>

      {stats?.avg_rating && (
        <div className="alert bg-base-200 border border-base-300 mb-8">
          <span className="text-2xl">⭐</span>
          <span className="font-body">Your average rating: <strong className="font-display">{stats.avg_rating} / 5</strong></span>
        </div>
      )}

      {/* Recent books */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold">Recent Books</h2>
        <Link to="/books" className="btn btn-ghost btn-sm font-body">View all →</Link>
      </div>

      {recentBooks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-base-300 rounded-2xl">
          <span className="text-5xl">📭</span>
          <p className="font-display text-xl mt-4 text-base-content/70">No books yet</p>
          <p className="font-body text-base-content/50 mt-1">Head to My Books to start tracking</p>
          <Link to="/books" className="btn btn-primary mt-4 font-body">Add Your First Book</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentBooks.map((book) => (
            <div key={book.id} className="card bg-base-200 border border-base-300">
              <div className="card-body p-4">
                <h3 className="font-display font-semibold text-base-content truncate">{book.title}</h3>
                <p className="font-body text-sm text-base-content/60">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
