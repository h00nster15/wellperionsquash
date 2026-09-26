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
  // Social plan (Social tab). Two accounts, two scopes (owner's rule, 2026-09-25):
  //   @glass_court + 네이버 블로그 — everything.
  //   @wellperion_squash — US squash, and events held at Wellperion. Nothing else.
  // A row with 웰페리온 교차 게시 ticked goes to both; the tab counts them.
  // Training Sessions and the Tournament Series were cancelled (2026-09-25); the
  // only event on the books is 웰림픽 스쿼시컵 in November.
  const POST_STATUS = ['idea', 'draft', 'scheduled', 'posted', 'dropped'];
  const POST_CHANNELS = ['Instagram @glass_court', 'Instagram @wellperion_squash', 'Naver blog', 'YouTube Shorts'];
  const PILLARS = [
    { k: 'science', label: 'Science of Squash', share: 30, color: '#1f2a6b', job: '근거로 설명하는 프로 — 권위' },
    { k: 'junior', label: '주니어 · 미국 진학', share: 25, color: '#7fa8d9', job: 'WSC 학부모 · 미국 스쿼시 — 성장 (웰페리온 계정 교차)' },
    { k: 'tactics', label: '기본 전술', share: 20, color: '#3f57a8', job: '저장되는 짧은 릴스 — 도달' },
    { k: 'event', label: '웰페리온 행사', share: 10, color: '#a9c6e8', job: '웰림픽 스쿼시컵 (11월) — 전환 (웰페리온 계정 교차)' },
    { k: 'member', label: '회원 이야기', share: 10, color: '#c8102e', job: '재등록의 이유 — 신뢰 (서면 동의)' },
    { k: 'facility', label: '웰페리온 시설', share: 5, color: '#8c94a3', job: '한남동 2,900평 — 신뢰도' },
  ];
  const PILLAR_KEYS = PILLARS.map((p) => p.k);
  const pillarOf = (k) => PILLARS.find((p) => p.k === k) || { label: k || '—', color: '#8c94a3', job: '' };
  /** Only these belong on @wellperion_squash: US squash, and events at Wellperion. */
  const WELLPERION_OK = new Set(['junior', 'event']);

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
    kpi: {
      title: '월간 지표',
      fields: [
        { k: 'month', label: 'Month (YYYY-MM)', required: true, def: () => today().slice(0, 7), placeholder: '2026-09' },
        { k: 'igFollowers', label: '인스타 팔로워', type: 'number' },
        { k: 'igReach', label: '인스타 도달 (30일)', type: 'number' },
        { k: 'igSaves', label: '저장 수', type: 'number' },
        { k: 'igProfile', label: '프로필 조회', type: 'number' },
        { k: 'igDms', label: 'DM · 문의', type: 'number' },
        { k: 'blogVisits', label: '블로그 방문 (30일) — 네이버는 API가 없어 직접 입력', type: 'number' },
        { k: 'bookings', label: '세션 · 체험 예약 (인스타/블로그發)', type: 'number' },
        { k: 'notes', label: 'Notes', type: 'textarea', full: true },
      ],
    },
    posts: {
      title: 'Post',
      fields: [
        { k: 'date', label: 'Date (게시 예정일)', type: 'date', def: today, required: true },
        { k: 'channel', label: 'Channel', type: 'select', options: POST_CHANNELS, def: 'Instagram' },
        { k: 'pillar', label: 'Pillar (콘텐츠 필러)', type: 'select', options: PILLAR_KEYS, def: 'science' },
        { k: 'status', label: 'Status', type: 'select', options: POST_STATUS, def: 'idea' },
        { k: 'title', label: 'Title KR (한국어 제목)', required: true, full: true },
        { k: 'titleEn', label: 'Title EN', full: true },
        { k: 'format', label: 'Format (릴스 30초 / 카드뉴스 7장 …)', full: true },
        { k: 'cta', label: 'CTA (가격은 쓰지 않습니다)' },
        { k: 'wellperion', label: '@wellperion_squash 에도 게시 (미국 스쿼시 · 웰페리온 행사만)', type: 'checkbox', full: true },
        { k: 'blocker', label: 'Blocked by (없으면 비워 둠)', placeholder: '세션 #2 날짜' },
        { k: 'notes', label: 'Notes — 원고 · 촬영 · 디자인 상태', type: 'textarea', full: true },
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
  // The roster tabs move every month (Config.gs → appSources_ picks each coach's newest
  // month tab and the one before it), but the browser used to keep whatever list it got at
  // its first login — so Sync kept reading old tabs and new registrations never arrived.
  // Now every Sync asks the script for the current member sources first. A member source
  // keeps its column mapping when its URL is unchanged, else takes the mapping of the same
  // coach's previous tab (the monthly tabs share one layout). Other sources are untouched.
  async function refreshMemberSources() {
    if (!scriptSource()) return;
    let fresh;
    // Only each coach's current month tab: the script also offers last month's (prevMonth),
    // but the owner wants the Members list to be this month's roster only (2026-09-25).
    try { fresh = ((await socialCall('sources')).sources || []).filter((x) => x.kind === 'members' && x.url && !x.prevMonth); }
    catch (err) { console.warn('member sources not refreshed:', err.message); return; }
    if (!fresh.length) return;
    const now = Store.settings().sheet.sources || [];
    // Roster sources saved without a kind (added in the Google Sheet dialog, or from before
    // kinds existed — e.g. "박상현 회원" on the old mirror tab) count as member sources too,
    // or they survive the swap and fail with "Tab not found".
    const isMember = (x) => x.kind === 'members' || (!x.kind && (!!x.coach || (/회원/.test(x.name || '') && !/DB|문의|연락처/.test(x.name || ''))));
    const oldMembers = now.filter(isMember);
    const token = tokenFor(scriptSource().url, scriptSource().token);
    const members = fresh.map((x, i) => {
      const same = oldMembers.find((o) => o.url === x.url);
      if (same) return Object.assign({}, same, x, { mapping: same.mapping, token: same.token || token });
      const sibling = oldMembers.find((o) => o.coach && o.coach === x.coach && hasIdentity(o.mapping));
      return Object.assign({ id: Date.now().toString(36) + 'm' + i, mapping: sibling ? Object.assign({}, sibling.mapping) : {} }, x, { token });
    });
    Store.setSheetSettings({ sources: members.concat(now.filter((x) => !isMember(x))) });
  }
  // Sync progress: a bar under the page heading, one step per source. Sync re-renders the
  // view only when it is done, so the bar is patched in place meanwhile.
  function syncProgress(btn) {
    const host = (btn && typeof btn.closest === 'function' && btn.closest('.view-head')) || viewEl.firstElementChild; // the post-login Sync passes a stand-in, not a button
    const show = (frac, text) => {
      const old = document.getElementById('sync-progress');
      const html = progressHtml(frac, text, 'Sync 진행', 'sync-progress');
      if (old) old.outerHTML = html; else if (host) host.insertAdjacentHTML('afterend', html);
    };
    return { show, done: () => { const el = document.getElementById('sync-progress'); if (el) el.remove(); } };
  }
  async function syncFromSheet(btn) {
    const bar = syncProgress(btn);
    bar.show(null, '시트 목록 확인 중…');
    try { return await Store.batch(async () => { await refreshMemberSources(); return syncFromSheetInner(btn, bar); }); }
    finally { bar.done(); }
  }
  async function syncFromSheetInner(btn, bar) {
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
    let step = 0;
    for (const src of sources) { // sequential so later sheets merge into customers created by earlier ones
      btn.textContent = `Syncing ${src.name}…`;
      if (bar) bar.show(step / sources.length, `${step + 1} / ${sources.length} · ${src.name}`);
      step++;
      try {
        const csv = await Sheets.fetchCSV(src.url, tokenFor(src.url, src.token));
        const kind = src.kind || (src.enrichOnly ? 'contacts' : 'members');
        const r = Sheets.sync(csv, src.mapping, Store, { coach: kind === 'members' ? (src.coach || '') : '', now: runAt, enrichOnly: kind === 'contacts', leads: kind === 'leads', clubdb: kind === 'clubdb', segmentLabel: src.leadLabel || '문의' });
        if (r.unmatched && r.unmatched.length) total.warnings.push(`${src.name}: ${r.unmatched.length}명은 회원 명단에 없음 — ${r.unmatched.slice(0, 10).join(', ')}${r.unmatched.length > 10 ? '…' : ''}`);
        for (const k of ['rows', 'unique', 'collapsed', 'added', 'updated', 'merged']) total[k] += r[k] || 0;
        total.sheets.push({ name: src.name, ...r });
      } catch (err) { errors.push(`${src.name}: ${err.message}`); }
    }
    if (bar) bar.show(1, '정리 중…');
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
      const skipped = (j.skippedTabs || []).map((t) => `${t.name}: ${t.rows}행 (열 이름 불일치: ${(t.headers || []).join(' · ')})`).join('\n');
      btn.textContent = label; btn.disabled = false;
      alert(`문의 DB 가져오기 완료\n문의-주니어 ${j.juniors}건 · 문의-시니어 ${j.seniors}건 (총 ${j.inquiries}건, 수기 입력 ${j.kept}칸 유지)\n원본 탭: ${tabs || '-'}${skipped ? `\n⚠ 읽지 못한 탭 (문의 열 이름이 달라 건너뜀):\n${skipped}` : ''}\n\n이제 Sync를 실행합니다.`);
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
    active: 'ok', booked: 'ok', live: 'ok', open: 'ok', done: '', posted: 'ok',
    draft: 'warn', scheduled: 'info', dropped: 'bad',
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

  // ---------- Member trend (Dashboard) ----------
  // Monthly series built from the sheet's own dates: a member counts as active in a month
  // when 등록일자 <= that month's end and 유효기간 [종료일자] >= its start (no 유효기간 = still
  // running). Renewals are collapsed into one record (earliest 등록일자, latest 유효기간), so
  // this is the trend of member records, not of every registration — and members deleted
  // from the sheet are gone from it, so months far back read low. Both caveats sit in the
  // note under the charts.
  const CHART_ACTIVE = '#2d53a3', CHART_NEW = '#b27a1e'; // Oxford blue, brass — validated on the ivory panel (dataviz six checks)
  // Money on charts: axes and end labels short (350만, 1.2억), tooltips and tables in full won.
  const wonFull = (v) => `${Math.round(v).toLocaleString('ko-KR')}원`;
  const wonShort = (v) => (Math.abs(v) >= 1e8 ? `${+(v / 1e8).toFixed(1)}억` : Math.abs(v) >= 1e4 ? `${Math.round(v / 1e4).toLocaleString('ko-KR')}만` : String(Math.round(v)));
  // opts.money on a chart: short won on the axis, full won in the tooltip (figure data-fmt="won").
  const figAttr = (opts) => (opts && opts.money ? ' data-fmt="won"' : '');
  const axisOf = (opts) => (opts && opts.money ? wonShort : (v) => Math.round(v));
  const ymAdd = (ym, n) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
  // Ticks every `step` months; the year rides the first one and every change of year.
  function monthTicks(points, step) {
    const out = [];
    let year = '';
    points.forEach((p, i) => {
      const last = i === points.length - 1;
      if (!(i % step === 0 || last)) return;
      if (last && out.length && i - out[out.length - 1].i < step / 2) out.pop(); // no collision at the right edge
      const y = p.m.slice(0, 4), m = p.m.slice(5);
      out.push({ i, text: y === year ? `${+m}월` : `${y}.${m}` });
      year = y;
    });
    return out;
  }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    if (v <= 10) return Math.ceil(v / 2) * 2; // even, so the middle gridline is a whole number
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5]) if (v <= s * mag) return s * mag;
    return 10 * mag;
  }
  function memberTrend(members, months) {
    const rows = members.filter((c) => c.joined);
    const now = today().slice(0, 7);
    const earliest = rows.map((c) => c.joined.slice(0, 7)).sort()[0] || now;
    let first = months === 'all' ? earliest : ymAdd(now, -(months - 1));
    if (first < earliest) first = earliest;
    if (first > now) first = now;
    const out = [];
    for (let m = first; m <= now && out.length < 240; m = ymAdd(m, 1)) {
      const start = m + '-01', end = m + '-31';
      out.push({
        m,
        active: rows.filter((c) => c.joined <= end && (!c.validUntil || c.validUntil >= start)).length,
        added: rows.filter((c) => c.joined.slice(0, 7) === m).length,
      });
    }
    return { points: out, dated: rows.length, undated: members.length - rows.length };
  }

  // The coaches' yearly books (Months.gs → ?action=member-history): the counted roster of
  // every monthly payroll tab, current coaches and past ones. When the script has it, the
  // chart uses it instead of the reconstruction above, which only sees the synced roster.
  // Counts only, no names — kept in localStorage so the chart draws before the fetch returns,
  // then re-fetched once per page load (it only reads the cached tab, so it is quick): a copy
  // kept for hours hid a script update for just as long.
  const HISTORY_KEY = 'wellperion-squash.member-history';
  // Views drawn from the books: they re-render as the history loads or rebuilds.
  const historyView = () => state.view === 'dashboard' || state.view === 'revenue';
  let historyCache = null, historyLoading = false, historyError = '', historyTried = false, historyProgress = '';
  let historyDone = 0, historyTotal = 0; // progress of 장부 새로고침, in month tabs
  let historyChecks = null; // this month's tabs as the script read them on the last 장부 새로고침
  try { historyCache = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null'); } catch (e) { historyCache = null; }
  if (historyCache && !Array.isArray(historyCache.totals)) historyCache = null; // saved before dropout existed
  async function loadMemberHistory(force) {
    if (historyLoading || !scriptSource() || (!force && historyTried)) return; // once per page load unless asked: a failed fetch must not loop through render()
    historyLoading = true; historyTried = true;
    try {
      const j = await socialCall('member-history');
      historyCache = { at: new Date().toISOString(), months: j.months || [], coachMonths: j.coachMonths || [], totals: j.totals || [], stale: j.stale || 0, current: j.current || '' };
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache)); } catch (e) { /* ignore */ }
      historyError = '';
    } catch (err) {
      historyError = err.message || String(err);
    } finally {
      historyLoading = false;
      if (historyView()) render();
    }
  }
  // 회원구분 → 주니어 / 성인. WSC is the sheets' junior class (same words as Sheets' junior segment).
  const isJuniorType = (t) => /wsc|주니어|학생|아동|kid/i.test(t);
  // A coach's rows (or everyone's with coach = ''), summed per month:
  // active = on that month's roster, added = 등록일자 in that month, junior/adult split by 회원구분.
  // left = on last month's roster, not on this one (the script works it out from hashed
  // roster keys); rate = left ÷ last month's roster. With no coach, active is the number of
  // distinct people across every coach's book, not the sum of the rosters.
  function historySeries(rows, coach) {
    const byMonth = {};
    rows.filter((r) => !coach || r.coach === coach).forEach((r) => {
      const p = byMonth[r.month] || (byMonth[r.month] = { m: r.month, active: 0, added: 0, junior: 0, adult: 0, newJoin: 0, renew: 0, split: true, left: null });
      p.active += r.members; p.added += r.joined;
      if (r.newJoin == null) p.split = false; else { p.newJoin += r.newJoin; p.renew += r.renew; }
      Object.entries(r.byType || {}).forEach(([t, n]) => { if (isJuniorType(t)) p.junior += n; else p.adult += n; });
    });
    const drops = coach
      ? ((historyCache && historyCache.coachMonths) || []).filter((d) => d.coach === coach)
      : ((historyCache && historyCache.totals) || []);
    drops.forEach((d) => {
      const p = byMonth[d.month];
      if (!p) return;
      p.left = d.left;
      if (!coach && d.people) p.active = d.people;
    });
    const out = Object.keys(byMonth).sort().map((m) => byMonth[m]);
    out.forEach((p, i) => {
      p.other = p.split ? Math.max(0, p.added - p.newJoin - p.renew) : 0;
      const prev = out[i - 1];
      p.rate = p.left != null && prev && prev.m === ymAdd(p.m, -1) && prev.active ? p.left / prev.active : null;
    });
    return out;
  }
  const pct = (r) => (r == null ? '—' : `${(100 * r).toFixed(1)}%`);
  // Months counted before the 신규/재등록/명단키 columns existed have no split and no dropout.
  // "장부 다시 읽기" has the script recount them: each call is time-budgeted (~4.5 min), so
  // keep calling while it reports months remaining.
  async function rebuildMemberHistory() {
    if (historyLoading) return;
    historyLoading = true; historyError = ''; historyProgress = '장부 읽는 중…'; historyDone = 0; historyTotal = 0;
    render();
    try {
      // ~90 month tabs across nine books take several rounds. The script saves every tab as
      // it goes, so a round that dies at the time limit loses nothing: just ask again.
      let failures = 0;
      for (let round = 1; round <= 30; round++) {
        let j;
        // ~75 s per round, so the bar moves; this month is recounted in the first round only.
        try { j = await socialCall('member-history', Object.assign({ rebuild: '1', budget: '75' }, round > 1 ? { skipCurrent: '1' } : {})); failures = 0; }
        catch (err) {
          if (++failures >= 3) throw err;
          historyProgress = `시간 초과 — 이어서 읽는 중 (${failures}/3)`;
          if (historyView()) render();
          continue;
        }
        historyCache = { at: new Date().toISOString(), months: j.months || [], coachMonths: j.coachMonths || [], totals: j.totals || [], stale: j.stale || 0, current: j.current || '' };
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache)); } catch (e) { /* ignore */ }
        if (j.rebuilt && j.rebuilt.checks && j.rebuilt.checks.length) historyChecks = { at: new Date().toISOString(), rows: j.rebuilt.checks };
        const left = j.rebuilt ? j.rebuilt.remaining : 0;
        if (j.rebuilt && j.rebuilt.total) { historyTotal = j.rebuilt.total; historyDone = j.rebuilt.total - left; }
        if (!left) break;
        historyProgress = `${historyDone} / ${historyTotal}개월 · ${left}개월 남음`;
        if (historyView()) render();
      }
    } catch (err) {
      historyError = err.message || String(err);
    } finally {
      historyLoading = false; historyProgress = ''; historyDone = historyTotal = 0;
      if (historyView()) render();
    }
  }
  function historyTrend(months, coach) {
    const rows = (historyCache && historyCache.months) || [];
    if (!rows.length) return null;
    const now = today().slice(0, 7);
    const first = months === 'all' ? '' : ymAdd(now, -(months - 1));
    const inRange = (p) => p.m >= first && p.m <= now;
    const latest = rows.map((r) => r.month).filter((m) => m <= now).sort().pop() || now;
    // Coaches on the newest month's books first (largest roster first), then those who have left.
    const size = (c) => rows.filter((r) => r.coach === c && r.month === latest).reduce((a, r) => a + r.members, 0);
    const coaches = [...new Set(rows.map((r) => r.coach))];
    const current = coaches.filter((c) => size(c) > 0).sort((a, b) => size(b) - size(a) || a.localeCompare(b, 'ko'));
    const past = coaches.filter((c) => !current.includes(c)).sort((a, b) => a.localeCompare(b, 'ko'));
    return {
      points: historySeries(rows, coach).filter(inRange),
      perCoach: current.concat(past).map((c) => ({ coach: c, current: current.includes(c), points: historySeries(rows, c) })),
      inRange, latest,
      books: new Set(rows.map((r) => r.book)).size,
      coaches: current.concat(past), current,
      at: historyCache.at,
    };
  }

  // Coach lines: at most three, so every pair stays apart for colour-blind readers and each
  // line can carry its own end label (validated all-pairs on the ivory panel: Oxford blue / brass / green).
  const SERIES_COLORS = ['#2d53a3', '#b27a1e', '#2e9e7c'];
  function coachSeries(hist, key = 'active') {
    const solo = hist.perCoach.length <= SERIES_COLORS.length;
    const named = solo ? hist.perCoach : hist.perCoach.filter((c) => c.current).slice(0, SERIES_COLORS.length - 1);
    const rest = hist.perCoach.filter((c) => !named.includes(c));
    const months = [...new Set(hist.perCoach.flatMap((c) => c.points.map((p) => p.m)))].filter((m) => hist.inRange({ m })).sort();
    // A month with no book for the coach: 0 members, but for money a gap in the line — a coach
    // who left did not earn 0, they are just not in the books any more.
    const none = key === 'active' ? 0 : null;
    const at = (c, m) => { const p = c.points.find((q) => q.m === m); return p ? p[key] || 0 : none; };
    const series = named.map((c, i) => ({ key: 's' + i, label: c.coach, color: SERIES_COLORS[i] }));
    if (rest.length) series.push({ key: 's' + named.length, label: rest.every((c) => !c.current) ? '이전 코치' : '그 외 코치', color: SERIES_COLORS[named.length], members: rest.map((c) => c.coach) });
    const points = months.map((m) => {
      const p = { m };
      named.forEach((c, i) => { p['s' + i] = at(c, m); });
      if (rest.length) { const vs = rest.map((c) => at(c, m)).filter((v) => v != null); p['s' + named.length] = vs.length ? vs.reduce((a, v) => a + v, 0) : none; }
      return p;
    });
    return { series, points };
  }

  // Columns stacked by series (same geometry as barChart), 2px of surface between segments.
  // extra(p) adds tooltip rows that are not bars, e.g. the dropout rate.
  function stackedBarChart(points, series, label, extra, opts = {}) {
    const W = 1500, H = 190, L = 56, R = 34, T = 16, B = 34;
    const iw = W - L - R, ih = H - T - B, n = points.length;
    const total = (p) => series.reduce((a, s) => a + (p[s.key] || 0), 0);
    const max = niceMax(Math.max(...points.map(total), 1));
    const band = iw / n, bw = Math.min(24, Math.max(3, band - 2));
    const y = (v) => T + ih - (ih * v) / max;
    const step = Math.ceil(n / 12);
    const bars = (p, i) => {
      const bx = L + band * i + (band - bw) / 2;
      let base = 0;
      const segs = series.filter((s) => p[s.key] > 0);
      return segs.map((s, k) => {
        const v0 = base, v1 = base + p[s.key]; base = v1;
        const top = k === segs.length - 1;
        const y1 = y(v1) + (top ? 0 : 1), y0 = y(v0) - (k ? 1 : 0); // 1px off each shared edge = 2px gap
        if (y0 - y1 < 0.5) return '';
        const r = top ? Math.min(4, bw / 2, y0 - y1) : 0;
        return `<path d="M${bx.toFixed(1)},${(y1 + r).toFixed(1)} a${r},${r} 0 0 1 ${r},${-r} h${(bw - 2 * r).toFixed(1)} a${r},${r} 0 0 1 ${r},${r} V${y0.toFixed(1)} H${bx.toFixed(1)} Z" fill="${s.color}"/>`;
      }).join('');
    };
    const legend = series.length > 1 ? `<div class="chart-legend">${series.map((s) => `<span><i class="sq" style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>` : '';
    const axis = axisOf(opts);
    return `${legend}<figure class="chart"${figAttr(opts)}>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
        ${[0, 1].map((f) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(y(max * f) + 4).toFixed(1)}" text-anchor="end">${axis(max * f)}</text>`).join('')}
        ${points.map(bars).join('')}
        ${monthTicks(points, step).map((t) => `<text class="tick" x="${(L + band * t.i + band / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(t.text)}</text>`).join('')}
        ${points.map((p, i) => `<rect class="hit" tabindex="0" data-x="${(L + band * i + band / 2).toFixed(1)}" data-y="${y(total(p)).toFixed(1)}" data-label="${esc(p.m)}" data-rows="${esc(JSON.stringify(series.map((s) => [s.label, s.color, p[s.key] || 0]).concat(extra ? extra(p) : [])))}" x="${(L + band * i).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ih}" fill="transparent"/>`).join('')}
      </svg>
      <div class="chart-tip" hidden></div>
    </figure>`;
  }

  // Lines, several series on one axis (same geometry as lineChart). Identity is never colour
  // alone: a legend above, the value + name at each line's end, and every value in the tooltip.
  // opts.tick(p, i) labels the x axis (default: months); opts.fmt(v) formats values. A null
  // value is a gap: the line breaks there and its end label sits on its last real point.
  function multiLineChart(points, series, label, opts = {}) {
    const W = 1500, H = 250, L = 56, R = 120, T = 16, B = 34; // R leaves room for the end labels
    const iw = W - L - R, ih = H - T - B, n = points.length;
    const fmt = opts.fmt || ((v) => String(v));
    const val = (p, s) => (p[s.key] == null ? null : p[s.key]);
    const max = niceMax(Math.max(...points.flatMap((p) => series.map((s) => val(p, s) || 0)), 1));
    const x = (i) => n === 1 ? L + iw / 2 : L + (iw * i) / (n - 1);
    const y = (v) => T + ih - (ih * v) / max;
    const band = n === 1 ? iw : iw / (n - 1);
    const step = Math.ceil(n / 12);
    const ticks = opts.tick ? points.map((p, i) => ({ i, text: opts.tick(p, i) })).filter((t) => t.i % step === 0 || t.i === n - 1) : monthTicks(points, step);
    const path = (s) => { let pen = false; return points.map((p, i) => { const v = val(p, s); if (v == null) { pen = false; return ''; } const c = `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; return c; }).join(' '); };
    // End labels: stacked by value, pushed apart so two close lines don't print over each other.
    const ends = series.map((s) => { let i = n - 1; while (i >= 0 && val(points[i], s) == null) i--; return i < 0 ? null : { s, i, v: val(points[i], s), y: y(val(points[i], s)) }; })
      .filter(Boolean).sort((a, b) => a.y - b.y);
    ends.forEach((e, i) => { if (i && e.y - ends[i - 1].ly < 16) e.ly = ends[i - 1].ly + 16; else e.ly = e.y; });
    const tickText = opts.money ? wonShort : (v) => (Number.isInteger(v) ? v : +v.toFixed(1));
    const legend = `<div class="chart-legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.label)}${s.members ? ` <em>(${s.members.map(esc).join(', ')})</em>` : ''}</span>`).join('')}</div>`;
    return `${legend}<figure class="chart"${figAttr(opts)}>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
        ${[0, 0.5, 1].map((f) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(y(max * f) + 4).toFixed(1)}" text-anchor="end">${tickText(max * f)}</text>`).join('')}
        ${series.map((s) => `<path d="${path(s)}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
        ${ticks.map((t) => `<text class="tick" x="${x(t.i).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(t.text)}</text>`).join('')}
        <line class="crosshair" x1="0" x2="0" y1="${T}" y2="${T + ih}" style="display:none"/>
        ${ends.map((e) => `<circle cx="${x(e.i).toFixed(1)}" cy="${e.y.toFixed(1)}" r="4.5" fill="${e.s.color}" stroke="#fff" stroke-width="2"/><text class="end-label" x="${(x(e.i) + 12).toFixed(1)}" y="${(e.ly + 4).toFixed(1)}">${esc((opts.money && !opts.fmt ? wonShort : fmt)(e.v))} <tspan class="tick">${esc(e.s.label)}</tspan></text>`).join('')}
        ${points.map((p, i) => `<rect class="hit" tabindex="0" data-x="${x(i).toFixed(1)}" data-y="${T}" data-label="${esc(opts.tick ? opts.tick(p, i) : p.m)}" data-rows="${esc(JSON.stringify(series.map((s) => [s.label, s.color, val(p, s) == null ? '—' : opts.fmt ? fmt(val(p, s)) : val(p, s)])))}" x="${(x(i) - band / 2).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ih}" fill="transparent"/>`).join('')}
      </svg>
      <div class="chart-tip" hidden></div>
    </figure>`;
  }


  // One row per coach: where the roster stands and which way it is going.
  function coachTable(hist) {
    const now = hist.latest, prev = ymAdd(now, -1), yearAgo = ymAdd(now, -12);
    const at = (pts, m) => { const p = pts.find((q) => q.m === m); return p ? p.active : null; };
    const diff = (a, b) => (a == null || b == null ? '—' : `<span style="color:${a - b < 0 ? 'var(--bad)' : 'inherit'}">${a - b > 0 ? '+' : ''}${a - b}</span>`);
    const rows = hist.perCoach.map(({ coach, current, points }) => {
      const cur = at(points, now);
      const last12 = points.filter((p) => p.m > yearAgo && p.m <= now);
      const peak = last12.reduce((a, p) => (p.active > a.active ? p : a), { active: 0, m: '' });
      const juniors = points.find((p) => p.m === now);
      const rated = last12.filter((p) => p.rate != null);
      const leftSum = rated.reduce((a, p) => a + p.left, 0);
      const avgRate = rated.length ? rated.reduce((a, p) => a + p.rate, 0) / rated.length : null;
      const split = last12.length && last12.every((p) => p.split);
      return `<tr${current ? '' : ' style="color:var(--muted)"'}><td>${esc(coach)}${current ? '' : ' <span class="muted-note">(이전)</span>'}</td>
        <td>${cur == null ? '—' : cur}</td><td>${diff(cur, at(points, prev))}</td><td>${diff(cur, at(points, yearAgo))}</td>
        <td>${juniors && juniors.active ? `${Math.round((100 * juniors.junior) / juniors.active)}%` : '—'}</td>
        <td>${last12.reduce((a, p) => a + p.added, 0)}${split ? ` <span class="muted-note">(신규 ${last12.reduce((a, p) => a + p.newJoin, 0)} · 재등록 ${last12.reduce((a, p) => a + p.renew, 0)})</span>` : ''}</td>
        <td>${rated.length ? `${leftSum} <span class="muted-note">(월 ${pct(avgRate)})</span>` : '—'}</td><td>${peak.m ? `${peak.active} <span class="muted-note">(${esc(peak.m)})</span>` : '—'}</td></tr>`;
    });
    return `<h3 class="chart-title">코치별 현황 <span>${esc(now)} 장부 기준</span></h3>
      <div class="table-wrap"><table><thead><tr><th>담당강사</th><th>회원</th><th>전월 대비</th><th>전년 동월 대비</th><th>주니어 비율</th><th>최근 12개월 등록</th><th>12개월 이탈 (월평균)</th><th>12개월 최고</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>`;
  }

  // Line + area, one series: the level — how many members there are.
  function lineChart(points, key, color, label, opts = {}) {
    const W = 1500, H = 250, L = 56, R = 34, T = 16, B = 34; // wide viewBox: the SVG scales to the panel width, so a tall box would render huge
    const iw = W - L - R, ih = H - T - B, n = points.length;
    const max = niceMax(Math.max(...points.map((p) => p[key]), 1));
    const x = (i) => n === 1 ? L + iw / 2 : L + (iw * i) / (n - 1);
    const y = (v) => T + ih - (ih * v) / max;
    const band = n === 1 ? iw : iw / (n - 1);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
    const area = `${line} L${x(n - 1).toFixed(1)},${(T + ih).toFixed(1)} L${x(0).toFixed(1)},${(T + ih).toFixed(1)} Z`;
    const step = Math.ceil(n / 12);
    const last = points[n - 1];
    const axis = axisOf(opts);
    return `<figure class="chart"${figAttr(opts)}>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
        ${[0, 0.5, 1].map((f) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(y(max * f) + 4).toFixed(1)}" text-anchor="end">${axis(max * f)}</text>`).join('')}
        <path d="${area}" fill="${color}" fill-opacity=".1"/>
        <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${monthTicks(points, step).map((t) => `<text class="tick" x="${x(t.i).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(t.text)}</text>`).join('')}
        <line class="crosshair" x1="0" x2="0" y1="${T}" y2="${T + ih}" style="display:none"/>
        <circle class="focus-dot" r="4.5" fill="${color}" stroke="#fff" stroke-width="2" style="display:none"/>
        <circle cx="${x(n - 1).toFixed(1)}" cy="${y(last[key]).toFixed(1)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2"/>
        <text class="end-label" x="${(x(n - 1) - 8).toFixed(1)}" y="${(y(last[key]) - 12 < T + 10 ? y(last[key]) + 20 : y(last[key]) - 12).toFixed(1)}" text-anchor="end">${opts.money ? wonShort(last[key]) : last[key]}</text>
        ${points.map((p, i) => `<rect class="hit" tabindex="0" data-x="${x(i).toFixed(1)}" data-y="${y(p[key]).toFixed(1)}" data-label="${esc(p.m)}" data-v="${p[key]}" x="${(x(i) - band / 2).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ih}" fill="transparent"/>`).join('')}
      </svg>
      <div class="chart-tip" hidden></div>
    </figure>`;
  }

  // Columns, one series: the flow — how many joined that month.
  function barChart(points, key, color, label, opts = {}) {
    const W = 1500, H = 190, L = 56, R = 34, T = 16, B = 34;
    const iw = W - L - R, ih = H - T - B, n = points.length;
    const max = niceMax(Math.max(...points.map((p) => p[key]), 1));
    const band = iw / n, bw = Math.min(24, Math.max(3, band - 2)); // <=24px thick, 2px of surface between neighbours
    const y = (v) => T + ih - (ih * v) / max;
    const step = Math.ceil(n / 12);
    const bar = (p, i) => {
      const h = (ih * p[key]) / max, bx = L + band * i + (band - bw) / 2, by = T + ih - h;
      if (!h) return '';
      const r = Math.min(4, bw / 2, h);
      return `<path d="M${bx.toFixed(1)},${(by + r).toFixed(1)} a${r},${r} 0 0 1 ${r},${-r} h${(bw - 2 * r).toFixed(1)} a${r},${r} 0 0 1 ${r},${r} V${(T + ih).toFixed(1)} H${bx.toFixed(1)} Z" fill="${color}"/>`;
    };
    const axis = axisOf(opts);
    return `<figure class="chart"${figAttr(opts)}>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
        ${[0, 1].map((f) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(y(max * f) + 4).toFixed(1)}" text-anchor="end">${axis(max * f)}</text>`).join('')}
        ${points.map(bar).join('')}
        ${monthTicks(points, step).map((t) => `<text class="tick" x="${(L + band * t.i + band / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(t.text)}</text>`).join('')}
        ${points.map((p, i) => `<rect class="hit" tabindex="0" data-x="${(L + band * i + band / 2).toFixed(1)}" data-y="${y(p[key]).toFixed(1)}" data-label="${esc(p.m)}" data-v="${p[key]}" x="${(L + band * i).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ih}" fill="transparent"/>`).join('')}
      </svg>
      <div class="chart-tip" hidden></div>
    </figure>`;
  }

  // Hover/focus layer: the hit rects carry the values, so the tooltip needs no lookup table.
  // Labels go in with textContent — they come from the sheet.
  function wireChart(fig) {
    const svg = fig.querySelector('svg'), tip = fig.querySelector('.chart-tip');
    const cross = fig.querySelector('.crosshair'), dot = fig.querySelector('.focus-dot');
    const unit = (v) => (fig.dataset.fmt === 'won' ? wonFull(v) : `${v}명`);
    const hide = () => { tip.hidden = true; if (cross) cross.style.display = 'none'; if (dot) dot.style.display = 'none'; };
    const show = (r) => {
      const vb = svg.viewBox.baseVal, box = svg.getBoundingClientRect();
      const cx = +r.dataset.x, cy = +r.dataset.y, sx = box.width / vb.width, sy = box.height / vb.height;
      if (cross) { cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.style.display = ''; }
      if (dot) { dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.style.display = ''; }
      tip.textContent = '';
      tip.classList.toggle('multi', !!r.dataset.rows);
      if (r.dataset.rows) { // several series: the month, then one "● name value" line each
        const l = document.createElement('span'); l.textContent = r.dataset.label;
        tip.append(l);
        JSON.parse(r.dataset.rows).forEach(([name, color, val]) => {
          const row = document.createElement('div');
          const key = document.createElement('i'); if (color) key.style.background = color; else key.style.visibility = 'hidden';
          const nm = document.createElement('span'); nm.textContent = name;
          const v = document.createElement('strong'); v.textContent = typeof val === 'number' ? unit(val) : val;
          row.append(key, nm, v);
          tip.append(row);
        });
      } else {
        const v = document.createElement('strong'); v.textContent = unit(+r.dataset.v);
        const l = document.createElement('span'); l.textContent = r.dataset.label;
        tip.append(v, l);
      }
      tip.hidden = false;
      tip.style.left = `${Math.max(0, Math.min(box.width - tip.offsetWidth, cx * sx - tip.offsetWidth / 2))}px`;
      tip.style.top = `${Math.max(0, cy * sy - tip.offsetHeight - 10)}px`;
    };
    fig.querySelectorAll('rect.hit').forEach((r) => { r.onpointerenter = () => show(r); r.onfocus = () => show(r); r.onblur = hide; });
    fig.onpointerleave = hide;
  }

  // What the script understood in each coach's current month tab: which columns it found,
  // the 등록분류 words, and dates it could not read (digits shown as 9). Opens by itself when
  // something looks off — registrations dated this month but none classed 신규/재등록,
  // unreadable dates, or a missing column.
  // 장부 새로고침 progress: determinate once the first round reports how many month tabs
  // there are, a sliding bar before that.
  function progressBar() {
    return progressHtml(historyTotal ? historyDone / historyTotal : null, historyProgress || '장부 읽는 중…', '장부 읽는 중');
  }
  // frac = 0…1, or null for a sliding bar while the total is not known yet.
  function progressHtml(frac, text, label, id) {
    const pct = frac == null ? null : Math.round(100 * frac);
    return `<div class="progress-wrap"${id ? ` id="${id}"` : ''} role="progressbar" aria-label="${esc(label)}" ${pct == null ? '' : `aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"`}>
      <div class="progress${pct == null ? ' indeterminate' : ''}"><i style="width:${pct == null ? 30 : Math.max(2, pct)}%"></i></div>
      <span>${esc(text)}${pct == null ? '' : ` · ${pct}%`}</span>
    </div>`;
  }

  function historyCheckTable() {
    if (!historyChecks) return '';
    const off = (r) => r.error || !r.check || !r.check.columns || r.check.columns.iReg == null || r.check.columns.iJoined == null
      || r.check.unreadDates > 0 || (r.joined > 0 && r.newJoin + r.renew === 0);
    const cols = (c) => c ? ['iJoined', 'iReg', 'iType', 'iPay'].map((k) => `${{ iJoined: '등록일자', iReg: '등록분류', iType: '회원구분', iPay: '결제 금액' }[k]}: ${c[k] ? esc(c[k]) : '<b style="color:var(--bad)">없음</b>'}`).join(' · ') : '—';
    const regs = (v) => Object.entries(v || {}).map(([k, n]) => `${esc(k)} ${n}`).join(', ') || '—';
    const rows = historyChecks.rows.map((r) => r.error
      ? `<tr><td>${esc(r.coach)}</td><td>${esc(r.tab)}</td><td colspan="6" style="color:var(--bad)">${esc(r.error)}</td></tr>`
      : `<tr><td>${esc(r.coach)}</td><td>${esc(r.tab)}</td><td>${r.members}</td><td>${r.joined} <span class="muted-note">(신규 ${r.newJoin} · 재등록 ${r.renew})</span></td><td>${r.revenue == null ? '—' : `${wonFull(r.revenue)}${r.unpaidRows ? ` <span class="muted-note">(금액 없음 ${r.unpaidRows}건)</span>` : ''}`}</td>
          <td class="wrap">${regs(r.check && r.check.regValues)}</td>
          <td>${r.check && r.check.unreadDates ? `<span style="color:var(--bad)">${r.check.unreadDates}건</span> <span class="muted-note">${r.check.unreadSamples.map(esc).join(', ')}</span>` : '0'}</td>
          <td class="wrap">${cols(r.check && r.check.columns)}</td></tr>`);
    return `<details class="chart-table"${historyChecks.rows.some(off) ? ' open' : ''}><summary>이번 달 장부 점검 · ${new Date(historyChecks.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</summary>
      <div class="table-wrap"><table><thead><tr><th>담당강사</th><th>탭</th><th>명부</th><th>이번 달 등록일자</th><th>이번 달 매출</th><th>등록분류 값</th><th>못 읽은 날짜</th><th>찾은 열</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>
      <p class="chart-note">신규·재등록은 등록일자가 이번 달이고 등록분류에 "신규" 또는 "재등록"이 들어간 행만 셉니다. 이름은 표시하지 않습니다.</p>
    </details>`;
  }

  function trendPanel(members) {
    loadMemberHistory();
    const hist = historyTrend(state.trendMonths, state.trendCoach);
    const books = !!(hist && hist.perCoach.length);
    const coach = books && hist.coaches.includes(state.trendCoach) ? state.trendCoach : '';
    const { points, dated, undated } = books ? hist : memberTrend(members, state.trendMonths);
    if (!points.length && !books) return '';
    const n = points.length, last = points[n - 1] || { active: 0 }, prev = points[n - 2];
    const delta = prev ? last.active - prev.active : 0;
    const rangeBtn = (v, l) => `<button class="chip ${state.trendMonths === v ? 'on' : ''}" data-trend="${v}">${l}</button>`;
    const coachBtn = (v, l) => `<button class="chip ${coach === v ? 'on' : ''}" data-trend-coach="${esc(v)}">${esc(l)}</button>`;
    const sum = points.reduce((a, p) => a + p.added, 0);
    const split = books && points.some((p) => p.junior || p.adult);
    const byCoach = books && !coach && hist.perCoach.length > 1 ? coachSeries(hist) : null;
    const who = coach ? `${esc(coach)} · ` : '';
    const splitJoins = books && points.length && points.every((p) => p.split);
    const hasOther = splitJoins && points.some((p) => p.other > 0);
    const churn = books && points.some((p) => p.left != null);
    const lastRated = churn ? points.filter((p) => p.left != null).pop() : null;
    const stale = books && historyCache.stale ? historyCache.stale : 0;
    const CHURN = '#9a4a6e'; // mulberry: its own identity, not the burgundy alert colour and not a coach/sign-up hue
    return `<div class="panel chart-panel">
      <div class="chart-head">
        <h2>회원 추이 <span class="muted-note">${who}활동 회원 ${last.active}명${prev ? ` · 전월 대비 ${delta > 0 ? '+' : ''}${delta}명` : ''}${lastRated ? ` · ${esc(lastRated.m)} 이탈 ${lastRated.left}명 (${pct(lastRated.rate)})` : ''}</span></h2>
        <div class="chips">${rangeBtn(12, '12개월')}${rangeBtn(24, '24개월')}${rangeBtn('all', '전체')}${scriptSource() ? `<button class="chip" id="btn-history" ${historyLoading ? 'disabled' : ''}>${historyLoading ? '읽는 중…' : '장부 새로고침'}</button>` : ''}</div>
      </div>
      ${historyLoading ? progressBar() : ''}
      ${stale && scriptSource() ? `<p class="chart-note">${stale}개월은 신규·재등록과 이탈 집계 전에 저장된 기록입니다. <button class="chip" id="btn-history-rebuild" ${historyLoading ? 'disabled' : ''}>장부 다시 읽기</button> <span class="muted-note">(몇 분 걸릴 수 있습니다)</span></p>` : ''}
      ${books ? `<div class="chips coach-chips"><span class="muted-note">담당강사</span>${coachBtn('', '전체')}${hist.current.map((c) => coachBtn(c, c)).join('')}${hist.coaches.filter((c) => !hist.current.includes(c)).map((c) => coachBtn(c, c + ' (이전)')).join('')}</div>` : ''}
      ${points.length ? `
      <h3 class="chart-title">${who}활동 회원 수 <span>${books ? '그 달 장부 명부에 있는 회원' : '월말 기준 · 유효기간이 남아 있는 회원'}</span></h3>
      ${lineChart(points, 'active', CHART_ACTIVE, '월별 활동 회원 수')}
      ${splitJoins
        ? `<h3 class="chart-title">${who}등록 <span>등록일자가 그 달인 회원 · 신규 ${points.reduce((a, p) => a + p.newJoin, 0)} · 재등록 ${points.reduce((a, p) => a + p.renew, 0)}${hasOther ? ` · 기타 ${points.reduce((a, p) => a + p.other, 0)}` : ''}명</span></h3>
      ${stackedBarChart(points, [{ key: 'newJoin', label: '신규', color: SERIES_COLORS[0] }, { key: 'renew', label: '재등록', color: SERIES_COLORS[1] }].concat(hasOther ? [{ key: 'other', label: '기타 (등록분류 없음)', color: '#a39e93' }] : []), '월별 신규·재등록 수')}`
        : `<h3 class="chart-title">${who}신규 등록 <span>등록일자가 그 달인 회원${books ? ' (재등록 포함)' : ''} · 기간 합계 ${sum}명</span></h3>
      ${barChart(points, 'added', CHART_NEW, '월별 신규 등록 수')}`}
      ${churn ? `<h3 class="chart-title">${who}이탈 <span>지난달 명부에 있었는데 이번 달 명부에 없는 회원 · 이탈률 = 이탈 ÷ 지난달 회원</span></h3>
      ${stackedBarChart(points.map((p) => Object.assign({}, p, { left: p.left || 0 })), [{ key: 'left', label: '이탈', color: CHURN }], '월별 이탈 회원 수', (p) => [['이탈률', null, points.find((q) => q.m === p.m).left == null ? '기록 없음' : pct(p.rate)]])}` : ''}
      ${split ? `<h3 class="chart-title">${who}주니어 · 성인 <span>회원구분 WSC = 주니어, 나머지 = 성인</span></h3>
      ${multiLineChart(points, [{ key: 'junior', label: '주니어', color: SERIES_COLORS[0] }, { key: 'adult', label: '성인', color: SERIES_COLORS[1] }], '월별 주니어·성인 회원 수')}` : ''}`
      : `<p class="empty">${esc(coach)} 코치의 장부에 이 기간 기록이 없습니다. 기간을 '전체'로 바꿔 보세요.</p>`}
      ${byCoach && byCoach.points.length ? `<h3 class="chart-title">코치별 활동 회원 <span>코치 이름을 누르면 그 코치만 봅니다</span></h3>
      ${multiLineChart(byCoach.points, byCoach.series, '코치별 월별 활동 회원 수')}` : ''}
      ${books && !coach ? coachTable(hist) : ''}
      <p class="chart-note">${books
        ? `코치 장부 ${hist.books}권(${hist.coaches.map(esc).join(' · ')})의 월별 명부로 계산 · ${new Date(hist.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 불러옴. ${coach ? '' : '전체 활동 회원은 두 코치에게 등록한 사람도 한 번만 셉니다 (코치별 합보다 적을 수 있음). '}이탈은 이름 대신 암호화한 명단 키로 비교하며, 같은 이름의 다른 회원은 구분하지 못합니다. 이번 달 장부가 아직 입력 중이면 이번 달 이탈이 크게 보일 수 있습니다.`
        : `등록일자가 있는 ${dated}명으로 계산${undated ? ` (날짜 없는 ${undated}명 제외)` : ''}. 재등록은 한 회원으로 합쳐지고 시트에서 지워진 회원은 빠지므로, 과거 달일수록 실제보다 적게 보일 수 있습니다.`}${historyError ? ` <span style="color:var(--bad)">장부를 불러오지 못했습니다: ${esc(historyError)}</span>` : ''}</p>
      ${historyCheckTable()}
      ${points.length ? `<details class="chart-table"><summary>표로 보기</summary>
        <div class="table-wrap"><table><thead><tr><th>월</th><th>활동 회원</th><th>신규 등록</th>${splitJoins ? '<th>신규</th><th>재등록</th>' : ''}${churn ? '<th>이탈</th><th>이탈률</th>' : ''}${split ? '<th>주니어</th><th>성인</th>' : ''}${byCoach ? byCoach.series.map((s) => `<th>${esc(s.label)}</th>`).join('') : ''}</tr></thead>
        <tbody>${points.slice().reverse().map((p) => {
          const c = byCoach && byCoach.points.find((q) => q.m === p.m);
          return `<tr><td>${esc(p.m)}</td><td>${p.active}</td><td>${p.added}</td>${splitJoins ? `<td>${p.newJoin}</td><td>${p.renew}</td>` : ''}${churn ? `<td>${p.left == null ? '—' : p.left}</td><td>${pct(p.rate)}</td>` : ''}${split ? `<td>${p.junior}</td><td>${p.adult}</td>` : ''}${byCoach ? byCoach.series.map((s) => `<td>${c ? c[s.key] : '—'}</td>`).join('') : ''}</tr>`;
        }).join('')}</tbody></table></div>
      </details>` : ''}
    </div>`;
  }

  // ---------- Year over year (Dashboard) ----------
  // One line per year across 1월–12월, for the metric picked above the chart; follows the
  // 담당강사 filter. The latest three years are drawn (three hues stay apart for colour-blind
  // readers — this year blue, last year brass, the year before green); each keeps its colour
  // by recency, so this year is always blue.
  const YOY_METRICS = [
    { key: 'active', label: '활동 회원', flow: false },
    { key: 'newJoin', label: '신규', flow: true, split: true },
    { key: 'renew', label: '재등록', flow: true, split: true },
    { key: 'left', label: '이탈', flow: true },
    { key: 'rate', label: '이탈률', flow: false, pct: true },
  ];
  function yoyPanel() {
    const rows = (historyCache && historyCache.months) || [];
    if (!rows.length) return '';
    const coach = state.trendCoach && rows.some((r) => r.coach === state.trendCoach) ? state.trendCoach : '';
    const series = historySeries(rows, coach);
    const years = [...new Set(series.map((p) => p.m.slice(0, 4)))].sort().reverse();
    if (years.length < 2) return '';
    const shown = years.slice(0, 3);
    const metric = YOY_METRICS.find((m) => m.key === state.yoyMetric) || YOY_METRICS[0];
    const value = (p) => {
      if (!p) return null;
      if (metric.split && !p.split) return null;
      if (metric.key === 'rate') return p.rate == null ? null : +(100 * p.rate).toFixed(1);
      return p[metric.key] == null ? null : p[metric.key];
    };
    const at = (y, mo) => value(series.find((p) => p.m === `${y}-${String(mo).padStart(2, '0')}`));
    const points = Array.from({ length: 12 }, (_, i) => { const p = { m: String(i + 1) }; shown.forEach((y) => { p[y] = at(y, i + 1); }); return p; });
    const lines = shown.map((y, i) => ({ key: y, label: `${y}년`, color: SERIES_COLORS[i] }));
    const fmt = (v) => (metric.pct ? `${v}%` : `${v}명`);
    // Headline: flows compare the year to date, levels compare the latest month.
    const [cur, prev] = shown;
    let lastMo = 12; while (lastMo > 0 && at(cur, lastMo) == null) lastMo--;
    let head = '';
    if (lastMo) {
      if (metric.flow) {
        const sum = (y) => { let t = 0, any = false; for (let mo = 1; mo <= lastMo; mo++) { const v = at(y, mo); if (v != null) { t += v; any = true; } } return any ? t : null; };
        const a = sum(cur), b = sum(prev);
        head = `${cur}년 1–${lastMo}월 ${metric.label} ${a}명${b == null ? '' : ` · 전년 동기 ${b}명 (${a - b >= 0 ? '+' : ''}${a - b}${b ? `, ${a - b >= 0 ? '+' : ''}${((100 * (a - b)) / b).toFixed(1)}%` : ''})`}`;
      } else {
        const a = at(cur, lastMo), b = at(prev, lastMo);
        const d = b == null ? null : +(a - b).toFixed(1);
        head = `${lastMo}월 ${metric.label} ${fmt(a)}${b == null ? '' : ` · 전년 ${lastMo}월 ${fmt(b)} (${d >= 0 ? '+' : ''}${metric.pct ? d + '%p' : d + '명'})`}`;
      }
    }
    const chip = (m) => `<button class="chip ${m.key === metric.key ? 'on' : ''}" data-yoy="${m.key}">${esc(m.label)}</button>`;
    const cell = (v) => (v == null ? '—' : esc(fmt(v)));
    return `<div class="panel chart-panel">
      <div class="chart-head">
        <h2>전년 비교 <span class="muted-note">${coach ? esc(coach) + ' · ' : ''}${esc(head)}</span></h2>
        <div class="chips">${YOY_METRICS.map(chip).join('')}</div>
      </div>
      ${multiLineChart(points, lines, `연도별 월별 ${metric.label}`, { tick: (p) => `${p.m}월`, fmt })}
      <p class="chart-note">같은 달끼리 비교합니다. 그해 장부가 있는 코치만 세므로, 장부가 없는 달은 비어 있습니다.${years.length > 3 ? ` 최근 3년만 표시합니다 (${years.slice(3).join(', ')}년 제외).` : ''}${metric.split ? ' 신규·재등록은 등록분류로 나눕니다.' : ''}${metric.key === 'rate' ? ' 이탈률 = 이탈 ÷ 지난달 회원.' : ''} 담당강사 필터는 위 회원 추이에서 바꿉니다.</p>
      <details class="chart-table"><summary>표로 보기</summary>
        <div class="table-wrap"><table><thead><tr><th>월</th>${shown.map((y) => `<th>${y}년</th>`).join('')}<th>전년 대비</th></tr></thead>
        <tbody>${points.map((p) => { const a = p[cur], b = p[prev]; const d = a == null || b == null ? null : +(a - b).toFixed(1);
          return `<tr><td>${p.m}월</td>${shown.map((y) => `<td>${cell(p[y])}</td>`).join('')}<td>${d == null ? '—' : `<span style="color:${d < 0 ? 'var(--bad)' : 'inherit'}">${d > 0 ? '+' : ''}${d}${metric.pct ? '%p' : ''}</span>`}</td></tr>`; }).join('')}</tbody></table></div>
      </details>
    </div>`;
  }


  // ---------- Monthly revenue (Revenue view) ----------
  // From the same books and cache as 회원 추이: for each coach's monthly tab the script sums
  // 결제 금액 over the rows whose 등록일자 falls in that month (every payment row, so two
  // payments in one month both count), split 신규/재등록 by 등록분류. Carried-over rows are
  // not counted again. Months counted before the 매출 columns existed have revenue null.
  function revenueSeries(rows, coach) {
    const byMonth = {};
    rows.filter((r) => !coach || r.coach === coach).forEach((r) => {
      const p = byMonth[r.month] || (byMonth[r.month] = { m: r.month, revenue: 0, revNew: 0, revRenew: 0, paid: 0, unpaid: 0, counted: true });
      if (r.revenue == null) { p.counted = false; return; }
      p.revenue += r.revenue; p.revNew += r.revNew || 0; p.revRenew += r.revRenew || 0;
      p.paid += r.paidRows || 0; p.unpaid += r.unpaidRows || 0;
    });
    return Object.keys(byMonth).sort().map((m) => {
      const p = byMonth[m];
      p.revOther = Math.max(0, p.revenue - p.revNew - p.revRenew);
      p.avg = p.paid ? Math.round(p.revenue / p.paid) : null;
      return p;
    }).filter((p) => p.counted); // a month with any coach not yet recounted would read low
  }
  // "+120만 (+8.3%)": a change in won, short, red when down.
  function wonDiff(a, b) {
    if (a == null || b == null) return '—';
    const d = a - b;
    return `<span style="color:${d < 0 ? 'var(--bad)' : 'inherit'}">${d > 0 ? '+' : ''}${wonShort(d)}${b ? ` (${d > 0 ? '+' : ''}${((100 * d) / b).toFixed(1)}%)` : ''}</span>`;
  }

  function revenueCoachTable(perCoach, latest) {
    const prev = ymAdd(latest, -1), yearAgo = ymAdd(latest, -12);
    const at = (pts, m) => { const p = pts.find((q) => q.m === m); return p ? p.revenue : null; };
    const rows = perCoach.map(({ coach, current, points }) => {
      const cur = at(points, latest);
      const last12 = points.filter((p) => p.m > yearAgo && p.m <= latest);
      const total = last12.reduce((a, p) => a + p.revenue, 0);
      const paid = last12.reduce((a, p) => a + p.paid, 0);
      const peak = last12.reduce((a, p) => (p.revenue > a.revenue ? p : a), { revenue: 0, m: '' });
      return `<tr${current ? '' : ' style="color:var(--muted)"'}><td>${esc(coach)}${current ? '' : ' <span class="muted-note">(이전)</span>'}</td>
        <td>${cur == null ? '—' : wonFull(cur)}</td><td>${wonDiff(cur, at(points, prev))}</td><td>${wonDiff(cur, at(points, yearAgo))}</td>
        <td>${last12.length ? `${wonFull(total)} <span class="muted-note">(신규 ${wonShort(last12.reduce((a, p) => a + p.revNew, 0))} · 재등록 ${wonShort(last12.reduce((a, p) => a + p.revRenew, 0))})</span>` : '—'}</td>
        <td>${last12.length ? wonFull(Math.round(total / last12.length)) : '—'}</td>
        <td>${peak.m ? `${wonFull(peak.revenue)} <span class="muted-note">(${esc(peak.m)})</span>` : '—'}</td>
        <td>${paid ? wonFull(Math.round(total / paid)) : '—'}</td></tr>`;
    });
    return `<h3 class="chart-title">코치별 매출 <span>${esc(latest)} 장부 기준</span></h3>
      <div class="table-wrap"><table><thead><tr><th>담당강사</th><th>이번 달</th><th>전월 대비</th><th>전년 동월 대비</th><th>최근 12개월</th><th>월평균</th><th>12개월 최고</th><th>건당 평균</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>`;
  }

  function revenuePanel() {
    loadMemberHistory();
    const rows = (historyCache && historyCache.months) || [];
    const hist = historyTrend(state.revMonths, state.revCoach);
    const coach = hist && hist.coaches.includes(state.revCoach) ? state.revCoach : '';
    const counted = rows.filter((r) => r.revenue != null).length;
    const stale = rows.length - counted;
    const who = coach ? `${esc(coach)} · ` : '';
    const rangeBtn = (v, l) => `<button class="chip ${state.revMonths === v ? 'on' : ''}" data-rev-range="${v}">${l}</button>`;
    const coachBtn = (v, l) => `<button class="chip ${coach === v ? 'on' : ''}" data-rev-coach="${esc(v)}">${esc(l)}</button>`;
    const refresh = scriptSource() ? `<button class="chip" id="btn-history" ${historyLoading ? 'disabled' : ''}>${historyLoading ? '읽는 중…' : '장부 새로고침'}</button>` : '';
    const error = historyError ? ` <span style="color:var(--bad)">장부를 불러오지 못했습니다: ${esc(historyError)}</span>` : '';
    if (!hist || !counted) {
      return `<div class="panel chart-panel">
        <div class="chart-head"><h2>매출 추이</h2><div class="chips">${refresh}</div></div>
        ${historyLoading ? progressBar() : ''}
        <p class="empty">아직 매출 기록이 없습니다. 코치 장부의 <b>결제 금액</b>을 읽으려면 <b>장부 새로고침</b>을 누르세요 (처음 한 번은 모든 달을 다시 읽어 몇 분 걸립니다).${scriptSource() ? '' : ' 먼저 Members 탭에서 Apps Script 연결이 필요합니다.'}${error}</p>
        ${historyCheckTable()}
      </div>`;
    }
    const all = revenueSeries(rows, coach);
    const points = all.filter(hist.inRange);
    const perCoach = hist.coaches.map((c) => ({ coach: c, current: hist.current.includes(c), points: revenueSeries(rows, c) }));
    const byCoach = !coach && perCoach.length > 1 ? coachSeries({ perCoach, inRange: hist.inRange }, 'revenue') : null;
    const last = points[points.length - 1];
    const find = (m) => all.find((p) => p.m === m);
    const prev = last && find(ymAdd(last.m, -1)), yearAgo = last && find(ymAdd(last.m, -12));
    const inProgress = last && last.m === historyCache.current;
    const sum = points.reduce((a, p) => a + p.revenue, 0);
    const hasOther = points.some((p) => p.revOther > 0);
    const unpaid = points.reduce((a, p) => a + p.unpaid, 0);
    const avgPoints = points.filter((p) => p.avg != null);
    return `<div class="panel chart-panel">
      <div class="chart-head">
        <h2>매출 추이 <span class="muted-note">${last ? `${who}${esc(last.m)} 매출 ${wonFull(last.revenue)}${inProgress ? ' (진행 중)' : ''}${prev ? ` · 전월 대비 ${wonDiff(last.revenue, prev.revenue)}` : ''}${yearAgo ? ` · 전년 동월 대비 ${wonDiff(last.revenue, yearAgo.revenue)}` : ''}` : ''}</span></h2>
        <div class="chips">${rangeBtn(12, '12개월')}${rangeBtn(24, '24개월')}${rangeBtn('all', '전체')}${refresh}</div>
      </div>
      ${historyLoading ? progressBar() : ''}
      ${stale && scriptSource() ? `<p class="chart-note">${stale}개 장부 탭은 매출 집계 전에 저장된 기록이라 빠져 있습니다. <button class="chip" id="btn-history-rebuild" ${historyLoading ? 'disabled' : ''}>장부 다시 읽기</button> <span class="muted-note">(몇 분 걸릴 수 있습니다)</span></p>` : ''}
      <div class="chips coach-chips"><span class="muted-note">담당강사</span>${coachBtn('', '전체')}${hist.current.map((c) => coachBtn(c, c)).join('')}${hist.coaches.filter((c) => !hist.current.includes(c)).map((c) => coachBtn(c, c + ' (이전)')).join('')}</div>
      ${points.length ? `
      <h3 class="chart-title">${who}월별 매출 <span>등록일자가 그 달인 결제 금액 · 기간 합계 ${wonFull(sum)} · 월평균 ${wonFull(Math.round(sum / points.length))}</span></h3>
      ${stackedBarChart(points, [{ key: 'revNew', label: '신규', color: SERIES_COLORS[0] }, { key: 'revRenew', label: '재등록', color: SERIES_COLORS[1] }].concat(hasOther ? [{ key: 'revOther', label: '기타 (등록분류 없음)', color: '#a39e93' }] : []), '월별 매출', (p) => [['합계', null, wonFull(p.revenue)], ['결제 건수', null, `${p.paid}건`]], { money: true })}
      ${avgPoints.length ? `<h3 class="chart-title">${who}건당 평균 결제액 <span>매출 ÷ 금액이 적힌 결제 건수</span></h3>
      ${lineChart(avgPoints, 'avg', CHART_NEW, '월별 건당 평균 결제액', { money: true })}` : ''}`
      : `<p class="empty">${esc(coach)} 코치의 장부에 이 기간 매출 기록이 없습니다. 기간을 '전체'로 바꿔 보세요.</p>`}
      ${byCoach && byCoach.points.length ? `<h3 class="chart-title">코치별 매출 <span>코치 이름을 누르면 그 코치만 봅니다</span></h3>
      ${multiLineChart(byCoach.points, byCoach.series, '코치별 월별 매출', { money: true })}` : ''}
      ${!coach ? revenueCoachTable(perCoach, hist.latest) : ''}
      <p class="chart-note">코치 장부 ${hist.books}권(${hist.coaches.map(esc).join(' · ')})의 월별 탭에서 <b>등록일자가 그 달인 행의 결제 금액</b>을 더했습니다. 한 달에 두 번 결제하면 두 번 모두 셉니다. 신규·재등록은 등록분류로 나눕니다.${unpaid ? ` 이 기간 등록 ${unpaid}건은 결제 금액이 비어 있어 빠졌습니다.` : ''}${inProgress ? ' 이번 달은 장부가 입력 중이면 적게 보일 수 있습니다.' : ''} ${new Date(hist.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 불러옴.${error}</p>
      ${historyCheckTable()}
      ${points.length ? `<details class="chart-table"><summary>표로 보기</summary>
        <div class="table-wrap"><table><thead><tr><th>월</th><th>매출</th><th>신규</th><th>재등록</th>${hasOther ? '<th>기타</th>' : ''}<th>결제 건수</th><th>건당 평균</th>${unpaid ? '<th>금액 없음</th>' : ''}${byCoach ? byCoach.series.map((s) => `<th>${esc(s.label)}</th>`).join('') : ''}</tr></thead>
        <tbody>${points.slice().reverse().map((p) => {
          const c = byCoach && byCoach.points.find((q) => q.m === p.m);
          return `<tr><td>${esc(p.m)}</td><td>${wonFull(p.revenue)}</td><td>${wonFull(p.revNew)}</td><td>${wonFull(p.revRenew)}</td>${hasOther ? `<td>${wonFull(p.revOther)}</td>` : ''}<td>${p.paid}건</td><td>${p.avg == null ? '—' : wonFull(p.avg)}</td>${unpaid ? `<td>${p.unpaid}건</td>` : ''}${byCoach ? byCoach.series.map((s) => `<td>${c && c[s.key] != null ? wonFull(c[s.key]) : '—'}</td>`).join('') : ''}</tr>`;
        }).join('')}</tbody></table></div>
      </details>` : ''}
    </div>`;
  }

  // Year over year for revenue: one line per year across 1월–12월, following the 담당강사
  // filter of 매출 추이. Flows (매출, 신규, 재등록) compare the year to date; 건당 평균, the latest month.
  const REV_YOY_METRICS = [
    { key: 'revenue', label: '매출', flow: true },
    { key: 'revNew', label: '신규 매출', flow: true },
    { key: 'revRenew', label: '재등록 매출', flow: true },
    { key: 'avg', label: '건당 평균', flow: false },
  ];
  function revenueYoyPanel() {
    const rows = (historyCache && historyCache.months) || [];
    if (!rows.some((r) => r.revenue != null)) return '';
    const coach = state.revCoach && rows.some((r) => r.coach === state.revCoach) ? state.revCoach : '';
    const series = revenueSeries(rows, coach);
    const years = [...new Set(series.map((p) => p.m.slice(0, 4)))].sort().reverse();
    if (years.length < 2) return '';
    const shown = years.slice(0, 3);
    const metric = REV_YOY_METRICS.find((m) => m.key === state.revYoyMetric) || REV_YOY_METRICS[0];
    const at = (y, mo) => { const p = series.find((q) => q.m === `${y}-${String(mo).padStart(2, '0')}`); return p && p[metric.key] != null ? p[metric.key] : null; };
    const points = Array.from({ length: 12 }, (_, i) => { const p = { m: String(i + 1) }; shown.forEach((y) => { p[y] = at(y, i + 1); }); return p; });
    const lines = shown.map((y, i) => ({ key: y, label: `${y}년`, color: SERIES_COLORS[i] }));
    const [cur, prev] = shown;
    let lastMo = 12; while (lastMo > 0 && at(cur, lastMo) == null) lastMo--;
    let head = '';
    if (lastMo) {
      if (metric.flow) {
        const sum = (y) => { let t = 0, any = false; for (let mo = 1; mo <= lastMo; mo++) { const v = at(y, mo); if (v != null) { t += v; any = true; } } return any ? t : null; };
        const a = sum(cur), b = sum(prev);
        head = `${cur}년 1–${lastMo}월 ${metric.label} ${wonFull(a)}${b == null ? '' : ` · 전년 동기 ${wonFull(b)} (${wonDiff(a, b)})`}`;
      } else {
        const a = at(cur, lastMo), b = at(prev, lastMo);
        head = `${lastMo}월 ${metric.label} ${wonFull(a)}${b == null ? '' : ` · 전년 ${lastMo}월 ${wonFull(b)} (${wonDiff(a, b)})`}`;
      }
    }
    const chip = (m) => `<button class="chip ${m.key === metric.key ? 'on' : ''}" data-rev-yoy="${m.key}">${esc(m.label)}</button>`;
    return `<div class="panel chart-panel">
      <div class="chart-head">
        <h2>매출 전년 비교 <span class="muted-note">${coach ? esc(coach) + ' · ' : ''}${head}</span></h2>
        <div class="chips">${REV_YOY_METRICS.map(chip).join('')}</div>
      </div>
      ${multiLineChart(points, lines, `연도별 월별 ${metric.label}`, { tick: (p) => `${p.m}월`, money: true })}
      <p class="chart-note">같은 달끼리 비교합니다. 매출이 집계된 장부만 세므로, 기록이 없는 달은 비어 있습니다.${years.length > 3 ? ` 최근 3년만 표시합니다 (${years.slice(3).join(', ')}년 제외).` : ''} 담당강사 필터는 위 매출 추이에서 바꿉니다.</p>
      <details class="chart-table"><summary>표로 보기</summary>
        <div class="table-wrap"><table><thead><tr><th>월</th>${shown.map((y) => `<th>${y}년</th>`).join('')}<th>전년 대비</th></tr></thead>
        <tbody>${points.map((p) => `<tr><td>${p.m}월</td>${shown.map((y) => `<td>${p[y] == null ? '—' : wonFull(p[y])}</td>`).join('')}<td>${wonDiff(p[cur], p[prev])}</td></tr>`).join('')}</tbody></table></div>
      </details>
    </div>`;
  }

  // ---------- Views ----------
  const state = { view: 'dashboard', q: '', filter: '', trendMonths: 12, trendCoach: '', yoyMetric: 'active', revMonths: 12, revCoach: '', revYoyMetric: 'revenue', tables: {
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
    revenue() {
      return head('Revenue') + revenuePanel() + revenueYoyPanel();
    },
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
      // re-upped shows up as a second row ("김민준1") with sessions left AND a 등록일자. They stay
      // on the list, marked 재등록 with that row's 등록일자 and 등록회수, below the people still to
      // call (owner's request). A numbered row without 등록일자 is not a re-registration, and one
      // dated before the finished registration is an older package, not a re-up.
      // Same person = same name ignoring digits/brackets, unless both rows carry different phones.
      const synced = cs.filter((c) => c.sheetSyncedAt && typeof c.sessionsLeft === 'number');
      const digits = (c) => String(c.phone || '').replace(/\D+/g, '').slice(-9);
      const samePerson = (a, b) => Sheets.personKey(labelOf('customers', a)) === Sheets.personKey(labelOf('customers', b))
        && !(digits(a).length >= 7 && digits(b).length >= 7 && digits(a) !== digits(b));
      const active = synced.filter((c) => c.sessionsLeft > 0 && c.joined);
      // The newest re-registration of the person behind a finished row, or null.
      const reupOf = (c) => active
        .filter((a) => samePerson(a, c) && (!c.joined || a.joined >= c.joined))
        .sort((a, b) => b.joined.localeCompare(a.joined))[0] || null;
      const byCoach = (a, b) => (a.coach || '').localeCompare(b.coach || '', 'ko') || (a.validUntil || '').localeCompare(b.validUntil || '') || labelOf('customers', a).localeCompare(labelOf('customers', b), 'ko');
      const out = synced.filter((c) => c.sessionsLeft <= 0).map((c) => ({ c, reup: reupOf(c) }))
        .sort((x, y) => Number(!!x.reup) - Number(!!y.reup) || byCoach(x.c, y.c));
      const reupped = out.filter((o) => o.reup).length;
      const reupNote = (r) => `<span class="pill ok">재등록 ${fmtDate(r.joined)} · ${typeof r.sessionsTotal === 'number' ? `${r.sessionsTotal}회` : '회수 미기재'}</span>`;
      return head('Dashboard') + `
        <div class="cards">
          ${card(cs.filter((c) => c.status === 'active').length, 'Active members')}
          ${card(cs.filter((c) => isLead(c) && ['new', 'contacted', 'trial-booked'].includes(c.status)).length, 'Open inquiries')}
          ${card(cp.filter((c) => c.status === 'live').length, 'Live campaigns')}
          ${card(callsThisMonth.length, 'Calls this month')}
          ${card(callsThisMonth.length ? Math.round(100 * booked / callsThisMonth.length) + '%' : '—', 'Call → booking rate')}
          ${card(upcoming.length, 'Upcoming events')}
        </div>
        ${trendPanel(cs.filter((c) => !isLead(c) && !isClub(c)))}
        ${yoyPanel()}
        <div class="two-col">
          <div class="panel"><h2>Upcoming events</h2>${upcoming.length ? `<ul>${upcoming.map((e) => `<li><strong>${fmtDate(e.date)}</strong> — ${esc(e.name)} ${pill(e.status)} <span class="pill">${e.registered || 0}/${e.capacity || '∞'}</span></li>`).join('')}</ul>` : '<p class="empty">No upcoming events. Add one under Events.</p>'}</div>
          <div class="panel"><h2>잔여 세션 0 — 재등록 대상 <span class="pill bad">${out.length - reupped}명</span>${reupped ? ` <span class="pill ok">재등록 완료 ${reupped}명</span>` : ''}</h2>${out.length ? `<ul>${out.map(({ c, reup }) => `<li><strong>${esc(labelOf('customers', c))}</strong> — ${esc(c.coach) || '—'} · ${esc(c.segmentLabel || c.segment || '')}${c.validUntil ? ` · 유효기간 ${fmtDate(c.validUntil)}` : ''}${c.phone || c.guardianPhone ? ` · ${esc(c.phone || c.guardianPhone)}` : ''}${reup ? ` ${reupNote(reup)}` : ''}</li>`).join('')}</ul><p style="margin:10px 0 0"><button class="ghost" id="btn-out-customers" style="font-size:12px">Customers 탭에서 필터로 보기</button></p>` : '<p class="empty">잔여 세션이 0인 회원이 없습니다. (Sync 후 갱신됩니다)</p>'}</div>
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

    // The social plan: what goes out, when, and what is holding each piece up.
    // The rules and templates live in marketing/social-media/; this tab is the
    // status, so it travels with the rest of the app data.
    social() {
      const posts = Store.list('posts').slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const t = today();
      const weekOut = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      const live = (p) => p.status !== 'posted' && p.status !== 'dropped';
      const crossPosts = posts.filter((p) => live(p) && (p.wellperion || /wellperion/i.test(p.channel || '')));
      const late = posts.filter((p) => live(p) && p.date && p.date < t);
      const soon = posts.filter((p) => live(p) && p.date >= t && p.date <= weekOut);
      const ready = posts.filter((p) => live(p) && (p.status === 'draft' || p.status === 'scheduled'));
      const postedThisMonth = posts.filter((p) => p.status === 'posted' && (p.date || '').slice(0, 7) === t.slice(0, 7));

      if (!posts.length) {
        return head('Social', '<button class="primary" id="btn-new">+ Post</button>')
          + '<div class="panel"><h2>소셜 플랜</h2>'
          + '<p style="color:var(--muted);margin:0 0 12px">인스타그램 @glass_court와 네이버 블로그 계획을 여기서 관리합니다. 규칙과 템플릿은 <code>marketing/social-media/</code>에 있고, 이 탭은 <strong>무엇이 언제 나가는지, 지금 무엇이 막혀 있는지</strong>를 봅니다.</p>'
          + '<button class="primary" id="btn-seed-social">10–11월 계획 불러오기 · ' + SOCIAL_PLAN.length + '건 (10/1 → 11/28)</button></div>';
      }

      // What is holding posts up, most-blocking first.
      const blockers = new Map();
      for (const p of posts.filter((x) => live(x) && x.blocker)) blockers.set(p.blocker, (blockers.get(p.blocker) || []).concat([p]));
      const blocked = [...blockers.entries()].sort((a, b) => b[1].length - a[1].length);

      // Planned share per pillar against the target mix.
      const plannedTotal = posts.filter(live).length || 1;
      const mix = PILLARS.map((p) => {
        const n = posts.filter((x) => x.pillar === p.k && live(x)).length;
        return Object.assign({}, p, { n, pct: Math.round((n / plannedTotal) * 100) });
      });

      const dday = (d) => {
        if (!d) return '';
        const days = Math.round((new Date(d) - new Date(t)) / 864e5);
        return days === 0 ? '오늘' : days > 0 ? 'D-' + days : -days + '일 지남';
      };
      const mark = (p) => (live(p) && p.date && p.date < t ? ' style="border-left:3px solid var(--bad);padding-left:6px"' : '');
      const sub = (s) => (s ? '<div class="sub">' + esc(s) + '</div>' : '');
      const cols = [
        { h: 'Date', f: (p) => '<strong' + mark(p) + '>' + fmtDate(p.date) + '</strong>' + sub(dday(p.date)) },
        { h: 'Channel', f: (p) => (esc(p.channel) || '—')
          + (p.wellperion && !/wellperion/i.test(p.channel || '') ? '<div class="sub">+ @wellperion_squash</div>' : '')
          + (p.wellperion && !WELLPERION_OK.has(p.pillar) ? '<div class="blocker">미국 스쿼시 · 웰페리온 행사만 교차 게시</div>' : '') },
        { h: 'Pillar', f: (p) => '<span class="pill" style="background:' + pillarOf(p.pillar).color + ';color:#fff">' + esc(pillarOf(p.pillar).label) + '</span>' },
        { h: 'Post', f: (p) => '<strong>' + esc(p.title) + '</strong>' + sub(p.titleEn) + sub(p.notes), wrap: true },
        { h: 'Format', f: (p) => esc(p.format) || '—' },
        { h: 'CTA', f: (p) => esc(p.cta) || '—' },
        { h: '막는 것', f: (p) => (p.blocker && live(p) ? '<span class="blocker">' + esc(p.blocker) + '</span>' : '—') },
        { h: 'Status', f: (p) => pill(p.status) },
      ];

      const card = (n, l) => '<div class="card"><div class="num">' + n + '</div><div class="label">' + l + '</div></div>';
      const blockList = blocked.map(([b, list]) =>
        '<li><strong>' + esc(b) + '</strong> — ' + list.length + '건: '
        + list.map((p) => fmtDate(p.date) + ' ' + esc(p.title.slice(0, 20))).join(' · ') + '</li>').join('');
      const legend = mix.map((p) =>
        '<div><i style="background:' + p.color + '"></i><span><strong>' + esc(p.label) + '</strong> · ' + esc(p.job) + '</span>'
        + '<span class="n">' + p.n + '건 · ' + p.pct + '% <span style="opacity:.6">(목표 ' + p.share + '%)</span></span></div>').join('');
      const bars = mix.map((p) => '<span style="width:' + p.pct + '%;background:' + p.color + '" title="' + esc(p.label) + ' ' + p.pct + '%"></span>').join('');

      const hasPlan = posts.some((p) => (p.date || '') >= '2026-11-01');
      const oldRows = posts.filter((p) => (p.date || '') < '2026-10-01');
      return head('Social',
        (oldRows.length ? '<button class="ghost" id="btn-purge-old">이전 계획 정리 · ' + oldRows.length + '건 삭제</button> ' : '')
        + (hasPlan ? '' : '<button class="ghost" id="btn-seed-social">10–11월 계획 불러오기</button> ')
        + '<button class="primary" id="btn-new">+ Post</button>')
        + '<div class="cards">'
        + card(late.length, '밀린 게시물') + card(soon.length, '이번 주 (7일)') + card(ready.length, '원고 · 예약 완료')
        + card(postedThisMonth.length, t.slice(0, 7) + ' 게시 완료') + card(crossPosts.length, '@wellperion_squash')
        + '</div>'
        + '<p style="color:var(--muted);font-size:12px;margin:-4px 0 14px">@glass_court와 블로그는 모든 내용, <strong>@wellperion_squash는 미국 스쿼시와 웰페리온에서 열리는 행사만</strong>. 교차 게시할 글은 게시물의 체크박스로 표시합니다.</p>'
        + (blocked.length
          ? '<div class="panel" style="margin-bottom:16px"><h2>막고 있는 결정 ' + blocked.length + '가지</h2><ul>' + blockList + '</ul>'
            + '<p style="color:var(--muted);font-size:12px;margin:10px 0 0">각 게시물의 "Blocked by" 칸에서 모은 것입니다. 결정이 나면 그 칸을 비우세요.</p></div>'
          : '')
        + table(cols, posts, (id) => openDialog('posts', Store.get('posts', id)), 'No posts yet.', { tbl: 'social' })
        + '<div class="two-col" style="margin-top:16px">'
        + '<div class="panel"><h2>주간 리듬</h2><div class="rhythm">'
        + '<div><b>화</b><span>릴스 30–60초 — Science of Squash / 기본 전술 · 07:30–08:30 또는 20:30–21:30</span></div>'
        + '<div><b>수</b><span>네이버 블로그 1,000–1,500자 · 07:00 발행</span></div>'
        + '<div><b>목</b><span>스토리 1–2장 — 블로그 링크 아웃</span></div>'
        + '<div><b>금</b><span>카드뉴스 5–7장 — 주니어 / 회원 이야기 / 시설</span></div>'
        + '<div><b>일</b><span>세션 현장 스토리 3–5장 + 저녁 리캡 · 19:00–21:00</span></div>'
        + '<div><b>월</b><span>20분 점검 — 지난주 숫자, 이번 주 촬영 목록, 동의서</span></div>'
        + '</div><p style="color:var(--muted);font-size:12px;margin:12px 0 0">시간이 없는 주의 최소선: 화요일 릴스 + 일요일 세션 스토리. 일요일 세션 커버리지는 거르지 않습니다 — 전환이 일어나는 자리입니다.</p></div>'
        + '<div class="panel"><h2>콘텐츠 믹스 <span class="muted-note">남은 ' + plannedTotal + '건 기준</span></h2>'
        + '<div class="mix">' + bars + '</div><div class="mix-legend">' + legend + '</div></div>'
        + '</div>'
        + '<div class="two-col" style="margin-top:16px">'
        + '<div class="panel"><h2>캡션 패턴</h2><pre class="caption-pattern">{한국어 헤드라인 — 인사이트, 25자 이하}\n\n{한국어 본문 3–6줄: 주장 → 근거 → 코트에서 할 것}\n\n{부드러운 CTA — 신청 / 저장 / 블로그 / 문의}\n\n—\n{영어 2–3문장 — 번역이 아니라 원문처럼}\n\nGlass Court Squash Academy at Wellperion · Coach 이상훈\n\n{해시태그 10–15개: 코어 + 필러 1세트}</pre>'
        + '<p style="color:var(--muted);font-size:12px;margin:10px 0 0">한국어 먼저. 인사이트는 하나만. 숫자는 집계만 (미성년자 실명 금지). 가격은 쓰지 않습니다 — 가격은 웰페리온 데스크의 일입니다.</p></div>'
        + '<div class="panel"><h2>해시태그</h2>'
        + '<p style="margin:0 0 6px"><strong>코어 (매 게시물)</strong><br><span style="color:var(--muted);font-size:12.5px">#GlassCourt #GCSquash #GlassCourtSquashAcademy #웰페리온 #웰페리온스쿼시 #스쿼시 #squash #한남동스쿼시 #squashseoul #squashkorea</span></p>'
        + '<p style="margin:10px 0 6px"><strong>필러 1세트만 추가</strong><br><span style="color:var(--muted);font-size:12.5px">Science → #ScienceOfSquash #스쿼시훈련 · 기본 전술 → #기본스쿼시전술 #squashtactics · 주니어 → #주니어스쿼시 #collegesquash · 세션 → #GlassCourtTrainingSessions #스쿼시대회</span></p>'
        + '<p style="margin:10px 0 0;color:var(--bad);font-size:12.5px"><strong>절대 쓰지 않음</strong> — #헬스 #다이어트 #할인 #이벤트특가 #맞팔 #선팔</p>'
        + '<p style="color:var(--muted);font-size:12px;margin:12px 0 0">전체 규칙: <code>platform-playbook.md</code> · 캡션 8종: <code>post-templates.md</code> · 제작: <code>instagram-reel-template.md</code>, <code>instagram-card-news-template.md</code></p></div>'
        + '</div>'
        + socialMetricsHtml();
    },
  };

  // Two pieces a week — what fits around full-time coaching. The first three weeks
  // spend what is already made (the drop-shot post, US junior Parts 1 and 2, the seven rendered
  // How We Decide cards), so the work is filming and rendering, not writing. One
  // shoot feeds that week's Reel and that week's blog post. No events in October —
  // Training Sessions and the Tournament Series were cancelled; 웰림픽 스쿼시컵 runs
  // in November, so its announcement sits in late October.
  const SOCIAL_PLAN = [
    { date: '2026-10-01', channel: 'Instagram @glass_court', pillar: 'science', status: 'idea', wellperion: false, title: '릴스 #1 — 주제 미정', titleEn: 'Reel #1 — topic to be decided', format: '릴스 30–45초', cta: '전체 글 → 블로그', blocker: '릴스 주제', notes: '아시안게임 주간 직후 첫 게시물 — 새 팔로워를 레슨으로 넘기는 자리. 후보: 프로 vs 동호인 비교 · 3초 진단 · AG 패턴 재현 · 코치 랠리 · 장비 팁. 드롭샷 클립 2개는 주제와 상관없이 10/2 블로그에 필요' },
    { date: '2026-10-02', channel: 'Naver blog', pillar: 'science', status: 'draft', wellperion: false, title: '드롭샷은 손목이 아니라 발이 먼저입니다', titleEn: 'Drop shots start with the feet, not the wrist', format: '1,200자 + 클립 2 + 다이어그램', cta: '레슨 상담 → 데스크', blocker: '드롭샷 클립 2개', notes: '본문·다이어그램 완성 (blog/2026-09-16-drop-shot-feet-first.md). 클립만 붙이면 발행' },
    { date: '2026-10-06', channel: 'Instagram @glass_court', pillar: 'junior', status: 'idea', wellperion: true, title: '미국 주니어 스쿼시, 랭킹은 이렇게 매겨집니다', titleEn: 'How US junior squash rankings actually work', format: '카드뉴스 6장 — cards/us-junior-part1-01~06.png (렌더 완료)', cta: '보딩스쿨·대학 진학 1:1 상담', blocker: '', notes: '웰페리온 계정에도 (미국 스쿼시). 카드·캡션 모두 준비됨 — 올리기만 하면 됩니다 (us-junior-instagram.md)' },
    { date: '2026-10-07', channel: 'Naver blog', pillar: 'junior', status: 'draft', wellperion: false, title: '미국 주니어 스쿼시 Part 1 — 랭킹과 대회 출전', titleEn: 'US junior squash, Part 1: rankings', format: '긴 글 + 카드 3장', cta: '보딩스쿨·대학 진학 1:1 상담', blocker: '', notes: '본문 완성 · 사실 확인 완료. 카드가 늦으면 글만 먼저 발행 가능' },
    { date: '2026-10-13', channel: 'Instagram @glass_court', pillar: 'junior', status: 'idea', wellperion: true, title: '랭킹보다 레이팅 — 미국 대학 코치가 보는 숫자', titleEn: 'Coaches read the rating, not the ranking', format: '카드뉴스 6장 — cards/us-junior-part2-01~06.png (렌더 완료)', cta: '진학 상담', blocker: '', notes: '웰페리온 계정에도 (미국 스쿼시). 카드·캡션 모두 준비됨 (us-junior-instagram.md)' },
    { date: '2026-10-14', channel: 'Naver blog', pillar: 'junior', status: 'draft', wellperion: false, title: '미국 주니어 스쿼시 Part 2 — 레이팅', titleEn: 'US junior squash, Part 2: ratings', format: '긴 글 + 캐러셀', cta: '진학 1:1 상담', blocker: '', notes: '사실 확인 완료 — 보딩스쿨 문단만 추가하면 발행' },
    { date: '2026-10-20', channel: 'Instagram @glass_court', pillar: 'tactics', status: 'idea', wellperion: false, title: '릴스 #2 — 주제 미정', titleEn: 'Reel #2 — topic to be decided', format: '릴스 30–45초', cta: '저장 → 다음 연습에서 확인', blocker: '릴스 주제', notes: '릴스 #1과 같은 시리즈로 이어갈지, 다른 포맷으로 갈지는 #1 반응을 보고 결정' },
    { date: '2026-10-21', channel: 'Naver blog', pillar: 'science', status: 'idea', wellperion: false, title: '부상 없이 오래 치는 법: 웜업에 15분을 쓰는 이유', titleEn: 'Why we spend 15 minutes on the warm-up', format: '긴 글 + 웜업 5동작 (사진 각 1장)', cta: '성인 프라이빗 레슨 상담', blocker: '', notes: '웜업 5동작 사진은 레슨 날 한 번에' },
    { date: '2026-10-24', channel: 'Instagram @wellperion_squash', pillar: 'event', status: 'idea', wellperion: true, title: '웰림픽 스쿼시컵 — 11월 8일 (일)', titleEn: 'Wellympic Squash Cup — Sunday 8 November', format: '카드뉴스 4장 (날짜 · 대상 · 방식 · 신청)', cta: '참가 신청 → 데스크 / 프로필 링크', blocker: '참가 방식 · 신청 마감일', notes: '양 계정 (웰페리온에서 열리는 행사). 날짜 확정 2026-09-25. 히어로 숫자는 11.8' },
    { date: '2026-10-27', channel: 'Instagram @glass_court', pillar: 'science', status: 'idea', wellperion: false, title: '뇌는 공보다 먼저 움직인다 — 의사결정 속도', titleEn: 'The brain moves before the ball', format: '카드뉴스 7장 — 이미 렌더된 How We Decide 카드', cta: '전체 시리즈 → 블로그', blocker: '', notes: 'blog/cards/how-we-decide-01~07.png 그대로 사용. 제작 시간 0' },
    { date: '2026-10-28', channel: 'Naver blog', pillar: 'science', status: 'idea', wellperion: false, title: '《How We Decide》 총정리 — 코트 위의 의사결정', titleEn: 'How We Decide: the court version', format: '긴 글 (시리즈 5부)', cta: '레슨 상담', blocker: 'Part 3 링크', notes: '초안 있음 (blog/how-we-decide-part5-summary.md)' },
    { date: '2026-10-31', channel: 'Instagram @glass_court', pillar: 'member', status: 'idea', wellperion: false, title: '10월의 코트: 한 달의 순간들', titleEn: 'October on court', format: '카드뉴스 6장', cta: '체험 문의', blocker: '', notes: '10월 촬영본 정리. 주니어 얼굴은 서면 동의된 경우만' },

    // November — 웰림픽 스쿼시컵 (2026-11-08, 일). Three weeks of build-up, the day
    // itself, and two weeks of reusing what the day produced.
    { date: '2026-11-03', channel: 'Instagram @glass_court', pillar: 'event', status: 'idea', wellperion: true, title: '웰림픽 D-5 — 대회 주간에 하면 좋은 준비', titleEn: 'Five days out: how to arrive ready', format: '릴스 45초', cta: '참가 신청 마감 임박 → 데스크', blocker: '참가 방식 · 신청 마감일', notes: '대회 전 주 훈련·워밍업·컨디션. 참가자에게도 유용하고 비참가자에게는 대회 존재를 알림' },
    { date: '2026-11-04', channel: 'Naver blog', pillar: 'event', status: 'idea', wellperion: false, title: '웰림픽 스쿼시컵 안내 — 부문 · 규정 · 타임테이블', titleEn: 'Wellympic Squash Cup: format, rules, schedule', format: '안내 글 + 대진 방식 그림', cta: '참가 신청 → 데스크', blocker: '부문 · 정원 · 타임테이블', notes: '검색으로 들어오는 사람을 위한 공식 안내. 대회 당일까지 계속 갱신' },
    { date: '2026-11-08', channel: 'Instagram @wellperion_squash', pillar: 'event', status: 'idea', wellperion: true, title: '웰림픽 스쿼시컵 현장', titleEn: 'Wellympic Squash Cup, live', format: '스토리 5장 (라이브) + 저녁 리캡 1건', cta: '다음 대회 알림 받기', blocker: '', notes: '대회 당일. 스토리는 경기 중, 리캡은 당일 저녁 19–21시. 촬영 담당을 미리 정해 둘 것' },
    { date: '2026-11-10', channel: 'Instagram @glass_court', pillar: 'event', status: 'idea', wellperion: true, title: '웰림픽 스쿼시컵 결과', titleEn: 'Wellympic Squash Cup results', format: '카드뉴스 5장 (부문별 결과 · 이니셜)', cta: '다음 대회 사전 등록', blocker: '대회 결과', notes: '미성년자는 이니셜만. instagram-card-news-template.md Example B 구조' },
    { date: '2026-11-11', channel: 'Naver blog', pillar: 'science', status: 'idea', wellperion: false, title: '웰림픽 리뷰 — 결승에서 반복된 세 장면', titleEn: 'Three patterns that decided the final', format: '긴 글 + 사진 · 클립', cta: '레슨 상담', blocker: '대회 결과', notes: '대회를 Science of Squash 소재로 재사용. 이름 대신 장면으로 설명' },
    { date: '2026-11-17', channel: 'Instagram @glass_court', pillar: 'tactics', status: 'idea', wellperion: false, title: '대회에서 가장 많이 나온 실수', titleEn: 'The mistake we saw most at the tournament', format: '릴스 45초', cta: '저장 → 다음 연습에서', blocker: '', notes: '11/8 촬영본 재사용. 대회 참가자들이 자기 경기를 떠올리게 되는 자리' },
    { date: '2026-11-18', channel: 'Naver blog', pillar: 'tactics', status: 'idea', wellperion: false, title: '대회가 끝나고: 다음 대회까지 4주 훈련 계획', titleEn: 'Four weeks to the next tournament', format: '긴 글 + 주차별 표', cta: '성인 프라이빗 레슨 상담', blocker: '', notes: '대회 직후 동기가 가장 높은 시점의 전환 글' },
    { date: '2026-11-24', channel: 'Instagram @glass_court', pillar: 'member', status: 'idea', wellperion: false, title: '첫 대회에 나간 회원 이야기', titleEn: 'A member\'s first tournament', format: '단일 사진 + 3줄 인용', cta: '댓글 · 체험 문의', blocker: '서면 동의', notes: '웰림픽 참가자 중 한 명. 이니셜 또는 성만' },
    { date: '2026-11-25', channel: 'Naver blog', pillar: 'junior', status: 'idea', wellperion: false, title: '겨울 시즌 주니어 대회 캘린더와 준비법', titleEn: 'The winter junior calendar', format: '긴 글 + 일정 표', cta: '주니어 상담 → 데스크', blocker: '겨울 대회 일정', notes: '국내 겨울 대회 + 미국 시즌을 함께 보는 글이면 웰페리온 계정에도 교차 가능' },
    { date: '2026-11-28', channel: 'Instagram @glass_court', pillar: 'member', status: 'idea', wellperion: false, title: '11월의 코트: 웰림픽이 남긴 것', titleEn: 'November on court', format: '카드뉴스 6장', cta: '체험 문의', blocker: '', notes: '대회 사진 중심. 동의된 얼굴만' },
  ];

  /** Load the plan: drop anything left over from before October, add what is missing. */
  // The one event the plan hangs on. Only the date is settled (owner, 2026-09-25);
  // 부문 · 정원 · 신청 방식 are still open, so the record carries the date and says so.
  const WELLYMPIC = {
    name: '웰림픽 스쿼시컵',
    type: 'tournament',
    status: 'planned',
    date: '2026-11-08',
    venue: '웰페리온 스포츠센터 스쿼시코트 (한남동)',
    owner: '이상훈',
    notes: '일정만 확정 (2026-09-25). 미정: 부문 · 정원 · 신청 방식 · 신청 마감일 · 타임테이블.\n소셜: 10/24 예고 → 11/3 D-5 → 11/8 현장 → 11/10 결과 (Social 탭).',
  };

  /** Rows from a calendar that is over: removed on request, whatever their status. */
  function purgeOldPosts() {
    const old = Store.list('posts').filter((p) => (p.date || '') < '2026-10-01');
    if (!old.length) return;
    const posted = old.filter((p) => p.status === 'posted').length;
    const msg = `10월 이전 게시물 ${old.length}건을 삭제합니다.`
      + (posted ? `\n(게시 완료로 표시된 ${posted}건도 함께 삭제됩니다.)` : '')
      + '\n계속할까요?';
    if (!confirm(msg)) return;
    Store.batch(() => { for (const p of old) Store.remove('posts', p.id); });
    render();
  }

  function seedSocialPlan() {
    const have = new Set(Store.list('posts').map((p) => p.date + '|' + p.title));
    let added = 0, closed = 0;
    Store.batch(() => {
      // Anything before October that never went out is removed, not archived:
      // the tab is the current plan, and a list of things that did not happen is noise.
      for (const p of Store.list('posts')) {
        if (p.date < '2026-10-01' && p.status !== 'posted') { Store.remove('posts', p.id); closed++; }
      }
      for (const p of SOCIAL_PLAN) {
        if (have.has(p.date + '|' + p.title)) continue;
        Store.upsert('posts', Object.assign({}, p));
        added++;
      }
      // The tournament itself goes on the Events tab, date only.
      const known = Store.list('events').find((e) => e.name === WELLYMPIC.name && e.date === WELLYMPIC.date);
      if (!known) Store.upsert('events', Object.assign({}, WELLYMPIC));
    });
    render();
    if (closed) alert(`10–11월 계획 ${added}건을 불러왔습니다.\n10월 이전의 미발행 항목 ${closed}건은 삭제했습니다 (게시된 것은 그대로 둡니다).`);
  }


  // ---------- Social: numbers that fill themselves in ----------
  // Naver has no API for blog visitors (the old unofficial endpoint answers 204 since
  // 2026), so those are typed in monthly. Everything else comes from apps-script/Social.gs:
  // the blog's RSS says which posts are really published, the Naver search API says where
  // they rank, and Instagram insights (professional account only) give reach and saves.
  const scriptSource = () => (Store.settings().sheet.sources || []).find((x) => /script\.google\.com/.test(x.url || ''));
  async function socialCall(action, params) {
    const src = scriptSource();
    if (!src) throw new Error('Google Sheet 소스가 없습니다 (Members → Google Sheet).');
    const u = new URL(src.url);
    u.search = '';
    u.searchParams.set('action', action);
    u.searchParams.set('token', tokenFor(src.url, src.token));
    for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
    const res = await fetch(u.toString(), { redirect: 'follow' });
    const j = await res.json();
    if (j.ok === false) throw new Error(j.error || 'unknown error');
    return j;
  }

  /** Mark blog rows posted when the post actually shows up in the blog's RSS feed. */
  async function checkBlogPosts(btn) {
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = '블로그 확인 중…';
    try {
      const feed = await socialCall('blog-rss');
      const items = feed.items || [];
      const norm = (s) => String(s || '').replace(/[\s·—–\-:,.!?()[\]"']/g, '').toLowerCase();
      const matched = [];
      Store.batch(() => {
        for (const p of Store.list('posts')) {
          if (p.channel !== 'Naver blog' || p.status === 'posted' || p.status === 'dropped') continue;
          const key = norm(p.title).slice(0, 12);
          const hit = items.find((it) => key && norm(it.title).includes(key))
            || items.find((it) => it.date === p.date);
          if (!hit) continue;
          Store.upsert('posts', Object.assign({}, p, { status: 'posted', postedAt: hit.date, url: hit.link }));
          matched.push(`${hit.date} ${p.title}`);
        }
      });
      state.blogFeed = { at: new Date().toISOString(), count: items.length, newest: items[0] ? items[0].date : '' };
      render();
      alert(matched.length
        ? `블로그 ${feed.blog}: 발행 확인 ${matched.length}건\n\n` + matched.join('\n')
        : `블로그 ${feed.blog}: RSS ${items.length}건, 새로 발행된 계획 글은 없습니다.` + (items[0] ? `\n가장 최근 글: ${items[0].date} ${items[0].title}` : ''));
    } catch (err) {
      alert('블로그 발행 확인 실패: ' + err.message + '\n\napps-script/Social.gs를 배포하고 Script property BLOG_ID를 설정했는지 확인하세요.');
    }
    btn.disabled = false; btn.textContent = label;
  }

  /** Instagram numbers + keyword ranks, as collected by the Apps Script triggers. */
  async function loadSocialStats(btn) {
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = '불러오는 중…';
    try {
      state.socialStats = await socialCall('social-stats');
      state.socialStats.at = new Date().toISOString();
      render();
    } catch (err) {
      alert('지표를 불러오지 못했습니다: ' + err.message + '\n\n아직 설정 전이라면 apps-script/README.md → "노출 지표"를 보세요.');
      btn.disabled = false; btn.textContent = label;
    }
  }

  /** The bottom half of the Social tab: what the numbers say, and the monthly log. */
  function socialMetricsHtml() {
    const s = state.socialStats;
    const stats = (s && s.stats) || [];
    const media = (s && s.media) || [];
    const ranks = (s && s.ranks) || [];
    const last = stats[stats.length - 1];
    const num = (v) => (v === '' || v == null ? '—' : Number(v).toLocaleString('ko-KR'));

    // Keyword ranks: the newest check per keyword.
    const latestRank = new Map();
    for (const r of ranks) latestRank.set(r['키워드'], r);
    const rankRows = [...latestRank.values()].sort((a, b) => (Number(a['순위']) || 99) - (Number(b['순위']) || 99));

    const kpis = Store.list('kpi').slice().sort((a, b) => (b.month || '').localeCompare(a.month || ''));
    const kpiCols = [
      { h: '월', f: (r) => `<strong>${esc(r.month)}</strong>` },
      { h: '팔로워', f: (r) => num(r.igFollowers) },
      { h: '도달 30일', f: (r) => num(r.igReach) },
      { h: '저장', f: (r) => num(r.igSaves) },
      { h: '프로필 조회', f: (r) => num(r.igProfile) },
      { h: 'DM · 문의', f: (r) => num(r.igDms) },
      { h: '블로그 방문', f: (r) => num(r.blogVisits) },
      { h: '예약', f: (r) => num(r.bookings) },
      { h: 'Notes', f: (r) => esc(r.notes || ''), wrap: true },
    ];

    const noRow = () => {}; // these tables are read-only
    const mediaRows = media.slice(0, 8).map((m, i) => Object.assign({ id: 'm' + i }, m));
    const mediaCols = [
      { h: '게시일', f: (m) => esc(m['게시일']) },
      { h: '형식', f: (m) => esc(m['형식']) },
      { h: '첫 줄', f: (m) => `<a href="${esc(m['링크'])}" target="_blank" rel="noopener">${esc(m['첫 줄'])}</a>`, wrap: true },
      { h: '도달', f: (m) => num(m['reach']) },
      { h: '저장', f: (m) => num(m['saved']) },
      { h: '공유', f: (m) => num(m['shares']) },
      { h: '좋아요', f: (m) => num(m['likes']) },
    ];
    const rankCols = [
      { h: '키워드', f: (r) => `<strong>${esc(r['키워드'])}</strong>` },
      { h: '순위', f: (r) => (Number(r['순위']) ? `<span class="pill ${Number(r['순위']) <= 10 ? 'ok' : 'warn'}">${esc(r['순위'])}위</span>` : '<span class="pill">30위 밖</span>') },
      { h: '확인일', f: (r) => esc(r['날짜']) },
      { h: '전체 검색결과', f: (r) => num(r['전체 검색결과']) },
      { h: '링크', f: (r) => (r['링크'] ? `<a href="${esc(r['링크'])}" target="_blank" rel="noopener">글 보기</a>` : '—') },
    ];

    let metrics = '';
    if (!s) {
      metrics = '<p style="color:var(--muted);margin:0">인스타그램 도달 · 저장과 네이버 검색 노출 순위는 Apps Script가 모아 둡니다. '
        + '설정 전이라면 <code>apps-script/README.md</code> → “노출 지표”를 보세요. 인스타그램은 <strong>프로페셔널(비즈니스/크리에이터) 계정</strong>이어야 인사이트가 존재합니다.</p>';
    } else if (!last && !rankRows.length) {
      metrics = '<p style="color:var(--muted);margin:0">시트에 아직 기록이 없습니다. Apps Script에서 <code>socialStatus()</code>로 설정 상태를 확인하고, <code>installSocialTriggers()</code>로 수집을 켜세요.</p>';
    } else {
      const card = (n, l) => '<div class="card"><div class="num">' + n + '</div><div class="label">' + l + '</div></div>';
      metrics = (last
        ? '<div class="cards" style="margin-bottom:12px">'
          + card(num(last['팔로워']), '팔로워 · ' + esc(last['계정'] || ''))
          + card(num(last['reach']), '도달 (' + esc(last['날짜']) + ')')
          + card(num(last['views']), '조회')
          + card(num(last['profile_views']), '프로필 조회')
          + '</div>'
        : '')
        + (mediaRows.length
          ? '<h3 style="font-size:13px;margin:12px 0 6px;color:var(--muted)">최근 게시물</h3>'
            + table(mediaCols, mediaRows, noRow, '아직 없습니다.', { tbl: 'igmedia' })
          : '')
        + (rankRows.length
          ? '<h3 style="font-size:13px;margin:16px 0 6px;color:var(--muted)">네이버 검색 노출 (키워드별 최신)</h3>'
            + table(rankCols, rankRows.map((r, i) => Object.assign({ id: 'r' + i }, r)), noRow, '아직 없습니다.', { tbl: 'igrank' })
          : '');
    }

    return '<div class="two-col" style="margin-top:16px">'
      + '<div class="panel"><div class="panel-head" style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">'
      + '<h2 style="margin:0">노출 지표</h2>'
      + '<span style="display:flex;gap:6px"><button class="ghost" id="btn-blog-check">블로그 발행 확인</button>'
      + '<button class="ghost" id="btn-social-stats">' + (s ? '새로고침' : '지표 불러오기') + '</button></span></div>'
      + (state.blogFeed ? `<p style="color:var(--muted);font-size:12px;margin:0 0 10px">블로그 RSS ${state.blogFeed.count}건 · 최근 글 ${esc(state.blogFeed.newest)}</p>` : '<div style="height:6px"></div>')
      + metrics + '</div>'
      + '<div class="panel"><div class="panel-head" style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">'
      + '<h2 style="margin:0">월간 지표</h2><button class="primary" id="btn-new-kpi">+ 이번 달</button></div>'
      + table(kpiCols, kpis, (id) => openDialog('kpi', Store.get('kpi', id)), '아직 기록이 없습니다. 월 첫 월요일에 인스타 인사이트 · 블로그 통계 · 앱 예약 수를 한 줄로 남기세요.', { tbl: 'kpi' })
      + '<p style="color:var(--muted);font-size:12px;margin:10px 0 0">첫 4주 목표: 팔로워 +60 · 저장 40 이상 · DM 10건 이상 · 인스타/블로그發 예약 4건 이상 (기준 2026-09-12: 팔로워 884, 블로그 누적 13,000+ 방문).</p>'
      + '</div></div>';
  }

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
    if (newBtn) newBtn.onclick = () => openDialog({ customers: 'customers', campaigns: 'campaigns', events: 'events', social: 'posts' }[state.view]);
    const seedBtn = $('#btn-seed-social');
    if (seedBtn) seedBtn.onclick = () => seedSocialPlan();
    const purgeBtn = $('#btn-purge-old');
    if (purgeBtn) purgeBtn.onclick = () => purgeOldPosts();
    const kpiBtn = $('#btn-new-kpi');
    if (kpiBtn) kpiBtn.onclick = () => openDialog('kpi', Store.list('kpi').find((r) => r.month === today().slice(0, 7)));
    const blogBtn = $('#btn-blog-check');
    if (blogBtn) blogBtn.onclick = () => checkBlogPosts(blogBtn);
    const statsBtn = $('#btn-social-stats');
    if (statsBtn) statsBtn.onclick = () => loadSocialStats(statsBtn);
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
    viewEl.querySelectorAll('[data-trend]').forEach((el) => {
      el.onclick = () => { state.trendMonths = el.dataset.trend === 'all' ? 'all' : +el.dataset.trend; render(); };
    });
    viewEl.querySelectorAll('[data-yoy]').forEach((el) => {
      el.onclick = () => { state.yoyMetric = el.dataset.yoy; render(); };
    });
    viewEl.querySelectorAll('[data-rev-range]').forEach((el) => {
      el.onclick = () => { const v = el.dataset.revRange; state.revMonths = v === 'all' ? 'all' : Number(v); render(); };
    });
    viewEl.querySelectorAll('[data-rev-coach]').forEach((el) => {
      el.onclick = () => { state.revCoach = el.dataset.revCoach; render(); };
    });
    viewEl.querySelectorAll('[data-rev-yoy]').forEach((el) => {
      el.onclick = () => { state.revYoyMetric = el.dataset.revYoy; render(); };
    });
    viewEl.querySelectorAll('[data-trend-coach]').forEach((el) => {
      el.onclick = () => { state.trendCoach = el.dataset.trendCoach; render(); };
    });
    viewEl.querySelectorAll('figure.chart').forEach(wireChart);
    const historyBtn = $('#btn-history');
    if (historyBtn) historyBtn.onclick = () => rebuildMemberHistory(); // re-counts this month's tabs too, not just the cached table
    const rebuildBtn = $('#btn-history-rebuild');
    if (rebuildBtn) rebuildBtn.onclick = () => rebuildMemberHistory();
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
      // Re-guess when the saved mapping cannot identify a person; Sync refuses such a source.
      if (hasIdentity(src.mapping)) continue;
      try {
        const { headers } = Sheets.toTable(await Sheets.fetchCSV(src.url, tokenFor(src.url, src.token)));
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
