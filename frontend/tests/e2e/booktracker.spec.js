// @ts-check
import { test, expect } from '@playwright/test';

// ============================================================
// TEST HELPERS
// ============================================================

// Unique email per test run to avoid conflicts with existing accounts
const timestamp = Date.now();
const TEST_USER = {
    username: `e2e_user_${timestamp}`,
    email: `e2e_${timestamp}@burch.edu`,
    password: 'secure123',
};

// Existing account for login-only tests (must exist in DB)
const EXISTING_USER = {
    email: 'selma.dozic@stu.ibu.edu.ba',
    password: '123456',
};

async function registerAndLogin(page) {
    await page.goto('/register');
    await page.getByLabel('Username').fill(TEST_USER.username);
    await page.getByLabel('Email Address').fill(TEST_USER.email);
    await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
    await page.getByLabel('Confirm Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL('/dashboard');
}

async function loginExisting(page) {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill(EXISTING_USER.email);
    await page.getByLabel('Password').fill(EXISTING_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');
}

// ============================================================
// 1. AUTHENTICATION FLOWS
// ============================================================

test.describe('Authentication', () => {

    test('E2E-AUTH-01: Successful registration redirects to dashboard', async ({ page }) => {
        await page.goto('/register');
        await page.getByLabel('Username').fill(TEST_USER.username);
        await page.getByLabel('Email Address').fill(TEST_USER.email);
        await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
        await page.getByLabel('Confirm Password').fill(TEST_USER.password);
        await page.getByRole('button', { name: /create account/i }).click();

        await page.waitForURL('/dashboard');
        await expect(page).toHaveURL('/dashboard');
    });

    test('E2E-AUTH-02: Dashboard displays welcome message with registered username', async ({ page }) => {
        await registerAndLogin(page);
        await expect(page.getByText(TEST_USER.username)).toBeVisible();
    });

    test('E2E-AUTH-03: Login with wrong password shows error message', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill(EXISTING_USER.email);
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page).toHaveURL('/login');
    });

    test('E2E-AUTH-04: Successful login redirects to dashboard', async ({ page }) => {
        await loginExisting(page);
        await expect(page).toHaveURL('/dashboard');
    });

    test('E2E-AUTH-05: Unauthenticated access to /dashboard redirects to login', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/login');
    });

    test('E2E-AUTH-06: Logout redirects to login page', async ({ page }) => {
        await loginExisting(page);

        // Open user dropdown and click Sign Out
        await page.locator('.dropdown').click();
        await page.getByRole('button', { name: /sign out/i }).click();

        await expect(page).toHaveURL('/login');
    });

    test('E2E-AUTH-07: Accessing /books after logout redirects to login', async ({ page }) => {
        await loginExisting(page);
        await page.locator('.dropdown').click();
        await page.getByRole('button', { name: /sign out/i }).click();

        await page.goto('/books');
        await expect(page).toHaveURL('/login');
    });

});

// ============================================================
// 2. BOOK MANAGEMENT — CRUD FLOWS
// ============================================================

