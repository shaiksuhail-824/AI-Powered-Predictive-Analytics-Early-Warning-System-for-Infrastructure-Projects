import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/varsh/.gemini/antigravity-ide/brain/4dd5259c-c2e3-4fbf-88c4-7a680ef1cee5';

async function runBrowserVerification() {
  console.log('--- STARTING COMPREHENSIVE BROWSER VERIFICATION ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const networkRequests = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/v1/')) {
      networkRequests.push({
        url,
        status: response.status(),
        statusText: response.statusText(),
        method: response.request().method(),
      });
      console.log(`[NETWORK] ${response.request().method()} ${url} -> ${response.status()}`);
    }
  });

  try {
    // 1. ADMIN FLOW: Login as admin01
    console.log('\n1. Navigating to Login Page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'admin01');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    console.log('Submitted admin login. Waiting for navigation to /admin/dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));

    // Verify Admin Dashboard renders
    console.log('Capturing Admin Dashboard full screenshot...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_dashboard_connected.png'), fullPage: true });

    // Inspect Admin KPI values & Risk Distribution
    const adminData = await page.evaluate(() => {
      const metricCards = Array.from(document.querySelectorAll('.grid > div')).map(d => ({
        text: d.innerText.split('\n').filter(Boolean)
      }));
      return {
        title: document.querySelector('h1')?.innerText,
        status: document.querySelector('span')?.innerText,
        metrics: metricCards.slice(0, 6),
      };
    });
    console.log('Admin Dashboard Extracted Data:', JSON.stringify(adminData, null, 2));

    // Test Search input on Admin Dashboard
    console.log('Testing Admin Project Search...');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('0601');
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_search_result.png') });
      console.log('Admin search screenshot captured.');
    }

    // Test State click (e.g. Maharashtra)
    console.log('Testing map state interaction...');
    const maharashtraPolygon = await page.$('path[fill]');
    if (maharashtraPolygon) {
      console.log('State polygon exists on map.');
    }

    // 2. AGENCY FLOW: Login as agency01
    console.log('\n2. Logging in as agency01...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="text"]');
    await page.evaluate(() => {
      document.querySelector('input[type="text"]').value = '';
      document.querySelector('input[type="password"]').value = '';
    });
    await page.type('input[type="text"]', 'agency01');
    await page.type('input[type="password"]', 'agency123');
    await page.click('button[type="submit"]');

    console.log('Submitted agency login. Waiting for navigation to /agency/dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));

    console.log('Capturing Agency Dashboard full screenshot...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agency_dashboard_connected.png'), fullPage: true });

    const agencyData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        return cells;
      });
      return {
        title: document.querySelector('h1')?.innerText,
        notice: document.querySelector('.bg-amber-50')?.innerText,
        agencyFilter: document.querySelector('select')?.value,
        rowCount: rows.length,
        firstRow: rows[0] || null,
      };
    });
    console.log('Agency Dashboard Extracted Data:', JSON.stringify(agencyData, null, 2));

    // Test Agency selector change to MoRTH
    console.log('Testing Agency Selector change to MoRTH...');
    await page.select('select', 'MoRTH');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agency_dashboard_morth.png'), fullPage: true });

    // Save Network summary
    await fs.writeFile(
      path.join(ARTIFACTS_DIR, 'browser_network_verification.json'),
      JSON.stringify(networkRequests, null, 2)
    );
    console.log(`Saved ${networkRequests.length} verified API network requests.`);

  } catch (err) {
    console.error('Browser verification error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

runBrowserVerification();
