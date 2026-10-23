'use strict';
/* 生息 SHENGXI · 界面层
   此刻：写一句话，或触碰一团柔软的形体；明确选择后才留下记忆痕迹。
   回望：痕迹时间线、自报感受分布、触发因素、有样本量的观察与原始记录。
   关怀：可以随时开始、暂停、结束的短练习；反馈如实保存（better / same / worse / skip）。
   个人数据与示例数据完全分开。 */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {EMO,UNNAMED,EMOTIONS,TRIG,INTENSITY,CARE_NAME,FEEDBACK,SKIP,WK,hash,fmt1,named,hasIntensity}=HH;
const {icon,bubble,traceSVG,trigIcon}=Art;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---------- 存储：沿用缓缓 v3 的 key，已有记录不丢；旧 v2 原样备份，不删除 ---------- */
const KEY='huanhuan-v3',V2='huanhuan-v2',BACKUP='huanhuan-v2-backup';
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function normalize(s){
  const box=b=>({entries:Array.isArray(b&&b.entries)?b.entries:[],sessions:Array.isArray(b&&b.sessions)?b.sessions:[]});
  return{v:3,mode:s.mode==='demo'?'demo':'personal',personal:box(s.personal),demo:s.demo?box(s.demo):null,migration:s.migration||null};
}
function load(){
  const raw=lsGet(KEY);
  if(raw){try{const s=JSON.parse(raw);if(s&&s.v===3&&s.personal)return normalize(s);}catch(e){}lsSet(KEY+'-unreadable-'+Date.now(),raw);}
  const st={v:3,mode:'personal',personal:{entries:[],sessions:[]},demo:null,migration:null};
  const old=lsGet(V2);
  if(old){
    if(!lsGet(BACKUP))lsSet(BACKUP,old);
    try{const m=HH.migrateV2(JSON.parse(old));st.personal=m.personal;st.migration={at:Date.now(),report:m.report};}
    catch(e){st.migration={at:Date.now(),error:'旧数据无法解析，已原样保留在备份里。'};}
  }
  return st;
}
let state=load();
function persist(){const ok=lsSet(KEY,JSON.stringify(state));if(!ok)toast('浏览器存储不可用，这次的记录只在当前页面保留。');return ok;}
persist();
const isDemo=()=>state.mode==='demo';
const cur=()=>isDemo()?state.demo:state.personal;
const entries=()=>cur().entries;
const sessions=()=>cur().sessions;
const sessionsFor=id=>sessions().filter(s=>s.entryId===id);
const accompaniedSet=()=>new Set(sessions().filter(s=>s.entryId).map(s=>s.entryId));
const entryById=id=>entries().find(x=>x.id===id);

const VIEWS=['now','reflect','care'],ALIAS={home:'now',journal:'reflect'},TITLE={now:'此刻',reflect:'回望',care:'关怀'};
const routeOf=h=>{h=ALIAS[h]||h;return VIEWS.includes(h)?h:'now';};
let view=routeOf(location.hash.slice(1));
let sayDraft='',composer={state:'write',id:null},period=7,listFilter='all',search='',spaceVol=.3;

/* ---------- 小工具 ---------- */
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimeout);window.toastTimeout=setTimeout(()=>t.classList.remove('show'),3800);}
function hydrate(root=document){root.querySelectorAll('[data-icon]').forEach(e=>{e.innerHTML=icon(e.dataset.icon);});}
function dayKey(d){const date=new Date(d);return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;}
function dateLabel(ts,withTime=false){const d=new Date(ts);return `${d.getMonth()+1}月${d.getDate()}日`+(withTime?` ${pad(d.getHours())}:${pad(d.getMinutes())}`:'');}
function relDay(ts){const d0=HH.sod(ts),t0=HH.sod(Date.now()),d=new Date(ts),t=`${pad(d.getHours())}:${pad(d.getMinutes())}`;if(d0===t0)return '今天 '+t;if(d0===HH.addDays(t0,-1))return '昨天 '+t;return dateLabel(ts,true);}
function todayLine(){const d=new Date();return `${d.getMonth()+1}月${d.getDate()}日 · ${WK[d.getDay()]} · ${HH.partOfDay(d.getHours())}`;}
const kindLabel=e=>e.kind==='wordless'?'无言的一刻':'文字';
const emoLabel=e=>named(e)?e.emotion:'未命名';
const firstLine=e=>e.kind==='wordless'?`无言的一刻 · ${e.durationSec||0} 秒`:(e.text||'').split('\n')[0].slice(0,40)+((e.text||'').length>40?'…':'');
const traceLabel=e=>`${relDay(e.ts)} · ${kindLabel(e)} · ${emoLabel(e)}`;
const intenDots=n=>Number.isInteger(n)?`<span class="inten-dots" aria-label="强度 ${n}/5：${INTENSITY[n-1]}">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`:'';
function ctxItems(c){if(!c)return '';const rows=[['睡眠',c.sleepHours??c.sleep,'h'],['步数',c.steps,''],['HRV',c.hrvMs??c.hrv,'ms'],['噪音',c.noiseDb??c.noise,'dB'],['天气',c.weather,'']].filter(r=>r[1]!=null);return rows.map(([k,v,u])=>`<span><em>${k}</em>${esc(v)}${u?' '+u:''}</span>`).join('');}
function inPeriod(list){return period==='all'?list.slice():HH.inRange(list,period);}
const periodText=()=>period==='all'?'全部时间':`最近 ${period} 天`;

function helpCard(compact=false){return `<section class="safety-card ${compact?'compact':''}" aria-label="需要帮助"><div class="safety-icon">${icon('shield')}</div><div><h3>需要帮助</h3><p>生息不能替代专业帮助。如果有伤害自己的念头或处于危险中，请联系信任的人，或拨打：</p><div class="hotlines"><a href="tel:12356"><b>12356</b><span>心理援助热线（中国大陆）</span></a><a href="tel:110"><b>110</b><span>遇到紧急危险</span></a><a href="tel:120"><b>120</b><span>医疗急救</span></a></div><p class="source-note">12356 是国家卫生健康委设立的全国统一心理援助热线，依据中国政府网公开信息核对（2024 年 12 月发布）。不在中国大陆时，请使用当地的服务。</p></div></section>`;}
function demoBar(){return isDemo()?`<div class="demo-bar" role="note"><span class="demo-dot" aria-hidden="true"></span><span class="demo-text"><b>示例数据</b></span><span class="demo-actions"><button class="ghost-button" data-action="demo-reset">重置<span class="dt-long">示例</span></button><button class="secondary-button small" data-action="demo-exit">退出示例</button></span></div>`:'';}

/* =========================================================
   此刻 / NOW
   ========================================================= */
function now(){
  const saved=composer.state==='saved'&&entryById(composer.id);
  return `${demoBar()}<section class="stage now-hero" id="stage" aria-label="此刻">
  <canvas class="stage-canvas" id="stage-canvas" aria-hidden="true"></canvas>
  <div class="now-grid">
    <div class="now-left">
      <p class="today">${todayLine()}</p>
      <h1 class="invite">今天，有什么<br>想留在这里的吗？</h1>
      <div class="compose" id="composer" data-state="${saved?'saved':'write'}">${saved?savedPanel(saved):writePanel()}</div>
    </div>
    <div class="now-right field" id="field">
      <div class="traces" id="traces"></div>
      <button class="orb-hit" id="orb-hit" type="button" aria-label="可交互的形体。按住并移动；使用键盘时，按住空格键并用方向键移动。松开后可选择是否留下这一刻。" aria-describedby="orb-hint orb-sub"></button>
      <div class="orb-caption" id="orb-caption">
        <p class="orb-hint" id="orb-hint" aria-live="polite"></p>
        <p class="orb-sub" id="orb-sub">按住，慢慢移动</p>
        <div class="orb-choices" id="orb-choices" hidden>
          <div class="choice-btns"><button class="secondary-button" data-action="stay-keep">留下这一刻</button><button class="ghost-button" data-action="stay-leave">不留下</button></div>
        </div>
      </div>
    </div>
  </div>
  <div class="now-foot">${soundControl()}</div>
  </section>
  <section class="now-recent" id="now-recent">${recentStrip()}</section>`;
}
function writePanel(){
  const has=!!sayDraft.trim();
  return `<div class="compose-box glass">
    <label class="sr-only" for="say">写下想留在这里的话</label>
    <textarea id="say" maxlength="2000" rows="4" placeholder="写下此刻……">${esc(sayDraft)}</textarea>
    <div class="compose-foot"><span class="composer-note" id="composer-note"></span><span class="say-count"><span id="say-count">${sayDraft.length}</span> / 2000</span></div>
  </div>
  <div class="compose-actions"><button class="primary-button big" data-action="say-keep" id="say-keep" ${has?'':'disabled'}>留在这里${icon('arrow')}</button><button class="text-link quiet" data-action="say-discard" id="say-discard" ${has?'':'disabled'}>清空</button><span class="kbd-hint">⌘ / Ctrl + Enter</span></div>`;
}
function savedPanel(e,fresh=false){
  const r=e.kind==='text'?HH.textReply(e.text):{line:'',flag:null};
  return `<div class="compose-box glass saved">
    <div class="saved-head">
      <span class="saved-trace ${fresh?'just-left':''}" id="saved-trace" data-trace="${esc(e.id)}">${traceSVG(e,{grain:false})}</span>
      <div class="saved-copy"><p class="saved-title">${icon('check','icon tiny')}已留下 · ${relDay(e.ts)}</p>${r.line?`<p class="saved-reply" role="status">${esc(r.line)}</p>`:''}
      ${r.flag==='help'?'<button class="text-link strong" data-action="help">需要帮助 →</button>':''}</div>
    </div>
    ${tagPanel(e)}
  </div>
  <div class="compose-actions"><button class="primary-button big" data-action="composer-new">${icon('pen')}写下一段</button><button class="text-link quiet" data-action="memory" data-id="${esc(e.id)}">查看</button></div>`;
}
/* 保存之后的渐进补充：全部可跳过；点一下就记下，再点一下取消；没选的保持未知 */
function tagPanel(e){
  const tn=e.triggers.length,inten=hasIntensity(e)?e.intensity:null;
  return `<div class="more" role="group" aria-labelledby="more-q">
    <p class="more-q" id="more-q">补充感受</p>
    <div class="mood-strip" role="group" aria-label="感受">${EMOTIONS.map(n=>`<button type="button" class="mood ${e.emotion===n?'selected':''}" data-action="tag-emo" data-value="${n}" aria-pressed="${e.emotion===n}">${bubble(n)}<span>${n}</span></button>`).join('')}</div>
    <div class="more-row">
      <button type="button" class="more-toggle" data-action="more-open" data-value="trig" aria-expanded="false" aria-controls="more-trig">和什么有关<span class="more-val" id="trig-val">${tn?e.triggers.join('、'):'未选'}</span></button>
      <button type="button" class="more-toggle" data-action="more-open" data-value="inten" aria-expanded="false" aria-controls="more-inten">强度<span class="more-val" id="inten-val">${inten?INTENSITY[inten-1]:'未选'}</span></button>
    </div>
    <div class="more-panel chips" id="more-trig" hidden>${TRIG.map(t=>`<button type="button" class="chip trig-chip ${e.triggers.includes(t)?'active':''}" data-action="tag-trig" data-value="${t}" aria-pressed="${e.triggers.includes(t)}">${trigIcon(t)}${t}</button>`).join('')}</div>
    <div class="more-panel inten-row" id="more-inten" hidden role="group" aria-label="强度">${[1,2,3,4,5].map(i=>`<button type="button" class="inten ${inten&&i<=inten?'on':''}" data-action="tag-inten" data-value="${i}" aria-pressed="${inten===i}" aria-label="强度 ${i}：${INTENSITY[i-1]}"><i style="--s:${8+i*3}px"></i><span>${INTENSITY[i-1]}</span></button>`).join('')}</div>
  </div>`;
}
function soundControl(){
  const on=Ambient.owner==='space';
  return `<span class="sound-ctl"><button class="sound-toggle" data-action="sound" id="sound-toggle" aria-pressed="${on}">${icon(on?'sound':'mute')}<span>${on?'声音 · 开':'声音 · 关'}</span></button><input type="range" id="space-volume" min="0" max="60" value="${Math.round(spaceVol*100)}" aria-label="环境声音量" ${on?'':'hidden'}><span class="sound-msg" id="sound-msg" role="status"></span></span>`;
}
/* 时间的口语说法：用于形体旁的记忆小卡 */
function ago(ts){const d=Math.round((HH.sod(Date.now())-HH.sod(ts))/864e5);return d<=0?'今天':d===1?'昨天':d<7?`${d} 天前`:d<14?'上周':d<31?`${Math.round(d/7)} 周前`:dateLabel(ts);}
function snippet(e,n=11){if(e.kind==='wordless')return named(e)?`无言的一刻 · ${e.emotion}`:'无言的一刻';const t=(e.text||'').replace(/\s+/g,' ');return t.length>n?t.slice(0,n)+'…':t;}
function recentStrip(){
  const list=entries().slice().sort((a,b)=>b.ts-a.ts).slice(0,3);
  if(!list.length)return isDemo()?'':`<p class="demo-invite"><button class="text-link" data-action="demo-enter">查看示例数据</button></p>`;
  return `<div class="recent-head"><h2>一些此刻的痕迹</h2><p></p><a class="text-link quiet" href="#reflect" data-view="reflect">全部记录 →</a></div>
  <div class="recent-row">${list.map(e=>`<button class="recent-card glass" data-action="memory" data-id="${esc(e.id)}" data-trace="${esc(e.id)}"><span class="recent-art">${traceSVG(e,{grain:false})}</span><span class="recent-copy"><small>${dateLabel(e.ts)}${named(e)?' · '+e.emotion:''}</small><span>${esc(snippet(e,24))}</span></span>${icon('chevR','icon tiny')}</button>`).join('')}</div>`;
}