test.describe('Book Management', () => {

    test.beforeEach(async ({ page }) => {
        await loginExisting(page);
        await page.goto('/books');
    });

    test('E2E-BOOK-01: Add Book modal opens when Add Book button is clicked', async ({ page }) => {
        await page.getByRole('button', { name: /add book/i }).click();
        await expect(page.getByText('Add New Book')).toBeVisible();
    });

    test('E2E-BOOK-02: Successfully adding a book shows it in the book list', async ({ page }) => {
        const bookTitle = `Playwright Test Book ${timestamp}`;

        await page.getByRole('button', { name: /add book/i }).click();
        await page.getByLabel(/title/i).fill(bookTitle);
        await page.getByLabel(/author/i).fill('Test Author');
        await page.getByLabel(/status/i).selectOption('reading');
        await page.getByRole('button', { name: /add book/i }).last().click();

        await expect(page.getByText(bookTitle)).toBeVisible();
    });

    test('E2E-BOOK-03: Editing a book updates the displayed title', async ({ page }) => {
        const bookTitle = `Edit Test Book ${timestamp}`;
        const updatedTitle = `Updated Book ${timestamp}`;

        // First add a book
        await page.getByRole('button', { name: /add book/i }).click();
        await page.getByLabel(/title/i).fill(bookTitle);
        await page.getByLabel(/author/i).fill('Author');
        await page.getByRole('button', { name: /add book/i }).last().click();
        await expect(page.getByText(bookTitle)).toBeVisible();

        // Then edit it
        await page.getByRole('button', { name: new RegExp(`edit ${bookTitle}`, 'i') }).click();
        await page.getByLabel(/title/i).clear();
        await page.getByLabel(/title/i).fill(updatedTitle);
        await page.getByRole('button', { name: /save changes/i }).click();

        await expect(page.getByText(updatedTitle)).toBeVisible();
        await expect(page.getByText(bookTitle)).not.toBeVisible();
    });

    test('E2E-BOOK-04: Deleting a book removes it from the list', async ({ page }) => {
        const bookTitle = `Delete Test Book ${timestamp}`;

        // Add a book first
        await page.getByRole('button', { name: /add book/i }).click();
        await page.getByLabel(/title/i).fill(bookTitle);
        await page.getByLabel(/author/i).fill('Author');
        await page.getByRole('button', { name: /add book/i }).last().click();
        await expect(page.getByText(bookTitle)).toBeVisible();

        // Delete it
        await page.getByRole('button', { name: new RegExp(`delete ${bookTitle}`, 'i') }).click();

        // Confirm deletion in the modal
        await page.getByRole('button', { name: /^delete$/i }).click();

        await expect(page.getByText(bookTitle)).not.toBeVisible();
    });

    test('E2E-BOOK-05: Filtering by "Reading" status shows only reading books', async ({ page }) => {
        await page.getByRole('tab', { name: /reading/i }).click();

        // All visible status badges should be "Reading"
        const badges = page.locator('.badge', { hasText: 'Reading' });
        const allBadges = page.locator('.badge').filter({ hasText: /want to read|finished/i });

        await expect(allBadges).toHaveCount(0);
    });

    test('E2E-BOOK-06: Filtering by "Finished" status shows only finished books', async ({ page }) => {
        await page.getByRole('tab', { name: /finished/i }).click();

        const nonFinishedBadges = page.locator('.badge').filter({ hasText: /want to read|reading/i });
        await expect(nonFinishedBadges).toHaveCount(0);
    });

    test('E2E-BOOK-07: "All" filter tab shows complete book list', async ({ page }) => {
        // Apply a filter first then reset
        await page.getByRole('tab', { name: /finished/i }).click();
        await page.getByRole('tab', { name: /^all$/i }).click();

        // Books grid or empty state should be visible
        const grid = page.locator('.grid, [class*="grid"]');
        const emptyState = page.getByText(/no books found/i);

        await expect(grid.or(emptyState)).toBeVisible();
    });

});

// ============================================================
// 3. NAVIGATION & UI
// ============================================================

test.describe('Navigation', () => {

    test.beforeEach(async ({ page }) => {
        await loginExisting(page);
    });

    test('E2E-NAV-01: Navbar Dashboard link navigates to /dashboard', async ({ page }) => {
        await page.goto('/books');
        await page.getByRole('link', { name: /dashboard/i }).first().click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('E2E-NAV-02: Navbar My Books link navigates to /books', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('link', { name: /my books/i }).first().click();
        await expect(page).toHaveURL('/books');
    });

    test('E2E-NAV-03: Dashboard shows stat cards with numeric values', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText('Total Books')).toBeVisible();
        await expect(page.getByText('Want to Read')).toBeVisible();
        await expect(page.getByText('Reading')).toBeVisible();
        await expect(page.getByText('Finished')).toBeVisible();
    });

    test('E2E-NAV-04: View all link on dashboard navigates to /books', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('link', { name: /view all/i }).click();
        await expect(page).toHaveURL('/books');
    });

});
