// Copied from index.html (kits + pixel unicorn). Re-copy if kits change.
const PAL={K:"#1a1030",W:"#ffffff",L:"#d2d6ec",G:"#ffd23f",g:"#e0a000",P:"#ff6fb5",V:"#7c4dff",v:"#5a34d2",B:"#4fc3ff",E:"#1a1030",w:"#ffffff",N:"#ff6fb5"};

// ── Kits: skins for the unicorn, unlocked by playing (picked in the 🏟️ menu, Kits tab). Patterns colour each body pixel; the ball keeps its colours ──
const kDk=(h,a=.78)=>{const n=parseInt(h.slice(1),16),f=v=>Math.round(v*a).toString(16).padStart(2,'0');return'#'+f(n>>16)+f(n>>8&255)+f(n&255)};
const kPat=fn=>(x,y,dark)=>{const c=fn(x,y);return dark?kDk(c):c};
const KRAIN=['#ff4d4d','#ff8a1f','#ffd23f','#39ff6a','#4fd7ff','#7c4dff'];
// Crew kit (Boardroom): navy suit, gold tie, silver mane and sunglasses. Only the people on the crew list get it; the server decides who.
// Sprite map: body x 8-22 / y 13-20, legs y 21-25, neck front x 19-23 / y 9-12, head y <= 11
const kHead=(x,y)=>y<=11||(y===12&&x>=24);
const kSuit=o=>kPat((x,y)=>{if(kHead(x,y))return '#ffffff';if(y>=21)return o.legs||o.jacket;
 if(x>=20&&y<=18)return x===21&&y>=13?o.tie:(x===21&&y===12?kDk(o.tie,.8):o.shirt);
 if(x===19&&y<=18)return o.lapel||kDk(o.jacket,.6);if(o.pocket&&(x===14||x===15)&&y===15)return o.pocket;return o.jacket});
