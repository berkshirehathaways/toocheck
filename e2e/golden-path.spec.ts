import { test, expect } from '@playwright/test';

test('golden path: landing → district → candidate → compare → correction', async ({ page }) => {
  // 1) 랜딩
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // 2) 테스트 지역 바로가기
  await page.getByRole('link', { name: '테스트 지역으로 보기' }).click();
  await expect(page).toHaveURL(/\/districts\/district_sample_ga/);

  // 3) 정렬 변경 (재산↑) — URL query 보존
  await page.getByLabel('정렬', { exact: false }).selectOption('asset_desc');
  await expect(page).toHaveURL(/sort=asset_desc/);

  // 4) 후보 상세 진입
  await page.getByRole('link', { name: /다후보|가후보|나후보/ }).first().click();
  await expect(page).toHaveURL(/\/candidates\//);
  await expect(page.getByRole('heading', { name: /후보/ })).toBeVisible();

  // 5) 비교표 진입 (후보 상세 → District 목록 → 비교표)
  await page.goto('/districts/district_sample_ga/compare');
  await expect(page.getByText('후보 비교표')).toBeVisible();

  // 6) 정정 요청 폼 제출
  await page.goto('/correction');
  await page.getByLabel('일반 시민').check();
  await page
    .getByLabel('사실관계', { exact: false })
    .fill('샘플 시 가나구청장 1번 가후보의 재산 항목에 누락이 있어 보입니다.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /정정 요청 보내기/ }).click();
  await expect(page).toHaveURL(/\/correction\/thank-you/);
  await expect(page.getByText(/접수 번호/)).toBeVisible();
});
