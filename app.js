'use strict';
/* 缓缓 · 界面层。建立在 v0 原型之上：此刻 / 情绪足迹 / 关怀工具箱 三个视图不变，
   加入种子与花园隐喻、模拟手表提示、照料到开花、可计算的洞察与安全卡片。 */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {EMO,EMOTIONS,TRIG,INTENSITY,CARE_NAME,CARE_CAT,BLOOM,isNeg,hash,fmt1}=HH;
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const paths={home:'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',chart:'M4 3v17h17M8 14l4-5 4 3 5-7',leaf:'M20 4C7 2 2 9 6 15s14 2 14-11ZM4 21l11-11',lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',settings:'M9 3h6l1 4 4 1v6l-4 1-1 5H9l-1-5-4-1V8l4-1zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',arrow:'M4 12h16m-6-6 6 6-6 6',close:'m6 6 12 12M6 18 18 6',check:'m5 12 4 4L19 6',spark:'m12 3 2 6 7 3-7 2-2 7-2-7-7-2 7-3z',watch:'M8 7h8v10H8zM9 7l1-4h4l1 4M9 17l1 4h4l1-4M12 10v2l1.5 1',seed:'M12 3c5 5 6 10 0 18C6 13 7 8 12 3ZM12 9v8',shield:'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9.5 12l2 2 3.5-4',notes:'M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h3',flower:'M12 21v-8M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 7V4M15 10h3M6 10h3M12 17c-2-2-4-2-5-1M12 18c2-2 4-2 5-1'};
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.leaf}"/></svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');

/* 原型里的五档心情脸，保留给练习后的反馈 */
const moods=[{color:'#b9c4da',dark:'#6d7c98'},{color:'#c8bfd9',dark:'#8b7d9e'},{color:'#d9d3ba',dark:'#9b9477'},{color:'#b8cbb5',dark:'#768b72'},{color:'#edc59c',dark:'#b18b64'}];
const BLOB='M12 21C18 7 46 5 58 20S68 50 55 61 18 63 10 49 6 34 12 21Z';
function face(n,cls=''){const m=moods[n-1];const mouths=['M29 43Q36 36 43 43','M30 42Q36 39 42 42','M31 41h10','M29 38q7 10 14 0','M27 37q9 17 18 0Z'];return `<svg class="${cls}" viewBox="0 0 72 72" aria-hidden="true"><path d="${BLOB}" fill="${m.color}"/><path d="M17 22Q29 11 44 15" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M25 30v3m22-3v3" stroke="${m.dark}" stroke-width="2.3" stroke-linecap="round"/><path d="${mouths[n-1]}" fill="${n===5?m.dark:'none'}" stroke="${m.dark}" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="22" cy="38" rx="4" ry="2" fill="#fff" opacity=".2"/><ellipse cx="50" cy="38" rx="4" ry="2" fill="#fff" opacity=".2"/></svg>`;}
/* 八种情绪：同样的软团子造型，换表情和颜色 */
const FACES={
  '焦虑':'<path d="M25 30v3m22-3v3"/><path d="M21 24l7-1.5M51 24l-7-1.5"/><path d="M28 43q2-3 4 0t4 0 4 0 4 0"/>',
  '烦躁':'<path d="M25 31v2.5m22-2.5v2.5"/><path d="M21 24l8 3M51 24l-8 3"/><path d="M29 44q7-6 14 0"/>',
  '低落':'<path d="M25 31v3m22-3v3"/><path d="M29 44Q36 37 43 44"/>',
  '疲惫':'<path d="M22 32q3.5 2.5 7 0M43 32q3.5 2.5 7 0"/><path d="M31 42h10"/>',
  '委屈':'<path d="M25 31v3m22-3v3"/><path d="M21 26l7-3M51 26l-7-3"/><path d="M30 43q6-4 12 0"/><path d="M49 37v4" stroke-width="2.6" opacity=".55"/>',
  '迷茫':'<path d="M25 31v3m22-3v3"/><path d="M45 24l6-1"/><circle cx="37" cy="42.5" r="2.6"/>',
  '平静':'<path d="M22 31q3.5-2.5 7 0M43 31q3.5-2.5 7 0"/><path d="M30 40q6 5 12 0"/>',
  '开心':'<path d="M25 30v3m22-3v3"/><path d="M27 37q9 17 18 0Z" fill="currentColor"/>'
};
function emoFace(name,cls=''){const e=EMO[name];return `<svg class="${cls}" viewBox="0 0 72 72" aria-hidden="true"><path d="${BLOB}" fill="${e.c}"/><path d="M17 22Q29 11 44 15" stroke="#fff" stroke-opacity=".32" stroke-width="3" fill="none" stroke-linecap="round"/><g stroke="${e.d}" color="${e.d}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none">${FACES[name]}</g><ellipse cx="22" cy="38" rx="4" ry="2" fill="#fff" opacity=".2"/><ellipse cx="50" cy="38" rx="4" ry="2" fill="#fff" opacity=".2"/></svg>`;}

const plantArt=`<svg class="pause-graphic" viewBox="0 0 210 220" aria-hidden="true"><ellipse cx="116" cy="207" rx="76" ry="9" fill="#c3b3d3" opacity=".28"/><path d="M63 180C45 132 73 96 111 103s82 61 46 88-84 22-94-11Z" fill="#c7b7db"/><path d="M80 172C83 135 117 122 145 135s40 45 14 57-84 11-79-20Z" fill="#b3a0c8"/><path d="M77 106C63 78 78 41 106 48s46 40 31 58-48 24-60 0Z" fill="#ded2eb"/><path d="M105 124q21-27 13-64" fill="none" stroke="#7d937f" stroke-width="2"/><path d="M117 80q-29-3-26-23 22-4 26 23Z" fill="#9eb19c"/><path d="M120 64q-6-29 17-34 11 21-17 34Z" fill="#b0bda5"/><path d="M120 97q25-24 36-8-13 23-36 8Z" fill="#91a88d"/><path d="M160 37v12m-6-6h12" stroke="#a690bb" stroke-linecap="round"/><circle cx="57" cy="65" r="3" fill="#b7a2c9"/></svg>`;
function activityArt(kind){if(kind==='breath'||kind==='meditate')return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><circle cx="58" cy="52" r="32" fill="#cedac9"/><circle cx="58" cy="52" r="22" fill="none" stroke="#94a58b"/><circle cx="58" cy="52" r="12" fill="none" stroke="#94a58b"/><path d="M58 12v5m0 70v5M18 52h5m70 0h5" stroke="#94a58b"/></svg>`;if(kind==='sound')return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><path d="M17 73V51a31 31 0 0 1 62 0v22" fill="none" stroke="#baabcf" stroke-width="9"/><rect x="13" y="51" width="18" height="29" rx="8" fill="#ac99c4"/><rect x="66" y="51" width="18" height="29" rx="8" fill="#ac99c4"/><path d="M39 53v19m10-28v34m10-24v18" stroke="#c4b6d6" stroke-width="3" stroke-linecap="round"/></svg>`;if(kind==='scan')return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="22" r="9" fill="#d9c3ad"/><path d="M50 33v30M50 40l-16 12M50 40l16 12M50 63l-12 22M50 63l12 22" stroke="#c4a88f" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M22 30h56M22 50h56M22 70h56" stroke="#e2cdb9" stroke-dasharray="2 5"/></svg>`;return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><path d="M25 82Q51 56 49 15" fill="none" stroke="#b6a080" stroke-width="2"/><path d="M48 38Q17 29 25 13q26 1 23 25M45 57Q77 48 73 27q-29 5-28 30M36 70Q15 65 14 45q25 4 22 25" fill="#c8ba95"/><path d="M17 85h55" stroke="#d4bca8" stroke-linecap="round"/></svg>`;}

/* ---------- 状态 ---------- */
const KEY='huanhuan-v2';
let state=null, storageAvailable=true;
function freshState(){const m=HH.genMock(Date.now());return{v:2,mode:'demo',entries:m.entries,sessions:m.sessions};}
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&Array.isArray(s.entries)&&Array.isArray(s.sessions)){s.entries=s.entries.filter(e=>EMO[e.emotion]&&Number.isFinite(e.ts)&&e.intensity>=1&&e.intensity<=5&&Array.isArray(e.triggers));state=s;}}catch(e){storageAvailable=false;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){storageAvailable=false;toast('浏览器存储不可用，记录仅在本次页面保留。请导出备份。');return false;}}
if(!state){state=freshState();persist();}
const entries=()=>state.entries;
const sessions=()=>state.sessions;
const seedsOf=list=>list.filter(e=>isNeg(e)&&!e.cared).sort((a,b)=>b.ts-a.ts);