// add-ons are drawn on top of the finished sprite: the sunglasses' frame and far lens stick out past the face
const kShades=f=>{const K='#111111',G='#8fa6d6',R=[],r=(x,y,w,h,c)=>R.push([x,y,w,h,c]);r(19,6,15,1,K);r(24,7,5,2,K);r(25,9,3,1,K);r(29,7,2,1,K);r(31,7,4,2,K);r(32,9,2,1,K);r(25,7,2,1,G);r(32,7,1,1,G);return R};
const KITS=[
 {id:'classic',en:'Classic',es:'Clásico',req:null,pal:{}},
 {id:'stripes',en:'Home stripes',es:'Rayas',req:['games',3],pal:{P:'#1a1030',V:'#ff3b30',B:'#ffffff'},pat:kPat((x,y)=>x%4<2?'#ff3b30':'#ffffff')},
 {id:'hoops',en:'Blue hoops',es:'Aros azules',req:['streak',3],pal:{P:'#ffffff',V:'#2f6bff',B:'#ffffff'},pat:kPat((x,y)=>y%4<2?'#2f6bff':'#ffffff')},
 {id:'ref',en:'Referee',es:'Árbitro',req:['streak',4],pal:{W:'#2b2b2b',L:'#1c1c1c',P:'#ffd23f',V:'#ff3b30',B:'#ffd23f',w:'#2b2b2b',N:'#ffd23f'}},
 {id:'candy',en:'Candy',es:'Chuche',req:['games',5],pal:{W:'#ffb3d9',L:'#f28cc0',P:'#ffffff',V:'#ff6fb5',B:'#ffffff',w:'#ffb3d9',N:'#ff3b8a'}},
 {id:'sash',en:'The sash',es:'La banda',req:['scr',6],pal:{P:'#ff3b30',V:'#1a1030',B:'#ff3b30'},pat:kPat((x,y)=>x+y>=29&&x+y<=33?'#ff3b30':'#ffffff')},
 {id:'keeper',en:'Goalkeeper',es:'Portero',req:['games',8],pal:{W:'#7dff3b',L:'#56cc22',P:'#1a1030',V:'#3a2a5c',B:'#1a1030',w:'#7dff3b',N:'#1a1030'}},
 {id:'halves',en:'Halves',es:'Mitades',req:['best',235],pal:{P:'#ffd23f',V:'#1a1030',B:'#ffd23f'},pat:kPat((x,y)=>x<16?'#2b2b2b':'#ffffff')},
 {id:'night',en:'Night match',es:'Partido nocturno',req:['streak',7],pal:{W:'#4a4f86',L:'#353a6b',P:'#39ff6a',V:'#4fd7ff',B:'#39ff6a',w:'#4a4f86',N:'#39ff6a'}},
 {id:'pin',en:'Pinstripes',es:'Raya diplomática',req:['best',295],pal:{P:'#ffffff',V:'#1a2a6c',B:'#ffffff'},pat:kPat((x,y)=>x%3===0?'#c9d1e0':'#1a2a6c')},
 {id:'fire',en:'Fire mane',es:'Crin de fuego',req:['scr',10],pal:{P:'#ff3b30',V:'#ff8a1f',B:'#ffd23f'}},
 {id:'quarters',en:'Quarters',es:'Cuartos',req:['games',12],pal:{P:'#2f6bff',V:'#ffffff',B:'#2f6bff'},pat:kPat((x,y)=>(x<17)!==(y<15)?'#2f6bff':'#ffffff')},
 {id:'checks',en:'Checkers',es:'Cuadros',req:['streak',10],pal:{P:'#1a3d8f',V:'#ff3b30',B:'#ffffff'},pat:kPat((x,y)=>((x>>1)+(y>>1))%2?'#ff3b30':'#ffffff')},
 {id:'hat3',en:'Hat-trick',es:'Hat-trick',req:['scr1',3],pal:{W:'#5a2ea6',L:'#43207f',P:'#ffd23f',V:'#ffffff',B:'#ffd23f',w:'#5a2ea6',N:'#ffd23f'},pat:kPat((x,y)=>(x+y*2)%9<2?'#ffd23f':'#5a2ea6')},
 {id:'dots',en:'Polka dots',es:'Lunares',req:['streak',12],pal:{P:'#ffffff',V:'#ff3b30',B:'#ffffff'},pat:kPat((x,y)=>(x%4===1&&y%4===1)||(x%4===3&&y%4===3)?'#ffffff':'#ff3b30')},
 {id:'toxic',en:'Toxic',es:'Tóxico',req:['scr',15],pal:{W:'#b6ff3b',L:'#86d41f',P:'#1a1030',V:'#3a2a5c',B:'#1a1030',w:'#b6ff3b',N:'#1a1030',G:'#1a1030',g:'#000000'}},
 {id:'ice',en:'Ice cold',es:'Hielo',req:['games',20],pal:{W:'#dff6ff',L:'#a9dcf2',P:'#ffffff',V:'#4fd7ff',B:'#9fd8ff',G:'#9fd8ff',g:'#4fa8d8',N:'#4fd7ff'}},
 {id:'perfect',en:'Perfect day',es:'Día perfecto',req:['allfive',1],pal:{L:'#e6e9f5',P:'#39ff6a',V:'#ffd23f',B:'#39ff6a',N:'#39ff6a'},pat:kPat((x,y)=>x%6===2&&y%6===2?'#39ff6a':x%6===5&&y%6===5?'#ffd23f':'#ffffff')},
 {id:'leopard',en:'Leopard',es:'Leopardo',req:['scr',20],pal:{P:'#3b2414',V:'#8a5a2b',B:'#3b2414',N:'#3b2414'},pat:kPat((x,y)=>{const a=(x*3+y*5)%11,b=(x*7+y*3)%13;return a===0?'#3b2414':b===0||a===1?'#8a5a2b':'#f0c060'})},
 {id:'zebra',en:'Zebra',es:'Cebra',req:['games',30],pal:{P:'#1a1030',V:'#ffffff',B:'#1a1030',N:'#1a1030',g:'#1a1030',G:'#ffd23f'},pat:kPat((x,y)=>{const w=Math.round(Math.sin(y*.55)*1.2);return(x+w)%4===0?'#1a1030':'#ffffff'})},
 {id:'shadow',en:'Infinity',es:'Infinito',req:['inf',1],pal:{W:'#2b1a5c',L:'#1d1145',P:'#5ef0ff',V:'#b06bff',B:'#5ef0ff',G:'#5ef0ff',g:'#2ab8d0',E:'#5ef0ff',w:'#2b1a5c',N:'#b06bff'}},
 {id:'galaxy',en:'Galaxy',es:'Galaxia',req:['level',4],pal:{P:'#b06bff',V:'#5ef0ff',B:'#ff7ac8',G:'#ffffff',g:'#9fd8ff',E:'#ffffff',N:'#ff7ac8'},pat:kPat((x,y)=>(x*7+y*13)%23===0?'#ffffff':(x*5+y*3)%17===0?'#9fd8ff':y<14?'#241552':'#170c3f')},
 {id:'ocean',en:'Ocean',es:'Océano',req:['games',40],pal:{P:'#ffffff',V:'#4fd7ff',B:'#ffffff',N:'#ff7ac8'},pat:kPat((x,y)=>{const w=Math.sin(x*.7+y*.4)+y*.12;return w>2.3?'#0a3d8f':w>1.6?'#1e6bd6':w>.9?'#4fa8ff':'#9fe0ff'})},
 {id:'sunset',en:'Sunset',es:'Atardecer',req:['best',485],pal:{P:'#7c4dff',V:'#ff6fb5',B:'#ffd23f',N:'#7c4dff'},pat:kPat((x,y)=>['#ffd23f','#ffb84d','#ff8a5c','#ff6f91','#d65fb5','#9b5fd6'][Math.min(5,Math.max(0,Math.floor((y-3)/4)))])},
 {id:'camo',en:'Camo',es:'Camuflaje',req:['games',50],pal:{P:'#3d5a1f',V:'#6b7d3a',B:'#3d5a1f',N:'#6b7d3a'},pat:kPat((x,y)=>{const n=Math.sin(x*1.7+y*.9)+Math.sin(x*.6-y*1.3);return n>.9?'#3d5a1f':n>-.2?'#6b7d3a':'#a3a86b'})},
 {id:'lava',en:'Lava',es:'Lava',req:['best',500],pal:{P:'#ff3b30',V:'#ffd23f',B:'#ff8a1f',G:'#ffd23f',g:'#ff3b30',E:'#ffd23f',N:'#ff3b30'},pat:kPat((x,y)=>{const n=Math.sin(x*1.3+y*.7)*Math.cos(y*1.1-x*.4);return n>.55?'#ffd23f':n>.3?'#ff6a1f':'#2a1410'})},
 {id:'chrome',en:'Chrome',es:'Cromo',req:['level',5],pal:{P:'#ffffff',V:'#8a93a6',B:'#c9d1e0',G:'#ffffff',g:'#8a93a6',N:'#8a93a6'},pat:kPat((x,y)=>['#f4f6fb','#d6dbe6','#b8bfce','#e8ecf4','#9aa3b5','#ccd2de'][(x+y)%6])},
 {id:'rainbow',en:'Rainbow',es:'Arcoíris',req:['streak',21],pal:{P:'#ffffff',V:'#ffffff',B:'#ffffff'},pat:kPat((x,y)=>KRAIN[Math.floor(x/3)%6])},
 {id:'tiedye',en:'Tie-dye',es:'Tie-dye',req:['streak',30],pal:{P:'#ffffff',V:'#ffffff',B:'#ffffff'},pat:kPat((x,y)=>['#ff7ac8','#ffd23f','#7dff9a','#4fd7ff','#b388ff'][Math.floor(Math.sin(Math.hypot(x-16,y-14)*.6)*2.5+2.5)%5])},
 {id:'gold',en:'Golden unicorn',es:'Unicornio dorado',req:['level',6],gold:true,pal:{W:'#ffe27a',L:'#e0b030',P:'#ffffff',V:'#ff8a1f',B:'#fff3a0',G:'#ffffff',g:'#c98f12',N:'#ff8a1f'}},
 {id:'mud',en:'Mud bath',es:'Barro',req:['games',2],pal:{P:'#5a3a1c',V:'#8a5a2b',B:'#5a3a1c'},pat:kPat((x,y)=>((x*7+y*11)%13<3||(x+y*3)%17===0)?'#7a4f22':'#ffffff')},
 {id:'bee',en:'Bumblebee',es:'Abejorro',req:['streak',5],pal:{P:'#1a1030',V:'#ffd23f',B:'#1a1030',N:'#1a1030'},pat:kPat((x,y)=>y%4<2?'#ffd23f':'#1a1030')},
 {id:'tartan',en:'Tartan',es:'Escocés',req:['games',15],pal:{P:'#1a3d1f',V:'#d12a2a',B:'#1a3d1f'},pat:kPat((x,y)=>{const a=x%6<2,b=y%6<2;return a&&b?'#7a1010':a||b?'#d12a2a':(x+y)%2?'#1a3d1f':'#2a5a2f'})},
 {id:'retro',en:'Retro 70s',es:'Años 70',req:['streak',14],pal:{P:'#5a3a1c',V:'#ff8a1f',B:'#ffd23f',N:'#5a3a1c'},pat:kPat((x,y)=>['#fff3d0','#ffd23f','#ff8a1f','#c0501c','#5a3a1c'][Math.floor(x/3)%5])},
 {id:'straw',en:'Strawberry',es:'Fresa',req:['allfive',3],pal:{P:'#2fbf71',V:'#1f8a4c',B:'#2fbf71',N:'#2fbf71'},pat:kPat((x,y)=>(x%4===1&&y%3===1)||(x%4===3&&y%3===2)?'#ffe98a':'#e3262f')},
 {id:'aurora',en:'Aurora',es:'Aurora',req:['big',2],pal:{P:'#7dff9a',V:'#b388ff',B:'#4fd7ff',G:'#ffffff',N:'#7dff9a'},pat:kPat((x,y)=>{const w=Math.sin(x*.5)*2+y;return w<8?'#0b1a3a':w<13?'#1f6b5a':w<18?'#7dff9a':w<23?'#4fd7ff':'#b388ff'})},
 {id:'matrix',en:'Matrix',es:'Matrix',req:['scr',40],pal:{W:'#06140a',L:'#030a05',P:'#39ff6a',V:'#1f8a3a',B:'#39ff6a',w:'#06140a',N:'#39ff6a',E:'#39ff6a',G:'#39ff6a',g:'#1f8a3a'},pat:kPat((x,y)=>((x*13+y*7)%11<2)?'#39ff6a':(x%3===0&&(y+x)%5<2)?'#1f8a3a':'#06140a')},
 {id:'glitch',en:'Glitch',es:'Glitch',req:['scr1',4],pal:{P:'#ff3b8a',V:'#4fd7ff',B:'#ffd23f'},pat:kPat((x,y)=>{const r=(x*31+y*17)%23;return r<3?'#ff3b8a':r<5?'#4fd7ff':r<6?'#ffd23f':(y%5===0&&x>12)?'#7c4dff':'#f2f2f2'})},
 {id:'royal',en:'Royal',es:'Real',req:['streak',60],pal:{W:'#4a1f8a',L:'#3a1670',P:'#ffd23f',V:'#ffffff',B:'#ffd23f',w:'#4a1f8a',N:'#ffd23f',G:'#ffd23f',g:'#c98f12'},pat:kPat((x,y)=>(x+y)%6===0?'#ffd23f':(x-y+60)%6===0?'#7c4dff':'#4a1f8a')},
 {id:'boardroom',en:'Boardroom',es:'Junta directiva',req:['crew',1],crew:true,pal:{P:'#c9ced8',V:'#9aa3b5',B:'#e6e9f0',N:'#9aa3b5',g:'#111111'},pat:kSuit({jacket:'#1b2a6b',shirt:'#ffffff',tie:'#ffd23f',pocket:'#ffd23f'}),addon:kShades},
 {id:'goat',en:'Cosmic GOAT',es:'GOAT cósmico',req:['win',1],myth:true,pal:{P:'#ffffff',V:'#ffd23f',B:'#ff7ac8',G:'#ffffff',g:'#ffd23f',E:'#4fd7ff',N:'#ff7ac8'},pat:kPat((x,y)=>['#ff7ac8','#ffb0e0','#ffd23f','#fff3a0','#7dff9a','#b0ffd0','#4fd7ff','#b0ecff','#b388ff','#e0d0ff'][(x+y*2)%10])},
];
const kitColor=(c,x,y,kit)=>{if(!kit||(x>=27&&y>=21))return PAL[c];if(kit.pat&&(c==='W'||c==='L'))return kit.pat(x,y,c==='L');return kit.pal[c]||PAL[c]};
const FRAMES=[["............................KGK.....", "...........................KGK......", ".......................K..KGgK......", ".....................KKWKKGgK.......", "....................KPPVWGgKKK......", "...................KPVVWWWWWWWK.....", "...................KVVBWWWWWWWK.....", "..................KVBBWWWWEwWWKK....", "..................KBBPWWWWEWWWWWK...", ".................KBPPWWWWWWWWWWWWK..", ".................KPPVWWWWWWWWWWNWK..", "................KPVVWWWWWWWWWWWWWK..", ".........KKKKKKKKVVBWWWWKKKWLLLLWK..", ".......KKWWWWWWWWWWWWWWK...KKKKKK...", "......KPWWWWWWWWWWWWWWWK............", ".....KPPWWWWWWWWWWWWWWWK............", "....KPPKWWWWWWWWWWWWWWWK............", "....KVVKWWWWWWWWWWWWWWWK............", "...KVVKKWWWWWWWWWWWWWWWK............", "...KVVKKWWWWWWWWWWWWWWWK............", "..KBBK..KLLLLLLLLLLLLLWK............", "..KBBK..KWWKWWKKKKWWKWWK............", "...KK...KWWKWWK..KWWKWWK......KK....", "........KWWKWWK..KWWKWWK.....KWWK...", "........KWWKWWK..KWWKWWK....KWKKWK..", "........KLLKLLK..KLLKLLK....KWKKWK..", "........KggKggK..KggKggK.....KWWK...", ".........KK.KK....KK.KK.......KK....", "....................................", "...................................."], ["............................KGK.....", "...........................KGK......", ".......................K..KGgK......", ".....................KKWKKGgK.......", "...................KKPPVWGgKKK......", "..................KPVVKWWWWWWWK.....", "..................KKVVBWWWWWWWK.....", ".................KVBBWWWWWEwWWKK....", ".................KKBBPWWWWEWWWWWK...", "................KBPPWWWWWWWWWWWWWK..", "................KKPPVWWWWWWWWWWNWK..", "...............KPVVWWWWWWWWWWWWWWK..", ".........KKKKKKKKVVBWWWWKKKWLLLLWK..", ".......KKWWWWWWWWWWWWWWK...KKKKKK...", "......KPWWWWWWWWWWWWWWWK............", ".....KPPWWWWWWWWWWWWWWWK............", "....KVVKWWWWWWWWWWWWWWWK............", "...KKVVKWWWWWWWWWWWWWWWK............", "..KVVKKKWWWWWWWWWWWWWWWK............", "..KBBK.KWWWWWWWWWWWWWWWK............", ".KBBK...KLLLLLLLLLLLLLWK............", ".KBBK..KWWKKKWWKKWWKKKWWK......KK...", "..KK...KWWK.KWWKKWWK.KWWK.....KWWK..", ".......KWWK.KWWKKWWK.KWWK....KWKKWK.", "......KWWK...KWWWWK...KWWK...KWKKWK.", "......KLLK...KLLLLK...KLLK....KWWK..", "......KggK...KggggK...KggK.....KK...", ".......KK.....KKKK.....KK...........", "....................................", "...................................."]];
// third frame: mid-gallop, legs tucked under (rows 0-20 are the body, shared with frame 0)
FRAMES.push(FRAMES[0].slice(0,21).concat(["..KBBK..KWWKWWKKKKWWKWWK............", "...KK..KWWKWWK....KWWKWWK.....KK....", "......KWWKWWK......KWWKWWK...KWWK...", "......KLLKLLK......KLLKLLK..KWKKWK..", "......KggKggK......KggKggK..KWKKWK..", ".......KK.KK........KK.KK....KWWK...", "..............................KK....", "....................................", "...................................."]));
// Each unicorn is drawn once into a small picture and reused everywhere (much cheaper to show than hundreds of SVG squares)
function spriteDraw(mood,f,blink,kit){const px=[];FRAMES[f].forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='.')return;let col=kitColor(c,x,y,kit);if(blink&&(c==='E'||c==='w'))col='#ffffff';px.push([x,y,1,1,col])}));
 const R=(x,y,w,h,c)=>px.push([x,y,w,h,c]);const j=f?1:0;
 if(blink)R(25,8,3,1,'#1a1030');
 if(mood==='sad'){R(25,7,3,1,'#1a1030');R(26,9,1,2,'#4fc3ff');R(26,11,1,1,'#4fc3ff')}
 if(mood==='wow'){for(const[x,y]of[[33,3-j],[3,6+j],[34,10+j]]){R(x,y-1,1,3,'#fff27a');R(x-1,y,3,1,'#fff27a')}}
 if(mood==='scream'){R(12-j,4,5,1,'#ff6fb5');R(10-j,6,6,1,'#7c4dff');R(11-j,8,5,1,'#4fc3ff');R(12-j,10,4,1,'#ff6fb5');
  R(24,5,5,5,'#1a1030');R(25,6,3,3,'#ffffff');R(26,7,1,1,'#1a1030');
  R(27,10,7,4+j,'#1a1030');R(28,11,5,2+j,'#7a1030');R(29,12+j,3,1,'#ff6fb5');R(28,10,1,1,'#fff');R(32,10,1,1,'#fff');
  R(34,2+j,1,3,'#fff27a');R(35,6-j,1,2,'#fff27a');R(33,0,1,1,'#fff27a')}
 const EY=pts=>{for(const[x,y]of[[26,7],[27,7],[26,8]])R(x,y,1,1,kitColor('W',x,y,kit));for(const[x,y]of pts)R(x,y,1,1,'#1a1030')};
 if(mood==='hurt')EY([[25,6],[26,7],[25,8]]);if(mood==='ko')EY([[25,6],[27,6],[26,7],[25,8],[27,8]]);if(mood==='joy')EY([[25,8],[26,7],[27,8]]);if(mood==='sleep')EY([[25,8],[26,8],[27,8]]);
 if(mood==='angry')for(const[x,y]of[[24,5],[25,5],[26,6],[27,6]])R(x,y,1,1,'#1a1030');
 if(kit&&kit.addon)for(const p of kit.addon(f))px.push(p);
 if(mood==='flash')for(const p of px)p[4]='#ffffff';
 if(mood==='juggle')for(let i=px.length-1;i>=0;i--){const[x,y,w]=px[i];if(x>=27&&y>=21&&w===1)px.splice(i,1)}
 try{const S=6,cv=document.createElement('canvas');cv.width=36*S;cv.height=30*S;const g=cv.getContext('2d');for(const[x,y,w,h,c]of px){g.fillStyle=c;g.fillRect(x*S,y*S,w*S,h*S)}return`url("${cv.toDataURL('image/png')}")`}
 catch{const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 30" shape-rendering="crispEdges">${px.map(([x,y,w,h,c])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('')}</svg>`;return`url("data:image/svg+xml,${encodeURIComponent(svg)}")`}}
