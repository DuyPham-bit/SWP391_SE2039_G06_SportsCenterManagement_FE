// Run through ApiIntegration.Regression --sql --browser against its isolated database.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const root = path.resolve(__dirname, '../..');
const report = path.join(root, '.validation/browser');
fs.mkdirSync(report, { recursive: true });
const browserPath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (!browserPath || !process.env.SCMS_TEST_API) throw new Error('Requires Chrome/Edge and the isolated API test fixture.');
const requests = [];
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const headers = { ...req.headers }; delete headers.host; delete headers['content-length'];
      const response = await fetch(process.env.SCMS_TEST_API + req.url, { method: req.method, headers, body: body.length ? body : undefined });
      requests.push({ path: req.url, method: req.method, status: response.status });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    const pathname = new URL(req.url, 'http://test').pathname;
    const filename = path.resolve(root, 'Frontend/dist', '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(path.join(root, 'Frontend/dist') + path.sep)) { res.writeHead(403); res.end(); return; }
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
    res.writeHead(200, { 'content-type': mime[path.extname(filename)] || 'application/octet-stream' }); res.end(fs.readFileSync(filename));
  } catch (error) { res.writeHead(500); res.end(error.message); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const webOrigin = 'http://127.0.0.1:' + server.address().port;
  const profile = path.join(report, 'profile-' + Date.now());
  const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', '--remote-debugging-port=0', '--user-data-dir='+profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  const exceptions = [];
  const results = [];
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const target = await (await fetch('http://127.0.0.1:'+port+'/json/new?about:blank', { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let nextId = 0; const pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const task = pending.get(message.id); if (!task) return;
        pending.delete(message.id); clearTimeout(task.timer);
        if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId; const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: '+method)); }, 20000);
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const wait = async expression => {
      for (let attempt = 0; attempt < 150; attempt++) { if (await evaluate(expression)) return; await delay(100); }
      throw new Error('Browser condition timed out: '+expression+'\n'+await evaluate('document.body.innerText'));
    };
    const pass = name => { results.push(name); process.stdout.write('PASS: browser '+name+'\n'); };
    const clickText = text => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(text)})); if (!button) throw new Error('Missing button'); button.click(); })()`);
    const fill = (selector, value) => evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error('Missing input'); const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event('input',{bubbles:true})); element.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    const hash = value => evaluate('window.location.hash='+JSON.stringify(value));
    const screenshot = async name => { const data = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(report, name+'.png'), Buffer.from(data.data, 'base64')); };
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: webOrigin + '/#/login' });
    await wait('document.querySelector("#login-email") !== null');
    await clickText('Tiếp tục với Google');
    await wait('document.body.textContent.includes("Google chưa được bật")');
    pass('unconfigured Google shows an explicit error'); await clickText('Đóng');
    await fill('#login-email', process.env.SCMS_TEST_COACH_EMAIL); await fill('#login-password', process.env.SCMS_TEST_PASSWORD);
    await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('window.location.hash === "#/coach/dashboard" && document.querySelector("header") !== null');
    pass('password login navigates using real JWT/profile/capabilities');
    await hash('#/coach/training-plan'); await wait('document.body.textContent.includes("Soạn Giáo Án Mới")');
    await clickText('Soạn Giáo Án Mới'); await wait('document.querySelector("form input[placeholder^=VD]") !== null');
    const inputs = await evaluate('[...document.querySelectorAll("form input[type=text]")].map(e => e.placeholder)');
    await fill('form input[placeholder='+JSON.stringify(inputs[0])+']', 'Browser Shared Plan');
    await fill('form input[placeholder='+JSON.stringify(inputs[1])+']', 'Browser Goal');
    await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('document.body.textContent.includes("Browser Shared Plan") && document.querySelector("form") === null');
    pass('coach creates and reloads shared training plan from SQL Server'); await screenshot('coach-training-plan-desktop');
    await hash('#/coach/notifications'); await wait('document.body.textContent.includes("Soạn Thông Báo Mới")');
    await clickText('Soạn Thông Báo Mới'); await wait('document.querySelector("form textarea") !== null');
    await fill('form input[type=text]', 'Browser Homework'); await fill('form textarea', 'Browser notification content');
    await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('document.body.textContent.includes("Browser Homework") && document.querySelector("form") === null');
    pass('coach sends and reloads notification from SQL Server');
    // Use the real logout flow so React state and persisted JWT change together.
    await evaluate('document.querySelector("header img[alt=Avatar]").closest("button").click()');
    await clickText('Đăng xuất');
    await wait('document.querySelector("#login-email") !== null');
    await fill('#login-email', process.env.SCMS_TEST_MEMBER_EMAIL); await fill('#login-password', process.env.SCMS_TEST_PASSWORD);
    await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('window.location.hash === "#/member/dashboard" && document.querySelector("header") !== null');
    await hash('#/member/progress'); await wait('document.body.textContent.includes("Browser Shared Plan") && document.body.textContent.includes("Completed")');
    pass('member sees persisted coach plan and progress');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await wait('document.querySelector("main").getBoundingClientRect().left < 1 && document.querySelector("aside").getBoundingClientRect().right < 1');
    await screenshot('member-progress-mobile');
    // Selector is quoted because its accessible label contains a space.
    await evaluate('document.querySelector(\'button[aria-label="Thông báo"]\').click()');
    await wait('document.body.textContent.includes("Browser Homework")'); pass('member inbox receives the coach notification');
    await hash('#/member/ai-assistant'); await wait('document.querySelector("form input[type=text]") !== null');
    await fill('form input[type=text]', 'How to warm up?'); await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('document.body.textContent.includes("AI chưa được cấu hình")'); pass('AI missing key shows server error without simulated answer');
    await evaluate('document.querySelector("header img[alt=Avatar]").closest("button").click()');
    await clickText('Đăng xuất'); await wait('document.querySelector("#login-email") !== null');
    await send('Emulation.setDeviceMetricsOverride', { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
    await fill('#login-email', process.env.SCMS_TEST_MANAGER_EMAIL); await fill('#login-password', process.env.SCMS_TEST_PASSWORD);
    await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('window.location.hash === "#/manager/dashboard" && document.querySelector("header") !== null');
    await hash('#/manager/staff'); await wait('document.body.textContent.includes("Thêm Nhân Viên Mới")');
    await clickText('Thêm Nhân Viên Mới'); await wait('document.querySelector("form input[type=text]") !== null');
    await fill('form input[type=text]', 'Browser Candidate');
    await wait('[...document.querySelectorAll("form .cursor-pointer")].some(e => e.textContent.includes("Browser Candidate"))');
    await evaluate('[...document.querySelectorAll("form .cursor-pointer")].find(e => e.textContent.includes("Browser Candidate")).click()');
    await clickText('Lễ tân quầy'); await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('document.querySelector("form") === null && [...document.querySelectorAll("tbody tr")].some(r => r.textContent.includes("Browser Candidate"))');
    pass('manager searches server members and appoints an existing account');
    await evaluate('(() => { const row = [...document.querySelectorAll("tbody tr")].find(r => r.textContent.includes("Browser Candidate")); [...row.querySelectorAll("button")].find(b => b.textContent.includes("edit")).click(); })()');
    await wait('document.querySelector("form select") !== null');
    await evaluate('(() => { const select = document.querySelector("form select"); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(select,"COACH"); select.dispatchEvent(new Event("change",{bubbles:true})); })()');
    await evaluate('document.querySelector("form button[type=submit]").click()');
    await wait('document.querySelector("form") === null && [...document.querySelectorAll("tbody tr")].some(r => r.textContent.includes("Browser Candidate") && r.textContent.includes("COACH"))');
    pass('manager changes receptionist to coach and reloads persisted role');
    await hash('#/manager/reports'); await wait('document.body.textContent.includes("Xuất Báo Cáo") && document.body.textContent.includes("101")');
    await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: report });
    const csvPath = path.join(report, 'SCMS-report-MONTH.csv');
    fs.rmSync(csvPath, { force: true });
    await clickText('Xuất Báo Cáo');
    for (let attempt = 0; attempt < 150 && !fs.existsSync(csvPath); attempt++) await delay(100);
    const csv = fs.readFileSync(csvPath, 'utf8');
    assert.ok(csv.includes('"Check-in hôm nay","101","TODAY"'));
    pass('manager exports real API report to a downloaded Unicode CSV');
    await screenshot('manager-report-desktop');
    const materialExceptions = exceptions.filter(error => !error.includes('tailwind is not defined'));
    assert.deepEqual(materialExceptions, []); pass('no application JavaScript exceptions');
    assert.equal(requests.filter(r => r.status >= 400 && !(r.path === '/api/ai/chat' && r.status === 503)).length, 0);
    pass('all business API requests succeed; missing AI key is the expected 503');
    fs.writeFileSync(path.join(report, 'report.json'), JSON.stringify({ results, requests, exceptions }, null, 2));
    fs.rmSync(path.join(report, 'failure.txt'), { force: true });
  } catch (error) {
    fs.writeFileSync(path.join(report, 'failure.txt'), error.stack);
    throw error;
  } finally {
    socket?.close(); browser.kill(); server.close();
    fs.writeFileSync(path.join(report, 'requests.json'), JSON.stringify({ requests, exceptions }, null, 2));
  }
})().catch(error => { process.stderr.write(error.stack+'\n'); process.exitCode = 1; server.close(); });
