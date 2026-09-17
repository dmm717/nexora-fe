import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrencyFractionDigits,
  getMinorUnitDivisor,
  formatPriceMinor,
} from '../src/utils/formatters.ts';

test('1. getCurrencyFractionDigits derives correct fraction digits', () => {
  assert.equal(getCurrencyFractionDigits('VND'), 0);
  assert.equal(getCurrencyFractionDigits('vnd'), 0);
  assert.equal(getCurrencyFractionDigits('JPY'), 0);
  assert.equal(getCurrencyFractionDigits('USD'), 2);
  assert.equal(getCurrencyFractionDigits('EUR'), 2);
});

test('2. getMinorUnitDivisor derives correct minor unit divisor', () => {
  assert.equal(getMinorUnitDivisor('VND'), 1);
  assert.equal(getMinorUnitDivisor('JPY'), 1);
  assert.equal(getMinorUnitDivisor('USD'), 100);
  assert.equal(getMinorUnitDivisor('EUR'), 100);
});

test('3. formatPriceMinor handles free tier as Miễn phí', () => {
  assert.equal(formatPriceMinor(0, 'VND'), 'Miễn phí');
  assert.equal(formatPriceMinor(0, 'USD'), 'Miễn phí');
});

test('4. formatPriceMinor formats configured VND amounts accurately without / 100 distortion', () => {
  const clean = (str) => str.replace(/\u00A0/g, ' ');

  assert.equal(clean(formatPriceMinor(49000, 'VND')), '49.000 ₫');
  assert.equal(clean(formatPriceMinor(189000, 'VND')), '189.000 ₫');
  assert.equal(clean(formatPriceMinor(599000, 'VND')), '599.000 ₫');
});

test('5. formatPriceMinor supports 2-decimal currency without hardcoding VND', () => {
  const usdFormatted = formatPriceMinor(4900, 'USD', 'en-US');
  assert.equal(usdFormatted, '$49.00');

  const eurFormatted = formatPriceMinor(2500, 'EUR', 'de-DE');
  assert.match(eurFormatted, /25,00/);
});
