'use strict';
/* 缓缓 · 数据层 v3
   原则：
   - 原始表达（文字 / 无言）、用户自报的标签、关怀尝试与反馈、空间里的视觉形态分开保存。
   - 用户没说的就是未知（null），不补默认值，也不从动作里猜情绪。
   - 个人记录没有任何传感器数据；只有示例里有“模拟”情境，并带来源标记。
   - 洞察只描述计数与同一次练习的反馈，写清样本量，不推断因果或疗效。
   无 DOM 依赖，可在 node 中测试。 */
(function(root){
const EMO={
  '焦虑':{c:'#e6b97f',d:'#9c7440'},
  '烦躁':{c:'#e39d88',d:'#a05a46'},
  '低落':{c:'#a6b7d8',d:'#5c6f94'},
  '疲惫':{c:'#bfb3d4',d:'#7a6c96'},
  '委屈':{c:'#e5adc2',d:'#9c627b'},
  '迷茫':{c:'#a1c6c1',d:'#56837e'},
  '平静':{c:'#b1caac',d:'#668562'},
  '开心':{c:'#f2cc8f',d:'#a9843f'}
};
const UNNAMED={c:'#d9d2e0',d:'#8a8095'};
const EMOTIONS=Object.keys(EMO);
const COMFORT=['平静','开心'];
const TRIG=['求职','学业','工作','社交','家庭','睡眠','身体','环境'];
const INTENSITY=['很轻','有一点','中等','挺强','很强烈'];
const CARE_NAME={breath:'方块呼吸',meditate:'正念片刻',music:'无词和声',rain:'雨声',scan:'身体扫描',stretch:'拉伸',walk:'散步'};
const CARE_CAT={breath:'呼吸',meditate:'呼吸',music:'聆听',rain:'聆听',scan:'身体',stretch:'身体',walk:'身体'};
const FEEDBACK={better:'轻松了一点',same:'差不多',worse:'还不太舒服'};
const WK=['周日','周一','周二','周三','周四','周五','周六'];

function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(str){let h=2166136261;str=String(str);for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0;}
function sod(ts){const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime();}
function addDays(ts,n){const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime();}
function partOfDay(h){return h<6?'深夜':h<12?'早上':h<18?'下午':'晚上';}
const fmt1=n=>(Math.round(n*10)/10).toFixed(1);
const named=e=>!!(e.emotion&&EMO[e.emotion]);
/* 可用于强度统计：用户真的选了强度（旧版本里默认的 3 不算） */
const hasIntensity=e=>Number.isInteger(e.intensity)&&!(e.legacy&&e.legacy.intensityMayBeDefault);

/* 视觉形态：保存时生成一次，之后不随情绪或照料改写 */
function makeForm(id){const h=hash(id);return{x:.06+(h%1000)/1000*.88,depth:((h>>>10)%1000)/1000,seed:h};}
function blankEntry(o){
  const id=o.id||('e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
  return Object.assign({id,ts:Date.now(),kind:'text',text:null,durationSec:null,emotion:null,intensity:null,triggers:[],note:'',ctx:null,form:makeForm(id)},o,{id});
}

/* ---------- 示例数据：14 天，明确标记 demo:true；情境数据为模拟 ---------- */
const DEMO_TEXT={
  '焦虑':['面试结果还没出来，一直忍不住刷邮箱。','简历投了二十份，回复只有两个。','明天群面，脑子里一遍遍过可能被问的问题。','睡不着，一直在想 offer 的事。'],
  '烦躁':['室友打游戏到很晚。','三个 deadline 挤在同一天。','地铁太挤了，被踩了好几脚。'],
  '低落':['又收到一封感谢信。','一个人吃晚饭，有点空。','看到同学都签了。'],
  '疲惫':['连着两天熬夜改简历。','实习加上课，真的好累。','开了一下午的会。'],
  '委屈':['组会上被当众否定。','明明不是我的错，却要我道歉。'],
  '迷茫':['不知道该考研还是工作。','投了好多方向，越投越不确定。'],
  '平静':['和朋友散了很久的步。','下午阳光很好，在图书馆待了一下午。','把房间收拾干净了。'],
  '开心':['收到了一面的邀请！','妈妈打来电话，聊了很久。','吃到了想吃的面。']
};
const SUNDAY_TEXT=['周日晚上，一想到明天就烦。','周末又这样过去了。','明天又要开始投简历。'];
const UNNAMED_TEXT=['说不上来是什么感觉。','今天就想写一句话。','有点乱，先放这儿。'];

function genDemo(now){
  const R=rng(20261021);
  const pick=a=>a[Math.floor(R()*a.length)];
  const wpick=o=>{let t=0;for(const k in o)t+=o[k];let r=R()*t;for(const k in o){r-=o[k];if(r<=0)return k;}return Object.keys(o)[0];};
  const sleeps=[7.2,5.1,6.8,5.5,7.6,4.9,7.0,6.5,5.3,7.4,5.8,6.9,5.2,7.1];
  const weathers=['晴','多云','阴','小雨'];
  const pref={'焦虑':['breath','scan','music'],'烦躁':['walk','breath','rain'],'低落':['walk','music','rain'],'疲惫':['music','stretch','rain'],'委屈':['music','breath','walk'],'迷茫':['walk','meditate','breath']};
  const entries=[],sessions=[];const today=sod(now);
  for(let i=14;i>=1;i--){
    const day=addDays(today,-i),dow=new Date(day).getDay(),sleep=sleeps[14-i],weather=pick(weathers);
    const slots=[8.6,12.4,16.2,20.6].filter(()=>R()<.55);
    if(!slots.length)slots.push(pick([12.4,20.6]));
    if(dow===0){if(!slots.includes(20.6))slots.push(20.6);slots.push(22.1);}
    slots.sort((a,b)=>a-b);
    slots.forEach(slot=>{
      const hr=slot+(R()-.5)*1.2,ts=day+Math.round(hr*60)*60000;
      let emotion,intensity=null,triggers=[],text,kind='text',durationSec=null;
      if(dow===0&&hr>=18){emotion='烦躁';intensity=R()<.75?5:4;triggers=['求职',R()<.5?'家庭':'学业'];text=pick(SUNDAY_TEXT);}
      else if(R()<.1){emotion=null;kind=R()<.5?'wordless':'text';text=kind==='text'?pick(UNNAMED_TEXT):null;durationSec=kind==='wordless'?20+Math.floor(R()*90):null;}
      else if(sleep<6&&R()<.7){emotion='焦虑';intensity=3+(R()<.4?1:0)+(sleep<5.2?1:0);if(R()<.8)triggers.push('求职');triggers.push('睡眠');text=pick(DEMO_TEXT[emotion]);}
      else{
        emotion=wpick(sleep<6?{'烦躁':1,'低落':1,'疲惫':1.4,'迷茫':.8,'平静':.6,'开心':.5}:{'焦虑':.75,'烦躁':.6,'低落':1,'疲惫':.9,'委屈':.7,'迷茫':.9,'平静':1.5,'开心':1.3});
        intensity=2+Math.floor(R()*3);
        if(!COMFORT.includes(emotion)){
          if(R()<.5)triggers.push('求职');
          triggers.push(pick({'烦躁':['环境','社交','学业'],'低落':['社交','学业','家庭'],'疲惫':['工作','学业','身体'],'委屈':['社交','工作','家庭'],'迷茫':['学业','工作'],'焦虑':['学业','工作']}[emotion]));
        }else triggers=[R()<.55?'社交':pick(['家庭','身体','环境'])];
        text=pick(DEMO_TEXT[emotion]);
      }
      const id='d'+ts.toString(36);
      entries.push(blankEntry({id,ts,kind,text,durationSec,emotion,intensity,triggers:[...new Set(triggers)],demo:true,
        ctx:{source:'simulated',measuredAt:ts,sleepHours:sleep,steps:Math.round(hr*380+R()*1500),hrvMs:Math.round(36+R()*20),noiseDb:Math.round(40+R()*24),weather}}));
      if(emotion&&!COMFORT.includes(emotion)&&R()<.55){
        const act=pick(pref[emotion]),planned=act==='walk'?600:act==='breath'?60:180,full=R()<.7;
        sessions.push({id:'ds'+ts.toString(36),ts:ts+(10+Math.floor(R()*40))*60000,activity:act,plannedSec:planned,seconds:full?planned:Math.round(planned*(.2+R()*.6)),ended:full?'complete':'early',
          feedback:wpick({better:2.6,same:1.6,worse:.7,skip:.7}),entryId:id,demo:true});
      }
    });
  }
  sessions.forEach(s=>{if(s.feedback==='skip')s.feedback=null;});
  return{entries,sessions};
}

/* ---------- 旧数据迁移（huanhuan-v2 → v3） ----------
   - mock:true 视为示例，不进入个人数据（示例会重新生成）。
   - 其余记录全部保留为个人记录；旧版自动附带的 ctx 标记为 simulated，不当作测量。
   - 旧版 cared/careType 只保留在 legacy 里，不再表示“已转化”。
   - 旧版默认强度 3 无法区分是否用户真的选过，标记 intensityMayBeDefault，不参与强度统计。 */
function migrateV2(old){
  const report={personalEntries:0,personalSessions:0,demoEntriesDropped:0,demoSessionsDropped:0};
  const personal={entries:[],sessions:[]};
  if(!old||!Array.isArray(old.entries))return{personal,report};
  const mockIds=new Set();
  old.entries.forEach(e=>{
    if(!e||typeof e!=='object')return;
    if(e.mock){mockIds.add(e.id);report.demoEntriesDropped++;return;}
    const id=String(e.id||('m2'+Math.random().toString(36).slice(2)));
    const ts=Number.isFinite(e.ts)?e.ts:Number.isFinite(Date.parse(e.date))?Date.parse(e.date):Date.now();
    personal.entries.push(blankEntry({id,ts,kind:'text',text:typeof e.note==='string'&&e.note?e.note:null,
      emotion:EMO[e.emotion]?e.emotion:null,intensity:Number.isInteger(e.intensity)?e.intensity:null,
      triggers:Array.isArray(e.triggers)?e.triggers.filter(t=>TRIG.includes(t)):[],note:'',
      ctx:e.ctx?Object.assign({},e.ctx,{source:'simulated',measuredAt:null,legacyNote:'旧版本自动附带的模拟数据，不是测量值'}):null,
      legacy:{from:'huanhuan-v2',intensityMayBeDefault:e.intensity===3,cared:!!e.cared,careType:e.careType||null,source:e.source||null,original:e}}));
    report.personalEntries++;
  });
  (Array.isArray(old.sessions)?old.sessions:[]).forEach(s=>{
    if(!s)return;
    if(s.entryId&&mockIds.has(s.entryId)){report.demoSessionsDropped++;return;}
    personal.sessions.push({id:String(s.id||('s2'+Math.random().toString(36).slice(2))),ts:Number.isFinite(s.ts)?s.ts:Date.parse(s.date)||Date.now(),activity:s.activity,
      plannedSec:null,seconds:Number.isFinite(s.seconds)?s.seconds:null,ended:null,feedback:FEEDBACK[s.feedback]?s.feedback:null,entryId:s.entryId||null,legacy:{from:'huanhuan-v2'}});
    report.personalSessions++;
  });
  return{personal,report};
}

/* ---------- 分析 ---------- */
function inRange(list,days,now){const start=addDays(sod(now||Date.now()),-days+1);return list.filter(x=>x.ts>=start);}
function emotionStats(entries){
  const rows=EMOTIONS.map(name=>{const es=entries.filter(e=>e.emotion===name),wi=es.filter(hasIntensity);return{name,n:es.length,nI:wi.length,avg:mean(wi.map(e=>e.intensity))};}).filter(r=>r.n);
  const unnamed=entries.filter(e=>!named(e)).length;
  return{rows:rows.sort((a,b)=>b.n-a.n),unnamed};
}
function triggerStats(entries){
  return TRIG.map((t,i)=>{
    const es=entries.filter(e=>e.triggers&&e.triggers.includes(t));
    const by={};es.forEach(e=>{const k=named(e)?e.emotion:'未命名';by[k]=(by[k]||0)+1;});
    const wi=es.filter(hasIntensity);
    return{t,i,n:es.length,by,comfort:es.filter(e=>COMFORT.includes(e.emotion)).length,nI:wi.length,avg:mean(wi.map(e=>e.intensity))};
  }).filter(x=>x.n).sort((a,b)=>b.n-a.n);
}
function feedbackStats(sessions,activity){
  const s=sessions.filter(x=>(!activity||x.activity===activity));
  const withFb=s.filter(x=>x.feedback);
  return{n:s.length,nFb:withFb.length,better:withFb.filter(x=>x.feedback==='better').length,same:withFb.filter(x=>x.feedback==='same').length,worse:withFb.filter(x=>x.feedback==='worse').length};
}
/* 只有同一次记录里同时存在练习前后强度，才计算变化（当前界面不收集，留给以后） */
function pairedChange(sessions){
  const p=sessions.filter(s=>Number.isInteger(s.preIntensity)&&Number.isInteger(s.postIntensity));
  return p.length?{n:p.length,delta:mean(p.map(s=>s.postIntensity-s.preIntensity))}:null;
}
function insights(entries,sessions,opts={}){
  const out=[],demo=!!opts.demo,n=entries.length;
  if(n<5)return out;
  const caveat=demo?'示例数据中的计数，只用来展示分析方式，不说明因果。':'只是计数，不说明因果；记录越多越有参考价值。';
  // 1 最常一起出现的触发
  const ts=triggerStats(entries);
  if(ts[0]&&ts[0].n>=3){
    const t=ts[0],top=Object.entries(t.by).sort((a,b)=>b[1]-a[1])[0];
    out.push({key:'trigger',eyebrow:'最常提到的事',big:t.t,text:`${n} 条记录里有 ${t.n} 条标了「${t.t}」，其中「${top[0]}」最多（${top[1]} 条）。`,caveat});
  }
  // 2 时间里的规律：某个时段里，某种自报情绪占多数
  const B={};entries.filter(named).forEach(e=>{const d=new Date(e.ts),k=d.getDay()+'|'+partOfDay(d.getHours());(B[k]=B[k]||[]).push(e);});
  let best=null;
  for(const k in B){const es=B[k];if(es.length<3)continue;const c={};es.forEach(e=>c[e.emotion]=(c[e.emotion]||0)+1);const [emo,cnt]=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];const share=cnt/es.length;if(share>=.6&&(!best||cnt>best.cnt||cnt===best.cnt&&share>best.share))best={k,emo,cnt,share,n:es.length};}
  if(best){const [dw,pd]=best.k.split('|');out.push({key:'time',eyebrow:'时间里的规律',big:WK[+dw]+pd,text:`${WK[+dw]}${pd}的 ${best.n} 条记录里，有 ${best.cnt} 条你选了「${best.emo}」。`,caveat});}
  // 3 舒服的时刻
  const comfy=entries.filter(e=>COMFORT.includes(e.emotion));
  if(comfy.length>=3){
    const c={};comfy.forEach(e=>(e.triggers||[]).forEach(t=>c[t]=(c[t]||0)+1));const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
    if(top&&top[1]>=2)out.push({key:'comfort',eyebrow:'舒服的时刻',big:top[0],text:`选了平静或开心的 ${comfy.length} 条记录里，有 ${top[1]} 条和「${top[0]}」有关。`,caveat:'好的时刻也值得被看见。'});
  }
  // 4 练习后的反馈：同一次练习的自评，不是情绪变化
  const acts={};sessions.filter(s=>s.feedback).forEach(s=>{(acts[s.activity]=acts[s.activity]||[]).push(s);});
  const topAct=Object.entries(acts).sort((a,b)=>b[1].length-a[1].length)[0];
  if(topAct&&topAct[1].length>=3){
    const f=feedbackStats(sessions,topAct[0]);
    out.push({key:'practice',eyebrow:'练习之后你怎么说',big:CARE_NAME[topAct[0]]||topAct[0],text:`你在 ${f.nFb} 次「${CARE_NAME[topAct[0]]||topAct[0]}」后留下了感受：${f.better} 次轻松了一点，${f.same} 次差不多，${f.worse} 次还不太舒服。`,
      bars:[{label:FEEDBACK.better,v:f.better/f.nFb,n:f.better},{label:FEEDBACK.same,v:f.same/f.nFb,n:f.same},{label:FEEDBACK.worse,v:f.worse/f.nFb,n:f.worse}],caveat:'这是练习结束时的自评，不代表情绪被改善或解决。'});
  }
  // 5 示例专属：模拟睡眠 × 自报焦虑（明确标为模拟）
  if(demo){
    const withSleep=entries.filter(e=>e.ctx&&e.ctx.source==='simulated'&&typeof e.ctx.sleepHours==='number'&&named(e));
    const low=withSleep.filter(e=>e.ctx.sleepHours<6),ok=withSleep.filter(e=>e.ctx.sleepHours>=6);
    if(low.length>=3&&ok.length>=3){
      const a=low.filter(e=>e.emotion==='焦虑').length,b=ok.filter(e=>e.emotion==='焦虑').length;
      out.push({key:'sleep',eyebrow:'模拟睡眠 × 自报焦虑',big:`${a}/${low.length}`,simulated:true,
        text:`在模拟睡眠不足 6 小时的 ${low.length} 条记录里，有 ${a} 条选了焦虑；其余 ${ok.length} 条里有 ${b} 条。`,
        bars:[{label:'睡眠 < 6h',v:a/low.length,n:a},{label:'睡眠 ≥ 6h',v:b/ok.length,n:b}],caveat:'睡眠数据是模拟的，这个关联是示例里刻意设计的，不代表真实规律。'});
    }
  }
  return out.slice(0,demo?5:4);
}

/* ---------- 关怀推荐：只用用户自报的情绪与同一练习的反馈；不用传感器 ---------- */
const BASE={'焦虑':['breath','scan','music'],'烦躁':['walk','breath','rain'],'低落':['walk','music','rain'],'疲惫':['music','stretch','scan'],'委屈':['music','breath','walk'],'迷茫':['walk','meditate','breath'],'平静':['meditate','walk','music'],'开心':['walk','music','meditate']};
const WHY={breath:'放慢呼吸，是很多人用来让身体慢下来的方式。',meditate:'不需要改变什么，只是留意当下。',music:'什么都不用做，听一会儿就好。',rain:'把注意力交给一段连续的声音。',scan:'从头到脚感受一遍身体，适合不想动的时候。',stretch:'把积在肩颈的紧绷松开一点。',walk:'换个环境，让身体带着情绪走一走。'};
function recommend(emotion,sessions){
  const ids=(BASE[emotion]||['breath','music','walk']).slice();
  return ids.map((id,i)=>{
    const f=feedbackStats(sessions,id);
    let reason=emotion?`你选了「${emotion}」。${WHY[id]}`:WHY[id];
    if(f.nFb>=2)reason=`你在 ${f.nFb} 次${CARE_NAME[id]}后留下了感受，其中 ${f.better} 次说轻松了一点。`;
    return{id,cat:CARE_CAT[id],reason,score:(3-i)+(f.nFb>=2?(f.better-f.worse)/f.nFb:0)};
  }).sort((a,b)=>b.score-a.score);
}

/* ---------- 文字的回应：少量透明关键词规则；不理解全文，不补写事实 ---------- */
const REPLY_RULES=[
  [/(想死|不想活|自杀|轻生|结束生命|伤害自己)/,'谢谢你写下来。如果你此刻有伤害自己的念头，请先联系身边的人，或看看「需要帮助时」里的电话。','help'],
  [/(开心|高兴|好消息|太好了|喜欢|幸福|顺利)/,'这一点好，也留在这里。'],
  [/(烦|气死|生气|火大|恼)/,'烦的感觉，可以先放在这里。'],
  [/(累|疲|困|撑不住|好乏)/,'累的时候，不用再多说什么。'],
  [/(难过|伤心|哭|低落|失落|委屈)/,'难过也可以在这里待着。'],
  [/(担心|焦虑|紧张|害怕|怕|不安)/,'担心的事，先放在这里，不用现在想完。'],
  [/(不知道|迷茫|乱|说不清)/,'说不清也没关系。']
];
function textReply(text){
  const t=String(text||'');
  for(const [re,line,flag] of REPLY_RULES)if(re.test(t))return{line,flag:flag||null};
  return{line:'这段话可以先留在这里。',flag:null};
}

root.HH={EMO,UNNAMED,EMOTIONS,COMFORT,TRIG,INTENSITY,CARE_NAME,CARE_CAT,FEEDBACK,WK,rng,hash,mean,sod,addDays,fmt1,named,hasIntensity,makeForm,blankEntry,genDemo,migrateV2,inRange,emotionStats,triggerStats,feedbackStats,pairedChange,insights,recommend,textReply};
})(typeof window!=='undefined'?window:globalThis);
