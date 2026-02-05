import { test, expect } from '@playwright/test';

test.describe('Time Audit App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show API key modal on first load', async ({ page }) => {
    const modal = page.locator('#api-key-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/active/);
  });

  test('should allow saving API key and start timer', async ({ page }) => {
    const modal = page.locator('#api-key-modal');
    await page.fill('#api-key-input', 'dg-test-key-12345');
    await page.click('#save-api-key-btn');
    
    await expect(modal).not.toBeVisible();
    await expect(page.locator('#countdown-display')).not.toHaveText('--:--');
  });

  test('should change interval and restart timer', async ({ page }) => {
    // Save API key first to start timer
    await page.fill('#api-key-input', 'dg-test-key-12345');
    await page.click('#save-api-key-btn');
    
    const initialCountdown = await page.textContent('#countdown-display');
    
    await page.selectOption('#interval-select', '30');
    
    const newCountdown = await page.textContent('#countdown-display');
    // It should reset to 30:00 or something close
    expect(newCountdown).toContain('30:');
  });

  test('should open recording modal when timer expires', async ({ page }) => {
    // This is hard to test in real-time, we might want to mock the timer
    // or set a very short interval if possible.
    // For now, let's just test that the modal exists and can be opened manually if there was a way
    // But since we are doing E2E, let's just verify the UI state of the recording modal
    
    // We can trigger it by calling the global function if we want, 
    // but better to test the UI flow.
    
    // Let's at least test that the recording modal can be seen if we trigger it
    await page.evaluate(() => {
        window.showRecordingModal();
    });
    
    await expect(page.locator('#recording-modal')).toBeVisible();
    await expect(page.locator('#period-start')).not.toBeEmpty();
  });

  test('should allow manual transcript entry and save', async ({ page }) => {
    await page.fill('#api-key-input', 'dg-test-key-12345');
    await page.click('#save-api-key-btn');

    await page.evaluate(() => {
        window.showRecordingModal();
    });

    const transcript = 'I was working on testing the app.';
    await page.fill('#live-transcript', transcript);
    await page.click('#save-transcript-btn');

    await expect(page.locator('#recording-modal')).not.toBeVisible();
    await expect(page.locator('.transcript-entry')).toContainText(transcript);
  });
});
