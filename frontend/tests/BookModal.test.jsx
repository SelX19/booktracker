import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookModal from '../src/components/BookModal';

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();

const renderModal = (props = {}) =>
    render(
        <BookModal
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            editBook={props.editBook || null}
        />
    );

describe('BookModal Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // RENDERING — ADD MODE
    // ==========================================
    describe('Add Mode Rendering (editBook = null)', () => {
        it('should render the "Add New Book" heading when no editBook is passed', () => {
            renderModal();
            expect(screen.getByText('Add New Book')).toBeInTheDocument();
        });

        it('should render title, author, genre, status, rating, and notes input fields', () => {
            renderModal();
            expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
        });

        it('should render the "Add Book" submit button in add mode', () => {
            renderModal();
            expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument();
        });

        it('should default the status select field to "want_to_read"', () => {
            renderModal();
            expect(screen.getByLabelText(/status/i)).toHaveValue('want_to_read');
        });
    });

    // ==========================================
    // RENDERING — EDIT MODE
    // ==========================================
    describe('Edit Mode Rendering (editBook supplied)', () => {
        const existingBook = {
            id: 7,
            title: 'Dune',
            author: 'Frank Herbert',
            genre: 'Sci-Fi',
            status: 'finished',
            rating: 5,
            notes: 'A masterpiece',
        };

        it('should render the "Edit Book" heading when an editBook is passed', () => {
            renderModal({ editBook: existingBook });
            expect(screen.getByText('Edit Book')).toBeInTheDocument();
        });

        it('should pre-populate all form fields with the existing book values', () => {
            renderModal({ editBook: existingBook });
            expect(screen.getByLabelText(/title/i)).toHaveValue('Dune');
            expect(screen.getByLabelText(/author/i)).toHaveValue('Frank Herbert');
            expect(screen.getByLabelText(/genre/i)).toHaveValue('Sci-Fi');
            expect(screen.getByLabelText(/status/i)).toHaveValue('finished');
            expect(screen.getByLabelText(/notes/i)).toHaveValue('A masterpiece');
        });

        it('should render the "Save Changes" submit button in edit mode', () => {
            renderModal({ editBook: existingBook });
            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        });
    });

    // ==========================================
    // HIDDEN / NOT RENDERED
    // ==========================================
    describe('Closed State', () => {
        it('should render nothing if isOpen is false', () => {
            render(
                <BookModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} editBook={null} />
            );
            expect(screen.queryByText('Add New Book')).not.toBeInTheDocument();
        });
    });

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    describe('Form Validation', () => {
        it('should display an error if the title field is empty on submission', async () => {
            renderModal();
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Some Author' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
        });

        it('should display an error if the author field is empty on submission', async () => {
            renderModal();
            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Some Title' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Author is required');
        });

        it('should reject a rating value above 5 (Above Boundary)', async () => {
            renderModal();
            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Title' } });
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Author' } });
            fireEvent.change(screen.getByLabelText(/rating/i), { target: { value: '6' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Rating must be 1-5');
        });

        it('should reject a rating value below 1 (Below Boundary)', async () => {
            renderModal();
            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Title' } });
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Author' } });
            fireEvent.change(screen.getByLabelText(/rating/i), { target: { value: '0' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Rating must be 1-5');
        });

        it('should not call onSubmit if validation fails', async () => {
            renderModal();
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));
            await screen.findByRole('alert');
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // SUCCESSFUL SUBMISSION
    // ==========================================
    describe('Successful Submission Flow', () => {
        it('should call onSubmit with correct payload when all required fields are valid', async () => {
            mockOnSubmit.mockResolvedValueOnce();
            renderModal();

            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Dune' } });
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Frank Herbert' } });
            fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'reading' } });
            fireEvent.change(screen.getByLabelText(/rating/i), { target: { value: '5' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({ title: 'Dune', author: 'Frank Herbert', rating: 5 })
                );
            });
        });

        it('should pass null rating when rating field is left blank', async () => {
            mockOnSubmit.mockResolvedValueOnce();
            renderModal();

            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Dune' } });
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Frank Herbert' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: null })
                );
            });
        });

        it('should call onClose after successful submission', async () => {
            mockOnSubmit.mockResolvedValueOnce();
            renderModal();

            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Dune' } });
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Frank Herbert' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));

            await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
        });
    });

    // ==========================================
    // CANCEL / CLOSE BEHAVIOUR
    // ==========================================
    describe('Cancel & Close Behaviour', () => {
        it('should call onClose when the Cancel button is clicked', () => {
            renderModal();
            fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should display a server error message if the onSubmit promise rejects', async () => {
            mockOnSubmit.mockRejectedValueOnce({
                response: { data: { error: 'Failed to save book' } },
            });
            renderModal();

            fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Dune' } });
            fireEvent.change(screen.getByLabelText(/author/i), { target: { value: 'Frank Herbert' } });
            fireEvent.click(screen.getByRole('button', { name: /add book/i }));

            expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save book');
        });
    });
});
