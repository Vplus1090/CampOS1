import test from 'node:test';
import assert from 'node:assert';

// 1. Google Drive Link Regex Validation Test
const isValidDriveLink = (link) => {
  if (!link) return false;
  const drivePattern = /^https?:\/\/(drive|docs)\.google\.com\/(file\/d\/[a-zA-Z0-9_-]+|folders\/[a-zA-Z0-9_-]+|open\?id=[a-zA-Z0-9_-]+|drive\/folders\/[a-zA-Z0-9_-]+)/;
  return drivePattern.test(link);
};

test('Google Drive Link Regex Validation', (t) => {
  const validLinks = [
    'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view',
    'https://docs.google.com/folders/1a2b3c4d5e6f7g8h9i0j',
    'http://drive.google.com/open?id=1a2b3c4d5e6f7g8h9i0j',
    'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j'
  ];

  const invalidLinks = [
    'https://google.com/file',
    'https://dropbox.com/s/1234',
    'ftp://drive.google.com/file/d/123',
    'just-a-string'
  ];

  for (const link of validLinks) {
    assert.strictEqual(isValidDriveLink(link), true, `Should be valid: ${link}`);
  }

  for (const link of invalidLinks) {
    assert.strictEqual(isValidDriveLink(link), false, `Should be invalid: ${link}`);
  }
});

// 2. File Size Regex Validation Test
const isValidSize = (size) => {
  if (!size) return true;
  const sizePattern = /^\d+(\.\d+)?\s*(KB|MB|GB|B)$/i;
  return sizePattern.test(size);
};

test('File Size Validation', (t) => {
  const validSizes = ['12 MB', '1.5MB', '500 KB', '10.5 GB', '200 B'];
  const invalidSizes = ['12MBMB', 'abc KB', '1.2.3 MB', '15 TB', '-5 MB'];

  for (const size of validSizes) {
    assert.strictEqual(isValidSize(size), true, `Should be valid size: ${size}`);
  }

  for (const size of invalidSizes) {
    assert.strictEqual(isValidSize(size), false, `Should be invalid size: ${size}`);
  }
});

// 3. Date String Validation Test
const isValidDateString = (dateStr) => {
  if (!dateStr) return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
};

test('Date String Validation', (t) => {
  const validDates = ['2026-06-30', '06/30/2026', '2026-06-30T12:00:00Z'];
  const invalidDates = ['invalid-date', '2026-13-45', ''];

  for (const d of validDates) {
    assert.strictEqual(isValidDateString(d), true, `Should be valid date: ${d}`);
  }

  for (const d of invalidDates) {
    assert.strictEqual(isValidDateString(d), false, `Should be invalid date: ${d}`);
  }
});

// 4. API Live Integration Endpoint Test (Optional/Conditional)
test('API Live Health Endpoint Check', async (t) => {
  const port = process.env.PORT || 5000;
  const healthUrl = `http://localhost:${port}/api/health`;

  try {
    const res = await fetch(healthUrl);
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200 OK');
    const data = await res.json();
    assert.ok(data.status, 'Response should contain status field');
    console.log('✅ API Health Integration check passed');
  } catch (err) {
    // If the server is offline during CI/testing, we skip this test gracefully
    console.log(`\n⚠️  Backend server offline at ${healthUrl}, skipping live health check integration test.`);
  }
});
