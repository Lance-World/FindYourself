(function(){
  const W = {
    x:[
      ['身體','胸口','胃','頭','肩','腰','痛','痠','累','睡','呼吸','緊繃','發抖','麻','心跳'],
      ['焦慮','害怕','難過','生氣','委屈','孤單','羞恥','不安','恐懼','煩','崩潰','壓力'],
      ['模式','習慣','總是','每次','逃避','討好','拖延','自責','完美','不值得','配得','慣性'],
      ['主管','同事','朋友','伴侶','對方','關係','互動','溝通','被問','被罵','權威','界線','衝突'],
      ['家','爸','媽','父親','母親','原生','童年','兄弟','姊妹','家庭','家族','小時候'],
      ['公司','制度','社會','文化','工作','職場','績效','期待','主流','穩定','金錢','階級'],
      ['人生','意義','存在','自由','靈魂','死亡','宇宙','命運','活著','使命','價值','本質']
    ],
    y:[
      ['我就是','只有','現在','當下','受不了','不行','好煩','想逃','不知道'],
      ['都是','一定','不是','就是','對錯','爛','壞','應該','不應該','永遠','完全'],
      ['因為','所以','可能','有關','導致','觸發','連結','影響','原因','以前'],
      ['核心','底層','信念','本質','根源','真正','課題','防衛','保護機制'],
      ['我要','我可以','怎麼做','設計','選擇','練習','下一步','準備','調整'],
      ['系統','循環','連動','結構','整體','同時','脈絡','資源','策略'],
      ['意義','洞見','靈魂','功課','使命','自由','人生','高我','轉化','學會']
    ],
    z:[
      ['爆炸','崩潰','受不了','很想逃','當機','淹沒','快不行','慌','恐慌'],
      ['我知道我','我現在','感覺','命名','說得出','覺察','發現'],
      ['理解','看見','知道','可能跟','模式','原因','原來','意識到'],
      ['接納','允許','不評判','不是我的全部','可以存在','和解','溫柔'],
      ['選擇','可以先','下一步','小事','行動','界線','回覆','調整'],
      ['練習','持續','穩定','流程','習慣','每天','每週','方法'],
      ['轉化','分享','陪伴','整理成','幫助別人','智慧','整合']
    ]
  };

  function normalize(text){return String(text||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function scoreAxis(text, groups){
    const scores = groups.map((words,idx)=>{
      let score=0;
      for(const w of words){
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const matches = text.match(new RegExp(escaped,'g'));
        if(matches) score += matches.length * (w.length>=2?2:1);
      }
      score += idx*0.04;
      return score;
    });
    let best=0;
    scores.forEach((s,i)=>{ if(s>scores[best]) best=i; });
    const total=scores.reduce((a,b)=>a+b,0);
    return {level:best+1,scores,total};
  }
  function confidence(parts, text){
    const base = Math.min(26, text.length/7);
    const spread = parts.reduce((acc,p)=>{
      const sorted=[...p.scores].sort((a,b)=>b-a);
      return acc + Math.max(0,(sorted[0]||0)-(sorted[1]||0));
    },0);
    const total = parts.reduce((acc,p)=>acc+p.total,0);
    return Math.max(38,Math.min(92,Math.round(42 + base + total*1.6 + spread*2.4)));
  }
  function analyzeLocal(rawText, note=''){
    const text = normalize(`${rawText} ${note}`);
    if(!text) throw new Error('請先輸入一段狀態。');
    const px=scoreAxis(text,W.x), py=scoreAxis(text,W.y), pz=scoreAxis(text,W.z);
    const x=px.level, y=py.level, z=pz.level;
    const card = window.ACS_CARDS.getCard(x,y,z);
    return {
      source:'local', input:rawText, note,
      x,y,z, confidence:confidence([px,py,pz], text),
      labels:{x:window.ACS_CARDS.XL[x-1],y:window.ACS_CARDS.YL[y-1],z:window.ACS_CARDS.ZL[z-1]},
      card,
      reasons:{
        x:`文字較明顯指向「${window.ACS_CARDS.XL[x-1]}」脈絡。`,
        y:`語氣較接近「${window.ACS_CARDS.YL[y-1]}」的理解方式。`,
        z:`目前整合程度落在「${window.ACS_CARDS.ZL[z-1]}」附近。`
      },
      neighbors:window.ACS_CARDS.getNeighbors(x,y,z),
      createdAt:new Date().toISOString()
    };
  }
  window.ACS_ANALYZER = { analyzeLocal };
})();
