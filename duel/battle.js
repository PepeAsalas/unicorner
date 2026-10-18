// The duel battle replay (from the arena mock-up). startBattle(canvas, rounds, p1, p2, onEnd)

const W=540,H=780,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const K=id=>KITS.find(k=>k.id===id)||null;const IMG={};
const sp=(m,f,kit)=>{f=((f%2)+2)%2||0;const k=m+f+kit;if(!IMG[k]){const i=new Image();i.src=spriteDraw(m,f,false,K(kit)).slice(5,-2);IMG[k]=i}return IMG[k]};
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),seg=(t,a,b)=>cl((t-a)/(b-a)),eo=x=>1-Math.pow(1-x,3),eob=x=>{const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const rnd=s=>{let x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const TC={'TAP-IN':'#cfd8e6','HEADER':'#7fe0a8','VOLLEY':'#b48cff','BICYCLE KICK':'#ff7ac8','SCREAMER':'#ffd23f'};
const sq=(g,x,y,s,c)=>{g.fillStyle=c;g.fillRect(Math.round(x-s/2),Math.round(y-s/2),s,s)};
/* ── kit attacks: a = 0..1 progress, from attacker (sx,sy) to target (tx,ty), z = scale ── */
const ATK={
 classic:{name:'Rainbow Beam',d:'A wavy rainbow trail fires straight through.',f(g,a,sx,sy,tx,ty,z){const C=['#ff5a5a','#ff9a1f','#ffd23f','#39d353','#4fc3ff','#b48cff'],e=eo(cl(a/.5)),x1=sx+(tx-sx)*e,fade=1-seg(a,.7,1);g.globalAlpha=fade;
  for(let i=0;i<6;i++)for(let x=sx;x<x1;x+=6*z){g.fillStyle=C[i];g.fillRect(x,sy-15*z+i*5*z+Math.sin(x*.08+a*20)*3*z,6*z,5*z)}g.globalAlpha=1}},
 fire:{name:'Fireball',d:'A flaming ball arcs over and bursts into flames.',f(g,a,sx,sy,tx,ty,z){const k=cl(a/.55),x=sx+(tx-sx)*k,y=sy+(ty-sy)*k-Math.sin(k*Math.PI)*70*z;
  if(a<.55){for(let i=0;i<8;i++){const b=Math.max(0,k-i*.03);sq(g,sx+(tx-sx)*b,sy+(ty-sy)*b-Math.sin(b*Math.PI)*70*z,(14-i)*z,['#ffd23f','#ff9a1f','#ff5a1f','#d12a2a'][i%4])}}
  else{const b=seg(a,.55,1);for(let i=0;i<16;i++){const an=i/16*Math.PI*2,r=(10+b*60)*z;sq(g,tx+Math.cos(an)*r,ty+Math.sin(an)*r*.6-b*30*z,(10*(1-b)+2)*z,['#ffd23f','#ff9a1f','#d12a2a'][i%3])}}}},
 galaxy:{name:'Meteor Shower',d:'Stars rain down on the rival from deep space.',f(g,a,sx,sy,tx,ty,z){for(let i=0;i<9;i++){const b=cl((a-i*.05)/.45);if(b<=0||b>=1)continue;const x=tx-60*z+rnd(i)*120*z+(1-b)*60*z,y=ty-160*z+b*160*z;
  for(let j=0;j<5;j++)sq(g,x+j*6*z,y-j*8*z,(8-j)*z,j?'#9fd8ff':'#ffffff')}if(a>.5){const b=seg(a,.5,1);for(let i=0;i<10;i++){const an=i*.63;sq(g,tx+Math.cos(an)*b*50*z,ty+Math.sin(an)*b*30*z,6*z*(1-b)+2,'#b06bff')}}}},
 ice:{name:'Deep Freeze',d:'Ice shards fly in and freeze the rival solid.',f(g,a,sx,sy,tx,ty,z){for(let i=0;i<6;i++){const b=cl((a-i*.05)/.4);if(b<=0)continue;if(b<1){const x=sx+(tx-sx)*b,y=sy-30*z+i*12*z+(ty-sy)*b;g.fillStyle='#dff6ff';g.fillRect(x,y,18*z,4*z);g.fillStyle='#9fd8ff';g.fillRect(x+12*z,y-2*z,8*z,8*z)}}
  if(a>.45){const b=seg(a,.45,.65),fade=1-seg(a,.85,1);g.globalAlpha=.55*b*fade;g.fillStyle='#9fd8ff';g.fillRect(tx-60*z,ty-55*z,120*z,100*z);g.globalAlpha=b*fade;g.strokeStyle='#ffffff';g.lineWidth=3*z;g.strokeRect(tx-60*z,ty-55*z,120*z,100*z);g.globalAlpha=1}}},
 zebra:{name:'Stampede',d:'Black and white stripes charge across the pitch.',f(g,a,sx,sy,tx,ty,z){const e=cl(a/.6);for(let s=0;s<7;s++){const x=sx+(tx-sx+80*z)*e-s*22*z;if(x<sx-10)continue;g.fillStyle=s%2?'#111':'#fff';g.save();g.translate(x,sy);g.transform(1,0,-.4,1,0,0);g.fillRect(0,-40*z,14*z,80*z);g.restore()}
  if(a>.55){const b=seg(a,.55,1);for(let i=0;i<8;i++)sq(g,tx+(rnd(i)-.5)*90*z,ty+30*z-b*40*z*rnd(i+3),6*z*(1-b)+1,'#c8b89a')}}},
 gold:{name:'Coin Storm',d:'Gold coins pour out of the sky onto the rival.',f(g,a,sx,sy,tx,ty,z){for(let i=0;i<14;i++){const b=cl((a-rnd(i)*.4)/.45);if(b<=0)continue;const x=tx+(rnd(i+5)-.5)*110*z,y=ty-150*z+b*b*170*z,w=Math.abs(Math.cos(a*20+i))*10*z+2*z;
  g.fillStyle='#c08a10';g.fillRect(x-w/2-1,y-7*z,w+2,14*z);g.fillStyle='#ffd23f';g.fillRect(x-w/2,y-6*z,w,12*z)}}},
 matrix:{name:'Glitch',d:'Green code rains over the rival and glitches them out.',f(g,a,sx,sy,tx,ty,z){const k=seg(a,.2,.9);for(let c=0;c<12;c++){const x=tx-60*z+c*10*z,h=(rnd(c)*.5+.5)*k*130*z;for(let j=0;j<h;j+=8*z)sq(g,x,ty-70*z+j,5*z,j>h-9*z?'#d8ffe0':'#39ff6a')}
  if(a>.45&&Math.floor(a*30)%3===0){g.fillStyle='rgba(57,255,106,.35)';g.fillRect(tx-70*z,ty-20*z+rnd(Math.floor(a*30))*40*z,140*z,8*z)}}},
 lava:{name:'Eruption',d:'Lava bursts up from the ground under the rival.',f(g,a,sx,sy,tx,ty,z){const b=seg(a,.25,.7),fade=1-seg(a,.8,1);g.globalAlpha=fade;for(let c=0;c<9;c++){const x=tx-40*z+c*10*z,h=b*(60+rnd(c)*60)*z*Math.sin(b*Math.PI*.9+.2);g.fillStyle='#d12a2a';g.fillRect(x,ty+40*z-h,10*z,h);g.fillStyle='#ff9a1f';g.fillRect(x+2*z,ty+40*z-h*.7,6*z,h*.7)}
  for(let i=0;i<10;i++){const e=(a*1.5+rnd(i))%1;sq(g,tx+(rnd(i+2)-.5)*80*z,ty+40*z-e*140*z*b,5*z,e<.5?'#ffd23f':'#ff5a1f')}g.globalAlpha=1}},
 ref:{name:'Red Card',d:'The ref unicorn flashes a red card. Straight off.',f(g,a,sx,sy,tx,ty,z){const k=eo(cl(a/.45)),x=sx+(tx-sx)*k,y=sy-60*z+(ty-sy-10*z)*k,r=a<.45?a*30:0,s=1+.6*seg(a,.45,.6)-.3*seg(a,.6,.75);
  g.save();g.translate(x,y);g.rotate(r);g.scale(s,s);g.fillStyle='#06041a';g.fillRect(-16*z,-22*z,32*z,44*z);g.fillStyle='#e8263a';g.fillRect(-13*z,-19*z,26*z,38*z);g.restore()}},
 keeper:{name:'Glove Punch',d:'A giant goalkeeper glove punches the rival away.',f(g,a,sx,sy,tx,ty,z){const k=a<.45?eo(a/.45):1-.15*seg(a,.45,.6),x=sx+(tx-20*z-sx)*k,s=z*(1+.4*seg(a,.3,.45));
  g.save();g.translate(x,sy);g.scale(s,s);g.fillStyle='#06041a';g.fillRect(-24,-22,48,44);g.fillStyle='#7dff3b';g.fillRect(-20,-18,40,36);g.fillStyle='#ffffff';g.fillRect(-20,-18,12,36);g.fillStyle='#56cc22';g.fillRect(14,-18,6,36);g.restore();
  if(a>.43&&a<.7){const b=seg(a,.43,.7);for(let i=0;i<8;i++){const an=i/8*Math.PI*2;sq(g,tx-10*z+Math.cos(an)*b*40*z,sy+Math.sin(an)*b*40*z,5*z,'#ffffff')}}}},
};
const ORDER=['classic','fire','galaxy','ice','zebra','gold','matrix','lava','ref','keeper'];
/* ── the duel ── */
let cv,g;
let P1,P2,R,N,HP,TOTAL,onEnd=null,ended=false,O={};
const R_DEMO=[
 ['PLAYED FOR ENGLAND AT EURO 2024',['ANTHONY GORDON','SCREAMER',100],['HARRY KANE','TAP-IN',10]],
 ['PLAYED FOR ARGENTINA AT THE 2022 WORLD CUP',['RODRIGO DE PAUL','TAP-IN',10],['RODRIGO DE PAUL','TAP-IN',10]],
 ['SCORED FOR REAL MADRID IN THE CHAMPIONS LEAGUE, 2020-21 TO 2024-25',['LIONEL MESSI',null,0],['LUCAS VAZQUEZ','BICYCLE KICK',85]],
 ['A CLUB THAT PLAYED IN THE PREMIER LEAGUE, 2020-21 TO 2026-27',['SUNDERLAND','SCREAMER',100],['ARSENAL','TAP-IN',10]],
 ['PLAYED FOR INTER IN A TITLE SEASON, 2020-21 OR 2023-24',['TAJON BUCHANAN','SCREAMER',100],['LAUTARO MARTINEZ','TAP-IN',10]],
];
const RD=4.4,INTRO=1.6;
function setup(){N=R.length;HP=[(O.hp||[300,300]).slice()];for(let i=0;i<N;i++){const[a,b]=HP[i],[,y,o]=R[i];const blk=!!y[0]&&y[0]===o[0];HP.push([Math.max(0,a-(blk?0:o[2])),Math.max(0,b-(blk?0:y[2]))])}TOTAL=INTRO+RD*N+3}
function px(s,x,y,size,col,{align='center',out=true,font='disp'}={}){g.font=`${size}px ${font==='disp'?'"Jersey 10","Pixelify Sans"':'VT323'},monospace`;g.textAlign=align;g.textBaseline='alphabetic';
 if(out){g.fillStyle='#06041a';const o=Math.max(2,Math.round(size*.06));for(const[dx,dy]of[[-o,0],[o,0],[0,-o],[0,o],[o,o],[-o,o],[0,o*2],[o,o*2]])g.fillText(s,x+dx,y+dy)}g.fillStyle=col;g.fillText(s,x,y)}
function wrap(s,max,size){g.font=`${size}px "Jersey 10",monospace`;const w=s.split(' '),L=[];let l='';for(const x of w){const t=l?l+' '+x:x;if(g.measureText(t).width>max&&l){L.push(l);l=x}else l=t}L.push(l);return L}
/* night arena: a bowl of stands, floodlight towers, the big screen, a lit pitch */
function arena(t,label){g.fillStyle='#0b0a24';g.fillRect(0,0,W,H);for(let i=0;i<30;i++)sq(g,rnd(i)*W,rnd(i+7)*120,2,'rgba(255,255,255,.5)');
 // city skyline, windows flick on and off
 for(let i=0;i<14;i++){const w=30+rnd(i)*40,h=120+rnd(i+1)*180,x=i*40-10;g.fillStyle=i%2?'#1d1a3a':'#26224a';g.fillRect(x,330-h,w,h);
  for(let j=0;j<24;j++)if(rnd(i*30+j+Math.floor(t/3))>.55){g.fillStyle=rnd(j)>.5?'#ffd23f':'#4fd7ff';g.fillRect(x+4+(j%3)*10,338-h+Math.floor(j/3)*16,5,7)}}
 // radio mast with a blinking light
 g.fillStyle='#ff6fb5';g.fillRect(470,70,6,120);g.fillRect(462,62,22,8);if(Math.floor(t*2)%2){g.fillStyle='#ff3b30';g.fillRect(469,52,8,8)}
 // rooftop sign
 g.fillStyle='#06041a';g.fillRect(150,104,240,74);g.fillStyle='#120c38';g.fillRect(156,110,228,62);g.fillStyle='#2b2357';g.fillRect(190,178,8,60);g.fillRect(342,178,8,60);
 px(label,W/2,156,44,'#ffd23f',{out:false});
 // railing and the roof edge
 g.fillStyle='#9aa3b5';g.fillRect(0,326,W,10);for(let x=0;x<W;x+=30)g.fillRect(x,300,4,30);g.fillRect(0,300,W,4);
 // pitch in perspective: stripes get taller towards the camera
 const top=336,hw=W*1.05;let y=top;for(let i=0;i<18;i++){const h=8+i*5.2,t0=(y-top)/(H-top),t1=(y+h-top)/(H-top),w0=hw+(W*1.6-hw)*t0,w1=hw+(W*1.6-hw)*t1;
  g.fillStyle=i%2?'#2f8a8a':'#349595';g.beginPath();g.moveTo(W/2-w0/2,y);g.lineTo(W/2+w0/2,y);g.lineTo(W/2+w1/2,y+h);g.lineTo(W/2-w1/2,y+h);g.fill();y+=h}
 g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=3;g.beginPath();g.moveTo(0,top+2);g.lineTo(W,top+2);g.stroke();g.beginPath();g.moveTo(W/2,top);g.lineTo(W/2,H);g.stroke();g.beginPath();g.ellipse(W/2,top+150,150,48,0,0,Math.PI*2);g.stroke()}
function hpBar(x,y,w,hp,shown,name,right){g.fillStyle='#06041a';g.fillRect(x-4,y-4,w+8,72);g.fillStyle='#1a1240';g.fillRect(x,y,w,64);
 px(name,right?x+w-12:x+12,y+30,30,'#f3ead2',{align:right?'right':'left',out:false});px(Math.round(shown)+' HP',right?x+12:x+w-12,y+30,24,'#ffd23f',{align:right?'left':'right',out:false,font:'mono'});
 g.fillStyle='#06041a';g.fillRect(x+10,y+40,w-20,16);const f=hp/300,col=f>.5?'#39d353':f>.2?'#ffb000':'#ff4d4d';
 const bx=right?x+w-12:x+12,dir=right?-1:1;g.fillStyle='#ffffff';g.fillRect(right?bx-(w-24)*cl(shown/300):bx,y+42,(w-24)*cl(shown/300),12);g.fillStyle=col;g.fillRect(right?bx-(w-24)*cl(hp/300):bx,y+42,(w-24)*cl(hp/300),12)}
let t0=performance.now(),paused=false,pausedAt=0;
function frame(now){if(!cv.isConnected)return;let t=paused?pausedAt:(now-t0)/1000;if(RM)t=TOTAL-.1;if(t>=TOTAL-.05){t=TOTAL-.05;if(!ended){ended=true;onEnd&&onEnd()}}
 g.setTransform(1,0,0,1,0,0);const ri=Math.min(N,Math.floor(Math.max(0,t-INTRO)/RD)),lt=t-INTRO-ri*RD,inR=t>=INTRO&&ri<N;
 const [q,yo,op]=R[Math.min(ri,N-1)],blk=inR&&!!yo[0]&&yo[0]===op[0];
 const HIT=2.3,hit=inR&&lt>HIT&&lt<HIT+.5;let shake=hit&&!blk?7*(1-(lt-HIT)/.5)*(yo[1]==='SCREAMER'||op[1]==='SCREAMER'?2:1):0;
 g.translate(shake?(rnd(t*91)-.5)*shake*2:0,shake?(rnd(t*37)-.5)*shake*2:0);
 arena(t,t<INTRO?(O.title||'DUEL'):ri<N?'Q'+((O.q0||0)+ri+1):(O.final?'FULL TIME':'HALF TIME'));
 const prev=HP[Math.min(ri,N)],next=HP[Math.min(ri+1,N)];let hp=prev,shown=prev;
 if(t<INTRO)hp=shown=HP[0];else if(ri>=N)hp=shown=HP[N];else if(lt>HIT){const k=eo(seg(lt,HIT,HIT+.4)),k2=eo(seg(lt,HIT+.5,HIT+1.2));hp=prev.map((v,i)=>v+(next[i]-v)*k);shown=prev.map((v,i)=>v+(next[i]-v)*k2)}
 hpBar(18,20,240,hp[0],shown[0],P1.name.toUpperCase().slice(0,12),false);hpBar(282,20,240,hp[1],shown[1],P2.name.toUpperCase().slice(0,12),true);
 if(t<INTRO){const T=O.title||'DUEL';px(T,W/2,300,(T.length>8?70:110)*eob(seg(t,.1,.5)),'#ffd23f')}
 const ko=[ri>=N&&HP[N][0]<=0,ri>=N&&HP[N][1]<=0],pos=[[150,420],[390,420]];
 // attacks fly between them
 if(inR&&lt>1.9&&lt<3.4&&!blk){for(const k of[0,1]){const mine=k?op:yo;if(!mine[1])continue;const P=k?P2:P1,[sx,sy]=pos[k],[tx,ty]=pos[1-k];g.save();ATK[P.atk].f(g,seg(lt,1.9,3.3),sx+(k?-50:50),sy,tx,ty,1);g.restore()}}
 for(const k of[0,1]){const P=k?P2:P1,mine=k?op:yo,their=k?yo:op,took=blk?0:their[2];let mood='happy';if(inR&&lt>1.6)mood=!mine[1]?'sad':mine[1]==='SCREAMER'?'scream':'wow';if(ko[k])mood='sad';if(ri>=N&&!ko[k])mood='wow';
  const f=Math.floor(t*4+k)%2,bob=-Math.abs(Math.sin(t*3+k))*4,rec=inR&&lt>HIT&&lt<HIT+.4&&took>0?(k?1:-1)*22*Math.sin(seg(lt,HIT,HIT+.4)*Math.PI):0;
  const x=pos[k][0]+rec,y=ko[k]?470:pos[k][1]+bob;g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x-60,488,120,10);
  g.save();g.translate(x,y);if(k)g.scale(-1,1);if(ko[k])g.rotate(.5);g.globalAlpha=inR&&lt>HIT&&lt<HIT+.35&&took>0&&Math.floor(lt*20)%2?.35:1;g.drawImage(sp(mood,f,P.kit),-90,-75,180,150);g.restore()}
 if(blk&&lt>2.0&&lt<3.4){const s=eob(seg(lt,2.0,2.25));g.save();g.translate(W/2,420);g.scale(s,s);g.fillStyle='#06041a';g.fillRect(-90,-38,180,64);g.fillStyle='#4fc3ff';g.fillRect(-84,-32,168,52);g.restore();if(s>.3)px('BLOCK!',W/2,430,46,'#06041a',{out:false})}
 if(inR&&lt>HIT&&lt<HIT+1.5&&!blk){for(const k of[0,1]){const dealt=(k?yo:op)[2];if(!dealt)continue;const a=lt-HIT,sc=(k?yo:op)[1]==='SCREAMER';px('-'+dealt+(sc?' CRIT!':''),pos[k][0],330-a*40,sc?60:44,sc?'#ffd23f':'#ffffff')}}
 // move names
 if(inR&&lt>1.75&&lt<2.4&&!blk)for(const k of[0,1]){const m=k?op:yo;if(!m[1])continue;px(ATK[(k?P2:P1).atk].name.toUpperCase()+'!',pos[k][0],515,26,'#ffffff')}
 if(t>=INTRO&&ri<N){const s=eob(seg(lt,0,.3));g.save();g.translate(W/2,600);g.scale(s,s);g.fillStyle='#06041a';g.fillRect(-250,-62,500,128);g.fillStyle='#2a1f78';g.fillRect(-244,-56,488,116);g.strokeStyle='#f3ead2';g.lineWidth=4;g.strokeRect(-238,-50,476,104);g.restore();
  if(s>.6){let z=32,L=wrap(q,440,z);if(L.length>2){z=26;L=wrap(q,450,z)}L.forEach((l,i)=>px(l,W/2,612-(L.length-1)*z/2+i*z,z,'#ffffff'))}
  // 15 second clock, sped up for the mock-up
  const left=Math.max(0,Math.ceil(15*(1-seg(lt,0,1.6))));g.fillStyle='#06041a';g.fillRect(W/2-34,522,68,34);g.fillStyle=left<=5?'#ff4d4d':'#ffd23f';g.fillRect(W/2-30,526,60,26);px(String(left),W/2,548,30,'#06041a',{out:false});
  for(const k of[0,1]){const a=k?op:yo,x=k?W-138:138,y=706;if(lt<.6)continue;const rev=lt>1.6;g.fillStyle='#06041a';g.fillRect(x-124,y-30,248,72);g.fillStyle='#120c38';g.fillRect(x-118,y-24,236,60);
   g.strokeStyle=rev?(a[1]?TC[a[1]]:'#ff4d4d'):'#7a62d8';g.lineWidth=4;g.strokeRect(x-116,y-22,232,56);
   if(!rev)px('LOCKED IN',x,y+16,28,'#7a62d8',{out:false});else{px(a[0],x,y+12,a[0].length>13?24:30,'#ffffff');const lab=a[1]?a[1]+' '+a[2]:'VAR: NO GOAL';g.font='20px VT323,monospace';const w=g.measureText(lab).width+16;g.fillStyle=a[1]?TC[a[1]]:'#ff4d4d';g.fillRect(x-w/2,y+44,w,24);px(lab,x,y+62,20,'#06041a',{out:false,font:'mono'})}}}
 if(ri>=N){const a=t-INTRO-RD*N,s=eob(seg(a,0,.35));g.save();g.translate(W/2,630);g.scale(s,s);g.fillStyle='#06041a';g.fillRect(-230,-70,460,150);g.fillStyle='#ffd23f';g.fillRect(-222,-62,444,134);g.restore();
  if(s>.5){const a0=HP[N][0],b0=HP[N][1],res=!O.final?(O.next||'NO KO YET'):a0===b0?'DRAW':a0>b0?(P1.name==='YOU'?'YOU WIN':P1.name+' WINS'):P2.name+' WINS';px(res.toUpperCase(),W/2,625,res.length>11?48:66,'#06041a',{out:false});px((!O.final?'':a0<=0||b0<=0?'KO · ':'ON POINTS · ')+Math.round(a0)+' – '+Math.round(b0)+' HP',W/2,668,26,'#06041a',{out:false,font:'mono'})}}
 requestAnimationFrame(frame)}

window.startBattle=(canvas,rounds,p1,p2,done,opts={})=>{O=opts;cv=canvas;g=cv.getContext('2d');g.imageSmoothingEnabled=false;R=rounds;P1=p1;P2=p2;onEnd=done;ended=false;setup();t0=performance.now();paused=false;
 [P1,P2].forEach(p=>{if(!ATK[p.kit||'classic'])p.atk='classic';else p.atk=p.kit||'classic'});requestAnimationFrame(frame)};
