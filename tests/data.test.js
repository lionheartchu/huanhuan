'use strict';
/* 生息 · 数据层语义测试（只用 Node 内置模块）：node --test tests/ */
const test=require('node:test'),assert=require('node:assert');
require('../data.js');const HH=globalThis.HH;

test('空白记录：情绪、强度都是未知，不补默认值',()=>{
  const e=HH.blankEntry({kind:'text',text:'今天有点累'});
  assert.strictEqual(e.emotion,null);assert.strictEqual(e.intensity,null);assert.deepStrictEqual(e.triggers,[]);assert.strictEqual(e.ctx,null);
});
test('无言记录不推断情绪',()=>{const e=HH.blankEntry({kind:'wordless',durationSec:8});assert.strictEqual(e.emotion,null);assert.strictEqual(e.kind,'wordless');});
test('示例数据全部标记 demo，情境数据标为 simulated',()=>{
  const d=HH.genDemo(Date.now());assert.ok(d.entries.length>20);
  assert.ok(d.entries.every(e=>e.demo===true&&(!e.ctx||e.ctx.source==='simulated')));assert.ok(d.sessions.every(s=>s.demo===true));
});
test('练习反馈：better/same/worse 与 skip、未回答分开统计',()=>{
  const s=[{activity:'breath',feedback:'better'},{activity:'breath',feedback:'worse'},{activity:'breath',feedback:'skip'},{activity:'breath',feedback:null}];
  assert.deepStrictEqual(HH.feedbackStats(s),{n:4,nFb:2,better:1,same:0,worse:1,skip:1,none:1});
});
test('记录少于 5 条时不给观察',()=>{
  const es=[1,2,3,4].map(i=>HH.blankEntry({id:'x'+i,kind:'text',text:'a',emotion:'焦虑',triggers:['求职']}));
  assert.deepStrictEqual(HH.insights(es,[]),[]);
});
test('个人观察写明不说明因果；示例的模拟睡眠观察带 simulated 标记',()=>{
  const d=HH.genDemo(Date.now());const f=HH.insights(d.entries,d.sessions,{demo:true});
  assert.ok(f.length>0);assert.ok(f.every(x=>x.caveat==='示例数据'||x.simulated));
  const sleep=f.find(x=>x.key==='sleep');if(sleep)assert.strictEqual(sleep.simulated,true);
});
test('情绪统计：未命名单独计数，强度只算真的选过的',()=>{
  const es=[HH.blankEntry({id:'a',emotion:'焦虑',intensity:4}),HH.blankEntry({id:'b',emotion:'焦虑'}),HH.blankEntry({id:'c'})];
  const st=HH.emotionStats(es);assert.strictEqual(st.unnamed,1);assert.strictEqual(st.rows[0].n,2);assert.strictEqual(st.rows[0].nI,1);assert.strictEqual(st.rows[0].avg,4);
});
test('旧 v2 数据迁移：mock 不进入个人数据，ctx 标为模拟，默认强度 3 不参与统计',()=>{
  const old={entries:[{id:'m',mock:true,emotion:'焦虑'},{id:'p',emotion:'焦虑',intensity:3,note:'原话',ctx:{sleep:5}}],sessions:[{id:'s1',entryId:'m'},{id:'s2',entryId:'p',feedback:'skip'}]};
  const {personal,report}=HH.migrateV2(old);
  assert.strictEqual(personal.entries.length,1);assert.strictEqual(personal.entries[0].text,'原话');
  assert.strictEqual(personal.entries[0].ctx.source,'simulated');assert.strictEqual(HH.hasIntensity(personal.entries[0]),false);
  assert.strictEqual(report.demoSessionsDropped,1);assert.strictEqual(personal.sessions[0].feedback,'skip');
});
test('文字不做情绪解读；只有安全提示会给出求助入口',()=>{
  assert.strictEqual(HH.textReply('今天好累').line,'');assert.strictEqual(HH.textReply('随便写点').line,'');
  assert.strictEqual(HH.textReply('好累，有时候不想活了').flag,'help');
});
test('推荐只用自报情绪与同一练习的反馈',()=>{
  const r=HH.recommend('焦虑',[]);assert.deepStrictEqual(r.map(x=>x.id),['breath','scan','music']);assert.ok(r[0].reason.includes('焦虑'));
});
