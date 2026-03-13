// Shared trial helper — included in all app pages

function getTrialStatus(userData) {
  const plan = userData?.plan || 'free';
  if (plan !== 'free') return { access: true };

  const ts = userData?.trialStartedAt?.toDate?.();
  if (!ts) return { access: true, trial: true, daysLeft: 14 }; // no date yet = fresh trial

  const daysLeft = Math.ceil((ts.getTime() + 14 * 86400000 - Date.now()) / 86400000);
  return daysLeft > 0 ? { access: true, trial: true, daysLeft } : { access: false, daysLeft: 0 };
}

async function ensureTrialStarted(uid, userData) {
  if ((userData?.plan || 'free') !== 'free') return;
  if (userData?.trialStartedAt) return;
  await db.collection('users').doc(uid).update({
    trialStartedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function applyTrialUI(status) {
  // Update plan label
  const label = document.getElementById('plan-label');
  if (label && status.trial) label.textContent = `Trial (${status.daysLeft}d)`;

  if (status.access && status.trial) {
    const el = document.getElementById('trial-banner');
    if (el) {
      el.querySelector('[data-days]').textContent = status.daysLeft + ' day' + (status.daysLeft !== 1 ? 's' : '');
      el.style.display = 'flex';
    }
  } else if (!status.access) {
    const main = document.querySelector('.main');
    if (main) main.innerHTML = `
      <div class="trial-gate">
        <div class="trial-gate-box">
          <div style="font-size:40px;margin-bottom:16px">⏰</div>
          <h2 style="margin-bottom:8px">Your 14-day trial has ended</h2>
          <p style="color:var(--muted);margin-bottom:24px">Upgrade to continue using CreatorFlow and keep all your data.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="upgradePlan('pro')">Pro — $19/mo</button>
            <button class="btn btn-ghost" onclick="upgradePlan('agency')">Agency — $34.99/mo</button>
          </div>
          <p style="font-size:12px;color:var(--faint);margin-top:20px">
            <a href="index.html" onclick="auth.signOut()" style="color:var(--accent)">Sign out</a>
          </p>
        </div>
      </div>`;
  }
}

function openUpgradeModal() {
  if (!document.getElementById('modal-upgrade')) {
    const el = document.createElement('div');
    el.id = 'modal-upgrade';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="upgrade-modal-inner" onclick="event.stopPropagation()">
        <button class="upgrade-modal-close" onclick="closeUpgradeModal()">×</button>
        <div class="upgrade-modal-header">
          <h2>Unlock the full power of CreatorFlow</h2>
          <p>Everything you need to run influencer campaigns like a pro</p>
        </div>
        <div class="upgrade-features-grid">
          <div class="upgrade-feature-item"><span class="uf-icon">📋</span><div><strong>Deal Pipeline</strong><p>Track every deal from Found to Paid across unlimited campaigns</p></div></div>
          <div class="upgrade-feature-item"><span class="uf-icon">👥</span><div><strong>Influencer Database</strong><p>Build a searchable database of 100+ creators with all their data</p></div></div>
          <div class="upgrade-feature-item"><span class="uf-icon">📊</span><div><strong>Campaign Analytics</strong><p>CPM, ROI, reach — see which influencers actually perform</p></div></div>
          <div class="upgrade-feature-item"><span class="uf-icon">✉️</span><div><strong>Outreach Templates</strong><p>Send first contact & follow-ups in seconds with ready templates</p></div></div>
          <div class="upgrade-feature-item"><span class="uf-icon">📥</span><div><strong>CSV Export</strong><p>Export all your campaign data to Excel or Google Sheets</p></div></div>
          <div class="upgrade-feature-item"><span class="uf-icon">⚡</span><div><strong>Drag & Drop Deals</strong><p>Move deals between stages with a simple drag — instant sync</p></div></div>
        </div>
        <div class="upgrade-plans-row">
          <div class="upgrade-plan-card highlighted">
            <div class="up-badge">Most popular</div>
            <div class="up-name">Pro</div>
            <div class="up-price">$19<span>/mo</span></div>
            <div class="up-desc">For growing brands</div>
            <ul class="up-features">
              <li>✓ Up to 100 influencers</li>
              <li>✓ 10 active campaigns</li>
              <li>✓ Full analytics + CSV export</li>
              <li>✓ Unlimited outreach templates</li>
              <li>✓ Priority support</li>
            </ul>
            <button class="btn btn-primary" style="width:100%" onclick="upgradePlan('pro')">Get Pro →</button>
          </div>
          <div class="upgrade-plan-card">
            <div class="up-name">Agency</div>
            <div class="up-price">$34.99<span>/mo</span></div>
            <div class="up-desc">For agencies & power users</div>
            <ul class="up-features">
              <li>✓ Unlimited influencers</li>
              <li>✓ Unlimited campaigns</li>
              <li>✓ Up to 5 team members</li>
              <li>✓ Everything in Pro</li>
              <li>✓ White-label reports</li>
            </ul>
            <button class="btn btn-ghost" style="width:100%" onclick="upgradePlan('agency')">Get Agency →</button>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:var(--faint);margin-top:16px">Cancel anytime · No hidden fees · Your data stays safe</p>
      </div>`;
    el.addEventListener('click', e => { if (e.target === el) closeUpgradeModal(); });
    document.body.appendChild(el);
  }
  document.getElementById('modal-upgrade').classList.add('open');
}

function closeUpgradeModal() {
  document.getElementById('modal-upgrade')?.classList.remove('open');
}

async function upgradePlan(plan) {
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, userId: currentUser.uid, email: currentUser.email })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { alert('API error: ' + text); return; }
    if (!res.ok) { alert('Error: ' + (data.error || text)); return; }
    window.location.href = data.url;
  } catch(e) {
    alert('Something went wrong: ' + e.message);
  }
}
