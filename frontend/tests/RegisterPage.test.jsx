import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../src/pages/RegisterPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('../src/context/AuthContext', () => ({
    useAuth: () => ({ login: mockLogin }),
}));

vi.mock('../src/services/api', () => ({
    register: vi.fn(),
}));

import { register as registerApi } from '../src/services/api';

const renderRegisterPage = () =>
    render(
        <MemoryRouter>
            <RegisterPage />
        </MemoryRouter>
    );

describe('RegisterPage Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // RENDERING
    // ==========================================
    describe('Initial Render', () => {
        it('should render all four registration input fields on mount', () => {
            renderRegisterPage();
            expect(screen.getByLabelText('Username')).toBeInTheDocument();
            expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
            expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
        });

        it('should render the Create Account submit button', () => {
            renderRegisterPage();
            expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
        });
    });

    // ==========================================
    // REQUIRED FIELD VALIDATION
    // ==========================================
    describe('Required Field Validation', () => {
        it('should display an error if all fields are empty on submission', async () => {
            renderRegisterPage();
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('All fields are required');
        });

        it('should display an error if only username is provided', async () => {
            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), {
                target: { value: 'selma' },
            });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('All fields are required');
        });
    });

    // ==========================================
    // PASSWORD BOUNDARY VALUE TESTS
    // ==========================================
    describe('Password Length Boundary Validation', () => {
        it('should reject a password exactly 5 characters long (Below Boundary)', async () => {
            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '12345' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Password must be at least 6 characters');
        });

        it('should accept a password exactly 6 characters long (Exact Boundary)', async () => {
            registerApi.mockResolvedValueOnce({ data: { token: 'tok', user: { username: 'selma' } } });

            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123456' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '123456' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));

            await waitFor(() => expect(registerApi).toHaveBeenCalled());
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    // ==========================================
    // PASSWORD CONFIRMATION VALIDATION
    // ==========================================
    describe('Password Confirmation Validation', () => {
        it('should reject submission if password and confirmation do not match', async () => {
            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'securepass' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
        });

        it('should not call the API if password confirmation fails', async () => {
            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'securepass' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'mismatch' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));
            await screen.findByRole('alert');
            expect(registerApi).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // SUCCESSFUL REGISTRATION FLOW
    // ==========================================
    describe('Successful Registration Flow', () => {
        it('should call register API with username, email and password (not confirmPassword)', async () => {
            registerApi.mockResolvedValueOnce({ data: { token: 'tok', user: { username: 'selma' } } });

            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure123' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secure123' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));

            await waitFor(() => {
                expect(registerApi).toHaveBeenCalledWith({
                    username: 'selma',
                    email: 'selma@burch.edu',
                    password: 'secure123',
                });
                // confirmPassword must never be sent to the API
                expect(registerApi).not.toHaveBeenCalledWith(
                    expect.objectContaining({ confirmPassword: expect.anything() })
                );
            });
        });

        it('should call auth context login() and redirect to /dashboard after success', async () => {
            registerApi.mockResolvedValueOnce({ data: { token: 'tok', user: { username: 'selma' } } });

            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure123' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secure123' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('tok', { username: 'selma' });
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });
    });

    // ==========================================
    // API ERROR HANDLING
    // ==========================================
    describe('API Error Handling', () => {
        it('should display server error when API returns 409 duplicate email', async () => {
            registerApi.mockRejectedValueOnce({
                response: { data: { error: 'Email or username already exists' } },
            });

            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'taken@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure123' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secure123' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));

            expect(await screen.findByRole('alert')).toHaveTextContent('Email or username already exists');
        });

        it('should display a fallback error message when API response has no body', async () => {
            registerApi.mockRejectedValueOnce(new Error('Network Error'));

            renderRegisterPage();
            fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'selma' } });
            fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'selma@burch.edu' } });
            fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure123' } });
            fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secure123' } });
            fireEvent.click(screen.getByRole('button', { name: /create account/i }));

            expect(await screen.findByRole('alert')).toHaveTextContent('Registration failed');
        });
    });
});