/* ---------- 空间：挂载形体、摆放记忆痕迹 ---------- */
let stageRO=null,layoutRaf=0;
function mountSpace(){
  let lastTex=0,lastWarm=-1;const amb=$('.ambient');
  Space.mount({section:$('#stage'),canvas:$('#stage-canvas'),hit:$('#orb-hit'),
    onInteract:ev=>{
      const hint=$('#orb-hint'),sub=$('#orb-sub'),ch=$('#orb-choices');if(!hint)return;
      if(ev.type==='start'){hint.textContent='';sub.textContent='';ch.hidden=true;document.body.classList.add('orb-held');}
      else{document.body.classList.remove('orb-held');const sec=Math.max(1,Math.round(Space.peekHoldTotal()/1000));hint.textContent=`停留了 ${sec} 秒`;sub.textContent='';ch.hidden=false;}
    },
    onTexture:(h,m)=>{const n=performance.now();if(Ambient.owner==='space'&&n-lastTex>100){lastTex=n;Ambient.setTexture(h,m);}},
    onWarm:w=>{const v=Math.round(w*20)/20;if(v!==lastWarm&&amb){lastWarm=v;amb.style.setProperty('--warm',v);}}
  });
  if(stageRO)stageRO.disconnect();
  if(window.ResizeObserver){stageRO=new ResizeObserver(()=>scheduleLayout());stageRO.observe($('#stage'));}
  scheduleLayout();syncSound();
}
function scheduleLayout(){cancelAnimationFrame(layoutRaf);layoutRaf=requestAnimationFrame(()=>layoutTraces());}
/* 形体旁最多三枚记忆小卡：真实的最近记录，点开可以回看；不放装饰性的漂浮物 */
const PILL_SLOTS=[{l:'2%',t:'5%'},{r:'-1%',t:'18%'},{r:'-3%',t:'60%'}];
function layoutTraces(newId){
  const box=$('#traces');if(!box)return;
  const list=entries().slice().sort((a,b)=>b.ts-a.ts).slice(0,3),acc=accompaniedSet();
  box.innerHTML=list.map((e,i)=>{const s=PILL_SLOTS[i],pos=Object.entries(s).map(([k,v])=>({l:'left',r:'right',t:'top',b:'bottom'}[k]+':'+v)).join(';');
    return `<button class="mem-pill glass ${e.id===newId?'just-left':''}" style="${pos};--delay:-${i*3}s" data-action="memory" data-id="${esc(e.id)}" data-trace="${esc(e.id)}" aria-label="回看：${esc(traceLabel(e))}"><span class="pill-art">${traceSVG(e,{grain:false,orbit:acc.has(e.id)})}</span><span class="pill-copy"><b>${ago(e.ts)}</b><small>${esc(snippet(e))}</small></span>${icon('chevR','icon tiny')}</button>`;}).join('');
}
function refreshHome(newId){if(view!=='now')return;layoutTraces(newId);const d=$('#now-recent');if(d)d.innerHTML=recentStrip();}

/* ---------- 文字路径 ---------- */
function updateSayUI(){const ta=$('#say');if(!ta)return;sayDraft=ta.value;const c=$('#say-count');if(c)c.textContent=ta.value.length;const has=!!ta.value.trim();$('#say-keep').disabled=!has;$('#say-discard').disabled=!has;autoGrow(ta);}
function autoGrow(ta){ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight+2,window.innerWidth<640?220:280)+'px';}
function keepText(){
  const ta=$('#say');if(!ta)return;const text=ta.value.replace(/\s+$/,'');if(!text.trim())return;
  const e=HH.blankEntry({kind:'text',text});if(isDemo())e.demo=true;
  entries().push(e);if(!persist()){entries().pop();return;}
  sayDraft='';composer={state:'saved',id:e.id};
  const box=$('#composer');box.classList.add('gather');
  setTimeout(()=>{
    box.classList.remove('gather');box.dataset.state='saved';box.innerHTML=savedPanel(e,true);
    Space.pulse();refreshHome(e.id);
    const t=$('#saved-trace');if(t)setTimeout(()=>t.classList.remove('just-left'),2800);
  },reduceMotion()?0:520);
}
function discardText(){
  const ta=$('#say');if(!ta)return;$('#composer').classList.add('release');
  setTimeout(()=>{ta.value='';sayDraft='';$('#composer').classList.remove('release');updateSayUI();const n=$('#composer-note');if(n){n.textContent='已清空，未保存';n.classList.add('flash');setTimeout(()=>{if($('#composer-note')){n.textContent='';n.classList.remove('flash');}},3000);}},reduceMotion()?0:480);
}
function newComposer(focus=true){composer={state:'write',id:null};const box=$('#composer');if(!box)return;box.dataset.state='write';box.innerHTML=writePanel();if(focus)$('#say').focus();}
/* 补充标签：立即保存；只改用户点过的字段 */
function tagEntry(id,fn){const e=entryById(id);if(!e)return null;fn(e);if(e.legacy)e.legacy.intensityMayBeDefault=false;persist();return e;}
function syncTagPanel(e){
  $$('#composer [data-action="tag-emo"]').forEach(b=>{const s=b.dataset.value===e.emotion;b.classList.toggle('selected',s);b.setAttribute('aria-pressed',s);});
  $$('#composer [data-action="tag-trig"]').forEach(b=>{const s=e.triggers.includes(b.dataset.value);b.classList.toggle('active',s);b.setAttribute('aria-pressed',s);});
  const inten=hasIntensity(e)?e.intensity:null;
  $$('#composer [data-action="tag-inten"]').forEach(b=>{const i=+b.dataset.value;b.classList.toggle('on',!!inten&&i<=inten);b.setAttribute('aria-pressed',i===inten);});
  const tv=$('#trig-val'),iv=$('#inten-val');if(tv)tv.textContent=e.triggers.length?e.triggers.join('、'):'未选';if(iv)iv.textContent=inten?INTENSITY[inten-1]:'未选';
  const st=$('#saved-trace');if(st)st.innerHTML=traceSVG(e,{grain:false});
  layoutTraces();
}

/* ---------- 无言路径 ---------- */
function keepStay(){
  const ms=Space.takeHoldTotal();
  const e=HH.blankEntry({kind:'wordless',durationSec:Math.max(1,Math.round(ms/1000))});if(isDemo())e.demo=true;
  entries().push(e);persist();Space.pulse();refreshHome(e.id);
  $('#orb-choices').hidden=true;$('#orb-hint').textContent='已留下';
  $('#orb-sub').innerHTML=`<button class="text-link" data-action="annotate" data-id="${esc(e.id)}">补充感受</button>`;
  clearTimeout(window.hintT);window.hintT=setTimeout(resetHint,9000);
}
function leaveStay(){Space.takeHoldTotal();$('#orb-choices').hidden=true;$('#orb-hint').textContent='未保存';$('#orb-sub').textContent='';clearTimeout(window.hintT);window.hintT=setTimeout(resetHint,4500);}
function resetHint(){const h=$('#orb-hint');if(h&&!Space.holding&&$('#orb-choices').hidden){h.textContent='';$('#orb-sub').textContent='按住，慢慢移动';}}

