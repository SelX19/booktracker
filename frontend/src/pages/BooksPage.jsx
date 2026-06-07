import React, { useState, useEffect, useCallback } from 'react';
import { getBooks, createBook, updateBook, deleteBook } from '../services/api';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Want to Read', value: 'want_to_read' },
  { label: 'Reading', value: 'reading' },
  { label: 'Finished', value: 'finished' },
];

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBooks(filter || undefined);
      setBooks(res.data);
    } catch (err) {
      showToast('Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleCreate = async (data) => {
    await createBook(data);
    await fetchBooks();
    showToast('Book added successfully!');
  };

  const handleUpdate = async (data) => {
    await updateBook(editBook.id, data);
    await fetchBooks();
    showToast('Book updated!');
  };

  const handleDelete = async (id) => {
    try {
      await deleteBook(id);
      await fetchBooks();
      showToast('Book deleted');
      setDeleteConfirm(null);
    } catch {
      showToast('Failed to delete book', 'error');
    }
  };

  const openEdit = (book) => {
    setEditBook(book);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditBook(null);
  };

  return (
    <div className="min-h-screen bg-base-100 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">My Books</h1>
          <p className="font-body text-base-content/60 mt-1">{books.length} {books.length === 1 ? 'book' : 'books'} in your library</p>
        </div>
        <button
          onClick={() => { setEditBook(null); setModalOpen(true); }}
          className="btn btn-primary font-body gap-2"
          aria-label="Add new book"
        >
          <span>+</span> Add Book
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap" role="tablist" aria-label="Filter books by status">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn-sm font-body ${filter === f.value ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-base-300 rounded-2xl">
          <span className="text-5xl">📭</span>
          <p className="font-display text-xl mt-4 text-base-content/70">No books found</p>
          <p className="font-body text-base-content/50 mt-1">
            {filter ? 'Try a different filter' : 'Add your first book to get started'}
          </p>
          {!filter && (
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary mt-4 font-body"
            >
              Add Book
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={openEdit}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <BookModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={editBook ? handleUpdate : handleCreate}
        editBook={editBook}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box font-body max-w-sm">
            <h3 className="font-display text-lg font-semibold">Delete Book?</h3>
            <p className="mt-2 text-base-content/70">This action cannot be undone.</p>
            <div className="modal-action">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-error">Delete</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}></div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="toast toast-end toast-bottom z-50">
          <div className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'} font-body`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
