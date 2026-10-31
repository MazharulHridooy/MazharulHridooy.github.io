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
})();
