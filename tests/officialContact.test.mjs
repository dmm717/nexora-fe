import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { OFFICIAL_SUPPORT_EMAIL } from '../src/config/contact.ts';
import { RECOMMENDED_TERMS_TEMPLATE, RECOMMENDED_PRIVACY_TEMPLATE } from '../src/services/siteContentDrafts.ts';

test('current legal draft templates share the product-owner-approved official contact', () => {
  assert.equal(OFFICIAL_SUPPORT_EMAIL, 'nexorainterview.vn@gmail.com');
  for (const template of [RECOMMENDED_TERMS_TEMPLATE, RECOMMENDED_PRIVACY_TEMPLATE]) {
    const emails = template.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi);
    assert.deepEqual(emails, [OFFICIAL_SUPPORT_EMAIL]);
  }
});

test('active source has no legacy support address and every static mailto uses the shared fallback', async () => {
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
      if (entry.isDirectory()) { await visit(file); continue; }
      if (!/\.[cm]?[jt]sx?$/.test(entry.name)) continue;
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /nexorainterview@gmail\.com|support@nexora\.(?:com|vn)/i, file.pathname);
      if (source.includes('mailto:')) {
        assert.match(source, /mailto:\$\{(?:data\?\.contactEmail \|\| )?OFFICIAL_SUPPORT_EMAIL\}/, file.pathname);
      }
    }
  }
  await visit(new URL('../src/', import.meta.url));
});