/* ---------- 声音：默认静音；被拒绝时说明并保持无声 ---------- */
function syncSound(){
  const b=$('#sound-toggle');if(!b)return;const on=Ambient.owner==='space';
  b.setAttribute('aria-pressed',on);b.innerHTML=`${icon(on?'sound':'mute')}<span>${on?'声音 · 开':'声音 · 关'}</span>`;
  $('#space-volume').hidden=!on;
}
Ambient.onChange(syncSound);
function toggleSound(){
  if(Ambient.owner==='space'){Ambient.stop();return;}
  const b=$('#sound-toggle'),msg=$('#sound-msg');b.disabled=true;msg.textContent='';
  Ambient.play('space',{owner:'space',volume:spaceVol,fadeIn:3}).then(()=>{msg.textContent='';})
    .catch(()=>{msg.textContent='浏览器未允许播放声音';})
    .finally(()=>{b.disabled=false;syncSound();});
}

/* =========================================================
   回看一枚记忆 & 补充注释
   ========================================================= */
let lastMemory=null;
function openMemory(id){
  const e=entryById(id);if(!e)return;lastMemory=id;const ss=sessionsFor(id).sort((a,b)=>a.ts-b.ts);
  modal(`<div class="memory">
  <div class="memory-art">${traceSVG(e,{orbit:ss.length>0})}</div>
  <div class="eyebrow">${e.demo?'示例记录 · ':''}${dateLabel(e.ts,true)}</div>
  <h2>${e.kind==='wordless'?'无言的一刻':'留在这里的话'}</h2>
  ${e.kind==='wordless'?`<p class="memory-text quiet">停留 ${e.durationSec||0} 秒</p>`:`<blockquote class="memory-text">${esc(e.text||'（没有文字）').replace(/\n/g,'<br>')}</blockquote>`}
  <div class="memory-tags">
    ${named(e)?`<span class="tag emo">${bubble(e.emotion,'bubble tiny')}${e.emotion}${hasIntensity(e)?` · ${INTENSITY[e.intensity-1]}`:''}</span>`:'<span class="tag muted">未命名</span>'}
    ${e.triggers.map(t=>`<span class="tag">${trigIcon(t,'trig-ic sm')}${esc(t)}</span>`).join('')}
    ${e.note?`<span class="tag note">注释：${esc(e.note)}</span>`:''}
  </div>
  ${e.ctx?`<div class="ctx-strip"><span class="ctx-tag">示例数据（模拟）</span>${ctxItems(e.ctx)}</div>`:''}
  ${e.legacy&&e.legacy.intensityMayBeDefault?'<p class="small muted">旧版本记录：强度不计入统计。</p>':''}
  ${ss.length?`<div class="memory-care"><h3>相关练习</h3><ul>${ss.map(s=>`<li>${dateLabel(s.ts,true)} · ${CARE_NAME[s.activity]||s.activity}${s.seconds!=null?` · ${s.seconds<60?s.seconds+' 秒':Math.round(s.seconds/60)+' 分钟'}`:''}${s.ended==='early'?'（提前结束）':''} · ${FEEDBACK[s.feedback]?'反馈：'+FEEDBACK[s.feedback]:s.feedback===SKIP?'跳过反馈':'无反馈'}</li>`).join('')}</ul></div>`:''}
  <div class="modal-actions spread"><button class="ghost-button danger-text" data-action="delete" data-id="${esc(id)}">${icon('trash')}删除</button><span class="row-btns"><button class="secondary-button" data-action="annotate" data-id="${esc(id)}">${icon('edit')}${named(e)||e.triggers.length||e.note?'编辑':'补充感受'}</button><button class="secondary-button" data-action="accompany" data-id="${esc(id)}">${icon('care')}做个练习</button></span></div>
  </div>`,'memory');
}
let anno=null;
function openAnnotate(id){
  const e=entryById(id);if(!e)return;anno={id,emotion:e.emotion||null,intensity:hasIntensity(e)?e.intensity:null,triggers:[...e.triggers],note:e.note||''};
  modal(`<h2>补充感受</h2>
  <div class="field-label"><span>感受</span><button class="text-link" data-action="anno-clear-emo">清除</button></div>
  <div class="mood-grid" role="group" aria-label="选择感受">${EMOTIONS.map(n=>`<button type="button" class="mood ${anno.emotion===n?'selected':''}" data-action="anno-emo" data-value="${n}" aria-pressed="${anno.emotion===n}">${bubble(n)}<span>${n}</span></button>`).join('')}</div>
  <div class="field-label"><span>强度</span><span class="optional" id="anno-inten-label">${anno.intensity?INTENSITY[anno.intensity-1]:'未选择'}</span></div>
  <div class="inten-row" role="group" aria-label="强度">${[1,2,3,4,5].map(i=>`<button type="button" class="inten ${anno.intensity&&i<=anno.intensity?'on':''}" data-action="anno-inten" data-value="${i}" aria-label="强度 ${i}：${INTENSITY[i-1]}" aria-pressed="${anno.intensity===i}"><i style="--s:${8+i*3}px"></i><span>${INTENSITY[i-1]}</span></button>`).join('')}</div>
  <div class="field-label"><span>和什么有关</span><span class="optional">可多选</span></div>
  <div class="chips">${TRIG.map(t=>`<button type="button" class="chip trig-chip ${anno.triggers.includes(t)?'active':''}" data-action="anno-tag" data-value="${t}" aria-pressed="${anno.triggers.includes(t)}">${trigIcon(t)}${t}</button>`).join('')}</div>
  <div class="field-label"><label for="anno-note">注释</label></div><input id="anno-note" class="text-input" maxlength="200" value="${esc(anno.note)}">
  <div class="modal-actions"><button class="ghost-button" data-action="close">取消</button><button class="primary-button" data-action="anno-save">保存</button></div>`);
}
function syncAnno(){
  $$('[data-action="anno-emo"]').forEach(b=>{const s=b.dataset.value===anno.emotion;b.classList.toggle('selected',s);b.setAttribute('aria-pressed',s);});
  $$('[data-action="anno-inten"]').forEach(b=>{const i=+b.dataset.value;b.classList.toggle('on',!!anno.intensity&&i<=anno.intensity);b.setAttribute('aria-pressed',i===anno.intensity);});
  $('#anno-inten-label').textContent=anno.intensity?INTENSITY[anno.intensity-1]:'未选择';
}
function saveAnno(){
  const e=tagEntry(anno.id,e=>{e.emotion=anno.emotion;e.intensity=anno.intensity;e.triggers=anno.triggers;e.note=$('#anno-note').value.trim();});if(!e)return;
  closeModal();
  if(view==='now'){refreshHome();if(composer.id===e.id&&$('#composer [data-action="tag-emo"]'))syncTagPanel(e);}else render();
  toast('已保存');
}

/* =========================================================
   回望 / REFLECT —— 四个章节，逐步展开；选中一种感受时，画面变得更简单
   ========================================================= */
const rf={sel:null,ctx:null,tl:null};
const KEY_NONE='__none';
function reflect(){
  const all=entries();
  if(!all.length)return `${demoBar()}<section class="chapter ch-trace is-empty"><header class="ch-head"><div><div class="eyebrow">REFLECT · 01</div><h1>时间留下的痕迹</h1></div></header>
  <div class="empty-hero"><div class="empty-art">${traceSVG({id:'e1',kind:'text',form:{seed:11}},{grain:false})}${traceSVG({id:'e2',kind:'wordless',form:{seed:5}},{grain:false})}${traceSVG({id:'e3',kind:'text',form:{seed:23}},{grain:false})}</div><h2>还没有记录</h2><div class="row-btns center"><a class="primary-button" href="#now" data-view="now">写下第一条</a><button class="secondary-button" data-action="demo-enter">查看示例数据</button></div></div></section>`;
  const data=inPeriod(all);
  if(rf.sel&&!data.some(e=>bubbleKey(e)===rf.sel))rf.sel=null;
  return `${demoBar()}
  <section class="chapter ch-trace" id="ch-1" aria-labelledby="ch1-h"><header class="ch-head"><div><div class="eyebrow">REFLECT · 01</div><h1 id="ch1-h">时间留下的痕迹</h1></div><div class="ch-tools">${periodSeg()}<button class="ghost-button" data-action="all-records">${icon('notes')}全部记录</button></div></header>
    <div class="river-wrap reveal" id="river">${river(data)}</div></section>
  <section class="chapter ch-feel ${rf.sel?'has-sel':''}" id="ch-2" aria-labelledby="ch2-h">${chapterFeel(data)}</section>
  <section class="chapter ch-trig" id="ch-3" aria-labelledby="ch3-h">${chapterTrig(data)}</section>
  <section class="chapter ch-find" id="ch-4" aria-labelledby="ch4-h">${chapterFind(all)}</section>
  <nav class="ch-dots" aria-label="回望的章节">${[['ch-1','时间留下的痕迹'],['ch-2','你说过的感受'],['ch-3','和什么有关'],['ch-4','一些发现']].map(([id,t],i)=>`<a href="#${id}" data-chapter="${id}" aria-label="${t}"><i></i><span>${pad(i+1)} ${t}</span></a>`).join('')}</nav>`;
}
function periodSeg(){return `<div class="segmented" role="group" aria-label="时间范围">${[[7,'7 天'],[30,'30 天'],['all','全部']].map(([v,t])=>`<button data-action="period" data-value="${v}" class="${period===v?'active':''}" aria-pressed="${period===v}">${t}</button>`).join('')}</div>`;}

