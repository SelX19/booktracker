import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.username || !form.email || !form.password) return setError('All fields are required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await registerApi({ username: form.username, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
          <p className="font-body text-base-content/60 mt-1">Start tracking your reading</p>
        </div>

        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-8">
            <h2 className="font-display text-xl font-semibold mb-6">Create Account</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label" htmlFor="username">
                  <span className="label-text font-body font-medium">Username</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="bookworm42"
                  className="input input-bordered w-full font-body"
                  aria-label="Username"
                />
              </div>

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
                  placeholder="Min. 6 characters"
                  className="input input-bordered w-full font-body"
                  aria-label="Password"
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="confirmPassword">
                  <span className="label-text font-body font-medium">Confirm Password</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="input input-bordered w-full font-body"
                  aria-label="Confirm Password"
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
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Create Account'}
              </button>
            </form>

            <div className="divider font-body text-sm">Already have an account?</div>
            <Link to="/login" className="btn btn-outline btn-secondary w-full font-body">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
