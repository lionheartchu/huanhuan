'use strict';
/* 缓缓 · 数据层：情绪模型、演示数据、可计算的洞察与照料推荐。无 DOM 依赖。 */
(function(root){
const EMO={
  '焦虑':{v:-1,c:'#e6b97f',d:'#9c7440'},
  '烦躁':{v:-1,c:'#e39d88',d:'#a05a46'},
  '低落':{v:-1,c:'#a6b7d8',d:'#5c6f94'},
  '疲惫':{v:-1,c:'#bfb3d4',d:'#7a6c96'},
  '委屈':{v:-1,c:'#e5adc2',d:'#9c627b'},
  '迷茫':{v:-1,c:'#a1c6c1',d:'#56837e'},
  '平静':{v:1,c:'#b1caac',d:'#668562'},
  '开心':{v:1,c:'#f2cc8f',d:'#a9843f'}
};
const NEG=['焦虑','烦躁','低落','疲惫','委屈','迷茫'], POS=['平静','开心'], EMOTIONS=NEG.concat(POS);
const TRIG=['求职','学业','工作','社交','家庭','睡眠','身体','环境'];
const INTENSITY=['很轻','有一点','中等','挺强','很强烈'];
const CARE_NAME={breath:'方块呼吸',meditate:'正念片刻',music:'无词和声',rain:'雨声',scan:'身体扫描',stretch:'拉伸',walk:'散步'};
const CARE_CAT={breath:'呼吸',meditate:'呼吸',music:'聆听',rain:'聆听',scan:'身体',stretch:'身体',walk:'身体'};
const WK=['周日','周一','周二','周三','周四','周五','周六'];
const isNeg=e=>EMO[e.emotion]&&EMO[e.emotion].v<0;

function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(str){let h=2166136261;str=String(str);for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0;}
function sod(ts){const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime();}
function addDays(ts,n){const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime();}
function partOfDay(h){return h<12?'早上':h<18?'下午':'晚上';}
function modeOf(arr){const c={};let best=null;arr.forEach(x=>{c[x]=(c[x]||0)+1;if(best===null||c[x]>c[best])best=x;});return best;}
const fmt1=n=>(Math.round(n*10)/10).toFixed(1);
const pct=x=>Math.round(x*100)+'%';

/* ---------- 演示数据：14 天，刻意设计的四个规律 ----------
   1. 求职是最常见的触发因素
   2. 睡眠 < 6h 的日子，焦虑明显更多
   3. 周日晚上偏烦躁
   4. 一次照料之后，下一次难受的强度更低 */
const NOTES={
  '焦虑':['面试结果还没出来','简历投了二十份，回复只有两个','明天要群面，一直在想会被问什么','睡不着，脑子里全是 offer','笔试做砸了一道题，反复想'],
  '烦躁':['室友打游戏到很晚','三个 deadline 挤在同一天','地铁太挤了','消息一直在响'],
  '低落':['又收到一封感谢信','一个人吃晚饭','看到同学都签了','什么都不想做'],
  '疲惫':['连着两天熬夜改简历','实习加上课，好累','开了一下午的会'],
  '委屈':['组会上被当众否定','明明不是我的错','被 HR 放了鸽子'],
  '迷茫':['不知道该考研还是工作','投了好多方向，越投越不确定','不知道自己想要什么'],
  '平静':['和朋友散了很久的步','下午阳光很好','把房间收拾干净了'],
  '开心':['收到了一面的邀请','妈妈打来电话','吃到了想吃的面']
};
const SUNDAY_NOTES=['周日晚上，一想到明天就烦','周末又这样过去了','明天又要开始投简历'];

function genMock(now){
  const R=rng(20261021);
  const pick=a=>a[Math.floor(R()*a.length)];
  const wpick=o=>{let t=0;for(const k in o)t+=o[k];let r=R()*t;for(const k in o){r-=o[k];if(r<=0)return k;}return Object.keys(o)[0];};
  const sleeps=[7.2,5.1,6.8,5.5,7.6,4.9,7.0,6.5,5.3,7.4,5.8,6.9,5.2,7.1];
  const weathers=['晴','多云','阴','小雨','晴','多云'];
  const prefer={'焦虑':['breath','scan','music'],'烦躁':['walk','breath','rain'],'低落':['walk','music','rain'],'疲惫':['music','stretch','rain'],'委屈':['music','breath','walk'],'迷茫':['walk','meditate','breath']};
  const entries=[],sessions=[];let lastNeg=null;const today=sod(now);
  for(let i=14;i>=1;i--){
    const day=addDays(today,-i),dow=new Date(day).getDay(),sleep=sleeps[14-i],weather=pick(weathers);
    const slots=[8.6,12.4,16.2,20.6].filter(()=>R()<.55);
    if(!slots.length)slots.push(pick([12.4,20.6]));
    if(dow===0){if(!slots.includes(20.6))slots.push(20.6);slots.push(22.1);}
    slots.sort((a,b)=>a-b);
    slots.forEach(slot=>{
      const hr=slot+(R()-.5)*1.2,ts=day+Math.round(hr*60)*60000,evening=hr>=18;
      let emotion,intensity,triggers=[],sundayEve=false;
      if(dow===0&&evening){emotion='烦躁';intensity=R()<.75?5:4;triggers=['求职',R()<.5?'家庭':'学业'];sundayEve=true;}
      else if(sleep<6&&R()<.7){emotion='焦虑';intensity=3+(R()<.4?1:0)+(sleep<5.2?1:0);if(R()<.8)triggers.push('求职');triggers.push('睡眠');}
      else{
        emotion=wpick(sleep<6?{'烦躁':1,'低落':1,'疲惫':1.4,'迷茫':.8,'平静':.6,'开心':.5}:{'焦虑':.75,'烦躁':.6,'低落':1,'疲惫':.9,'委屈':.7,'迷茫':.9,'平静':1.5,'开心':1.3});
        intensity=2+Math.floor(R()*3);
        if(EMO[emotion].v<0){
          if(R()<.5)triggers.push('求职');
          triggers.push(pick({'烦躁':['环境','社交','学业'],'低落':['社交','学业','家庭'],'疲惫':['工作','学业','身体'],'委屈':['社交','工作','家庭'],'迷茫':['学业','工作'],'焦虑':['学业','工作']}[emotion]));
          if(R()<.2)triggers.push(pick(['环境','身体']));
        }else triggers=[pick(['社交','家庭','身体','环境'])];
      }
      triggers=[...new Set(triggers)];
      const neg=EMO[emotion].v<0;
      if(neg&&!sundayEve&&lastNeg&&lastNeg.cared)intensity-=1+(R()<.4?1:0);
      intensity=Math.max(1,Math.min(5,intensity));
      const e={id:'m'+ts.toString(36),ts,emotion,intensity,triggers,note:'',mock:true,
        ctx:{sleep,steps:Math.round(hr*380*(sleep<6?.7:1)+R()*1500),hrv:Math.round(neg?30+R()*14-(emotion==='焦虑'?3:0):48+R()*14),noise:Math.round(38+R()*20+(emotion==='烦躁'?14:0)),weather},
        cared:false};
      if(R()<.62)e.note=sundayEve?pick(SUNDAY_NOTES):pick(NOTES[emotion]);
      if(neg){
        if(R()<(i>=3?.62:.12)){
          e.cared=true;e.careType=pick(prefer[emotion]);e.caredTs=ts+(15+Math.floor(R()*40))*60000;
          sessions.push({id:'s'+e.id,ts:e.caredTs,activity:e.careType,seconds:180,feedback:R()<.7?'better':'same',entryId:e.id});
        }
        lastNeg=e;
      }
      entries.push(e);
    });
  }
  return {entries,sessions};
}

/* ---------- 分析 ---------- */
function dailySeries(entries,days,now){
  const t0=sod(now||Date.now()),out=[];
  for(let i=days-1;i>=0;i--){
    const d0=addDays(t0,-i),d1=addDays(d0,1),rows=entries.filter(e=>e.ts>=d0&&e.ts<d1);
    out.push({d0,rows,v:rows.length?mean(rows.map(e=>EMO[e.emotion].v*e.intensity)):null});
  }
  return out;
}
function triggerStats(entries){
  const neg=entries.filter(isNeg);
  return TRIG.map((t,i)=>{const rows=neg.filter(e=>e.triggers.includes(t));return{t,i,n:rows.length,avg:mean(rows.map(e=>e.intensity))};}).filter(x=>x.n).sort((a,b)=>b.n-a.n||b.avg-a.avg);
}
function lowSleepAnxiety(entries){
  const anx=entries.filter(e=>e.emotion==='焦虑'&&e.ctx);
  return{n:anx.length,low:anx.filter(e=>e.ctx.sleep<6).length};
}
/* 照料效果：每条难受记录与它前一条（48 小时内）难受记录比较；前一条是否在此之前被照料过 */
function careEffect(entries,type){
  const s=entries.filter(isNeg).sort((a,b)=>a.ts-b.ts),after=[],before=[],drops=[];
  for(let i=1;i<s.length;i++){
    const p=s[i-1],e=s[i];if(e.ts-p.ts>48*3600e3)continue;
    const cared=p.cared&&p.caredTs&&p.caredTs<=e.ts;
    if(type){if(cared&&p.careType===type)drops.push(p.intensity-e.intensity);continue;}
    (cared?after:before).push(e.intensity);
  }
  return type?{n:drops.length,drop:mean(drops)}:{after,before};
}
function insights(entries,now){
  const since=addDays(sod(now||Date.now()),-30),recent=entries.filter(e=>e.ts>=since),out=[];
  if(recent.length<5)return out;
  // 1 睡眠 × 焦虑
  const low=recent.filter(e=>e.ctx&&e.ctx.sleep<6),ok=recent.filter(e=>e.ctx&&e.ctx.sleep>=6);
  if(low.length>=3&&ok.length>=3){
    const aL=low.filter(e=>e.emotion==='焦虑').length,aO=ok.filter(e=>e.emotion==='焦虑').length,pL=aL/low.length,pO=aO/ok.length;
    if(aL>=2&&pL>=pO*1.4)out.push({key:'sleep',eyebrow:'睡眠 × 焦虑',big:pct(pL),
      text:`睡不到 6 小时的那些记录里，${pct(pL)} 是焦虑；睡够的时候${aO?`只有 ${pct(pO)}`:'几乎没有出现'}。`,
      bars:[{label:'睡眠 < 6h',v:pL},{label:'睡眠 ≥ 6h',v:pO}],tip:'焦虑很可能不只是“想太多”，也是身体在提醒你缺觉。'});
  }
  // 2 一周里最沉的时段
  const B={};recent.forEach(e=>{const d=new Date(e.ts),k=d.getDay()+'|'+partOfDay(d.getHours());(B[k]=B[k]||[]).push(e);});
  let best=null;
  // 按 sum/(n+1) 排序：样本少的时段向 0 收缩，避免两三条记录就下结论
  for(const k in B){const es=B[k];if(es.length<2)continue;const v=es.map(e=>-EMO[e.emotion].v*e.intensity),h=mean(v),sc=v.reduce((x,y)=>x+y,0)/(v.length+1);if(!best||sc>best.sc)best={k,h,sc,es};}
  if(best&&best.h>=2.5){
    const [dw,pd]=best.k.split('|'),negs=best.es.filter(isNeg);
    out.push({key:'time',eyebrow:'一周里最沉的时段',big:WK[+dw]+pd,
      text:`${best.es.length} 次记录，平均强度 ${fmt1(mean(negs.map(e=>e.intensity)))}，多半是${modeOf(negs.map(e=>e.emotion))}。`,tip:`可以提前给${WK[+dw]}${pd}留一个缓冲：一件小事，或一次散步。`});
  }
  // 3 照料之后
  const ce=careEffect(recent);
  if(ce.after.length>=3&&ce.before.length>=3){
    const d=mean(ce.before)-mean(ce.after);
    if(d>=.3)out.push({key:'care',eyebrow:'照料之后',big:'−'+fmt1(d),
      text:`照料过一颗种子后，下一次难受的平均强度是 ${fmt1(mean(ce.after))}；没有照料时是 ${fmt1(mean(ce.before))}。`,
      bars:[{label:'照料后',v:mean(ce.after)/5},{label:'未照料',v:mean(ce.before)/5}],tip:'几分钟的照料，会留在下一次里。'});
  }
  // 补位：最常见触发
  if(out.length<3){
    const ts=triggerStats(recent),negN=recent.filter(isNeg).length;
    if(ts[0]&&negN)out.push({key:'trigger',eyebrow:'最常出现的触发',big:ts[0].t,text:`${negN} 颗种子里有 ${ts[0].n} 颗和「${ts[0].t}」有关，平均强度 ${fmt1(ts[0].avg)}。`,tip:'它在土层里埋得最多。'});
  }
  return out.slice(0,3);
}

/* ---------- 照料推荐：情绪 + 触发 + 上下文，每条附可解释的理由 ---------- */
function recommend(entry,entries){
  const ctx=entry.ctx||{},em=entry.emotion,trig=entry.triggers||[];
  const base={'焦虑':{b:3,l:1.5,a:1},'烦躁':{a:3,b:2,l:1},'低落':{a:2.5,l:2,b:1},'疲惫':{l:3,a:2,b:1},'委屈':{l:2.5,b:2,a:1},'迷茫':{a:2.5,b:1.5,l:1.5}}[em]||{b:2,l:1.5,a:1.5};
  const actId=ctx.sleep<6?'scan':(em==='疲惫'||trig.includes('身体'))?'stretch':'walk';
  const lisId=(em==='低落'||ctx.weather==='小雨')?'rain':'music';
  const o={
    b:{id:'breath',cat:'呼吸',s:base.b+(entry.intensity>=4?.5:0),r:[[1,'方块呼吸能让心跳慢下来。']],minutes:entry.intensity>=4?3:1},
    l:{id:lisId,cat:'聆听',s:base.l,r:[[1,'什么都不用做，听一会儿就好。']],minutes:3},
    a:{id:actId,cat:'身体',s:base.a,r:[[1,{walk:'换个环境，让身体带着情绪走一走。',stretch:'把积在肩颈的紧绷松开一点。',scan:'从头到脚，感受一遍身体。'}[actId]]],minutes:{walk:10,stretch:5,scan:5}[actId]}
  };
  if(ctx.sleep<6){o.a.s+=1.5;o.a.r.push([4,`昨晚只睡了 ${ctx.sleep} 小时，比起跑动，先让身体慢下来。`]);}
  if(em==='焦虑'){
    const ls=lowSleepAnxiety(entries.filter(e=>e.id!==entry.id));
    if(ls.low>=2){const line=ls.low===ls.n?`你最近 ${ls.n} 次焦虑都和睡眠不足同时出现。`:`你最近 ${ls.n} 次焦虑里，有 ${ls.low} 次出现在睡不到 6 小时之后。`;(ctx.sleep<6?o.a:o.b).r.push([5,line]);}
  }
  if(ctx.noise>=65){o.l.s+=3;o.l.r.push([4,`周围有 ${ctx.noise} dB 的噪音，柔和的声音能帮你隔开一点。`]);}
  if(ctx.hrv&&ctx.hrv<40){o.b.s+=1.5;o.b.r.push([3,`HRV 只有 ${ctx.hrv} ms，慢一点的呼吸能帮身体降一档。`]);}
  if(actId==='walk'&&ctx.steps<3000){o.a.s+=1.5;o.a.r.push([3,`今天才走了 ${ctx.steps.toLocaleString()} 步，出去走走刚好。`]);}
  const study=trig.find(t=>['求职','学业','工作'].includes(t));
  if(study){o.b.s+=1;o.b.r.push([2,`和「${study}」有关的紧绷，适合先把呼吸放慢。`]);}
  Object.values(o).forEach(x=>{const ef=careEffect(entries,x.id);if(ef.n>=2&&ef.drop>.4){x.s+=1.5;x.r.push([4.5,`上 ${ef.n} 次${CARE_NAME[x.id]}之后，你下一次难受的强度平均低了 ${fmt1(ef.drop)}。`]);}});
  return Object.values(o).map(x=>({id:x.id,cat:x.cat,score:x.s,minutes:x.minutes,reason:x.r.sort((a,b)=>b[0]-a[0])[0][1]})).sort((a,b)=>b.score-a.score);
}

/* ---------- 土壤的回应：短、不评判 ---------- */
const REPLY={
  '焦虑':['收到了。它先在土里待一会儿。','担心，是因为在意。土壤替你接住了。','不用现在就想明白，先放在这里。'],
  '烦躁':['这份烦，土壤收下了。','烦的时候，土也会松一松。','不必立刻平静下来。'],
  '低落':['沉一点也没关系，土很厚。','它在这里，你可以慢慢来。','今天辛苦了。'],
  '疲惫':['累了就先停一停。','种子也需要休息的时间。','收好了，你可以歇一下。'],
  '委屈':['这份委屈是真的，土壤记得。','难受是正常的，先替你收着。','不必解释，土壤都懂。'],
  '迷茫':['看不清路的时候，先看清脚下。','不知道也没关系。','它会在土里慢慢找方向。'],
  '平静':['这份平静，种在了阳光下。','好好记住此刻的样子。','真好，花园亮了一点。'],
  '开心':['真好，替你种成了一朵花。','这一点开心，也值得被留下。','花园因为你多了一种颜色。']
};
const BLOOM=['它开花了。','照料过的地方，会长出花来。','谢谢你，照顾了这颗种子。'];
function soilReply(emotion,seed){const p=REPLY[emotion]||REPLY['平静'];return p[(seed>>>0)%p.length];}

root.HH={EMO,NEG,POS,EMOTIONS,TRIG,INTENSITY,CARE_NAME,CARE_CAT,WK,BLOOM,isNeg,rng,hash,mean,sod,addDays,fmt1,genMock,dailySeries,triggerStats,insights,recommend,careEffect,soilReply};
})(typeof window!=='undefined'?window:globalThis);
