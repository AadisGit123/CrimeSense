from flask import Flask, request, jsonify, render_template_string, session, redirect, url_for
import base64
import requests
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import time
import threading
import random
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
app.secret_key = "YOUR_APP_SECRET_KEY "

# ==========================================
# 1. GMAIL API CONFIGURATION (Bypasses Port Blocks)
# ==========================================
# Replace these with the keys you just got from Google Cloud & OAuth Playground
CLIENT_ID = "YOUR_CLIENT_ID"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"
REFRESH_TOKEN = "YOUR_REFRESH_TOKEN"
ADMIN_EMAIL = "YOUR_ADMIN_EMAIL" 
SENDER_EMAIL = "YOUR_SENDER_EMAIL"

# ==========================================
# 2. FIREBASE INITIALIZATION
# ==========================================
try:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://aegisai-default-rtdb.firebaseio.com/'
    })
    print("[*] FIREBASE_INITIALIZED")
except Exception as e:
    print(f"[!] FIREBASE_ERROR: {e}")

nodes_online = {}

# ==========================================
# 3. UI TEMPLATES (UNCHANGED)
# ==========================================
LOGIN_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AEGISAI | AUTH</title>
    <style>
        body { margin: 0; height: 100vh; background: #050505; display: flex; justify-content: center; align-items: center; font-family: 'JetBrains Mono', monospace; color: #c9d1d9; padding: 20px; box-sizing: border-box; }
        .glass-box { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 30px; width: 100%; max-width: 350px; text-align: center; }
        .header { font-size: 18px; letter-spacing: 4px; color: #58a6ff; margin-bottom: 30px; }
        input { width: 100%; padding: 12px; margin-bottom: 20px; background: rgba(0,0,0,0.5); border: 1px solid #30363d; border-radius: 8px; color: #ffb300; text-align: center; font-size: 20px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; border-radius: 8px; background: #ffb300; color: #000; border: none; font-weight: bold; cursor: pointer; letter-spacing: 1px;}
        .msg { font-size: 11px; margin-bottom: 20px; color: #8b949e; line-height: 1.5; }
        .error { color: #f85149; font-size: 11px; margin-bottom: 15px; border: 1px solid #f85149; padding: 5px; background: rgba(248, 81, 73, 0.1); }
    </style>
</head>
<body>
    <div class="glass-box">
        <div class="header">OTP_VERIFY</div>
        {% if error %}<div class="error">[ {{ error }} ]</div>{% endif %}
        <div class="msg">A security code was dispatched. <br> Valid for 10 minutes.</div>
        <form method="POST" action="/verify">
            <input type="text" name="otp" placeholder="000000" maxlength="6" required autofocus autocomplete="off">
            <button type="submit">VERIFY_IDENTITY</button>
        </form>
    </div>
</body>
</html>
"""

DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AEGISAI | COMMAND</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --sidebar-width: 280px;
            --accent: #58a6ff;
            --success: #35e18b;
            --danger: #f85149;
            --glass-bg: rgba(22,26,34,0.85);
            --glass-border: rgba(88,166,255,0.13);
            --radius: 20px;
            --header-h: 68px;
            --gradient: linear-gradient(135deg, #0d1117 0%, #222b3a 100%);
            --card-gradient: linear-gradient(120deg, #1a2233 50%, #232a3b 100%);
            --shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
        }
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            min-height: 100vh;
            background: var(--gradient);
            color: #e0e7ef;
            font-family: 'JetBrains Mono', monospace;
            box-sizing: border-box;
            overflow-x: hidden;
        }
        .dashboard-root {
            display: flex;
            height: 100vh;
            width: 100vw;
        }
        .sidebar {
            width: var(--sidebar-width);
            background: var(--glass-bg);
            border-right: 1.5px solid var(--glass-border);
            backdrop-filter: blur(16px);
            box-shadow: 2px 0 40px 0 rgba(80,120,255,0.10);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 32px 0 24px 0;
            position: relative;
            z-index: 2;
        }
        .sidebar .brand {
            text-align: center;
            margin-bottom: 36px;
        }
        .sidebar .brand-title {
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: 6px;
            color: var(--accent);
        }
        .sidebar .brand-sub {
            font-size: 0.85rem;
            color: #8b949e;
            letter-spacing: 2px;
            margin-top: 2px;
        }
        .sidebar .nav {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 0 24px;
        }
        .sidebar .nav-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 13px 18px;
            border-radius: var(--radius);
            cursor: pointer;
            font-weight: 500;
            font-size: 1.01rem;
            color: #d1e1f9;
            background: transparent;
            transition: background 0.18s;
            border: none;
            outline: none;
            user-select: none;
        }
        .sidebar .nav-item:hover {
            background: rgba(88,166,255,0.08);
            color: var(--accent);
            transform: translateY(-2px) scale(1.025);
            box-shadow: 0 2px 10px 0 rgba(88,166,255,0.07);
        }
        .sidebar .nav-item .icon {
            font-size: 1.2em;
        }
        .sidebar .status-card {
            margin: 0 24px;
            background: rgba(35,255,140,0.10);
            border: 1.5px solid rgba(53,225,139,0.14);
            border-radius: var(--radius);
            padding: 14px 12px;
            display: flex;
            align-items: center;
            gap: 11px;
            font-size: 0.98rem;
            color: var(--success);
            font-weight: 700;
            box-shadow: 0 2px 12px 0 rgba(53,225,139,0.06);
            margin-top: 24px;
        }
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: transparent;
        }
        .main-header {
            height: var(--header-h);
            padding: 0 34px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1.5px solid var(--glass-border);
            background: rgba(13,17,23,0.60);
            backdrop-filter: blur(8px);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .main-header .header-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .main-header .header-title {
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--accent);
            letter-spacing: 2px;
        }
        .main-header .header-sub {
            font-size: 0.97rem;
            color: #8b949e;
            font-weight: 500;
            letter-spacing: 1px;
        }
        .main-header .header-actions {
            display: flex;
            align-items: center;
            gap: 22px;
        }
        .main-header #clock {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.02rem;
            color: #b2bacf;
            letter-spacing: 0.5px;
            min-width: 140px;
        }
        .logout-btn {
            background: transparent;
            color: var(--danger);
            border: 1.5px solid var(--danger);
            border-radius: 8px;
            padding: 8px 17px;
            font-size: 0.99rem;
            font-family: inherit;
            cursor: pointer;
            font-weight: 700;
            letter-spacing: 1px;
            transition: background 0.18s, color 0.18s;
        }
        .logout-btn:hover {
            background: var(--danger);
            color: #fff;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1.25fr 1.1fr;
            grid-template-rows: auto 1fr;
            gap: 28px;
            padding: 38px 38px 0 38px;
            height: calc(100vh - var(--header-h));
            box-sizing: border-box;
            grid-template-areas:
                "overview-cards overview-cards"
                "map-panel chart-panel"
                "archive-panel archive-panel";
        }
        .overview-cards {
            grid-area: overview-cards;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 6px;
        }
        .overview-card {
            background: var(--card-gradient);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            border: 1.5px solid var(--glass-border);
            padding: 28px 20px 22px 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-end;
            transition: box-shadow 0.18s, transform 0.16s;
            position: relative;
            overflow: hidden;
            min-width: 0;
            cursor: pointer;
            user-select: none;
        }
        .overview-card:hover {
            box-shadow: 0 8px 32px 0 rgba(88,166,255,0.16);
            transform: translateY(-3px) scale(1.022);
        }
        .overview-card .label {
            font-size: 0.93rem;
            color: #8b949e;
            margin-bottom: 9px;
            font-weight: 700;
            letter-spacing: 1.5px;
        }
        .overview-card .value {
            font-size: 2.3rem;
            font-weight: 700;
            color: var(--accent);
            letter-spacing: 2px;
            margin-bottom: 2px;
        }
        .overview-card .sub {
            font-size: 1.07rem;
            color: #a6e3fa;
            font-weight: 500;
        }
        .map-panel {
            grid-area: map-panel;
            background: var(--card-gradient);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            border: 1.5px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
        }
        .map-panel .panel-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent);
            padding: 18px 22px 10px 22px;
            letter-spacing: 2px;
        }
        #map-view {
            flex: 1;
            min-height: 280px;
            width: 100%;
            border: none;
            border-radius: 0 0 var(--radius) var(--radius);
            overflow: hidden;
            display: flex;
            align-items: stretch;
            justify-content: stretch;
        }
        #map-view iframe {
            width: 100%;
            height: 320px;
            border: none;
            border-radius: 0 0 var(--radius) var(--radius);
            min-height: 240px;
        }
        .chart-panel {
            grid-area: chart-panel;
            background: var(--card-gradient);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            border: 1.5px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
        }
        .chart-panel .panel-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent);
            padding: 18px 22px 10px 22px;
            letter-spacing: 2px;
        }
        #confidenceChart {
            width: 100%;
            min-height: 240px;
            max-height: 350px;
            padding: 0 18px 18px 18px;
        }
        .archive-panel {
            grid-area: archive-panel;
            margin-top: 18px;
            background: var(--card-gradient);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            border: 1.5px solid var(--glass-border);
            padding: 24px 24px 10px 24px;
            min-width: 0;
            overflow-y: auto;
            max-height: 340px;
            display: flex;
            flex-direction: column;
        }
        .archive-panel .panel-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent);
            letter-spacing: 2px;
            margin-bottom: 14px;
        }
        #log-container {
            display: flex;
            flex-direction: column;
            gap: 13px;
            min-width: 0;
        }
        .event-card {
            background: rgba(13,17,23,0.86);
            border: 1.5px solid var(--glass-border);
            border-radius: var(--radius);
            box-shadow: 0 2px 16px 0 rgba(88,166,255,0.06);
            padding: 18px 22px 14px 22px;
            transition: box-shadow 0.16s, transform 0.15s;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .event-card:hover {
            box-shadow: 0 6px 32px 0 rgba(88,166,255,0.13);
            transform: translateY(-2px) scale(1.012);
            background: rgba(13,17,23,0.98);
        }
        .event-row {
            display: flex;
            flex-wrap: wrap;
            gap: 28px;
            align-items: baseline;
            margin-bottom: 2px;
        }
        .event-label {
            font-size: 0.95rem;
            color: #8b949e;
            font-weight: 700;
            margin-right: 5px;
        }
        .event-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent);
            margin-right: 18px;
        }
        .event-confidence {
            color: var(--success);
            font-weight: 700;
            font-size: 1.08rem;
        }
        .event-confidence.critical {
            color: var(--danger);
            font-weight: 900;
            letter-spacing: 1px;
        }
        .event-timestamp {
            color: #b2bacf;
            font-size: 0.98rem;
            font-family: monospace;
            margin-top: 4px;
        }
        /* Responsive */
        @media (max-width: 1200px) {
            .dashboard-grid {
                grid-template-columns: 1fr 1fr;
            }
            .overview-cards { grid-template-columns: repeat(2, 1fr);}
        }
        @media (max-width: 900px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
                grid-template-rows: auto auto auto auto;
                grid-template-areas:
                    "overview-cards"
                    "map-panel"
                    "chart-panel"
                    "archive-panel";
                padding: 18px 6vw 0 6vw;
            }
            .overview-cards { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 700px) {
            .dashboard-root { flex-direction: column; }
            .sidebar {
                width: 100vw;
                flex-direction: row;
                align-items: flex-start;
                padding: 18px 6vw 0 6vw;
                border-right: none;
                border-bottom: 1.5px solid var(--glass-border);
                min-height: 80px;
                height: auto;
            }
            .sidebar .brand, .sidebar .status-card { display: none; }
            .sidebar .nav { flex-direction: row; gap: 8px; margin: 0; }
            .sidebar .nav-item { font-size: 0.94rem; padding: 7px 11px;}
            .main-content { padding-top: 0; }
            .main-header { padding: 0 9vw; }
            .dashboard-grid { padding: 10px 2vw 0 2vw;}
            .overview-cards { grid-template-columns: 1fr; gap: 16px;}
        }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; background: #181d24; }
        ::-webkit-scrollbar-thumb { background: #232b3c; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="dashboard-root">
        <aside class="sidebar">
            <div>
                <div class="brand">
                    <div class="brand-title">AEGISAI</div>
                    <div class="brand-sub">INTELLIGENCE CENTER</div>
                </div>
                <nav class="nav">
                    <div class="nav-item"><span class="icon">📊</span>Dashboard</div>
                    <div class="nav-item"><span class="icon">🗺️</span>Live Map</div>
                    <div class="nav-item"><span class="icon">📈</span>Analytics</div>
                    <div class="nav-item"><span class="icon">🗄️</span>Archive</div>
                </nav>
            </div>
            <div class="status-card">
                <span style="font-size:1.25em;">🟢</span> Firebase Connected
            </div>
        </aside>
        <main class="main-content">
            <header class="main-header">
                <div class="header-group">
                    <div class="header-title">Security Operations Center</div>
                    <div class="header-sub">Real-time Firebase surveillance overview</div>
                </div>
                <div class="header-actions">
                    <div id="clock"></div>
                    <a href="/logout" class="logout-btn">LOGOUT</a>
                </div>
            </header>
            <section class="dashboard-grid">
                <div class="overview-cards">
                    <div class="overview-card" id="total-alerts-card">
                        <div class="label">Total Alerts</div>
                        <div class="value" id="total-alerts">0</div>
                        <div class="sub">All time</div>
                    </div>
                    <div class="overview-card" id="online-nodes-card">
                        <div class="label">Online Nodes</div>
                        <div class="value" id="online-nodes">0</div>
                        <div class="sub">Active</div>
                    </div>
                    <div class="overview-card" id="critical-events-card">
                        <div class="label">Critical Events</div>
                        <div class="value" id="critical-events">0</div>
                        <div class="sub">Conf. &ge; 80%</div>
                    </div>
                    <div class="overview-card" id="avg-confidence-card">
                        <div class="label">Avg. Confidence</div>
                        <div class="value" id="avg-confidence">0%</div>
                        <div class="sub">Detection</div>
                    </div>
                </div>
                <div class="map-panel">
                    <div class="panel-title">TACTICAL MAP</div>
                    <div id="map-view">
                        <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=68.0%2C6.0%2C97.0%2C35.0&amp;layer=mapnik" allowfullscreen loading="lazy"></iframe>
                    </div>
                </div>
                <div class="chart-panel">
                    <div class="panel-title">DETECTION ANALYTICS</div>
                    <canvas id="confidenceChart"></canvas>
                </div>
                <div class="archive-panel">
                    <div class="panel-title">EVENT ARCHIVE</div>
                    <div id="log-container"></div>
                </div>
            </section>
        </main>
    </div>
    <script>
        // Clock
        setInterval(() => {
            const now = new Date();
            document.getElementById('clock').innerText = now.toISOString().replace('T', ' ').split('.')[0];
        }, 1000);

        // Chart.js instance
        let confidenceChartInstance = null;

        // Utility: Flatten logs to event list
        function flattenLogs(logsData) {
            if (!logsData) return [];
            let events = [];
            Object.keys(logsData).forEach(date => {
                Object.values(logsData[date] || {}).forEach(log => {
                    events.push(log);
                });
            });
            // Sort by timestamp descending
            events.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            return events;
        }

        // Render analytics chart
        function renderAnalytics(logsData) {
            const ctx = document.getElementById('confidenceChart').getContext('2d');
            const events = flattenLogs(logsData);
            // Prepare chart data: last 20 events
            const chartEvents = events.slice(-20);
            const labels = chartEvents.map(e => {
                if (e.timestamp) {
                    let t = e.timestamp.split('T');
                    return t[1] ? t[1].split('.')[0] : e.timestamp;
                }
                return '';
            });
            const data = chartEvents.map(e => e.confidence ? Math.round(e.confidence * 100) : 0);

            if (confidenceChartInstance) confidenceChartInstance.destroy();
            confidenceChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Confidence (%)',
                        data: data,
                        fill: true,
                        borderColor: '#58a6ff',
                        backgroundColor: 'rgba(88,166,255,0.15)',
                        pointBackgroundColor: '#58a6ff',
                        pointRadius: 4,
                        tension: 0.32,
                        borderWidth: 2.2,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: {
                            min: 0, max: 100,
                            ticks: { color: '#b2bacf', stepSize: 20 },
                            grid: { color: 'rgba(88,166,255,0.09)' }
                        },
                        x: {
                            ticks: { color: '#b2bacf', maxTicksLimit: 8 },
                            grid: { color: 'rgba(88,166,255,0.06)' }
                        }
                    }
                }
            });
        }

        // Render stats cards
        function renderStats(logsData, statusData) {
            // Total alerts
            const events = flattenLogs(logsData);
            document.getElementById('total-alerts').innerText = events.length;
            // Online nodes
            let online = 0;
            if (statusData && statusData.nodes) {
                online = Object.values(statusData.nodes).filter(s => s === "ONLINE").length;
            }
            document.getElementById('online-nodes').innerText = online;
            // Avg confidence
            let avg = 0;
            if (events.length > 0) {
                avg = events.map(e => e.confidence ? e.confidence : 0).reduce((a, b) => a + b, 0) / events.length;
            }
            document.getElementById('avg-confidence').innerText = (avg * 100).toFixed(1) + '%';
            // Critical events
            const crit = events.filter(e => e.confidence && e.confidence >= 0.8).length;
            document.getElementById('critical-events').innerText = crit;
        }

        // Render archive as event cards
        function renderArchive(logsData) {
            const container = document.getElementById('log-container');
            const events = flattenLogs(logsData);
            if (!events.length) {
                container.innerHTML = '<div style="color:#5c6370; padding:32px; text-align:center;">No events found.</div>';
                return;
            }
            container.innerHTML = events.slice(0, 30).map(log => {
                const conf = log.confidence ? Math.round(log.confidence * 100) : 0;
                const isCritical = log.confidence && log.confidence >= 0.8;
                return `
                    <div class="event-card">
                        <div class="event-row">
                            <span class="event-label">Node:</span>
                            <span class="event-value">${log.node_id || "?"}</span>
                            <span class="event-label">Target:</span>
                            <span class="event-value">${log.target_name || "?"}</span>
                            <span class="event-label">Confidence:</span>
                            <span class="event-confidence${isCritical ? ' critical' : ''}">${conf}%</span>
                        </div>
                        <div class="event-timestamp">${log.timestamp ? log.timestamp.replace('T',' ') : ''}</div>
                    </div>
                `;
            }).join('');
        }

        // Render node list (for legacy compatibility)
        function renderNodes(statusData) {
            // Kept for backend compatibility, but not shown in new layout
        }

        // Polling logic
        async function fetchData() {
            try {
                const [statusRes, logsRes] = await Promise.all([
                    fetch('/api/status'),
                    fetch('/api/get_logs')
                ]);
                if (statusRes.status === 401 || logsRes.status === 401) {
                    window.location.href = '/';
                    return;
                }
                const statusData = await statusRes.json();
                const logsData = await logsRes.json();
                renderStats(logsData, statusData);
                renderAnalytics(logsData);
                renderArchive(logsData);
            } catch (e) {
                console.error("SYNC_ERROR", e);
            }
        }
        setInterval(fetchData, 5000);
        fetchData();
    </script>
</body>
</html>
"""

# ==========================================
# 4. LOGIC & API (Modern Gmail API Method)
# ==========================================

def send_otp_email(otp_code):
    """Sends OTP using Gmail API via HTTPS (Port 443)"""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }
    
    try:
        # Step A: Get Access Token
        r = requests.post(token_url, data=data)
        access_token = r.json().get("access_token")
        
        # Step B: Build Email
        message = MIMEText(f"TACTICAL COMMAND CENTER ACCESS\n\nCODE: {otp_code}\nVALIDITY: 10 MINUTES")
        message['to'] = ADMIN_EMAIL
        message['from'] = SENDER_EMAIL
        message['subject'] = "AEGISAI: Security Clearance Code"
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        # Step C: Send via Gmail API
        send_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        headers = {"Authorization": f"Bearer {access_token}"}
        resp = requests.post(send_url, headers=headers, json={"raw": raw_message})
        
        if resp.status_code == 200:
            print("[*] OTP_SENT_VIA_API")
            return True
        else:
            print(f"[!] API_SEND_FAILED: {resp.text}")
            return False
    except Exception as e:
        print(f"[!] SYSTEM_MAIL_ERROR: {e}")
        return False

@app.route('/')
def root():
    if session.get('auth'): return redirect(url_for('dashboard'))
    now = datetime.now()
    if 'otp_expiry' in session:
        expiry = datetime.fromisoformat(session['otp_expiry'])
        if now < expiry: return render_template_string(LOGIN_HTML)

    otp = str(random.randint(100000, 999999))
    session['otp_code'] = otp
    session['otp_expiry'] = (now + timedelta(minutes=10)).isoformat()
    send_otp_email(otp)
    return render_template_string(LOGIN_HTML)

@app.route('/verify', methods=['POST'])
def verify():
    user_otp = request.form.get('otp')
    now = datetime.now()
    if 'otp_code' in session and 'otp_expiry' in session:
        expiry = datetime.fromisoformat(session['otp_expiry'])
        if now > expiry:
            session.pop('otp_code', None)
            return render_template_string(LOGIN_HTML, error="CODE_EXPIRED")
        if user_otp == session['otp_code']:
            session['auth'] = True
            return redirect(url_for('dashboard'))
    return render_template_string(LOGIN_HTML, error="INVALID_OTP")

@app.route('/dashboard')
def dashboard():
    if not session.get('auth'): return redirect(url_for('root'))
    return render_template_string(DASHBOARD_HTML)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('root'))

@app.route('/api/alerts', methods=['POST'])
def receive_alert():
    data = request.json
    today = datetime.now().strftime('%Y-%m-%d')
    ref = db.reference(f'alerts/{today}')
    alert_data = {
        "node_id": data.get("node_id", "EDGE_01"),
        "target_name": data.get("target_name", "UNKNOWN"),
        "confidence": data.get("confidence", 0),
        "timestamp": datetime.now().isoformat()
    }
    # Track online status
    nodes_online[alert_data["node_id"]] = time.time()
    threading.Thread(target=lambda: ref.push(alert_data), daemon=True).start()
    return jsonify({"status": "SUCCESS"}), 201

@app.route('/api/status')
def get_status():
    if not session.get('auth'): return jsonify({"error": "Unauthorized"}), 401
    current_time = time.time()
    return jsonify({"nodes": {nid: ("ONLINE" if current_time - ts < 15 else "OFFLINE") for nid, ts in nodes_online.items()}})

@app.route('/api/get_logs')
def get_logs():
    if not session.get('auth'): return jsonify({"error": "Unauthorized"}), 401
    return jsonify(db.reference('alerts').get() or {})

if __name__ == '__main__':
    # Railway uses Port 8080 by default
    app.run(host='0.0.0.0', port=8080)