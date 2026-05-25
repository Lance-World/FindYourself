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
      $('coordHint').textContent=`目前位置：X${currentResult.x} / Y${currentResult.y} / Z${currentResult.z}`;
      if(window.ACS_AI.hasEndpoint()){
        renderAIStatus('AI 整合中…','ready');
        try{
          lastAI=await window.ACS_AI.enhanceWithAI(input,currentResult);
          renderAIBox(lastAI);
          renderAIStatus('AI 已啟用','ready');
        }catch(err){
          renderAIStatus('AI 失敗，保留本機結果','error');
          renderAIBox({summary:'AI 暫時無法整合，已保留本機定位結果。',suggestions:['先使用本機建議。','稍後檢查 Serverless URL、CORS 或 API key。'],higher_self:'工具可以壞掉，但你不用跟著壞掉。先回到下一個小動作。',caution:String(err.message||err)});
        }
      }
    }catch(err){ alert(err.message||String(err)); }
    finally{ btn.disabled=false; btn.textContent='✦ 開始定位'; }
  }

  function renderResult(r){
    $('resultPanel').hidden=false;
    $('axisChips').innerHTML=`
      <span class="axis-chip x">X${r.x}｜${r.labels.x}</span>
      <span class="axis-chip y">Y${r.y}｜${r.labels.y}</span>
      <span class="axis-chip z">Z${r.z}｜${r.labels.z}</span>
      <span class="axis-chip conf">信心度 ${r.confidence}%</span>`;
    $('mainResult').innerHTML=`
      <h3>${escapeHtml(r.card.name)}</h3>
      <p>${escapeHtml(r.card.cue)}</p>
      <p style="margin-top:10px">${escapeHtml(r.card.insight)}</p>
      <div class="today">今天先做：${escapeHtml(r.card.next)}</div>`;
    $('insightGrid').innerHTML=`
      ${insightCard('X 軸判斷', r.reasons.x, 'x')}
      ${insightCard('Y 軸判斷', r.reasons.y, 'y')}
      ${insightCard('Z 軸判斷', r.reasons.z, 'z')}
      ${insightCard('身體面向', r.card.body)}
      ${insightCard('心理面向', r.card.mind)}
      ${insightCard('高我提醒', r.card.spirit)}`;
    $('neighborBox').innerHTML=`
      <h3>相近位置</h3>
      <div class="neighbor-list">${r.neighbors.map(n=>`
        <div class="neighbor-card">
          <b>${escapeHtml(n.tag)}｜X${n.x} Y${n.y} Z${n.z}</b>
          <span>${escapeHtml(n.name)}：${escapeHtml(n.next)}</span>
        </div>`).join('')}</div>`;
    $('resultPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function insightCard(title, body){
    return `<div class="insight-card"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>`;
  }

  function renderAIBox(ai){
    $('aiBox').hidden=false;
    const reasons=ai.coordinate_reason||{};
    $('aiBox').innerHTML=`
      <h3>AI 文字整合</h3>
      <p>${escapeHtml(ai.summary||'')}</p>
      ${(reasons.x||reasons.y||reasons.z)?`<div class="insight-card" style="margin-top:10px"><strong>AI 對座標的看法</strong><p>${escapeHtml([reasons.x,reasons.y,reasons.z].filter(Boolean).join(' '))}</p></div>`:''}
      ${ai.suggestions?.length?`<strong style="display:block;margin-top:12px">建議</strong><ul>${ai.suggestions.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>`:''}
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
    if(lastAI) renderAIBox(lastAI); else $('aiBox').hidden=true;
  }
  function clearHistory(){
    if(confirm('確定清空本機紀錄？')){localStorage.removeItem('acs_history');renderHistory();}
  }
  function reset(){
    currentResult=null;lastAI=null;
    $('stateInput').value='';$('noteInput').value='';$('resultPanel').hidden=true;$('aiBox').hidden=true;
    buildCoordSvg();$('coordHint').textContent='輸入後，X / Y / Z 三軸位置會亮起。';
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
    $('settingsDialog').close();
  }
  function clearSettings(){
    window.ACS_AI.setEndpoint('');
    $('endpointInput').value='';
    updateAIStatus();
  }
  function updateAIStatus(){
    if(window.ACS_AI.hasEndpoint()) renderAIStatus('AI 已設定','ready');
    else renderAIStatus('AI 未設定','');
  }
  function renderAIStatus(text,cls){
    const el=$('aiStatus'); el.textContent=text; el.className='status-pill'; if(cls) el.classList.add(cls);
  }

  function buildCoordSvg(r){
    const svg=$('coordSvg');
    const O={x:150,y:215}, step=18;
    const dirs={x:{dx:2.25,dy:.55,c:'#c084fc',label:'X'},y:{dx:0,dy:-2.25,c:'#f472b6',label:'Y'},z:{dx:-1.72,dy:.62,c:'#34d399',label:'Z'}};
    const p=(ax,lv)=>({x:O.x+dirs[ax].dx*step*(lv-1),y:O.y+dirs[ax].dy*step*(lv-1)});
    svg.innerHTML=`<defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    svg.insertAdjacentHTML('beforeend',`<circle cx="${O.x}" cy="${O.y}" r="92" fill="none" stroke="rgba(255,255,255,.04)"/><circle cx="${O.x}" cy="${O.y}" r="56" fill="none" stroke="rgba(255,255,255,.05)"/>`);
    Object.keys(dirs).forEach(ax=>{
      const end=p(ax,7.8), d=dirs[ax];
      svg.insertAdjacentHTML('beforeend',`<line x1="${O.x}" y1="${O.y}" x2="${end.x}" y2="${end.y}" stroke="${d.c}" stroke-opacity=".72" stroke-width="2" stroke-dasharray="5 5"/>`);
      for(let lv=1;lv<=7;lv++){
        const q=p(ax,lv), active=r && r[ax]===lv;
        svg.insertAdjacentHTML('beforeend',`<circle cx="${q.x}" cy="${q.y}" r="${active?7:3}" fill="${d.c}" opacity="${active?1:.45}" filter="${active?'url(#glow)':''}"/>`);
        const off=ax==='y'?[-16,-8]:(ax==='x'?[0,16]:[-22,16]);
        svg.insertAdjacentHTML('beforeend',`<text x="${q.x+off[0]}" y="${q.y+off[1]}" fill="rgba(255,255,255,.55)" font-size="10">${lv}</text>`);
      }
      svg.insertAdjacentHTML('beforeend',`<text x="${end.x}" y="${end.y-8}" fill="${d.c}" font-size="15" font-weight="700">${d.label}</text>`);
    });
    if(r){
      const px=p('x',r.x), py=p('y',r.y), pz=p('z',r.z);
      svg.insertAdjacentHTML('beforeend',`<circle cx="${(px.x+py.x+pz.x)/3}" cy="${(px.y+py.y+pz.y)/3}" r="10" fill="#fbbf24" filter="url(#glow)"/><text x="${(px.x+py.x+pz.x)/3+14}" y="${(px.y+py.y+pz.y)/3+4}" fill="#fbbf24" font-size="13">現在</text>`);
    }
  }

  function drawStars(){
    const canvas=$('starCanvas'),ctx=canvas.getContext('2d'); let stars=[];
    function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;stars=Array.from({length:130},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.4+.2,a:Math.random()*0.5+0.15,s:Math.random()*0.02+0.005}));}
    function tick(t){ctx.clearRect(0,0,canvas.width,canvas.height);stars.forEach(st=>{ctx.beginPath();ctx.arc(st.x,st.y,st.r*devicePixelRatio,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${st.a + Math.sin(t*st.s)*0.15})`;ctx.fill();});requestAnimationFrame(tick)}
    addEventListener('resize',resize);resize();requestAnimationFrame(tick);
  }

  function escapeHtml(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  document.addEventListener('DOMContentLoaded',init);
})();
