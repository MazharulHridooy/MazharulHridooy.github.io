(function(){
  // Shift status (Asia/Dhaka = UTC+6, no DST). Bar spans 08:00–23:00.
  const WINDOW_START = 8*60, WINDOW_END = 23*60;
  const MORNING_END = 17*60, DAY_START = 16*60+30;
  const clockEl = document.getElementById('clock');
  const statusEl = document.getElementById('shiftStatus');
  const marker = document.getElementById('covNow');

  function pad(n){ return String(n).padStart(2,'0'); }

  function shiftLabel(mins){
    if(mins < WINDOW_START || mins >= WINDOW_END) return 'Floor closed. Morning shift starts at 08:00.';
    if(mins >= DAY_START && mins < MORNING_END) return 'Shift handover';
    return mins < DAY_START ? 'Morning shift on the floor' : 'Day shift on the floor';
  }

  function tick(){
    const d = new Date(Date.now() + 6*3600000);
    const h = d.getUTCHours(), m = d.getUTCMinutes();
    const mins = h*60+m;
    clockEl.textContent = `DHAKA ${pad(h)}:${pad(m)}`;
    statusEl.textContent = shiftLabel(mins);
    const open = mins >= WINDOW_START && mins < WINDOW_END;
    marker.hidden = !open;
    if(open) marker.style.left = ((mins-WINDOW_START)/(WINDOW_END-WINDOW_START)*100) + '%';
  }
  tick();
  setInterval(tick, 30000);

  // Fraud demo. Mirrors FraudService: additive points capped at 100; 31 = yellow, 61 = red.
  const BANDS = {
    green: ['Green: ships', 'No action. The order moves on to a courier.'],
    yellow: ['Yellow: review', 'Flagged. An agent checks it before it goes any further.'],
    red: ['Red: held', 'Held automatically. Managers are notified and dispatch is blocked.']
  };
  const boxes = [...document.querySelectorAll('#signals input')];
  const presets = document.getElementById('presets');
  const verdict = document.getElementById('verdict');

  function bandFor(score){ return score >= 61 ? 'red' : score >= 31 ? 'yellow' : 'green'; }

  function render(){
    const score = Math.min(100, boxes.reduce((sum,b)=> sum + (b.checked ? Number(b.value) : 0), 0));
    const band = bandFor(score);
    verdict.dataset.band = band;
    document.getElementById('score').textContent = score;
    document.getElementById('band').textContent = BANDS[band][0];
    document.getElementById('action').textContent = BANDS[band][1];
  }
  boxes.forEach(b=>b.addEventListener('change', render));

  presets.hidden = false;
  presets.addEventListener('click', e=>{
    const set = e.target.dataset && e.target.dataset.set;
    if(set === undefined) return;
    const wanted = set ? set.split(',').map(Number) : [];
    boxes.forEach((b,i)=>{ b.checked = wanted.includes(i); });
    render();
  });
  render();

  // Dialer demo. Mirrors the Smart Calling queue: callbacks, then new orders, then retries; 3 tries a day.
  const MAX_TRIES = 3;
  const RANK = { callback: 0, new: 1, retry: 2 };
  const REASON = { callback: 'CALLBACK DUE', new: 'NEW ORDER', retry: 'RETRY' };
  const SAMPLE = [
    { name: 'Nusrat J.', order: '#1042', total: '৳1,850', district: 'Dhaka', reason: 'callback', tries: 0 },
    { name: 'Rafiq H.', order: '#1051', total: '৳990', district: 'Rajshahi', reason: 'new', tries: 0 },
    { name: 'Sadia A.', order: '#1050', total: '৳2,400', district: 'Khulna', reason: 'new', tries: 0, cancels: true },
    { name: 'Tanvir K.', order: '#1049', total: '৳1,290', district: 'Sylhet', reason: 'new', tries: 0 },
    { name: 'Mitu R.', order: '#1037', total: '৳760', district: 'Barishal', reason: 'retry', tries: 1 }
  ];
  const dialer = document.getElementById('dialer');
  const outs = document.getElementById('outs');
  const again = document.getElementById('again');
  const byId = id => document.getElementById(id);
  let calls, tally;

  function ordered(list){ return [...list].sort((a,b)=> RANK[a.reason] - RANK[b.reason]); }

  function showCall(){
    const c = calls[0];
    outs.hidden = !c;
    again.hidden = Boolean(c);
    byId('callReason').textContent = c ? REASON[c.reason] : 'QUEUE CLEAR';
    byId('callTries').textContent = c ? `Try ${c.tries+1} of ${MAX_TRIES} today` : '';
    byId('callName').textContent = c ? c.name : 'Nobody left to call';
    byId('callMeta').textContent = c ? `${c.order} · ${c.total} · ${c.district}` : 'On the real floor, new orders keep arriving.';
    byId('callWarn').textContent = c && c.cancels ? 'This customer cancels often.' : '';
    byId('tConfirmed').textContent = tally.confirmed;
    byId('tLater').textContent = tally.later;
    byId('tOut').textContent = tally.out;
    byId('upNext').replaceChildren(...calls.slice(1).map(q=>{
      const li = document.createElement('li');
      const tag = document.createElement('span');
      li.textContent = q.name;
      tag.textContent = REASON[q.reason].toLowerCase();
      li.append(tag);
      return li;
    }));
  }

  function logOutcome(outcome){
    const [c, ...rest] = calls;
    if(!c) return;
    const note = {
      confirmed: `${c.order} confirmed. The next customer would ring in 3 seconds.`,
      later: `${c.name} leaves the queue until the time the agent picked.`,
      wrong: `${c.order} leaves the queue as a wrong number.`,
      lost: `${c.order} cancelled, and the agent records why.`
    };
    if(outcome === 'noanswer'){
      const tries = c.tries + 1;
      if(tries < MAX_TRIES){
        calls = ordered([...rest, {...c, reason:'retry', tries}]);
        byId('callNote').textContent = `No answer from ${c.name}. Back in the queue as a retry, after 30 minutes.`;
      } else {
        calls = rest;
        tally = {...tally, out: tally.out+1};
        byId('callNote').textContent = `Three tries today, so ${c.order} waits for tomorrow.`;
      }
    } else {
      calls = rest;
      tally = {
        confirmed: tally.confirmed + (outcome==='confirmed'?1:0),
        later: tally.later + (outcome==='later'?1:0),
        out: tally.out + (outcome==='wrong'||outcome==='lost'?1:0)
      };
      byId('callNote').textContent = note[outcome];
    }
    showCall();
    if(!calls.length) again.focus();
  }

  function startQueue(){
    calls = ordered(SAMPLE);
    tally = { confirmed:0, later:0, out:0 };
    showCall();
  }

  outs.addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if(btn) logOutcome(btn.dataset.o);
  });
  outs.addEventListener('keydown', e=>{
    const btn = outs.querySelectorAll('button')[Number(e.key)-1];
    if(btn && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); logOutcome(btn.dataset.o); }
  });
  again.addEventListener('click', ()=>{
    startQueue();
    byId('callNote').textContent = 'Queue reloaded.';
    outs.querySelector('button').focus();
  });
  dialer.hidden = false;
  startQueue();

  // Marks the section in view in the nav.
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(entries=>{
    entries.filter(en=>en.isIntersecting).forEach(en=>{
      navLinks.forEach(a=>{
        if(a.getAttribute('href') === `#${en.target.id}`) a.setAttribute('aria-current','true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin:'-30% 0px -65% 0px' });
  navLinks.forEach(a=>{ const t = document.querySelector(a.getAttribute('href')); if(t) spy.observe(t); });
})();
