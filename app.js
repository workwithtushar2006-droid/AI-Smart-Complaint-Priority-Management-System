// Initialize Lucide Icons
lucide.createIcons();

// State Management
let complaints = JSON.parse(localStorage.getItem('smartcity_complaints')) || [];
let activeSection = 'submit';

// Categories Configuration
const CATEGORIES = {
    Road: { icon: 'road', color: '#3b82f6' },
    Electricity: { icon: 'zap', color: '#fbbf24' },
    Water: { icon: 'droplets', color: '#0ea5e9' },
    Sanitation: { icon: 'trash-2', color: '#10b981' },
    'Public Safety': { icon: 'shield-alert', color: '#ef4444' },
    Other: { icon: 'help-circle', color: '#94a3b8' }
};

// --- DOM Elements ---
const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
const sections = document.querySelectorAll('.app-section');
const complaintForm = document.getElementById('complaint-form');
const dashboardContainer = document.getElementById('dashboard-container');
const emptyState = document.getElementById('empty-state');
const aiOverlay = document.getElementById('ai-processing-overlay');
const alertBadge = document.getElementById('alert-badge');

// Stat Elements
const statTotal = document.getElementById('stat-total');
const statCritical = document.getElementById('stat-critical');
const statAvg = document.getElementById('stat-avg');
const statResolved = document.getElementById('stat-resolved');

// --- Navigation Logic ---
function switchSection(sectionId) {
    sections.forEach(s => s.classList.add('hidden'));
    document.getElementById(`${sectionId}-section`).classList.remove('hidden');

    // Update Nav UI
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.id === `nav-${sectionId}` || item.id === `mobile-nav-${sectionId}`) item.classList.add('active');
    });

    activeSection = sectionId;
    if (sectionId === 'dashboard') renderDashboard();
    if (sectionId === 'analytics') updateAnalytics();
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const id = item.getAttribute('href').substring(1);
        switchSection(id);
    });
});

// --- AI Engine Simulation ---
function analyzeComplaint(description, location) {
    const desc = description.toLowerCase();
    let category = 'Other';
    let urgency = 2;
    let reason = "Standard urgency for infrastructure reports.";

    // 1. Classification
    if (desc.includes('pothole') || desc.includes('road') || desc.includes('street')) category = 'Road';
    else if (desc.includes('wire') || desc.includes('shock') || desc.includes('spark') || desc.includes('light')) category = 'Electricity';
    else if (desc.includes('leak') || desc.includes('water') || desc.includes('pipe') || desc.includes('drain')) category = 'Water';
    else if (desc.includes('garbage') || desc.includes('bin') || desc.includes('overflow') || desc.includes('smell')) category = 'Sanitation';
    else if (desc.includes('safety') || desc.includes('hazard') || desc.includes('fire') || desc.includes('accident')) category = 'Public Safety';

    // 2. Sentiment Analysis (More "Think")
    const angerKeywords = ['angry', 'disgusting', 'terrible', 'pathetic', 'dangerous', 'dying', 'urgent', 'immediately', 'now'];
    const angerScore = angerKeywords.filter(k => desc.includes(k)).length;
    const sentiment = angerScore > 2 ? 'Highly Critical' : (angerScore > 0 ? 'Concerned' : 'Neutral');

    // 3. Department Routing
    const deptMap = {
        'Road': 'Public Works Dept',
        'Electricity': 'Energy & Grid Division',
        'Water': 'Hydraulic Management',
        'Sanitation': 'City Cleanliness Board',
        'Public Safety': 'Emergency Services',
        'Other': 'General Municipal Admin'
    };
    const department = deptMap[category];

    // 4. ETA Prediction
    const baseETAHours = { 5: 2, 4: 6, 3: 12, 2: 24, 1: 48 }[urgency] || 24;
    const eta = `~${baseETAHours - (angerScore > 1 ? 1 : 0)} hours`;

    // Emergency Keyword Detection
    const criticalKeywords = ['fire', 'shock', 'explosion', 'life', 'dying', 'emergency', 'electric shock', 'major flood'];
    const isEmergency = criticalKeywords.some(key => desc.includes(key));

    // Geo-Priority Boost
    const geoPriorityKeywords = ['hospital', 'school', 'metro', 'station', 'junction', 'market'];
    const hasGeoBoost = geoPriorityKeywords.some(key => desc.includes(key) || location.toLowerCase().includes(key));

    // Urgency Scoring Logic Enhancement
    if (isEmergency) {
        urgency = 5;
        reason = "Critical: Life-threatening emergency detected via keyword analysis.";
    } else if (category === 'Electricity' || category === 'Public Safety') {
        urgency = 4;
        reason = "High: Infrastructure risk associated with safety/power hazards.";
    } else if (hasGeoBoost) {
        urgency = 4;
        reason = "High: Proximity to high-density public zones (Hospitals/Schools).";
    } else if (angerScore > 2) {
        urgency = Math.min(5, urgency + 1);
        reason = "Boosted: High citizen stress detected in report sentiment.";
    } else if (desc.length > 100) {
        urgency = Math.max(urgency, 3);
        reason = "Medium: High complexity and detailed report indicates significant issue.";
    }

    const summary = description.split('.')[0].substring(0, 60) + (description.length > 60 ? '...' : '');

    return { category, urgency, reason, summary, sentiment, department, eta };
}

