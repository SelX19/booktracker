import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';

// Mock useNavigate so we can assert navigation without a real router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock AuthContext — supply a controlled login spy
const mockLogin = vi.fn();
vi.mock('../src/context/AuthContext', () => ({
    useAuth: () => ({ login: mockLogin }),
}));

// Mock API layer — isolate component from real HTTP calls
vi.mock('../src/services/api', () => ({
    login: vi.fn(),
}));

import { login as loginApi } from '../src/services/api';

const renderLoginPage = () =>
    render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    );

describe('LoginPage Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // RENDERING
    // ==========================================
    describe('Initial Render', () => {
        it('should render email and password input fields on mount', () => {
            renderLoginPage();
            expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
        });

        it('should render the Sign In submit button', () => {
            renderLoginPage();
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });

        it('should render a link to the registration page', () => {
            renderLoginPage();
            expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
        });
    });

    // ==========================================
    // VALIDATION
    // ==========================================
    describe('Input Validation', () => {
        it('should display an error message if both fields are empty on submit', async () => {
            renderLoginPage();
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Please fill in all fields');
        });

        it('should display an error if only email is provided and password is empty', async () => {
            renderLoginPage();
            fireEvent.change(screen.getByLabelText('Email Address'), {
                target: { value: 'user@burch.edu' },
            });
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Please fill in all fields');
        });

        it('should not call the API if client-side validation fails', async () => {
            renderLoginPage();
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
            await screen.findByRole('alert');
            expect(loginApi).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // SUCCESSFUL SUBMISSION
    // ==========================================
    describe('Successful Login Flow', () => {
        it('should call the login API with correct credentials on valid submission', async () => {
            loginApi.mockResolvedValueOnce({ data: { token: 'mock-token', user: { username: 'selma' } } });

            renderLoginPage();
            fireEvent.change(screen.getByLabelText('Email Address'), {
                target: { value: 'selma@burch.edu' },
            });
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: 'secure123' },
            });
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

            await waitFor(() => {
                expect(loginApi).toHaveBeenCalledWith({ email: 'selma@burch.edu', password: 'secure123' });
            });
        });

        it('should call auth context login() and redirect to /dashboard on success', async () => {
            loginApi.mockResolvedValueOnce({ data: { token: 'mock-token', user: { username: 'selma' } } });

            renderLoginPage();
            fireEvent.change(screen.getByLabelText('Email Address'), {
                target: { value: 'selma@burch.edu' },
            });
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: 'secure123' },
            });
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('mock-token', { username: 'selma' });
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });
    });

    // ==========================================
    // API ERROR HANDLING
    // ==========================================
    describe('API Error Handling', () => {
        it('should display the server error message when the API returns a 401', async () => {
            loginApi.mockRejectedValueOnce({
                response: { data: { error: 'Invalid email or password' } },
            });

            renderLoginPage();
            fireEvent.change(screen.getByLabelText('Email Address'), {
                target: { value: 'wrong@burch.edu' },
            });
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: 'wrongpassword' },
            });
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

            expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
        });

        it('should display a fallback error message when the API response has no body', async () => {
            loginApi.mockRejectedValueOnce(new Error('Network Error'));

            renderLoginPage();
            fireEvent.change(screen.getByLabelText('Email Address'), {
                target: { value: 'user@burch.edu' },
            });
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: 'anypassword' },
            });
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

            expect(await screen.findByRole('alert')).toHaveTextContent('Login failed');
        });
    });
});
