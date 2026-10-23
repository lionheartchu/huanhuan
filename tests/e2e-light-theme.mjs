/* Light-only regression: run against the local server with playwright-core + system Chrome. */
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,colorScheme:'dark',reducedMotion:'reduce'}),page=await context.newPage();
  await page.clock.setFixedTime(new Date('2026-10-23T18:00:00Z'));
  await page.goto('http://127.0.0.1:8765/');
  // No theme preference schema exists in this checkout. These synthetic legacy
  // keys verify that persisted dark strings stay inert and are not deleted.
  await page.evaluate(()=>{localStorage.setItem('theme','dark');localStorage.setItem('shengxi-theme','dark');localStorage.setItem('unrelated-setting','keep-me');});
  const saved=await page.evaluate(()=>({...localStorage}));
  for(const route of ['now','reflect','care']){
   await page.goto('http://127.0.0.1:8765/#'+route);await page.reload();await page.waitForTimeout(900);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light only');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor),'rgb(247, 243, 238)');
   const darkPreference=await page.screenshot();
   await page.emulateMedia({colorScheme:'light'});await page.waitForTimeout(400);
   assert.ok(darkPreference.equals(await page.screenshot()),`${route}: preference switch must not change any pixels`);
   await page.emulateMedia({colorScheme:'dark'});await page.waitForTimeout(400);
   assert.ok(darkPreference.equals(await page.screenshot()),`${route}: switching back must preserve light pixels`);
   console.log(`PASS ${viewport.width}px ${route}: dark startup and live OS preference changes stay light (pixel-identical)`);
  }
  await page.locator('[data-action="settings"]').click();
  assert.doesNotMatch(await page.locator('#modal').innerText(),/dark mode|深色模式|暗色模式/i);
  assert.deepEqual(await page.evaluate(()=>({...localStorage})),saved);
  console.log(`PASS ${viewport.width}px settings have no dark control; all storage unchanged`);
  await context.close();
 }
}finally{await browser.close();}
