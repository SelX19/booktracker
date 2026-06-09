import React from 'react';

const STATUS_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  finished: 'Finished',
};

const STATUS_CLASSES = {
  want_to_read: 'badge-outline border-accent text-accent',
  reading: 'badge-secondary',
  finished: 'badge-primary',
};

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5" aria-label={`Rating: ${rating || 0} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= (rating || 0) ? 'text-accent' : 'text-base-300'}>
        ★
      </span>
    ))}
  </div>
);

export default function BookCard({ book, onEdit, onDelete }) {
  return (
    <div className="book-card" data-testid="book-card">
      <div className="card-body p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="card-title font-display text-base-content text-lg leading-tight truncate">
              {book.title}
            </h3>
            <p className="text-sm text-base-content/70 font-body mt-0.5">{book.author}</p>
          </div>
          <span className={`badge badge-sm shrink-0 font-body ${STATUS_CLASSES[book.status]}`}>
            {STATUS_LABELS[book.status]}
          </span>
        </div>

        {book.genre && (
          <div className="mt-2">
            <span className="badge badge-ghost badge-sm font-mono text-xs">{book.genre}</span>
          </div>
        )}

        {book.rating && (
          <div className="mt-2">
            <StarRating rating={book.rating} />
          </div>
        )}

        {book.notes && (
          <p className="text-sm text-base-content/60 font-body mt-2 line-clamp-2 italic">
            &ldquo;{book.notes}&rdquo;
          </p>
        )}

        <div className="card-actions justify-end mt-3 gap-2">
          <button
            onClick={() => onEdit(book)}
            className="btn btn-ghost btn-xs font-body"
            aria-label={`Edit ${book.title}`}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(book.id)}
            className="btn btn-ghost btn-xs text-error font-body"
            aria-label={`Delete ${book.title}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
