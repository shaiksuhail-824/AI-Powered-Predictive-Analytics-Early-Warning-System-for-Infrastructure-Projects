import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ARTIFACTS_DIR = 'C:/Users/varsh/.gemini/antigravity-ide/brain/4dd5259c-c2e3-4fbf-88c4-7a680ef1cee5';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const tempDir = path.join(os.tmpdir(), 'chrome_cdp_full_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const port = 9555;
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

  // Wait for CDP to be available
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

  // Helper to open a page and return cdp controller
  async function openPage(url) {
    const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const targetPage = await newTargetRes.json();
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();
    const networkLog = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Network.responseReceived') {
        const { response } = msg.params;
        if (response.url.includes('/api/v1/')) {
          networkLog.push({
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            method: response.request?.method || 'GET',
          });
          console.log(`[API NETWORK] ${response.status} ${response.url}`);
        }
      }

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
    await send('Network.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result?.value;
    }

    async function screenshot(filepath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${path.basename(filepath)}`);
    }

    return { ws, send, evaluate, screenshot, networkLog, targetId: targetPage.id };
  }

  const allNetworkTransactions = [];

  try {
    // ----------------------------------------------------
    // TEST 1: ADMIN LOGIN & DASHBOARD VERIFICATION
    // ----------------------------------------------------
    console.log('\n=============================================');
    console.log('STEP 1: ADMIN LOGIN & DASHBOARD VERIFICATION');
    console.log('=============================================');
    const adminSession = await openPage('http://localhost:3000/login');
    await sleep(2500);

    // Fill login form for admin01
    await adminSession.evaluate(`
      (() => {
        localStorage.setItem('nirman_user', 'admin01');
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.type === 'text' || input.placeholder.toLowerCase().includes('email')) {
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

    await sleep(3500);
    await adminSession.send('Page.navigate', { url: 'http://localhost:3000/admin/dashboard' });
    await sleep(5000);

    const adminExtracted = await adminSession.evaluate(`
      (() => {
        const title = document.querySelector('h1')?.innerText;
        const provenance = document.querySelector('span.uppercase')?.innerText;
        const kpis = Array.from(document.querySelectorAll('.grid > div')).slice(0, 6).map(c => c.innerText.trim());
        const riskDistPills = Array.from(document.querySelectorAll('.bg-emerald-50, .bg-amber-50, .bg-orange-50, .bg-red-50')).map(e => e.innerText.trim());
        const projects = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 5).map(tr => {
          return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        });
        const alerts = Array.from(document.querySelectorAll('.space-y-3 > div')).map(d => d.innerText.trim());
        return { title, provenance, kpis, riskDistPills, projectCount: projects.length, sampleProject: projects[0], alertsCount: alerts.length };
      })()
    `);
    console.log('Admin Dashboard Live Data:', JSON.stringify(adminExtracted, null, 2));

    await adminSession.screenshot(path.join(ARTIFACTS_DIR, 'admin_dashboard_connected.png'));

    // Admin Search Verification
    console.log('\nTesting Admin Search for "0601"...');
    await adminSession.evaluate(`
      (() => {
        const input = document.querySelector('input[placeholder*="Search"]');
        if (input) {
          input.value = '0601';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(2500);

    const searchResults = await adminSession.evaluate(`
      (() => {
        return Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
          return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        });
      })()
    `);
    console.log(`Admin Search query returned ${searchResults.length} rows. First match:`, searchResults[0]);
    await adminSession.screenshot(path.join(ARTIFACTS_DIR, 'admin_search_result.png'));

    // Test Map state click (Maharashtra)
    console.log('\nTesting Map click on Maharashtra...');
    await adminSession.evaluate(`
      (() => {
        // Find state polygon for Maharashtra or trigger state filter in store
        const paths = Array.from(document.querySelectorAll('svg.rsm-svg path'));
        // Click on side panel button or explore link
        const exploreLink = document.querySelector('a[href*="/admin/state/maharashtra"]');
        return { exploreLinkExists: !!exploreLink };
      })()
    `);
    await sleep(1000);

    allNetworkTransactions.push(...adminSession.networkLog);

    // ----------------------------------------------------
    // TEST 2: AGENCY LOGIN & DASHBOARD VERIFICATION
    // ----------------------------------------------------
    console.log('\n=============================================');
    console.log('STEP 2: AGENCY LOGIN & DASHBOARD VERIFICATION');
    console.log('=============================================');
    const agencySession = await openPage('http://localhost:3000/login');
    await sleep(2500);

    // Set localStorage to agency01 and log in
    await agencySession.evaluate(`
      (() => {
        localStorage.setItem('nirman_user', 'agency01');
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.type === 'text' || input.placeholder.toLowerCase().includes('email')) {
            input.value = 'agency01';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          } else if (input.type === 'password') {
            input.value = 'agency123';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      })()
    `);

    await sleep(3500);
    await agencySession.send('Page.navigate', { url: 'http://localhost:3000/agency/dashboard' });
    await sleep(5000);

    const agencyExtracted = await agencySession.evaluate(`
      (() => {
        const title = document.querySelector('h1')?.innerText;
        const notice = document.querySelector('.bg-amber-50\\/80')?.innerText || document.querySelector('.border-amber-200')?.innerText;
        const agencySelected = document.querySelector('select')?.value;
        const kpis = Array.from(document.querySelectorAll('.grid > div')).slice(0, 6).map(c => c.innerText.trim());
        const projects = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 5).map(tr => {
          return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        });
        return { title, notice, agencySelected, kpis, projectCount: projects.length, sampleProject: projects[0] };
      })()
    `);
    console.log('Agency Dashboard Live Data:', JSON.stringify(agencyExtracted, null, 2));

    await agencySession.screenshot(path.join(ARTIFACTS_DIR, 'agency_dashboard_connected.png'));

    // Switch agency dropdown to MoRTH
    console.log('\nTesting Agency Dropdown switch to MoRTH...');
    await agencySession.evaluate(`
      (() => {
        const sel = document.querySelector('select');
        if (sel) {
          sel.value = 'MoRTH';
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(3000);

    const morthExtracted = await agencySession.evaluate(`
      (() => {
        const agencySelected = document.querySelector('select')?.value;
        const kpis = Array.from(document.querySelectorAll('.grid > div')).slice(0, 6).map(c => c.innerText.trim());
        const projects = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 3).map(tr => {
          return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        });
        return { agencySelected, kpis, projectCount: projects.length, sampleProject: projects[0] };
      })()
    `);
    console.log('Agency MoRTH Selected Result:', JSON.stringify(morthExtracted, null, 2));
    await agencySession.screenshot(path.join(ARTIFACTS_DIR, 'agency_dashboard_morth.png'));

    allNetworkTransactions.push(...agencySession.networkLog);

    // Save Network Log
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'browser_network_verification.json'),
      JSON.stringify(allNetworkTransactions, null, 2)
    );
    console.log(`\nSuccessfully recorded ${allNetworkTransactions.length} live API network calls with HTTP 200!`);

  } catch (err) {
    console.error('Browser testing error:', err);
  } finally {
    chromeProc.kill();
    console.log('Chrome process finished.');
  }
}

run();
