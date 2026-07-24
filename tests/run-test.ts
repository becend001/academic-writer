import { chromium } from 'playwright';

const BASE_URL = 'http://47.94.105.72:3000';

interface TestResult {
  name: string;
  status: '✅ 通过' | '❌ 失败' | '⚠️ 跳过';
  message?: string;
}

async function runTests() {
  console.log('🚀 启动全功能测试...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const results: TestResult[] = [];
  
  // ========== 登录 ==========
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 登录');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(`${BASE_URL}/auth/login`);
  
  const currentUrl = page.url();
  if (!currentUrl.includes('/auth/login')) {
    console.log('✅ 已处于登录状态，跳过登录\n');
  } else {
    console.log('⏳ 请在浏览器中手动登录...');
    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      if (!page.url().includes('/auth/login')) break;
      await page.waitForTimeout(500);
    }
    if (page.url().includes('/auth/login')) throw new Error('登录超时');
    console.log('✅ 登录成功\n');
  }
  
  // 登录后关闭所有新手引导
  await page.evaluate(() => {
    localStorage.setItem('onboarding_completed', 'true');
  });
  
  // ========== 测试辅助函数 ==========
  async function testFeature(
    name: string, 
    testFn: () => Promise<void>
  ): Promise<void> {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 ${name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    try {
      await testFn();
      results.push({ name, status: '✅ 通过' });
    } catch (e: any) {
      console.log(`❌ ${e.message}\n`);
      results.push({ name, status: '❌ 失败', message: e.message });
    }
  }
  
  // 安全导航：失败时恢复到首页，避免级联崩溃
  async function safeGoto(url: string): Promise<boolean> {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // 等待页面渲染
      await page.waitForTimeout(2000);
      return true;
    } catch {
      try {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1000);
      } catch {}
      return false;
    }
  }
  
  async function dismissOnboarding() {
    try {
      const skipBtn = page.locator('button:has-text("跳过")').first();
      await skipBtn.waitFor({ state: 'visible', timeout: 2000 });
      await skipBtn.click();
      await page.waitForTimeout(500);
    } catch {}
  }
  
  async function waitForText(text: string, timeout = 10000): Promise<boolean> {
    try {
      await page.locator(`text=${text}`).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
  
  // ========== 1. 首页 ==========
  await testFeature('1.1 首页加载', async () => {
    const ok = await safeGoto(BASE_URL);
    if (!ok) throw new Error('首页加载失败');
    const title = await page.title();
    if (!title.includes('学术写作助手')) throw new Error('标题不正确');
    const hero = await waitForText('AI驱动的');
    if (!hero) throw new Error('Hero区域未显示');
  });
  
  // ========== 2. 工作台 ==========
  await testFeature('2.1 工作台 - 论文润色', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败（HTTP错误）');
    await dismissOnboarding();
    
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('本研究通过使用深度学习的方法来对医学影像进行分析，目的是想提高诊断的准确率。');
    await page.waitForTimeout(500);
    
    await page.locator('button:has-text("润色")').first().click();
    await page.waitForTimeout(15000);
    
    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('润色结果未显示');
  });
  
  await testFeature('2.2 工作台 - 学术翻译', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败（HTTP错误）');
    await dismissOnboarding();
    
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('本研究采用深度学习技术对医学影像进行分析。');
    await page.waitForTimeout(500);
    
    await page.locator('button:has-text("翻译")').first().click();
    await page.waitForTimeout(15000);
    
    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('翻译结果未显示');
  });
  
  await testFeature('2.3 工作台 - 摘要生成', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败（HTTP错误）');
    await dismissOnboarding();
    
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('本研究提出了一种基于深度学习的医学影像诊断方法，通过卷积神经网络对医学影像进行特征提取和分类，实现了高精度的疾病诊断。');
    await page.waitForTimeout(500);
    
    await page.locator('button:has-text("摘要")').first().click();
    await page.waitForTimeout(15000);
    
    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('摘要结果未显示');
  });
  
  // ========== 3. 一键全流程 ==========
  await testFeature('3.1 一键全流程 - 润色全流程', async () => {
    const ok = await safeGoto(`${BASE_URL}/workflow`);
    if (!ok) throw new Error('工作流页面加载失败');
    
    await page.locator('text=论文润色全流程').first().click();
    await page.waitForTimeout(2000);
    
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('本研究采用深度学习技术对医学影像进行分析，旨在提升诊断准确率。');
    await page.waitForTimeout(500);
    
    await page.locator('button:has-text("开始润色")').first().click();
    // 全流程需要润色+翻译+摘要三步AI处理，等待时间要更长
    await page.waitForTimeout(30000);
    
    const hasTabs = await page.locator('text=润色结果').isVisible().catch(() => false);
    if (!hasTabs) throw new Error('全流程结果未显示');
  });
  
  // ========== 4. 智能写作引导 ==========
  await testFeature('4.1 智能写作引导', async () => {
    const ok = await safeGoto(`${BASE_URL}/guide`);
    if (!ok) throw new Error('写作引导页面加载失败');
    
    const fieldInput = page.locator('input[placeholder*="人工智能"]').first();
    await fieldInput.waitFor({ state: 'visible', timeout: 5000 });
    await fieldInput.fill('人工智能');
    
    const keywordsInput = page.locator('input[placeholder*="深度学习"]').first();
    await keywordsInput.waitFor({ state: 'visible', timeout: 3000 });
    await keywordsInput.fill('深度学习');
    
    await page.locator('button:has-text("生成写作方案")').first().click();
    // 写作引导需要生成选题+大纲+要点，AI处理较慢
    await page.waitForTimeout(30000);
    
    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('写作方案未生成');
  });
  
  // ========== 5. 课题申报 ==========
  await testFeature('5.1 课题申报 - 选题建议', async () => {
    const ok = await safeGoto(`${BASE_URL}/grant`);
    if (!ok) throw new Error('课题申报页面加载失败');
    
    const fieldInput = page.locator('input[placeholder*="人工智能"]').first();
    await fieldInput.waitFor({ state: 'visible', timeout: 5000 });
    await fieldInput.fill('人工智能');
    
    const keywordsInput = page.locator('input[placeholder*="深度学习"]').first();
    await keywordsInput.waitFor({ state: 'visible', timeout: 3000 });
    await keywordsInput.fill('医学影像');
    
    await page.locator('button:has-text("AI推荐选题")').first().click();
    await page.waitForTimeout(15000);
    
    const hasTopics = await waitForText('AI推荐的选题', 15000);
    if (!hasTopics) throw new Error('选题建议未生成');
  });
  
  await testFeature('5.2 课题申报 - 申报书撰写', async () => {
    const ok = await safeGoto(`${BASE_URL}/grant`);
    if (!ok) throw new Error('课题申报页面加载失败');
    
    await page.locator('text=直接填写项目信息').first().click();
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input[placeholder="请输入项目名称"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('测试课题申报');
    
    await page.locator('button:has-text("开始撰写申报书")').first().click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("AI生成")').first().click();
    await page.waitForTimeout(15000);
    
    const textarea = page.locator('textarea').first();
    const value = await textarea.inputValue().catch(() => '');
    if (!value || value.length < 10) throw new Error('章节内容未生成');
  });
  
  await testFeature('5.3 课题申报 - 申报书评分（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/grant`);
    if (!ok) throw new Error('课题申报页面加载失败');
    
    await page.locator('text=直接填写项目信息').first().click();
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input[placeholder="请输入项目名称"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('AI医学影像诊断');
    
    await page.locator('button:has-text("开始撰写申报书")').first().click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("AI生成")').first().click();
    await page.waitForTimeout(15000);
    
    // 评分是复杂AI分析，需要更长时间
    await page.locator('button:has-text("申报书评分")').first().click();
    await page.waitForTimeout(30000);
    
    const hasScore = await waitForText('评分', 30000);
    if (!hasScore) throw new Error('评分报告未显示');
  });
  
  await testFeature('5.4 课题申报 - Word导出（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/grant`);
    if (!ok) throw new Error('课题申报页面加载失败');
    
    await page.locator('text=直接填写项目信息').first().click();
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input[placeholder="请输入项目名称"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('测试导出');
    
    await page.locator('button:has-text("开始撰写申报书")').first().click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("AI生成")').first().click();
    await page.waitForTimeout(15000);
    
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.locator('button:has-text("导出 Word")').first().click();
    
    const download = await downloadPromise;
    console.log(`✅ Word导出正常，文件：${download.suggestedFilename()}\n`);
  });
  
  // ========== 6. 文献搜索 ==========
  await testFeature('6.1 文献搜索 - 关键词搜索', async () => {
    const ok = await safeGoto(`${BASE_URL}/literature`);
    if (!ok) throw new Error('文献搜索页面加载失败');
    
    const searchInput = page.locator('input[placeholder*="关键词"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill('deep learning medical imaging');
    
    await page.locator('button:has-text("搜索")').first().click();
    await page.waitForTimeout(8000);
    
    const hasResults = await waitForText('找到', 10000);
    if (!hasResults) throw new Error('搜索结果未显示');
  });
  
  await testFeature('6.2 文献搜索 - AI推荐', async () => {
    const ok = await safeGoto(`${BASE_URL}/literature`);
    if (!ok) throw new Error('文献搜索页面加载失败');
    
    await page.locator('text=AI智能推荐').first().click();
    await page.waitForTimeout(1000);
    
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('深度学习在医学影像诊断中的应用');
    
    await page.locator('button:has-text("AI推荐")').first().click();
    await page.waitForTimeout(15000);
    
    const hasResults = await waitForText('AI推荐', 15000);
    if (!hasResults) throw new Error('AI推荐结果未显示');
  });
  
  await testFeature('6.3 文献搜索 - 期刊推荐（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/literature`);
    if (!ok) throw new Error('文献搜索页面加载失败');
    
    await page.locator('text=期刊推荐').first().click();
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input[placeholder*="论文标题"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('基于深度学习的医学影像分类研究');
    
    await page.locator('button:has-text("获取期刊推荐")').first().click();
    // 期刊推荐需要AI分析+数据库查询，等待时间更长
    await page.waitForTimeout(30000);
    
    const hasResults = await waitForText('推荐', 30000);
    if (!hasResults) throw new Error('期刊推荐结果未显示');
  });
  
  await testFeature('6.4 文献搜索 - 投稿辅助（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/literature`);
    if (!ok) throw new Error('文献搜索页面加载失败');
    
    await page.locator('text=投稿辅助').first().click();
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input[placeholder*="论文标题"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('基于深度学习的医学影像诊断研究');
    
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('本研究提出了一种基于深度学习的医学影像诊断方法。');
    
    await page.locator('button:has-text("生成投稿信")').first().click();
    await page.waitForTimeout(15000);
    
    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('投稿信未生成');
  });
  
  // ========== 7. 个人中心 ==========
  await testFeature('7.1 个人中心 - 学术档案（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心页面加载失败');
    await page.waitForTimeout(3000);
    
    const hasProfile = await waitForText('我的学术档案', 10000);
    if (!hasProfile) throw new Error('学术档案卡片未显示');
    
    await page.locator('button:has-text("编辑")').first().click();
    await page.waitForTimeout(1000);
    
    const fieldInput = page.locator('input[placeholder*="人工智能"]').first();
    await fieldInput.waitFor({ state: 'visible', timeout: 5000 });
    await fieldInput.fill('人工智能、医学影像');
    
    await page.locator('button:has-text("保存")').first().click();
    await page.waitForTimeout(2000);
  });
  
  await testFeature('7.2 个人中心 - 论文时间线（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心页面加载失败');
    await page.waitForTimeout(3000);
    
    const hasTimeline = await waitForText('论文时间线', 10000);
    if (!hasTimeline) throw new Error('论文时间线卡片未显示');
    
    await page.locator('button:has-text("新建论文")').first().click();
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input[placeholder*="论文标题"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('自动化测试论文-' + Date.now());
    
    await page.locator('button:has-text("创建")').first().click();
    await page.waitForTimeout(3000);
    
    const hasPaper = await waitForText('自动化测试论文', 5000);
    if (!hasPaper) throw new Error('论文创建失败');
  });
  
  await testFeature('7.3 个人中心 - 数据导出（新功能）', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心页面加载失败');
    await page.waitForTimeout(3000);
    
    const hasExport = await waitForText('数据导出', 10000);
    if (!hasExport) throw new Error('数据导出卡片未显示');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('button:has-text("导出数据")').first().click();
    
    const download = await downloadPromise;
    console.log(`✅ 数据导出正常，文件：${download.suggestedFilename()}\n`);
  });
  
  // ========== 8. 原有功能回归 ==========
  await testFeature('8.1 回归 - 登录/退出', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心页面加载失败');
    
    const hasLogout = await waitForText('退出登录');
    if (!hasLogout) throw new Error('退出登录按钮未显示');
  });
  
  await testFeature('8.2 回归 - 法律条款页', async () => {
    const ok = await safeGoto(`${BASE_URL}/legal/terms`);
    if (!ok) throw new Error('法律条款页面加载失败');
    
    const hasContent = await waitForText('用户协议');
    if (!hasContent) throw new Error('用户协议页面未加载');
  });
  
  // ========== 输出测试结果 ==========
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 全功能测试结果汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const passed = results.filter(r => r.status === '✅ 通过');
  const failed = results.filter(r => r.status === '❌ 失败');
  
  results.forEach(r => {
    console.log(`${r.status} ${r.name}${r.message ? ` - ${r.message}` : ''}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`总计：${results.length} 项测试`);
  console.log(`通过：${passed.length} 项`);
  console.log(`失败：${failed.length} 项`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (failed.length > 0) {
    console.log('\n❌ 失败项详情：');
    failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.message}`);
    });
  }
  
  console.log('\n浏览器保持打开，5分钟后自动关闭...');
  await page.waitForTimeout(300000);
  await browser.close();
}

runTests().catch(console.error);