/* ---- 01 时间之河：按真实时间排布，保留可读的最小间距；记录少时不拉满整屏 ---- */
function openPath(pts){
  if(pts.length<2)return '';const P=i=>pts[Math.max(0,Math.min(pts.length-1,i))];let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);d+=`C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;}
  return d;
}
/* 横向位置（px）：先按真实时间比例分布在一段名义宽度里，再保证相邻两点至少 GAP 远 */
function riverLayout(list){
  const n=list.length,nr=narrowMQ.matches,GAP=nr?92:118,PAD=nr?64:110,CW=Math.min(1100,Math.max(0,(n-1)*(nr?130:170)));
  const t0=list[0].ts,t1=list[n-1].ts,span=Math.max(1,t1-t0);
  const xs=list.map(e=>PAD+(n===1?0:(e.ts-t0)/span*CW));
  for(let i=1;i<n;i++)if(xs[i]-xs[i-1]<GAP)xs[i]=xs[i-1]+GAP;
  const width=Math.max(n===1?(nr?290:380):0,xs[n-1]+PAD);
  if(n===1)xs[0]=width/2;
  return{xs,width};
}
function river(data){
  const list=data.slice().sort((a,b)=>a.ts-b.ts),n=list.length;
  if(!n)return `<div class="river-empty"><svg class="re-line" viewBox="0 0 600 60" aria-hidden="true"><path d="M10 36C150 14 300 52 450 30S580 26 590 28"/></svg><p>${periodText()}没有记录</p>${period!=='all'?'<button class="text-link quiet" data-action="period" data-value="all">查看全部</button>':''}</div>`;
  if(!rf.tl||!list.some(e=>e.id===rf.tl))rf.tl=list[n-1].id;
  const si=list.findIndex(e=>e.id===rf.tl),H=330,base=240,acc=accompaniedSet(),{xs,width}=riverLayout(list);
  const Y=i=>base+(n<3?0:Math.sin(i*1.15+.6)*22);
  const pts=[[xs[0]-100,Y(0)+6],...list.map((_,i)=>[xs[i],Y(i)]),[xs[n-1]+100,Y(n-1)-6]];
  const every=n<=10?1:Math.ceil(n/10),sel=list[si],scroll=n>=3;
  return `${scroll?`<button class="river-nav prev" data-action="river" data-value="-1" aria-label="更早的一条" ${si<=0?'disabled':''}>${icon('chevL')}</button>`:''}
  <div class="river-scroll ${scroll?'':'fixed'}" id="river-scroll"><div class="river-track" style="width:${Math.round(width)}px;height:${H}px">
    <svg class="river-line" viewBox="0 0 ${Math.round(width)} ${H}" aria-hidden="true"><defs><linearGradient id="rv-fade" gradientUnits="userSpaceOnUse" x1="${(xs[0]-100).toFixed(0)}" x2="${(xs[n-1]+100).toFixed(0)}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${Math.min(.3,90/(xs[n-1]-xs[0]+200)).toFixed(3)}" stop-color="#fff"/><stop offset="${(1-Math.min(.3,90/(xs[n-1]-xs[0]+200))).toFixed(3)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="rv-fade2" gradientUnits="userSpaceOnUse" x1="${(xs[0]-100).toFixed(0)}" x2="${(xs[n-1]+100).toFixed(0)}" y1="0" y2="0"><stop offset="0" stop-color="#c4b7e0" stop-opacity="0"/><stop offset=".3" stop-color="#c4b7e0" stop-opacity=".3"/><stop offset=".7" stop-color="#c4b7e0" stop-opacity=".3"/><stop offset="1" stop-color="#c4b7e0" stop-opacity="0"/></linearGradient></defs>
      <path d="${openPath(pts.map(([x,y])=>[x,y+16]))}" class="rl-2"/><path d="${openPath(pts)}" class="rl-1"/></svg>
    ${list.map((e,i)=>{const c=(EMO[e.emotion]||UNNAMED),isS=i===si,far=Math.abs(i-si);
      const small=!isS&&far>=3&&far%2===1&&n<=24;
      return `<div class="rv-node ${isS?'sel':''} ${named(e)?'':'unnamed'}" style="left:${xs[i].toFixed(1)}px;top:${Y(i).toFixed(1)}px">
        ${small?`<button class="rv-pill glass" data-action="river-sel" data-id="${esc(e.id)}" tabindex="-1" aria-hidden="true">${esc(snippet(e,10))}</button>`:''}
        <button class="rv-dot ${e.kind==='wordless'?'ring':''}" style="--c:${c.c};--d:${c.d}" data-action="river-sel" data-id="${esc(e.id)}" aria-pressed="${isS}" aria-label="${esc(traceLabel(e))}"></button>
        ${i%every===0||isS?`<span class="rv-date">${dateLabel(e.ts)}<small>${WK[new Date(e.ts).getDay()]} ${pad(new Date(e.ts).getHours())}:${pad(new Date(e.ts).getMinutes())}</small></span>`:''}
      </div>`;}).join('')}
    <article class="rv-card glass" style="--x:${xs[si].toFixed(1)}px;bottom:${(H-Y(si)+30).toFixed(0)}px" aria-live="polite">
      <header><span>${dateLabel(sel.ts,true)} · ${WK[new Date(sel.ts).getDay()]}</span>${named(sel)?bubble(sel.emotion,'bubble tiny'):''}</header>
      <div class="rv-body"><span class="rv-art">${traceSVG(sel,{grain:false,orbit:acc.has(sel.id)})}</span><p>${sel.kind==='wordless'?`停留 ${sel.durationSec||0} 秒`:esc((sel.text||'').length>64?(sel.text||'').slice(0,64)+'…':sel.text)}</p></div>
      <footer><span class="rv-tags">${named(sel)?`<span class="tag sm">${sel.emotion}</span>`:'<span class="tag sm muted">未命名</span>'}${sel.triggers.slice(0,2).map(t=>`<span class="tag sm">${t}</span>`).join('')}</span><button class="icon-button small" data-action="memory" data-id="${esc(sel.id)}" aria-label="回看这条记录">${icon('chevR')}</button></footer>
    </article>
  </div></div>
  ${scroll?`<button class="river-nav next" data-action="river" data-value="1" aria-label="更近的一条" ${si>=n-1?'disabled':''}>${icon('chevR')}</button>`:''}
  `;
}
function rerenderRiver(){const r=$('#river');if(!r)return;r.innerHTML=river(inPeriod(entries()));centerRiver();}
function centerRiver(){const sc=$('#river-scroll'),c=$('.rv-card');if(!sc||!c||sc.scrollWidth<=sc.clientWidth)return;const x=c.offsetLeft-sc.clientWidth/2;sc.scrollTo({left:Math.max(0,x),behavior:reduceMotion()?'auto':'smooth'});}

/* ---- 02 你说过的感受：只有命名过的感受成为气泡；没有命名的是“未命名的时刻”，单独、安静地放在一旁 ---- */
const bubbleKey=e=>named(e)?e.emotion:KEY_NONE;
/* 绝对尺寸：半径只由条数决定（场的坐标宽 800），不会为了填满空间而放大 */
const bubbleR=n=>Math.min(118,30+15*Math.sqrt(n));
const narrowMQ=matchMedia('(max-width: 639px)');
narrowMQ.addEventListener('change',()=>{if(view==='reflect'){rerenderRiver();rerenderFeel();}});
function feelMode(total){return total<=0?'none':total<=2?'few':total<=5?'some':'many';}
function chapterFeel(data){
  const st=HH.emotionStats(data),rows=st.rows.map(r=>({key:r.name,n:r.n})),namedN=data.filter(named).length,unnamed=st.unnamed,total=data.length;
  const mode=feelMode(total),showPct=namedN>=6;
  const head=`<header class="ch-head"><div><div class="eyebrow">REFLECT · 02</div><h2 id="ch2-h">你说过的感受</h2><p>选择一种感受，查看相关记录。</p></div>${total?`<div class="ch-meta"><b>${total}</b> 段记录<small>${periodText()}${namedN?` · ${namedN} 段已命名`:''}</small></div>`:''}</header>`;
  if(!total)return head+`<p class="ch-empty">${periodText()}没有记录</p>`;
  // 手机上用更窄的坐标宽度，让同样条数的气泡在小屏上保持相近的实际大小
  const narrow=narrowMQ.matches,W=narrow?400:800,H=rows.length<=(narrow?2:3)?(narrow?220:260):rows.length<=6?(narrow?400:400):(narrow?480:500);
  const bs=rows.length?(rows.length<=(narrow?3:4)?rowBubbles(rows,W,H):packBubbles(rows,W,H)):[];
  const moments=unnamed?`<button class="moments ${rf.sel===KEY_NONE?'sel':''}" data-action="feel" data-value="${KEY_NONE}" aria-pressed="${rf.sel===KEY_NONE}">${Array.from({length:Math.min(unnamed,7)},(_,i)=>`<i style="--i:${i}"></i>`).join('')}<span>${unnamed} 段未命名</span></button>`:'';
  return head+`<div class="feel-stage">
    <div class="feel-main reveal">
      ${rows.length?`<div class="feel-field mode-${mode}" style="aspect-ratio:${W}/${H}" role="group" aria-label="已命名的感受">
      ${bs.map((b,i)=>{const k=b.key,e=EMO[k],isS=rf.sel===k,pct=Math.round(b.n/namedN*100),big=b.r>=38;
        return `<button class="feel-bub ${isS?'sel':''} ${big?'':'small'}" data-action="feel" data-value="${k}" aria-pressed="${isS}" aria-label="${k}：${b.n} 段${showPct?`，占已命名的 ${pct}%`:''}" style="left:${(b.x/W*100).toFixed(2)}%;top:${(b.y/H*100).toFixed(2)}%;width:${(b.r*2/W*100).toFixed(2)}%;--i:${i}">
          ${Art.softBody(e.c,hash(k))}<span class="fb-in">${big?Art.faceSVG(k):''}<span class="fb-name">${k}</span><span class="fb-num">${showPct?`${pct}%`:`${b.n} 段`}</span></span></button>`;}).join('')}
      </div>`:`<p class="feel-none">这段时间的记录均未命名</p>`}
      ${moments}
    </div>
    <aside class="feel-panel glass" id="feel-panel" ${rf.sel?'':'hidden'} aria-live="polite">${rf.sel?feelPanel(data,rf.sel):''}</aside>
  </div>
  `;
}
/* 少量感受：一行排开，按真实大小，不放大 */
function rowBubbles(rows,W,H){
  const gap=26,tw=rows.reduce((s,r)=>s+bubbleR(r.n)*2,0)+gap*(rows.length-1);let x=W/2-tw/2;
  return rows.map((r,i)=>{const R=bubbleR(r.n),b={...r,r:R,x:x+R,y:H/2+(rows.length>2?(i%2?14:-10):0)};x+=R*2+gap;return b;});
}
function packBubbles(rows,W,H){
  const cs=rows.map(r=>Object.assign({},r,{r:bubbleR(r.n)})),placed=[];
  cs.forEach((c,i)=>{if(!i){c.x=0;c.y=0;placed.push(c);return;}
    for(let s=1;s<4000;s++){const a=s*.31,d=s*.5,x=Math.cos(a)*d,y=Math.sin(a)*d*.72;if(placed.every(p=>Math.hypot(p.x-x,p.y-y)>=p.r+c.r+12)){c.x=x;c.y=y;break;}}
    placed.push(c);});
  const x0=Math.min(...cs.map(c=>c.x-c.r)),x1=Math.max(...cs.map(c=>c.x+c.r)),y0=Math.min(...cs.map(c=>c.y-c.r)),y1=Math.max(...cs.map(c=>c.y+c.r));
  const k=Math.min(1,(W-20)/(x1-x0),(H-20)/(y1-y0)),ox=W/2-(x0+x1)/2*k,oy=H/2-(y0+y1)/2*k;
  return cs.map(c=>Object.assign(c,{x:ox+c.x*k,y:oy+c.y*k,r:c.r*k}));
}
function feelPanel(data,k){
  const es=data.filter(e=>bubbleKey(e)===k).sort((a,b)=>b.ts-a.ts),namedN=data.filter(named).length,acc=accompaniedSet();
  const wi=es.filter(hasIntensity),tc={};es.forEach(e=>e.triggers.forEach(t=>tc[t]=(tc[t]||0)+1));const tops=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const none=k===KEY_NONE,name=none?'未命名':k;
  return `<header class="fp-head">${none?'<span class="fp-moment" aria-hidden="true"></span>':bubble(k,'bubble')}<h3 class="${none?'sm':''}">${name}</h3><button class="icon-button" data-action="feel-close" aria-label="收起">${icon('close')}</button></header>
  <p class="fp-lede">${periodText()} · <b>${es.length}</b> 段${!none&&namedN>=6?` · 占已命名的 ${Math.round(es.length/namedN*100)}%`:''}${wi.length?`<br><small>平均强度 ${fmt1(HH.mean(wi.map(e=>e.intensity)))} / 5（${wi.length} 段）</small>`:''}</p>
  <div class="fp-sec"><div class="fp-sec-head"><h4>最近记录</h4>${es.length>3?`<button class="text-link quiet" data-action="all-records" data-value="${none?'unnamed':k}">查看全部 ›</button>`:''}</div>
  ${es.slice(0,3).map(e=>`<button class="fp-rec" data-action="memory" data-id="${esc(e.id)}"><span class="fp-art">${traceSVG(e,{grain:false,orbit:acc.has(e.id)})}</span><span><small>${dateLabel(e.ts,true)} · ${WK[new Date(e.ts).getDay()]}</small><span class="fp-text">${esc(e.kind==='wordless'?`无言的一刻 · ${e.durationSec||0} 秒`:e.text||'')}</span>${e.triggers.length?`<span class="fp-tags">${e.triggers.slice(0,3).map(t=>`<i>${t}</i>`).join('')}</span>`:''}</span></button>`).join('')}</div>
  ${none?'':`<div class="fp-sec"><h4>同时标记的事</h4>${tops.length?`<div class="fp-chips">${tops.map(([t,c])=>`<span class="fp-chip">${trigIcon(t,'trig-ic sm')}${t}<b>${c}</b></span>`).join('')}</div>`:'<p class="fp-note">没有标签</p>'}</div>
  <button class="ghost-button fp-go" data-action="feel-ctx" data-value="${k}">「${k}」和什么有关 ${icon('down','icon tiny')}</button>`}`;
}

/* ---- 03 和什么有关：中心是一种感受；相关的事按数量排在它周围的固定位置（px），少量时紧凑对称 ---- */
const CONS_SLOTS={1:[[270,0]],2:[[-280,0],[280,0]],3:[[-290,-60],[290,-60],[0,200]],4:[[-300,-90],[300,-90],[-260,130],[260,130]],5:[[-310,-80],[310,-80],[-250,150],[250,150],[0,-210]],6:[[-330,-110],[330,-110],[-360,70],[360,70],[-170,200],[170,200]]};
function chapterTrig(data){
  const present=EMOTIONS.filter(n=>data.some(e=>e.emotion===n));
  if(rf.ctx&&!present.includes(rf.ctx))rf.ctx=null;
  const ctx=rf.ctx,baseList=ctx?data.filter(e=>e.emotion===ctx):data,nb=baseList.length;
  const tc={};baseList.forEach(e=>e.triggers.forEach(t=>tc[t]=(tc[t]||0)+1));
  const tops=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,6),tagged=baseList.filter(e=>e.triggers.length).length;
  const c=EMO[ctx]||UNNAMED,slots=CONS_SLOTS[tops.length]||[],small=nb<6;
  const head=`<header class="ch-head"><div><div class="eyebrow">REFLECT · 03</div><h2 id="ch3-h">和什么有关</h2></div>
    ${present.length?`<div class="ctx-switch" role="group" aria-label="以哪种感受为中心"><button class="chip ${!ctx?'active':''}" data-action="feel-ctx" data-value="" aria-pressed="${!ctx}">全部</button>${present.map(n=>`<button class="chip ${ctx===n?'active':''}" data-action="feel-ctx" data-value="${n}" aria-pressed="${ctx===n}">${bubble(n,'bubble tiny')}${n}</button>`).join('')}</div>`:''}</header>`;
  if(!nb)return head+`<p class="ch-empty">${periodText()}没有记录</p>`;
  const center=`<div class="cons-center" style="--c:${c.c}">${Art.softBody(c.c,hash(ctx||'all'))}<span class="fb-in">${ctx?Art.faceSVG(ctx):''}<b>${ctx||'全部感受'}</b><small>${nb} 段记录</small></span></div>`;
  if(!tops.length)return head+`<div class="constellation n0 reveal"><div class="cons-ring" aria-hidden="true"></div>${center}<p class="cons-empty">${ctx?`「${ctx}」的记录`:'这些记录'}没有标签</p></div>`;
  return head+`<div class="constellation n${tops.length} reveal">
    <svg class="cons-lines" viewBox="-460 -260 920 520" aria-hidden="true">${slots.map(([x,y])=>`<path d="M0 0Q${(x*.5+y*.12).toFixed(0)} ${(y*.5-x*.08).toFixed(0)} ${x} ${y}"/>`).join('')}</svg>
    ${center}
    ${tops.map(([t,n],i)=>`<div class="cons-node glass" style="--dx:${slots[i][0]}px;--dy:${slots[i][1]}px;--i:${i}">${trigIcon(t)}<span><b>${t}</b><span class="cn-num">${small?`${n} 段`:`${Math.round(n/nb*100)}%`}</span><small>${n} / ${nb} 段</small></span></div>`).join('')}
  </div>
  `;
}

/* ---- 04 一些发现：最多三条，安静地写出来 ---- */
const FIND_TITLE={trigger:f=>`「${f.big}」是你最常提到的事。`,time:f=>`${f.big}，常常是同一种感受。`,comfort:f=>`选了平静或开心时，常和「${f.big}」有关。`,practice:f=>`「${f.big}」之后的反馈`,sleep:()=>`模拟睡眠与自报焦虑（示例）`};
function chapterFind(all){
  const d30=HH.inRange(all,30),f=HH.insights(d30,HH.inRange(sessions(),30),{demo:isDemo()}).slice(0,3);
  return `<header class="ch-head"><div><div class="eyebrow">REFLECT · 04</div><h2 id="ch4-h">一些发现</h2><p>最近 30 天 · ${d30.length} 段记录</p></div></header>
  ${f.length?`<div class="finds reveal">${f.map((x,i)=>`<article class="find"><div class="find-no">${pad(i+1)}<i></i>${x.simulated?'<span class="sim">模拟数据</span>':''}</div><h3>${esc((FIND_TITLE[x.key]||(()=>x.big))(x))}</h3><p>${esc(x.text)}</p>${x.caveat?`<p class="find-foot">${esc(x.caveat)}</p>`:''}</article>`).join('')}</div>`
  :`<p class="ch-empty">最近 30 天有 5 段以上记录后显示。</p>`}
  <div class="closing"><div></div><a class="primary-button big" href="#now" data-view="now">继续书写${icon('arrow')}</a></div>`;
}
/* 全部记录：从回望里打开；保留搜索、筛选、回看与删除 */
function openRecords(filter){
  if(filter)listFilter=filter;
  modal(`<div class="eyebrow">${periodText()}</div><h2>全部记录</h2>
  <div class="toolbar"><label class="search"><span class="sr-only">搜索记录</span>${icon('search')}<input id="journal-search" type="search" placeholder="搜索文字或标签" value="${esc(search)}"></label><label class="sr-only" for="journal-filter">筛选</label><select id="journal-filter" class="select-input">${filterOptions()}</select></div>
  <div class="entry-list" id="entry-list">${entryList()}</div>`,'wide');
}
function filterOptions(){
  const o=[['all','全部'],['text','文字'],['wordless','无言的一刻'],['unnamed','未命名'],...EMOTIONS.map(n=>[n,'感受：'+n]),...TRIG.map(t=>['t:'+t,'有关：'+t])];
  return o.map(([v,t])=>`<option value="${v}" ${listFilter===v?'selected':''}>${t}</option>`).join('');
}
function matchFilter(e){
  if(listFilter==='all')return true;if(listFilter==='text')return e.kind==='text';if(listFilter==='wordless')return e.kind==='wordless';
  if(listFilter==='unnamed')return !named(e);if(listFilter.startsWith('t:'))return e.triggers.includes(listFilter.slice(2));return e.emotion===listFilter;
}
function entryList(){
  const acc=accompaniedSet(),q=search.trim();
  const data=inPeriod(entries()).filter(e=>matchFilter(e)&&(!q||[e.text,e.note,...e.triggers,e.emotion].join(' ').includes(q))).sort((a,b)=>b.ts-a.ts);
  if(!data.length)return `<div class="empty-inline"><h3>${q||listFilter!=='all'?'没有匹配的记录':'这段时间没有记录'}</h3>${q||listFilter!=='all'?'<button class="secondary-button" data-action="reset-filters">清除筛选</button>':''}</div>`;
  return data.map(e=>`<article class="entry"><button class="entry-open" data-action="memory" data-id="${esc(e.id)}" aria-label="回看 ${dateLabel(e.ts,true)} 的记录">
    <span class="entry-mark">${named(e)?bubble(e.emotion):traceSVG(e,{grain:false})}</span>
    <span class="entry-body"><span class="entry-head"><span class="entry-title">${e.kind==='wordless'?'无言的一刻':emoLabel(e)}${intenDots(hasIntensity(e)?e.intensity:null)}</span><time>${relDay(e.ts)}</time></span>
    <span class="entry-text">${e.kind==='wordless'?`停留 ${e.durationSec||0} 秒`:esc(e.text||'（没有文字）')}</span>
    <span class="entry-meta">${e.kind==='wordless'&&named(e)?`<span class="tag sm">${e.emotion}</span>`:''}${e.triggers.map(t=>`<span class="tag sm">${trigIcon(t,'trig-ic xs')}${esc(t)}</span>`).join('')}${acc.has(e.id)?`<span class="tag sm sage">${icon('care','icon tiny')}做过练习</span>`:''}${e.demo?'<span class="tag sm demo">示例</span>':''}</span></span></button></article>`).join('');
}
/* 章节：滚动时逐步显现；右侧小圆点标记当前章节 */
let chapterIO=null;
function mountReflect(){
  if(chapterIO)chapterIO.disconnect();if(!window.IntersectionObserver){$$('.reveal').forEach(r=>r.classList.add('in'));return;}
  chapterIO=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;if(en.target.classList.contains('reveal'))en.target.classList.add('in');
    if(en.target.classList.contains('chapter')){$$('.ch-dots a').forEach(a=>a.classList.toggle('active',a.dataset.chapter===en.target.id));}}),{rootMargin:'-35% 0px -45% 0px'});
  $$('.reveal').forEach(r=>{const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){r.classList.add('in');io.disconnect();}},{threshold:.15});io.observe(r);});
  $$('.chapter').forEach(c=>chapterIO.observe(c));
  centerRiver();
}
function rerenderFeel(){const s=$('#ch-2');if(!s)return;const data=inPeriod(entries());s.classList.toggle('has-sel',!!rf.sel);s.innerHTML=chapterFeel(data);s.querySelectorAll('.reveal').forEach(r=>r.classList.add('in'));}
function rerenderTrig(){const s=$('#ch-3');if(!s)return;s.innerHTML=chapterTrig(inPeriod(entries()));s.querySelectorAll('.reveal').forEach(r=>r.classList.add('in'));}

/* =========================================================
   关怀 / CARE
   ========================================================= */
const activities=[
{id:'breath',title:'方块呼吸',subtitle:'吸 4 · 停 4 · 呼 4 · 停 4',category:'呼吸',minutes:1,choices:[1,3],energy:'low',kind:'breath',art:'breath',tint:'lilac',intro:'跟随形体的节奏：吸气 4 秒，屏息 4 秒，呼气 4 秒，屏息 4 秒。',steps:[]},
{id:'meditate',title:'把注意力带回此刻',subtitle:'留意身体、声音与呼吸',category:'正念片刻',minutes:3,energy:'low',kind:'steps',art:'meditate',tint:'blue',intro:'注意力移开时，把它带回呼吸。',steps:['留意身体与椅子、地面的接触。','听周围的声音。','感受一次自然的呼吸，然后再一次。']},
{id:'scan',title:'身体扫描',subtitle:'从头到脚，依次留意身体',category:'身体扫描',minutes:5,energy:'low',kind:'steps',art:'scan',tint:'sage',intro:'坐好或躺下，注意力从头顶慢慢移到脚底。',steps:['从头顶开始，留意额头和眉心是否绷着。','来到下巴和肩膀，让它们往下沉一点。','感受胸口和腹部，随呼吸起伏。','留意双腿的重量，和脚底的温度。','最后，感受整个身体被托住。']},
{id:'music',title:'无词和声',subtitle:'缓慢的和弦，和一点风声',category:'舒缓声音',minutes:3,energy:'low',kind:'sound',art:'music',tint:'lilac',intro:'缓慢变换的和弦与风声，由浏览器实时生成。',steps:[]},
{id:'rain',title:'听一会儿雨',subtitle:'持续的雨声与低沉和声',category:'舒缓声音',minutes:3,energy:'low',kind:'sound',art:'rain',tint:'blue',intro:'雨声与低沉和声，由浏览器实时生成。',steps:[]},
{id:'stretch',title:'让肩膀先下班',subtitle:'五个肩颈伸展动作',category:'轻运动',minutes:5,energy:'medium',kind:'steps',art:'stretch',tint:'peach',intro:'离开屏幕，按步骤活动肩颈。',steps:['缓缓向后绕肩 5 次，再向前绕肩 5 次。','头慢慢倒向左肩、右肩，各停 15 秒。','双手交扣向上，伸一个长长的懒腰。','坐姿前屈，让后背自然垂下。','起身走几步，让视线看看远处。']},
{id:'walk',title:'出去走一小段',subtitle:'在附近散步十分钟',category:'散步',minutes:10,energy:'medium',kind:'steps',art:'walk',tint:'sage',intro:'选一条熟悉、安全的路线。',steps:['离开座位，选择一个熟悉的地方。','先慢走两分钟，留意脚底落地的感觉。','找一找路上的五种颜色。','听一听三种不同的声音。','按自己的节奏走回去。']},
{id:'journal',title:'安静写作',subtitle:'在「此刻」写下几句话',category:'安静写作',minutes:3,energy:'low',kind:'journal',art:'journal',tint:'peach',intro:'',steps:[]}
];
const actById=id=>activities.find(a=>a.id===id);
/* 关怀插画：直接使用生产素材（assets/illustrations，透明 WebP），不再用代码画占位图 */
const CARE_ART={breath:'care_box_breathing',meditate:'care_notice_present',scan:'care_body_scan',music:'care_wordless_sound',rain:'care_listen_rain',stretch:'care_shoulder_release',walk:'care_short_walk',journal:'care_quiet_journaling',hero:'care_hero_stacked_stones'};
const careImg=(id,cls='care-img',lazy=true)=>`<img class="${cls}" src="assets/illustrations/${CARE_ART[id]}.webp" alt="" width="1254" height="1254" decoding="async" ${lazy?'loading="lazy"':''}>`;
const ACT_ICON={breath:'breath',meditate:'meditate',scan:'body',music:'wave',rain:'rain',stretch:'stretch',walk:'walk',journal:'pen'};
const CARE_FILTERS=[['all','全部'],['short','3 分钟内'],['low','静态'],['medium','活动身体']];
let careFilter='all';
const actionOf=a=>a.kind==='journal'?'journal':'activity';
function featureCard(a,reason){
  return `<button class="feature-card tint-${a.tint}" data-action="${actionOf(a)}" data-id="${a.id}">
    <span class="fc-art">${careImg(a.id,'care-img',false)}</span>
    <span class="fc-body"><span class="fc-title">${a.title}</span><span class="fc-sub">${a.subtitle}</span>
    ${reason?`<span class="fc-reason">${esc(reason)}</span>`:''}
    <span class="fc-meta">${a.kind==='journal'?'不限时':a.minutes+' 分钟'} · ${a.category}${icon('arrow','icon tiny fc-arrow')}</span></span></button>`;
}
function libRow(a){
  return `<li><button class="lib-row" data-action="${actionOf(a)}" data-id="${a.id}"><span class="lib-thumb tint-${a.tint}">${careImg(a.id)}</span><span class="lib-copy"><b>${a.title}</b><small>${a.subtitle}</small></span><span class="lib-time">${a.kind==='journal'?'不限时':a.minutes+' 分钟'}</span>${icon('chevR','icon tiny')}</button></li>`;
}
/* 陪某段记忆做练习时用的紧凑卡片 */
function toolCard(a,opt={}){
  return `<button class="lib-row" data-action="${actionOf(a)}" data-id="${a.id}" ${opt.entry?`data-entry="${esc(opt.entry)}"`:''}><span class="lib-thumb sm tint-${a.tint}">${careImg(a.id)}</span><span class="lib-copy"><b>${a.title} · ${a.minutes} 分钟</b><small>${esc(opt.reason||a.subtitle)}</small></span>${icon('chevR','icon tiny')}</button>`;
}
function care(){
  const recent=entries().filter(named).sort((a,b)=>b.ts-a.ts)[0],fresh=recent&&Date.now()-recent.ts<3*864e5;
  const recs=HH.recommend(fresh?recent.emotion:null,sessions()).filter(r=>r.id!=='breath').slice(0,2);
  const featured=new Set(['breath',...recs.map(r=>r.id)]);
  const fb=HH.feedbackStats(sessions());
  const pass=a=>careFilter==='all'||(careFilter==='short'?a.minutes<=3&&a.kind!=='journal':a.energy===careFilter);
  const rest=activities.filter(a=>!featured.has(a.id)&&pass(a));
  return `${demoBar()}<section class="care-top">
    <div class="care-copy"><div class="eyebrow">关怀 / CARE</div><h1>留一分钟，<br>只属于自己。</h1>
      <div class="row-btns"><button class="primary-button big" data-action="activity" data-id="breath">开始 1 分钟呼吸${icon('arrow')}</button><button class="secondary-button" data-action="scroll-lib">${icon('leaf')}选择其他练习</button></div>
      </div>
    <div class="care-art">${careImg('hero','care-hero-img',false)}</div>
  </section>
  <section class="lib" id="lib" aria-labelledby="lib-h">
    <div class="lib-head"><div><h2 id="lib-h">关怀练习</h2>${fresh?`<p>按你最近选的「${recent.emotion}」排序</p>`:''}</div></div>
    <div class="feature-row">${recs.map(r=>featureCard(actById(r.id),r.reason)).join('')}</div>
    <div class="lib-list-head"><h3>更多练习</h3><div class="chips" role="group" aria-label="筛选练习">${CARE_FILTERS.map(([v,t])=>`<button class="chip ${careFilter===v?'active':''}" data-action="care-filter" data-value="${v}" aria-pressed="${careFilter===v}">${t}</button>`).join('')}</div></div>
    ${rest.length?`<ul class="lib-list">${rest.map(libRow).join('')}</ul>`:`<p class="ch-empty">没有符合的练习。<button class="text-link" data-action="care-filter" data-value="all">查看全部</button></p>`}
    ${fb.n?`<p class="lib-note">练习 ${fb.n} 次 · 轻松了一点 ${fb.better} · 差不多 ${fb.same} · 还不太舒服 ${fb.worse}${fb.skip?` · 跳过 ${fb.skip}`:''}</p>`:''}
  </section>
  ${helpCard()}`;
}

/* ---------- 练习播放：随时开始、暂停、结束；只记录真实时长 ---------- */
let activeActivity=null,timer=null,running=false,started=false,tickAt=0,accumulated=0,volume=.5;
function practiceOwner(){return activeActivity?'practice-'+activeActivity.id:null;}
function stopTimer(){clearInterval(timer);timer=null;if(running&&activeActivity)accumulated+=(Date.now()-tickAt)/1000;running=false;if(practiceOwner())Ambient.stopIf(practiceOwner());}
function elapsedSec(){return accumulated+(running?(Date.now()-tickAt)/1000:0);}
function recordSession(){
  const a=activeActivity;if(!a||!started||a.sessionId)return null;
  const secs=Math.round(Math.min(a.minutes*60,elapsedSec()));
  const s={id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ts:Date.now(),activity:a.id,plannedSec:a.minutes*60,seconds:secs,ended:secs>=a.minutes*60?'complete':'early',feedback:null,entryId:a.entryId||null};
  if(isDemo())s.demo=true;sessions().push(s);persist();a.sessionId=s.id;return s;
}
function endActivity(){if(activeActivity){stopTimer();recordSession();activeActivity=null;if(view==='care')render();else if(view==='now')refreshHome();}}
function openActivity(id,opts={}){
  endActivity();const a=actById(id);if(!a)return;
  activeActivity={...a,entryId:opts.entry||null,sessionId:null};accumulated=0;started=false;running=false;playerScreen();
}
const formatTime=s=>`${pad(Math.floor(s/60))}:${pad(Math.floor(s%60))}`;
function playerScreen(){
  const a=activeActivity,e=a.entryId&&entryById(a.entryId);
  modal(`<div class="player tint-${a.tint}">
  ${e?`<div class="caring-for">${named(e)?bubble(e.emotion,'bubble tiny'):traceSVG(e,{grain:false,cls:'trace-svg tiny'})}<span>${esc(firstLine(e))}</span></div>`:''}
  <div class="player-head"><div class="eyebrow">${a.category}</div><h2>${a.title}</h2><p>${a.intro}</p></div>
  <div class="player-stage">${a.kind==='breath'?`<div class="segmented center-seg" role="group" aria-label="时长">${a.choices.map(m=>`<button data-action="dur" data-value="${m}" class="${a.minutes===m?'active':''}" aria-pressed="${a.minutes===m}">${m} 分钟</button>`).join('')}</div>
    <div class="breath-orb" id="breath-orb" aria-hidden="true"><i class="bo-sage"></i><i class="bo-peach"></i><i class="bo-body"></i><i class="bo-inner"></i></div><p class="breath-phase" id="breath-phase" aria-live="polite"></p>`
  :a.kind==='sound'?`<div class="sound-viz" id="sound-viz" aria-hidden="true">${Array.from({length:21},(_,i)=>`<i style="--h:${(30+Math.abs(Math.sin(i*1.7))*60).toFixed(0)}%;--d:${(i%7)*.13}s"></i>`).join('')}</div><div class="volume-row"><label for="volume">音量</label><input type="range" min="0" max="100" value="${Math.round(volume*100)}" id="volume"></div>`
  :`<ol class="step-list" id="step-list">${a.steps.map((s,i)=>`<li class="${i===0?'current':''}"><span>${i+1}</span><p>${s}</p></li>`).join('')}</ol>`}</div>
  <div class="player-timer"><svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" class="ring-bg"/><circle cx="24" cy="24" r="20" class="ring-fg" id="ring-fg" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg><span class="timer-value" id="timer-value" role="timer">${formatTime(a.minutes*60)}</span></div>
  <p class="timer-copy" id="timer-copy"></p>
  <div class="player-btns"><button class="primary-button" data-action="toggle-timer" id="toggle-timer">${icon('play')}${a.kind==='sound'?'开始播放':'开始'}</button><button class="secondary-button" data-action="finish" id="finish-button">结束</button></div>
  </div>`,'player');
}
function updateTimer(){
  if(!activeActivity||!$('#timer-value'))return;
  const a=activeActivity,total=a.minutes*60,el=elapsedSec(),rem=Math.max(0,total-el);
  $('#timer-value').textContent=formatTime(Math.ceil(rem));$('#ring-fg').setAttribute('stroke-dashoffset',(100-el/total*100).toFixed(2));
  if(a.kind==='breath'&&$('#breath-phase')){
    const p=el%16,ph=Math.floor(p/4),w=p%4;$('#breath-phase').textContent=`${['吸气','停一下','呼气','停一下'][ph]} · ${4-Math.floor(w)}`;
    const sc=ph===0?.74+w/4*.32:ph===1?1.06:ph===2?1.06-w/4*.32:.74;$('#breath-orb').style.setProperty('--sc',reduceMotion()?1:sc.toFixed(3));$('#breath-orb').dataset.phase=ph;
  }
  if($('#step-list')){const n=a.steps.length,c=Math.min(n-1,Math.floor(el/total*n));$$('#step-list > li').forEach((d,i)=>{d.classList.toggle('current',i===c);d.classList.toggle('done',i<c);});}
  if(rem<=0){stopTimer();accumulated=total;const t=$('#toggle-timer');t.disabled=true;t.textContent='时间到';$('#timer-copy').textContent='';const v=$('#sound-viz');v&&v.classList.remove('playing');}
}
function toggleTimer(){
  const a=activeActivity;if(!a)return;const btn=$('#toggle-timer');
  if(running){stopTimer();btn.innerHTML=`${icon('play')}继续`;if($('#breath-phase'))$('#breath-phase').textContent='已暂停';const v=$('#sound-viz');v&&v.classList.remove('playing');return;}
  started=true;running=true;tickAt=Date.now();btn.innerHTML=`${icon('pause')}暂停`;$$('[data-action="dur"]').forEach(b=>b.disabled=true);
  if(a.kind==='sound'){Ambient.play(a.id,{owner:practiceOwner(),volume}).then(()=>{const v=$('#sound-viz');v&&v.classList.add('playing');}).catch(()=>{const c=$('#timer-copy');if(c)c.textContent='浏览器未允许播放声音';});}
  timer=setInterval(updateTimer,200);updateTimer();
}
function finishActivity(){
  const a=activeActivity;if(!a)return;
  if(!started){closeModal();return;}
  stopTimer();const s=recordSession(),secs=s?s.seconds:0;
  modal(`<div class="feedback-screen"><div class="fb-art">${careImg(activeActivity?activeActivity.id:'breath','care-img',false)}</div><h2>练习结束</h2><p>感觉怎么样？</p>
  <div class="feedback-buttons"><button data-action="feedback" data-value="better">轻松了一点</button><button data-action="feedback" data-value="same">差不多</button><button data-action="feedback" data-value="worse">还不太舒服</button></div>
  <button class="ghost-button" data-action="feedback" data-value="skip">跳过</button></div>`,'feedback');
}
function feedback(v){
  const a=activeActivity;if(!a)return;const s=sessions().find(x=>x.id===a.sessionId);
  if(s){s.feedback=FEEDBACK[v]||v===SKIP?v:null;persist();}
  activeActivity=null;
  closeModal();if(view==='care')render();else refreshHome();toast(v===SKIP?'已跳过':'已记录');
}

/* ---------- 弹窗 ---------- */
let modalReturn=null;
function modal(html,kind=''){
  const m=$('#modal');if(!m.open)modalReturn=document.activeElement;
  m.className=kind?'m-'+kind:'';
  $('#modal-content').innerHTML=`<div class="modal-body"><button class="icon-button modal-close" data-action="close" aria-label="关闭">${icon('close')}</button>${html}</div>`;
  if(!m.open)m.showModal();m.scrollTop=0;const first=m.querySelector('.modal-body h2');if(first){first.tabIndex=-1;}
}
function closeModal(){endActivity();if($('#modal').open)$('#modal').close();}
$('#modal').addEventListener('close',()=>{
  endActivity();const r=modalReturn;modalReturn=null;if(r&&document.contains(r))r.focus({preventScroll:true});
  // 重访：回看过的痕迹再亮一下
  if(lastMemory){const id=lastMemory;lastMemory=null;$$(`[data-trace="${CSS.escape(id)}"]`).forEach(el=>{el.classList.remove('revisited');void el.offsetWidth;el.classList.add('revisited');setTimeout(()=>el.classList.remove('revisited'),2600);});}
});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});

/* ---------- 设置 / 隐私 / 关于 ---------- */
function settings(){
  const p=state.personal,hasBackup=!!lsGet(BACKUP),mig=state.migration;
  modal(`<h2>数据与设置</h2><p class="muted">记录只保存在这台设备的这个浏览器里。清除浏览器数据、更换设备或使用无痕模式，可能无法找回。</p>
  <div class="setting-row"><div><h3>我的记录</h3><p>${p.entries.length} 段记录 · ${p.sessions.length} 次练习（不含示例）</p></div><button class="secondary-button" data-action="export">导出 JSON</button></div>
  <div class="setting-row"><div><h3>示例数据</h3><p>虚构的记录与模拟情境数据，与你的记录分开保存。</p></div><span class="row-btns">${isDemo()?'<button class="ghost-button" data-action="demo-reset">重置</button><button class="secondary-button" data-action="demo-exit">退出示例</button>':'<button class="secondary-button" data-action="demo-enter">查看示例数据</button>'}</span></div>
  ${hasBackup||mig?`<div class="setting-row"><div><h3>旧版本数据</h3><p>${mig&&mig.report?`已从旧版本迁移 ${mig.report.personalEntries} 条记录、${mig.report.personalSessions} 次练习；旧版的示例记录没有迁移。`:mig&&mig.error?esc(mig.error):''}${hasBackup?' 原始数据已原样备份在这个浏览器里。':''}</p></div>${hasBackup?'<button class="secondary-button" data-action="export-backup">下载备份</button>':''}</div>`:''}
  <div class="setting-row"><div><h3>设计说明</h3><p>数据处理与计算方式。</p></div><button class="secondary-button" data-action="notes-open">打开</button></div>
  <div class="setting-row"><div><h3>删除全部记录</h3><p>删除你的记录与练习，无法恢复。示例数据不受影响。</p></div><button class="danger-button" data-action="clear-confirm">删除</button></div>`);
}
function privacy(){modal(`<h2>隐私</h2><p>生息无需注册。文字、标签与练习记录只保存在当前浏览器的本地存储中，不上传到服务器，也不发送给任何 AI 模型。点击「留在这里」或「留下这一刻」后才会保存。</p><ul class="modal-list"><li>共用设备上，使用同一浏览器的人可能看到记录。</li><li>可以在「数据与设置」中导出或删除全部记录。</li><li>清除浏览器数据后，记录也会被清除。</li></ul><div class="modal-actions"><button class="primary-button" data-action="close">知道了</button></div>`);}
function about(){modal(`<div class="eyebrow">ABOUT SHENGXI</div><h2>A living space for whatever you feel.</h2><p>情绪日记与自我关怀的网页原型。在「此刻」写下文字或与形体互动并选择留下；在「回望」查看记录；在「关怀」做短练习。</p><ul class="modal-list"><li>没有接入大模型。</li><li>练习排序依据你选的感受和同一练习的反馈。</li><li>没有接入真实设备或传感器；示例中的手表与情境数据为模拟数据。</li><li>不提供诊断或治疗。</li></ul><div class="modal-actions"><button class="secondary-button" data-action="notes-open">设计说明</button><button class="primary-button" data-action="close">好</button></div>`);}
function exportJSON(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

/* ---------- 设计说明：次级入口，默认收起，关闭后焦点回到入口 ---------- */
let notesReturn=null;
function setNotes(open,restore=true){
  document.body.classList.toggle('notes-open',open);const p=$('#design-notes');p.setAttribute('aria-hidden',!open);p.inert=!open;
  $$('.dn-sec[data-for]').forEach(s=>s.classList.toggle('current',s.dataset.for.split(' ').includes(view)));
  if(open){notesReturn=notesReturn||document.activeElement;setTimeout(()=>p.querySelector('.dn-close').focus(),50);}
  else{const r=notesReturn||$('[data-action="settings"]');notesReturn=null;if(restore&&r&&document.contains(r))r.focus({preventScroll:true});}
}
setNotes(false,false);

/* ---------- 渲染与导航 ---------- */
function render(){
  if(view!=='now')Ambient.stopIf('space');
  Space.unmount();if(stageRO){stageRO.disconnect();stageRO=null;}document.body.classList.remove('orb-held');
  const m=$('#main');m.innerHTML=view==='now'?now():view==='reflect'?reflect():care();
  m.classList.remove('animate-in');void m.offsetWidth;m.classList.add('animate-in');
  document.body.dataset.view=view;document.body.classList.toggle('is-demo',isDemo());document.title=`生息 SHENGXI · ${TITLE[view]}${isDemo()?'（示例）':''}`;
  $$('[data-view]').forEach(e=>{if(e.tagName!=='A'||!e.closest('nav'))return;const on=e.dataset.view===view;e.classList.toggle('active',on);if(on)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');});
  hydrate(m);
  if(view==='now'){mountSpace();const ta=$('#say');if(ta&&sayDraft)autoGrow(ta);}
  if(view==='reflect')mountReflect();
  if(document.body.classList.contains('notes-open'))setNotes(true,false);
}
function navigate(v,focusMain=true){
  v=routeOf(v);const changed=v!==view;view=v;if(location.hash.slice(1)!==v)history.replaceState(null,'','#'+v);
  render();window.scrollTo({top:0,behavior:'instant'});if(focusMain&&changed)$('#main').focus({preventScroll:true});
}
window.addEventListener('hashchange',()=>{const v=routeOf(location.hash.slice(1));if(v!==view)navigate(v);});

/* ---------- 事件 ---------- */
document.addEventListener('input',e=>{
  const id=e.target.id;
  if(id==='say')updateSayUI();
  if(id==='journal-search'){search=e.target.value;$('#entry-list').innerHTML=entryList();}
  if(id==='volume'){volume=+e.target.value/100;if(Ambient.owner===practiceOwner())Ambient.setVolume(volume);}
  if(id==='space-volume'){spaceVol=+e.target.value/100;if(Ambient.owner==='space')Ambient.setVolume(spaceVol);}
});
document.addEventListener('keydown',e=>{
  // 多行输入：Enter 换行；Ctrl/⌘ + Enter 且不在输入法组字中才保存
  if(e.target.id==='say'&&e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing&&e.keyCode!==229){e.preventDefault();keepText();}
  if(e.key==='Escape'&&document.body.classList.contains('notes-open')){e.preventDefault();setNotes(false);}
  else if(e.key==='Escape'&&rf.sel&&view==='reflect'&&!$('#modal').open){const k=rf.sel;rf.sel=null;rerenderFeel();const bb=$(`.feel-bub[data-value="${k}"]`);bb&&bb.focus();}
});
document.addEventListener('change',e=>{if(e.target.id==='journal-filter'){listFilter=e.target.value;$('#entry-list').innerHTML=entryList();}});
document.addEventListener('click',e=>{
  const chap=e.target.closest('a[data-chapter]');if(chap){e.preventDefault();$('#'+chap.dataset.chapter).scrollIntoView({behavior:reduceMotion()?'auto':'smooth'});return;}
  const link=e.target.closest('a[data-view]');if(link){e.preventDefault();if($('#modal').open)closeModal();navigate(link.dataset.view);return;}
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const a=b.dataset.action,id=b.dataset.id,v=b.dataset.value;
  switch(a){
    case 'say-keep':keepText();break;
    case 'say-discard':discardText();break;
    case 'composer-new':newComposer(true);break;
    case 'tag-emo':{const en=tagEntry(composer.id,x=>{x.emotion=x.emotion===v?null:v;});if(en)syncTagPanel(en);break;}
    case 'tag-trig':{const en=tagEntry(composer.id,x=>{x.triggers=x.triggers.includes(v)?x.triggers.filter(t=>t!==v):[...x.triggers,v];});if(en)syncTagPanel(en);break;}
    case 'tag-inten':{const en=tagEntry(composer.id,x=>{x.intensity=hasIntensity(x)&&x.intensity===+v?null:+v;});if(en)syncTagPanel(en);break;}
    case 'more-open':{const p=$('#more-'+v),open=p.hidden;$$('.more-panel').forEach(x=>x.hidden=true);$$('.more-toggle').forEach(x=>x.setAttribute('aria-expanded','false'));p.hidden=!open;b.setAttribute('aria-expanded',open);break;}
    case 'stay-keep':keepStay();break;
    case 'stay-leave':leaveStay();break;
    case 'sound':toggleSound();break;
    case 'memory':openMemory(id);break;
    case 'annotate':openAnnotate(id);break;
    case 'anno-emo':anno.emotion=anno.emotion===v?null:v;syncAnno();break;
    case 'anno-clear-emo':anno.emotion=null;syncAnno();break;
    case 'anno-inten':anno.intensity=anno.intensity===+v?null:+v;syncAnno();break;
    case 'anno-tag':anno.triggers=anno.triggers.includes(v)?anno.triggers.filter(t=>t!==v):[...anno.triggers,v];b.classList.toggle('active');b.setAttribute('aria-pressed',anno.triggers.includes(v));break;
    case 'anno-save':saveAnno();break;
    case 'accompany':{const en=entryById(id);const recs=HH.recommend(en&&en.emotion,sessions());modal(`<h2>选择一个练习</h2><div class="lib-list single">${recs.map(r=>toolCard(actById(r.id),{reason:r.reason,entry:id})).join('')}</div>`,'wide');break;}
    case 'journal':closeModal();navigate('now');setTimeout(()=>{if(composer.state!=='write')newComposer(false);const ta=$('#say');if(ta){ta.focus();ta.scrollIntoView({block:'center',behavior:reduceMotion()?'auto':'smooth'});}},60);break;
    case 'close':closeModal();break;
    case 'activity':openActivity(id,{entry:b.dataset.entry});break;
    case 'dur':if(!started&&activeActivity){activeActivity.minutes=+v;$$('[data-action="dur"]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});$('#timer-value').textContent=formatTime(+v*60);}break;
    case 'toggle-timer':toggleTimer();break;
    case 'finish':finishActivity();break;
    case 'feedback':feedback(v);break;
    case 'period':period=v==='all'?'all':+v;render();break;
    case 'river':{const l=inPeriod(entries()).sort((x,y)=>x.ts-y.ts),i=l.findIndex(x=>x.id===rf.tl)+(+v);if(l[i]){rf.tl=l[i].id;rerenderRiver();$$('.rv-dot')[i]&&$('.rv-node.sel .rv-dot').focus({preventScroll:true});}break;}
    case 'river-sel':rf.tl=id;rerenderRiver();break;
    case 'feel':rf.sel=rf.sel===v?null:v;if(rf.sel&&rf.sel!==KEY_NONE)rf.ctx=rf.sel;rerenderFeel();rerenderTrig();if(rf.sel){const p=$('#feel-panel');p&&p.querySelector('h3')&&(p.querySelector('h3').tabIndex=-1);}break;
    case 'feel-close':{const k=rf.sel;rf.sel=null;rerenderFeel();const bb=$(`.feel-bub[data-value="${k}"]`);bb&&bb.focus({preventScroll:true});break;}
    case 'feel-ctx':rf.ctx=v||null;rerenderTrig();if(b.closest('#feel-panel'))$('#ch-3').scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'});break;
    case 'all-records':openRecords(v);break;
    case 'care-filter':careFilter=v;render();setTimeout(()=>$('#lib').scrollIntoView({block:'start'}),0);break;
    case 'scroll-lib':$('#lib').scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'});break;
    case 'reset-filters':search='';listFilter='all';if($('#entry-list'))$('#entry-list').innerHTML=entryList();const sel=$('#journal-filter');if(sel)sel.value='all';const si=$('#journal-search');if(si)si.value='';break;
    case 'settings':settings();break;
    case 'privacy':privacy();break;
    case 'about':about();break;
    case 'help':modal(helpCard()+'<div class="modal-actions"><button class="primary-button" data-action="close">好</button></div>');break;
    case 'export':exportJSON({app:'生息 SHENGXI',version:3,exportedAt:new Date().toISOString(),entries:state.personal.entries,sessions:state.personal.sessions},`shengxi-${dayKey(new Date())}.json`);toast('已导出（不含示例数据）');break;
    case 'export-backup':{const raw=lsGet(BACKUP);if(raw){try{exportJSON(JSON.parse(raw),'huanhuan-v2-backup.json');}catch(_){exportJSON({raw},'huanhuan-v2-backup.json');}}break;}
    case 'notes-toggle':setNotes(!document.body.classList.contains('notes-open'));break;
    case 'notes-open':notesReturn=$('[data-action="settings"]');closeModal();setNotes(true);break;
    case 'demo-enter':closeModal();if(!state.demo)state.demo=HH.genDemo(Date.now());state.mode='demo';composer={state:'write',id:null};persist();navigate(view,false);toast('已切换到示例数据');break;
    case 'demo-exit':closeModal();state.mode='personal';composer={state:'write',id:null};persist();navigate(view,false);toast('已退出示例');break;
    case 'demo-reset':closeModal();state.demo=HH.genDemo(Date.now());persist();render();toast('示例数据已重置');break;
    case 'clear-confirm':modal(`<h2>删除全部记录？</h2><p>将删除 ${state.personal.entries.length} 段记录和 ${state.personal.sessions.length} 次练习，无法恢复。示例数据与旧版本备份不受影响。</p><div class="modal-actions"><button class="secondary-button" data-action="settings">取消</button><button class="danger-button" data-action="clear-data">删除</button></div>`);break;
    case 'clear-data':state.personal={entries:[],sessions:[]};composer={state:'write',id:null};persist();closeModal();render();toast('已删除全部记录');break;
    case 'delete':modal(`<h2>删除这条记录？</h2><p>原文与标签将被删除，无法恢复。相关练习记录会保留。</p><div class="modal-actions"><button class="secondary-button" data-action="memory" data-id="${esc(id)}">取消</button><button class="danger-button" data-action="confirm-delete" data-id="${esc(id)}">删除</button></div>`);break;
    case 'confirm-delete':{const box=cur();box.entries=box.entries.filter(x=>x.id!==id);box.sessions.forEach(s=>{if(s.entryId===id)s.entryId=null;});if(composer.id===id)composer={state:'write',id:null};lastMemory=null;persist();closeModal();if(view==='now'){refreshHome();if(!$('#say'))newComposer(false);}else render();toast('已删除');break;}
  }
});
/* 品牌标记 */
$$('.brand-mark-slot').forEach(s=>s.outerHTML=Art.brandMark);
hydrate();
render();
