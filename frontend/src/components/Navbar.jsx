import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-6 sticky top-0 z-50">
      <div className="flex-1">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-display font-bold text-xl text-primary">BookTracker</span>
        </Link>
      </div>
      <div className="flex-none gap-4">
        <div className="hidden sm:flex gap-2">
          <Link
            to="/dashboard"
            className={`btn btn-sm btn-ghost font-body ${location.pathname === '/dashboard' ? 'btn-active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/books"
            className={`btn btn-sm btn-ghost font-body ${location.pathname === '/books' ? 'btn-active' : ''}`}
          >
            My Books
          </Link>
        </div>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-9">
              <span className="text-sm font-body font-medium">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
            <li className="menu-title font-body text-xs">{user?.email}</li>
            <li>
              <Link to="/dashboard" className="font-body">Dashboard</Link>
            </li>
            <li>
              <Link to="/books" className="font-body">My Books</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="font-body text-error">Sign Out</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
