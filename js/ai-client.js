(function(){
  const ENDPOINT_KEY='acs_ai_endpoint';
  function getEndpoint(){return localStorage.getItem(ENDPOINT_KEY)||'';}
  function setEndpoint(url){
    const clean=String(url||'').trim();
    if(clean) localStorage.setItem(ENDPOINT_KEY,clean);
    else localStorage.removeItem(ENDPOINT_KEY);
  }
  function hasEndpoint(){return !!getEndpoint();}

  async function enhanceWithAI(input, localResult){
    const endpoint=getEndpoint();
    if(!endpoint) throw new Error('AI endpoint is not configured.');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),22000);
    try{
      const res=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ input, localResult }),
        signal:controller.signal
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error || `AI request failed: ${res.status}`);
      return normalizeAI(data);
    }finally{
      clearTimeout(timer);
    }
  }

  function normalizeAI(data){
    const fallback={summary:'AI 已回傳，但格式不完整。',coordinate_reason:{},suggestions:[],higher_self:''};
    const ai=data.result || data;
    return {
      summary:String(ai.summary || fallback.summary),
      coordinate_reason: ai.coordinate_reason || fallback.coordinate_reason,
      suggestions:Array.isArray(ai.suggestions)?ai.suggestions.slice(0,4):[],
      higher_self:String(ai.higher_self || ''),
      caution:String(ai.caution || '')
    };
  }

  window.ACS_AI = { getEndpoint,setEndpoint,hasEndpoint,enhanceWithAI };
})();
