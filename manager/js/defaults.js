// Default Google Sheet sources for a fresh install (e.g. the app on GitHub Pages after
// login). No secrets here: the data token is fetched with the admin password and the
// column mappings are guessed from the live headers on first sync.
const Defaults = (() => {
  const EXEC_URL = 'https://script.google.com/macros/s/AKfycbwpLozjXaVuue6WA-eCsHpVjbZqI3Aen1jV2I3ZU7zCZPi3RqMDR9U2BZ8Z6lEXm2O2/exec';
  const CLUB_DB = '12AWcAlgmmYKr2nUbWmVpa71_z3zi0BaU4ZdnOwrI_7U';
  const sources = [
    { name: '이상훈 회원 (mirror tab 1)', url: EXEC_URL, kind: 'members', coach: '이상훈' },
    { name: '박상현 회원 (mirror tab 박상현)', url: EXEC_URL + '?gid=' + encodeURIComponent('박상현'), kind: 'members', coach: '박상현' },
    { name: '연락처 (mirror tab 연락처)', url: EXEC_URL + '?gid=' + encodeURIComponent('연락처'), kind: 'contacts', enrichOnly: true },
    { name: '문의-주니어 (mirror)', url: EXEC_URL + '?gid=' + encodeURIComponent('문의-주니어') + '&header=1', kind: 'leads', leadLabel: '문의·주니어' },
    { name: '문의-시니어 (mirror)', url: EXEC_URL + '?gid=' + encodeURIComponent('문의-시니어') + '&header=1', kind: 'leads', leadLabel: '문의·시니어' },
    { name: '웰페리온 회원 DB (membership)', url: `${EXEC_URL}?book=${CLUB_DB}&gid=259014685&header=1`, kind: 'clubdb' },
    { name: '웰페리온 회원 DB — 탭 2 (스쿼시 접촉 최신)', url: `${EXEC_URL}?book=${CLUB_DB}&gid=7029863&header=1`, kind: 'clubdb' },
  ];
  // Column keys shown in the Members table by default.
  const columns = ['name', 'segment', 'lessonType', 'joined', 'validUntil', 'sessionsTotal', 'sessionsCarried', 'sessionsThisMonth', 'sessionsLeft', 'payment', 'registration', 'coach', 'consent', 'guardianPhone', 'phone'];
  return { EXEC_URL, sources, columns };
})();
