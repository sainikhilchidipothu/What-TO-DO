import { test, expect } from '@playwright/test'

test('create, complete, and persist a task', async ({ page }) => {
  await page.goto('/')
  const continueButton = page.getByRole('button', { name: /continue/i })
  if (await continueButton.isVisible().catch(() => false)) await continueButton.click()
  await page.getByRole('button', { name: /new task|add task/i }).first().click()
  await page.getByLabel('TASK NAME').fill('Smoke task')
  await page.getByRole('button', { name: /add task/i }).click()
  await expect(page.getByText('Smoke task')).toBeVisible()
  await page.getByRole('checkbox', { name: /Smoke task/i }).click()
  await page.reload()
  await expect(page.getByText('Smoke task')).toBeVisible()
})