// Check for Duplicates (Advanced Feature)
function isDuplicate(newDesc) {
    return complaints.some(c => {
        const similarity = compareStrings(c.description.toLowerCase(), newDesc.toLowerCase());
        return similarity > 0.8;
    });
}

function compareStrings(s1, s2) {
    let longer = s1, shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    let longerLength = longer.length;
    if (longerLength == 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// --- Form Handling ---
complaintForm.onsubmit = async (e) => {
    e.preventDefault();

    const name = document.getElementById('citizen-name').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;

    // Show Overlay
    aiOverlay.classList.remove('hidden');

    // Simulate Processing Steps
    await new Promise(r => setTimeout(r, 800));
    document.getElementById('step-classify').classList.add('active');

    await new Promise(r => setTimeout(r, 800));
    document.getElementById('step-urgency').classList.add('active');

    const analysis = analyzeComplaint(description, location);

    await new Promise(r => setTimeout(r, 800));
    document.getElementById('step-verify').classList.add('active');

    await new Promise(r => setTimeout(r, 600));

    // Check for duplicate
    const duplicate = isDuplicate(description);
    if (duplicate) analysis.reason += " (Note: Potential duplicate detected)";

    const newComplaint = {
        id: 'CMP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name,
        location,
        description,
        ...analysis,
        timestamp: new Date().toLocaleString(),
        status: 'Pending'
    };

    complaints.push(newComplaint);
    localStorage.setItem('smartcity_complaints', JSON.stringify(complaints));

    // Reset Form
    complaintForm.reset();
    aiOverlay.classList.add('hidden');
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-classify').classList.add('active');

    // Notification
    showNotification(newComplaint.urgency);

    // Switch to Dashboard
    switchSection('dashboard');
};

function showNotification(urgency) {
    if (urgency >= 5) {
        alertBadge.style.display = 'flex';
        alertBadge.innerText = '!';
        // HTML5 Notification would go here
    }
}

// --- Dashboard Rendering ---
function renderDashboard() {
    dashboardContainer.innerHTML = '';

    if (complaints.length === 0) {
        emptyState.classList.remove('hidden');
        dashboardContainer.appendChild(emptyState);
        return;
    }

    emptyState.classList.add('hidden');

    // Sort by Urgency (5 -> 1)
    const sorted = [...complaints].sort((a, b) => b.urgency - a.urgency);

    sorted.forEach((cmp, index) => {
        const card = document.createElement('div');
        card.className = 'complaint-card';
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="card-header">
                <div class="category-tag">
                    <i data-lucide="${CATEGORIES[cmp.category]?.icon || 'help-circle'}"></i>
                    ${cmp.category}
                </div>
                <div class="urgency-badge urgency-${cmp.urgency}">
                    Priority: ${cmp.urgency}
                </div>
            </div>
            <div class="ai-summary">${cmp.summary}</div>
            <div class="card-meta">
                <div class="meta-item">
                    <i data-lucide="map-pin"></i>
                    ${cmp.location}
                </div>
                <div class="meta-item">
                    <i data-lucide="calendar"></i>
                    ${cmp.timestamp}
                </div>
            </div>
            <div class="ai-reason">
                <div class="ai-insight-grid">
                    <div class="insight-item">
                        <span class="label">Sentiment:</span>
                        <span class="val pulse-text">${cmp.sentiment || 'Analyzing...'}</span>
                    </div>
                    <div class="insight-item">
                        <span class="label">ETA:</span>
                        <span class="val">${cmp.eta || 'Calculating...'}</span>
                    </div>
                    <div class="insight-item full">
                        <span class="label">Route To:</span>
                        <span class="val highlight">${cmp.department || 'General Admin'}</span>
                    </div>
                </div>
                <div class="reason-text"><strong>AI Context:</strong> ${cmp.reason}</div>
            </div>
            <div class="card-footer">
                <div class="status-toggle">
                    <button class="status-btn ${cmp.status === 'Pending' ? 'active' : ''}" onclick="updateStatus('${cmp.id}', 'Pending')">Pending</button>
                    <button class="status-btn ${cmp.status === 'In Progress' ? 'active' : ''}" onclick="updateStatus('${cmp.id}', 'In Progress')">Progress</button>
                    <button class="status-btn ${cmp.status === 'Resolved' ? 'active' : ''}" onclick="updateStatus('${cmp.id}', 'Resolved')">Resolved</button>
                </div>
                <span style="font-size: 10px; color: var(--text-secondary);">${cmp.id}</span>
            </div>
        `;
        dashboardContainer.appendChild(card);
    });

    lucide.createIcons();
}

window.updateStatus = (id, status) => {
    const idx = complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
        complaints[idx].status = status;
        localStorage.setItem('smartcity_complaints', JSON.stringify(complaints));
        renderDashboard();
        updateAnalytics();
    }
};

// --- Analytics Logic ---
function updateAnalytics() {
    const total = complaints.length;
    const critical = complaints.filter(c => c.urgency >= 5).length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const avg = total > 0 ? (complaints.reduce((acc, c) => acc + c.urgency, 0) / total).toFixed(1) : '0.0';

    // Animate numbers
    animateValue(statTotal, 0, total, 1000);
    animateValue(statCritical, 0, critical, 1000);
    statAvg.innerText = avg;
    animateValue(statResolved, 0, resolved, 1000);

    // Distribution Bars
    const distContainer = document.getElementById('category-distribution');
    distContainer.innerHTML = '';

    const counts = {};
    Object.keys(CATEGORIES).forEach(k => counts[k] = 0);
    complaints.forEach(c => counts[c.category] = (counts[c.category] || 0) + 1);

    Object.entries(counts).forEach(([cat, count]) => {
        const percent = total > 0 ? (count / total) * 100 : 0;
        const bar = document.createElement('div');
        bar.className = 'bar-item';
        bar.innerHTML = `
            <div class="bar-label">
                <span>${cat}</span>
                <span>${count}</span>
            </div>
            <div class="progress-bg">
                <div class="progress-fill" style="width: ${percent}%; background: ${CATEGORIES[cat].color}"></div>
            </div>
        `;
        distContainer.appendChild(bar);
    });

    // Log
    const log = document.getElementById('activity-log');
    if (complaints.length > 0) {
        const latest = complaints[complaints.length - 1];
        const li = document.createElement('li');
        li.innerText = `New ${latest.category} complaint analyzed at ${latest.location}.`;
        log.prepend(li);
        if (log.children.length > 5) log.lastChild.remove();
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// --- Report Generation ---
document.getElementById('generate-report-btn').onclick = () => {
    const reportTemplate = document.getElementById('report-template');
    const tableBody = document.getElementById('report-table-body');

    // Fill data
    document.getElementById('report-date').innerText = new Date().toLocaleString();
    document.getElementById('repo-total').innerText = complaints.length;
    document.getElementById('repo-critical').innerText = complaints.filter(c => c.urgency >= 5).length;
    document.getElementById('repo-resolved').innerText = complaints.filter(c => c.status === 'Resolved').length;

    tableBody.innerHTML = '';
    const sorted = [...complaints].sort((a, b) => b.urgency - a.urgency).slice(0, 10);

    sorted.forEach(c => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        row.innerHTML = `
            <td style="padding: 10px;">${c.urgency}</td>
            <td style="padding: 10px;">${c.category}</td>
            <td style="padding: 10px;">${c.summary}</td>
            <td style="padding: 10px;">${c.location}</td>
        `;
        tableBody.appendChild(row);
    });

    // Show download UI (button is in the template for the PDF to include a download button? No, let's just trigger it)
    downloadPDF();
};

function downloadPDF() {
    const element = document.getElementById('report-template');
    element.style.display = 'block'; // Temporarily show for capture

    const opt = {
        margin: 1,
        filename: 'Smart_Complaint_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
    });
}

// Initialize
switchSection('submit');
updateAnalytics();