let view=['home','journal','care'].includes(location.hash.slice(1))?location.hash.slice(1):'home';
const blankDraft=()=>({emotion:null,intensity:3,triggers:[],note:'',source:null});
let draft=blankDraft(), period=7, journalFilter='all', search='', timeFilter=0, energyFilter='all';

/* ---------- 模拟的手表与情境数据 ---------- */
let nudge={time:'15:20',drop:18,noise:71,hidden:false};
function simContext(){const now=new Date(),h=hash(HH.sod(now)),hr=now.getHours()+now.getMinutes()/60;return{sleep:Math.round((5+(h%31)/10)*10)/10,steps:Math.round(Math.max(0,hr-7)*520+(h>>>5)%600),hrv:44+(h>>>9)%14,noise:42+(h>>>13)%18,weather:['晴','多云','阴','小雨'][(h>>>17)%4]};}
function draftCtx(){const c=simContext();if(draft.source==='watch'){c.hrv=Math.round(52*(1-nudge.drop/100));c.noise=nudge.noise;}return c;}
function simulateSignal(){const d=new Date(),r=Math.random;nudge={time:pad(d.getHours())+':'+pad(d.getMinutes()),drop:12+Math.floor(r()*16),noise:56+Math.floor(r()*20),hidden:false};}

/* ---------- 小工具 ---------- */
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(window.toastTimeout);window.toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function hydrate(){$$('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));}
function dayKey(d){const date=new Date(d);return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;}
function dateLabel(date,includeTime=false){return new Date(date).toLocaleString('zh-CN',{month:'long',day:'numeric',...(includeTime?{hour:'2-digit',minute:'2-digit'}:{})});}
function relDay(ts){const d0=HH.sod(ts),t0=HH.sod(Date.now()),d=new Date(ts),t=`${pad(d.getHours())}:${pad(d.getMinutes())}`;if(d0===t0)return '今天 '+t;if(d0===HH.addDays(t0,-1))return '昨天 '+t;return `${d.getMonth()+1}月${d.getDate()}日`;}
function filteredPeriod(){const start=HH.addDays(HH.sod(Date.now()),-period+1);return entries().filter(e=>e.ts>=start);}
function ctxItems(c){if(!c)return '';return [['睡眠',c.sleep+' h'],['步数',Number(c.steps).toLocaleString()],['HRV',c.hrv+' ms'],['噪音',c.noise+' dB'],['天气',c.weather]].map(([k,v])=>`<span><em>${k}</em>${esc(v)}</span>`).join('');}
const intenDots=n=>`<span class="inten-dots" aria-label="强度 ${n}/5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;

/* ---------- 情绪曲线：效价 × 强度，−5 ~ +5 ---------- */
function chart(data,days=7,large=false){
  const W=large?530:320,H=large?190:118,left=large?40:14,right=12,top=12,bottom=28;
  const X=i=>left+i*(W-left-right)/(days-1||1),Y=v=>top+(5-v)/10*(H-top-bottom);
  const series=HH.dailySeries(data,days),points=[];
  series.forEach((d,i)=>{if(d.v!==null)points.push({x:X(i),y:Y(d.v),i,d});});
  let path='';points.forEach((p,k)=>{path+=`${k&&p.i===points[k-1].i+1?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;});
  const desc=v=>v>=1.5?'偏舒展':v<=-1.5?'偏沉重':'平稳';
  const tip=p=>`${dateLabel(p.d.d0)} · ${p.d.rows.length} 条记录 · ${desc(p.d.v)}（${p.d.v>0?'+':p.d.v<0?'−':''}${fmt1(Math.abs(p.d.v))}）`;
  return `<svg class="chart${large?' large':''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="近${days}天每日情绪：越靠上越舒展，越靠下越沉重；空白表示未记录">
  ${[5,0,-5].map(v=>`<line x1="${left}" x2="${W-right}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)" ${v?'stroke-dasharray="3 5"':''}/>${large?`<text class="chart-value" x="0" y="${Y(v)+3}">${v===5?'舒展':v===0?'平稳':'沉重'}</text>`:''}`).join('')}
  ${large?`<line class="cross" id="cross" x1="0" x2="0" y1="${top}" y2="${H-bottom}"/>`:''}
  <path d="${path}" fill="none" stroke="var(--line-c)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${points.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${large?4:3.5}" fill="${p.d.v<0?'var(--dot-neg)':'var(--dot-pos)'}" stroke="var(--paper)" stroke-width="2" data-tip="${esc(tip(p))}"><title>${esc(tip(p))}</title></circle>`).join('')}
  ${series.map((d,i)=>i===0||i===days-1||days<=7||i%7===0?`<text class="chart-label" x="${X(i)}" y="${H-5}" text-anchor="middle">${i===days-1?'今天':`${new Date(d.d0).getMonth()+1}.${new Date(d.d0).getDate()}`}</text>`:'').join('')}
  ${points.length?'':`<text class="chart-label" x="${W/2}" y="${H/2}" text-anchor="middle">第一条记录，会成为这里的起点</text>`}</svg>`;
}

/* ---------- 关怀活动 ---------- */
const activities=[
{id:'breath',title:'方块呼吸',subtitle:'吸 4 · 停 4 · 呼 4 · 停 4',category:'呼吸练习',minutes:1,choices:[1,3],energy:'low',style:'',kind:'breath',intro:'找一个舒服的姿势，跟着圆圈，四个四秒为一组。不舒服就回到自然呼吸。',steps:[]},
{id:'meditate',title:'把注意力带回此刻',subtitle:'不用清空大脑，只要留意当下',category:'正念片刻',minutes:3,energy:'low',style:'',kind:'meditate',intro:'走神很正常。发现自己走神时，再温和地回来一次就好。',steps:['留意身体与椅子、地面的接触。','听听周围的声音，不需要判断它。','感受一次自然的呼吸，然后再一次。']},
{id:'music',title:'留一段无词的空白',subtitle:'缓慢的和弦，和一点风声',category:'舒缓音乐',minutes:3,energy:'low',style:'purple',kind:'sound',intro:'浏览器实时生成的环境音：缓慢变换的和弦，加上一点滤过的风声。可以调低音量，让它成为背景。',steps:[]},
{id:'rain',title:'听一会儿雨',subtitle:'把注意力，交给窗外的声音',category:'环境音',minutes:3,energy:'low',style:'purple',kind:'sound',intro:'低沉的和声和连续的雨声。可以闭上眼，也可以望向窗外，暂时不用做任何事。',steps:[]},
{id:'scan',title:'身体扫描',subtitle:'睡得少的日子，比运动更合适',category:'身体感受',minutes:5,energy:'low',style:'peach',kind:'scan',intro:'坐好或躺下。注意力从头顶慢慢往下走，只是感受，不用改变什么。',steps:['从头顶开始，留意额头和眉心是否绷着。','来到下巴和肩膀，让它们往下沉一点。','感受胸口和腹部，随呼吸起伏。','留意双腿的重量，和脚底的温度。','最后，感受整个身体被托住。']},
{id:'stretch',title:'让肩膀先下班',subtitle:'站起来，伸展一下身体',category:'轻运动',minutes:5,energy:'medium',style:'peach',kind:'stretch',intro:'离开屏幕一会儿，只做身体感觉舒服的动作。',steps:['缓缓向后绕肩 5 次，再向前绕肩 5 次。','头慢慢倒向左肩、右肩，各停 15 秒。','双手交扣向上，伸一个长长的懒腰。','坐姿前屈，让后背自然垂下。','起身走几步，让视线看看远处。']},
{id:'walk',title:'出去走一小段',subtitle:'不用计步，也不用走得很远',category:'轻运动',minutes:10,energy:'medium',style:'peach',kind:'walk',intro:'如果此刻方便，选一条熟悉、安全的小路。只是走走，不需要达成什么。',steps:['离开座位，选择一个熟悉的地方。','先慢走两分钟，留意脚底落地的感觉。','找一找路上的五种颜色。','听一听三种不同的声音。','走到想回去的时候，就可以回去。']}
];
const actById=id=>activities.find(a=>a.id===id);
const GROUPS=[['呼吸','给身体一个慢下来的信号'],['聆听','把注意力交给声音'],['身体','让情绪从身体里流动出去']];
function activityCard(a,opt={}){const m=opt.minutes||a.minutes;return `<button class="activity-card ${a.style}" data-action="activity" data-id="${a.id}" ${opt.entry?`data-entry="${esc(opt.entry)}" data-minutes="${m}"`:''}><div class="activity-tag">${opt.rank===0?'<span class="rank-pill">最适合现在</span>':''}${a.category} · ${m} 分钟</div><h3>${a.title}</h3><p>${a.subtitle}</p>${opt.reason?`<p class="activity-reason">${icon('spark')}<span>${esc(opt.reason)}</span></p>`:''}${activityArt(a.kind)}<span class="activity-arrow" aria-hidden="true">↗</span></button>`;}

function safetyCard(compact=false){return `<section class="safety-card ${compact?'compact':''}" aria-label="需要更多支持时"><div class="safety-icon">${icon('shield')}</div><div><h3>如果此刻真的很难熬</h3><p>缓缓是日常自我关怀的小工具，不能替代专业帮助。如果你持续感到难以承受，或有伤害自己的念头，请马上联系一个信任的人，或拨打：</p><div class="hotlines"><a href="tel:12356"><b>12356</b><span>全国心理援助热线</span></a><a href="tel:120"><b>120</b><span>急救</span></a><a href="tel:110"><b>110</b><span>报警</span></a></div></div></section>`;}

/* ---------- 此刻 ---------- */
function nudgeCard(){
  if(nudge.hidden)return `<div class="nudge-off"><span>${icon('watch')}手表很安静。</span><button class="link-button" data-action="simulate">模拟一次信号</button></div>`;
  return `<section class="nudge" aria-label="模拟的手表提示"><div class="nudge-icon">${icon('watch')}</div><div class="nudge-body"><div class="nudge-tag">模拟 Apple Watch 数据</div><p><b>${nudge.time}</b> · 心率变异性比平时低 ${nudge.drop}%，环境噪音 ${nudge.noise} dB。要不要把此刻埋下？</p><span class="nudge-foot">这只是身体信号；是什么感受，由你来确认。</span></div><div class="nudge-actions"><button class="primary-button" data-action="nudge-yes">埋一颗种子</button><button class="secondary-button" data-action="nudge-no">没事，我很好</button><button class="link-button" data-action="simulate">模拟一次信号</button></div></section>`;
}
const saveLabel=()=>!draft.emotion?'埋下这一刻':EMO[draft.emotion].v<0?'埋下这颗种子':'种下这朵花';
function checkin(){
  return `<section class="card checkin" id="checkin"><div class="card-head"><h2>此刻，你感觉怎么样？</h2><span class="soft-pill">约 20 秒</span></div>
  <p class="subtext">${draft.source==='watch'?'手表注意到了一些变化。是哪一种感受，由你来说。':'不用想得太清楚，选最接近的就好。舒服的感受会直接开成花。'}</p>
  <div class="emo-grid" role="group" aria-label="选择此刻的情绪">${EMOTIONS.map(n=>`<button type="button" class="mood-choice ${draft.emotion===n?'selected':''} ${EMO[n].v>0?'pos':''}" data-action="emotion" data-value="${n}" aria-pressed="${draft.emotion===n}">${emoFace(n)}<span>${n}</span></button>`).join('')}</div>
  <div class="field-label"><span>有多强烈？</span><span class="optional" id="inten-label">${draft.intensity} · ${INTENSITY[draft.intensity-1]}</span></div>
  <div class="inten-row" role="group" aria-label="强度">${[1,2,3,4,5].map(i=>`<button type="button" class="inten ${i<=draft.intensity?'on':''}" data-action="inten" data-value="${i}" aria-label="强度 ${i}：${INTENSITY[i-1]}" aria-pressed="${i===draft.intensity}"><i style="--s:${8+i*3}px"></i></button>`).join('')}</div>
  <div class="field-label"><span>和什么有关？</span><span class="optional">可多选 · 也可以跳过</span></div>
  <div class="chips" id="tag-chips">${TRIG.map(t=>`<button class="chip ${draft.triggers.includes(t)?'active':''}" data-action="tag" data-value="${t}" aria-pressed="${draft.triggers.includes(t)}">${t}</button>`).join('')}</div>
  <div class="field-label"><label for="note">想说点什么吗？</label><span class="optional"><span id="char-count">${draft.note.length}</span>/80</span></div>
  <input id="note" class="note-input" maxlength="80" placeholder="想说点什么，也可以不说" value="${esc(draft.note)}" autocomplete="off">
  <div class="ctx-strip" aria-label="自动附带的情境数据"><span class="ctx-tag">${draft.source==='watch'?'来自手表提示':'自动附带'} · 模拟数据</span>${ctxItems(draftCtx())}</div>
  <div class="save-row"><span class="save-hint">${icon('lock')}只保存在这台设备</span><button class="primary-button" data-action="save" id="save-button" ${draft.emotion?'':'disabled'}><span id="save-label">${saveLabel()}</span> ${icon('arrow')}</button></div></section>`;
}
function seedChip(e){return `<button class="seed-chip" data-action="seed" data-id="${esc(e.id)}"><i style="background:${EMO[e.emotion].c}"></i>${e.emotion}<span>${relDay(e.ts)}</span></button>`;}
function home(){
  const all=entries(),seeds=seedsOf(all),flowers=all.length-seeds.length,hr=new Date().getHours();
  const hello=hr<5?'夜深了':hr<11?'早上好':hr<14?'中午好':hr<18?'下午好':'晚上好';
  const latest=seeds[0];
  return `<section class="greeting"><div><div class="eyebrow">A LITTLE ROOM FOR YOURSELF · ${hello}</div><h1>先停一下，听听自己。</h1><p>${seeds.length?`土里有 ${seeds.length} 颗种子，等你有空时去照料。`:'每一种感受，都可以在这里停一会儿。'}</p></div><div class="greeting-note">take your time. ♡</div></section>
  <section class="card garden-card"><div class="garden-head"><div><h2>情绪花园</h2><p>难受的情绪先埋成种子；照料过后，它会开成一朵花。</p></div><div class="garden-count"><span><b>${seeds.length}</b>颗种子</span><span><b>${flowers}</b>朵花</span></div></div>
  <div class="garden-stage"><canvas id="garden" role="img" aria-label="情绪花园：土里有 ${seeds.length} 颗种子，地面上开着 ${flowers} 朵花。土层从上到下依次是 ${TRIG.join('、')}。"></canvas><div class="soil-say" id="soil-say" role="status" aria-live="polite"></div></div>
  <div class="garden-foot"><span class="garden-hint">${icon('seed')}${seeds.length?'轻点土里发光的种子，去照料它':'埋下一颗种子，花园就会开始生长'}</span><div class="seed-chips">${seeds.slice(0,3).map(seedChip).join('')}${seeds.length>3?`<button class="seed-chip more" data-action="seed-list">还有 ${seeds.length-3} 颗</button>`:''}</div></div></section>
  <div id="nudge-slot">${nudgeCard()}</div>
  <div class="home-grid">${checkin()}<div class="right-stack"><section class="card pause-card"><h2>你不必<br>立刻好起来。</h2><p>先给自己，一次呼吸的时间。</p>${plantArt}<button class="breath-link" data-action="activity" data-id="breath"><span class="circle-play">▷</span>一起呼吸 1 分钟</button></section><section class="card mini-trend"><div class="card-head"><h2>最近的心情</h2><span class="soft-pill">近 7 天</span></div><div class="chart-wrap">${chart(all)}</div><div class="chart-note"><span>${all.length?`已经留下 ${new Set(all.map(e=>dayKey(e.ts))).size} 天的情绪足迹`:'记录一点点，慢慢看见自己'}</span><button class="link-button" data-action="navigate" data-view="journal">看一看 ↗</button></div></section></div></div>
  <section><div class="section-heading"><div><h2>给此刻的自己，一点照顾</h2><p>${latest?`为最近那颗「${latest.emotion}」的种子挑的，按情绪、触发和此刻的身体数据排序。`:'不想记录也没关系，直接从这里开始。'}</p></div><button class="link-button" data-action="navigate" data-view="care">更多小方法 ↗</button></div>
  <div class="care-cards">${latest?HH.recommend(latest,all).map((r,i)=>activityCard(actById(r.id),{entry:latest.id,reason:r.reason,minutes:r.minutes,rank:i})).join(''):['breath','music','walk'].map(id=>activityCard(actById(id))).join('')}</div></section>`;
}

/* ---------- 情绪足迹 ---------- */
const SOIL=['#e5d8c6','#ddcdb9','#d3c1ab','#c8b49d','#bca690','#af9883','#a18a77','#937c6b'];
function soilBars(data){
  const st=HH.triggerStats(data),max=Math.max(1,...st.map(s=>s.n));
  return `<div class="insight-title">${icon('seed')}<h2>触发因素 · 土层分析</h2></div><p class="insight-detail">每一层埋过多少颗种子，以及它们的平均强度。和花园里的土层一一对应。</p>
  <div class="soil-bars">${st.length?st.map(s=>`<div class="soil-row" title="${s.t}：${s.n} 颗种子，平均强度 ${fmt1(s.avg)}"><span class="soil-name">${s.t}</span><div class="soil-track"><i style="width:${Math.max(6,s.n/max*100)}%;background:${SOIL[s.i]}"></i></div><span class="soil-val"><b>${s.n}</b> 颗 · 强度 ${fmt1(s.avg)}</span></div>`).join(''):'<p class="insight-detail">这段时间还没有埋下种子。</p>'}</div>
  <div class="insight-footer">按记录时选的触发因素统计（只算难受的情绪）；关联不等于原因，也不是心理诊断。</div>`;
}
function findingCard(f){return `<article class="card finding"><div class="eyebrow">${f.eyebrow}</div><div class="finding-big">${esc(f.big)}</div><p class="finding-text">${esc(f.text)}</p>${f.bars?`<div class="finding-bars">${f.bars.map(b=>`<div class="tag-bar"><span>${b.label}</span><div class="bar-track"><i style="width:${Math.round(b.v*100)}%"></i></div><span class="count">${f.key==='sleep'?Math.round(b.v*100)+'%':fmt1(b.v*5)}</span></div>`).join('')}</div>`:''}<p class="finding-tip">${esc(f.tip)}</p></article>`;}
function journal(){
  const data=filteredPeriod(),found=HH.insights(entries());
  return `<section class="view-intro"><div class="eyebrow">YOUR EMOTIONAL LANDSCAPE</div><div class="card-head"><div><h1>每一刻，都有迹可循。</h1><p>回看情绪的起伏，也看看是什么在影响你。</p></div><button class="primary-button" data-action="navigate" data-view="home">＋ 记下一刻</button></div></section>
  <div class="stats-grid"><section class="card large-trend"><div class="card-head"><h2>情绪的起伏</h2><div class="segmented" aria-label="时间范围"><button data-action="period" data-value="7" class="${period===7?'active':''}">7 天</button><button data-action="period" data-value="30" class="${period===30?'active':''}">30 天</button></div></div><div class="chart-wrap" id="trend">${chart(data,period,true)}<div class="chart-tip" id="chart-tip" role="status"></div></div><p class="insight-help">${data.length} 条记录 · 纵轴 = 舒展或沉重 × 强度；同一天多次记录取平均，空白处表示未记录</p></section><section class="card insight-card">${soilBars(data)}</section></div>
  <div class="section-heading"><div><h2>一点小发现</h2><p>由最近 30 天的记录实时计算，数据不够时不下结论。关联不等于原因。</p></div></div>
  <div class="finding-grid">${found.length?found.map(findingCard).join(''):`<div class="card empty-state" style="grid-column:1/-1"><h3>再记录几次，这里会出现属于你的发现。</h3><p>至少需要 5 条记录。</p></div>`}</div>
  <div class="section-heading journal-toolbar"><div><h2>那些被记下的时刻</h2><p>${state.mode==='demo'?'前 14 天为模拟记录；你新记下的会混在其中，一样只存在这台设备上。':'不需要每天来，也不需要每次都开心。'}</p></div><div class="toolbar"><label class="sr-only" for="journal-search">搜索日记</label><input id="journal-search" class="search-input" type="search" placeholder="搜索情绪、触发或关键词…" value="${esc(search)}"><label class="sr-only" for="journal-filter">筛选</label><select id="journal-filter" class="select-input"><option value="all">全部记录</option><option value="seed" ${journalFilter==='seed'?'selected':''}>还在土里</option><option value="flower" ${journalFilter==='flower'?'selected':''}>已经开花</option>${EMOTIONS.map(n=>`<option value="${n}" ${journalFilter===n?'selected':''}>${n}</option>`).join('')}</select></div></div>
  <div class="journal-list" id="journal-list">${entryList()}</div>`;
}
function entryList(){
  const data=filteredPeriod().filter(e=>(journalFilter==='all'||(journalFilter==='seed'?isNeg(e)&&!e.cared:journalFilter==='flower'?!isNeg(e)||e.cared:e.emotion===journalFilter))&&(!search||[e.note,...e.triggers,e.emotion].join(' ').includes(search))).sort((a,b)=>b.ts-a.ts);
  return data.length?data.map(e=>{
    const status=!isNeg(e)?`<span class="status bloom">${icon('flower')}直接开花</span>`:e.cared?`<span class="status bloom">${icon('flower')}已转化 · ${CARE_NAME[e.careType]||'照料'}</span>`:`<button class="status seed" data-action="seed" data-id="${esc(e.id)}">${icon('seed')}还在土里 · 去照料</button>`;
    return `<article class="entry-card">${emoFace(e.emotion,'entry-face')}<div class="entry-content"><div class="entry-head"><span class="entry-title">${e.emotion}${intenDots(e.intensity)}</span><time class="entry-date">${dateLabel(e.ts,true)}</time></div><p class="entry-text">${esc(e.note)||'只是记下了这个感受。'}</p><div class="entry-meta">${e.triggers.map(t=>`<span class="entry-tag">${esc(t)}</span>`).join('')}${status}</div><div class="entry-actions"><button data-action="edit" data-id="${esc(e.id)}">编辑文字</button><button data-action="delete" data-id="${esc(e.id)}">删除</button></div></div></article>`;
  }).join(''):`<div class="card empty-state">${face(3)}<h3>${search||journalFilter!=='all'?'没有找到匹配的记录':'这一页，等你慢慢写。'}</h3><p>${search||journalFilter!=='all'?'试试更换关键词或筛选。':'只要选一个心情，就能留下第一条足迹。'}</p><button class="secondary-button" data-action="${search||journalFilter!=='all'?'reset-filters':'navigate'}" data-view="home">${search||journalFilter!=='all'?'清除筛选':'记下此刻'}</button></div>`;
}

/* ---------- 关怀工具箱 ---------- */
function care(){
  const seeds=seedsOf(entries()),latest=seeds[0],helped=sessions().filter(s=>s.feedback==='better');
  const fav=helped.length?Object.entries(helped.reduce((m,s)=>(m[s.activity]=(m[s.activity]||0)+1,m),{})).sort((a,b)=>b[1]-a[1])[0]:null;
  const list=activities.filter(a=>(!timeFilter||a.minutes<=timeFilter)&&(energyFilter==='all'||a.energy===energyFilter));
  return `<section class="view-intro"><div class="eyebrow">SMALL THINGS, GENTLE CHANGES</div><h1>照顾自己，从一点点开始。</h1><p>不必把情绪“修好”。给自己一个舒服些的选择。</p></section>
  <section class="care-hero"><div class="hero-copy"><span class="eyebrow">给此刻的一个小建议</span>${latest?`<h2>土里还有 ${seeds.length} 颗种子。</h2><p>最近一颗是「${latest.emotion}」，${relDay(latest.ts)}埋下的。挑一个小方法照料它，它会开成一朵花。</p><button class="primary-button" data-action="seed" data-id="${esc(latest.id)}">去照料它 ${icon('arrow')}</button>`:`<h2>留一分钟，只属于自己。</h2><p>无论此刻是什么心情，都可以给自己一段不被打扰的时间。</p><button class="primary-button" data-action="activity" data-id="breath">开始 1 分钟呼吸 ${icon('arrow')}</button>`}</div>${plantArt}</section>
  <div class="section-heading"><div><h2>今天，适合怎样照顾自己？</h2><p>按你现在的时间与精力选择。</p></div></div>
  <div class="filter-group"><span class="filter-label">我有时间</span><div class="chips">${[{v:0,t:'不限'},{v:1,t:'1 分钟'},{v:3,t:'3 分钟内'},{v:5,t:'5 分钟内'},{v:10,t:'10 分钟内'}].map(x=>`<button class="chip ${timeFilter===x.v?'active':''}" data-action="time-filter" data-value="${x.v}">${x.t}</button>`).join('')}</div></div>
  <div class="filter-group"><span class="filter-label">现在精力</span><div class="chips">${[{v:'all',t:'都可以'},{v:'low',t:'只想静静待着'},{v:'medium',t:'想动一动'}].map(x=>`<button class="chip ${energyFilter===x.v?'active':''}" data-action="energy-filter" data-value="${x.v}">${x.t}</button>`).join('')}</div></div>
  ${list.length?GROUPS.map(([g,d])=>{const items=list.filter(a=>CARE_CAT[a.id]===g);return items.length?`<div class="tool-group"><h3>${g}<span>${d}</span></h3><div class="care-cards toolbox">${items.map(a=>activityCard(a)).join('')}</div></div>`:'';}).join(''):`<div class="card empty-state" style="margin-top:24px"><h3>这个组合暂时没有合适的练习</h3><p>可以多留一点时间，或选一个安静的练习。</p><button class="secondary-button" data-action="reset-care">查看全部小方法</button></div>`}
  ${fav?`<div class="reflection"><h3>记住对你有帮助的小事</h3><p>你有 ${helped.length} 次在练习后感觉“轻松了一点”，其中「${CARE_NAME[fav[0]]}」最多（${fav[1]} 次）。下次需要时，可以先从它开始。</p></div>`:''}
  ${safetyCard()}`;
}

/* ---------- 渲染与导航 ---------- */
function render(){
  $('#date-label').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
  $('#demo-banner').innerHTML=state.mode==='demo'?`<div class="demo-banner"><span>示例体验 · 前 14 天的记录和手表信号为模拟数据，所有内容只存在这台设备上</span><span class="demo-actions"><button data-action="reset-demo">重置演示数据</button><button data-action="clear-confirm">清空，开始我的记录 ↗</button></span></div>`:(!storageAvailable?'<div class="demo-banner">当前浏览器无法持久保存，离开前请在设置中导出记录。</div>':'');
  $('#main').innerHTML=view==='home'?home():view==='journal'?journal():care();
  $('#main').classList.remove('animate-in');void $('#main').offsetWidth;$('#main').classList.add('animate-in');
  document.body.dataset.view=view;
  $$('[data-view]').forEach(e=>{if(e.closest('nav')){e.classList.toggle('active',e.dataset.view===view);if(e.dataset.view===view)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');}});
  hydrate();
  if(view==='home'){Garden.update(entries());Garden.mount($('#garden'),{onSeed:openSeed});}else Garden.unmount();
}
function navigate(v){if(!['home','journal','care'].includes(v))v='home';view=v;if(location.hash.slice(1)!==v)history.replaceState(null,'','#'+v);render();window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(v!==view)navigate(v);});
function modal(html){$('#modal-content').innerHTML=`<div class="modal-body"><button class="icon-button modal-close" data-action="close" aria-label="关闭">${icon('close')}</button>${html}</div>`;if(!$('#modal').open)$('#modal').showModal();$('#modal').scrollTop=0;}
function soilSay(text,sub,seedId){const el=$('#soil-say');if(!el)return;el.innerHTML=`<span class="say-label">${icon('seed')}土壤说</span><p>${esc(text)}</p>${sub?`<small>${esc(sub)}</small>`:''}${seedId?`<button class="link-button" data-action="seed" data-id="${esc(seedId)}">现在照料它 ↗</button>`:''}`;el.classList.add('show');clearTimeout(soilSay.t);soilSay.t=setTimeout(()=>el.classList.remove('show'),seedId?9000:6000);}
function scrollToGarden(){const g=$('.garden-card');if(g)g.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'center'});}

/* ---------- 记录：埋下种子 / 种下花 ---------- */
function saveEntry(){
  if(!draft.emotion)return;
  const e={id:'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),ts:Date.now(),emotion:draft.emotion,intensity:draft.intensity,triggers:[...draft.triggers],note:draft.note.trim(),ctx:draftCtx(),source:draft.source||'manual',cared:false};
  state.entries.push(e);persist();draft=blankDraft();
  if(view!=='home')view='home';
  render();scrollToGarden();
  const neg=isNeg(e);Garden.animate(neg?'drop':'bloom',e.id);
  setTimeout(()=>soilSay(HH.soilReply(e.emotion,hash(e.id)),neg?`它落进了「${e.triggers[0]||'浅土'}」那一层。`:'种在了地面上。',neg?e.id:null),reduceMotion()?0:900);
}

/* ---------- 照料：点一颗种子 ---------- */
function openSeed(id){
  const e=entries().find(x=>x.id===id);if(!e)return;
  if(!isNeg(e)||e.cared){modal(`<div class="center">${emoFace(e.emotion,'saved-face')}<div class="eyebrow">A FLOWER</div><h2>这是一朵${e.emotion}开成的花。</h2><p>${dateLabel(e.ts,true)}${e.cared?` · 用「${CARE_NAME[e.careType]||'照料'}」照料过`:''}</p></div>`);return;}
  const recs=HH.recommend(e,entries());
  modal(`<div class="seed-head">${emoFace(e.emotion,'seed-face')}<div><div class="eyebrow">A SEED · 埋在「${e.triggers[0]||'浅土'}」层</div><h2>${e.emotion} · ${INTENSITY[e.intensity-1]}</h2><p>${dateLabel(e.ts,true)}${e.triggers.length?' · '+e.triggers.map(esc).join('、'):''}</p></div></div>
  ${e.note?`<blockquote class="seed-note">${esc(e.note)}</blockquote>`:''}
  ${e.ctx?`<div class="ctx-strip in-modal"><span class="ctx-tag">当时 · 模拟数据</span>${ctxItems(e.ctx)}</div>`:''}
  <h3 class="care-pick-title">为它挑了三种照料</h3>
  <div class="care-options">${recs.map((r,i)=>{const a=actById(r.id);return `<button class="care-option ${a.style}" data-action="activity" data-id="${a.id}" data-entry="${esc(e.id)}" data-minutes="${r.minutes}"><div class="co-top"><span class="activity-tag">${r.cat} · ${r.minutes} 分钟</span>${i===0?'<span class="rank-pill">最适合现在</span>':''}</div><h4>${a.title}</h4><p class="co-reason">${icon('spark')}<span>${esc(r.reason)}</span></p><span class="activity-arrow" aria-hidden="true">↗</span></button>`;}).join('')}</div>
  <p class="care-note">照料完成后，这颗种子会在花园里开成一朵花。</p>${e.intensity>=5?safetyCard(true):''}`);
}

/* ---------- 练习与计时 ---------- */
let activeActivity=null,timer=null,remaining=0,running=false,started=false,tickAt=0,accumulated=0,volume=.5;
function stopTimer(){clearInterval(timer);timer=null;running=false;Ambient.stop();}
function closeModal(){stopTimer();activeActivity=null;if($('#modal').open)$('#modal').close();}
$('#modal').addEventListener('cancel',()=>{stopTimer();activeActivity=null;});$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});
function openActivity(id,opts={}){stopTimer();const a=actById(id);if(!a)return;activeActivity={...a,minutes:opts.minutes||a.minutes,entryId:opts.entry||null};remaining=activeActivity.minutes*60;accumulated=0;started=false;activityScreen();}
function formatTime(s){return `${pad(Math.floor(s/60))}:${pad(Math.floor(s%60))}`;}
function activityScreen(){
  const a=activeActivity,e=a.entryId&&entries().find(x=>x.id===a.entryId);
  modal(`${e?`<div class="caring-for">${emoFace(e.emotion,'tiny-face')}正在照料：${e.emotion} · ${relDay(e.ts)}</div>`:''}<div class="center"><div class="eyebrow">${a.category} · ${a.minutes} 分钟</div><h2>${a.title}</h2><p>${a.intro}</p></div>
  <div class="timer-stage">${a.kind==='breath'?`<div class="segmented center-seg" aria-label="时长">${a.choices.map(m=>`<button data-action="dur" data-value="${m}" class="${a.minutes===m?'active':''}">${m} 分钟</button>`).join('')}</div><div class="breathing-orb" id="breathing-orb"><span id="breath-phase">准备好了</span><small id="breath-count"></small></div>`
  :a.kind==='sound'?`<div class="sound-rings" aria-hidden="true"><i></i><i></i><i></i><span>${a.id==='rain'?'☂':'♫'}</span></div><div class="volume-row"><label for="volume">音量</label><input type="range" min="0" max="100" value="${Math.round(volume*100)}" id="volume"></div>`
  :`<div class="step-list" id="step-list">${a.steps.map((s,i)=>`<div class="${i===0?'current':''}"><span>${i+1}</span><p>${s}</p></div>`).join('')}</div>`}
  <div class="timer-value" id="timer-value">${formatTime(remaining)}</div><div class="timer-copy" id="timer-copy">${a.kind==='breath'?'吸气 4 秒，停 4 秒，呼气 4 秒，再停 4 秒。<br>不必憋得太用力，不舒服就恢复自然呼吸。':a.kind==='sound'?'声音由浏览器实时生成，没有下载任何文件。':'不用完成目标，只需给自己一点时间。'}</div>
  <div class="timer-buttons"><button class="primary-button" data-action="toggle-timer" id="toggle-timer">${a.kind==='sound'?'开始播放':'开始练习'}</button><button class="secondary-button" data-action="finish" id="finish-button" disabled>我做完了</button></div></div>`);
}
function updateTimer(){
  if(!activeActivity||!$('#timer-value'))return;
  const a=activeActivity,total=a.minutes*60,elapsed=accumulated+(running?(Date.now()-tickAt)/1000:0);
  remaining=Math.max(0,total-elapsed);$('#timer-value').textContent=formatTime(Math.ceil(remaining));
  if(a.kind==='breath'&&$('#breath-phase')){
    const p=elapsed%16,ph=Math.floor(p/4),w=p%4,names=['吸气','停一下','呼气','停一下'];
    $('#breath-phase').textContent=names[ph];$('#breath-count').textContent=4-Math.floor(w);
    const scale=ph===0?.78+w/4*.3:ph===1?1.08:ph===2?1.08-w/4*.3:.78;
    if(!reduceMotion())$('#breathing-orb').style.transform=`scale(${scale.toFixed(3)})`;
  }
  if($('#step-list')){const n=a.steps.length,cur=Math.min(n-1,Math.floor(elapsed/total*n));$$('#step-list > div').forEach((d,i)=>{d.classList.toggle('current',i===cur);d.classList.toggle('done',i<cur);});}
  if(remaining<=0){accumulated=total;stopTimer();$('#toggle-timer').disabled=true;$('#toggle-timer').textContent='时间到了';$('#finish-button').classList.add('pulse');$('#timer-copy').textContent='做完了。点「我做完了」，感受一下现在的自己。';}
}
function toggleTimer(){
  if(!activeActivity)return;
  if(running){accumulated+=(Date.now()-tickAt)/1000;stopTimer();$('#toggle-timer').textContent='继续';if($('#breath-phase'))$('#breath-phase').textContent='慢慢来';$('.sound-rings')&&$('.sound-rings').classList.remove('playing');}
  else{
    started=true;running=true;tickAt=Date.now();$('#toggle-timer').textContent='暂停';$('#finish-button').disabled=false;$$('[data-action="dur"]').forEach(b=>b.disabled=true);
    if(activeActivity.kind==='sound'){try{Ambient.setVolume(volume);Ambient.play(activeActivity.id).catch(()=>toast('声音未能播放，请重新点击开始。'));$('.sound-rings').classList.add('playing');}catch(err){toast('当前浏览器无法播放声音，可以换一个练习。');}}
    timer=setInterval(updateTimer,250);updateTimer();
  }
}
function finishActivity(){
  if(!activeActivity||!started)return;
  const a=activeActivity,elapsed=Math.min(a.minutes*60,Math.floor(accumulated+(running?(Date.now()-tickAt)/1000:0)));stopTimer();activeActivity={...a,elapsed};
  modal(`<div class="center">${face(4,'saved-face')}<div class="eyebrow">THANK YOU FOR SHOWING UP</div><h2>现在，感觉怎么样？</h2><p>你为自己留了 ${elapsed<60?`${elapsed} 秒`:`${Math.floor(elapsed/60)} 分 ${elapsed%60} 秒`}。<br>${a.entryId?'选一个，这颗种子就会开花。':'没有变化也没关系，感受本来就需要时间。'}</p><div class="feedback-buttons"><button data-action="feedback" data-value="better">轻松了一点</button><button data-action="feedback" data-value="same">差不多</button><button data-action="feedback" data-value="worse">还不太舒服</button></div><p class="feedback-note small">留下感受，慢慢找到适合自己的方式。</p></div>`);
}
const worseHtml=()=>`<div class="center">${face(3,'saved-face')}<h2>那我们就先停下来。</h2><p>不用勉强继续练习。可以喝口水、换个舒服的位置，或联系一个你信任的人。</p></div>${safetyCard(true)}<div class="modal-actions" style="justify-content:center"><button class="primary-button" data-action="close">好，慢慢来</button></div>`;
function feedback(value){
  const a=activeActivity;if(!a)return;
  state.sessions.push({id:'s'+Date.now().toString(36),ts:Date.now(),activity:a.id,seconds:a.elapsed,feedback:value,entryId:a.entryId});
  const e=a.entryId&&state.entries.find(x=>x.id===a.entryId);
  if(state.mode!=='demo'&&state.mode!=='personal')state.mode='personal';
  if(e&&!e.cared){
    e.cared=true;e.careType=a.id;e.caredTs=Date.now();persist();activeActivity=null;closeModal();
    view='home';history.replaceState(null,'','#home');render();scrollToGarden();
    Garden.animate('transform',e.id);
    const line=value==='better'?'它开花了。记住这个小小的好转。':value==='same'?'它开花了。没有变化，也不是白做。':'它还是开花了。不用勉强自己。';
    setTimeout(()=>soilSay(line,`${e.emotion} → 已转化 · ${CARE_NAME[a.id]}`),reduceMotion()?0:1600);
    if(value==='worse')setTimeout(()=>modal(worseHtml()),reduceMotion()?300:3200);
    return;
  }
  persist();activeActivity=null;render();
  if(value==='worse'){modal(worseHtml());return;}
  modal(`<div class="center">${face(value==='better'?4:3,'saved-face')}<h2>${value==='better'?'记住这个小小的好转。':'没有变化，也不是白做了。'}</h2><p>${value==='better'?'这个方法对你有一点帮助，我们替你记下了。':'不必追求立刻变好。下次可以试试另一种方式，或只是休息。'}</p><div class="modal-actions" style="justify-content:center"><button class="primary-button" data-action="close">好，慢慢来</button></div></div>`);
}

/* ---------- 设置 / 关于 ---------- */
function settings(){modal(`<div class="eyebrow">YOUR SPACE, YOUR CHOICE</div><h2>你的记录，由你决定。</h2><p>记录只保存在当前设备的这个浏览器里。清除浏览器数据、更换设备或使用无痕模式，可能无法找回。建议按需导出备份。</p><div class="setting-row"><div><h3>导出我的记录</h3><p>${state.entries.length} 条情绪记录 · ${state.sessions.length} 次照料</p></div><button class="secondary-button" data-action="export">导出 JSON</button></div><div class="setting-row"><div><h3>重置演示数据</h3><p>恢复 14 天的模拟记录，当前的记录会被替换。</p></div><button class="text-button" data-action="reset-demo">重置</button></div><div class="setting-row"><div><h3>删除我的全部数据</h3><p>包括日记与照料记录，删除后无法恢复。</p></div><button class="danger-button" data-action="clear-confirm">删除</button></div>`);}
function privacy(){modal(`<div class="eyebrow">A PRIVATE LITTLE CORNER</div><h2>有些话，只留给自己。</h2><p>缓缓无需注册。你的日记、情绪标签与照料记录只保存在当前浏览器，不上传到服务器，也不会发给 AI 模型。页面本身不发出任何外部网络请求。</p><ul class="modal-list"><li>公开的是这个工具，不是你的日记。</li><li>共用设备上，其他使用同一浏览器的人可能看到记录。</li><li>你可以随时导出、删除自己的全部记录。</li><li>清除浏览器数据后，记录也会被清除。</li></ul><div class="modal-actions"><button class="primary-button" data-action="close">知道了</button></div>`);}
function about(){modal(`<div class="eyebrow">ABOUT HUAN HUAN</div><h2>难受的情绪，先埋成一颗种子。</h2><p>缓缓是一本情绪日记，也是一座小花园。难受的时候不必立刻处理它，先把它埋下；等你有力气了，用呼吸、声音或走一走去照料它，它会慢慢开成一朵花。</p><ul class="modal-list"><li><b>感知</b>：手表提示只描述身体信号（HRV、噪音），从不替你命名情绪。</li><li><b>记录</b>：二十秒埋下一颗种子；只有情绪是必选，情境数据自动附带。</li><li><b>归因</b>：按触发因素分层埋下，洞察都由你的数据实时计算。</li><li><b>调节</b>：按情绪、触发与身体状态推荐三种照料，每条都写明理由。</li><li><b>回顾</b>：照料过的种子开成花；情绪足迹里能看到照料之后的变化。</li></ul><p>当前版本的洞察与推荐基于透明的规则，没有接入大模型。这里提供日常记录和自我关怀，不提供心理诊断或治疗。</p>${safetyCard(true)}<div class="modal-actions"><button class="primary-button" data-action="close">给自己留个片刻</button></div>`);}
function exportData(){const blob=new Blob([JSON.stringify({app:'缓缓',version:2,exportedAt:new Date().toISOString(),entries:state.entries,sessions:state.sessions},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`huanhuan-${dayKey(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('记录已导出。好好保管这个只属于你的文件。');}

/* ---------- 设计说明面板 ---------- */
const NOTES_KEY='huanhuan-notes';
function setNotes(open){document.body.classList.toggle('notes-open',open);$('#notes-toggle').setAttribute('aria-expanded',open);try{localStorage.setItem(NOTES_KEY,open?'1':'0');}catch(e){}}
(function(){let pref=null;try{pref=localStorage.getItem(NOTES_KEY);}catch(e){}setNotes(pref?pref==='1':window.innerWidth>=1360);})();

/* ---------- 事件 ---------- */
document.addEventListener('input',e=>{
  if(e.target.id==='note'){draft.note=e.target.value;$('#char-count').textContent=draft.note.length;}
  if(e.target.id==='journal-search'){search=e.target.value;$('#journal-list').innerHTML=entryList();hydrate();}
  if(e.target.id==='volume'){volume=+e.target.value/100;Ambient.setVolume(volume);}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='note'&&draft.emotion){e.preventDefault();saveEntry();}if(e.key==='Escape'&&document.body.classList.contains('notes-open')&&window.innerWidth<1360)setNotes(false);});
