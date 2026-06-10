import React, { useState, useEffect } from 'react';

const EMPTY_FORM = {
  title: '',
  author: '',
  genre: '',
  status: 'want_to_read',
  rating: '',
  notes: '',
};

export default function BookModal({ isOpen, onClose, onSubmit, editBook = null }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editBook) {
      setForm({
        title: editBook.title || '',
        author: editBook.author || '',
        genre: editBook.genre || '',
        status: editBook.status || 'want_to_read',
        rating: editBook.rating || '',
        notes: editBook.notes || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [editBook, isOpen]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Title is required');
    if (!form.author.trim()) return setError('Author is required');
    if (form.rating !== '' && (Number(form.rating) < 1 || Number(form.rating) > 5)) return setError('Rating must be 1-5');

    setLoading(true);
    try {
      await onSubmit({
        ...form,
        rating: form.rating ? parseInt(form.rating) : null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg font-body">
        <h3 className="font-display text-xl font-semibold mb-4">
          {editBook ? 'Edit Book' : 'Add New Book'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label" htmlFor="title">
              <span className="label-text font-medium">Title *</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Book title"
              className="input input-bordered w-full"
              aria-required="true"
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="author">
              <span className="label-text font-medium">Author *</span>
            </label>
            <input
              id="author"
              name="author"
              type="text"
              value={form.author}
              onChange={handleChange}
              placeholder="Author name"
              className="input input-bordered w-full"
              aria-required="true"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label" htmlFor="genre">
                <span className="label-text font-medium">Genre</span>
              </label>
              <input
                id="genre"
                name="genre"
                type="text"
                value={form.genre}
                onChange={handleChange}
                placeholder="e.g. Fiction"
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="status">
                <span className="label-text font-medium">Status</span>
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="want_to_read">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label" htmlFor="rating">
              <span className="label-text font-medium">Rating (1–5)</span>
            </label>
            <input
              id="rating"
              name="rating"
              type="number"
              value={form.rating}
              onChange={handleChange}
              placeholder="Leave blank if unrated"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="notes">
              <span className="label-text font-medium">Notes</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Your thoughts..."
              className="textarea textarea-bordered w-full h-24 resize-none"
            />
          </div>

          {error && (
            <div className="alert alert-error py-2" role="alert">
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="modal-action mt-4">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : null}
              {editBook ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
