/**
 * MotoGP Dashboard Cards for Home Assistant
 * 4 custom cards: Event, Riders, Teams, Live Timing
 * No external dependencies required.
 *
 * Usage in Lovelace YAML:
 *   type: custom:motogp-event-card
 *   type: custom:motogp-riders-card
 *   type: custom:motogp-teams-card
 *   type: custom:motogp-live-card
 *
 * Optional language override (default: auto from hass.language):
 *   type: custom:motogp-event-card
 *   language: en
 */

const TRANSLATIONS = {
  en: {
    next_gp:              'Next Grand Prix',
    riders_standings:     'Riders Standings',
    teams_standings:      'Teams Standings',
    live_timing:          'Live Timing',
    schedule:             'Schedule',
    track_unavailable:    'Track layout unavailable',
    sessions_unavailable: 'Sessions unavailable',
    upcoming:             'Upcoming',
    race_start:           '🏁 RACE START',
    in_progress:          '🏁 In progress',
    days_fmt:             (d, h, m) => `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`,
    session_labels:       { FP: 'FP', PR: 'Practice', Q: 'Qualifying', SPR: 'Sprint', RAC: 'Race 🏁' },
    season_not_started:   'Season not started',
    wins_legend:          'W = Wins',
    col_rider:            'RIDER',
    col_wins:             'W',
    no_race:              'No race in progress',
    next_start:           'Next start:',
    live_label:           '● LIVE',
    col_lap:              'LAP',
    col_gap:              'GAP',
    col_laps:             'LAPS',
    col_driver:           'RIDER',
    sensor_missing:       'Sensor not found',
  },
  fr: {
    next_gp:              'Prochain Grand Prix',
    riders_standings:     'Classement Pilotes',
    teams_standings:      'Classement Équipes',
    live_timing:          'Live Timing',
    schedule:             'Programme',
    track_unavailable:    'Tracé non disponible',
    sessions_unavailable: 'Sessions non disponibles',
    upcoming:             'À venir',
    race_start:           '🏁 DÉPART COURSE',
    in_progress:          '🏁 En cours',
    days_fmt:             (d, h, m) => `${d}j ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`,
    session_labels:       { FP: 'FP', PR: 'Practice', Q: 'Qualif', SPR: 'Sprint', RAC: 'Course 🏁' },
    season_not_started:   'Saison non démarrée',
    wins_legend:          'V = Victoires',
    col_rider:            'PILOTE',
    col_wins:             'V',
    no_race:              'Pas de course en direct',
    next_start:           'Prochain départ :',
    live_label:           '● EN DIRECT',
    col_lap:              'TOUR',
    col_gap:              'ÉCART',
    col_laps:             'TOURS',
    col_driver:           'PILOTE',
    sensor_missing:       'Sensor introuvable',
  },
};

function getT(lang) {
  const key = (lang || 'en').toLowerCase().split('-')[0];
  return TRANSLATIONS[key] || TRANSLATIONS['en'];
}


