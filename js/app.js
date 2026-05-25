(function(){
  const $ = (id)=>document.getElementById(id);
  let currentResult=null;
  let lastAI=null;

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
    $('sampleBtn').addEventListener('click', insertSample);
    $('resetBtn').addEventListener('click', reset);
    $('saveBtn').addEventListener('click', saveCurrent);
    $('clearHistoryBtn').addEventListener('click', clearHistory);
    $('openSettingsBtn').addEventListener('click', openSettings);
    $('openInfoBtn').addEventListener('click', ()=>$('infoDialog').showModal());
    $('saveSettingsBtn').addEventListener('click', saveSettings);
    $('clearSettingsBtn').addEventListener('click', clearSettings);
  }

  async function analyze(){
    const input=$('stateInput').value.trim();
    const note=$('noteInput').value.trim();
    if(!input){ alert('先輸入一段你現在的狀態。'); return; }
    const btn=$('analyzeBtn');
    btn.disabled=true; btn.textContent='定位中…';
    try{
      currentResult=window.ACS_ANALYZER.analyzeLocal(input,note);
      lastAI=null;
      renderResult(currentResult);
      buildCoordSvg(currentResult);
      $('coordHint').textContent=`目前位置：X${currentResult.x} / Y${currentResult.y} / Z${currentResult.z}，所有座標都已收在框架內。`;
      if(window.ACS_AI.hasEndpoint()){
        renderAIStatus('AI 整合中…','ready');
        renderAIBox({summary:'AI 正在整理文字脈絡，先顯示本機定位結果。',suggestions:[],higher_self:''}, 'loading');
        try{
          lastAI=await window.ACS_AI.enhanceWithAI(input,currentResult);
          renderAIBox(lastAI, 'ready');
          renderAIStatus('AI 已連線','ready');
        }catch(err){
          renderAIStatus('AI 連線失敗，保留本機結果','error');
          renderAIBox({
            summary:'AI 暫時無法整合，已保留本機定位結果。',
            suggestions:['先使用上方的 XYZ 綜合卡。','檢查 Serverless URL、CORS、API key 或模型額度。','重新整理後再試一次。'],
            higher_self:'工具可以壞掉，但你不用跟著壞掉。先回到下一個小動作。',
            caution:String(err.message||err)
          }, 'error');
        }
      }else{
        renderAIPlaceholder(true);
      }
    }catch(err){ alert(err.message||String(err)); }
    finally{ btn.disabled=false; btn.textContent='✦ 開始定位'; }
  }

  function renderResult(r){
    $('resultPanel').hidden=false;
    $('mainResult').innerHTML=`
      <p class="card-kicker">XYZ 綜合定位卡</p>
      <h3>${escapeHtml(r.card.name)}</h3>
      <div class="axis-summary">
        ${axisMini('x','X 問題規模',`X${r.x}`,r.labels.x,r.reasons.x)}
        ${axisMini('y','Y 意識維度',`Y${r.y}`,r.labels.y,r.reasons.y)}
        ${axisMini('z','Z 整合程度',`Z${r.z}`,r.labels.z,r.reasons.z)}
      </div>
      <p class="summary-body">${escapeHtml(r.card.insight)}</p>
      <div class="today">今天先做：${escapeHtml(r.card.next)}</div>
      <div class="confidence-row">
        <span class="confidence-pill">信心度 ${r.confidence}%</span>
        <span class="confidence-pill">建議每次只移動 ±1 格</span>
      </div>`;

    $('insightGrid').innerHTML=`
      <p class="card-kicker">Body · Mind · Spirit</p>
      <h3>身心靈整合卡</h3>
      <div class="spirit-grid">
        ${spiritLine('☾','身體',r.card.body)}
        ${spiritLine('✦','心理',r.card.mind)}
        ${spiritLine('✧','高我',r.card.spirit)}
      </div>`;

    $('neighborBox').innerHTML=`
      <p class="card-kicker">Nearby Coordinates</p>
      <h3>相近位置參考</h3>
      <div class="neighbor-list">${r.neighbors.map(n=>`
        <div class="neighbor-card">
          <b>${escapeHtml(n.tag)}｜X${n.x} Y${n.y} Z${n.z}</b>
          <span>${escapeHtml(n.name)}：${escapeHtml(n.next)}</span>
        </div>`).join('')}</div>`;
    $('resultPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function axisMini(cls,title,coord,label,reason){
    return `<div class="axis-mini ${cls}"><span class="label">${escapeHtml(title)}</span><b>${escapeHtml(coord)}</b><p>${escapeHtml(label)}</p><p>${escapeHtml(reason)}</p></div>`;
  }
  function spiritLine(icon,title,body){
    return `<div class="spirit-line"><div class="spirit-ico">${icon}</div><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div></div>`;
  }

  function renderAIPlaceholder(afterAnalyze=false){
    const configured = window.ACS_AI.hasEndpoint();
    $('aiBox').hidden=false;
    $('aiBox').innerHTML=`
      <p class="card-kicker">AI Extension</p>
      <h3>AI 延伸輔助卡</h3>
      <div class="offline-note">
        ${configured ? 'AI 後端已設定。完成定位後，這裡會顯示 AI 的文字整合。' : '目前尚未連線 AI 後端；這不影響本機定位。需要更自然的文字整合時，請到「AI 設定」貼上 Serverless API URL。'}
      </div>
      ${afterAnalyze?'<p class="tiny-note">目前顯示的是本機規則結果。這是備援，不是錯誤。</p>':''}`;
  }

  function renderAIBox(ai, state='ready'){
    $('aiBox').hidden=false;
    const reasons=ai.coordinate_reason||{};
    const title = state==='loading' ? 'AI 延伸輔助卡｜整合中' : state==='error' ? 'AI 延伸輔助卡｜暫時不可用' : 'AI 延伸輔助卡';
    $('aiBox').innerHTML=`
      <p class="card-kicker">AI Extension</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(ai.summary||'')}</p>
      ${(reasons.x||reasons.y||reasons.z)?`<div class="offline-note" style="margin-top:10px"><strong>AI 對座標的看法</strong><br>${escapeHtml([reasons.x,reasons.y,reasons.z].filter(Boolean).join(' '))}</div>`:''}
      ${ai.suggestions?.length?`<strong style="display:block;margin-top:12px">延伸建議</strong><ul>${ai.suggestions.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>`:''}
      ${ai.higher_self?`<div class="today">${escapeHtml(ai.higher_self)}</div>`:''}
      ${ai.caution?`<p class="tiny-note">${escapeHtml(ai.caution)}</p>`:''}`;
  }

  function saveCurrent(){
    if(!currentResult){ alert('還沒有定位結果。'); return; }
    const list=loadHistory();
    list.unshift({result:currentResult,ai:lastAI,input:$('stateInput').value,note:$('noteInput').value,savedAt:new Date().toISOString()});
    localStorage.setItem('acs_history',JSON.stringify(list.slice(0,30)));
    renderHistory();
    alert('已儲存到本機瀏覽器。');
  }
  function loadHistory(){
    try{return JSON.parse(localStorage.getItem('acs_history')||'[]');}catch{return []}
  }
  function renderHistory(){
    const list=loadHistory();
    if(!list.length){ $('historyList').innerHTML='<div class="empty">尚無紀錄。完成定位後可以儲存。</div>'; return; }
    $('historyList').innerHTML=list.map((item,idx)=>{
      const r=item.result;
      const date=new Date(item.savedAt||r.createdAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      return `<div class="history-item" data-i="${idx}">
        <div class="history-item-top"><span>${date}</span><span>X${r.x} Y${r.y} Z${r.z}</span></div>
        <b>${escapeHtml(r.card.name)}</b><p>${escapeHtml(item.input||r.input||'')}</p>
      </div>`;
    }).join('');
    Array.from(document.querySelectorAll('.history-item')).forEach(el=>el.addEventListener('click',()=>loadHistoryItem(Number(el.dataset.i))));
  }
  function loadHistoryItem(i){
    const item=loadHistory()[i]; if(!item) return;
    currentResult=item.result; lastAI=item.ai||null;
    $('stateInput').value=item.input||item.result.input||'';
    $('noteInput').value=item.note||item.result.note||'';
    renderResult(currentResult);
    buildCoordSvg(currentResult);
    if(lastAI) renderAIBox(lastAI); else renderAIPlaceholder(true);
  }
  function clearHistory(){
    if(confirm('確定清空本機紀錄？')){localStorage.removeItem('acs_history');renderHistory();}
  }
  function reset(){
    currentResult=null;lastAI=null;
    $('stateInput').value='';$('noteInput').value='';$('resultPanel').hidden=true;
    buildCoordSvg();renderAIPlaceholder();$('coordHint').textContent='輸入後，X / Y / Z 三軸位置會亮起。';
  }
  function insertSample(){
    $('stateInput').value='主管一直問我進度，我整個人很緊繃，腦袋當機，很想逃。但我也知道這可能跟我以前面對權威時害怕被審判有關，我現在需要先站回自己。';
    $('noteInput').value='權威、緊繃、需要界線';
  }
  function openSettings(){
    $('endpointInput').value=window.ACS_AI.getEndpoint();
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
    $('endpointInput').value='';
    updateAIStatus();
    renderAIPlaceholder();
  }
  function updateAIStatus(){
    if(window.ACS_AI.hasEndpoint()) renderAIStatus('AI 已設定','ready');
    else renderAIStatus('AI 輔助可選','');
  }
  function renderAIStatus(text,cls){
    const el=$('aiStatus'); el.textContent=text; el.className='status-pill'; if(cls) el.classList.add(cls);
  }

  function buildCoordSvg(r){
    const svg=$('coordSvg');
    const O={x:190,y:205}, step=17;
    const dirs={
      x:{dx:-1.95,dy:-.70,c:'#ff7ee7',label:'X',name:'問題規模'},
      y:{dx:0,dy:-2.15,c:'#83c7ff',label:'Y',name:'意識維度'},
      z:{dx:1.90,dy:.70,c:'#9bea84',label:'Z',name:'整合程度'}
    };
    const p=(ax,lv)=>({x:O.x+dirs[ax].dx*step*(lv-1),y:O.y+dirs[ax].dy*step*(lv-1)});
    svg.innerHTML=`<defs>
      <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="core" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="rgba(255,255,255,.72)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
    </defs>`;
    svg.insertAdjacentHTML('beforeend',`
      <rect x="12" y="12" width="356" height="336" rx="28" fill="rgba(255,255,255,.055)" stroke="rgba(255,255,255,.16)"/>
      <circle cx="${O.x}" cy="${O.y}" r="88" fill="none" stroke="rgba(255,255,255,.12)"/>
      <circle cx="${O.x}" cy="${O.y}" r="56" fill="none" stroke="rgba(255,255,255,.13)"/>
      <circle cx="${O.x}" cy="${O.y}" r="24" fill="url(#core)" opacity=".55"/>
      <text x="${O.x}" y="${O.y+5}" text-anchor="middle" fill="rgba(255,255,255,.76)" font-size="12">NOW</text>`);
    Object.keys(dirs).forEach(ax=>{
      const end=p(ax,7.25), d=dirs[ax];
      svg.insertAdjacentHTML('beforeend',`<line x1="${O.x}" y1="${O.y}" x2="${end.x}" y2="${end.y}" stroke="${d.c}" stroke-opacity=".86" stroke-width="3" stroke-linecap="round"/>`);
      for(let lv=1;lv<=7;lv++){
        const q=p(ax,lv), active=r && r[ax]===lv;
        svg.insertAdjacentHTML('beforeend',`<circle cx="${q.x}" cy="${q.y}" r="${active?9:5}" fill="${d.c}" opacity="${active?1:.58}" filter="${active?'url(#glow)':''}"/>`);
        const ox = ax==='y' ? 15 : (ax==='x' ? -18 : 15);
        const oy = ax==='y' ? 4 : (ax==='x' ? 5 : 5);
        svg.insertAdjacentHTML('beforeend',`<text x="${q.x+ox}" y="${q.y+oy}" fill="rgba(255,255,255,.76)" font-size="12" font-weight="700">${lv}</text>`);
      }
      const labelOffset = ax==='y' ? {x:0,y:-20,anchor:'middle'} : ax==='x' ? {x:-10,y:-10,anchor:'end'} : {x:10,y:18,anchor:'start'};
      svg.insertAdjacentHTML('beforeend',`<text x="${end.x+labelOffset.x}" y="${end.y+labelOffset.y}" text-anchor="${labelOffset.anchor}" fill="${d.c}" font-size="22" font-weight="800" filter="url(#glow)">${d.label}</text>`);
      svg.insertAdjacentHTML('beforeend',`<text x="${end.x+labelOffset.x}" y="${end.y+labelOffset.y+18}" text-anchor="${labelOffset.anchor}" fill="rgba(255,255,255,.76)" font-size="11">${d.name}</text>`);
    });
    if(r){
      const px=p('x',r.x), py=p('y',r.y), pz=p('z',r.z);
      const cx=(px.x+py.x+pz.x)/3, cy=(px.y+py.y+pz.y)/3;
      svg.insertAdjacentHTML('beforeend',`
        <line x1="${px.x}" y1="${px.y}" x2="${py.x}" y2="${py.y}" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
        <line x1="${py.x}" y1="${py.y}" x2="${pz.x}" y2="${pz.y}" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
        <line x1="${pz.x}" y1="${pz.y}" x2="${px.x}" y2="${px.y}" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${cy}" r="12" fill="#ffe39a" filter="url(#glow)"/>
        <text x="${Math.min(326,cx+16)}" y="${cy+5}" fill="#fff3c7" font-size="13" font-weight="700">現在</text>`);
    }
  }

  function drawStars(){
    const canvas=$('starCanvas'),ctx=canvas.getContext('2d'); let stars=[];
    function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;stars=Array.from({length:155},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.7+.25,a:Math.random()*0.48+0.18,s:Math.random()*0.018+0.004,h:Math.random()}));}
    function tick(t){ctx.clearRect(0,0,canvas.width,canvas.height);stars.forEach(st=>{ctx.beginPath();ctx.arc(st.x,st.y,st.r*devicePixelRatio,0,Math.PI*2);const hue=st.h>.76?'255,232,170':st.h>.45?'255,210,235':'255,255,255';ctx.fillStyle=`rgba(${hue},${st.a + Math.sin(t*st.s)*0.14})`;ctx.fill();});requestAnimationFrame(tick)}
    addEventListener('resize',resize);resize();requestAnimationFrame(tick);
  }

  function escapeHtml(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  document.addEventListener('DOMContentLoaded',init);
})();
