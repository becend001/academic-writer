import { chromium } from 'playwright';

const BASE_URL = 'http://47.94.105.72:3000';

interface TestResult {
  name: string;
  status: '✅ 通过' | '❌ 失败' | '⚠️ 跳过';
  module: string;
  message?: string;
}

async function runTests() {
  console.log('🚀 AI学术写作助手 — 完整自动化测试');
  console.log(`📅 ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🌐 ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  const results: TestResult[] = [];

  // ========== 辅助函数 ==========
  async function testFeature(module: string, name: string, testFn: () => Promise<void>): Promise<void> {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 [${module}] ${name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    try {
      await testFn();
      results.push({ name, status: '✅ 通过', module });
    } catch (e: any) {
      console.log(`❌ ${e.message}\n`);
      results.push({ name, status: '❌ 失败', module, message: e.message });
    }
  }

  async function safeGoto(url: string): Promise<boolean> {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
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

  async function waitForSelector(selector: string, timeout = 10000): Promise<boolean> {
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

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

  await page.evaluate(() => {
    localStorage.setItem('onboarding_completed', 'true');
  });

  // ================================================================
  // 一、认证系统
  // ================================================================

  await testFeature('认证', '1.1 登录状态保持', async () => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    const hasWorkspaceBtn = await waitForText('进入工作台', 5000);
    if (!hasWorkspaceBtn) throw new Error('登录状态未保持');
  });

  await testFeature('认证', '1.2 退出登录', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心加载失败');
    await page.waitForTimeout(2000);
    const hasLogout = await waitForText('退出', 5000);
    if (!hasLogout) throw new Error('退出按钮未显示');
    // 注意：不实际退出，否则后续测试无法进行
  });

  // ================================================================
  // 二、首页
  // ================================================================

  await testFeature('首页', '2.1 首页加载', async () => {
    const ok = await safeGoto(BASE_URL);
    if (!ok) throw new Error('首页加载失败');
    const title = await page.title();
    if (!title.includes('学术写作助手')) throw new Error('标题不正确');
    const hero = await waitForText('AI驱动的');
    if (!hero) throw new Error('Hero区域未显示');
  });

  await testFeature('首页', '2.2 已登录首页显示工作台入口', async () => {
    const ok = await safeGoto(BASE_URL);
    if (!ok) throw new Error('首页加载失败');
    const hasBtn = await waitForText('进入工作台', 5000);
    if (!hasBtn) throw new Error('未显示"进入工作台"按钮');
  });

  await testFeature('首页', '2.3 首页功能区展示', async () => {
    const ok = await safeGoto(BASE_URL);
    if (!ok) throw new Error('首页加载失败');
    const hasFeatures = await waitForText('核心功能', 5000);
    if (!hasFeatures) throw new Error('功能区未显示');
    const hasPolish = await waitForText('学术润色', 3000);
    if (!hasPolish) throw new Error('润色功能未展示');
  });

  await testFeature('首页', '2.4 首页定价区展示', async () => {
    const ok = await safeGoto(BASE_URL);
    if (!ok) throw new Error('首页加载失败');
    const hasPricing = await waitForText('定价方案', 5000);
    if (!hasPricing) throw new Error('定价区未显示');
    const hasFree = await waitForText('免费版', 3000);
    if (!hasFree) throw new Error('免费版未展示');
  });

  // ================================================================
  // 三、工作台
  // ================================================================

  await testFeature('工作台', '3.1 论文润色', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败');
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

  await testFeature('工作台', '3.2 学术翻译', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败');
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

  await testFeature('工作台', '3.3 摘要生成', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败');
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

  await testFeature('工作台', '3.4 复制功能', async () => {
    // 基于3.1润色结果，测试复制按钮
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败');
    await dismissOnboarding();

    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('测试复制功能的文本。');
    await page.waitForTimeout(500);

    await page.locator('button:has-text("润色")').first().click();
    await page.waitForTimeout(15000);

    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('需要先有润色结果');

    const copyBtn = page.locator('button:has-text("复制")').first();
    const isVisible = await copyBtn.isVisible().catch(() => false);
    if (!isVisible) throw new Error('复制按钮未显示');
  });

  await testFeature('工作台', '3.5 清空功能', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台页面加载失败');
    await dismissOnboarding();

    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('测试清空功能');

    await page.locator('button:has-text("清空")').first().click();
    await page.waitForTimeout(500);

    const value = await textarea.inputValue();
    if (value !== '') throw new Error('清空后输入框仍有内容');
  });

  // ================================================================
  // 四、一键全流程
  // ================================================================

  await testFeature('全流程', '4.1 润色全流程', async () => {
    const ok = await safeGoto(`${BASE_URL}/workflow`);
    if (!ok) throw new Error('工作流页面加载失败');

    await page.locator('text=论文润色全流程').first().click();
    await page.waitForTimeout(2000);

    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('本研究采用深度学习技术对医学影像进行分析，旨在提升诊断准确率。');
    await page.waitForTimeout(500);

    await page.locator('button:has-text("开始润色")').first().click();
    await page.waitForTimeout(30000);

    const hasTabs = await page.locator('text=润色结果').isVisible().catch(() => false);
    if (!hasTabs) throw new Error('全流程结果未显示');
  });

  // ================================================================
  // 五、智能写作引导
  // ================================================================

  await testFeature('写作引导', '5.1 生成写作方案', async () => {
    const ok = await safeGoto(`${BASE_URL}/guide`);
    if (!ok) throw new Error('写作引导页面加载失败');

    const fieldInput = page.locator('input[placeholder*="人工智能"]').first();
    await fieldInput.waitFor({ state: 'visible', timeout: 5000 });
    await fieldInput.fill('人工智能');

    const keywordsInput = page.locator('input[placeholder*="深度学习"]').first();
    await keywordsInput.waitFor({ state: 'visible', timeout: 3000 });
    await keywordsInput.fill('深度学习');

    await page.locator('button:has-text("生成写作方案")').first().click();
    await page.waitForTimeout(30000);

    const hasResult = await page.locator('.whitespace-pre-wrap').first().isVisible().catch(() => false);
    if (!hasResult) throw new Error('写作方案未生成');
  });

  // ================================================================
  // 六、课题申报
  // ================================================================

  await testFeature('课题申报', '6.1 选题建议', async () => {
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

  await testFeature('课题申报', '6.2 申报书撰写', async () => {
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

  await testFeature('课题申报', '6.3 申报书评分', async () => {
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

    await page.locator('button:has-text("申报书评分")').first().click();
    await page.waitForTimeout(30000);

    const hasScore = await waitForText('评分', 30000);
    if (!hasScore) throw new Error('评分报告未显示');
  });

  await testFeature('课题申报', '6.4 Word导出', async () => {
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

  // ================================================================
  // 七、文献搜索
  // ================================================================

  await testFeature('文献搜索', '7.1 关键词搜索', async () => {
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

  await testFeature('文献搜索', '7.2 AI智能推荐', async () => {
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

  await testFeature('文献搜索', '7.3 期刊推荐', async () => {
    const ok = await safeGoto(`${BASE_URL}/literature`);
    if (!ok) throw new Error('文献搜索页面加载失败');

    await page.locator('text=期刊推荐').first().click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[placeholder*="论文标题"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('基于深度学习的医学影像分类研究');

    await page.locator('button:has-text("获取期刊推荐")').first().click();
    await page.waitForTimeout(30000);

    const hasResults = await waitForText('推荐', 30000);
    if (!hasResults) throw new Error('期刊推荐结果未显示');
  });

  await testFeature('文献搜索', '7.4 投稿辅助', async () => {
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

  // ================================================================
  // 八、个人中心
  // ================================================================

  await testFeature('个人中心', '8.1 基本信息展示', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心页面加载失败');
    await page.waitForTimeout(2000);

    const hasUserInfo = await waitForText('当前套餐', 10000);
    if (!hasUserInfo) throw new Error('用户信息未显示');
    const hasUsage = await waitForText('今日使用', 5000);
    if (!hasUsage) throw new Error('使用统计未显示');
  });

  await testFeature('个人中心', '8.2 学术档案', async () => {
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

  await testFeature('个人中心', '8.3 论文时间线', async () => {
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

  await testFeature('个人中心', '8.4 数据导出', async () => {
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

  await testFeature('个人中心', '8.5 密码修改入口', async () => {
    const ok = await safeGoto(`${BASE_URL}/profile`);
    if (!ok) throw new Error('个人中心页面加载失败');
    await page.waitForTimeout(2000);

    const hasPwdBtn = await waitForText('修改密码', 5000);
    if (!hasPwdBtn) throw new Error('修改密码入口未显示');
  });

  // ================================================================
  // 九、导航栏
  // ================================================================

  await testFeature('导航栏', '9.1 导航功能', async () => {
    const ok = await safeGoto(`${BASE_URL}/workspace`);
    if (!ok) throw new Error('工作台加载失败');
    await dismissOnboarding();

    // 检查导航栏存在
    const navItems = ['写作工具', '全流程', '写作引导', '文献搜索', '课题申报'];
    for (const item of navItems) {
      const exists = await page.locator(`text=${item}`).first().isVisible().catch(() => false);
      if (!exists) throw new Error(`导航项"${item}"未显示`);
    }
  });

  // ================================================================
  // 十、法律页面
  // ================================================================

  await testFeature('法律页面', '10.1 用户协议', async () => {
    const ok = await safeGoto(`${BASE_URL}/legal/terms`);
    if (!ok) throw new Error('用户协议页面加载失败');
    const hasContent = await waitForText('用户协议');
    if (!hasContent) throw new Error('用户协议内容未显示');
  });

  await testFeature('法律页面', '10.2 隐私政策', async () => {
    const ok = await safeGoto(`${BASE_URL}/legal/privacy`);
    if (!ok) throw new Error('隐私政策页面加载失败');
    const hasContent = await waitForText('隐私政策');
    if (!hasContent) throw new Error('隐私政策内容未显示');
  });

  // ================================================================
  // 输出测试结果
  // ================================================================

  const passed = results.filter(r => r.status === '✅ 通过');
  const failed = results.filter(r => r.status === '❌ 失败');
  const skipped = results.filter(r => r.status === '⚠️ 跳过');

  // 按模块分组统计
  const modules = [...new Set(results.map(r => r.module))];
  const moduleStats = modules.map(m => {
    const mResults = results.filter(r => r.module === m);
    return {
      module: m,
      total: mResults.length,
      passed: mResults.filter(r => r.status === '✅ 通过').length,
      failed: mResults.filter(r => r.status === '❌ 失败').length,
    };
  });

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           📊 AI学术写作助手 — 测试结果汇总               ║');
  console.log('╠══════════════════════════════════════════════════════════╣');

  // 模块统计
  for (const s of moduleStats) {
    const bar = '█'.repeat(s.passed) + '░'.repeat(s.failed);
    console.log(`║  ${s.module.padEnd(10)} ${bar}  ${s.passed}/${s.total}${s.failed > 0 ? ` ❌${s.failed}` : ''}`);
  }

  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  总计：${results.length} 项  通过：${passed.length}  失败：${failed.length}  跳过：${skipped.length}`);
  console.log(`║  通过率：${((passed.length / results.length) * 100).toFixed(1)}%`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (failed.length > 0) {
    console.log('\n❌ 失败项详情：');
    failed.forEach(f => {
      console.log(`  [${f.module}] ${f.name}: ${f.message}`);
    });
  }

  console.log('\n浏览器保持打开，5分钟后自动关闭...');
  await page.waitForTimeout(300000);
  await browser.close();
}

runTests().catch(console.error);
