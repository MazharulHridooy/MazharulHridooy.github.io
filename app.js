(function(){
  // Live Dhaka clock + shift status (Asia/Dhaka = UTC+6, no DST)
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('dateNow');
  const statusEl = document.getElementById('shiftStatus');
  const covNow = document.getElementById('covNow');

  function dhakaNow(){
    const utc = new Date(Date.now());
    const utcMs = utc.getTime() + (utc.getTimezoneOffset()*60000);
    return new Date(utcMs + 6*3600000);
  }
  function pad(n){ return n.toString().padStart(2,'0'); }

  function tick(){
    const d = dhakaNow();
    const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    clockEl.textContent = `Dhaka — ${pad(h)}:${pad(m)}:${pad(s)}`;
    dateEl.textContent = d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});

    const mins = h*60+m;
    const morningStart = 8*60, morningEnd = 17*60;
    const dayStart = 16*60+30, dayEnd = 23*60;
    let status, cls;
    if(mins >= dayStart && mins < dayEnd){ status = 'Day Shift Active'; cls='on'; }
    else if(mins >= morningStart && mins < morningEnd){ status = 'Morning Shift Active'; cls='on'; }
    else { status = 'Off-Shift'; cls='off'; }
    statusEl.textContent = status;
    statusEl.className = 'val ' + cls;

    // coverage bar spans 08:00–23:00 (900 min window)
    const winStart = 8*60, winEnd = 23*60, winLen = winEnd-winStart;
    let pct = ((mins - winStart) / winLen) * 100;
    pct = Math.max(0, Math.min(100, pct));
    covNow.style.left = pct + '%';
  }
  tick();
  setInterval(tick, 1000);

  // timeline reveal
  const items = document.querySelectorAll('.t-item');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in-view'); obs.unobserve(e.target);} });
  }, {threshold:0.15});
  items.forEach(i=>obs.observe(i));

  // mobile nav toggle
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', ()=>{
    const isOpen = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }));
})();
