import { test, expect } from '@playwright/test';

const USER_A = {
  _id: 'user-a',
  name: 'User A',
  email: 'a@example.com',
};

const USER_B = {
  _id: 'user-b',
  name: 'User B',
  email: 'b@example.com',
};

const workspaceKey = (userId) => `reqflow-workspace:v1:${userId}`;

const buildWorkspacePayload = ({ userId, tabs, activeTabId, lastActivityAt }) => ({
  version: 1,
  userId,
  lastActivityAt,
  activeTabId,
  tabs,
});

const registerApiMocks = async (page, options = {}) => {
  const user = options.user ?? USER_A;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    const json = (status, body) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/api/auth/me' && method === 'GET') {
      return json(200, { user });
    }

    if (path === '/api/auth/csrf' && method === 'GET') {
      return json(200, { csrfToken: 'test-csrf-token' });
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      return json(200, { success: true });
    }

    if (path === '/api/auth/force-logout' && method === 'POST') {
      return json(200, { success: true });
    }

    if (path === '/api/auth/refresh' && method === 'POST') {
      return json(200, { success: true });
    }

    if (path === '/api/collections' && method === 'GET') {
      return json(200, []);
    }

    if (path === '/api/collections' && method === 'POST') {
      return json(201, { _id: 'col-1', name: 'New collection' });
    }

    if (path.startsWith('/api/requests/collection/') && method === 'GET') {
      return json(200, []);
    }

    if (path === '/api/requests/proxy' && method === 'POST') {
      return json(200, {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { ok: true },
      });
    }

    if (path === '/api/guest/status' && method === 'GET') {
      return json(200, { remaining: 5, resetAt: new Date(Date.now() + 60_000).toISOString() });
    }

    return json(404, { message: `Unhandled mocked route: ${method} ${path}` });
  });
};

test.describe('workspace persistence', () => {
  test('login bootstrap -> open tabs -> refresh -> workspace restore', async ({ page }) => {
    await registerApiMocks(page, { user: USER_A });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    const urlInput = page.getByPlaceholder('Enter request URL...');
    const nameInput = page.getByPlaceholder('Request name');

    await urlInput.fill('https://example.com/a');
    await nameInput.fill('Tab A');

    await page.getByTitle('New Request').click();
    await urlInput.fill('https://example.com/b');
    await nameInput.fill('Tab B');

    await expect(page.getByText('Tab A')).toBeVisible();
    await expect(page.getByText('Tab B')).toBeVisible();

    await page.reload();

    await expect(page.getByText('Tab A')).toBeVisible();
    await expect(page.getByText('Tab B')).toBeVisible();
    await expect(urlInput).toHaveValue('https://example.com/b');

    const stored = await page.evaluate(() => localStorage.getItem('reqflow-workspace:v1:user-a'));
    expect(stored).toBeTruthy();
  });

  test('logout clears workspace', async ({ page }) => {
    await registerApiMocks(page, { user: USER_A });

    await page.goto('/dashboard');
    const urlInput = page.getByPlaceholder('Enter request URL...');
    await urlInput.fill('https://example.com/logout-check');

    await page.locator('button[title="Logout"]').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/$/);

    const stored = await page.evaluate(() => localStorage.getItem('reqflow-workspace:v1:user-a'));
    expect(stored).toBeNull();
  });

  test('inactivity timeout clears workspace and forces logout', async ({ page }) => {
    const expiredPayload = buildWorkspacePayload({
      userId: USER_A._id,
      activeTabId: 'req-1',
      lastActivityAt: Date.now() - 31 * 60 * 1000,
      tabs: [
        {
          _id: 'req-1',
          name: 'Expired Tab',
          method: 'GET',
          url: 'https://example.com/expired',
          headers: {},
          body: {},
          isTemporary: false,
        },
      ],
    });

    await page.addInitScript(({ key, payload }) => {
      localStorage.setItem(key, JSON.stringify(payload));
    }, { key: workspaceKey(USER_A._id), payload: expiredPayload });

    await registerApiMocks(page, { user: USER_A });
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);

    const stored = await page.evaluate(() => localStorage.getItem('reqflow-workspace:v1:user-a'));
    expect(stored).toBeNull();
  });

  test('cross-user workspace isolation is enforced', async ({ page }) => {
    const userAWorkspace = buildWorkspacePayload({
      userId: USER_A._id,
      activeTabId: 'a-tab',
      lastActivityAt: Date.now(),
      tabs: [
        {
          _id: 'a-tab',
          name: 'User A Secret Tab',
          method: 'GET',
          url: 'https://example.com/user-a',
          headers: {},
          body: {},
          isTemporary: false,
        },
      ],
    });

    await page.addInitScript(({ key, payload }) => {
      localStorage.setItem(key, JSON.stringify(payload));
    }, { key: workspaceKey(USER_A._id), payload: userAWorkspace });

    await registerApiMocks(page, { user: USER_B });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByText('User A Secret Tab')).toHaveCount(0);
    await expect(page.getByPlaceholder('Enter request URL...')).toHaveValue('');

    const userAStored = await page.evaluate(() => localStorage.getItem('reqflow-workspace:v1:user-a'));
    expect(userAStored).toBeTruthy();
  });
});
