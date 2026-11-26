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
// Christmas 2026 kits (season dates + add-ons)
const XM_TO='2027-01-06';
const kSantaHat=f=>{const r='#d62828',d='#a51d1d',w='#ffffff';return[[20,5,7,1,w],[20,4,6,1,r],[19,3,6,1,r],[18,2,5,1,d],[17,2,2,1,r],[15,1,3,1,w],[15,2,3,1,w],[16,3,1,1,w]]};
const kAntler=f=>{const d='#a87a4a',b='#c99a5e',l='#e6c690',t='#fff0cc';return[[19,3,2,1,d],[18,2,1,1,d],[17,1,1,1,d],[16,0,1,1,d],[19,1,1,1,d],[19,0,1,1,d],[22,3,2,1,b],[21,2,2,1,b],[20,1,1,1,b],[18,0,2,1,l],[22,1,1,1,l],[22,0,1,1,t],[24,2,1,1,l],[25,1,1,1,t],[20,0,1,1,t]]};
const kSnowman=f=>{const k='#1a1030',s='#c8473b';return[[21,2,5,3,k],[20,5,7,1,k],[21,4,5,1,s],[20,11,5,2,s],[18,12,3,4,s]]};
const kXStar=f=>{const g='#fff27a';return[[33,0,1,3,g],[32,1,3,1,g],[31,5,1,1,'#ffffff'],[5,4,1,1,g],[4,5,3,1,g],[5,6,1,1,g]]};
// Frost: the advent calendar's secret kit, 4 pieces (crown, scarf, jumper, boots). frostKit(n) is the kit with n pieces on.
const kFrostCrown=[[19,4,7,1,'#7cc7f0'],[19,3,7,1,'#e8f8ff'],[19,1,1,2,'#bfe6ff'],[21,2,1,1,'#ffffff'],[22,0,1,3,'#bfe6ff'],[24,2,1,1,'#ffffff'],[25,1,1,2,'#bfe6ff']];
const kFrostScarf=[[20,11,5,2,'#2f7fc4'],[18,12,3,4,'#2f7fc4'],[21,11,1,2,'#bfe6ff'],[19,14,1,1,'#bfe6ff']];
const frostKit=n=>({id:'xm-frost',en:'Frost',es:'Escarcha',pt:'Geada',req:['advp',4],until:XM_TO,
 pal:n>=4?{P:'#dff3ff',V:'#a9d8f5',B:'#ffffff',N:'#7cc7f0',W:'#e8f8ff',L:'#9fd6f5'}:n>=3?{P:'#dff3ff',V:'#a9d8f5',B:'#ffffff'}:{},
 pat:n>=3?kPat((x,y)=>(x*3+y*7)%11===0?'#ffffff':(x+y)%4===0?'#bfe6ff':'#8fd0f5'):undefined,
 addon:n>=1?(f=>[...kFrostCrown,...(n>=2?kFrostScarf:[])]):undefined});
