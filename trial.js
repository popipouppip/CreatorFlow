// Shared trial helper — included in all app pages

let _cfPlan = 'free';

function getTrialStatus(userData) {
  const plan = userData?.plan || 'free';
  if (plan !== 'free') return { access: true, plan };

  const ts = userData?.trialStartedAt?.toDate?.();
  if (!ts) return { access: true, trial: true, daysLeft: 14, plan: 'free' };

  const daysLeft = Math.ceil((ts.getTime() + 14 * 86400000 - Date.now()) / 86400000);
  return daysLeft > 0 ? { access: true, trial: true, daysLeft, plan: 'free' } : { access: false, daysLeft: 0, plan: 'free' };
}

async function ensureTrialStarted(uid, userData) {
  if ((userData?.plan || 'free') !== 'free') return;
  if (userData?.trialStartedAt) return;
  await db.collection('users').doc(uid).update({
    trialStartedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function applyTrialUI(status) {
  _cfPlan = status.plan || 'free';
  const btn = document.getElementById('upgrade-btn');
  if (btn) btn.style.display = (status.plan && status.plan !== 'free') ? 'none' : '';

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
          <h2 style="margin-bottom:8px">${t('trial_ended_title')}</h2>
          <p style="color:var(--muted);margin-bottom:24px">${t('trial_ended_sub')}</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="upgradePlan('pro')">Pro — $19/mo</button>
            <button class="btn btn-ghost" onclick="upgradePlan('agency')">Agency — $34.99/mo</button>
          </div>
          <p style="font-size:12px;color:var(--faint);margin-top:20px">
            <a href="index.html" onclick="auth.signOut()" style="color:var(--accent)">${t('nav_signout')}</a>
          </p>
        </div>
      </div>`;
  }
}

function buildUpgradeModal() {
  const el = document.createElement('div');
  el.id = 'modal-upgrade';
  el.className = 'modal-overlay';
  el.innerHTML = `
    <div class="upgrade-modal-inner" onclick="event.stopPropagation()">
      <button class="upgrade-modal-close" onclick="closeUpgradeModal()">×</button>
      <div class="upgrade-modal-header">
        <h2>${t('upgrade_modal_title')}</h2>
        <p>${t('upgrade_modal_sub')}</p>
      </div>
      <div class="upgrade-features-grid">
        <div class="upgrade-feature-item"><span class="uf-icon">📋</span><div><strong>${t('uf_pipeline')}</strong><p>${t('uf_pipeline_desc')}</p></div></div>
        <div class="upgrade-feature-item"><span class="uf-icon">👥</span><div><strong>${t('uf_database')}</strong><p>${t('uf_database_desc')}</p></div></div>
        <div class="upgrade-feature-item"><span class="uf-icon">📊</span><div><strong>${t('uf_analytics')}</strong><p>${t('uf_analytics_desc')}</p></div></div>
        <div class="upgrade-feature-item"><span class="uf-icon">✉️</span><div><strong>${t('uf_templates')}</strong><p>${t('uf_templates_desc')}</p></div></div>
        <div class="upgrade-feature-item"><span class="uf-icon">📥</span><div><strong>${t('uf_csv')}</strong><p>${t('uf_csv_desc')}</p></div></div>
        <div class="upgrade-feature-item"><span class="uf-icon">⚡</span><div><strong>${t('uf_drag')}</strong><p>${t('uf_drag_desc')}</p></div></div>
      </div>
      <div class="upgrade-plans-row">
        ${_cfPlan === 'agency' ? `<div style="text-align:center;padding:32px;width:100%"><div style="font-size:32px;margin-bottom:12px">🎉</div><div style="font-weight:600;font-size:18px;margin-bottom:8px">You're on the Agency plan</div><div style="color:var(--muted)">You already have full access to all features.</div></div>` : ''}
        ${_cfPlan !== 'pro' && _cfPlan !== 'agency' ? `
        <div class="upgrade-plan-card highlighted">
          <div class="up-badge">${t('up_most_popular')}</div>
          <div class="up-name">Pro</div>
          <div class="up-price">$19<span>/mo</span></div>
          <div class="up-desc">${t('up_pro_desc')}</div>
          <ul class="up-features">
            <li>✓ ${t('up_pro_f1')}</li>
            <li>✓ ${t('up_pro_f2')}</li>
            <li>✓ ${t('up_pro_f3')}</li>
            <li>✓ ${t('up_pro_f4')}</li>
            <li>✓ ${t('up_pro_f5')}</li>
          </ul>
          <button class="btn btn-primary" style="width:100%" onclick="upgradePlan('pro')">${t('btn_get_pro')}</button>
        </div>` : ''}
        ${_cfPlan !== 'agency' ? `
        <div class="upgrade-plan-card agency-card">
          <div class="up-badge-agency">★ Premium</div>
          <div class="up-name">Agency</div>
          <div class="up-price">$34.99<span>/mo</span></div>
          <div class="up-desc">${t('up_agency_desc')}</div>
          <ul class="up-features">
            <li>✓ ${t('up_agency_f1')}</li>
            <li>✓ ${t('up_agency_f2')}</li>
            <li>✓ ${t('up_agency_f3')}</li>
            <li>✓ ${t('up_agency_f4')}</li>
            <li>✓ ${t('up_agency_f5')}</li>
          </ul>
          <button class="btn btn-ghost" style="width:100%" onclick="upgradePlan('agency')">${t('btn_get_agency')}</button>
        </div>` : ''}
      </div>
      <p style="text-align:center;font-size:12px;color:var(--faint);margin-top:16px">${t('upgrade_footer')}</p>
    </div>`;
  el.addEventListener('click', e => { if (e.target === el) closeUpgradeModal(); });
  document.body.appendChild(el);
}

function openUpgradeModal() {
  const existing = document.getElementById('modal-upgrade');
  if (existing) existing.remove();
  buildUpgradeModal();
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
