'use strict';
/* 缓缓 · 生成式环境音（Web Audio）。只在用户点击后启动，不加载任何音频文件。
   同一时间只有一个声音来源（owner）：全局环境音 'space'，或某个练习。
   setTexture() 让连续的动作轻微改变已有音景的亮度与层次，不触发新音符，也不提高总音量。 */
(function(root){
const PRESETS={
  space:{chords:[[48,55,59,62],[45,52,57,60],[41,48,53,57],[43,50,55,59]],cutoff:900,wave:'sine',pad:.026,noise:{type:'bandpass',f:480,q:.6,g:.03,lfo:.05},shimmer:true},
  music:{chords:[[48,55,59,62,64],[45,52,55,59,64],[41,48,52,57,60],[43,50,55,57,62]],cutoff:1200,wave:'triangle',pad:.032,noise:{type:'bandpass',f:520,q:.7,g:.05,lfo:.07}},
  rain:{chords:[[38,45,50,53,57],[36,43,48,52,55],[34,41,46,50,53],[33,40,45,48,52]],cutoff:760,wave:'sine',pad:.03,noise:{type:'highpass',f:1300,q:.5,g:.075,lfo:.05}}
};
const CHORD=9;
let ac=null,master=null,bus=null,nf=null,shimmer=null,live=[],timer=null,idx=0,P=null,vol=.5,owner=null;
const listeners=new Set();
const emit=()=>listeners.forEach(fn=>{try{fn({playing:!!ac&&ac.state==='running',owner});}catch(e){}});
const mtof=m=>440*Math.pow(2,(m-69)/12);

function impulse(sec){
  const len=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}
  return b;
}
function noiseBuffer(rain){
  const len=ac.sampleRate*3,b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.04*w)/1.04;d[i]=rain?w*.5:last*3.2;}
  return b;
}
function lfo(freq,depth,target){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;g.gain.value=depth;o.connect(g);g.connect(target);o.start();live.push(o);}
function chord(t){
  const notes=P.chords[idx++%P.chords.length];
  notes.forEach((m,k)=>[-6,6].forEach(det=>{
    const o=ac.createOscillator(),g=ac.createGain(),peak=P.pad/(1+k*.18);
    o.type=P.wave;o.frequency.value=mtof(m);o.detune.value=det+(Math.random()*4-2);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+3.5);
    g.gain.setValueAtTime(peak,t+CHORD-1);g.gain.linearRampToValueAtTime(0,t+CHORD+3.5);
    let out=g;
    if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=(k/(notes.length-1)-.5)*.7;g.connect(p);out=p;}
    o.connect(g);out.connect(bus);o.start(t);o.stop(t+CHORD+4);
  }));
  if(shimmer){ // 高一个八度的长音，音量由 setTexture 控制
    const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=mtof(notes[1]+12);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+3);g.gain.setValueAtTime(1,t+CHORD-1);g.gain.linearRampToValueAtTime(0,t+CHORD+3);
    o.connect(g);g.connect(shimmer);o.start(t);o.stop(t+CHORD+3.5);
  }
}
function loop(){if(!ac)return;chord(ac.currentTime+.05);timer=setTimeout(loop,CHORD*1000);}

