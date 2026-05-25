(function(){
  const XL = [
    '身體當下','情緒心理','個人模式','關係互動','家庭成長','社會文化','存在哲學'
  ];
  const YL = [
    '單一反應','二元對立','因果連結','探索核心','主動創造','系統整合','意義洞見'
  ];
  const ZL = [
    '被情緒吞沒','命名覺察','理解洞察','接納允許','主動選擇','穩定練習','轉化分享'
  ];

  const xTheme = {
    1:{name:'身體訊號',cue:'身體正在先替你說話。'},
    2:{name:'情緒訊息',cue:'情緒不是麻煩，它是需求的入口。'},
    3:{name:'模式回路',cue:'你正在看見自己反覆走進的路。'},
    4:{name:'關係鏡子',cue:'互動裡的壓力，照見了你的界線與需求。'},
    5:{name:'家庭印記',cue:'過去的關係語言，可能還在今天運作。'},
    6:{name:'文化拉扯',cue:'你正在分辨自己與外界期待的距離。'},
    7:{name:'存在提問',cue:'這已經不是單一事件，而是你如何活著的問題。'}
  };

  const yVerb = {
    1:'正在承受',2:'正在對立',3:'開始理解',4:'深入核心',5:'主動設計',6:'整合系統',7:'提煉意義'
  };

  const zTone = {
    1:'先穩住身體，不急著解決。',
    2:'先把它說清楚，命名就是開始。',
    3:'你已經看見線索，接下來要避免過度分析。',
    4:'接納不是放任，而是不再羞辱自己。',
    5:'選一個小動作，比想通全部更重要。',
    6:'保持練習，讓新路徑慢慢變熟。',
    7:'把經驗轉成智慧，但不要急著拯救任何人。'
  };

  function clamp(n){return Math.max(1,Math.min(7,Number(n)||1));}
  function key(x,y,z){return `${clamp(x)}-${clamp(y)}-${clamp(z)}`;}

  function getCard(x,y,z){
    x=clamp(x);y=clamp(y);z=clamp(z);
    const theme=xTheme[x];
    const name = `${theme.name}｜${yVerb[y]}`;
    return {
      key:key(x,y,z), x,y,z,
      name,
      cue:theme.cue,
      insight:`你現在主要落在「${XL[x-1]}」的脈絡，並以「${YL[y-1]}」的方式理解它；整合程度接近「${ZL[z-1]}」。這不是評分，而是一張地圖：它幫你看見下一步該小一點、穩一點、真一點。`,
      next:nextAction(x,y,z),
      body:bodySuggestion(x,z),
      mind:mindSuggestion(y,z),
      spirit:spiritSuggestion(x,y,z)
    };
  }

  function nextAction(x,y,z){
    if(z<=1) return '先停 60 秒，感覺腳底、手掌與呼吸，不急著做決定。';
    if(z===2) return '用一句話命名：「我現在感到＿＿，因為我需要＿＿。」';
    if(z===3) return '寫下三欄：事件、我的反應、我真正需要的是什麼。';
    if(z===4) return '對自己說：「這個反應有原因，但我不用永遠照舊。」';
    if(z===5) return '選一個小動作：延後回覆、說明界線、或先整理資訊。';
    if(z===6) return '把這個練習固定成一個 3 分鐘流程，連續做三天。';
    return '把你的洞見整理成一段話，但先留給自己，不急著分享。';
  }

  function bodySuggestion(x,z){
    if(x===1 || z<=2) return '先把注意力放回身體：肩膀、胸口、胃、下背、腳底。你不是要立刻冷靜，而是讓身體知道「我有在」。';
    return '觀察這件事在身體哪裡留下痕跡，給它一個不超過 3 分鐘的照顧動作。';
  }
  function mindSuggestion(y,z){
    if(y<=2) return '先避免把事情切成「我爛 / 對方壞」兩邊。改問：這裡發生了什麼互動模式？';
    if(y<=4) return '你已經在分析原因，請同步問：我現在需要的是理解、休息，還是行動？';
    return '你有能力設計回應，但不要一次設計整個人生。先設計下一句話。';
  }
  function spiritSuggestion(x,y,z){
    if(z<=2) return '此刻的功課不是變得更強，而是不要在痛苦裡再次拋下自己。';
    if(y>=6 || x>=7) return '把這件事看成生命主題可以，但請記得：真正的靈性會回到今天的一個選擇。';
    return '你正在學會心口合一：看見事實，不羞辱自己；承認困難，也不放棄往前。';
  }

  function getNeighbors(x,y,z){
    x=clamp(x);y=clamp(y);z=clamp(z);
    const candidates = [
      [x,y,Math.min(7,z+1),'下一格整合'],
      [x,Math.min(7,y+1),z,'換一個理解視角'],
      [Math.max(1,x-1),y,z,'縮小問題規模'],
      [Math.min(7,x+1),y,z,'放大脈絡觀察']
    ];
    const seen=new Set();
    return candidates.filter(([a,b,c])=>{
      const k=key(a,b,c); if(seen.has(k)) return false; seen.add(k); return true;
    }).map(([a,b,c,tag])=>({...getCard(a,b,c),tag}));
  }

  window.ACS_CARDS = { XL,YL,ZL,getCard,getNeighbors,clamp,key };
})();
