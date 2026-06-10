import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookCard from '../src/components/BookCard';

const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

const baseBook = {
    id: 1,
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    genre: 'Technology',
    status: 'finished',
    rating: 4,
    notes: 'Essential reading for every developer.',
};

const renderCard = (overrides = {}) =>
    render(
        <BookCard
            book={{ ...baseBook, ...overrides }}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
        />
    );

describe('BookCard Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // RENDERING — CORE FIELDS
    // ==========================================
    describe('Core Field Rendering', () => {
        it('should render the book title', () => {
            renderCard();
            expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
        });

        it('should render the book author', () => {
            renderCard();
            expect(screen.getByText('Andrew Hunt')).toBeInTheDocument();
        });

        it('should render the status badge with correct label for finished status', () => {
            renderCard({ status: 'finished' });
            expect(screen.getByText('Finished')).toBeInTheDocument();
        });

        it('should render the "Want to Read" status badge label correctly', () => {
            renderCard({ status: 'want_to_read' });
            expect(screen.getByText('Want to Read')).toBeInTheDocument();
        });

        it('should render the "Reading" status badge label correctly', () => {
            renderCard({ status: 'reading' });
            expect(screen.getByText('Reading')).toBeInTheDocument();
        });
    });

    // ==========================================
    // OPTIONAL FIELD RENDERING
    // ==========================================
    describe('Optional Field Rendering', () => {
        it('should render the genre badge when a genre value is provided', () => {
            renderCard({ genre: 'Technology' });
            expect(screen.getByText('Technology')).toBeInTheDocument();
        });

        it('should not render a genre badge when genre is absent', () => {
            renderCard({ genre: undefined });
            expect(screen.queryByText('Technology')).not.toBeInTheDocument();
        });

        it('should render a star rating row when a numeric rating is provided', () => {
            renderCard({ rating: 4 });
            expect(screen.getByLabelText('Rating: 4 out of 5')).toBeInTheDocument();
        });

        it('should not render a star rating row when rating is null', () => {
            renderCard({ rating: null });
            expect(screen.queryByLabelText(/rating/i)).not.toBeInTheDocument();
        });

        it('should render the notes text when notes are provided', () => {
            renderCard({ notes: 'Essential reading for every developer.' });
            expect(screen.getByText(/essential reading/i)).toBeInTheDocument();
        });

        it('should not render notes text when notes field is empty', () => {
            renderCard({ notes: '' });
            expect(screen.queryByText(/essential reading/i)).not.toBeInTheDocument();
        });
    });

    // ==========================================
    // ACTION CALLBACKS
    // ==========================================
    describe('Action Button Callbacks', () => {
        it('should call onEdit with the full book object when Edit is clicked', () => {
            renderCard();
            fireEvent.click(screen.getByRole('button', { name: /edit the pragmatic programmer/i }));
            expect(mockOnEdit).toHaveBeenCalledTimes(1);
            expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        });

        it('should call onDelete with the book id when Delete is clicked', () => {
            renderCard();
            fireEvent.click(screen.getByRole('button', { name: /delete the pragmatic programmer/i }));
            expect(mockOnDelete).toHaveBeenCalledTimes(1);
            expect(mockOnDelete).toHaveBeenCalledWith(1);
        });

        it('should not call onDelete when Edit is clicked', () => {
            renderCard();
            fireEvent.click(screen.getByRole('button', { name: /edit the pragmatic programmer/i }));
            expect(mockOnDelete).not.toHaveBeenCalled();
        });

        it('should not call onEdit when Delete is clicked', () => {
            renderCard();
            fireEvent.click(screen.getByRole('button', { name: /delete the pragmatic programmer/i }));
            expect(mockOnEdit).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // ACCESSIBILITY
    // ==========================================
    describe('Accessibility', () => {
        it('should render with a data-testid of book-card', () => {
            renderCard();
            expect(screen.getByTestId('book-card')).toBeInTheDocument();
        });

        it('should apply accessible aria-labels on Edit and Delete buttons', () => {
            renderCard();
            expect(screen.getByLabelText(/edit the pragmatic programmer/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/delete the pragmatic programmer/i)).toBeInTheDocument();
        });
    });
});
