import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const tempDir = path.join(os.tmpdir(), 'chrome_auth_final_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const port = 9338;
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

  console.log('Connected to Chrome CDP:', versionData.Browser);

  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const targetPage = await newTargetRes.json();
  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  const interceptedRequests = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Network.requestWillBeSent') {
      const req = msg.params.request;
      if (req.url.includes('/api/v1/')) {
        interceptedRequests.push({
          url: req.url,
          method: req.method,
          hasAuthHeader: Boolean(req.headers['Authorization'] || req.headers['authorization']),
          authHeaderPrefix: (req.headers['Authorization'] || req.headers['authorization'] || '').substring(0, 18)
        });
      }
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

  const artifactDir = 'C:/Users/varsh/.gemini/antigravity-ide/brain/4dd5259c-c2e3-4fbf-88c4-7a680ef1cee5';

  async function takeScreenshot(filename) {
    const screenshotRes = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 1100, scale: 1 }
    });
    const outPath = path.join(artifactDir, filename);
    fs.writeFileSync(outPath, Buffer.from(screenshotRes.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${filename}`);
  }

  // --- Step 1: Unauthenticated Navigation to Protected Route ---
  console.log('\n==================================================');
  console.log('Step 1: Verify unauthenticated redirect to /login');
  console.log('==================================================');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/dashboard' });
  await sleep(4000);

  const urlStep1 = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('URL after attempting to access /admin/dashboard without auth:', urlStep1.result.value);
  await takeScreenshot('auth_redirect_to_login.png');

  // --- Step 2: Test Invalid Password (401 Banner) ---
  console.log('\n==================================================');
  console.log('Step 2: Test Invalid Password Error Banner');
  console.log('==================================================');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.textContent.includes('Admin') && b.textContent.includes('admin01'));
      if (adminBtn) adminBtn.click();

      // Corrupt the password input
      const inputs = Array.from(document.querySelectorAll('input'));
      const passwordInput = inputs[1];
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(passwordInput, 'WrongPassword999!');
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`
  });

  await sleep(3500);
  const errorBannerText = await send('Runtime.evaluate', {
    expression: `(() => {
      const banner = document.querySelector('.bg-red-50');
      return banner ? banner.textContent : 'NO_BANNER';
    })()`,
    returnByValue: true
  });
  console.log('Error banner output:', errorBannerText.result.value);
  await takeScreenshot('auth_login_error_banner.png');

  // --- Step 3: Test Successful Admin Login ---
  console.log('\n==================================================');
  console.log('Step 3: Test Successful Admin Login & JWT Issuance');
  console.log('==================================================');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.textContent.includes('Admin') && b.textContent.includes('admin01'));
      if (adminBtn) adminBtn.click();
    })()`
  });

  await sleep(800);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`
  });

  await sleep(6000);
  const urlStep3 = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('URL after admin login:', urlStep3.result.value);
  await takeScreenshot('auth_admin_authenticated.png');

  // --- Step 4: Verify Session Rehydration on Reload ---
  console.log('\n==================================================');
  console.log('Step 4: Verify Session Rehydration on Reload');
  console.log('==================================================');
  await send('Page.reload');
  await sleep(5000);
  const urlStep4 = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('URL after page reload (should remain on /admin/dashboard):', urlStep4.result.value);

  // --- Step 5: Test Contractor (agency01) Login ---
  console.log('\n==================================================');
  console.log('Step 5: Test Agency Contractor Login');
  console.log('==================================================');
  await send('Page.navigate', { url: 'http://localhost:3000/login' });
  await sleep(3000);

  // Clear storage to simulate clean login as contractor
  await send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.clear();
      window.location.href = '/login';
    })()`
  });
  await sleep(3000);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contractorBtn = buttons.find(b => b.textContent.includes('Contractor') && b.textContent.includes('agency01'));
      if (contractorBtn) contractorBtn.click();
    })()`
  });

  await sleep(800);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`
  });

  await sleep(6000);
  const urlStep5 = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('URL after contractor login (should be /agency/dashboard):', urlStep5.result.value);
  await takeScreenshot('auth_agency_authenticated.png');


  // --- Step 6: Test 403 Forbidden Redirection ---
  console.log('\n==================================================');
  console.log('Step 6: Test 403 Forbidden Redirection (Contractor -> Admin Dashboard)');
  console.log('==================================================');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/dashboard' });
  await sleep(4000);

  const urlStep6 = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('URL after contractor attempts to access /admin/dashboard:', urlStep6.result.value);
  await takeScreenshot('auth_forbidden_403.png');

  const forbiddenText = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        has403Badge: document.body.textContent.includes('403 Forbidden'),
        hasAccessRestricted: document.body.textContent.includes('Access Restricted'),
        roleDisplayed: document.body.textContent.includes('AGENCY_CONTRACTOR'),
        agencyScopeDisplayed: document.body.textContent.includes('NHAI')
      };
    })()`,
    returnByValue: true
  });
  console.log('Forbidden page content inspection:', JSON.stringify(forbiddenText.result.value, null, 2));

  // --- Network Analysis ---
  const authRequests = interceptedRequests.filter(r => r.hasAuthHeader);
  console.log(`\nCaptured ${interceptedRequests.length} API requests, ${authRequests.length} with Authorization: Bearer.`);

  const report = {
    testResults: {
      unauthenticatedRedirect: urlStep1.result.value.includes('/login'),
      invalidPasswordBannerShown: errorBannerText.result.value.includes('Invalid'),
      adminLoginRedirect: urlStep3.result.value.includes('/admin/dashboard'),
      sessionPersistenceOnReload: urlStep4.result.value.includes('/admin/dashboard'),
      contractorLoginRedirect: urlStep5.result.value.includes('/agency/dashboard'),
      forbiddenRedirection: urlStep6.result.value.includes('/forbidden'),
      forbiddenPageElements: forbiddenText.result.value,
    },
    totalInterceptedApiRequests: interceptedRequests.length,
    authenticatedApiRequestsCount: authRequests.length,
    sampleAuthenticatedRequests: authRequests.slice(0, 10),
  };

  fs.writeFileSync(
    path.join(artifactDir, 'auth_verification_report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n==================================================');
  console.log('FINAL VERIFICATION SUMMARY:');
  console.log('==================================================');
  console.log(JSON.stringify(report.testResults, null, 2));

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('CDP Test Complete!');
}

run().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