/* 返回 Promise：resolve 表示真的在播放；reject 表示浏览器拒绝或不支持（调用方降级为无声）。 */
function play(preset,opts={}){
  stop(true);
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return Promise.reject(new Error('unsupported'));
  try{
    P=PRESETS[preset]||PRESETS.music;idx=0;owner=opts.owner||preset;
    if(typeof opts.volume==='number')vol=opts.volume;
    ac=new AC();
    const context=ac;context.onstatechange=()=>{if(ac===context)emit();};
    master=ac.createGain();master.gain.value=0;master.connect(ac.destination);
    master.gain.setValueAtTime(0,ac.currentTime);master.gain.linearRampToValueAtTime(vol,ac.currentTime+(opts.fadeIn||2.5));
    const comp=ac.createDynamicsCompressor();comp.connect(master);
    const rev=ac.createConvolver();rev.buffer=impulse(3.6);
    const wet=ac.createGain();wet.gain.value=.6;rev.connect(wet);wet.connect(comp);
    const dry=ac.createGain();dry.gain.value=.55;dry.connect(comp);
    bus=ac.createBiquadFilter();bus.type='lowpass';bus.frequency.value=P.cutoff;bus.Q.value=.4;bus.connect(dry);bus.connect(rev);
    lfo(.04,P.cutoff*.3,bus.frequency);
    const ns=ac.createBufferSource();ns.buffer=noiseBuffer(P===PRESETS.rain);ns.loop=true;
    nf=ac.createBiquadFilter();nf.type=P.noise.type;nf.frequency.value=P.noise.f;nf.Q.value=P.noise.q;
    const ng=ac.createGain();ng.gain.value=P.noise.g;
    lfo(P.noise.lfo,P.noise.f*.4,nf.frequency);lfo(.11,P.noise.g*.5,ng.gain);
    ns.connect(nf);nf.connect(ng);ng.connect(dry);ng.connect(rev);ns.start();live.push(ns);
    if(P.shimmer){shimmer=ac.createGain();shimmer.gain.value=0;const sg=ac.createGain();sg.gain.value=.014;shimmer.connect(sg);sg.connect(rev);sg.connect(dry);}
    loop();emit();
    const a=ac;
    // resume() 在某些环境里可能一直不返回：最多等 1.5 秒，否则当作被拒绝，降级为无声
    return new Promise((res,rej)=>{
      let done=false;const fin=okay=>{if(done)return;done=true;if(ac!==a)return rej(new Error('stopped'));if(okay&&a.state==='running')res();else{stop(true);rej(new Error('blocked'));}};
      a.resume().then(()=>setTimeout(()=>fin(true),200),()=>fin(false));setTimeout(()=>fin(a.state==='running'),1500);
    });
  }catch(e){stop(true);return Promise.reject(e);}
}
/* hold、motion ∈ [0,1]，都经过平滑；只改滤波和一层很轻的高音，不动总音量。 */
function setTexture(hold,motion){
  if(!ac||!bus)return;const t=ac.currentTime;
  hold=Math.max(0,Math.min(1,hold||0));motion=Math.max(0,Math.min(1,motion||0));
  bus.frequency.setTargetAtTime(P.cutoff*(1+.55*hold)+motion*260,t,.45);
  if(nf)nf.frequency.setTargetAtTime(P.noise.f*(1+.5*motion),t,.6);
  if(shimmer)shimmer.gain.setTargetAtTime(hold*.9,t,.7);
}
function stop(now){
  clearTimeout(timer);timer=null;
  if(!ac){owner=null;return;}
  const a=ac,m=master;ac=null;master=null;bus=null;nf=null;shimmer=null;live=[];owner=null;
  try{
    if(now){m.gain.cancelScheduledValues(a.currentTime);m.gain.setValueAtTime(0,a.currentTime);m.disconnect();a.close().catch(()=>{});}
    else{m.gain.cancelScheduledValues(a.currentTime);m.gain.setValueAtTime(m.gain.value,a.currentTime);m.gain.linearRampToValueAtTime(0,a.currentTime+.8);setTimeout(()=>a.close().catch(()=>{}),900);}
  }catch(e){}
  emit();
}
function stopIf(who,now=false){if(owner===who)stop(now);}
function setVolume(v){vol=v;if(ac&&master)master.gain.setTargetAtTime(v,ac.currentTime,.15);}
root.Ambient={play,stop,stopIf,setVolume,setTexture,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},get playing(){return !!ac&&ac.state==='running';},get owner(){return owner;},get volume(){return vol;},get state(){return ac?ac.state:'closed';}};
})(window);
