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

  const port = 9444;
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

  const pagesToTest = [
    {
      url: 'http://localhost:3000/admin/dashboard',
      name: 'dashboard_real_data.png',
      inspectSelector: 'h1',
    },
    {
      url: 'http://localhost:3000/admin/state/maharashtra',
      name: 'state_maharashtra_real.png',
      inspectSelector: 'h1',
    },
    {
      url: 'http://localhost:3000/admin/project/060100093',
      name: 'project_details_real.png',
      inspectSelector: 'h1',
    }
  ];

  const artifactDir = 'C:/Users/varsh/.gemini/antigravity-ide/brain/4dd5259c-c2e3-4fbf-88c4-7a680ef1cee5';

  for (const p of pagesToTest) {
    console.log(`\nNavigating to ${p.url}...`);
    const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${p.url}`, { method: 'PUT' });
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

    await new Promise(resolve => { ws.onopen = resolve; });

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

    console.log('Waiting for render and hydration...');
    await sleep(4000);

    const textEval = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          title: document.title,
          h1: document.querySelector('h1')?.textContent || '',
          bodyTextSnippet: document.body.innerText.slice(0, 500).replace(/\\n+/g, ' | ')
        };
      })()`,
      returnByValue: true
    });

    console.log('Page Info:', JSON.stringify(textEval.result.value, null, 2));

    const screenshotRes = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 1000, scale: 1 }
    });

    const outPath = path.join(artifactDir, p.name);
    fs.writeFileSync(outPath, Buffer.from(screenshotRes.data, 'base64'));
    console.log(`Saved screenshot to: ${outPath} (${fs.statSync(outPath).size} bytes)`);

    ws.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${targetPage.id}`);
  }

  chromeProc.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\nAll pages captured successfully!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
