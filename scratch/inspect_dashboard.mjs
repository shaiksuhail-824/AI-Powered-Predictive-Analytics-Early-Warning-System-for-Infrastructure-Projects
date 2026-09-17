import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const tempDir = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const port = 9556;
  const chromePath = '/usr/bin/google-chrome-stable';
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  let versionData = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {
      await sleep(200);
    }
  }

  if (!versionData) {
    console.error('Failed to connect to Chrome CDP');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome CDP:', versionData.Browser);

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

    await new Promise((resolve) => { ws.onopen = resolve; });

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

    async function screenshot(filepath, clip) {
      const params = { format: 'png' };
      if (clip) params.clip = clip;
      const res = await send('Page.captureScreenshot', params);
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filepath}`);
    }

    return { ws, send, evaluate, screenshot, targetId: targetPage.id };
  }

  try {
    const session = await openPage('http://localhost:3000/login');
    await sleep(2000);

    // Login as admin01
    await session.evaluate(`
      (() => {
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.type === 'text' || input.placeholder?.toLowerCase().includes('username')) {
            input.value = 'admin01';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          } else if (input.type === 'password') {
            input.value = 'password123';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      })()
    `);

    await sleep(3000);
    await session.screenshot('/tmp/after_login.png');

    // Navigate to admin dashboard
    await session.send('Page.navigate', { url: 'http://localhost:3000/admin/dashboard' });
    await sleep(4000);
    await session.screenshot('/tmp/admin_dashboard.png');

    const layoutInfo = await session.evaluate(`
      (() => {
        const bodyChildren = Array.from(document.body.children).map(el => ({
          tag: el.tagName,
          className: el.className,
          rect: el.getBoundingClientRect()
        }));

        const main = document.querySelector('main');
        const aside = document.querySelector('aside');
        const nav = document.querySelector('nav');

        return {
          bodyChildren,
          mainRect: main?.getBoundingClientRect(),
          mainClass: main?.className,
          asideRect: aside?.getBoundingClientRect(),
          asideClass: aside?.className,
          navRect: nav?.getBoundingClientRect(),
          navClass: nav?.className,
          documentTitle: document.title,
          url: window.location.href,
        };
      })()
    `);

    console.log('Layout Info:', JSON.stringify(layoutInfo, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
