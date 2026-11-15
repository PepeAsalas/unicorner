// Typing on a phone: when the keyboard opens, iPhones cover the page instead of shrinking it, and Safari scrolls
// so the answer box sits on the keyboard with the question pushed off the top. This keeps the question at the top of
// what's visible with the answer box under it, and (if the clock would be hidden) shows a small copy of the clock.
// Use: <script src="/kb.js" data-input="#in" data-top=".host" data-clock="#clock" defer></script>
(()=>{
const me=document.currentScript,cfg={input:me?.dataset.input,top:me?.dataset.top,clock:me?.dataset.clock};
if(!cfg.input||!window.visualViewport)return;
const vv=window.visualViewport,phone=()=>matchMedia('(max-width:760px) and (pointer:coarse)').matches;
let pill=null,tick=0,raf=0;
const input=()=>document.querySelector(cfg.input),focused=()=>{const i=input();return i&&document.activeElement===i};
const kbUp=()=>vv.height<window.innerHeight*.85;

// temporary room under the page, so a question near the bottom can still be scrolled up to the top
let pad=null;function room(px){if(!pad){pad=document.createElement('div');pad.setAttribute('aria-hidden','true');pad.style.cssText='height:0;pointer-events:none'}if(!pad.isConnected)document.body.appendChild(pad);pad.style.height=Math.max(0,px)+'px'}
function place(){if(!phone()||!focused()||!kbUp()){showPill(false);room(0);return}
 room(window.innerHeight-vv.height);
 const i=input(),top=(cfg.top&&document.querySelector(cfg.top))||i,vTop=vv.offsetTop,vBot=vTop+vv.height;
 const tr=top.getBoundingClientRect(),ir=i.getBoundingClientRect();
 // question at the top of the visible area; if question + box don't both fit, keep the box just above the keyboard
 let d=tr.top-(vTop+8);
 if(ir.bottom-d>vBot-8)d=ir.bottom-(vBot-8);
 if(Math.abs(d)>4)window.scrollBy(0,d);
 showPill(true)}
function showPill(on){if(!cfg.clock)return;const c=document.querySelector(cfg.clock);
 if(on&&c){const r=c.getBoundingClientRect(),hidden=r.bottom<vv.offsetTop+4||r.top>vv.offsetTop+vv.height-4;on=hidden}
 if(!on){if(pill)pill.hidden=true;clearInterval(tick);tick=0;return}
 if(!pill){pill=document.createElement('div');pill.setAttribute('aria-hidden','true');
  pill.style.cssText='position:fixed;z-index:7000;right:10px;padding:6px 10px 4px;background:#1d1a2b;color:#f2c230;border:3px solid #f2c230;font:400 22px/1 "Jersey 10",Impact,sans-serif;letter-spacing:.04em;box-shadow:3px 3px 0 rgba(0,0,0,.4);pointer-events:none';
  document.body.appendChild(pill)}
 const upd=()=>{const cc=document.querySelector(cfg.clock);if(!cc||!focused()){pill.hidden=true;return}pill.textContent='⏱ '+cc.textContent.trim();pill.style.top=(vv.offsetTop+8)+'px';pill.hidden=false};
 upd();if(!tick)tick=setInterval(upd,250)}
const later=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>setTimeout(place,60))};
vv.addEventListener('resize',later);vv.addEventListener('scroll',()=>{if(pill&&!pill.hidden)pill.style.top=(vv.offsetTop+8)+'px'});
document.addEventListener('focusin',e=>{if(e.target.matches?.(cfg.input)){setTimeout(place,350);setTimeout(place,700)}});
document.addEventListener('focusout',e=>{if(e.target.matches?.(cfg.input))setTimeout(()=>{if(!focused()){showPill(false);room(0)}},100)});
})();
