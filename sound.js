'use strict';
/* 缓缓 · 生成式环境音（Web Audio）。只在用户点击后启动，不加载任何音频文件。
   music：缓慢的和弦铺底 + 滤波噪声做的风声；rain：低沉和弦 + 更密的雨声。 */
(function(root){
const PRESETS={
  music:{chords:[[48,55,59,62,64],[45,52,55,59,64],[41,48,52,57,60],[43,50,55,57,62]],cutoff:1200,wave:'triangle',pad:.032,noise:{type:'bandpass',f:520,q:.7,g:.05,lfo:.07}},
  rain:{chords:[[38,45,50,53,57],[36,43,48,52,55],[34,41,46,50,53],[33,40,45,48,52]],cutoff:760,wave:'sine',pad:.03,noise:{type:'highpass',f:1300,q:.5,g:.075,lfo:.05}}
};
const CHORD=9; // 每个和弦持续秒数
let ac=null,master=null,bus=null,live=[],timer=null,idx=0,P=null,vol=.5;
const mtof=m=>440*Math.pow(2,(m-69)/12);

function impulse(sec){
  const len=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}
  return b;
}
function noiseBuffer(){
  const len=ac.sampleRate*3,b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.04*w)/1.04;d[i]=P===PRESETS.rain?w*.5:last*3.2;}
  return b;
}
function lfo(freq,depth,target){
  const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;g.gain.value=depth;o.connect(g);g.connect(target);o.start();live.push(o);
}
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
  // 偶尔一颗高音，像风铃
  if(Math.random()<.6){
    const o=ac.createOscillator(),g=ac.createGain(),tt=t+2+Math.random()*4;
    o.type='sine';o.frequency.value=mtof(notes[2+Math.floor(Math.random()*3)]+24);
    g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.012,tt+.05);g.gain.exponentialRampToValueAtTime(.0001,tt+4);
    o.connect(g);g.connect(bus);o.start(tt);o.stop(tt+4.2);
  }
}
function loop(){
  if(!ac)return;
  chord(ac.currentTime+.05);
  timer=setTimeout(loop,CHORD*1000);
}
function play(preset){
  stop(true);
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)throw new Error('unsupported');
  P=PRESETS[preset]||PRESETS.music;idx=0;
  ac=new AC();
  master=ac.createGain();master.gain.value=0;master.connect(ac.destination);
  master.gain.linearRampToValueAtTime(vol,ac.currentTime+2.5);
  const comp=ac.createDynamicsCompressor();comp.connect(master);
  const rev=ac.createConvolver();rev.buffer=impulse(3.6);
  const wet=ac.createGain();wet.gain.value=.6;rev.connect(wet);wet.connect(comp);
  const dry=ac.createGain();dry.gain.value=.55;dry.connect(comp);
  bus=ac.createBiquadFilter();bus.type='lowpass';bus.frequency.value=P.cutoff;bus.Q.value=.4;bus.connect(dry);bus.connect(rev);
  lfo(.04,P.cutoff*.35,bus.frequency);
  // 风 / 雨：循环噪声 → 滤波器，频率与音量都慢慢起伏
  const ns=ac.createBufferSource();ns.buffer=noiseBuffer();ns.loop=true;
  const nf=ac.createBiquadFilter();nf.type=P.noise.type;nf.frequency.value=P.noise.f;nf.Q.value=P.noise.q;
  const ng=ac.createGain();ng.gain.value=P.noise.g;
  lfo(P.noise.lfo,P.noise.f*.45,nf.frequency);lfo(.11,P.noise.g*.55,ng.gain);
  ns.connect(nf);nf.connect(ng);ng.connect(dry);ng.connect(rev);ns.start();live.push(ns);
  loop();
  return ac.resume();
}
function stop(now){
  clearTimeout(timer);timer=null;
  if(!ac)return;
  const a=ac,m=master;ac=null;master=null;bus=null;live=[];
  try{
    if(now){a.close();return;}
    m.gain.cancelScheduledValues(a.currentTime);m.gain.setValueAtTime(m.gain.value,a.currentTime);m.gain.linearRampToValueAtTime(0,a.currentTime+.8);
    setTimeout(()=>a.close().catch(()=>{}),900);
  }catch(e){}
}
function setVolume(v){vol=v;if(ac&&master)master.gain.setTargetAtTime(v,ac.currentTime,.15);}
root.Ambient={play,stop,setVolume,get playing(){return !!ac;}};
})(window);
