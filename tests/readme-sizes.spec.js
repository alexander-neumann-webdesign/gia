import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { measure, applySizes } from '../scripts/sizes.js';

test('readme.md documents the sizes of the bundles in dist/ (run `npm run sizes` to update)', () => {
    const readme = readFileSync(join(__dirname, '../readme.md'), 'utf8');
    expect(applySizes(readme, measure())).toBe(readme);
});