const kTreeStar=f=>{const g='#ffd23f',w='#fff6c0';return[[30,0,1,1,w],[29,1,3,1,g],[30,2,1,1,g],[5,5,1,1,g],[4,6,3,1,g],[5,7,1,1,g]]};
const KITS=[
 {id:'classic',en:'Club',es:'Club',pt:'Clube',req:null,pal:{}},
 {id:'og',en:'Classic',es:'Clásico',pt:'Clássico',req:null,pal:{}},
 {id:'stripes',en:'Home stripes',es:'Rayas',pt:'Listras',req:['games',3],pal:{P:'#1a1030',V:'#ff3b30',B:'#ffffff'},pat:kPat((x,y)=>x%4<2?'#ff3b30':'#ffffff')},
 {id:'hoops',en:'Blue hoops',es:'Aros azules',pt:'Listras azuis',req:['streak',3],pal:{P:'#ffffff',V:'#2f6bff',B:'#ffffff'},pat:kPat((x,y)=>y%4<2?'#2f6bff':'#ffffff')},
 {id:'ref',en:'Referee',es:'Árbitro',pt:'Árbitro',req:['streak',4],pal:{W:'#2b2b2b',L:'#1c1c1c',P:'#ffd23f',V:'#ff3b30',B:'#ffd23f',w:'#2b2b2b',N:'#ffd23f'}},
 {id:'candy',en:'Candy',es:'Chuche',pt:'Bala',req:['games',5],pal:{W:'#ffb3d9',L:'#f28cc0',P:'#ffffff',V:'#ff6fb5',B:'#ffffff',w:'#ffb3d9',N:'#ff3b8a'}},
 {id:'sash',en:'The sash',es:'La banda',pt:'A faixa',req:['scr',6],pal:{P:'#ff3b30',V:'#1a1030',B:'#ff3b30'},pat:kPat((x,y)=>x+y>=29&&x+y<=33?'#ff3b30':'#ffffff')},
 {id:'keeper',en:'Goalkeeper',es:'Portero',pt:'Goleiro',req:['games',8],pal:{W:'#7dff3b',L:'#56cc22',P:'#1a1030',V:'#3a2a5c',B:'#1a1030',w:'#7dff3b',N:'#1a1030'}},
 {id:'halves',en:'Halves',es:'Mitades',pt:'Metades',req:['best',235],pal:{P:'#ffd23f',V:'#1a1030',B:'#ffd23f'},pat:kPat((x,y)=>x<16?'#2b2b2b':'#ffffff')},
 {id:'night',en:'Night match',es:'Partido nocturno',pt:'Jogo noturno',req:['streak',7],pal:{W:'#4a4f86',L:'#353a6b',P:'#39ff6a',V:'#4fd7ff',B:'#39ff6a',w:'#4a4f86',N:'#39ff6a'}},
 {id:'pin',en:'Pinstripes',es:'Raya diplomática',pt:'Risca de giz',req:['best',295],pal:{P:'#ffffff',V:'#1a2a6c',B:'#ffffff'},pat:kPat((x,y)=>x%3===0?'#c9d1e0':'#1a2a6c')},
 {id:'fire',en:'Fire mane',es:'Crin de fuego',pt:'Crina de fogo',req:['scr',10],pal:{P:'#ff3b30',V:'#ff8a1f',B:'#ffd23f'}},
 {id:'quarters',en:'Quarters',es:'Cuartos',pt:'Quartos',req:['games',12],pal:{P:'#2f6bff',V:'#ffffff',B:'#2f6bff'},pat:kPat((x,y)=>(x<17)!==(y<15)?'#2f6bff':'#ffffff')},
 {id:'checks',en:'Checkers',es:'Cuadros',pt:'Xadrez',req:['streak',10],pal:{P:'#1a3d8f',V:'#ff3b30',B:'#ffffff'},pat:kPat((x,y)=>((x>>1)+(y>>1))%2?'#ff3b30':'#ffffff')},
 {id:'hat3',en:'Hat-trick',es:'Hat-trick',pt:'Hat-trick',req:['scr1',3],pal:{W:'#5a2ea6',L:'#43207f',P:'#ffd23f',V:'#ffffff',B:'#ffd23f',w:'#5a2ea6',N:'#ffd23f'},pat:kPat((x,y)=>(x+y*2)%9<2?'#ffd23f':'#5a2ea6')},
 {id:'dots',en:'Polka dots',es:'Lunares',pt:'Bolinhas',req:['streak',12],pal:{P:'#ffffff',V:'#ff3b30',B:'#ffffff'},pat:kPat((x,y)=>(x%4===1&&y%4===1)||(x%4===3&&y%4===3)?'#ffffff':'#ff3b30')},
 {id:'toxic',en:'Toxic',es:'Tóxico',pt:'Tóxico',req:['scr',15],pal:{W:'#b6ff3b',L:'#86d41f',P:'#1a1030',V:'#3a2a5c',B:'#1a1030',w:'#b6ff3b',N:'#1a1030',G:'#1a1030',g:'#000000'}},
 {id:'ice',en:'Ice cold',es:'Hielo',pt:'Gelo',req:['games',20],pal:{W:'#dff6ff',L:'#a9dcf2',P:'#ffffff',V:'#4fd7ff',B:'#9fd8ff',G:'#9fd8ff',g:'#4fa8d8',N:'#4fd7ff'}},
 {id:'perfect',en:'Perfect day',es:'Día perfecto',pt:'Dia perfeito',req:['allfive',1],pal:{L:'#e6e9f5',P:'#39ff6a',V:'#ffd23f',B:'#39ff6a',N:'#39ff6a'},pat:kPat((x,y)=>x%6===2&&y%6===2?'#39ff6a':x%6===5&&y%6===5?'#ffd23f':'#ffffff')},
 {id:'leopard',en:'Leopard',es:'Leopardo',pt:'Leopardo',req:['scr',20],pal:{P:'#3b2414',V:'#8a5a2b',B:'#3b2414',N:'#3b2414'},pat:kPat((x,y)=>{const a=(x*3+y*5)%11,b=(x*7+y*3)%13;return a===0?'#3b2414':b===0||a===1?'#8a5a2b':'#f0c060'})},
 {id:'zebra',en:'Zebra',es:'Cebra',pt:'Zebra',req:['games',30],pal:{P:'#1a1030',V:'#ffffff',B:'#1a1030',N:'#1a1030',g:'#1a1030',G:'#ffd23f'},pat:kPat((x,y)=>{const w=Math.round(Math.sin(y*.55)*1.2);return(x+w)%4===0?'#1a1030':'#ffffff'})},
 {id:'shadow',en:'Infinity',es:'Infinito',pt:'Infinito',req:['inf',1],pal:{W:'#2b1a5c',L:'#1d1145',P:'#5ef0ff',V:'#b06bff',B:'#5ef0ff',G:'#5ef0ff',g:'#2ab8d0',E:'#5ef0ff',w:'#2b1a5c',N:'#b06bff'}},
 {id:'galaxy',en:'Galaxy',es:'Galaxia',pt:'Galáxia',req:['level',4],pal:{P:'#b06bff',V:'#5ef0ff',B:'#ff7ac8',G:'#ffffff',g:'#9fd8ff',E:'#ffffff',N:'#ff7ac8'},pat:kPat((x,y)=>(x*7+y*13)%23===0?'#ffffff':(x*5+y*3)%17===0?'#9fd8ff':y<14?'#241552':'#170c3f')},
 {id:'ocean',en:'Ocean',es:'Océano',pt:'Oceano',req:['games',40],pal:{P:'#ffffff',V:'#4fd7ff',B:'#ffffff',N:'#ff7ac8'},pat:kPat((x,y)=>{const w=Math.sin(x*.7+y*.4)+y*.12;return w>2.3?'#0a3d8f':w>1.6?'#1e6bd6':w>.9?'#4fa8ff':'#9fe0ff'})},
 {id:'sunset',en:'Sunset',es:'Atardecer',pt:'Pôr do sol',req:['best',485],pal:{P:'#7c4dff',V:'#ff6fb5',B:'#ffd23f',N:'#7c4dff'},pat:kPat((x,y)=>['#ffd23f','#ffb84d','#ff8a5c','#ff6f91','#d65fb5','#9b5fd6'][Math.min(5,Math.max(0,Math.floor((y-3)/4)))])},
 {id:'camo',en:'Camo',es:'Camuflaje',pt:'Camuflado',req:['games',50],pal:{P:'#3d5a1f',V:'#6b7d3a',B:'#3d5a1f',N:'#6b7d3a'},pat:kPat((x,y)=>{const n=Math.sin(x*1.7+y*.9)+Math.sin(x*.6-y*1.3);return n>.9?'#3d5a1f':n>-.2?'#6b7d3a':'#a3a86b'})},
 {id:'lava',en:'Lava',es:'Lava',pt:'Lava',req:['best',500],pal:{P:'#ff3b30',V:'#ffd23f',B:'#ff8a1f',G:'#ffd23f',g:'#ff3b30',E:'#ffd23f',N:'#ff3b30'},pat:kPat((x,y)=>{const n=Math.sin(x*1.3+y*.7)*Math.cos(y*1.1-x*.4);return n>.55?'#ffd23f':n>.3?'#ff6a1f':'#2a1410'})},
 {id:'chrome',en:'Chrome',es:'Cromo',pt:'Cromado',req:['level',5],pal:{P:'#ffffff',V:'#8a93a6',B:'#c9d1e0',G:'#ffffff',g:'#8a93a6',N:'#8a93a6'},pat:kPat((x,y)=>['#f4f6fb','#d6dbe6','#b8bfce','#e8ecf4','#9aa3b5','#ccd2de'][(x+y)%6])},
 {id:'rainbow',en:'Rainbow',es:'Arcoíris',pt:'Arco-íris',req:['streak',21],pal:{P:'#ffffff',V:'#ffffff',B:'#ffffff'},pat:kPat((x,y)=>KRAIN[Math.floor(x/3)%6])},
 {id:'tiedye',en:'Tie-dye',es:'Tie-dye',pt:'Tie-dye',req:['streak',30],pal:{P:'#ffffff',V:'#ffffff',B:'#ffffff'},pat:kPat((x,y)=>['#ff7ac8','#ffd23f','#7dff9a','#4fd7ff','#b388ff'][Math.floor(Math.sin(Math.hypot(x-16,y-14)*.6)*2.5+2.5)%5])},
 {id:'gold',en:'Golden unicorn',es:'Unicornio dorado',pt:'Unicórnio dourado',req:['level',6],gold:true,pal:{W:'#ffe27a',L:'#e0b030',P:'#ffffff',V:'#ff8a1f',B:'#fff3a0',G:'#ffffff',g:'#c98f12',N:'#ff8a1f'}},
 {id:'mud',en:'Mud bath',es:'Barro',pt:'Banho de lama',req:['games',2],pal:{P:'#5a3a1c',V:'#8a5a2b',B:'#5a3a1c'},pat:kPat((x,y)=>((x*7+y*11)%13<3||(x+y*3)%17===0)?'#7a4f22':'#ffffff')},
 {id:'bee',en:'Bumblebee',es:'Abejorro',pt:'Abelhão',req:['streak',5],pal:{P:'#1a1030',V:'#ffd23f',B:'#1a1030',N:'#1a1030'},pat:kPat((x,y)=>y%4<2?'#ffd23f':'#1a1030')},
 {id:'tartan',en:'Tartan',es:'Escocés',pt:'Xadrez escocês',req:['games',15],pal:{P:'#1a3d1f',V:'#d12a2a',B:'#1a3d1f'},pat:kPat((x,y)=>{const a=x%6<2,b=y%6<2;return a&&b?'#7a1010':a||b?'#d12a2a':(x+y)%2?'#1a3d1f':'#2a5a2f'})},
 {id:'retro',en:'Retro 70s',es:'Años 70',pt:'Anos 70',req:['streak',14],pal:{P:'#5a3a1c',V:'#ff8a1f',B:'#ffd23f',N:'#5a3a1c'},pat:kPat((x,y)=>['#fff3d0','#ffd23f','#ff8a1f','#c0501c','#5a3a1c'][Math.floor(x/3)%5])},
 {id:'straw',en:'Strawberry',es:'Fresa',pt:'Morango',req:['allfive',3],pal:{P:'#2fbf71',V:'#1f8a4c',B:'#2fbf71',N:'#2fbf71'},pat:kPat((x,y)=>(x%4===1&&y%3===1)||(x%4===3&&y%3===2)?'#ffe98a':'#e3262f')},
 {id:'aurora',en:'Aurora',es:'Aurora',pt:'Aurora',req:['big',2],pal:{P:'#7dff9a',V:'#b388ff',B:'#4fd7ff',G:'#ffffff',N:'#7dff9a'},pat:kPat((x,y)=>{const w=Math.sin(x*.5)*2+y;return w<8?'#0b1a3a':w<13?'#1f6b5a':w<18?'#7dff9a':w<23?'#4fd7ff':'#b388ff'})},
 {id:'matrix',en:'Matrix',es:'Matrix',pt:'Matrix',req:['scr',40],pal:{W:'#06140a',L:'#030a05',P:'#39ff6a',V:'#1f8a3a',B:'#39ff6a',w:'#06140a',N:'#39ff6a',E:'#39ff6a',G:'#39ff6a',g:'#1f8a3a'},pat:kPat((x,y)=>((x*13+y*7)%11<2)?'#39ff6a':(x%3===0&&(y+x)%5<2)?'#1f8a3a':'#06140a')},
 {id:'glitch',en:'Glitch',es:'Glitch',pt:'Glitch',req:['scr1',4],pal:{P:'#ff3b8a',V:'#4fd7ff',B:'#ffd23f'},pat:kPat((x,y)=>{const r=(x*31+y*17)%23;return r<3?'#ff3b8a':r<5?'#4fd7ff':r<6?'#ffd23f':(y%5===0&&x>12)?'#7c4dff':'#f2f2f2'})},
 {id:'royal',en:'Royal',es:'Real',pt:'Real',req:['streak',60],pal:{W:'#4a1f8a',L:'#3a1670',P:'#ffd23f',V:'#ffffff',B:'#ffd23f',w:'#4a1f8a',N:'#ffd23f',G:'#ffd23f',g:'#c98f12'},pat:kPat((x,y)=>(x+y)%6===0?'#ffd23f':(x-y+60)%6===0?'#7c4dff':'#4a1f8a')},
 {id:'boardroom',en:'Boardroom',es:'Junta directiva',pt:'Diretoria',req:['crew',1],crew:true,pal:{P:'#c9ced8',V:'#9aa3b5',B:'#e6e9f0',N:'#9aa3b5',g:'#111111'},pat:kSuit({jacket:'#1b2a6b',shirt:'#ffffff',tie:'#ffd23f',pocket:'#ffd23f'}),addon:kShades},
 {id:'goat',en:'Cosmic GOAT',es:'GOAT cósmico',pt:'GOAT Cósmico',req:['win',1],myth:true,pal:{P:'#ffffff',V:'#ffd23f',B:'#ff7ac8',G:'#ffffff',g:'#ffd23f',E:'#4fd7ff',N:'#ff7ac8'},pat:kPat((x,y)=>['#ff7ac8','#ffb0e0','#ffd23f','#fff3a0','#7dff9a','#b0ffd0','#4fd7ff','#b0ecff','#b388ff','#e0d0ff'][(x+y*2)%10])},
 // Bring a mate (invite only): Frostbite for whoever invites a friend who plays, Inferno for the friend
 {id:'frost',en:'Frostbite',es:'Escarcha',pt:'Congelado',req:['ref',1],pal:{W:'#3c5a7a',L:'#2a4260',P:'#e8f6ff',V:'#9fd8ff',B:'#e8f6ff',G:'#ffffff',g:'#9fd8ff',E:'#e8f6ff',w:'#3c5a7a',N:'#9fd8ff'},pat:kPat((x,y)=>{const a=(x+y)%7===0&&y<21,b=(x-y+40)%9===0&&y<21;return a||b?'#e8f6ff':y>=21?'#2a4260':'#3c5a7a'})},
 {id:'inferno',en:'Inferno',es:'Infierno',pt:'Inferno',req:['refd',1],pal:{W:'#1a0d0a',L:'#0d0605',P:'#ff4a1c',V:'#ffb000',B:'#ff4a1c',G:'#ffb000',g:'#ff4a1c',E:'#ffb000',w:'#1a0d0a',N:'#ff4a1c'},pat:kPat((x,y)=>{const f=y+Math.sin(x*1.3)*2.2;return f>22?'#ffd23f':f>19?'#ff8a1f':f>16.5?'#e5361c':'#1a0d0a'})},
 // Halloween week 2026 (27 Oct - 2 Nov): earned only that week, yours forever after
 {id:'hw-stripes',en:'Pumpkin stripes',es:'Rayas calabaza',pt:'Listras de abóbora',req:['hw',1],until:'2026-11-02',pal:{P:'#1a1030',V:'#ff7a1a',B:'#1a1030',N:'#2fbf71'},pat:kPat((x,y)=>x%4<2?'#ff7a1a':'#1a1030')},
 {id:'hw-candy',en:'Candy corn',es:'Maíz dulce',pt:'Milho doce',req:['hw',3],until:'2026-11-02',pal:{P:'#ffffff',V:'#ff7a1a',B:'#ffd23f',N:'#ff7a1a'},pat:kPat((x,y)=>y<11?'#ffffff':y<18?'#ff7a1a':'#ffd23f')},
 {id:'hw-night',en:'Spooky night',es:'Noche de miedo',pt:'Noite assustadora',req:['hw',5],until:'2026-11-02',pal:{W:'#2b1a3a',L:'#1d1128',P:'#ff7a1a',V:'#7c3fb0',B:'#ff7a1a',w:'#2b1a3a',N:'#ff7a1a',E:'#7dff3b'},pat:kPat((x,y)=>(x*7+y*13)%29===0?'#ffd23f':(x*5+y*11)%23===0?'#ff7a1a':y<14?'#2b1a3a':'#1d1128')},
 {id:'hw-slime',en:'Toxic slime',es:'Baba tóxica',pt:'Gosma tóxica',req:['hwscr',2],until:'2026-11-02',pal:{W:'#7dff3b',L:'#4fbf1f',P:'#7c3fb0',V:'#4a1f6a',B:'#7c3fb0',w:'#7dff3b',N:'#7c3fb0',G:'#ffd23f'},pat:kPat((x,y)=>y<Math.sin(x*.9)*1.5+5?'#7c3fb0':'#7dff3b')},
 {id:'hw-skeleton',en:'Skeleton',es:'Esqueleto',pt:'Esqueleto',req:['hwhi',300],until:'2026-11-02',pal:{W:'#1a1030',L:'#000000',P:'#f3ead2',V:'#9a9a9a',B:'#f3ead2',w:'#1a1030',N:'#f3ead2',E:'#7dff3b'},pat:kPat((x,y)=>(y%3===0&&x>8&&x<24)||x===16?'#f3ead2':'#1a1030')},
 {id:'hw-lantern',en:"Jack-o'-lantern",es:'Calabaza',pt:'Abóbora',req:['hw31',1],until:'2026-10-31',pal:{W:'#ff7a1a',L:'#c4501c',P:'#1a1030',V:'#3a2a1a',B:'#1a1030',w:'#ff7a1a',N:'#2fbf71',G:'#2fbf71',g:'#1f8a4c'},pat:kPat((x,y)=>{const f=(y>=8&&y<=10)&&((x>=11&&x<=13)||(x>=19&&x<=21))||(y===15&&x>=11&&x<=21)||(y===16&&x>=12&&x<=20&&x%2===0);return f?'#ffd23f':(x%5===0?'#c4501c':'#ff7a1a')})},
 // Christmas 2026 (Reindeer is free and everyone's default for the season)
 {id:'xm-reindeer',en:'Reindeer',es:'Reno',pt:'Rena',req:null,until:XM_TO,pal:{W:'#8a5a3a',L:'#6b4428',P:'#3a2414',V:'#5a3a22',B:'#3a2414',w:'#8a5a3a',N:'#ff3b30'},addon:kAntler},
 {id:'xm-jumper',en:'Christmas jumper',es:'Jersey navideño',pt:'Suéter de Natal',req:['xm',1],until:XM_TO,pal:{P:'#ffffff',V:'#2f9a62',B:'#ffffff',N:'#ff3b30'},pat:kPat((x,y)=>{if(y===15||y===18)return'#ffffff';if(y===16||y===17)return(x+y)%3===0?'#2f9a62':'#ffffff';return(x*7+y*5)%17===0?'#ffffff':'#c8473b'})},
 {id:'xm-snowman',en:'Snowman',es:'Muñeco de nieve',pt:'Boneco de neve',req:['adv',10],until:XM_TO,pal:{P:'#e8f6ff',V:'#cfe6f5',B:'#ffffff',N:'#ff8a1f'},pat:kPat((x,y)=>(x===15&&(y===14||y===16||y===18))?'#1a1030':'#f4fbff'),addon:kSnowman},
 {id:'xm-santa',en:'Santa',es:'Papá Noel',pt:'Papai Noel',req:['adv',24],until:XM_TO,pal:{P:'#ffffff',V:'#f1f1f1',B:'#ffffff',N:'#ffb3a7',w:'#d62828'},pat:kPat((x,y)=>y>=19?'#ffffff':y===17?(x>=14&&x<=16?'#f2c230':'#1a1030'):'#d62828'),addon:kSantaHat},
 {id:'xm-star',en:'Golden star',es:'Estrella dorada',pt:'Estrela dourada',req:['xm25',1],until:XM_TO,pal:{W:'#ffe27a',L:'#e0b030',P:'#fff3a0',V:'#f2c230',B:'#ffffff',G:'#ffffff',g:'#f2c230',N:'#ff8a1f'},pat:kPat((x,y)=>(x*5+y*3)%13===0?'#ffffff':(x+y)%2?'#ffd84d':'#f2c230'),addon:kXStar},
 frostKit(4),
 {id:'xm-tree',en:'Christmas tree',es:'Árbol de Navidad',pt:'Árvore de Natal',req:['adv',17],until:XM_TO,pal:{P:'#1f6b46',V:'#174f34',B:'#2f9a62',N:'#ffd23f',G:'#ffd23f',g:'#e0a000'},pat:kPat((x,y)=>(x*7+y*5)%11===0?'#d62828':(x*3+y*11)%13===0?'#ffd23f':(x+y*2)%9===0?'#fff6c0':(y%3===0?'#1a5a3a':'#1f6b46')),addon:kTreeStar},
];
// kit clear-out (Nov 2026): fewer, rarer kits. Retired kits are gone for everyone (anyone wearing one is back in Club).
// Infinity takes Galaxy's look; Cosmic GOAT is no longer Mythic.
const KIT_GONE=new Set(['og','mud','candy','keeper','ref','quarters','night','fire','halves','pin','dots','toxic','hat3','perfect','glitch','aurora','lava','galaxy','rainbow','tiedye','chrome']);
{const g=KITS.find(k=>k.id==='galaxy'),s=KITS.find(k=>k.id==='shadow');if(g&&s){s.pal=g.pal;s.pat=g.pat}const goat=KITS.find(k=>k.id==='goat');if(goat)delete goat.myth;
 for(let i=KITS.length-1;i>=0;i--)if(KIT_GONE.has(KITS[i].id))KITS.splice(i,1)}

const CLUB={P:'#2b2b38',V:'#1d1a2b',v:'#14121e',B:'#2b2b38',N:'#d8cfb8'};
const kitColor=(c,x,y,kit)=>{if(x>=27&&y>=21)return PAL[c];if(!kit||kit.id==='classic')return CLUB[c]||PAL[c];if(kit.pat&&(c==='W'||c==='L'))return kit.pat(x,y,c==='L');return kit.pal[c]||PAL[c]};
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
