import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login, { AuthFrame, DEMO_ACCOUNTS, getDemoCredentials } from './Login.jsx';

vi.mock('../auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    login: vi.fn()
  })
}));

describe('advanced login page presentation', () => {
  it('renders the command-center auth frame with operational trust cues', () => {
    const html = renderToString(
      <MemoryRouter>
        <AuthFrame title="Welcome back" subtitle="Sign in to your QuantumOps control center">
          <p>Login form placeholder</p>
        </AuthFrame>
      </MemoryRouter>
    );

    expect(html).toContain('QuantumOps');
    expect(html).not.toContain('AssetFlow');
    expect(html).toContain('Command Center');
    expect(html).toContain('RBAC secured');
    expect(html).toContain('Audit-ready');
    expect(html).toContain('Login form placeholder');
  });

  it('defines seeded demo shortcuts without changing authentication behavior', () => {
    expect(DEMO_ACCOUNTS).toEqual([
      { role: 'Admin', email: 'admin@assetflow.demo', password: 'Password123!' },
      { role: 'Asset Manager', email: 'manager@assetflow.demo', password: 'Password123!' },
      { role: 'Department Head', email: 'depthead@assetflow.demo', password: 'Password123!' },
      { role: 'Employee', email: 'employee@assetflow.demo', password: 'Password123!' }
    ]);
  });

  it('converts demo account selection into credentials without role data', () => {
    expect(getDemoCredentials(DEMO_ACCOUNTS[1])).toEqual({
      email: 'manager@assetflow.demo',
      password: 'Password123!'
    });
  });
});

it('renders all demo role shortcuts from the real Login component', () => {
  const html = renderToString(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(html).toContain('Admin');
  expect(html).toContain('Asset Manager');
  expect(html).toContain('Department Head');
  expect(html).toContain('Employee');
  expect(html).toContain('admin@assetflow.demo');
  expect(html).toContain('manager@assetflow.demo');
  expect(html).toContain('depthead@assetflow.demo');
  expect(html).toContain('employee@assetflow.demo');
  expect(html).toContain('Enter command center');

  // Focused assertions for QuantumOps brand rename
  expect(html).toContain('QO');
  expect(html).not.toContain('>AF<');
});
