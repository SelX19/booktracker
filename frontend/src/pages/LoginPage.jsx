import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Please fill in all fields');

    setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">📚</span>
          <h1 className="font-display text-3xl font-bold text-primary mt-3">BookTracker</h1>
          <p className="font-body text-base-content/60 mt-1">Your personal reading journey</p>
        </div>

        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-8">
            <h2 className="font-display text-xl font-semibold mb-6">Sign In</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text font-body font-medium">Email</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input input-bordered w-full font-body"
                  aria-label="Email Address"
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="password">
                  <span className="label-text font-body font-medium">Password</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input input-bordered w-full font-body"
                  aria-label="Password"
                />
              </div>

              {error && (
                <div className="alert alert-error py-2" role="alert">
                  <span className="text-sm font-body">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full font-body mt-2"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign In'}
              </button>
            </form>

            <div className="divider font-body text-sm">Don't have an account?</div>
            <Link to="/register" className="btn btn-outline btn-secondary w-full font-body">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
