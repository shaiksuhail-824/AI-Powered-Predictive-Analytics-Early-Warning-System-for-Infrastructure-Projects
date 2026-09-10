import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ARTIFACTS_DIR = 'C:/Users/varsh/.gemini/antigravity-ide/brain/4dd5259c-c2e3-4fbf-88c4-7a680ef1cee5';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFailure() {
  console.log('--- TESTING API FAILURE STATE (FASTAPI OFFLINE) ---');
  const tempDir = path.join(os.tmpdir(), 'chrome_cdp_fail_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const port = 9666;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    '--window-size=1440,1100',
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {
      await sleep(200);
    }
  }

  async function openPage(url) {
    const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const targetPage = await newTargetRes.json();
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise(r => { ws.onopen = r; });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result?.value;
    }

    async function screenshot(filepath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${path.basename(filepath)}`);
    }

    return { send, evaluate, screenshot };
  }

  try {
    // 1. ADMIN DASHBOARD WITH OFFLINE BACKEND
    console.log('Navigating to Admin Dashboard while FastAPI is offline...');
    const adminFail = await openPage('http://localhost:3000/admin/dashboard');
    await sleep(4000);

    const adminFailInfo = await adminFail.evaluate(`
      (() => {
        const errorBanner = document.querySelector('[role="alert"]')?.innerText;
        const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Retry'))?.innerText;
        return { errorBanner, retryBtn };
      })()
    `);
    console.log('Admin Failure State:', adminFailInfo);
    await adminFail.screenshot(path.join(ARTIFACTS_DIR, 'admin_failure_state.png'));

    // 2. AGENCY DASHBOARD WITH OFFLINE BACKEND
    console.log('\nNavigating to Agency Dashboard while FastAPI is offline...');
    const agencyFail = await openPage('http://localhost:3000/agency/dashboard');
    await sleep(4000);

    const agencyFailInfo = await agencyFail.evaluate(`
      (() => {
        const errorBanner = document.querySelector('[role="alert"]')?.innerText;
        const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Retry'))?.innerText;
        return { errorBanner, retryBtn };
      })()
    `);
    console.log('Agency Failure State:', agencyFailInfo);
    await agencyFail.screenshot(path.join(ARTIFACTS_DIR, 'agency_failure_state.png'));

  } catch (err) {
    console.error('Failure test error:', err);
  } finally {
    chromeProc.kill();
    console.log('Failure test complete.');
  }
}

testFailure();
