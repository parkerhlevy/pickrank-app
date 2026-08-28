import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackLinkButton } from '../../components/ui/back-link-button';

function listTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listTsxFiles(entryPath);
    }

    return entry.name.endsWith('.tsx') ? [entryPath] : [];
  });
}

describe('BackLinkButton', () => {
  it('renders the established high-contrast back-link treatment', () => {
    render(BackLinkButton({ href: '/contests', children: 'Contests' }));

    const backLink = screen.getByRole('link', { name: 'Contests' });

    expect(backLink).toHaveAttribute('href', '/contests');
    expect(backLink).toHaveClass('border-white/20', 'bg-white/10', 'text-white');
    expect(backLink).toHaveClass('hover:bg-white/15', 'hover:text-white', 'focus-visible:outline-white');
  });

  it('is the only arrow-back implementation across app surfaces', () => {
    const projectRoot = process.cwd();
    const sourceFiles = [join(projectRoot, 'app'), join(projectRoot, 'components')].flatMap(listTsxFiles);
    const arrowLeftFiles = sourceFiles
      .filter((file) => readFileSync(file, 'utf8').includes('ArrowLeft'))
      .map((file) => relative(projectRoot, file));

    expect(arrowLeftFiles).toEqual(['components/ui/back-link-button.tsx']);
  });
});