const BASE_CSS = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4); color: #fff; }
  .card-header { padding: 12px 16px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .card-title { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #e5003a; text-transform: uppercase; margin: 0; }
  .empty { padding: 28px 16px; text-align: center; color: #445; font-size: 13px; }
  .empty .icon { font-size: 32px; margin-bottom: 8px; }
`;


class MotoGPEventCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._countdownInterval = null;
    this._raceUtc = null;
  }
  setConfig(config) { this._config = config; }
  _lang() { return (this._config && this._config.language) ? this._config.language : (this._hass ? this._hass.language : 'en'); }
  set hass(hass) { this._hass = hass; this._render(); }
  connectedCallback() { if (this._raceUtc) this._startCountdown(); }
  disconnectedCallback() { this._stopCountdown(); }
  getCardSize() { return 6; }

  _stopCountdown() {
    if (this._countdownInterval) { clearInterval(this._countdownInterval); this._countdownInterval = null; }
  }
  _startCountdown() {
    this._stopCountdown();
    this._countdownInterval = setInterval(() => {
      const el = this.shadowRoot.getElementById('countdown');
      if (!el) { this._stopCountdown(); return; }
      el.textContent = this._computeCountdown();
    }, 1000);
  }
  _computeCountdown() {
    const t = getT(this._lang());
    if (!this._raceUtc) return '—';
    const diff = Math.floor((new Date(this._raceUtc) - Date.now()) / 1000);
    if (diff <= 0) return t.in_progress;
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins  = Math.floor((diff % 3600) / 60);
    const secs  = diff % 60;
    if (days > 0) return t.days_fmt(days, hours, mins);
    return `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  _render() {
    this._stopCountdown();
    const t = getT(this._lang());
    const hass = this._hass;
    const evtState  = hass.states['sensor.motogp_prochain_evenement'];
    const sesState  = hass.states['sensor.motogp_sessions'];
    const raceState = hass.states['sensor.motogp_depart_course'];

    if (!evtState) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}</style><ha-card class="card"><div class="empty">${t.sensor_missing}</div></ha-card>`;
      return;
    }

    const e        = evtState.attributes;
    const name     = evtState.state || '';
    const sessions = sesState ? (sesState.attributes.sessions || []) : [];
    this._raceUtc  = raceState ? (raceState.attributes.start_utc || null) : null;

    const SESSION_COLORS = { FP: '#00bcd4', PR: '#2196f3', Q: '#9c27b0', SPR: '#ff9800', RAC: '#e5003a' };
    const dateStr = `${e.date_start_local ? e.date_start_local.substring(0,10) : ''} → ${e.date_end_local ? e.date_end_local.substring(0,10) : ''}`;

    const sessRows = sessions.map(s => `
      <div class="sess-row">
        <span class="sess-badge" style="background:${SESSION_COLORS[s.type] || '#555'}">${t.session_labels[s.type] || s.type}</span>
        <span class="sess-time">${s.start_local || ''}</span>
        <span class="sess-status ${s.status !== 'NOT-STARTED' ? 'done' : ''}">${s.status === 'NOT-STARTED' ? t.upcoming : s.status}</span>
      </div>`).join('');

    const raceBar = this._raceUtc ? `
      <div class="race-bar">
        <span class="race-label">${t.race_start}</span>
        <span class="race-time" id="countdown">${this._computeCountdown()}</span>
      </div>` : '';

    const svgBlock = e.circuit_svg
      ? `<div class="circuit-svg-wrap"><img src="${e.circuit_svg}" class="circuit-svg" alt="Circuit"></div>`
      : `<div class="no-svg">${t.track_unavailable}</div>`;

    this.shadowRoot.innerHTML = `
      <style>
        ${BASE_CSS}
        .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); }
        .event-top { display: flex; align-items: center; gap: 12px; padding: 14px 16px 10px; }
        .flag { width: 44px; height: 33px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); object-fit: cover; flex-shrink: 0; }
        .event-info { min-width: 0; }
        .event-name { font-size: 15px; font-weight: 800; color: #fff; line-height: 1.2; }
        .event-meta { font-size: 11px; color: #8899aa; margin-top: 3px; }
        .circuit-label { font-size: 11px; color: #8899aa; padding: 0 16px 8px; }
        .circuit-svg-wrap { margin: 0 16px 14px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px; text-align: center; }
        .circuit-svg { max-width: 100%; max-height: 180px; object-fit: contain; filter: invert(1) opacity(0.85); }
        .no-svg { text-align: center; color: #445; font-size: 11px; padding: 12px 16px; }
        .programme-wrap { margin: 0 16px 16px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px; }
        .programme-title { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #8899aa; text-transform: uppercase; margin-bottom: 8px; }
        .sess-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sess-row:last-of-type { border-bottom: none; }
        .sess-badge { color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; min-width: 60px; text-align: center; flex-shrink: 0; }
        .sess-time { color: #ccd; font-size: 12px; flex: 1; text-align: center; }
        .sess-status { font-size: 10px; color: #667; text-align: right; }
        .sess-status.done { color: #4caf50; }
        .race-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding: 8px 12px; background: linear-gradient(90deg, rgba(229,0,58,0.2), transparent); border-left: 3px solid #e5003a; border-radius: 0 8px 8px 0; }
        .race-label { color: #e5003a; font-weight: 700; font-size: 11px; }
        .race-time { color: #fff; font-weight: 800; font-size: 14px; font-family: 'Courier New', monospace; letter-spacing: 1px; }
      </style>
      <ha-card class="card">
        <div class="card-header"><p class="card-title">${t.next_gp}</p></div>
        <div class="event-top">
          ${e.flag_url ? `<img class="flag" src="${e.flag_url}" alt="${e.country_name}">` : ''}
          <div class="event-info">
            <div class="event-name">${name}</div>
            <div class="event-meta">${e.country_name || ''} &bull; ${dateStr}</div>
          </div>
        </div>
        <div class="circuit-label">📍 ${e.circuit_name || ''}</div>
        ${svgBlock}
        <div class="programme-wrap">
          <div class="programme-title">${t.schedule}</div>
          ${sessRows || `<div style="color:#445;font-size:11px;">${t.sessions_unavailable}</div>`}
          ${raceBar}
        </div>
      </ha-card>`;

    if (this._raceUtc) this._startCountdown();
  }
}


class MotoGPRidersCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  setConfig(config) { this._config = config; }
  _lang() { return (this._config && this._config.language) ? this._config.language : (this._hass ? this._hass.language : 'en'); }
  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return 8; }

  _render() {
    const t      = getT(this._lang());
    const sensor = this._hass.states['sensor.motogp_classement_pilotes'];
    if (!sensor) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}</style><ha-card class="card"><div class="empty">${t.sensor_missing}</div></ha-card>`;
      return;
    }
    const riders = sensor.attributes.standings || [];
    const year   = sensor.attributes.season_year || '';
    const PODIUM_BG = ['rgba(255,215,0,0.12)','rgba(192,192,192,0.10)','rgba(205,127,50,0.10)'];
    const PODIUM_C  = ['#ffd700','#c0c0c0','#cd7f32'];

    const header = `<div class="card-header"><p class="card-title">${t.riders_standings} ${year}</p></div>`;

    if (!riders.length) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}</style><ha-card class="card">${header}<div class="empty"><div class="icon">🏆</div>${t.season_not_started}</div></ha-card>`;
      return;
    }

    const colHeader = `
      <div class="col-header">
        <span class="ch pos">POS</span><span class="ch"></span>
        <span class="ch name-col">${t.col_rider}</span>
        <span class="ch pts">PTS</span>
        <span class="ch wins">${t.col_wins}</span>
      </div>`;

    const rows = riders.map((r, i) => {
      const flag = r.country_iso ? `<img class="rider-flag" src="https://flagcdn.com/20x15/${r.country_iso}.png" alt="">` : '';
      const wins = r.wins > 0 ? '🏆'.repeat(Math.min(r.wins, 3)) : '';
      return `
        <div class="rider-row" style="background:${i < 3 ? PODIUM_BG[i] : 'transparent'}">
          <span class="r-pos" style="color:${i < 3 ? PODIUM_C[i] : '#667'}">${r.position}</span>
          <span class="r-flag">${flag}</span>
          <div class="r-info"><div class="r-name">${r.full_name}</div><div class="r-team">${r.team}</div></div>
          <span class="r-pts">${r.points}</span>
          <span class="r-wins">${wins}</span>
        </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ${BASE_CSS}
        .col-header { display: grid; grid-template-columns: 28px 24px 1fr 44px 36px; gap: 4px; padding: 5px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .ch { font-size: 10px; color: #445; font-weight: 600; }
        .ch.pos, .ch.pts { text-align: right; }
        .ch.wins { text-align: center; }
        .rider-row { display: grid; grid-template-columns: 28px 24px 1fr 44px 36px; align-items: center; gap: 4px; padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .rider-row:last-child { border-bottom: none; }
        .r-pos { font-size: 12px; font-weight: 800; text-align: right; }
        .r-flag { text-align: center; }
        .rider-flag { vertical-align: middle; border-radius: 2px; }
        .r-info { min-width: 0; }
        .r-name { font-size: 11px; font-weight: 700; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-team { font-size: 9px; color: #556; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-pts { font-size: 12px; font-weight: 800; color: #fff; text-align: right; }
        .r-wins { font-size: 11px; text-align: center; }
        .legend { padding: 8px 14px; text-align: right; font-size: 10px; color: #445; }
      </style>
      <ha-card class="card">${header}${colHeader}${rows}<div class="legend">${t.wins_legend}</div></ha-card>`;
  }
}


class MotoGPTeamsCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  setConfig(config) { this._config = config; }
  _lang() { return (this._config && this._config.language) ? this._config.language : (this._hass ? this._hass.language : 'en'); }
  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return 5; }

  _render() {
    const t      = getT(this._lang());
    const sensor = this._hass.states['sensor.motogp_classement_equipes'];
    if (!sensor) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}</style><ha-card class="card"><div class="empty">${t.sensor_missing}</div></ha-card>`;
      return;
    }
    const teams  = sensor.attributes.standings || [];
    const year   = sensor.attributes.season_year || '';
    const maxPts = teams.length > 0 ? teams[0].points : 1;
    const PODIUM_C  = ['#ffd700','#c0c0c0','#cd7f32'];
    const BAR_COLORS = ['#e5003a','#ff6b35','#ffd700','#4caf50','#2196f3','#9c27b0','#00bcd4','#ff5722'];

    const header = `<div class="card-header"><p class="card-title">${t.teams_standings} ${year}</p></div>`;

    if (!teams.length) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}</style><ha-card class="card">${header}<div class="empty"><div class="icon">🏎️</div>${t.season_not_started}</div></ha-card>`;
      return;
    }

    const rows = teams.map((tm, i) => {
      const pct = maxPts > 0 ? Math.round((tm.points / maxPts) * 100) : 0;
      return `
        <div class="team-row">
          <div class="team-top">
            <div class="team-left">
              <span class="t-pos" style="color:${i < 3 ? PODIUM_C[i] : '#667'}">${tm.position}</span>
              <span class="t-name">${tm.name}</span>
            </div>
            <span class="t-pts">${tm.points}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${BAR_COLORS[i % BAR_COLORS.length]}"></div></div>
        </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ${BASE_CSS}
        .team-row { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .team-row:last-child { border-bottom: none; }
        .team-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .team-left { display: flex; align-items: center; gap: 10px; }
        .t-pos { font-size: 12px; font-weight: 800; min-width: 18px; }
        .t-name { font-size: 12px; font-weight: 600; color: #dde; }
        .t-pts { font-size: 13px; font-weight: 800; color: #fff; }
        .bar-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; margin-left: 28px; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
      </style>
      <ha-card class="card">${header}${rows}</ha-card>`;
  }
}


class MotoGPLiveCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  setConfig(config) { this._config = config; }
  _lang() { return (this._config && this._config.language) ? this._config.language : (this._hass ? this._hass.language : 'en'); }
  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return 6; }

  _render() {
    const t         = getT(this._lang());
    const hass      = this._hass;
    const sensor    = hass.states['sensor.motogp_live_timing'];
    const raceState = hass.states['sensor.motogp_depart_course'];

    if (!sensor) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}</style><ha-card class="card"><div class="empty">${t.sensor_missing}</div></ha-card>`;
      return;
    }

    const active         = sensor.attributes.active;
    const status         = sensor.state || 'inactive';
    const classification = sensor.attributes.classification || [];
    const totalLaps      = sensor.attributes.total_laps;
    const currentLap     = sensor.attributes.current_lap;
    const raceStart      = raceState ? raceState.state : '—';
    const cardBg         = active
      ? 'linear-gradient(135deg, #1a0010 0%, #2d0020 60%, #1a1a2e 100%)'
      : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';

    if (!active && classification.length === 0) {
      this.shadowRoot.innerHTML = `
        <style>
          ${BASE_CSS}
          .card { background: ${cardBg}; }
          .card-title { color: #445; }
          .next { color: #445; font-size: 11px; margin-top: 6px; }
        </style>
        <ha-card class="card">
          <div class="card-header"><p class="card-title">${t.live_timing}</p></div>
          <div class="empty">
            <div class="icon">🏁</div>
            <div style="color:#667;font-size:13px;font-weight:600;">${t.no_race}</div>
            <div class="next">${t.next_start} ${raceStart}</div>
          </div>
        </ha-card>`;
      return;
    }

    const lapsDisplay = totalLaps
      ? `<span class="lap-counter">${t.col_lap} ${currentLap || '—'} / ${totalLaps}</span>` : '';

    const PODIUM_BG = ['rgba(255,215,0,0.12)','rgba(192,192,192,0.10)','rgba(205,127,50,0.10)'];
    const PODIUM_C  = ['#ffd700','#c0c0c0','#cd7f32'];

    const rows = classification.map((r, i) => {
      const dnf = r.status === 'RT';
      return `
        <div class="live-row" style="background:${dnf ? 'rgba(255,0,0,0.08)' : (i < 3 ? PODIUM_BG[i] : 'transparent')}">
          <span class="l-pos" style="color:${dnf ? '#e5003a' : (i < 3 ? PODIUM_C[i] : '#889')}">${dnf ? '❌' : r.pos}</span>
          <span class="l-num">${r.number}</span>
          <div class="l-info">
            <div class="l-name" style="color:${dnf ? '#445' : '#dde'}">${r.name}</div>
            <div class="l-team">${r.team}</div>
          </div>
          <span class="l-gap" style="color:${dnf ? '#e5003a' : '#889'}">${dnf ? 'DNF' : (r.gap_first || '—')}</span>
          <span class="l-laps">${r.laps ?? '—'}</span>
        </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ${BASE_CSS}
        .card { background: ${cardBg}; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        .live-banner { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #e5003a; }
        .banner-left { display: flex; align-items: center; gap: 8px; }
        .live-dot { background: #fff; color: #e5003a; font-size: 10px; font-weight: 900; letter-spacing: 1px; padding: 2px 8px; border-radius: 4px; animation: blink 1.2s infinite; display: inline-block; }
        .live-status { color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 600; }
        .lap-counter { color: #fff; font-size: 13px; font-weight: 800; }
        .col-header { display: grid; grid-template-columns: 28px 22px 1fr 62px 44px; gap: 4px; padding: 5px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .ch { font-size: 10px; color: #556; font-weight: 600; text-align: center; }
        .ch.name-col { text-align: left; }
        .ch.gap { text-align: right; }
        .live-row { display: grid; grid-template-columns: 28px 22px 1fr 62px 44px; align-items: center; gap: 4px; padding: 7px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .live-row:last-child { border-bottom: none; }
        .l-pos { font-size: 12px; font-weight: 800; text-align: center; }
        .l-num { font-size: 10px; color: #667; text-align: center; }
        .l-info { min-width: 0; }
        .l-name { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .l-team { font-size: 9px; color: #445; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .l-gap { font-size: 10px; text-align: right; font-family: monospace; }
        .l-laps { font-size: 11px; color: #778; text-align: center; }
      </style>
      <ha-card class="card">
        <div class="live-banner">
          <div class="banner-left">
            <span class="live-dot">${t.live_label}</span>
            <span class="live-status">${status.toUpperCase()}</span>
          </div>
          ${lapsDisplay}
        </div>
        <div class="col-header">
          <span class="ch">POS</span><span class="ch num">#</span>
          <span class="ch name-col">${t.col_driver}</span>
          <span class="ch gap">${t.col_gap}</span>
          <span class="ch laps">${t.col_laps}</span>
        </div>
        ${rows}
      </ha-card>`;
  }
}

customElements.define('motogp-event-card',  MotoGPEventCard);
customElements.define('motogp-riders-card', MotoGPRidersCard);
customElements.define('motogp-teams-card',  MotoGPTeamsCard);
customElements.define('motogp-live-card',   MotoGPLiveCard);

window.customCards = window.customCards || [];
window.customCards.push(
  { type: 'motogp-event-card',  name: 'MotoGP Event Card',  description: 'Next GP, circuit and schedule' },
  { type: 'motogp-riders-card', name: 'MotoGP Riders Card', description: 'Riders standings' },
  { type: 'motogp-teams-card',  name: 'MotoGP Teams Card',  description: 'Teams standings' },
  { type: 'motogp-live-card',   name: 'MotoGP Live Card',   description: 'Live race timing' }
);
