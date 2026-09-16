// Wellperion Squash manager — views, forms and routing. No build step.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (d) => (d ? d : '—');

  // ---------- Schemas: drive both tables and edit dialogs ----------
  const SEGMENTS = ['lead', 'member', 'lapsed', 'junior', 'corporate', 'sponsor'];
  const CUSTOMER_STATUS = ['new', 'contacted', 'trial-booked', 'active', 'at-risk', 'lapsed', 'opted-out'];
  const CAMPAIGN_STATUS = ['planned', 'live', 'paused', 'done'];
  const CALL_OUTCOMES = ['booked', 'callback', 'info-sent', 'not-interested', 'opt-out', 'no-answer'];
  const EVENT_TYPES = ['league', 'tournament', 'open-day', 'social', 'corporate', 'coaching-clinic'];
  const EVENT_STATUS = ['idea', 'planned', 'open', 'full', 'done', 'cancelled'];
  const ASSET_TYPES = ['logo', 'font', 'template', 'photo', 'video', 'document', 'other'];

  const schemas = {
    customers: {
      title: 'Customer',
      fields: [
        { k: 'firstName', label: 'First name', required: true },
        { k: 'lastName', label: 'Last name' },
        { k: 'email', label: 'Email', type: 'email' },
        { k: 'phone', label: 'Phone (연락처)', type: 'tel' },
        { k: 'guardianName', label: 'Guardian (보호자명)' },
        { k: 'guardianPhone', label: 'Guardian phone (보호자 연락처)', type: 'tel' },
        { k: 'segment', label: 'Segment', type: 'select', options: SEGMENTS, def: 'lead' },
        { k: 'status', label: 'Status', type: 'select', options: CUSTOMER_STATUS, def: 'new' },
        { k: 'source', label: 'Source (walk-in, instagram, referral…)' },
        { k: 'joined', label: 'Joined / registered (등록일자)', type: 'date', def: today },
        { k: 'validUntil', label: 'Valid until (유효기간)', type: 'date' },
        { k: 'sessionsTotal', label: 'Sessions registered (등록회수)', type: 'number' },
        { k: 'sessionsCarried', label: 'Sessions at month start (총 잔여세션)', type: 'number' },
        { k: 'sessionsThisMonth', label: 'Sessions done this month (당월 강습 진행 세션)', type: 'number' },
        { k: 'sessionsLeft', label: 'Sessions remaining (잔여 세션)', type: 'number' },
        { k: 'payment', label: 'Payment (결제 금액)' },
        { k: 'registration', label: 'Registration (등록분류: 신규/재등록)' },
        { k: 'lessonType', label: '레슨구분 (auto: 이름에 "단체" → 단체레슨)' },
        { k: 'coach', label: 'Coach in charge (담당강사)' },
        { k: 'consentMarketing', label: 'Marketing consent', type: 'checkbox' },
        { k: 'consentCalls', label: 'Call consent', type: 'checkbox' },
        { k: 'consentSms', label: 'SMS consent (문자 수신동의)', type: 'checkbox' },
        { k: 'nextFollowUp', label: 'Next follow-up', type: 'date' },
        { k: 'notes', label: 'Notes', type: 'textarea', full: true },
      ],
    },
    campaigns: {
      title: 'Campaign',
      fields: [
        { k: 'name', label: 'Name', required: true, full: true },
        { k: 'status', label: 'Status', type: 'select', options: CAMPAIGN_STATUS, def: 'planned' },
        { k: 'owner', label: 'Owner' },
        { k: 'start', label: 'Start', type: 'date', def: today },
        { k: 'end', label: 'End', type: 'date' },
        { k: 'goal', label: 'Goal (measurable)', full: true },
        { k: 'audience', label: 'Audience segments', placeholder: 'lead, lapsed' },
        { k: 'channels', label: 'Channels', placeholder: 'instagram, calls, email' },
        { k: 'budget', label: 'Budget', type: 'number' },
        { k: 'target', label: 'Target bookings', type: 'number' },
        { k: 'notes', label: 'Notes / learnings', type: 'textarea', full: true },
      ],
    },
    calls: {
      title: 'Call',
      fields: [
        { k: 'date', label: 'Date', type: 'date', def: today, required: true },
        { k: 'caller', label: 'Caller' },
        { k: 'customerId', label: 'Customer', type: 'select', optionsFrom: 'customers', required: true },
        { k: 'campaignId', label: 'Campaign', type: 'select', optionsFrom: 'campaigns', allowEmpty: true },
        { k: 'outcome', label: 'Outcome', type: 'select', options: CALL_OUTCOMES, def: 'no-answer' },
        { k: 'callbackDate', label: 'Callback date', type: 'date' },
        { k: 'notes', label: 'Notes', type: 'textarea', full: true },
      ],
    },
    events: {
      title: 'Event',
      fields: [
        { k: 'name', label: 'Name', required: true, full: true },
        { k: 'type', label: 'Type', type: 'select', options: EVENT_TYPES, def: 'social' },
        { k: 'status', label: 'Status', type: 'select', options: EVENT_STATUS, def: 'idea' },
        { k: 'date', label: 'Date', type: 'date', required: true },
        { k: 'time', label: 'Time', type: 'time' },
        { k: 'venue', label: 'Venue' },
        { k: 'owner', label: 'Owner' },
        { k: 'capacity', label: 'Capacity', type: 'number' },
        { k: 'registered', label: 'Registered', type: 'number' },
        { k: 'price', label: 'Price', type: 'number' },
        { k: 'campaignId', label: 'Campaign', type: 'select', optionsFrom: 'campaigns', allowEmpty: true },
        { k: 'notes', label: 'Notes / checklist', type: 'textarea', full: true },
      ],
    },
    assets: {
      title: 'Brand asset',
      fields: [
        { k: 'name', label: 'Name', required: true, full: true },
        { k: 'type', label: 'Type', type: 'select', options: ASSET_TYPES, def: 'template' },
        { k: 'version', label: 'Version', placeholder: 'v1' },
        { k: 'location', label: 'File path or link', full: true, placeholder: 'brand/assets/logos/… or https://…' },
        { k: 'usage', label: 'Usage notes', type: 'textarea', full: true },
      ],
    },
  };

  // ---------- Generic dialog ----------
  const dlg = $('#dlg'), dlgForm = $('#dlg-form'), dlgFields = $('#dlg-fields');
  let dlgState = null;

  function openDialog(col, rec) {
    const schema = schemas[col];
    const isNew = !rec;
    rec = rec ? { ...rec } : {};
    dlgState = { col, rec };
    $('#dlg-title').textContent = (isNew ? 'New ' : 'Edit ') + schema.title;
    $('#dlg-delete').hidden = isNew;
    $('#dlg-delete').textContent = 'Delete';
    dlgFields.innerHTML = schema.fields.map((f) => {
      const val = rec[f.k] ?? (typeof f.def === 'function' ? f.def() : f.def) ?? '';
      const cls = f.full ? 'full' : '';
      const req = f.required ? 'required' : '';
      if (f.type === 'select') {
        let opts = f.options
          ? f.options.map((o) => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')
          : Store.list(f.optionsFrom).map((r) => `<option value="${esc(r.id)}" ${r.id === val ? 'selected' : ''}>${esc(labelOf(f.optionsFrom, r))}</option>`).join('');
        if (f.allowEmpty || (f.optionsFrom && !val)) opts = `<option value="">—</option>` + opts;
        return `<label class="${cls}">${esc(f.label)}<select name="${f.k}" ${req}>${opts}</select></label>`;
      }
      if (f.type === 'textarea') return `<label class="${cls}">${esc(f.label)}<textarea name="${f.k}">${esc(val)}</textarea></label>`;
      if (f.type === 'checkbox') return `<label class="${cls}"><span>${esc(f.label)}</span><input type="checkbox" name="${f.k}" ${val ? 'checked' : ''}></label>`;
      return `<label class="${cls}">${esc(f.label)}<input type="${f.type || 'text'}" name="${f.k}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}" ${req}></label>`;
    }).join('');
    // 웰페리온 회원 DB rows: the squash follow-up block. What is typed here is also sent to
    // the Apps Script (스쿼시 접촉 tab of the mirror) so every computer sees it after Sync.
    if (col === 'customers' && rec.clubSyncedAt) {
      $('#dlg-title').textContent = '클럽 회원 · ' + labelOf('customers', rec);
      dlgFields.innerHTML = `
        <div class="full" style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><strong>스쿼시 접촉 · 웰페리온 회원 DB</strong><span style="font-size:12px;color:var(--muted)">${[rec.memberNo && '회원번호 ' + rec.memberNo, rec.clubType, rec.clubPlan, rec.phone].filter(Boolean).map(esc).join(' · ')}</span></div>
        <label>스쿼시 담당자<input name="squashCoach" value="${esc(rec.squashCoach || '')}" placeholder="예: 이상훈"></label>
        <label>회원권${typeof rec.clubDaysLeft === 'number' ? ` (${rec.clubDaysLeft < 0 ? '만료 ' + Math.abs(rec.clubDaysLeft) + '일' : rec.clubDaysLeft + '일 남음'})` : ''}<input value="${esc([rec.clubStart, rec.clubEnd].filter(Boolean).join(' ~ ') || '—')}" disabled></label>
        <div class="full" style="font-size:12px;color:var(--muted)">지금까지의 스쿼시 Contact 기록${contactLog(rec.squashContact)}</div>
        <label class="full">새 접촉 기록 — 저장하면 오늘 날짜(${today()})로 위 기록에 추가되고 시트 "스쿼시 접촉" 탭에 기록됩니다<textarea name="clubEntry" placeholder="예: 전화 부재중, 문자 남김 / 체험 레슨 9/25 예약"></textarea></label>
        <div class="full" id="club-note-status" style="font-size:12px;color:var(--bad)" hidden></div>
        <div class="full" style="border-top:1px solid var(--line);margin:6px 0 0"></div>
        <div class="full" style="font-size:12px;color:var(--muted)">앱 내부 정보 (시트에는 저장되지 않음)</div>` + dlgFields.innerHTML;
    }
    dlg.showModal();
  }

  dlgForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (dlgState.onSave) { if (dlgState.onSave() !== false) { dlg.close(); render(); } return; }
    const { col, rec } = dlgState;
    for (const f of schemas[col].fields) {
      const el = dlgForm.elements[f.k];
      if (!el) continue;
      if (f.type === 'checkbox') rec[f.k] = el.checked;
      else if (f.type === 'number') rec[f.k] = el.value === '' ? null : Number(el.value);
      else rec[f.k] = el.value.trim();
    }
    // Club member: push 담당자 / new contact entry to the sheet first; keep the dialog
    // open with the error if Google cannot be reached, so nothing typed is lost.
    if (col === 'customers' && rec.clubSyncedAt && dlgForm.elements.clubEntry) {
      const coach = dlgForm.elements.squashCoach.value.trim();
      const entry = dlgForm.elements.clubEntry.value.trim();
      if (entry || coach !== (rec.squashCoach || '')) {
        const status = $('#club-note-status'), saveBtn = dlgForm.querySelector('button[type=submit]');
        status.hidden = true; saveBtn.disabled = true; saveBtn.textContent = '시트에 저장 중…';
        try {
          await saveClubNote(rec, coach, entry);
        } catch (err) {
          status.textContent = '⚠ 시트에 저장하지 못했습니다: ' + err.message + ' — 다시 시도하거나 취소하세요.';
          status.hidden = false; saveBtn.disabled = false; saveBtn.textContent = 'Save';
          return;
        }
        saveBtn.disabled = false; saveBtn.textContent = 'Save';
        rec.squashCoach = coach;
        if (entry) rec.squashContact = [rec.squashContact || '', `${today()} ${entry}`].filter(Boolean).join('\n');
      }
    }
    Store.upsert(col, rec);
    if (col === 'calls') syncCustomerFromCall(rec);
    dlg.close();
    render();
  });
  // Text on a club member that belongs in the 스쿼시 Contact log but is not there yet:
  // the 회원 DB's 비고 (clubNote — stays in the DB, so "moved" = copied) and the app's
  // local Notes field. Lines already present in the log are skipped.
  function clubNoteToMove(c) {
    if (!c.clubSyncedAt) return [];
    const have = String(c.squashContact || '');
    return [c.clubNote, c.notes].map((t) => String(t || '').replace(/\r/g, '').trim()).filter((t) => t && !have.includes(t));
  }
  async function moveClubNotes(btn) {
    const pending = Store.list('customers').map((c) => ({ c, texts: clubNoteToMove(c) })).filter((x) => x.texts.length);
    if (!pending.length) return;
    if (!confirm(`${pending.length}명의 비고/Notes 내용을 스쿼시 Contact 기록으로 복사하고 시트 "스쿼시 접촉" 탭에 저장합니다.\n(앱의 Notes 칸은 비워지고, 회원 DB의 비고는 그대로 남습니다.) 진행할까요?`)) return;
    const label = btn.textContent; btn.disabled = true;
    let done = 0; const errors = [];
    for (const { c, texts } of pending) {
      btn.textContent = `저장 중… ${done + 1}/${pending.length}`;
      const entry = texts.join('\n');
      try {
        await saveClubNote(c, c.squashCoach || '', entry);
        c.squashContact = [c.squashContact || '', /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})(\s|$)/.test(entry) ? entry : `${today()} ${entry}`].filter(Boolean).join('\n');
        c.notes = '';
        Store.upsert('customers', c); done++;
      } catch (err) { errors.push(`${labelOf('customers', c)}: ${err.message}`); if (/doPost|배포/.test(err.message)) break; }
    }
    btn.disabled = false; btn.textContent = label;
    alert(`${done}건 옮김${errors.length ? `\n\n실패:\n${errors.join('\n')}` : ''}`);
    render();
  }
  // POST { action: 'club-note' } to the Apps Script behind the 웰페리온 회원 DB source
  // (same /exec URL + token as the reads; a text/plain body avoids a CORS preflight).
  async function saveClubNote(rec, coach, entry) {
    const srcs = Store.settings().sheet.sources || [];
    const src = srcs.find((x) => x.kind === 'clubdb' && /script\.google\.com\/macros\//.test(x.url || '')) || srcs.find((x) => x.token);
    if (!src) throw new Error('Apps Script 소스가 없습니다 (Google Sheet 설정 확인).');
    const exec = src.url.split('?')[0];
    const body = { action: 'club-note', token: tokenFor(src.url, src.token), memberNo: rec.memberNo || '', name: labelOf('customers', rec), phone: rec.phone || '', squashCoach: coach, entry };
    let res;
    try { res = await fetch(exec, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' }); }
    catch (err) { throw new Error('Google에 연결할 수 없습니다 (' + err.message + ')'); }
    const text = await res.text();
    let j; try { j = JSON.parse(text); } catch (err) { throw new Error(/doPost/.test(text) ? 'Apps Script에 doPost가 없습니다 — Code.gs / ClubNotes.gs를 최신으로 배포하세요.' : 'Apps Script 응답을 읽을 수 없습니다 (' + res.status + ')'); }
    if (!j.ok) throw new Error(j.error || 'unknown error');
    return j;
  }
  $('#dlg-cancel').onclick = () => dlg.close();
  $('#dlg-delete').onclick = () => {
    if (dlgState.onDelete) { if (dlgState.onDelete() !== false) { dlg.close(); render(); } return; }
    if (!confirm('Delete this record? This cannot be undone.')) return;
    Store.remove(dlgState.col, dlgState.rec.id);
    dlg.close();
    render();
  };

  // ---------- Google Sheet source (Customers) ----------
  // Each column: k (field), h (header), f (cell html), t (type: text | enum | num | date —
  // drives the filter control and sort order), v (raw value used for sorting/filtering).
  const daysLeftHtml = (c) => typeof c.clubDaysLeft === 'number' ? `<span class="${c.clubDaysLeft < 0 ? 'pill bad' : c.clubDaysLeft <= 30 ? 'pill warn' : 'pill ok'}">${c.clubDaysLeft < 0 ? '만료 ' + Math.abs(c.clubDaysLeft) + '일' : c.clubDaysLeft + '일 남음'}</span>` : '—';
  const num = (x) => { const n = Number(String(x ?? '').replace(/[^\d.-]/g, '')); return String(x ?? '').trim() === '' || isNaN(n) ? null : n; };
  const consentIcons = (c) => [c.consentSms && '💬', c.consentCalls && '☎', c.consentMarketing && '✉'].filter(Boolean).join(' ');
  const CUSTOMER_COLUMNS = [
    { k: 'name', h: '회원명', t: 'text', v: (c) => labelOf('customers', c), f: (c) => `<strong>${esc(labelOf('customers', c))}</strong>${c.sheetRemovedAt ? ' <span class="pill bad" title="시트에서 삭제된 회원 (통화 기록이 있어 보관)">시트 삭제</span>' : ''}`, always: true },
    { k: 'coach', h: '담당강사', t: 'enum', multi: true, v: (c) => c.coach || '', f: (c) => esc(c.coach) || '—' },
    // 회원구분: show the sheet's wording (일반회원, WSC…) when known; the English segment is kept for filtering.
    { k: 'segment', h: '회원구분', t: 'enum', v: (c) => c.segmentLabel || c.segment || '', f: (c) => (c.segmentLabel ? esc(c.segmentLabel) : pill(c.segment)) },
    { k: 'lessonType', h: '레슨구분', t: 'enum', v: (c) => c.lessonType || Sheets.lessonTypeOf(c), f: (c) => esc(c.lessonType || Sheets.lessonTypeOf(c)) },
    { k: 'status', h: 'Status', t: 'enum', v: (c) => c.status || '', f: (c) => pill(c.status) },
    { k: 'phone', h: '연락처', t: 'text', v: (c) => c.phone || '', f: (c) => esc(c.phone) || '—' },
    { k: 'guardianPhone', h: '보호자 연락처', t: 'text', v: (c) => `${c.guardianPhone || ''} ${c.guardianName || ''}`.trim(), f: (c) => esc(c.guardianPhone) + (c.guardianName ? ` <span style="color:var(--muted)">(${esc(c.guardianName)})</span>` : '') || '—' },
    { k: 'email', h: '이메일', t: 'text', v: (c) => c.email || '', f: (c) => esc(c.email) || '—' },
    { k: 'source', h: 'Source', t: 'enum', v: (c) => c.source || '', f: (c) => esc(c.source) || '—' },
    { k: 'joined', h: '등록일자', t: 'date', v: (c) => c.joined || '', f: (c) => fmtDate(c.joined) },
    { k: 'validUntil', h: '유효기간', t: 'date', v: (c) => c.validUntil || '', f: (c) => fmtDate(c.validUntil) },
    { k: 'sessionsTotal', h: '등록회수', t: 'num', v: (c) => num(c.sessionsTotal), f: (c) => esc(c.sessionsTotal) || '—' },
    { k: 'sessionsCarried', h: '총 잔여세션', t: 'num', v: (c) => num(c.sessionsCarried), f: (c) => esc(c.sessionsCarried) || '—' },
    { k: 'sessionsThisMonth', h: '당월 진행', t: 'num', v: (c) => num(c.sessionsThisMonth), f: (c) => esc(c.sessionsThisMonth) || '—' },
    { k: 'sessionsLeft', h: '잔여 세션', t: 'num', v: (c) => num(c.sessionsLeft), f: (c) => (c.sessionsLeft === 0 ? '<strong style="color:var(--bad)">0</strong>' : esc(c.sessionsLeft) || '—') },
    { k: 'payment', h: '결제 금액', t: 'num', v: (c) => num(c.payment), f: (c) => esc(c.payment) || '—' },
    { k: 'registration', h: '등록분류', t: 'enum', v: (c) => c.registration || '', f: (c) => esc(c.registration) || '—' },
    { k: 'consent', h: '수신동의', t: 'enum', v: consentIcons, f: (c) => consentIcons(c) || '—' },
    { k: 'inqDate', h: '문의 접수일', t: 'date', v: (c) => c.inqDate || '', f: (c) => fmtDate(c.inqDate) },
    { k: 'inqProgram', h: '문의 프로그램', t: 'enum', v: (c) => c.inqProgram || '', f: (c) => esc(c.inqProgram) || '—' },
    { k: 'inqAge', h: '연령대', t: 'enum', v: (c) => c.inqAge || '', f: (c) => esc(c.inqAge) || '—' },
    { k: 'inqAgeText', h: '나이/생년', t: 'text', v: (c) => c.inqAgeText || '', f: (c) => esc(c.inqAgeText) || '—' },
    { k: 'inqMessage', h: '문의 내용', t: 'text', v: (c) => c.inqMessage || '', f: (c) => esc(c.inqMessage) || '—', wrap: true },
    { k: 'inqFirstContact', h: '최초 연락', t: 'date', v: (c) => c.inqFirstContact || '', f: (c) => fmtDate(c.inqFirstContact) },
    { k: 'inqHistory', h: '이전 문의 내역', t: 'text', v: (c) => c.inqHistory || '', f: (c) => contactLog(c.inqHistory), log: true },
    // 웰페리온 회원 DB columns
    { k: 'clubName', h: '회원명', t: 'text', v: (c) => labelOf('customers', c), f: (c) => `<strong>${esc(labelOf('customers', c))}</strong><div class="sub">${[c.memberNo, c.clubType, c.source !== 'clubdb' ? (c.source === 'inquiry' ? '문의 있음' : '레슨 회원') : ''].filter(Boolean).map(esc).join(' · ') || '—'}</div>` },
    { k: 'clubAge', h: '나이', t: 'num', v: (c) => num(c.clubAge), f: (c) => (c.clubAge ? esc(c.clubAge) + '세' : '—') },
    { k: 'clubPlan', h: '회원권', t: 'enum', v: (c) => c.clubPlan || '', f: (c) => `${esc(c.clubPlan) || '—'}${c.clubReg ? `<div class="sub">${esc(c.clubReg)}</div>` : ''}` },
    { k: 'clubStart', h: '시작', t: 'date', v: (c) => c.clubStart || '', f: (c) => fmtDate(c.clubStart) },
    { k: 'clubEnd', h: '종료', t: 'date', v: (c) => c.clubEnd || '', f: (c) => fmtDate(c.clubEnd) },
    { k: 'clubDaysLeft', h: '잔여일', t: 'num', v: (c) => (typeof c.clubDaysLeft === 'number' ? c.clubDaysLeft : null), f: daysLeftHtml },
    { k: 'clubType', h: '회원 구분', t: 'enum', v: (c) => c.clubType || '', f: (c) => esc(c.clubType) || '—' },
    { k: 'clubStaff', h: '담당자', t: 'enum', v: (c) => c.clubStaff || '', f: (c) => esc(c.clubStaff) || '—' },
    { k: 'squashCoach', h: '스쿼시 담당자', t: 'enum', v: (c) => c.squashCoach || '', f: (c) => esc(c.squashCoach) || '—' },
    { k: 'squashContact', h: '스쿼시 Contact', t: 'text', v: (c) => c.squashContact || '', f: (c) => contactLog(c.squashContact), log: true },
    { k: 'clubNotes', h: '비고 · 재등록상담', t: 'text', v: (c) => `${c.clubNote || ''} ${c.clubRenewalNote || ''} ${c.clubEndReason || ''}`.trim(), log: true,
      f: (c) => `<div class="log">${c.clubNote ? `<div>${esc(c.clubNote)}</div>` : ''}${c.clubRenewalNote ? `<div><b>재등록상담${c.clubRenewalDate ? ' ' + esc(c.clubRenewalDate) : ''}</b> ${esc(c.clubRenewalNote)}</div>` : ''}${c.clubEndReason ? `<div class="sub">종료사유: ${esc(c.clubEndReason)}</div>` : ''}${!c.clubNote && !c.clubRenewalNote && !c.clubEndReason ? '—' : ''}</div>` },
    // Compact lead cells: name + facts on a second line; inquiry text + program/wish + earlier inquiries in one cell.
    { k: 'leadName', h: '회원명', t: 'text', v: (c) => labelOf('customers', c), f: (c) => `<strong>${esc(labelOf('customers', c))}</strong><div class="sub">${[c.inqAge, c.inqAgeText, c.inqRegion, c.segmentLabel].filter(Boolean).map(esc).join(' · ') || '—'}</div>` },
    { k: 'inqSummary', h: '문의 내용', t: 'text', v: (c) => `${c.inqProgram || ''} ${c.inqWish || ''} ${c.inqMessage || ''} ${c.inqHistory || ''}`.trim(), log: true,
      f: (c) => `<div class="log">${c.inqProgram || c.inqWish ? `<div class="sub">${esc([c.inqProgram, c.inqWish].filter(Boolean).join(' · '))}</div>` : ''}${c.inqMessage ? `<div>${esc(c.inqMessage)}</div>` : ''}${c.inqHistory ? `<div class="sub" title="이전 문의 내역">${String(c.inqHistory).split(/\n+/).map((l) => '↩ ' + esc(l)).join('<br>')}</div>` : ''}${!c.inqMessage && !c.inqHistory && !c.inqProgram ? '—' : ''}</div>` },
    // 연락내용: the contact log, one dated entry per line ("08/28 09:00 …", "9/1 …").
    { k: 'inqLog', h: '연락내용', t: 'text', v: (c) => c.inqLog || '', f: (c) => contactLog(c.inqLog), log: true },
    { k: 'inqRegion', h: '지역', t: 'enum', v: (c) => c.inqRegion || '', f: (c) => esc(c.inqRegion) || '—' },
    { k: 'inqWish', h: '희망 요일/시간', t: 'text', v: (c) => c.inqWish || '', f: (c) => esc(c.inqWish) || '—' },
    { k: 'lastContact', h: '최근 연락', t: 'date', v: (c) => c.lastContact || '', f: (c) => fmtDate(c.lastContact) },
    { k: 'nextFollowUp', h: '다음 연락', t: 'date', v: (c) => c.nextFollowUp || '', f: (c) => fmtDate(c.nextFollowUp) },
    { k: 'notes', h: 'Notes', t: 'text', v: (c) => c.notes || '', f: (c) => esc(c.notes), wrap: true },
  ];

  // ---- Column filters + sorting for the Customers table ----
  // state.colFilters[k]: enum → exact value ('(없음)' = blank); text → substring; num/date → { min, max }.
  const splitMulti = (v) => String(v || '').split(/\s*[,/]\s*/).filter(Boolean);
  const filterActive = (f) => !(f == null || f === '' || (typeof f === 'object' && !f.min && !f.max && f.min !== 0));
  function matchesFilter(col, c, flt) {
    if (!filterActive(flt)) return true;
    const v = col.v(c);
    if (col.t === 'enum') return flt === '(없음)' ? !v : col.multi ? splitMulti(v).includes(flt) : String(v) === flt;
    if (col.t === 'text') return String(v).toLowerCase().includes(String(flt).toLowerCase());
    if (v === null || v === '') return false; // blanks never satisfy a range
    if (col.t === 'num') return (flt.min === '' || flt.min == null || v >= Number(flt.min)) && (flt.max === '' || flt.max == null || v <= Number(flt.max));
    return (!flt.min || v >= flt.min) && (!flt.max || v <= flt.max); // dates: ISO strings compare lexically
  }
  const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
  function sortRows(rows, cols, ts) {
    const col = cols.find((c) => c.k === ts.sort.k) || cols[0];
    const dir = ts.sort.dir;
    const blank = (v) => v === null || v === '' || v === undefined;
    return rows.slice().sort((a, b) => {
      const va = col.v(a), vb = col.v(b);
      if (blank(va) !== blank(vb)) return blank(va) ? 1 : -1; // blanks at the bottom either way
      if (blank(va)) return 0;
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va), String(vb));
      return r * dir || collator.compare(labelOf('customers', a), labelOf('customers', b));
    });
  }
  // One control per visible column, rendered as a second header row.
  function filterRow(cols, allRows, ts) {
    const fl = ts.colFilters;
    return cols.map((col) => {
      const f = fl[col.k];
      if (col.t === 'enum') {
        const vals = Array.from(new Set(allRows.flatMap((c) => col.multi ? splitMulti(col.v(c)) : [String(col.v(c) || '')]))).filter(Boolean).sort(collator.compare);
        const hasBlank = allRows.some((c) => !col.v(c));
        return `<th><select data-fk="${col.k}" title="${esc(col.h)} 필터"><option value="">전체</option>${vals.map((v) => `<option ${f === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}${hasBlank ? `<option value="(없음)" ${f === '(없음)' ? 'selected' : ''}>(없음)</option>` : ''}</select></th>`;
      }
      if (col.t === 'num') return `<th><span class="range"><input type="number" data-fk="${col.k}" data-part="min" placeholder="최소" value="${esc(f?.min ?? '')}"><input type="number" data-fk="${col.k}" data-part="max" placeholder="최대" value="${esc(f?.max ?? '')}"></span></th>`;
      if (col.t === 'date') return `<th><span class="range"><input type="date" data-fk="${col.k}" data-part="min" title="이후" value="${esc(f?.min ?? '')}"><input type="date" title="이전" data-fk="${col.k}" data-part="max" value="${esc(f?.max ?? '')}"></span></th>`;
      return `<th><input type="search" data-fk="${col.k}" placeholder="검색" value="${esc(f ?? '')}"></th>`;
    }).join('');
  }
  const activeFilters = (ts) => Object.values(ts.colFilters).filter(filterActive).length;
  // Every active filter applies, whether or not its column is currently visible (chips filter hidden fields).
  function applyFilters(rows, ts) {
    for (const [k, flt] of Object.entries(ts.colFilters)) {
      const col = CUSTOMER_COLUMNS.find((c) => c.k === k);
      if (col && filterActive(flt)) rows = rows.filter((c) => matchesFilter(col, c, flt));
    }
    return rows;
  }

  // Headline numbers above the Customers table. Each chip is a shortcut for the
  // matching column filter (click again to clear). Counts are over all customers.
  // Counts are PERSONS: names that differ only by digits or a bracketed suffix
  // ("Augustus1", "김무건(단체)") are one person here, while the list keeps every record.
  const personOf = (c) => { const ph = String(c.phone || '').replace(/\D+/g, ''); return ph.length >= 7 ? 'p:' + ph.slice(-9) : (Sheets.personKey(labelOf('customers', c)) || c.id); };
  const persons = (list) => new Set(list.map(personOf)).size;
  function customerStats(all) {
    const count = (fn) => persons(all.filter(fn));
    const tally = (k, split) => { const m = new Map(); for (const c of all) for (const v of (split ? splitMulti(c[k]) : [c[k] || ''])) if (v) { if (!m.has(v)) m.set(v, new Set()); m.get(v).add(personOf(c)); } for (const [v, set] of m) m.set(v, set.size); return m; };
    const ordered = (m, pref) => pref.filter((v) => m.has(v)).concat(Array.from(m.keys()).filter((v) => !pref.includes(v)).sort(collator.compare));
    const chip = (label, n, k, v) => `<button class="chip ${tbl('members').colFilters[k] === v ? 'on' : ''}" data-chip-k="${esc(k)}" data-chip-v="${esc(v)}" data-chip-t="members" title="${esc(label)} 필터"><span class="n">${n}</span> ${esc(label)}</button>`;
    const coaches = tally('coach', true), regs = tally('registration'), kinds = tally('segmentLabel');
    const lessons = new Map(); for (const c of all) { const v = c.lessonType || Sheets.lessonTypeOf(c); if (!lessons.has(v)) lessons.set(v, new Set()); lessons.get(v).add(personOf(c)); } for (const [v, set] of lessons) lessons.set(v, set.size);
    const group = (title, chips) => chips.length ? `<div class="stat-group"><div class="stat-title">${esc(title)}</div><div class="chips">${chips.join('')}</div></div>` : '';
    const zero = count((c) => c.sessionsLeft === 0);
    return `<div class="stats">
      <div class="stat-group total"><div class="stat-title">전체 회원</div><div class="big">${persons(all)}<span class="sub">명${persons(all) !== all.length ? ` · 명단 ${all.length}행` : ''}</span></div>${zero ? `<button class="chip warn ${tbl('members').colFilters.sessionsLeft && tbl('members').colFilters.sessionsLeft.max === '0' ? 'on' : ''}" data-chip-k="sessionsLeft" data-chip-v="0" data-chip-t="members" title="잔여 세션 0 필터"><span class="n">${zero}</span> 잔여 세션 0</button>` : ''}</div>
      ${group('담당강사', ordered(coaches, ['이상훈', '박상현']).map((v) => chip(v, coaches.get(v), 'coach', v)))}
      ${group('등록분류', ordered(regs, ['신규', '재등록']).map((v) => chip(v, regs.get(v), 'registration', v)))}
      ${group('회원구분', ordered(kinds, ['정회원', '비회원', 'WSC']).map((v) => chip(v, kinds.get(v), 'segment', v)))}
      ${group('레슨구분', ordered(lessons, ['단체레슨', '개인레슨']).map((v) => chip(v, lessons.get(v), 'lessonType', v)))}
    </div>`;
  }
  // Columns of the 문의 (leads) table under Outreach.
  const LEAD_COLUMNS = ['leadName', 'inqDate', 'status', 'phone', 'coach', 'inqFirstContact', 'nextFollowUp', 'inqSummary', 'inqLog'];
  const CLUB_COLUMNS = ['clubName', 'clubAge', 'clubPlan', 'clubStart', 'clubEnd', 'clubDaysLeft', 'phone', 'squashCoach', 'squashContact', 'clubNotes'];
  // Split a free-text contact log at each date token so every contact is its own line.
  function contactLog(text) {
    const t = String(text || '').replace(/\r/g, '').trim();
    if (!t) return '—';
    const lines = t.split(/\n+|(?=(?:^|\s)(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})(?:\s|$))/).map((l) => l.trim()).filter(Boolean);
    return `<div class="log">${lines.map((l) => {
      const m = l.match(/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})(?:\s+(\d{1,2}:\d{2}))?\s*(.*)$/s);
      return m ? `<div><b>${esc(m[1])}${m[2] ? ' ' + esc(m[2]) : ''}</b> ${esc(m[3])}</div>` : `<div>${esc(l)}</div>`;
    }).join('')}</div>`;
  }
  // Mirrors the 8 columns pulled from the customer sheet (see apps-script/Code.gs COLUMNS).
  const DEFAULT_COLUMNS = ['name', 'segment', 'lessonType', 'joined', 'validUntil', 'sessionsTotal', 'sessionsCarried', 'sessionsThisMonth', 'sessionsLeft', 'payment', 'registration', 'coach'];

  // Several sheets can feed Customers (e.g. one per coach/branch); each has its
  // own URL, token and column mapping. Sync reads them all and merges by
  // email/phone/name. The dialog edits one source at a time (idx); idx ===
  // sources.length means "add a new one".
  function openSheetSettings(idx = 0) {
    const s = Store.settings().sheet;
    const sources = s.sources || [];
    if (typeof idx !== 'number') idx = 0; // called from a click handler
    const isNew = idx >= sources.length;
    const src = isNew ? { name: `Sheet ${sources.length + 1}`, url: '', token: '', mapping: {} } : sources[idx];
    const visible = s.columns || DEFAULT_COLUMNS;
    dlgState = { onSave: () => saveSheetSettings(idx), onDelete: () => removeSheetSource(idx) };
    $('#dlg-title').textContent = isNew && sources.length ? 'Add a Google Sheet source' : 'Google Sheet source';
    $('#dlg-delete').hidden = isNew;
    $('#dlg-delete').textContent = 'Remove this sheet';
    const picker = sources.length ? `<label class="full">Sheet<select id="sheet-pick">${sources.map((x, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${esc(x.name || x.url || 'Sheet ' + (i + 1))}</option>`).join('')}<option value="${sources.length}" ${isNew ? 'selected' : ''}>＋ Add another sheet…</option></select></label>` : '';
    const mappingRows = (headers, map) => Sheets.FIELDS.map((f) => `<label>${esc(f.label)}<select name="map:${f.k}"><option value="">— not in sheet —</option>${headers.map((h) => `<option value="${esc(h)}" ${map[f.k] === h ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></label>`).join('');
    const knownHeaders = Array.from(new Set(Object.values(src.mapping || {})));
    dlgFields.innerHTML = `
      ${picker}
      <label class="full">Name (for your reference, e.g. "Coach A members")<input name="name" value="${esc(src.name || '')}" placeholder="Sheet ${idx + 1}"></label>
      <label class="full">담당강사 — coach in charge of the members in this sheet (shown in the 담당강사 column)<input name="coach" value="${esc(src.coach || '')}" placeholder="e.g. 이상훈"></label>
      <label class="full">시트 종류 · Source kind<select name="kind">
        <option value="members" ${(src.kind || (src.enrichOnly ? 'contacts' : 'members')) === 'members' ? 'selected' : ''}>회원 시트 — members (rows become customers; 담당강사 above applies)</option>
        <option value="contacts" ${(src.kind || (src.enrichOnly ? 'contacts' : 'members')) === 'contacts' ? 'selected' : ''}>연락처 전용 — contact info only: matches people by name, never adds customers</option>
        <option value="clubdb" ${src.kind === 'clubdb' ? 'selected' : ''}>웰페리온 회원 DB — club membership database (enriches matching people; others become 클럽회원 records)</option>
        <option value="leads" ${src.kind === 'leads' ? 'selected' : ''}>문의 시트 — inquiries (status/last contact/notes from the sheet; members are only annotated)</option>
      </select></label>
      <label class="full">문의 구분 표시 — label shown in 회원구분 for inquiries from this sheet (e.g. 문의·주니어)<input name="leadLabel" value="${esc(src.leadLabel || '')}" placeholder="문의·주니어"></label>
      <label class="full">Apps Script web app URL (…/exec) — or a sheet URL shared "Anyone with the link". Another tab of the same mirror: add <code>?gid=&lt;tab gid&gt;</code> to the /exec URL.<input name="url" value="${esc(src.url)}" placeholder="https://script.google.com/macros/s/…/exec?gid=123456" required></label>
      <label class="full">Token (from setToken in Apps Script; leave blank for a public sheet or for another tab of a sheet already configured here)<input name="token" type="password" value="${esc(src.token)}" autocomplete="off"></label>
      <label class="full"><span></span><button type="button" class="ghost" id="btn-load-headers">Load columns from sheet</button></label>
      <div class="full" id="sheet-status" style="font-size:12px;color:var(--muted)"></div>
      <div class="full"><strong style="font-size:12px">Column mapping</strong> <span style="font-size:12px;color:var(--muted)">(sheet column → app field; guessed automatically, adjust as needed)</span></div>
      <div class="full fields" id="map-fields">${mappingRows(knownHeaders, src.mapping || {})}</div>
      <div class="full"><strong style="font-size:12px">Columns shown in the table</strong></div>
      <div class="full" id="col-picks" style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px">
        ${CUSTOMER_COLUMNS.map((c) => `<label style="flex-direction:row;align-items:center;gap:5px;color:var(--ink)"><input type="checkbox" name="col:${c.k}" ${c.always ? 'checked disabled' : visible.includes(c.k) ? 'checked' : ''}>${esc(c.h)}</label>`).join('')}
      </div>
      <p class="full" style="font-size:12px;color:var(--muted);margin:0">Read-only: the app never writes to the sheet. Rows sharing an email, phone or name are merged into one customer — across all configured sheets. Setup guide: <code>apps-script/README.md</code>.</p>`;
    const pick = $('#sheet-pick');
    if (pick) pick.onchange = () => { dlg.close(); openSheetSettings(Number(pick.value)); };
    $('#btn-load-headers').onclick = async () => {
      const status = $('#sheet-status');
      status.textContent = 'Loading…';
      try {
        const csv = await Sheets.fetchCSV(dlgForm.elements.url.value, tokenFor(dlgForm.elements.url.value, dlgForm.elements.token.value));
        const { headers, records } = Sheets.toTable(csv);
        const current = readMapping();
        const guess = Sheets.guessMapping(headers);
        // Keep the user's existing choices when the header still exists, but never
        // let two fields end up on the same column (a stale choice loses to the guess).
        const merged = Object.assign({}, guess);
        for (const [k, h] of Object.entries(current)) {
          if (!headers.includes(h)) continue;
          const other = Object.keys(merged).find((x) => x !== k && merged[x] === h);
          if (other && guess[k] && guess[k] !== h) continue; // stale: guess has a better column for k
          if (other) delete merged[other];
          merged[k] = h;
        }
        $('#map-fields').innerHTML = mappingRows(headers, merged);
        status.textContent = `Found ${headers.length} columns and ${records.length} rows: ${headers.join(' · ')}`;
      } catch (err) { status.textContent = '⚠ ' + err.message; status.style.color = 'var(--bad)'; }
    };
    dlg.showModal();
  }
  function readMapping() {
    const map = {};
    for (const f of Sheets.FIELDS) { const el = dlgForm.elements['map:' + f.k]; if (el && el.value) map[f.k] = el.value; }
    return map;
  }
  function saveSheetSettings(idx) {
    const columns = CUSTOMER_COLUMNS.filter((c) => c.always || dlgForm.elements['col:' + c.k].checked).map((c) => c.k);
    const sources = (Store.settings().sheet.sources || []).slice();
    const prev = sources[idx] || { id: Date.now().toString(36) };
    sources[idx] = Object.assign({}, prev, {
      name: dlgForm.elements.name.value.trim() || `Sheet ${idx + 1}`,
      url: dlgForm.elements.url.value.trim(),
      token: dlgForm.elements.token.value.trim(),
      coach: dlgForm.elements.coach.value.trim(),
      kind: dlgForm.elements.kind.value,
      enrichOnly: dlgForm.elements.kind.value === 'contacts',
      leadLabel: dlgForm.elements.leadLabel.value.trim(),
      mapping: readMapping(),
    });
    Store.setSheetSettings({ sources, columns });
  }
  function removeSheetSource(idx) {
    const sources = (Store.settings().sheet.sources || []).slice();
    if (!sources[idx] || !confirm(`Remove "${sources[idx].name || 'this sheet'}" from the sources? Customers already imported stay in the app.`)) return false;
    sources.splice(idx, 1);
    Store.setSheetSettings({ sources });
  }
  const hasIdentity = (map) => map && (map.fullName || map.firstName || map.email || map.phone);
  // Sources that point at the same Apps Script (/exec) share its token, so a
  // second tab (…/exec?gid=…) can be added with the token field left blank.
  function tokenFor(url, token) {
    if (token) return token;
    const base = (u) => String(u || '').split('?')[0];
    const twin = (Store.settings().sheet.sources || []).find((x) => x.token && base(x.url) === base(url));
    return twin ? twin.token : '';
  }
  async function syncFromSheet(btn) { return Store.batch(() => syncFromSheetInner(btn)); }
  async function syncFromSheetInner(btn) {
    const s = Store.settings().sheet;
    const sources = (s.sources || []).filter((x) => x.url);
    if (!sources.length) return openSheetSettings();
    // A source whose mapping never got guessed (its first fetch after login failed):
    // try again now from the live headers before giving up.
    for (const src of sources) {
      if (hasIdentity(src.mapping)) continue;
      try {
        const { headers } = Sheets.toTable(await Sheets.fetchCSV(src.url, tokenFor(src.url, src.token)));
        const m = Sheets.guessMapping(headers);
        if (src.kind === 'leads' || src.kind === 'clubdb') delete m.segment;
        if (src.kind === 'clubdb') delete m.coach;
        if (hasIdentity(m)) { src.mapping = m; Store.setSheetSettings({ sources: (s.sources || []).map((x) => (x.id === src.id ? Object.assign({}, x, { mapping: m }) : x)) }); }
      } catch (e) { console.warn('mapping failed for', src.name, e.message); }
    }
    const bad = sources.findIndex((x) => !hasIdentity(x.mapping));
    if (bad >= 0) { alert(`"${sources[bad].name}": map at least a name, email or phone column first (Load columns).`); return openSheetSettings(bad); }
    // Contact-only sources must not count as "every source succeeded" for pruning unless they ran too — they do run; nothing to change here.
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Syncing…';
    const total = { rows: 0, unique: 0, collapsed: 0, added: 0, updated: 0, merged: 0, removed: 0, sheets: [], warnings: [] };
    const runAt = new Date().toISOString();
    const errors = [];
    for (const src of sources) { // sequential so later sheets merge into customers created by earlier ones
      btn.textContent = `Syncing ${src.name}…`;
      try {
        const csv = await Sheets.fetchCSV(src.url, tokenFor(src.url, src.token));
        const kind = src.kind || (src.enrichOnly ? 'contacts' : 'members');
        const r = Sheets.sync(csv, src.mapping, Store, { coach: kind === 'members' ? (src.coach || '') : '', now: runAt, enrichOnly: kind === 'contacts', leads: kind === 'leads', clubdb: kind === 'clubdb', segmentLabel: src.leadLabel || '문의' });
        if (r.unmatched && r.unmatched.length) total.warnings.push(`${src.name}: ${r.unmatched.length}명은 회원 명단에 없음 — ${r.unmatched.slice(0, 10).join(', ')}${r.unmatched.length > 10 ? '…' : ''}`);
        for (const k of ['rows', 'unique', 'collapsed', 'added', 'updated', 'merged']) total[k] += r[k] || 0;
        total.sheets.push({ name: src.name, ...r });
      } catch (err) { errors.push(`${src.name}: ${err.message}`); }
    }
    // Only prune when every source succeeded — a failed fetch must not look like "everyone left".
    if (total.sheets.length === sources.length && !errors.length) {
      const pr = Sheets.pruneMissing(Store, runAt);
      total.removed = pr.removed; total.keptRemoved = pr.kept;
    }
    if (total.sheets.length) Store.setSheetSettings({ lastSync: new Date().toISOString(), lastResult: total });
    if (errors.length) alert('Sync problems:\n' + errors.join('\n'));
    btn.disabled = false; btn.textContent = label;
    render();
  }

  // Asks the Apps Script to rebuild the 문의-주니어/시니어 tabs from the 웰페리온 문의 DB
  // spreadsheet (buildInquiryTabs), then runs a normal Sync so the leads update here.
  async function importInquiries(btn) {
    const src = (Store.settings().sheet.sources || []).find((x) => /script\.google\.com/.test(x.url || ''));
    if (!src) return alert('Google Sheet source (Apps Script URL) is not configured.');
    const u = new URL(src.url); u.search = ''; u.searchParams.set('action', 'rebuild-inquiries'); u.searchParams.set('token', src.token || '');
    const label = btn.textContent; btn.disabled = true; btn.textContent = '문의 DB 읽는 중… (최대 1분)';
    try {
      const res = await fetch(u.toString(), { redirect: 'follow' });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'unknown error');
      const tabs = (j.sourceTabs || []).map((t) => `${t.name}: ${t.rows}행`).join(', ');
      btn.textContent = label; btn.disabled = false;
      alert(`문의 DB 가져오기 완료\n문의-주니어 ${j.juniors}건 · 문의-시니어 ${j.seniors}건 (총 ${j.inquiries}건, 수기 입력 ${j.kept}칸 유지)\n원본 탭: ${tabs || '-'}\n\n이제 Sync를 실행합니다.`);
      const syncBtn = $('#btn-sync-leads') || $('#btn-sync');
      if (syncBtn) await syncFromSheet(syncBtn);
    } catch (err) {
      btn.textContent = label; btn.disabled = false;
      alert('문의 DB 가져오기 실패: ' + err.message + '\n(Apps Script가 최신 버전으로 배포되어 있는지 확인하세요: Deploy → New version)');
    }
  }

  // Read-only view of the SMS_LOG tab kept by apps-script/Sms.gs (fetched via
  // the first Apps Script source with ?action=smslog).
  async function showSmsLog(btn) {
    const src = (Store.settings().sheet.sources || []).find((x) => /script.google.com/.test(x.url || ''));
    if (!src) return;
    const u = new URL(src.url); u.searchParams.set('action', 'smslog');
    const label = btn.textContent; btn.disabled = true; btn.textContent = '불러오는 중…';
    try {
      const { headers, records } = Sheets.toTable(await Sheets.fetchCSV(u.toString(), tokenFor(src.url, src.token)));
      const cols = headers.map((h) => ({ h, f: (r) => esc(r[h]), wrap: h === '메시지' }));
      dlgState = { onSave: () => true };
      $('#dlg-title').textContent = '문자 발송 기록 (SMS_LOG)';
      $('#dlg-delete').hidden = true;
      dlgFields.innerHTML = `<div class="full" style="grid-column:1/-1;max-height:60vh;overflow:auto">${table(cols, records.map((r, i) => ({ id: i, ...r })), null, '아직 발송된 문자가 없습니다. 설정: apps-script/README.md → "Automatic texts".')}</div>`;
      rowHandlers.pop(); // dialog table has no row handler; keep the view's handler list intact
      dlg.showModal();
    } catch (err) { alert('문자 기록을 불러오지 못했습니다: ' + err.message); }
    btn.disabled = false; btn.textContent = label;
  }

  // A logged call updates the customer's last-contact / follow-up / status.
  function syncCustomerFromCall(call) {
    const c = Store.get('customers', call.customerId);
    if (!c) return;
    c.lastContact = call.date;
    if (call.outcome === 'callback' && call.callbackDate) c.nextFollowUp = call.callbackDate;
    if (call.outcome === 'booked' && c.status === 'new') c.status = 'trial-booked';
    if (call.outcome === 'opt-out') { c.status = 'opted-out'; c.consentCalls = false; c.consentMarketing = false; }
    else if (c.status === 'new') c.status = 'contacted';
    Store.upsert('customers', c);
  }

  function labelOf(col, r) {
    if (col === 'customers') return `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email || r.id;
    return r.name || r.id;
  }
  const nameOf = (col, id) => { const r = id && Store.get(col, id); return r ? labelOf(col, r) : '—'; };

  const pillClass = (v) => ({
    active: 'ok', booked: 'ok', live: 'ok', open: 'ok', done: '',
    'at-risk': 'warn', callback: 'warn', paused: 'warn', full: 'warn', planned: 'info', 'trial-booked': 'info',
    lapsed: 'bad', 'opted-out': 'bad', 'opt-out': 'bad', 'not-interested': 'bad', cancelled: 'bad',
  }[v] || '');
  const pill = (v) => v ? `<span class="pill ${pillClass(v)}">${esc(v)}</span>` : '—';

  // ---------- Table helper ----------
  // opts.sort = { k, dir } makes headers with a k clickable (▲/▼); opts.filterRow = <th>… html for a second header row.
  // opts.footer = html for a summary row under the table (e.g. row totals).
  function table(cols, rows, onRow, emptyMsg, opts = {}) {
    const th = (c) => opts.sort && c.k
      ? `<th class="sortable ${opts.sort.k === c.k ? 'sorted' : ''}" data-sort="${c.k}" title="정렬">${esc(c.h)} <span class="arrow">${opts.sort.k === c.k ? (opts.sort.dir > 0 ? '▲' : '▼') : '↕'}</span></th>`
      : `<th>${esc(c.h)}</th>`;
    const thead = `<thead><tr>${cols.map(th).join('')}</tr>${opts.filterRow ? `<tr class="filters">${opts.filterRow}</tr>` : ''}</thead>`;
    rowHandlers.push(onRow);
    if (!rows.length) {
      if (!opts.filterRow) { rowHandlers.pop(); return `<div class="table-wrap"><div class="empty">${esc(emptyMsg || 'Nothing here yet.')}</div></div>`; }
      return `<div class="table-wrap" data-tbl="${opts.tbl || ''}"><table>${thead}</table><div class="empty">${esc(emptyMsg || 'Nothing here yet.')}</div></div>`;
    }
    return `<div class="table-wrap" data-tbl="${opts.tbl || ''}"><table>${thead}
      <tbody>${rows.map((r) => `<tr data-id="${esc(r.id)}">${cols.map((c) => `<td class="${c.log ? 'logcell' : c.wrap ? 'wrap' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody>${opts.footer ? `<tfoot><tr><td colspan="${cols.length}">${opts.footer}</td></tr></tfoot>` : ''}</table></div>`;
  }
  let rowHandlers = [];

  function head(title, extra = '') {
    return `<div class="view-head"><h1>${esc(title)}</h1>${extra}</div>`;
  }

  // ---------- Views ----------
  const state = { view: 'dashboard', q: '', filter: '', tables: {
    members: { sort: { k: 'name', dir: 1 }, colFilters: {}, initial: 20, limit: 20 },
    leads: { sort: { k: 'inqDate', dir: -1 }, colFilters: {}, initial: 10, limit: 10 },
  } };
  const tbl = (key) => state.tables[key];
  state.tables.club = { sort: { k: 'clubEnd', dir: -1 }, colFilters: {}, initial: 10, limit: 10 };
  // Footer paging: "+20 더 보기" grows the limit by 20; "접기" returns to the initial count.
  function pageFooter(ts, shownCount, total, key, label) {
    const more = total - shownCount;
    return `${more > 0 ? `<strong>${shownCount}</strong> / ${total}${label}` : `합계: <strong>${total}${label}</strong>`}` +
      (more > 0 ? ` <button class="ghost" data-page="${key}" data-step="20" style="margin-left:12px;font-size:12px">+ ${Math.min(20, more)}${label} 더 보기</button>` : '') +
      (ts.limit > ts.initial ? ` <button class="ghost" data-page="${key}" data-step="reset" style="margin-left:6px;font-size:12px">접기 · 처음 ${ts.initial}${label}만</button>` : '');
  }
  const isLead = (c) => c.source === 'inquiry';
  const isClub = (c) => c.source === 'clubdb';

  const views = {
    dashboard() {
      const cs = Store.list('customers'), ev = Store.list('events'), cp = Store.list('campaigns'), calls = Store.list('calls');
      const t = today();
      const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
      const upcoming = ev.filter((e) => e.date >= t && e.status !== 'cancelled' && e.status !== 'done').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
      const due = cs.filter((c) => c.nextFollowUp && c.nextFollowUp <= in30 && c.status !== 'opted-out').sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp)).slice(0, 8);
      const callsThisMonth = calls.filter((c) => c.date && c.date.slice(0, 7) === t.slice(0, 7));
      const booked = callsThisMonth.filter((c) => c.outcome === 'booked').length;
      const card = (n, l) => `<div class="card"><div class="num">${n}</div><div class="label">${l}</div></div>`;
      // Members whose 잔여 세션 has reached 0 (or below): the 재등록 call list. A person who
      // re-upped shows up as a second row ("김민준1") with sessions left AND a 등록일자 → not a
      // target. A numbered row without 등록일자 is not a re-registration (owner's rule).
      // Same person = same name ignoring digits/brackets, unless both rows carry different phones.
      const synced = cs.filter((c) => c.sheetSyncedAt && typeof c.sessionsLeft === 'number');
      const digits = (c) => String(c.phone || '').replace(/\D+/g, '').slice(-9);
      const samePerson = (a, b) => Sheets.personKey(labelOf('customers', a)) === Sheets.personKey(labelOf('customers', b))
        && !(digits(a).length >= 7 && digits(b).length >= 7 && digits(a) !== digits(b));
      const active = synced.filter((c) => c.sessionsLeft > 0 && c.joined);
      const out = synced.filter((c) => c.sessionsLeft <= 0 && !active.some((a) => samePerson(a, c)))
        .sort((a, b) => (a.coach || '').localeCompare(b.coach || '', 'ko') || (a.validUntil || '').localeCompare(b.validUntil || '') || labelOf('customers', a).localeCompare(labelOf('customers', b), 'ko'));
      return head('Dashboard') + `
        <div class="cards">
          ${card(cs.filter((c) => c.status === 'active').length, 'Active members')}
          ${card(cs.filter((c) => isLead(c) && ['new', 'contacted', 'trial-booked'].includes(c.status)).length, 'Open inquiries')}
          ${card(cp.filter((c) => c.status === 'live').length, 'Live campaigns')}
          ${card(callsThisMonth.length, 'Calls this month')}
          ${card(callsThisMonth.length ? Math.round(100 * booked / callsThisMonth.length) + '%' : '—', 'Call → booking rate')}
          ${card(upcoming.length, 'Upcoming events')}
        </div>
        <div class="two-col">
          <div class="panel"><h2>Upcoming events</h2>${upcoming.length ? `<ul>${upcoming.map((e) => `<li><strong>${fmtDate(e.date)}</strong> — ${esc(e.name)} ${pill(e.status)} <span class="pill">${e.registered || 0}/${e.capacity || '∞'}</span></li>`).join('')}</ul>` : '<p class="empty">No upcoming events. Add one under Events.</p>'}</div>
          <div class="panel"><h2>잔여 세션 0 — 재등록 대상 <span class="pill bad">${out.length}명</span></h2>${out.length ? `<ul>${out.map((c) => `<li><strong>${esc(labelOf('customers', c))}</strong> — ${esc(c.coach) || '—'} · ${esc(c.segmentLabel || c.segment || '')}${c.validUntil ? ` · 유효기간 ${fmtDate(c.validUntil)}` : ''}${c.phone || c.guardianPhone ? ` · ${esc(c.phone || c.guardianPhone)}` : ''}</li>`).join('')}</ul><p style="margin:10px 0 0"><button class="ghost" id="btn-out-customers" style="font-size:12px">Customers 탭에서 필터로 보기</button></p>` : '<p class="empty">잔여 세션이 0인 회원이 없습니다. (Sync 후 갱신됩니다)</p>'}</div>
          <div class="panel"><h2>Follow-ups due (next 30 days)</h2>${due.length ? `<ul>${due.map((c) => `<li><strong>${fmtDate(c.nextFollowUp)}</strong> — ${esc(labelOf('customers', c))} ${pill(c.status)}</li>`).join('')}</ul>` : '<p class="empty">Nothing due. Set “Next follow-up” on a customer or log a callback.</p>'}</div>
        </div>`;
    },

    customers() {
      const ts = tbl('members');
      const q = state.q.toLowerCase();
      const all = Store.list('customers').filter((c) => !isLead(c) && !isClub(c)); // inquiries and club DB live under Campaigns & Calls
      let rows = all.filter((c) => !q || JSON.stringify(c).toLowerCase().includes(q));
      if (state.filter) rows = rows.filter((c) => c.segment === state.filter);
      const sheet = Store.settings().sheet;
      const visible = sheet.columns || DEFAULT_COLUMNS;
      const cols = CUSTOMER_COLUMNS.filter((c) => visible.includes(c.k));
      rows = applyFilters(rows, ts);
      rows = sortRows(rows, cols, ts);
      const nf = activeFilters(ts);
      const extra = `<input type="search" id="q" placeholder="Search…" value="${esc(state.q)}">
        <select id="filter"><option value="">All segments</option>${SEGMENTS.map((s) => `<option ${s === state.filter ? 'selected' : ''}>${s}</option>`).join('')}</select>
        ${nf ? `<button class="ghost" id="btn-clear-filters" data-tbl="members" title="Clear the column filters">필터 해제 (${nf})</button>` : ''}
        <button class="ghost" id="btn-sheet" title="Configure the Google Sheet source">Google Sheet</button>
        <button class="ghost" id="btn-sync" title="Pull customers from the Google Sheet(s)" ${(sheet.sources || []).some((x) => x.url) ? '' : 'disabled'}>Sync</button>
        <button class="ghost" id="btn-smslog" title="Texts sent automatically by the Apps Script when 잔여 세션 reaches 0 (see apps-script/Sms.gs)" ${(sheet.sources || []).some((x) => /script.google.com/.test(x.url || '')) ? '' : 'disabled'}>문자 기록</button>
        <button class="ghost" id="btn-csv">Export CSV</button>
        <button class="primary" id="btn-new">+ Member</button>`;
      const r = sheet.lastResult;
      const fromSheet = all.filter((c) => c.sheetSyncedAt).length;
      const syncLine = sheet.lastSync
        ? `<p style="margin:-6px 0 12px;font-size:12px;color:var(--muted)">Google Sheet${(r.sheets || []).length > 1 ? 's' : ''}: last synced ${esc(sheet.lastSync.replace('T', ' ').slice(0, 16))} — ${r.rows} rows read, ${r.unique} unique (${r.collapsed} duplicate rows merged), ${r.added} added, ${r.updated} updated${r.merged ? `, ${r.merged} same-person records merged` : ''}${r.removed ? `, ${r.removed} removed (no longer in the sheet)` : ''}${r.keptRemoved ? `, ${r.keptRemoved} kept although gone from the sheet (call logs exist)` : ''}. ${fromSheet} customers come from the sheet${(r.sheets || []).length > 1 ? 's' : ''}.${(r.sheets || []).length > 1 ? ' (' + r.sheets.map((x) => `${esc(x.name)}: ${x.rows} rows`).join(', ') + ')' : ''}${(r.warnings || []).length ? `<br><span style="color:var(--warn)">⚠ ${r.warnings.map(esc).join(' · ')}</span>` : ''}</p>`
        : (sheet.sources || []).some((x) => x.url) ? '' : `<p style="margin:-6px 0 12px;font-size:12px;color:var(--muted)">Connect your Google Sheet with the <strong>Google Sheet</strong> button to pull customers in (read-only, duplicates merged).</p>`;
      const countLine = all.length ? `<p style="margin:-6px 0 12px;font-size:12px;color:var(--muted)">${rows.length} / ${all.length}행 표시 (${persons(rows)}명) — 열 제목을 클릭하면 오름차순/내림차순 정렬, 제목 아래 칸으로 열별 필터.</p>` : '';
      const shown = rows.slice(0, ts.limit);
      return head('Members', extra) + syncLine + (all.length ? customerStats(all) : '') + countLine + table(cols, shown, (id) => openDialog('customers', Store.get('customers', id)), all.length ? '조건에 맞는 회원이 없습니다.' : 'No members yet. Sync from your Google Sheet, add one, or Import a JSON export.', { tbl: 'members', sort: ts.sort, filterRow: filterRow(cols, all, ts), footer: `${pageFooter(ts, shown.length, rows.length, 'members', '행')} · ${persons(rows)}명${rows.length !== all.length ? ` (전체 ${all.length}행 · ${persons(all)}명 중 필터 적용)` : ''}` });
    },

    campaigns() {
      const cps = Store.list('campaigns').slice().sort((a, b) => (b.start || '').localeCompare(a.start || ''));
      const calls = Store.list('calls').slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const bookedFor = (id) => calls.filter((c) => c.campaignId === id && c.outcome === 'booked').length;
      const callsFor = (id) => calls.filter((c) => c.campaignId === id).length;
      const cCols = [
        { h: 'Campaign', f: (c) => `<strong>${esc(c.name)}</strong>` },
        { h: 'Status', f: (c) => pill(c.status) },
        { h: 'Dates', f: (c) => `${fmtDate(c.start)} → ${fmtDate(c.end)}` },
        { h: 'Channels', f: (c) => esc(c.channels) || '—' },
        { h: 'Calls', f: (c) => callsFor(c.id) },
        { h: 'Booked / target', f: (c) => `${bookedFor(c.id)} / ${c.target ?? '—'}` },
        { h: 'Goal', f: (c) => esc(c.goal), wrap: true },
      ];
      const kCols = [
        { h: 'Date', f: (c) => fmtDate(c.date) },
        { h: 'Customer', f: (c) => esc(nameOf('customers', c.customerId)) },
        { h: 'Campaign', f: (c) => esc(nameOf('campaigns', c.campaignId)) },
        { h: 'Caller', f: (c) => esc(c.caller) || '—' },
        { h: 'Outcome', f: (c) => pill(c.outcome) },
        { h: 'Callback', f: (c) => fmtDate(c.callbackDate) },
        { h: 'Notes', f: (c) => esc(c.notes), wrap: true },
      ];
      const noCustomers = !Store.list('customers').length;
      // 문의 (leads): inquiries synced from the 문의-주니어 / 문의-시니어 tabs.
      const ts = tbl('leads');
      const leadsAll = Store.list('customers').filter(isLead);
      const lcols = LEAD_COLUMNS.map((k) => CUSTOMER_COLUMNS.find((c) => c.k === k)).filter(Boolean); // in LEAD_COLUMNS order
      let leads = leadsAll;
      leads = applyFilters(leads, ts);
      leads = sortRows(leads, lcols, ts);
      const nf = activeFilters(ts);
      const tally = (fn) => { const m = new Map(); for (const c of leadsAll) { const v = fn(c) || ''; if (v) m.set(v, (m.get(v) || 0) + 1); } return Array.from(m.entries()).sort((a, b) => b[1] - a[1]); };
      const lchip = (label, n, k, v) => `<button class="chip ${ts.colFilters[k] === v ? 'on' : ''}" data-chip-k="${esc(k)}" data-chip-v="${esc(v)}" data-chip-t="leads"><span class="n">${n}</span> ${esc(label)}</button>`;
      const overdue = leadsAll.filter((c) => c.nextFollowUp && c.nextFollowUp <= today()).length;
      const leadStats = leadsAll.length ? `<div class="stats">
          <div class="stat-group total"><div class="stat-title">문의 · Inquiries</div><div class="big">${leadsAll.length}<span class="sub">건</span></div>${overdue ? `<span class="chip warn" style="cursor:default"><span class="n">${overdue}</span> 연락 예정일 지남</span>` : ''}</div>
          <div class="stat-group"><div class="stat-title">구분</div><div class="chips">${tally((c) => c.segmentLabel).map(([v, n]) => lchip(v, n, 'segment', v)).join('')}</div></div>
          <div class="stat-group"><div class="stat-title">Status</div><div class="chips">${tally((c) => c.status).map(([v, n]) => lchip(v, n, 'status', v)).join('')}</div></div>
          <div class="stat-group"><div class="stat-title">담당</div><div class="chips">${tally((c) => c.coach).map(([v, n]) => lchip(v, n, 'coach', v)).join('')}</div></div>
        </div>` : '';
      const canSync = (Store.settings().sheet.sources || []).some((x) => x.url);
      const leadsBlock = head('문의 · Inquiries', `${nf ? `<button class="ghost" id="btn-clear-lead-filters" data-tbl="leads">필터 해제 (${nf})</button>` : ''}<span style="font-size:12px;color:var(--muted)">문의-주니어 / 문의-시니어 시트 · 행 클릭 = 상세 · 통화는 아래 Call log에 기록</span><button class="ghost" id="btn-import-inquiries" title="웰페리온 문의 DB 시트 → 문의-주니어/시니어 탭 재생성 후 Sync (Apps Script buildInquiryTabs)" ${canSync ? '' : 'disabled'}>문의 DB 가져오기</button><button class="ghost" id="btn-sync-leads" title="Pull members and inquiries from the Google Sheets" ${canSync ? '' : 'disabled'}>Sync</button>`)
        + leadStats
        + table(lcols, leads.slice(0, ts.limit), (id) => openDialog('customers', Store.get('customers', id)), leadsAll.length ? '조건에 맞는 문의가 없습니다.' : '아직 문의 데이터가 없습니다. 문의 DB 가져오기 또는 Members → Google Sheet에서 문의 시트를 추가하고 Sync 하세요.', { tbl: 'leads', sort: ts.sort, filterRow: filterRow(lcols, leadsAll, ts), footer: `${pageFooter(ts, Math.min(ts.limit, leads.length), leads.length, 'leads', '건')}${leads.length !== leadsAll.length ? ` (전체 ${leadsAll.length}건 중 필터 적용)` : ''}` });
      // 웰페리온 회원 DB: every club member (all sports); the ones with a 스쿼시 담당자 are the squash lead pool.
      const cts = tbl('club');
      const clubAll = Store.list('customers').filter((c) => c.clubSyncedAt);
      const ccols = CLUB_COLUMNS.map((k) => CUSTOMER_COLUMNS.find((c) => c.k === k)).filter(Boolean);
      let club = applyFilters(clubAll, cts); club = sortRows(club, ccols, cts);
      const cnf = activeFilters(cts);
      const ctally = (fn) => { const m = new Map(); for (const c of clubAll) { const v = fn(c) || ''; if (v) m.set(v, (m.get(v) || 0) + 1); } return Array.from(m.entries()).sort((a, b) => b[1] - a[1]); };
      const cchip = (label, n, k, v) => `<button class="chip ${cts.colFilters[k] === v || (k === 'clubDaysLeft' && cts.colFilters[k] && cts.colFilters[k][v === 'valid' ? 'min' : 'max'] !== undefined && cts.colFilters[k][v === 'valid' ? 'min' : 'max'] !== '') ? 'on' : ''}" data-chip-k="${esc(k)}" data-chip-v="${esc(v)}" data-chip-t="club"><span class="n">${n}</span> ${esc(label)}</button>`;
      const valid = clubAll.filter((c) => typeof c.clubDaysLeft === 'number' && c.clubDaysLeft >= 0).length, expired = clubAll.filter((c) => typeof c.clubDaysLeft === 'number' && c.clubDaysLeft < 0).length;
      const clubStats = clubAll.length ? `<div class="stats">
          <div class="stat-group total"><div class="stat-title">웰페리온 회원 DB</div><div class="big">${clubAll.length}<span class="sub">명</span></div></div>
          <div class="stat-group"><div class="stat-title">스쿼시 담당자</div><div class="chips">${ctally((c) => c.squashCoach).map(([v, n]) => cchip(v, n, 'squashCoach', v)).join('')}<button class="chip ${cts.colFilters.squashCoach === '(없음)' ? 'on' : ''}" data-chip-k="squashCoach" data-chip-v="(없음)" data-chip-t="club"><span class="n">${clubAll.filter((c) => !c.squashCoach).length}</span> 미접촉</button></div></div>
          <div class="stat-group"><div class="stat-title">회원권 상태</div><div class="chips">${cchip('유효', valid, 'clubDaysLeft', 'valid')}${cchip('만료', expired, 'clubDaysLeft', 'expired')}</div></div>
          <div class="stat-group"><div class="stat-title">회원 구분</div><div class="chips">${ctally((c) => c.clubType).slice(0, 6).map(([v, n]) => cchip(v, n, 'clubType', v)).join('')}</div></div>
        </div>` : '';
      // Notes typed into the generic Notes field of club members (before the 스쿼시 접촉
      // block existed) live only in this browser: offer to move them into the sheet.
      const clubNotesPending = clubAll.filter((c) => clubNoteToMove(c).length);
      const clubBlock = head('웰페리온 회원 DB · Club members', `${cnf ? `<button class="ghost" id="btn-clear-club-filters">필터 해제 (${cnf})</button>` : ''}<span style="font-size:12px;color:var(--muted)">웰페리온 멤버십 DB 시트 (read-only) · 스쿼시 담당자가 있는 회원 = 스쿼시 리드 풀 · 행 클릭 = 스쿼시 접촉 기록</span>${clubNotesPending.length ? `<button class="ghost" id="btn-move-club-notes" title="회원 DB의 비고 내용과 이 브라우저에만 저장된 Notes 메모를 스쿼시 Contact 기록으로 복사하고 시트 '스쿼시 접촉' 탭에 기록합니다">비고·메모 ${clubNotesPending.length}건 → 스쿼시 Contact</button>` : ''}`)
        + clubStats
        + table(ccols, club.slice(0, cts.limit), (id) => openDialog('customers', Store.get('customers', id)), clubAll.length ? '조건에 맞는 회원이 없습니다.' : '아직 회원 DB가 연결되지 않았습니다. Members → Google Sheet → 시트 종류 "웰페리온 회원 DB"로 추가 후 Sync.', { tbl: 'club', sort: cts.sort, filterRow: filterRow(ccols, clubAll, cts), footer: `${pageFooter(cts, Math.min(cts.limit, club.length), club.length, 'club', '명')}${club.length !== clubAll.length ? ` (전체 ${clubAll.length}명 중 필터 적용)` : ''}` });
      return head('Outreach', `<span style="font-size:12px;color:var(--muted)">문의 · 웰페리온 회원 DB · 캠페인 · 통화 기록</span>`)
        + leadsBlock
        + `<div style="height:24px"></div>`
        + clubBlock
        + `<div style="height:24px"></div>`
        + head('Campaigns', `<button class="primary" id="btn-new">+ Campaign</button>`)
        + table(cCols, cps, (id) => openDialog('campaigns', Store.get('campaigns', id)), 'No campaigns yet.')
        + `<div style="height:24px"></div>`
        + head('Call log', `<button class="primary" id="btn-new-call" ${noCustomers ? 'disabled title="Add a customer first"' : ''}>+ Log call</button>`)
        + table(kCols, calls, (id) => openDialog('calls', Store.get('calls', id)), 'No calls logged yet.');
    },

    events() {
      const rows = Store.list('events').slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const cols = [
        { h: 'Date', f: (e) => `<strong>${fmtDate(e.date)}</strong> ${esc(e.time || '')}` },
        { h: 'Event', f: (e) => `<strong>${esc(e.name)}</strong>` },
        { h: 'Type', f: (e) => pill(e.type) },
        { h: 'Status', f: (e) => pill(e.status) },
        { h: 'Venue', f: (e) => esc(e.venue) || '—' },
        { h: 'Registered', f: (e) => `${e.registered || 0} / ${e.capacity ?? '—'}` },
        { h: 'Owner', f: (e) => esc(e.owner) || '—' },
        { h: 'Campaign', f: (e) => esc(nameOf('campaigns', e.campaignId)) },
      ];
      return head('Events', `<button class="primary" id="btn-new">+ Event</button>`)
        + table(cols, rows, (id) => openDialog('events', Store.get('events', id)), 'No events yet.');
    },

    brand() {
      const b = Store.all().brand;
      const assets = Store.list('assets');
      const cols = [
        { h: 'Asset', f: (a) => `<strong>${esc(a.name)}</strong>` },
        { h: 'Type', f: (a) => pill(a.type) },
        { h: 'Version', f: (a) => esc(a.version) || '—' },
        { h: 'Location', f: (a) => /^https?:/.test(a.location || '') ? `<a href="${esc(a.location)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(a.location)}</a>` : esc(a.location) || '—', wrap: true },
        { h: 'Usage', f: (a) => esc(a.usage), wrap: true },
      ];
      return head('Brand') + `
        <div class="two-col" style="margin-bottom:16px">
          <div class="panel"><h2>Identity</h2>
            <form id="brand-form" class="fields">
              <label class="full">Tagline<input name="tagline" value="${esc(b.tagline)}" placeholder="TBD"></label>
              <label>Heading font<input name="heading" value="${esc(b.fonts.heading)}"></label>
              <label>Body font<input name="body" value="${esc(b.fonts.body)}"></label>
              <label class="full"><span></span><button class="primary" type="submit">Save identity</button></label>
            </form>
            <p style="color:var(--muted);font-size:12px;margin:10px 0 0">Full guidelines live in <code>brand/brand-guidelines.md</code>.</p>
          </div>
          <div class="panel"><h2>Palette</h2>
            <div class="swatches">${b.colors.map((c, i) => `<div class="swatch"><div class="color" style="background:${esc(c.hex)}"></div><div class="meta"><input type="color" data-i="${i}" value="${esc(c.hex)}" style="width:100%;height:24px;border:0;padding:0;background:none"><div>${esc(c.role)}</div><code>${esc(c.hex)}</code></div></div>`).join('')}</div>
          </div>
        </div>`
        + head('Asset library', `<button class="primary" id="btn-new">+ Asset</button>`)
        + table(cols, assets, (id) => openDialog('assets', Store.get('assets', id)), 'No assets registered. Add logos, templates and photos with their file paths or links.');
    },
  };

  // ---------- Render & wiring ----------
  const viewEl = $('#view');
  function render() {
    rowHandlers = [];
    viewEl.innerHTML = views[state.view]();
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));

    // Row click handlers: tables are rendered in order, one handler per table.
    viewEl.querySelectorAll('table').forEach((tbl, i) => {
      const handler = rowHandlers[i];
      tbl.querySelectorAll('tbody tr[data-id]').forEach((tr) => { tr.onclick = () => handler(tr.dataset.id); });
    });

    const newBtn = $('#btn-new');
    if (newBtn) newBtn.onclick = () => openDialog({ customers: 'customers', campaigns: 'campaigns', events: 'events', brand: 'assets' }[state.view]);
    const newCall = $('#btn-new-call');
    if (newCall) newCall.onclick = () => openDialog('calls');

    const q = $('#q');
    if (q) { q.oninput = () => { state.q = q.value; render(); const el = $('#q'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }; }
    const filter = $('#filter');
    if (filter) filter.onchange = () => { state.filter = filter.value; render(); };
    const tableOf = (el) => tbl((el.closest('[data-tbl]') || {}).dataset ? (el.closest('[data-tbl]').dataset.tbl || 'members') : 'members');
    viewEl.querySelectorAll('th[data-sort]').forEach((el) => {
      el.onclick = () => { const ts = tableOf(el); const k = el.dataset.sort; ts.sort = { k, dir: ts.sort.k === k ? -ts.sort.dir : 1 }; render(); };
    });
    // Column filters: selects/dates apply on change, text/number boxes as you type (focus restored after re-render).
    viewEl.querySelectorAll('tr.filters [data-fk]').forEach((el) => {
      const apply = () => {
        const ts = tableOf(el);
        const k = el.dataset.fk, part = el.dataset.part;
        if (part) ts.colFilters[k] = Object.assign({}, ts.colFilters[k] || {}, { [part]: el.value });
        else ts.colFilters[k] = el.value;
        const wrap = el.closest('[data-tbl]'); const tkey = wrap ? wrap.dataset.tbl : '';
        const sel = `[data-tbl="${tkey}"] tr.filters [data-fk="${k}"]${part ? `[data-part="${part}"]` : ''}`;
        const pos = el.selectionStart;
        render();
        const again = viewEl.querySelector(sel);
        if (again && el.tagName !== 'SELECT' && el.type !== 'date') { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* number inputs */ } }
      };
      if (el.tagName === 'SELECT' || el.type === 'date') el.onchange = apply; else el.oninput = apply;
    });
    viewEl.querySelectorAll('.chip[data-chip-k]').forEach((el) => {
      el.onclick = () => {
        const ts = tbl(el.dataset.chipT || 'members');
        const k = el.dataset.chipK, v = el.dataset.chipV;
        if (k === 'clubDaysLeft') { const cur = ts.colFilters[k] || {}; const on = v === 'valid' ? cur.min === '0' : cur.max === '-1'; ts.colFilters[k] = on ? {} : (v === 'valid' ? { min: '0', max: '' } : { min: '', max: '-1' }); render(); return; }
        if (k === 'sessionsLeft') ts.colFilters[k] = ts.colFilters[k] && ts.colFilters[k].max === '0' ? {} : { min: '', max: '0' };
        else ts.colFilters[k] = ts.colFilters[k] === v ? '' : v;
        render();
      };
    });
    const outBtn = $('#btn-out-customers');
    if (outBtn) outBtn.onclick = () => { tbl('members').colFilters = { sessionsLeft: { min: '', max: '0' } }; tbl('members').sort = { k: 'sessionsLeft', dir: 1 }; state.view = 'customers'; location.hash = '#customers'; render(); };
    const clearBtn = $('#btn-clear-filters');
    if (clearBtn) clearBtn.onclick = () => { tbl('members').colFilters = {}; render(); };
    viewEl.querySelectorAll('[data-page]').forEach((el) => {
      el.onclick = () => { const ts = tbl(el.dataset.page); const wrap = el.closest('[data-tbl]'); ts.limit = el.dataset.step === 'reset' ? ts.initial : ts.limit + 20; render();
        if (el.dataset.step === 'reset' && wrap) { const w = viewEl.querySelector(`[data-tbl="${wrap.dataset.tbl}"]`); if (w) w.scrollIntoView({ block: 'start' }); } };
    });
    const clearClub = $('#btn-clear-club-filters');
    if (clearClub) clearClub.onclick = () => { tbl('club').colFilters = {}; render(); };
    const moveNotes = $('#btn-move-club-notes');
    if (moveNotes) moveNotes.onclick = () => moveClubNotes(moveNotes);
    const clearLeads = $('#btn-clear-lead-filters');
    if (clearLeads) clearLeads.onclick = () => { tbl('leads').colFilters = {}; render(); };

    const csv = $('#btn-csv');
    if (csv) csv.onclick = () => downloadCSV();
    const sheetBtn = $('#btn-sheet');
    if (sheetBtn) sheetBtn.onclick = () => openSheetSettings(0);
    const syncBtn = $('#btn-sync');
    if (syncBtn) syncBtn.onclick = () => syncFromSheet(syncBtn);
    const syncLeads = $('#btn-sync-leads');
    if (syncLeads) syncLeads.onclick = () => syncFromSheet(syncLeads);
    const importBtn = $('#btn-import-inquiries');
    if (importBtn) importBtn.onclick = () => importInquiries(importBtn);
    const smsBtn = $('#btn-smslog');
    if (smsBtn) smsBtn.onclick = () => showSmsLog(smsBtn);

    const bf = $('#brand-form');
    if (bf) {
      bf.onsubmit = (e) => {
        e.preventDefault();
        Store.setBrand({ tagline: bf.tagline.value.trim(), fonts: { heading: bf.heading.value.trim(), body: bf.body.value.trim() } });
        render();
      };
      viewEl.querySelectorAll('input[type=color]').forEach((inp) => {
        inp.onchange = () => { const b = Store.all().brand; b.colors[+inp.dataset.i].hex = inp.value; Store.setBrand(b); render(); };
      });
    }
  }

  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b) return;
    state.view = b.dataset.view; state.q = ''; state.filter = '';
    location.hash = state.view;
    render();
  });

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function downloadCSV() {
    const keys = schemas.customers.fields.map((f) => f.k).concat(['lastContact', 'id']);
    const cell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [keys.join(',')].concat(Store.list('customers').map((c) => keys.map((k) => cell(c[k])).join(',')));
    download(`customers-${today()}.csv`, lines.join('\n'), 'text/csv');
  }
  $('#btn-export').onclick = () => download(`wellperion-squash-${today()}.json`, Store.exportJSON(), 'application/json');
  $('#file-import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Importing replaces all current data in this browser. Continue?')) { e.target.value = ''; return; }
    try { Store.importJSON(await file.text()); render(); alert('Import complete.'); }
    catch (err) { alert('Import failed: ' + err.message); }
    e.target.value = '';
  };

  // ---------- Cloud copy of the app data (APP_STATE tab, AppState.gs) ----------
  // Every real write to the store schedules an upload of the whole dataset (gzip+base64,
  // tokens stripped) ~20 s later; login into an empty browser downloads it first. The
  // sheet keeps one version; `known` = the version this browser last saw, so two
  // computers cannot silently overwrite each other (conflict → the indicator offers to load).
  const CLOUD_KEY = 'wellperion-squash.cloud';
  const cloudMeta = (() => { try { return JSON.parse(localStorage.getItem(CLOUD_KEY) || '{}') || {}; } catch (e) { return {}; } })();
  const setCloudMeta = (patch) => { Object.assign(cloudMeta, patch); try { localStorage.setItem(CLOUD_KEY, JSON.stringify(cloudMeta)); } catch (e) { /* ignore */ } };
  const cloud = { timer: null, busy: false, pending: false, quiet: false, onClick: null };
  const hhmm = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  function cloudStatus(text, kind, onClick) {
    const el = $('#cloud-status'); if (!el) return;
    cloud.onClick = onClick || null;
    el.textContent = text ? '☁ ' + text : ''; el.className = 'cloud ' + (kind || ''); el.style.cursor = onClick ? 'pointer' : 'default';
    el.title = onClick ? '클릭' : '앱 데이터는 시트(APP_STATE 탭)에도 자동 저장되어 다른 컴퓨터에서 로그인하면 그대로 이어집니다';
  }
  { const el = $('#cloud-status'); if (el) el.onclick = () => { if (cloud.onClick) cloud.onClick(); }; }
  function cloudSource() {
    const srcs = Store.settings().sheet.sources || [];
    return srcs.find((x) => x.token && /script\.google\.com\/macros\//.test(x.url || '')) || null;
  }
  const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  async function packState() {
    const data = JSON.parse(Store.exportJSON(true));
    for (const s of (data.settings && data.settings.sheet && data.settings.sheet.sources) || []) delete s.token; // never store the token in the sheet
    const json = JSON.stringify(data);
    if (!window.CompressionStream) return 'json:' + json;
    const cs = new CompressionStream('gzip'); const w = cs.writable.getWriter(); w.write(new TextEncoder().encode(json)); w.close();
    return 'gz64:' + b64(new Uint8Array(await new Response(cs.readable).arrayBuffer()));
  }
  async function unpackState(str) {
    if (str.startsWith('json:')) return JSON.parse(str.slice(5));
    if (!str.startsWith('gz64:')) throw new Error('알 수 없는 스냅샷 형식');
    const bytes = Uint8Array.from(atob(str.slice(5)), (c) => c.charCodeAt(0));
    const ds = new DecompressionStream('gzip'); const w = ds.writable.getWriter(); w.write(bytes); w.close();
    return JSON.parse(await new Response(ds.readable).text());
  }
  function scheduleCloudSave() {
    if (cloud.quiet || !cloudSource()) return;
    clearTimeout(cloud.timer);
    cloudStatus('변경됨 · 20초 후 저장', 'dim');
    cloud.timer = setTimeout(() => cloudSave(), 20000);
  }
  async function cloudSave(force) {
    const src = cloudSource(); if (!src) return;
    if (cloud.busy) { cloud.pending = true; return; }
    cloud.busy = true; cloudStatus('저장 중…', 'dim');
    try {
      const data = await packState();
      const updatedAt = new Date().toISOString();
      const j = await cloudPost({ action: 'app-state', data, updatedAt, known: cloudMeta.updatedAt || '', force: !!force });
      if (j.conflict) {
        cloudStatus(`다른 컴퓨터의 데이터가 더 최신 (${hhmm(j.updatedAt)}) — 클릭해서 처리`, 'warn', () => cloudConflict(j.updatedAt));
      } else {
        setCloudMeta({ updatedAt: j.updatedAt, savedAt: updatedAt });
        cloudStatus(`저장됨 ${hhmm(updatedAt)}`, 'ok');
      }
    } catch (err) {
      console.warn('cloud save failed', err);
      cloudStatus('저장 실패 — 클릭해서 다시 시도', 'warn', () => cloudSave());
    } finally {
      cloud.busy = false;
      if (cloud.pending) { cloud.pending = false; scheduleCloudSave(); }
    }
  }
  function cloudConflict(serverAt) {
    const load = confirm(`시트에 다른 컴퓨터에서 저장한 더 최신 앱 데이터가 있습니다 (${hhmm(serverAt)}).\n\n확인 = 그 데이터를 불러옵니다 (이 브라우저의 변경은 사라짐)\n취소 = 이 브라우저의 데이터로 시트를 덮어씁니다`);
    if (load) cloudLoad({ replace: true }); else cloudSave(true);
  }
  async function cloudGet(params) {
    const src = cloudSource(); if (!src) throw new Error('no source');
    const u = new URL(src.url.split('?')[0]); u.searchParams.set('token', tokenFor(src.url, src.token));
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const res = await fetch(u.toString(), { redirect: 'follow' });
    const j = JSON.parse(await res.text());
    if (j.ok === false || j.error) throw new Error(j.error || 'unknown error');
    return j;
  }
  async function cloudPost(body) {
    const src = cloudSource(); if (!src) throw new Error('no source');
    body.token = tokenFor(src.url, src.token);
    const res = await fetch(src.url.split('?')[0], { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' });
    const text = await res.text();
    let j; try { j = JSON.parse(text); } catch (e) { throw new Error(/doPost/.test(text) ? 'Apps Script에 doPost가 없습니다 (Code.gs / AppState.gs 배포 필요)' : `응답 오류 (${res.status})`); }
    if (!j.ok && !j.conflict) throw new Error(j.error || 'unknown error');
    return j;
  }
  // Download the sheet's snapshot into this browser. Returns true when data was loaded.
  async function cloudLoad(opts = {}) {
    if (!cloudSource()) return false;
    cloud.quiet = true; cloudStatus('불러오는 중…', 'dim');
    try {
      const j = await cloudGet({ action: 'app-state' });
      if (j.empty || !j.data) { cloudStatus('', ''); return false; }
      const data = await unpackState(j.data);
      // Keep this browser's tokens (they are not in the snapshot).
      const tokens = new Map((Store.settings().sheet.sources || []).map((s) => [String(s.url || '').split('?')[0], s.token]).filter(([, t]) => t));
      const anyToken = Array.from(tokens.values())[0] || '';
      for (const s of (data.settings && data.settings.sheet && data.settings.sheet.sources) || []) if (!s.token) s.token = tokens.get(String(s.url || '').split('?')[0]) || anyToken;
      Store.importJSON(data, { silent: true });
      setCloudMeta({ updatedAt: j.updatedAt, loadedAt: new Date().toISOString() });
      cloudStatus(`불러옴 ${hhmm(j.updatedAt)}`, 'ok');
      if (opts.replace) render();
      return true;
    } catch (err) {
      console.warn('cloud load failed', err);
      cloudStatus('불러오기 실패 — 클릭해서 다시 시도', 'warn', () => cloudLoad(opts));
      return false;
    } finally { cloud.quiet = false; }
  }
  // Returning browser: is there a newer snapshot from another computer?
  async function cloudCheck() {
    if (!cloudSource()) return;
    try {
      const j = await cloudGet({ action: 'app-state', meta: '1' });
      if (j.empty) { if (Store.list('customers').length) scheduleCloudSave(); return; } // first computer with this version: seed the sheet
      if (j.updatedAt && j.updatedAt !== cloudMeta.updatedAt) cloudStatus(`다른 컴퓨터의 데이터 (${hhmm(j.updatedAt)}) — 클릭해서 처리`, 'warn', () => cloudConflict(j.updatedAt));
      else cloudStatus(cloudMeta.savedAt ? `저장됨 ${hhmm(cloudMeta.savedAt)}` : `동기화됨 ${hhmm(j.updatedAt)}`, 'ok');
    } catch (err) { console.warn('cloud check failed', err); }
  }
  Store.onChange(scheduleCloudSave);

  // ---------- Login / logout ----------
  // The app holds no data until it has the sheet token. On GitHub Pages (or any fresh
  // browser) the admin password is exchanged for the token via the Apps Script.
  const hasToken = () => (Store.settings().sheet.sources || []).some((s) => s.token);
  { const b = document.querySelector('.brand'); if (b && window.WS_CONFIG) b.title = 'backend: ' + window.WS_CONFIG.version; }
  async function login(key) {
    const u = new URL(Defaults.EXEC_URL); u.searchParams.set('action', 'app-login'); u.searchParams.set('key', key);
    const res = await fetch(u.toString(), { redirect: 'follow' });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'login failed');
    if (!j.token) throw new Error('No data token configured on the Apps Script (run setToken).');
    const existing = Store.settings().sheet.sources || [];
    const list = Array.isArray(j.sources) && j.sources.length ? j.sources : Defaults.sources; // server-provided (Config.gs) or fallback
    const sources = existing.length ? existing.map((s) => Object.assign({}, s, { token: j.token }))
      : list.map((s, i) => Object.assign({ id: Date.now().toString(36) + i, mapping: {} }, s, { token: j.token }));
    Store.setSheetSettings({ sources, columns: Store.settings().sheet.columns || Defaults.columns });
  }
  // First sync after login: guess each source's column mapping from the live headers.
  async function mapAllSources() {
    const sources = (Store.settings().sheet.sources || []).slice();
    for (const src of sources) {
      if (src.mapping && Object.keys(src.mapping).length) continue;
      try {
        const { headers } = Sheets.toTable(await Sheets.fetchCSV(src.url, src.token));
        src.mapping = Sheets.guessMapping(headers);
        if (src.kind === 'leads' || src.kind === 'clubdb') delete src.mapping.segment;
        if (src.kind === 'clubdb') delete src.mapping.coach;
      } catch (e) { console.warn('mapping failed for', src.name, e.message); }
    }
    Store.setSheetSettings({ sources });
  }
  const loginDlg = $('#login');
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-btn'), err = $('#login-err'); btn.disabled = true; btn.textContent = '확인 중…'; err.hidden = true;
    try {
      const fresh = !Store.list('customers').length;
      cloud.quiet = true; // the login write must not upload an empty dataset
      try { await login($('#login-key').value.trim()); } finally { cloud.quiet = false; }
      loginDlg.close();
      state.view = 'customers'; location.hash = '#customers'; render(); // Members has the Sync button and shows progress
      const restored = fresh && await cloudLoad({ replace: true }); // settings + data from the sheet
      if (!restored) await mapAllSources();
      await syncFromSheet($('#btn-sync') || { textContent: '', disabled: false });
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    btn.disabled = false; btn.textContent = '입장 · Sign in';
  });
  $('#btn-logout').onclick = () => {
    if (!confirm('이 브라우저의 모든 데이터와 접근 토큰을 삭제하고 로그아웃할까요?\nThis removes all data and the access token from this browser.')) return;
    clearTimeout(cloud.timer); cloud.quiet = true;
    try { localStorage.removeItem('wellperion-squash.v1'); localStorage.removeItem(CLOUD_KEY); } catch (e) { /* ignore */ }
    location.reload();
  };

  // Restore view from hash, then render.
  const h = location.hash.slice(1);
  if (views[h]) state.view = h;
  render();
  if (!hasToken()) { loginDlg.showModal(); setTimeout(() => $('#login-key').focus(), 50); }
  else cloudCheck();
})();
