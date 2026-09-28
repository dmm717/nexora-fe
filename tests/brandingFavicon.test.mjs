import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = path.resolve('.');
const VERCEL_FAVICON_SHA256 = '2b8ad2d33455a8f736fc3a8ebf8f0bdea8848ad4c0db48a2833bd0f9cd775932';

test('Branding Favicon: src/app/favicon.ico replaces default Vercel icon with Nexora mark', () => {
  const icoPath = path.join(rootDir, 'src', 'app', 'favicon.ico');
  assert.ok(fs.existsSync(icoPath), 'src/app/favicon.ico must exist');

  const buf = fs.readFileSync(icoPath);
  assert.ok(buf.length > 0, 'favicon.ico must not be empty');

  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  assert.notEqual(sha, VERCEL_FAVICON_SHA256, 'favicon.ico must not be the default Vercel triangle icon');
});

test('Branding Favicon: src/app/icon.svg provides scalable vector Nexora mark with dark mode support', () => {
  const svgPath = path.join(rootDir, 'src', 'app', 'icon.svg');
  assert.ok(fs.existsSync(svgPath), 'src/app/icon.svg must exist');

  const content = fs.readFileSync(svgPath, 'utf-8');
  assert.match(content, /<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"\s+viewBox="0 0 512 512"/);
  assert.match(content, /<polygon[^>]*points="/);
  assert.match(content, /@media\s*\(prefers-color-scheme:\s*dark\)/, 'SVG icon must support dark mode');
  assert.doesNotMatch(content, /vercel/i, 'icon.svg must not reference vercel');
});

test('Branding Favicon: src/app/icon.png provides high-resolution 512x512 raster mark', () => {
  const pngPath = path.join(rootDir, 'src', 'app', 'icon.png');
  assert.ok(fs.existsSync(pngPath), 'src/app/icon.png must exist');

  const buf = fs.readFileSync(pngPath);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  assert.equal(buf[0], 0x89);
  assert.equal(buf[1], 0x50);
  assert.equal(buf[2], 0x4e);
  assert.equal(buf[3], 0x47);
  // Width and height in IHDR chunk (bytes 16..24)
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.equal(width, 512, 'icon.png width must be 512');
  assert.equal(height, 512, 'icon.png height must be 512');
});

test('Branding Favicon: src/app/layout.tsx preserves canonical metadata title and clean head', () => {
  const layoutPath = path.join(rootDir, 'src', 'app', 'layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf-8');

  assert.match(content, /title:\s*["']NEXORA - Innovating Today Inspiring Tomorrow["']/);
  assert.doesNotMatch(content, /vercel\.svg/i, 'layout.tsx must not hardcode vercel.svg favicon');
  assert.doesNotMatch(content, /<link[^>]*rel=["']icon["'][^>]*vercel/i, 'layout.tsx must not reference vercel favicon');
});

test('Branding Favicon: Build output contains branded icon links and no Vercel favicon references', () => {
  const aboutHtmlPath = path.join(rootDir, '.next', 'server', 'app', 'about.html');
  if (fs.existsSync(aboutHtmlPath)) {
    const html = fs.readFileSync(aboutHtmlPath, 'utf-8');
    assert.match(html, /<link[^>]*rel="icon"[^>]*href="\/favicon\.ico\?[^"]*"/, 'HTML must include /favicon.ico with content hash');
    assert.match(html, /<link[^>]*rel="icon"[^>]*href="\/icon\.svg\?[^"]*"/, 'HTML must include /icon.svg with content hash');
    assert.doesNotMatch(html, /vercel\.svg/i, 'HTML must not reference vercel.svg as icon');
  }
});
