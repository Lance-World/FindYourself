(function(){
  const $ = (id)=>document.getElementById(id);
  let currentResult = null;
  let lastAI = null;

  function init(){
    drawStars();
    buildCoordSvg();
    bindEvents();
    updateAIStatus();
    renderHistory();
    renderAIPlaceholder();
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }

  function bindEvents(){
    $('analyzeBtn').addEventListener('click', analyze);
    $('resetBtn').addEventListener('click', reset);
    $('saveBtn').addEventListener('click', saveCurrent);
    $('clearHistoryBtn').addEventListener('click', clearHistory);
    $('openSettingsBtn').addEventListener('click', openSettings);
    $('openInfoBtn').addEventListener('click', ()=>$('infoDialog').showModal());
    $('saveSettingsBtn').addEventListener('click', saveSettings);
    $('clearSettingsBtn').addEventListener('click', clearSettings);
  }

  async function analyze(){
    const input = $('stateInput').value.trim();
    const note = $('noteInput').value.trim();
    if(!input){
      alert('先輸入一段你現在的狀態。');
      return;
    }
    const btn = $('analyzeBtn');
    btn.disabled = true;
    btn.textContent = '定位中…';
    try{
      currentResult = window.ACS_ANALYZER.analyzeLocal(input, note);
      lastAI = null;
      renderResult(currentResult);
      buildCoordSvg(currentResult);
      $('coordHint').textContent = `目前位置：X${currentResult.x} / Y${currentResult.y} / Z${currentResult.z}。`; 

      if(window.ACS_AI.hasEndpoint()){
        renderAIStatus('AI 整合中…','ready');
        renderAIBox({summary:'AI 正在整理文字脈絡，先顯示本機定位結果。',suggestions:[],higher_self:''}, 'loading');
        try{
          lastAI = await window.ACS_AI.enhanceWithAI(input, currentResult);
          renderAIBox(lastAI, 'ready');
          renderAIStatus('AI 已設定','ready');
        }catch(err){
          renderAIStatus('AI 連線失敗','error');
          renderAIBox({
            summary:'AI 暫時無法整合，已保留本機定位結果。',
            suggestions:['先使用上方的 XYZ 綜合卡。','檢查 Serverless URL、CORS、API key 或模型額度。','重新整理後再試一次。'],
            higher_self:'工具可以暫時失靈，但你不需要跟著混亂。先回到下一個小行動。',
            caution:String(err.message || err)
          }, 'error');
        }
      }else{
        renderAIPlaceholder(true);
      }
    }catch(err){
      alert(err.message || String(err));
    }finally{
      btn.disabled = false;
      btn.textContent = '✦ 開始定位';
    }
  }

  function renderResult(r){
    $('resultPanel').hidden = false;
    $('mainResult').innerHTML = `
      <p class="card-kicker">XYZ 綜合定位卡</p>
      <h3>${escapeHtml(r.card.name)}</h3>
      <div class="axis-summary">
        ${axisMini('x','X 問題規模',`X${r.x}`,r.labels.x,r.reasons.x)}
        ${axisMini('y','Y 意識維度',`Y${r.y}`,r.labels.y,r.reasons.y)}
        ${axisMini('z','Z 整合程度',`Z${r.z}`,r.labels.z,r.reasons.z)}
      </div>
      ${positionNarrative(r)}
      <p class="summary-body">${escapeHtml(r.card.insight)}</p>
      <div class="today">今天先做：${escapeHtml(r.card.next)}</div>
      <div class="confidence-row">
        <span class="confidence-pill">信心度 ${r.confidence}%</span>
        <span class="confidence-pill">建議每次只移動 ±1 格</span>
      </div>`;


    $('neighborBox').innerHTML = `
      <p class="card-kicker">Nearby Coordinates</p>
      <h3>相近位置參考</h3>
      <div class="neighbor-list">${r.neighbors.map(n=>`
        <div class="neighbor-card">
          <b>${escapeHtml(n.tag)}｜X${n.x} Y${n.y} Z${n.z}</b>
          <span>${escapeHtml(n.name)}：${escapeHtml(n.next)}</span>
        </div>`).join('')}</div>`;

    $('resultPanel').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function axisMini(cls,title,coord,label,reason){
    return `<div class="axis-mini ${cls}"><span class="label">${escapeHtml(title)}</span><b>${escapeHtml(coord)}</b><p>${escapeHtml(label)}</p><p>${escapeHtml(reason)}</p></div>`;
  }
  function renderAIPlaceholder(afterAnalyze=false){
    const configured = window.ACS_AI.hasEndpoint();
    $('aiBox').hidden = false;
    $('aiBox').innerHTML = `
      <p class="card-kicker">AI Extension</p>
      <h3>AI 延伸輔助卡</h3>
      <div class="offline-note">
        ${configured
          ? 'AI 已設定。完成定位後，這裡會顯示 AI 的文字整合。'
          : 'AI：未設定。這不影響本機定位；若想要更自然的文字整合，請到「AI 設定」貼上 Serverless API URL。'}
      </div>
      ${afterAnalyze ? '<p class="tiny-note">目前顯示的是本機規則結果。這是備援，不是錯誤。</p>' : ''}`;
  }

  function renderAIBox(ai, state='ready'){
    $('aiBox').hidden = false;
    const reasons = ai.coordinate_reason || {};
    const title = state==='loading' ? 'AI 延伸輔助卡｜整合中' : state==='error' ? 'AI 延伸輔助卡｜暫時不可用' : 'AI 延伸輔助卡';
    $('aiBox').innerHTML = `
      <p class="card-kicker">AI Extension</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(ai.summary || '')}</p>
      ${(reasons.x || reasons.y || reasons.z) ? `<div class="offline-note" style="margin-top:10px"><strong>AI 對座標的看法</strong><br>${escapeHtml([reasons.x,reasons.y,reasons.z].filter(Boolean).join(' '))}</div>` : ''}
      ${ai.suggestions?.length ? `<strong style="display:block;margin-top:12px">延伸建議</strong><ul>${ai.suggestions.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
      ${ai.higher_self ? `<div class="today">${escapeHtml(ai.higher_self)}</div>` : ''}
      ${ai.caution ? `<p class="tiny-note">${escapeHtml(ai.caution)}</p>` : ''}`;
  }

  function saveCurrent(){
    if(!currentResult){ alert('還沒有定位結果。'); return; }
    const list = loadHistory();
    list.unshift({
      result: currentResult,
      ai: lastAI,
      input: $('stateInput').value,
      note: $('noteInput').value,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem('acs_history', JSON.stringify(list.slice(0,30)));
    renderHistory();
    alert('已儲存到本機瀏覽器。');
  }

  function loadHistory(){
    try{return JSON.parse(localStorage.getItem('acs_history') || '[]');}
    catch{return [];}
  }

  function renderHistory(){
    const list = loadHistory();
    if(!list.length){
      $('historyList').innerHTML = '<div class="empty">尚無紀錄。完成定位後可以儲存。</div>';
      return;
    }
    $('historyList').innerHTML = list.map((item, idx)=>{
      const r = item.result;
      const date = new Date(item.savedAt || r.createdAt).toLocaleString('zh-TW',{month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
      return `<div class="history-item" data-i="${idx}">
        <div class="history-item-top"><span>${date}</span><span>X${r.x} Y${r.y} Z${r.z}</span></div>
        <b>${escapeHtml(r.card.name)}</b>
        <p>${escapeHtml(item.input || r.input || '')}</p>
      </div>`;
    }).join('');
    Array.from(document.querySelectorAll('.history-item')).forEach(el=>el.addEventListener('click', ()=>loadHistoryItem(Number(el.dataset.i))));
  }

  function loadHistoryItem(i){
    const item = loadHistory()[i];
    if(!item) return;
    currentResult = item.result;
    lastAI = item.ai || null;
    $('stateInput').value = item.input || item.result.input || '';
    $('noteInput').value = item.note || item.result.note || '';
    renderResult(currentResult);
    buildCoordSvg(currentResult);
    if(lastAI) renderAIBox(lastAI); else renderAIPlaceholder(true);
  }

  function clearHistory(){
    if(confirm('確定清空本機紀錄？')){
      localStorage.removeItem('acs_history');
      renderHistory();
    }
  }

  function reset(){
    currentResult = null;
    lastAI = null;
    $('stateInput').value = '';
    $('noteInput').value = '';
    $('resultPanel').hidden = true;
    buildCoordSvg();
    renderAIPlaceholder();
    $('coordHint').textContent = '輸入後，會以標準 XYZ 立體座標亮起你的位置。';
  }

  function openSettings(){
    $('endpointInput').value = window.ACS_AI.getEndpoint();
    $('settingsDialog').showModal();
  }

  function saveSettings(){
    window.ACS_AI.setEndpoint($('endpointInput').value);
    updateAIStatus();
    renderAIPlaceholder();
    $('settingsDialog').close();
  }

  function clearSettings(){
    window.ACS_AI.setEndpoint('');
    $('endpointInput').value = '';
    updateAIStatus();
    renderAIPlaceholder();
  }

  function updateAIStatus(){
    if(window.ACS_AI.hasEndpoint()) renderAIStatus('AI 已設定','ready');
    else renderAIStatus('AI 未設定','');
  }

  function renderAIStatus(text, cls){
    const el = $('aiStatus');
    el.textContent = text;
    el.className = 'status-pill';
    if(cls) el.classList.add(cls);
  }

  function buildCoordSvg(r){
    const svg = $('coordSvg');
    const O = {x:208, y:210};
    const step = 18;
    const dirs = {
      x:{dx: 1.18, dy: 0.68, c:'#ff84d8', label:'X', name:'問題規模'},
      y:{dx: 0.00, dy:-1.48, c:'#90d6ff', label:'Y', name:'意識維度'},
      z:{dx:-1.18, dy: 0.68, c:'#a7e88b', label:'Z', name:'整合程度'}
    };
    const vec = (axis, lv)=>({x: dirs[axis].dx * step * lv, y: dirs[axis].dy * step * lv});
    const add = (...pts)=>pts.reduce((a,b)=>({x:a.x+b.x,y:a.y+b.y}), {x:0,y:0});
    const pt = (x=0,y=0,z=0)=>add(O, vec('x',x), vec('y',y), vec('z',z));
    const tx = (p, text, attrs='')=>`<text x="${p.x}" y="${p.y}" ${attrs}>${text}</text>`;
    const line = (a,b,stroke,extra='')=>`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" ${extra}/>`;
    const poly = (pts, stroke, fill, extra='')=>`<polygon points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" stroke="${stroke}" fill="${fill}" ${extra}/>`;

    const floor = [pt(0,0,0), pt(6,0,0), pt(6,0,6), pt(0,0,6)];
    const top = [pt(0,6,0), pt(6,6,0), pt(6,6,6), pt(0,6,6)];

    svg.innerHTML = `
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b"></feGaussianBlur>
          <feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0" stop-color="rgba(255,255,255,.75)"></stop>
          <stop offset="1" stop-color="rgba(255,255,255,0)"></stop>
        </radialGradient>
        <linearGradient id="frameGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="rgba(255,255,255,.18)"></stop>
          <stop offset="1" stop-color="rgba(255,255,255,.06)"></stop>
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="392" height="352" rx="28" fill="url(#frameGlow)" stroke="rgba(255,255,255,.15)"></rect>
      ${poly(floor, 'rgba(255,255,255,.12)', 'rgba(255,255,255,.03)', 'stroke-dasharray="4 6"')}
      ${poly(top, 'rgba(255,255,255,.10)', 'rgba(255,255,255,.02)', 'stroke-dasharray="4 6"')}
      ${line(floor[0], top[0], 'rgba(255,255,255,.10)', 'stroke-dasharray="4 6"')}
      ${line(floor[1], top[1], 'rgba(255,255,255,.10)', 'stroke-dasharray="4 6"')}
      ${line(floor[2], top[2], 'rgba(255,255,255,.10)', 'stroke-dasharray="4 6"')}
      ${line(floor[3], top[3], 'rgba(255,255,255,.10)', 'stroke-dasharray="4 6"')}
      <circle cx="${O.x}" cy="${O.y}" r="18" fill="url(#coreGlow)" opacity=".60"></circle>
    `;

    // floor guide lines
    for(let i=1;i<=6;i++){
      svg.insertAdjacentHTML('beforeend', line(pt(i,0,0), pt(i,0,6), 'rgba(255,255,255,.08)', 'stroke-dasharray="3 7"'));
      svg.insertAdjacentHTML('beforeend', line(pt(0,0,i), pt(6,0,i), 'rgba(255,255,255,.08)', 'stroke-dasharray="3 7"'));
    }
    // horizontal y planes
    for(let i=1;i<=6;i++){
      svg.insertAdjacentHTML('beforeend', poly([pt(0,i,0), pt(6,i,0), pt(6,i,6), pt(0,i,6)], 'rgba(255,255,255,.06)', 'none', 'stroke-dasharray="3 8"'));
    }

    // axes
    const axisEnds = { x: pt(7.25,0,0), y: pt(0,7.25,0), z: pt(0,0,7.25) };
    ['x','y','z'].forEach(axis=>{
      const d = dirs[axis];
      svg.insertAdjacentHTML('beforeend', line(O, axisEnds[axis], d.c, 'stroke-width="3.4" stroke-linecap="round"'));
      for(let lv=1; lv<=7; lv++){
        const p = axis==='x' ? pt(lv-1,0,0) : axis==='y' ? pt(0,lv-1,0) : pt(0,0,lv-1);
        const active = r && r[axis]===lv;
        svg.insertAdjacentHTML('beforeend', `<circle cx="${p.x}" cy="${p.y}" r="${active?8.5:5.2}" fill="${d.c}" opacity="${active?1:.68}" ${active?'filter="url(#glow)"':''}></circle>`);
        const offset = axis==='x' ? {x:10, y:18} : axis==='y' ? {x:12, y:5} : {x:-18, y:18};
        svg.insertAdjacentHTML('beforeend', tx({x:p.x+offset.x, y:p.y+offset.y}, String(lv), 'fill="rgba(255,255,255,.80)" font-size="12" font-weight="700"'));
      }
      const labelPos = axis==='x' ? {x:axisEnds[axis].x+8, y:axisEnds[axis].y+10, a:'start'} : axis==='y' ? {x:axisEnds[axis].x, y:axisEnds[axis].y-14, a:'middle'} : {x:axisEnds[axis].x-8, y:axisEnds[axis].y+12, a:'end'};
      svg.insertAdjacentHTML('beforeend', tx({x:labelPos.x,y:labelPos.y}, d.label, `text-anchor="${labelPos.a}" fill="${d.c}" font-size="26" font-weight="800" filter="url(#glow)"`));
      svg.insertAdjacentHTML('beforeend', tx({x:labelPos.x, y:labelPos.y+18}, d.name, `text-anchor="${labelPos.a}" fill="rgba(255,255,255,.78)" font-size="11"`));
    });

    // origin label
    svg.insertAdjacentHTML('beforeend', tx({x:O.x, y:O.y+32}, '原點', 'text-anchor="middle" fill="rgba(255,255,255,.64)" font-size="11"'));

    if(r){
      const xIndex = r.x - 1;
      const yIndex = r.y - 1;
      const zIndex = r.z - 1;
      const px = pt(xIndex,0,0);
      const py = pt(0,yIndex,0);
      const pz = pt(0,0,zIndex);
      const base = pt(xIndex,0,zIndex);
      const point = pt(xIndex,yIndex,zIndex);
      const topX = pt(xIndex,yIndex,0);
      const topZ = pt(0,yIndex,zIndex);

      svg.insertAdjacentHTML('beforeend', `
        ${poly([O, px, base, pz], 'rgba(255,255,255,.24)', 'rgba(255,255,255,.06)', 'stroke-dasharray="4 5"')}
        ${line(base, point, 'rgba(255,255,255,.40)', 'stroke-width="2"')}
        ${line(topX, point, 'rgba(255,255,255,.26)', 'stroke-dasharray="4 5"')}
        ${line(topZ, point, 'rgba(255,255,255,.26)', 'stroke-dasharray="4 5"')}
        ${line(py, point, 'rgba(255,255,255,.26)', 'stroke-dasharray="4 5"')}
        <circle cx="${base.x}" cy="${base.y}" r="7" fill="rgba(255,255,255,.22)"></circle>
        <circle cx="${point.x}" cy="${point.y}" r="11" fill="#ffe8ad" filter="url(#glow)"></circle>
        ${tx({x:Math.min(350, point.x+16), y:Math.max(36, point.y-10)}, `現在｜X${r.x} Y${r.y} Z${r.z}`, 'fill="#fff5d6" font-size="13" font-weight="700"')}
      `);
    }
  }

  function drawStars(){
    const canvas = $('starCanvas');
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize(){
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      stars = Array.from({length: 90}, ()=>({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: Math.random()*1.45 + 0.25,
        a: Math.random()*0.28 + 0.10,
        s: Math.random()*0.015 + 0.003,
        h: Math.random()
      }));
    }

    function tick(t){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      stars.forEach(st=>{
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        const hue = st.h > .72 ? '255,236,185' : st.h > .42 ? '255,220,240' : '255,255,255';
        ctx.fillStyle = `rgba(${hue}, ${st.a + Math.sin(t*st.s)*0.10})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }

    addEventListener('resize', resize);
    resize();
    requestAnimationFrame(tick);
  }

  function escapeHtml(s){
    return String(s || '').replace(/[&<>'"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
