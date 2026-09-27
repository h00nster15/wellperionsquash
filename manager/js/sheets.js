// Google Sheets (read-only) source for Customers.
// Supports two URL kinds:
//   1. A normal sheet URL (must be shared "Anyone with the link → Viewer");
//      read via the gviz CSV endpoint.
//   2. An Apps Script web-app URL (…/exec) from apps-script/Code.gs, which
//      returns CSV and keeps the sheet private; optional ?token=.
const Sheets = (() => {
  // App field -> header keywords used to guess the column mapping.
  const FIELDS = [
    { k: 'fullName', label: 'Full name (single column)', hints: ['name', 'customer', 'client', 'full name', '이름', '성명', '고객', '회원명'] },
    { k: 'firstName', label: 'First name', hints: ['first', 'given', 'forename'] },
    { k: 'lastName', label: 'Last name', hints: ['last', 'surname', 'family'] },
    { k: 'email', label: 'Email', hints: ['email', 'e-mail', 'mail', '이메일'] },
    { k: 'phone', label: 'Phone', hints: ['phone', 'mobile', 'tel', 'cell', 'number', '전화', '연락처', '휴대'] },
    { k: 'segment', label: 'Segment', hints: ['segment', 'type', 'category', 'group', '구분', '유형'] },
    { k: 'status', label: 'Status', hints: ['status', 'stage', 'state', '상태'] },
    { k: 'source', label: 'Source', hints: ['source', 'channel', 'referr', 'how', '경로', '유입'] },
    { k: 'joined', label: 'Joined / registered', hints: ['join', 'start', 'signed', 'registered', 'first contact', 'date', '가입', '등록일', '등록'] },
    { k: 'validUntil', label: 'Valid until / expiry', hints: ['유효기간', '종료일', '만료', 'valid', 'expir', 'end date', 'until'] },
    { k: 'sessionsTotal', label: 'Sessions registered', hints: ['등록회수', '등록 회수', 'sessions registered', 'sessions total', 'total sessions', 'sessions'] },
    { k: 'sessionsCarried', label: 'Sessions at month start (총 잔여세션)', hints: ['총 잔여세션', '총잔여', '총 잔여', 'carried'] },
    { k: 'sessionsThisMonth', label: 'Sessions done this month (당월 진행)', hints: ['당월 강습 진행 세션', '당월 진행', '당월', '진행 세션', 'this month'] },
    { k: 'sessionsLeft', label: 'Sessions remaining (잔여 세션)', hints: ['잔여 세션', '잔여세션', '잔여', 'remaining', 'left'] },
    { k: 'payment', label: 'Payment amount', hints: ['결제 금액', '결제금액', '결제', 'payment', 'amount', 'paid', 'price'] },
    { k: 'registration', label: 'Registration type (new / renewal)', hints: ['등록분류', '등록 분류', '신규', 'registration type', 'renewal'] },
    { k: 'lastContact', label: 'Last contact', hints: ['last contact', 'contacted', 'last call', '최근'] },
    { k: 'nextFollowUp', label: 'Next follow-up', hints: ['follow', 'next', 'callback', '예정'] },
    { k: 'consentMarketing', label: 'Marketing consent', hints: ['마케팅 수신동의', '마케팅', 'marketing consent', 'newsletter', 'opt in', 'opt-in', '수신동의'] },
    { k: 'consentCalls', label: 'Call consent', hints: ['통화 수신동의', '통화', 'call consent', 'may call', 'calls ok'] },
    { k: 'consentSms', label: 'SMS consent (문자 수신동의)', hints: ['문자 수신동의', '문자', 'sms', 'text consent'] },
    { k: 'guardianName', label: 'Guardian name (보호자명)', hints: ['보호자명', '보호자 이름', 'guardian', 'parent name'] },
    { k: 'guardianPhone', label: 'Guardian phone (보호자 연락처)', hints: ['보호자 연락처', '보호자 전화', 'guardian phone', 'parent phone'] },
    { k: 'coach', label: 'Coach (담당강사)', hints: ['담당강사', '담당 강사', '강사', 'coach', '담당'] },
    { k: 'inqDate', label: '문의 접수일', hints: ['접수일', 'inquiry date', 'inquired'] },
    { k: 'inqProgram', label: '문의 프로그램', hints: ['프로그램', 'program'] },
    { k: 'inqWish', label: '희망 요일/시간', hints: ['희망 요일', '희망', 'preferred'] },
    { k: 'inqMessage', label: '문의 내용', hints: ['문의 내용', 'message', 'inquiry'] },
    { k: 'inqLog', label: '연락 기록', hints: ['연락 기록', 'contact log', 'call log'] },
    { k: 'inqMemo', label: '문의 메모', hints: ['메모'] },
    { k: 'memberFlag', label: '회원여부', hints: ['회원여부', 'membership'] },
    { k: 'inqAge', label: '연령대', hints: ['연령대', 'age band', 'age group'] },
    { k: 'inqRegion', label: '지역', hints: ['지역', 'district', 'area'] },
    { k: 'inqAgeText', label: '나이/생년', hints: ['나이/생년', '나이', '생년', 'birth year'] },
    { k: 'inqFirstContact', label: '최초 연락일', hints: ['최초 연락일', '최초 연락', 'first contact date'] },
    { k: 'inqHistory', label: '이전 문의 내역', hints: ['이전 문의 내역', 'previous inquiries', 'history'] },
    // 웰페리온 회원 DB (club membership database)
    { k: 'memberNo', label: '회원번호', hints: ['회원번호', 'member no', 'member id'] },
    { k: 'clubType', label: '회원 구분 (클럽)', hints: ['회원 구분'] },
    { k: 'clubAge', label: '나이', hints: ['나이', 'age'] },
    { k: 'clubPlan', label: '수강반종목명 (회원권)', hints: ['수강반종목명', '회원권', 'plan'] },
    { k: 'clubReg', label: '등록 분류 (클럽)', hints: ['등록 분류'] },
    { k: 'clubStart', label: '시작 일자', hints: ['시작 일자', 'start date'] },
    { k: 'clubEnd', label: '종료 일자', hints: ['종료 일자', 'end date'] },
    { k: 'clubDaysLeft', label: '잔여일', hints: ['잔여일', 'days left'] },
    { k: 'clubStaff', label: '담당자 (클럽)', hints: ['담당자'] },
    { k: 'squashCoach', label: '스쿼시 담당자', hints: ['스쿼시 담당자', 'squash coach'] },
    { k: 'squashContact', label: '스쿼시 Contact', hints: ['스쿼시 contact', '스쿼시 연락'] },
    { k: 'clubNote', label: '비고 (운영부)', hints: ['비고(운영부', '비고 (운영부', 'ops note'] },
    { k: 'clubRenewalNote', label: '재등록상담 내용', hints: ['재등록상담 내용', 'renewal note'] },
    { k: 'clubRenewalDate', label: '재등록상담 날짜', hints: ['재등록상담 날짜', 'renewal date'] },
    { k: 'clubEndReason', label: '종료사유', hints: ['종료사유', 'end reason'] },
    { k: 'notes', label: 'Notes', hints: ['note', 'comment', 'remark', 'memo', '비고', '특이사항'] },
  ];

  const SEGMENTS = ['lead', 'member', 'lapsed', 'junior', 'corporate', 'sponsor'];
  const STATUSES = ['new', 'contacted', 'trial-booked', 'active', 'at-risk', 'lapsed', 'opted-out'];

  // ---- URL handling ----
  function toFetchUrl(url, token) {
    url = (url || '').trim();
    const m = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (m) {
      const gid = (url.match(/[?#&]gid=(\d+)/) || [])[1] || '0';
      return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }
    if (/script\.google\.com\/macros\//.test(url)) {
      const u = new URL(url);
      if (token) u.searchParams.set('token', token);
      return u.toString();
    }
    return url; // any other URL returning CSV
  }

  async function fetchCSV(url, token) {
    const target = toFetchUrl(url, token);
    if (!target) throw new Error('No sheet URL configured.');
    let res;
    try { res = await fetch(target, { redirect: 'follow', cache: 'no-store' }); }
    catch (e) { throw new Error('Could not reach Google. If the sheet is private, share it (Anyone with the link → Viewer) or use the Apps Script URL. Details: ' + e.message); }
    const text = await res.text();
    if (!res.ok || /^\s*</.test(text)) {
      throw new Error(res.status === 401 || res.status === 403 || /<html/i.test(text)
        ? 'Google refused access (sheet is private). Share it with "Anyone with the link → Viewer", or deploy apps-script/Code.gs and use its URL.'
        : `Fetch failed (${res.status}).`);
    }
    if (/^\s*\{/.test(text)) { // Apps Script error JSON
      const j = JSON.parse(text);
      throw new Error(j.error || 'Unknown error from Apps Script');
    }
    return text;
  }

  // ---- CSV parsing (RFC 4180-ish: quotes, escaped quotes, newlines in cells) ----
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  function toTable(csvText) {
    const rows = parseCSV(csvText);
    if (!rows.length) return { headers: [], records: [] };
    // Flatten multi-line headers ("유효기간\n[종료일자]" → "유효기간 [종료일자]").
    const headers = rows[0].map((h, i) => h.replace(/\s+/g, ' ').trim() || `Column ${i + 1}`);
    const records = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
    return { headers, records };
  }

  // ---- Mapping ----
  function guessMapping(headers) {
    const map = {};
    const used = new Set();
    const norm = (s) => s.toLowerCase().replace(/[_\-]+/g, ' ').trim();
    // Prefer explicit first/last over a single name column.
    const order = ['memberNo', 'clubType', 'clubPlan', 'clubReg', 'clubStart', 'clubEnd', 'clubDaysLeft', 'squashCoach', 'squashContact', 'clubNote', 'clubRenewalNote', 'clubRenewalDate', 'clubEndReason', 'clubAge', 'clubStaff',
      'firstName', 'lastName', 'email', 'guardianPhone', 'guardianName', 'phone', 'lastContact', 'nextFollowUp', 'consentSms', 'consentCalls', 'consentMarketing', 'coach',
      'validUntil', 'sessionsCarried', 'sessionsThisMonth', 'sessionsLeft', 'sessionsTotal', 'payment', 'registration',
      'inqDate', 'inqProgram', 'inqWish', 'inqMessage', 'inqLog', 'inqMemo', 'memberFlag', 'inqAge', 'inqAgeText', 'inqRegion', 'inqFirstContact', 'inqHistory', 'joined', 'segment', 'status', 'source', 'notes', 'fullName'];
    for (const k of order) {
      const f = FIELDS.find((x) => x.k === k);
      // Try hints in order so a specific one ("등록일") beats a generic one ("등록").
      let h;
      for (const hint of f.hints) {
        h = headers.find((hd) => !used.has(hd) && norm(hd).includes(hint));
        if (h) break;
      }
      if (h) { map[k] = h; used.add(h); }
    }
    if (map.firstName && map.fullName) delete map.fullName;
    return map;
  }

  const digits = (s) => String(s || '').replace(/\D+/g, '');
  // Two levels of identity (owner's rule):
  //  - a RECORD is one sheet name exactly as written ("Augustus1", "김무건(단체)" stay
  //    separate rows in the list; repeated rows of the same name = renewals → one record);
  //  - a PERSON ignores digits and bracketed suffixes ("Augustus1" = "Augustus"), used only
  //    for the headline counts in the app.
  const normName = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const personKey = (s) => String(s || '').toLowerCase().replace(/\s*[(（\[].*$/, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
  const splitList = (v) => String(v || '').split(/\s*[,/]\s*/).filter(Boolean);
  const union = (a, b) => Array.from(new Set(splitList(a).concat(splitList(b))));
  const truthy = (v) => /^(y|yes|true|1|o|ok|✓|동의|예)/i.test(String(v || '').trim());
  const pad2 = (n) => String(n).padStart(2, '0');
  // "10", "10회", "1,089,000" → number; anything without digits → ''.
  const toNumber = (v) => { const s = String(v || '').replace(/[,\s]/g, ''); const m = s.match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : ''; };
  function toISODate(v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // Korean dotted dates as typed in the sheet: "26. 4. 1", "26.9.30", "2026.04.01".
    let m = v.match(/^(\d{2}|\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\.?$/);
    if (m) return `${m[1].length === 2 ? '20' + m[1] : m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
    // US style from Sheets display values: "9/12/2026".
    m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${pad2(m[1])}-${pad2(m[2])}`;
    const d = new Date(v);
    return isNaN(d) ? v : d.toISOString().slice(0, 10);
  }
  // Sheet wording → app enum values (checked before the plain substring match).
  const ALIASES = {
    // Checked in SEGMENTS order, so 'lead' catches 비회원 before 'member' matches its 회원 part.
    lead: ['비회원', '리드', '잠재', '문의', '체험'], member: ['회원', '멤버', '정회원', 'active'], lapsed: ['만료', '휴면', '탈퇴', '종료', '보류'],
    junior: ['wsc', '주니어', '학생', '아동', 'kid'], // WSC = the sheet's junior member classification
    corporate: ['기업', '법인', '단체'], sponsor: ['스폰서', '후원'],
    'opted-out': ['거부', '수신거부'], 'at-risk': ['위험', '이탈'], 'trial-booked': ['체험', 'ot', '오티', '예약'], contacted: ['연락완료', '컨택', '부재중', '문자'],
    new: ['미정', '신규'], active: ['등록', '회원권'],
  };
  const pickEnum = (v, list, fallback) => {
    const s = String(v || '').toLowerCase().trim();
    if (!s) return fallback;
    return list.find((x) => x === s)
      || list.find((x) => (ALIASES[x] || []).some((a) => s.includes(a)))
      || list.find((x) => s.includes(x) || x.includes(s))
      || fallback;
  };

  function splitName(full) {
    const parts = String(full || '').trim().split(/\s+/);
    if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
    return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
  }

  // 레슨구분 (owner's rule): the sheet marks group-lesson members with "단체" in the
  // name (e.g. "김무건(단체)") → 단체레슨; everyone else 개인레슨. Derived, not a sheet column.
  function lessonTypeOf(c) {
    return /단체/.test(`${c.firstName || ''} ${c.lastName || ''}`) ? '단체레슨' : '개인레슨';
  }

  // Sheet row -> customer-shaped object (only mapped fields are set).
  function mapRecord(row, map) {
    const get = (k) => (map[k] ? row[map[k]] : undefined);
    const out = {};
    if (map.fullName && !map.firstName) Object.assign(out, splitName(get('fullName')));
    if (map.firstName) out.firstName = get('firstName') || '';
    if (map.lastName) out.lastName = get('lastName') || '';
    if (map.email) out.email = (get('email') || '').toLowerCase();
    if (map.phone) out.phone = get('phone') || '';
    if (map.segment) { out.segmentLabel = get('segment') || ''; out.segment = pickEnum(out.segmentLabel, SEGMENTS, 'lead'); }
    if (map.status) out.status = pickEnum(get('status'), STATUSES, 'new');
    if (map.source) out.source = get('source') || '';
    if (map.joined) out.joined = toISODate(get('joined'));
    if (map.validUntil) out.validUntil = toISODate(get('validUntil'));
    if (map.sessionsTotal) out.sessionsTotal = toNumber(get('sessionsTotal'));
    if (map.sessionsCarried) out.sessionsCarried = toNumber(get('sessionsCarried'));
    if (map.sessionsThisMonth) out.sessionsThisMonth = toNumber(get('sessionsThisMonth'));
    if (map.sessionsLeft) out.sessionsLeft = toNumber(get('sessionsLeft'));
    if (map.payment) out.payment = get('payment') || '';
    if (map.registration) out.registration = get('registration') || '';
    if (map.fullName || map.firstName) out.lessonType = lessonTypeOf(out);
    if (map.lastContact) out.lastContact = toISODate(get('lastContact'));
    if (map.nextFollowUp) out.nextFollowUp = toISODate(get('nextFollowUp'));
    if (map.consentMarketing) out.consentMarketing = truthy(get('consentMarketing'));
    if (map.consentCalls) out.consentCalls = truthy(get('consentCalls'));
    if (map.consentSms) out.consentSms = truthy(get('consentSms'));
    if (map.guardianName) out.guardianName = get('guardianName') || '';
    if (map.guardianPhone) out.guardianPhone = get('guardianPhone') || '';
    if (map.coach) out.coach = get('coach') || '';
    if (map.notes) out.notes = get('notes') || '';
    for (const k of ['inqDate', 'inqProgram', 'inqWish', 'inqMessage', 'inqLog', 'inqMemo', 'memberFlag', 'inqAge', 'inqAgeText', 'inqRegion', 'inqFirstContact', 'inqHistory']) if (map[k]) out[k] = (k === 'inqDate' || k === 'inqFirstContact') ? toISODate(get(k)) : (get(k) || '');
    for (const k of ['memberNo', 'clubType', 'clubAge', 'clubPlan', 'clubReg', 'clubStaff', 'squashCoach', 'squashContact', 'clubNote', 'clubRenewalNote', 'clubEndReason']) if (map[k]) out[k] = get(k) || '';
    for (const k of ['clubStart', 'clubEnd', 'clubRenewalDate']) if (map[k]) out[k] = toISODate(get(k));
    if (map.clubDaysLeft) out.clubDaysLeft = toNumber(get('clubDaysLeft'));
    if (out.clubPlan) out.clubPlan = out.clubPlan.replace(/^★\s*/, '').replace(/\s*▶\s*/g, ' · ').trim(); // "★(정)플래티넘+골프 ▶ GYM+골프+사우나 ▶ 12개월"
    if (map.inqMessage || map.inqLog) { // one readable note per inquiry
      const parts = [];
      if (out.inqDate) parts.push(`[문의 ${out.inqDate}]`);
      if (out.inqProgram) parts.push(out.inqProgram);
      if (out.inqWish) parts.push('희망: ' + out.inqWish);
      if (out.inqMessage) parts.push('내용: ' + out.inqMessage);
      if (out.inqLog) parts.push('연락: ' + out.inqLog);
      if (out.inqMemo) parts.push('메모: ' + out.inqMemo);
      out.notes = parts.join(' · ');
    }
    return out;
  }

  // Index of records by identity key. A key can hold several records when the same
  // name exists under different coaches (owner's rule: show both). find() returns the
  // record whose coach matches (or has none); a different coach is never a match.
  function makeIndex() {
    const m = new Map();
    // Not the same record if: different coaches, or both have phones and they differ
    // (two people with the same name are told apart by their numbers).
    const sameCoach = (a, b) => !a.coach || !b.coach || splitList(a.coach).some((x) => splitList(b.coach).includes(x));
    const samePhone = (a, b) => digits(a.phone).length < 7 || digits(b.phone).length < 7 || digits(a.phone).slice(-9) === digits(b.phone).slice(-9);
    const compatible = (a, b) => sameCoach(a, b) && samePhone(a, b);
    return {
      add(rec) { for (const k of keysOf(rec)) { if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(rec)) m.get(k).push(rec); } },
      find(c) { for (const k of keysOf(c)) { const hit = (m.get(k) || []).find((r) => r !== c && compatible(r, c)); if (hit) return hit; } return null; },
    };
  }

  // Identity keys used to detect duplicates: email, then phone, then name.
  function keysOf(c) {
    const k = [];
    if (c.email) k.push('e:' + c.email.toLowerCase().trim());
    if (digits(c.phone).length >= 7) k.push('p:' + digits(c.phone).slice(-9));
    const n = normName(`${c.firstName || ''} ${c.lastName || ''}`);
    if (n) k.push('n:' + n);
    return k;
  }

  // Merge sheet rows into the store. Rows that share an email/phone/name are
  // collapsed into one; existing customers are updated in place, never duplicated.
  // opts.coach: the 담당강사 of this source; stamped on every row it contributes.
  // opts.now: shared timestamp for one Sync run (all sources), used by pruneMissing().
  function sync(csvText, map, store, opts = {}) {
    const { records } = toTable(csvText);
    const mapped = records.map((r) => mapRecord(r, map)).filter((c) => keysOf(c).length);
    if (opts.coach) mapped.forEach((c) => { if (!c.coach) c.coach = opts.coach; }); // a mapped 담당강사 column wins

    // 1) Collapse duplicates inside the sheet. Later rows are renewals, so the
    //    latest row wins (validity, sessions, payment…) except that the first
    //    registration date is kept as "joined" and notes are accumulated.
    //    Inquiry tabs are written newest-first (Inquiries.gs), so there the row
    //    with the later 접수일 wins regardless of position.
    const seen = makeIndex(); const unique = [];
    let collapsed = 0;
    for (const c of mapped) {
      const hit = seen.find(c);
      if (hit) {
        const { joined, notes } = hit;
        const older = c.inqDate && hit.inqDate && c.inqDate < hit.inqDate;
        fill(hit, c, !older); // an older inquiry only fills blanks
        hit.joined = [joined, c.joined].filter(Boolean).sort()[0] || ''; // earliest registration wins
        if (notes && c.notes && !notes.includes(c.notes)) hit.notes = `${notes} / ${c.notes}`;
        collapsed++;
      }
      else unique.push(c);
      seen.add(hit || c);
    }

    const now = opts.now || new Date().toISOString();
    if (opts.enrichOnly) return enrich(unique, store, now, records.length, collapsed);
    if (opts.leads) return leads(unique, store, now, records.length, collapsed, opts);
    if (opts.clubdb) return clubImport(unique, store, now, records.length, collapsed);

    // 2) Match against existing customers.
    const index = makeIndex();
    for (const e of store.list('customers')) index.add(e);
    let added = 0, updated = 0;
    for (const c of unique) {
      const hit = index.find(c);
      if (hit) {
        const before = JSON.stringify(hit);
        // Sheet-derived facts (aliases, coach) are rebuilt from scratch on each Sync run so
        // renamed rows or a coach change in the sheet do not leave stale traces behind.
        if (opts.coach && hit.sheetRunAt !== now) { hit.coach = ''; delete hit.aliases; hit.sheetRunAt = now; }
        const coaches = splitList(hit.coach);
        fill(hit, c, true);
        if (c.coach && coaches.length && !coaches.includes(c.coach)) hit.coach = coaches.concat(c.coach).join(', ');
        hit.sheetSyncedAt = now;
        if (JSON.stringify(hit) !== before) updated++;
        store.upsert('customers', hit);
      } else {
        const rec = Object.assign({ segment: 'lead', status: 'new', source: 'google-sheet' }, c, { sheetSyncedAt: now, sheetRunAt: now });
        store.upsert('customers', rec);
        index.add(rec);
        added++;
      }
    }
    const merged = dedupe(store);
    return { rows: records.length, unique: unique.length, collapsed, added, updated, merged };
  }

  // Lead source (the 문의-주니어 / 문의-시니어 tabs). Inquiries match existing people by
  // phone, then name (coach-agnostic). A match that is an actual member (came from a
  // member sheet) only gets blanks filled + the inquiry note appended — never its
  // status/segment overwritten; anyone else becomes or updates a lead record.
  // 웰페리온 회원 DB: club membership rows. Matches by phone then name; a person already in
  // the app (member or inquiry) is enriched with the club fields (nothing else touched);
  // everyone else becomes a club record (source 'clubdb', 회원구분 클럽회원).
  const CLUB_FIELDS = ['memberNo', 'clubType', 'clubAge', 'clubPlan', 'clubReg', 'clubStart', 'clubEnd', 'clubDaysLeft', 'clubStaff', 'squashCoach', 'squashContact', 'clubNote', 'clubRenewalNote', 'clubRenewalDate', 'clubEndReason'];
  function clubImport(rows, store, now, rowCount, collapsed) {
    const index = makeIndex();
    for (const e of store.list('customers')) index.add(e);
    let added = 0, updated = 0;
    for (const c of rows) {
      const hit = index.find(Object.assign({}, c, { coach: '' }));
      if (hit) {
        const before = JSON.stringify(hit);
        for (const k of CLUB_FIELDS) if (c[k] !== undefined && c[k] !== '' && c[k] !== null) hit[k] = c[k];
        for (const k of ['phone', 'email']) if (!hit[k] && c[k]) hit[k] = c[k];
        hit.clubSyncedAt = now;
        if (hit.source === 'clubdb') { hit.sheetSyncedAt = now; hit.status = typeof c.clubDaysLeft === 'number' && c.clubDaysLeft < 0 ? 'lapsed' : 'active'; } // seen this run → not pruned
        if (JSON.stringify(hit) !== before) { updated++; store.upsert('customers', hit); }
        continue;
      }
      delete c.coach; delete c.sessionsLeft; delete c.registration; delete c.inqMemo; // generic guesses that do not apply to club rows
      const rec = Object.assign({}, c, { segment: 'lead', segmentLabel: '클럽회원', source: 'clubdb', status: typeof c.clubDaysLeft === 'number' && c.clubDaysLeft < 0 ? 'lapsed' : 'active', sheetSyncedAt: now, clubSyncedAt: now });
      store.upsert('customers', rec); index.add(rec); added++;
    }
    return { rows: rowCount, unique: rows.length, collapsed, added, updated, merged: 0 };
  }

  function leads(rows, store, now, rowCount, collapsed, opts) {
    const index = makeIndex();
    for (const e of store.list('customers')) index.add(e);
    let added = 0, updated = 0;
    for (const c of rows) {
      c.segment = 'lead'; c.segmentLabel = opts.segmentLabel || '문의'; c.source = 'inquiry';
      if (!c.status) c.status = 'new';
      const hit = index.find(Object.assign({}, c, { coach: '' })); // coach must not block a match
      if (hit && hit.sheetRunAt) { // a real member who also inquired
        const before = JSON.stringify(hit);
        for (const k of ['phone', 'email', 'lastContact', 'nextFollowUp']) if (!hit[k] && c[k]) hit[k] = c[k];
        if (c.lastContact && (!hit.lastContact || c.lastContact > hit.lastContact)) hit.lastContact = c.lastContact;
        if (c.notes && !(hit.notes || '').includes(c.notes)) hit.notes = hit.notes ? `${hit.notes} / ${c.notes}` : c.notes;
        hit.inquirySyncedAt = now;
        if (JSON.stringify(hit) !== before) { updated++; store.upsert('customers', hit); }
        continue;
      }
      if (hit) {
        const before = JSON.stringify(hit);
        fill(hit, c, true);
        hit.sheetSyncedAt = now; hit.inquirySyncedAt = now;
        if (JSON.stringify(hit) !== before) updated++;
        store.upsert('customers', hit);
      } else {
        const rec = Object.assign({}, c, { sheetSyncedAt: now, inquirySyncedAt: now });
        store.upsert('customers', rec); index.add(rec); added++;
      }
    }
    return { rows: rowCount, unique: rows.length, collapsed, added, updated, merged: 0 };
  }

  // Contact-only source (e.g. the 연락처 tab): its rows carry phone / guardian /
  // consent / email for PEOPLE, so they are matched by person key (digits and
  // bracketed suffixes ignored) and copied onto every record of that person —
  // "Augustus" and "Augustus1" both get the number. Rows that match nobody are
  // reported, never turned into customers. A record that already has a
  // different phone is left alone (same name, different person).
  const CONTACT_FIELDS = ['phone', 'guardianName', 'guardianPhone', 'email', 'consentSms', 'consentCalls', 'consentMarketing'];
  function enrich(rows, store, now, rowCount, collapsed) {
    const byPerson = new Map();
    for (const e of store.list('customers')) {
      const k = personKey(`${e.firstName || ''} ${e.lastName || ''}`);
      if (!k) continue;
      if (!byPerson.has(k)) byPerson.set(k, []);
      byPerson.get(k).push(e);
    }
    let updated = 0; const unmatched = [];
    for (const c of rows) {
      const k = personKey(`${c.firstName || ''} ${c.lastName || ''}`);
      const targets = (byPerson.get(k) || []).filter((e) => digits(e.phone).length < 7 || !c.phone || digits(e.phone).slice(-9) === digits(c.phone).slice(-9));
      if (!targets.length) { unmatched.push(`${c.firstName || ''} ${c.lastName || ''}`.trim()); continue; }
      for (const e of targets) {
        const before = JSON.stringify(e);
        for (const f of CONTACT_FIELDS) { const v = c[f]; if (v !== undefined && v !== '' && v !== null) e[f] = v; else if (typeof v === 'boolean') e[f] = v; }
        if (c.notes && !(e.notes || '').includes(c.notes)) e.notes = e.notes ? `${e.notes} / ${c.notes}` : c.notes;
        e.contactSyncedAt = now;
        if (JSON.stringify(e) !== before) { updated++; store.upsert('customers', e); }
      }
    }
    return { rows: rowCount, unique: rows.length, collapsed, added: 0, updated, merged: 0, unmatched };
  }

  // After ALL sources synced without error: sheet-sourced customers that no
  // source touched in this run are gone from the sheet. Remove them — unless
  // calls were logged against them, in which case keep and mark them.
  function pruneMissing(store, now) {
    const hasCalls = new Set(store.list('calls').map((k) => k.customerId));
    let removed = 0, kept = 0;
    for (const c of store.list('customers').slice()) {
      if (!c.sheetSyncedAt || c.sheetSyncedAt >= now) continue; // manual customer, or seen this run
      if (hasCalls.has(c.id)) { c.sheetRemovedAt = now; store.upsert('customers', c); kept++; }
      else { store.remove('customers', c.id); removed++; }
    }
    return { removed, kept };
  }

  // Merge customers already in the store that collide under the record identity
  // (same name / email / phone). The older record survives; calls are re-pointed to it.
  function dedupe(store) {
    const all = store.list('customers').slice().sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    const index = makeIndex();
    let merged = 0;
    for (const c of all) {
      const hit = index.find(c);
      if (!hit) { index.add(c); continue; }
      // c duplicates hit → merge into hit and drop c
      const { joined, notes } = hit;
      fill(hit, c); // only fills blanks: the older record's values stand
      hit.joined = [joined, c.joined].filter(Boolean).sort()[0] || ''; // earliest registration wins
      if (notes && c.notes && !notes.includes(c.notes)) hit.notes = `${notes} / ${c.notes}`;
      if (c.coach) hit.coach = union(hit.coach, c.coach).join(', ');
      if (hit.sheetSyncedAt && c.sheetSyncedAt && c.sheetSyncedAt > hit.sheetSyncedAt) {
        // the newer sheet snapshot carries the current balances — let those win
        for (const k of ['validUntil', 'sessionsTotal', 'sessionsCarried', 'sessionsThisMonth', 'sessionsLeft', 'payment', 'registration', 'segment', 'segmentLabel']) {
          if (c[k] !== '' && c[k] != null) hit[k] = c[k];
        }
        hit.sheetSyncedAt = c.sheetSyncedAt;
      }
      for (const call of store.list('calls')) if (call.customerId === c.id) { call.customerId = hit.id; store.upsert('calls', call); }
      store.remove('customers', c.id);
      store.upsert('customers', hit);
      merged++;
    }
    return merged;
  }

  // Copy non-empty values from src into dst. With overwrite=true the sheet wins
  // for any field it has a value for; otherwise only blanks are filled.
  function fill(dst, src, overwrite = false) {
    for (const [k, v] of Object.entries(src)) {
      const has = v !== '' && v !== null && v !== undefined;
      if (!has) continue;
      if (overwrite || dst[k] === '' || dst[k] == null) dst[k] = v;
    }
  }

  return { FIELDS, toFetchUrl, fetchCSV, parseCSV, toTable, guessMapping, sync, dedupe, pruneMissing, personKey, lessonTypeOf };
})();