document.addEventListener('change',e=>{if(e.target.id==='journal-filter'){journalFilter=e.target.value;$('#journal-list').innerHTML=entryList();hydrate();}});
document.addEventListener('pointermove',e=>{
  const wrap=e.target.closest&&e.target.closest('#trend');const tip=$('#chart-tip'),cross=$('#cross');if(!tip)return;
  if(!wrap){tip.classList.remove('show');if(cross)cross.style.opacity=0;return;}
  const svg=wrap.querySelector('svg'),b=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal,x=(e.clientX-b.left)/b.width*vb.width;
  let best=null,bd=1e9;svg.querySelectorAll('circle[data-tip]').forEach(c=>{const d=Math.abs(+c.getAttribute('cx')-x);if(d<bd){bd=d;best=c;}});
  if(!best||bd>40){tip.classList.remove('show');cross.style.opacity=0;return;}
  const cx=+best.getAttribute('cx'),cy=+best.getAttribute('cy');cross.setAttribute('x1',cx);cross.setAttribute('x2',cx);cross.style.opacity=1;
  tip.textContent=best.dataset.tip;tip.classList.add('show');
  const wb=wrap.getBoundingClientRect(),px=b.left-wb.left+cx/vb.width*b.width,py=b.top-wb.top+cy/vb.height*b.height;
  tip.style.left=Math.max(70,Math.min(wb.width-70,px))+'px';tip.style.top=py+'px';
});
document.addEventListener('click',e=>{
  const nav=e.target.closest('nav a');if(nav){e.preventDefault();navigate(nav.dataset.view);return;}
  const b=e.target.closest('[data-action]');if(!b)return;
  const a=b.dataset.action,id=b.dataset.id,v=b.dataset.value;
  if(a==='emotion'){draft.emotion=v;$$('.mood-choice').forEach(el=>{const s=el.dataset.value===v;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',s);});$('#save-button').disabled=false;$('#save-label').textContent=saveLabel();}
  else if(a==='inten'){draft.intensity=+v;$$('.inten').forEach(el=>{const i=+el.dataset.value;el.classList.toggle('on',i<=draft.intensity);el.setAttribute('aria-pressed',i===draft.intensity);});$('#inten-label').textContent=`${draft.intensity} · ${INTENSITY[draft.intensity-1]}`;}
  else if(a==='tag'){if(draft.triggers.includes(v))draft.triggers=draft.triggers.filter(t=>t!==v);else draft.triggers.push(v);b.classList.toggle('active');b.setAttribute('aria-pressed',draft.triggers.includes(v));}
  else if(a==='save')saveEntry();
  else if(a==='nudge-yes'){draft.source='watch';render();const c=$('#checkin');c.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'});c.classList.add('flash');setTimeout(()=>c.querySelector('.mood-choice').focus({preventScroll:true}),reduceMotion()?0:500);}
  else if(a==='nudge-no'){nudge.hidden=true;if(draft.source==='watch'){draft.source=null;}$('#nudge-slot').innerHTML=nudgeCard();hydrate();toast('好。那就继续你的一天。');}
  else if(a==='simulate'){simulateSignal();$('#nudge-slot').innerHTML=nudgeCard();hydrate();const n=$('.nudge');n.classList.add('arrive');}
  else if(a==='seed')openSeed(id);
  else if(a==='seed-list'){journalFilter='seed';navigate('journal');setTimeout(()=>{const t=$('.journal-toolbar');t&&t.scrollIntoView({behavior:'auto'});},0);}
  else if(a==='navigate')navigate(b.dataset.view);
  else if(a==='close')closeModal();
  else if(a==='activity')openActivity(id,{entry:b.dataset.entry,minutes:+b.dataset.minutes||0});
  else if(a==='dur'){if(started)return;activeActivity.minutes=+v;remaining=+v*60;$$('[data-action="dur"]').forEach(x=>x.classList.toggle('active',x===b));$('#timer-value').textContent=formatTime(remaining);}
  else if(a==='toggle-timer')toggleTimer();
  else if(a==='finish')finishActivity();
  else if(a==='feedback')feedback(v);
  else if(a==='period'){period=+v;render();}
  else if(a==='time-filter'){timeFilter=+v;render();}
  else if(a==='energy-filter'){energyFilter=v;render();}
  else if(a==='reset-care'){timeFilter=0;energyFilter='all';render();}
  else if(a==='reset-filters'){search='';journalFilter='all';render();}
  else if(a==='settings')settings();
  else if(a==='privacy')privacy();
  else if(a==='about')about();
  else if(a==='export')exportData();
  else if(a==='notes-toggle')setNotes(!document.body.classList.contains('notes-open'));
  else if(a==='reset-demo')modal(`<h2>重置演示数据？</h2><p>会恢复 14 天的模拟记录，当前的 ${state.entries.length} 条记录和 ${state.sessions.length} 次照料会被替换。需要的话，可以先在设置里导出。</p><div class="modal-actions"><button class="secondary-button" data-action="close">先不要</button><button class="primary-button" data-action="reset-demo-ok">重置</button></div>`);
  else if(a==='reset-demo-ok'){state=freshState();persist();draft=blankDraft();nudge={time:'15:20',drop:18,noise:71,hidden:false};closeModal();navigate('home');toast('演示数据已重置。');}
  else if(a==='clear-confirm')modal(`<h2>清空全部记录？</h2><p>将删除 ${state.entries.length} 条记录和 ${state.sessions.length} 次照料，无法恢复。需要备份的话，可以先导出。</p><div class="modal-actions"><button class="secondary-button" data-action="settings">先保留</button><button class="primary-button" data-action="clear-data">确认清空</button></div>`);
  else if(a==='clear-data'){state={v:2,entries:[],sessions:[],mode:'personal'};persist();closeModal();navigate('home');toast('已清空。这里开始，只留下你的记录。');}
  else if(a==='edit'){const item=state.entries.find(x=>x.id===id);if(item)modal(`<h2>给这一刻，多留一句话。</h2><p>${dateLabel(item.ts,true)} · ${item.emotion}</p><label class="sr-only" for="edit-note">编辑日记文字</label><textarea class="edit-input" id="edit-note" maxlength="200">${esc(item.note)}</textarea><div class="modal-actions"><button class="text-button" data-action="close">取消</button><button class="primary-button" data-action="save-edit" data-id="${esc(id)}">保存修改</button></div>`);}
  else if(a==='save-edit'){const item=state.entries.find(x=>x.id===id);if(item){item.note=$('#edit-note').value.trim();persist();closeModal();render();toast('修改已保存。');}}
  else if(a==='delete')modal(`<h2>删除这一刻的记录？</h2><p>删除后将无法恢复，花园和情绪足迹也会同步更新。</p><div class="modal-actions"><button class="secondary-button" data-action="close">先保留</button><button class="primary-button" data-action="confirm-delete" data-id="${esc(id)}">确认删除</button></div>`);
  else if(a==='confirm-delete'){state.entries=state.entries.filter(x=>x.id!==id);persist();closeModal();render();toast('记录已删除。');}
});
render();
