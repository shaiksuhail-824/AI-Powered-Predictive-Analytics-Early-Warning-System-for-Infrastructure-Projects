import urllib.request
import json
import sys

def test_endpoint(url, name):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            content = response.read().decode('utf-8')
            print(f"PASS: {name} [{url}] -> Status {status} ({len(content)} bytes)")
            return True, content
    except Exception as e:
        print(f"FAIL: {name} [{url}] -> Error: {e}")
        return False, str(e)

print("--- TESTING PROXIED API CALLS VIA NEXT.JS (PORT 3000) ---")
test_endpoint("http://127.0.0.1:3000/api/v1/health", "Proxied Health Endpoint")
ok, overview_body = test_endpoint("http://127.0.0.1:3000/api/v1/dashboard/overview", "Proxied Dashboard Overview")
if ok:
    try:
        data = json.loads(overview_body)
        print(f"  -> Total Projects: {data.get('total_projects')}")
        print(f"  -> High Risk Projects: {data.get('high_risk_projects')}")
        print(f"  -> Delayed Projects: {data.get('delayed_projects')}")
    except:
        pass

test_endpoint("http://127.0.0.1:3000/api/v1/projects?state=Maharashtra&page_size=3", "Proxied Filtered Projects")

print("\n--- TESTING FRONTEND PAGES (PORT 3000) ---")
test_endpoint("http://127.0.0.1:3000/admin/dashboard", "Admin Dashboard Page")
test_endpoint("http://127.0.0.1:3000/admin/state/maharashtra", "State Details Page (Maharashtra)")
test_endpoint("http://127.0.0.1:3000/admin/project/060100093", "Project Details Page (060100093)")
test_endpoint("http://127.0.0.1:3000/alerts", "Alerts Page")
test_endpoint("http://127.0.0.1:3000/benchmarking", "Benchmarking Page")
test_endpoint("http://127.0.0.1:3000/projects", "Projects Page")
