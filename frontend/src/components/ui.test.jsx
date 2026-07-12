import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimpleTable } from './ui.jsx';

describe('SimpleTable', () => {
  it('renders an empty state instead of crashing when rows are null during async loading', () => {
    const html = renderToString(
      <SimpleTable
        columns={[{ key: 'name', label: 'Name' }]}
        rows={null}
        emptyTitle="No records"
        emptyText="Records will appear here when loaded."
      />
    );

    expect(html).toContain('No records');
    expect(html).toContain('Records will appear here when loaded.');
  });
});
