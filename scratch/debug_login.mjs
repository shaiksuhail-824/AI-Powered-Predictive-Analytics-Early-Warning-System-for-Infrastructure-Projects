import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const tempDir = path.join(os.tmpdir(), 'chrome_debug_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const port = 9336;
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
    } catch (e) {
      await sleep(200);
    }
  }

  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:3000/login`, { method: 'PUT' });
  const targetPage = await newTargetRes.json();
  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
    if (msg.method === 'Network.responseReceived') {
      console.log('[NETWORK RESPONSE]', msg.params.response.status, msg.params.response.url);
    }

    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

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
  await send('Network.enable');

  await sleep(3000);

  console.log('\nClicking Quick Select Admin button...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.textContent.includes('Admin') && b.textContent.includes('admin01'));
      if (adminBtn) {
        adminBtn.click();
        const inputs = Array.from(document.querySelectorAll('input'));
        return {
          foundBtn: true,
          usernameVal: inputs[0]?.value,
          passwordVal: inputs[1]?.value
        };
      }
      return { foundBtn: false };
    })()`,
    returnByValue: true
  });
  console.log('Admin button click result:', clickRes.result.value);

  await sleep(1000);

  console.log('\nSubmitting login form...');
  const submitRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Submit button clicked:', submitRes.result.value);

  await sleep(5000);

  const finalUrl = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Final URL:', finalUrl.result.value);

  const authStoreState = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        token: localStorage.getItem('paimana_access_token'),
        profile: localStorage.getItem('paimana_user_profile'),
      };
    })()`,
    returnByValue: true
  });
  console.log('Storage state after login:', authStoreState.result.value);

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(console.error);
