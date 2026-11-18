// Pixel icons everywhere: any close button showing a plain ✕ / × / ✖ gets the pixel X,
// and any 🔥 in the page text becomes the pixel flame. Watches the page, so text added later is covered too.
// Copied text (share messages, clipboard) is not touched: only what is shown on screen.
(()=>{
const X='<svg class="pxi-x" viewBox="0 0 9 8" width="18" height="16" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M0 0h1v1H0zM0 7h1v1H0zM1 0h1v1H1zM1 1h1v1H1zM1 6h1v1H1zM1 7h1v1H1zM2 1h1v1H2zM2 2h1v1H2zM2 5h1v1H2zM2 6h1v1H2zM3 2h1v1H3zM3 3h1v1H3zM3 4h1v1H3zM3 5h1v1H3zM4 3h1v1H4zM4 4h1v1H4zM5 2h1v1H5zM5 3h1v1H5zM5 4h1v1H5zM5 5h1v1H5zM6 1h1v1H6zM6 2h1v1H6zM6 5h1v1H6zM6 6h1v1H6zM7 0h1v1H7zM7 1h1v1H7zM7 6h1v1H7zM7 7h1v1H7zM8 0h1v1H8zM8 7h1v1H8z"/></svg>';
// base styles first in <head>, so a page's own rules (sizes, colours) still win
const css=`.pxi-x{display:inline-block;width:.9em;height:.8em;min-width:12px;min-height:11px;vertical-align:-.05em}
.pixel-flame{position:relative;display:inline-block;width:14px;height:18px;flex:0 0 14px;vertical-align:-3px;margin-right:4px;background:#ff5a2e;clip-path:polygon(45% 0,64% 0,64% 18%,82% 18%,82% 36%,100% 36%,100% 82%,82% 82%,82% 100%,18% 100%,18% 82%,0 82%,0 45%,18% 45%,18% 27%,36% 27%,36% 9%,45% 9%);filter:drop-shadow(1px 1px 0 #000)}
.pixel-flame:after{content:'';position:absolute;left:4px;bottom:2px;width:6px;height:8px;background:#ffd84d;clip-path:polygon(34% 0,67% 0,67% 25%,100% 25%,100% 100%,0 100%,0 50%,34% 50%)}`;
const st=document.createElement('style');st.id='pxi-base';st.textContent=css;(document.head||document.documentElement).prepend(st);
const CLOSE=/^[✕×✖]$/,LEAD=/^[✕×✖]\s+/,SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','TITLE','OPTION','SELECT','NOSCRIPT','CANVAS','SVG']);
function closeBtn(el){const t=el.textContent.trim();if(!t||el.querySelector('svg,img'))return;
 if(CLOSE.test(t)){el.innerHTML=X;if(!el.getAttribute('aria-label'))el.setAttribute('aria-label','Close')}
 else if(LEAD.test(t)&&el.children.length===0){const rest=t.replace(LEAD,'');el.innerHTML=X+' ';el.append(rest)}}
function flames(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.includes('🔥')&&!(n.parentNode&&SKIP.has(n.parentNode.nodeName.toUpperCase()))?1:2});
 const hits=[];while(w.nextNode())hits.push(w.currentNode);
 for(const n of hits){const parts=n.nodeValue.split('🔥'),f=document.createDocumentFragment();
  parts.forEach((p,i)=>{if(i){const s=document.createElement('i');s.className='pixel-flame px-inline';s.setAttribute('aria-hidden','true');f.append(s)}if(p)f.append(p.replace(/^️/,''))});n.replaceWith(f)}}
function scan(root){if(!root||root.nodeType!==1)return;
 root.querySelectorAll('button,[role=button],a,.close,[class*="-x"],[class*="close"]').forEach(closeBtn);
 if(root.matches?.('button,[role=button],a'))closeBtn(root);flames(root)}
let q=new Set(),raf=0;const flush=()=>{raf=0;const r=[...q];q.clear();obs.disconnect();try{r.forEach(scan)}finally{obs.observe(document.body,{childList:true,subtree:true,characterData:true})}};
const obs=new MutationObserver(ms=>{for(const m of ms){const t=m.type==='characterData'?m.target.parentElement:m.target;if(t)q.add(t)}if(!raf)raf=requestAnimationFrame(flush)});
const start=()=>{scan(document.body);obs.observe(document.body,{childList:true,subtree:true,characterData:true})};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
