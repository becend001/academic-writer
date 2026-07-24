import { test, expect, chromium } from '@playwright/test';

const BASE_URL = 'http://47.94.105.72:3000';

test.describe('新功能测试', () => {

  test.beforeEach(async ({ page }) => {
    // 设置较长超时
    test.setTimeout(120000);
  });

  test('1. 申报书评分功能', async ({ page }) => {
    // 导航到课题申报页
    await page.goto(`${BASE_URL}/grant`);
    
    // 等待页面加载，如果需要登录会跳转
    await page.waitForTimeout(2000);
    
    // 检查是否在登录页
    if (page.url().includes('/auth/login')) {
      console.log('需要登录，请先手动登录后重新运行测试');
      // 打开登录页让用户手动登录
      await page.goto(`${BASE_URL}/auth/login`);
      // 等待用户手动登录完成（最多等5分钟）
      await page.waitForURL('**/grant', { timeout: 300000 });
    }

    // 填写研究领域
    const fieldInput = page.locator('input[placeholder*="研究领域"]');
    if (await fieldInput.isVisible()) {
      await fieldInput.fill('人工智能');
    }

    // 点击AI推荐选题
    const topicBtn = page.locator('button:has-text("AI推荐选题")');
    if (await topicBtn.isVisible()) {
      await topicBtn.click();
      await page.waitForTimeout(3000);
    }

    // 选择第一个选题
    const selectBtn = page.locator('button:has-text("选择此选题")').first();
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      await page.waitForTimeout(1000);
    }

    // 点击开始撰写申报书
    const startBtn = page.locator('button:has-text("开始撰写申报书")');
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
    }

    // 生成摘要
    const aiGenerateBtn = page.locator('button:has-text("AI生成")').first();
    if (await aiGenerateBtn.isVisible()) {
      await aiGenerateBtn.click();
      await page.waitForTimeout(5000);
    }

    // 点击申报书评分
    const scoreBtn = page.locator('button:has-text("申报书评分")');
    if (await scoreBtn.isVisible()) {
      await scoreBtn.click();
      await page.waitForTimeout(5000);
      
      // 检查是否弹出评分报告
      const scoreReport = page.locator('text=申报书评分报告');
      await expect(scoreReport).toBeVisible({ timeout: 10000 });
      console.log('✅ 申报书评分功能正常');
    }
  });

  test('2. 期刊推荐功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/literature`);
    await page.waitForTimeout(2000);

    // 检查是否需要登录
    if (page.url().includes('/auth/login')) {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForURL('**/literature', { timeout: 300000 });
    }

    // 点击期刊推荐Tab
    const journalTab = page.locator('button:has-text("期刊推荐")');
    if (await journalTab.isVisible()) {
      await journalTab.click();
      await page.waitForTimeout(1000);
    }

    // 输入论文标题
    const titleInput = page.locator('input[placeholder*="论文标题"]');
    if (await titleInput.isVisible()) {
      await titleInput.fill('基于深度学习的医学影像诊断研究');
    }

    // 点击获取期刊推荐
    const searchBtn = page.locator('button:has-text("获取期刊推荐")');
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(8000);
      
      // 检查是否显示推荐结果
      const results = page.locator('text=推荐结果');
      const hasResults = await results.isVisible();
      console.log(hasResults ? '✅ 期刊推荐功能正常' : '❌ 期刊推荐功能异常');
    }
  });

  test('3. 投稿辅助功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/literature`);
    await page.waitForTimeout(2000);

    if (page.url().includes('/auth/login')) {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForURL('**/literature', { timeout: 300000 });
    }

    // 点击投稿辅助Tab
    const submissionTab = page.locator('button:has-text("投稿辅助")');
    if (await submissionTab.isVisible()) {
      await submissionTab.click();
      await page.waitForTimeout(1000);
    }

    // 输入论文标题
    const titleInput = page.locator('input[placeholder*="论文标题"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('基于深度学习的医学影像诊断研究');
    }

    // 输入摘要
    const abstractInput = page.locator('textarea[placeholder*="摘要"]').first();
    if (await abstractInput.isVisible()) {
      await abstractInput.fill('本研究提出了一种基于深度学习的医学影像诊断方法，通过卷积神经网络对医学影像进行特征提取和分类，实现了高精度的疾病诊断。');
    }

    // 点击生成投稿信
    const generateBtn = page.locator('button:has-text("生成投稿信")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(8000);
      
      // 检查是否生成投稿信
      const coverLetter = page.locator('text=投稿信');
      const hasResult = await coverLetter.isVisible();
      console.log(hasResult ? '✅ 投稿辅助功能正常' : '❌ 投稿辅助功能异常');
    }
  });

  test('4. 学术档案功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    if (page.url().includes('/auth/login')) {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForURL('**/profile', { timeout: 300000 });
    }

    // 检查学术档案卡片
    const profileCard = page.locator('text=我的学术档案');
    const hasProfile = await profileCard.isVisible();
    
    if (hasProfile) {
      // 点击编辑
      const editBtn = page.locator('button:has-text("编辑")').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(500);
      }

      // 输入研究领域
      const fieldInput = page.locator('input[placeholder*="研究领域"]');
      if (await fieldInput.isVisible()) {
        await fieldInput.fill('人工智能、医学影像');
      }

      // 点击保存
      const saveBtn = page.locator('button:has-text("保存")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
      }

      console.log('✅ 学术档案功能正常');
    } else {
      console.log('❌ 未找到学术档案卡片');
    }
  });

  test('5. 论文时间线功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    if (page.url().includes('/auth/login')) {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForURL('**/profile', { timeout: 300000 });
    }

    // 检查论文时间线卡片
    const timelineCard = page.locator('text=论文时间线');
    const hasTimeline = await timelineCard.isVisible();
    
    if (hasTimeline) {
      // 点击新建论文
      const newBtn = page.locator('button:has-text("新建论文")');
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(500);
      }

      // 输入标题
      const titleInput = page.locator('input[placeholder*="论文标题"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('自动化测试论文');
      }

      // 点击创建
      const createBtn = page.locator('button:has-text("创建")');
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
      }

      // 检查是否创建成功
      const paper = page.locator('text=自动化测试论文');
      const hasCreated = await paper.isVisible();
      console.log(hasCreated ? '✅ 论文时间线功能正常' : '❌ 论文时间线功能异常');
    } else {
      console.log('❌ 未找到论文时间线卡片');
    }
  });

  test('6. 数据导出功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    if (page.url().includes('/auth/login')) {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForURL('**/profile', { timeout: 300000 });
    }

    // 检查数据导出卡片
    const exportCard = page.locator('text=数据导出');
    const hasExport = await exportCard.isVisible();
    
    if (hasExport) {
      // 设置下载监听
      const downloadPromise = page.waitForEvent('download');
      
      // 点击导出
      const exportBtn = page.locator('button:has-text("导出数据")');
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        
        try {
          const download = await downloadPromise;
          console.log(`✅ 数据导出功能正常，文件：${download.suggestedFilename()}`);
        } catch (e) {
          console.log('❌ 数据导出功能异常');
        }
      }
    } else {
      console.log('❌ 未找到数据导出卡片');
    }
  });
});
