'use strict';
// ================= CORE =================
const W=320,H=224,HUD_H=18;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
function resize(){let s=Math.min(innerWidth/W,innerHeight/H);if(s>=1)s=Math.floor(s);cv.style.width=(W*s)+'px';cv.style.height=(H*s)+'px';}
addEventListener('resize',resize);resize();
function cvPos(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/(r.width||W),(e.clientY-r.top)*H/(r.height||H)];}
cv.addEventListener('mousemove',e=>{if(!ui||ui.type!=='menu')return;const [mx,my]=cvPos(e),all=ui.build(),top=Math.max(0,Math.min(ui.sel-Math.floor(MENU_ROWS/2),all.length-MENU_ROWS)),n=Math.min(MENU_ROWS,all.length),y=Math.round((H-(44+n*11))/2)+6;
  if(mx>=36&&mx<=284&&my>=y+27&&my<y+27+n*11)ui.sel=top+Math.floor((my-(y+27))/11);});
cv.addEventListener('wheel',e=>{if(!ui||ui.type!=='menu')return;e.preventDefault();const all=ui.build();ui.sel=(ui.sel+(e.deltaY>0?1:all.length-1))%all.length;sfx(440,0.03,'square',0.02);},{passive:false});
cv.addEventListener('click',e=>{cv.focus();if(AC&&AC.state==='suspended')AC.resume();
  if(scene==='title'){pressed['enter']=true;return;}
  if(!ui)return;if(ui.type==='dialog'){pressed['e']=true;return;}
  const [mx,my]=cvPos(e),all=ui.build(),top=Math.max(0,Math.min(ui.sel-Math.floor(MENU_ROWS/2),all.length-MENU_ROWS)),n=Math.min(MENU_ROWS,all.length),h=44+n*11,y=Math.round((H-h)/2)+6;
  if(mx<30||mx>290||my<y||my>y+h){ui=null;return;}
  if(my<y+27){if(top>0)ui.sel=Math.max(0,ui.sel-1);return;}
  if(my>=y+27+n*11){if(top+MENU_ROWS<all.length)ui.sel=Math.min(all.length-1,ui.sel+1);return;}
  const idx=top+Math.floor((my-(y+27))/11);if(idx>=0&&idx<all.length){ui.sel=idx;const o=all[idx];
    if(o.adj){const lt=o.label.indexOf('<'),gt=o.label.indexOf('>');if(lt>0&&mx>=48+lt*4-4&&mx<=48+lt*4+6){o.adj(-1);sfx(440,0.03,'square',0.02);return;}if(gt>lt&&mx>=48+gt*4-2&&mx<=48+gt*4+8){o.adj(1);sfx(440,0.03,'square',0.02);return;}}
    pressed['e']=true;}});
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=(a,b)=>a+Math.random()*(b-a);
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g];}
function px(g,x,y,col){g.fillStyle=col;g.fillRect(x|0,y|0,1,1);}
function rect(g,x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y,w,h);}
function flip(c){const [o,g]=mk(c.width,c.height);g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);return o;}
const tintCache=new Map();
function tinted(c,col){let m=tintCache.get(c);if(!m){m={};tintCache.set(c,m);}if(!m[col]){const [o,g]=mk(c.width,c.height);g.drawImage(c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);m[col]=o;}return m[col];}

// ================= AUDIO =================
let AC=null;
function sfx(f,d=0.08,type='square',v=0.05,slide=0){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+0.02);}catch(e){}}

// ================= INPUT =================
const keys={},pressed={};
addEventListener('keydown',e=>{if(AC&&AC.state==='suspended')AC.resume();const k=e.key.toLowerCase();if(!keys[k])pressed[k]=true;keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright','tab'].includes(k))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const kd=(...ks)=>ks.some(k=>keys[k]);
const kp=(...ks)=>ks.some(k=>pressed[k]);

// ================= PIXEL FONT 3x5 =================
const FONT={A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],K:[5,5,6,5,5],L:[4,4,4,4,7],M:[5,7,5,5,5],N:[6,5,5,5,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,6,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],Y:[5,5,2,2,2],Z:[7,1,2,4,7],
'0':[7,5,5,5,7],'1':[2,6,2,2,7],'2':[6,1,2,4,7],'3':[6,1,2,1,6],'4':[5,5,7,1,1],'5':[7,4,6,1,6],'6':[3,4,7,5,7],'7':[7,1,2,2,2],'8':[7,5,7,5,7],'9':[7,5,7,1,6],
'.':[0,0,0,0,2],',':[0,0,0,2,4],'!':[2,2,2,0,2],'?':[6,1,2,0,2],':':[0,2,0,2,0],'-':[0,0,7,0,0],'+':[0,2,7,2,0],'/':[1,1,2,4,4],"'":[2,2,0,0,0],'(':[1,2,2,2,1],')':[4,2,2,2,4],'>':[4,2,1,2,4],'<':[1,2,4,2,1],'=':[0,7,0,7,0],'%':[5,1,2,4,5],'$':[3,6,2,3,6],'*':[0,5,2,5,0],'"':[5,5,0,0,0],'#':[5,7,5,7,5],'^':[2,5,0,0,0],'[':[3,2,2,2,3],']':[6,2,2,2,6],'&':[2,5,2,5,3],';':[0,2,0,2,4],'~':[0,0,3,6,0]}; // D-112: & ; ~ added // D-103: brackets were blank in every menu label
function textRaw(s,x,y,col,sc){ctx.fillStyle=col;let cx=x;for(const ch of s){const gl=FONT[ch];if(gl){for(let r=0;r<5;r++){const b=gl[r];for(let c=0;c<3;c++)if(b&(4>>c))ctx.fillRect(cx+c*sc,y+r*sc,sc,sc);}}cx+=4*sc;}}
function text(s,x,y,col='#fff',sc=1,shadow='#000'){s=String(s).toUpperCase().replace(/[—–]/g,'-').replace(/≈/g,'~');x=Math.round(x);y=Math.round(y);if(shadow)textRaw(s,x+sc,y+sc,shadow,sc);textRaw(s,x,y,col,sc);}
function textC(s,cx,y,col,sc=1,shadow='#000'){s=String(s);text(s,cx-(s.length*4*sc-sc)/2,y,col,sc,shadow);}
function wrap(s,n){const out=[];let line='';for(const w of s.split(' ')){if((line+' '+w).trim().length>n){out.push(line.trim());line=w;}else line+=' '+w;}if(line.trim())out.push(line.trim());return out;}

// ================= CHARACTER SPRITES =================
const HEAD={
dog:{down:["...OO......OO...","..OFFO....OFFO..","..OFPFOOOOFPFO..",".OFFFFFFFFFFFFO.",".OFCFFFFFFFFCFO.",".OFFEFCCCCFEFFO.",".OFCCCCNNCCCCFO.","..OCCCCCCCCCCO..","...OCCCCCCCCO...","....OOOOOOOO...."],
     up:["...OO......OO...","..OFFO....OFFO..","..OFFFOOOOFFFO..",".OFFFFFFFFFFFFO.",".OFFFFFFFFFFFFO.",".OFFFFFFFFFFFFO.",".OFFFFFFFFFFFFO.","..OFFFFFFFFFFO..","...OFFFFFFFFO...","....OOOOOOOO...."],
     right:["...OO....OO.....","..OFFO..OFFO....","..OFPFOOOFPFO...",".OFFFFFFFFFFFO..",".OFFCFFFFFCFFFO.",".OFFEWFFFFEWCFO.",".OCCCCCFFCCCCNNO",".OCCCCCCCCCOOCO.","..OCCCCCCCCCO...","...OOOOOOOOO...."]},
cat:{down:["..O..........O..","..OO........OO..","..OFO......OFO..",".OFPFOOOOOOFPFO.",".OFFFFFFFFFFFFO.",".OFRRFFFFFFRRFO.","WOFFFFFNNFFFFFOW",".OFFFCCCCCCFFFO.","W.OFFCCCCCCFFO.W","...OOOOOOOOOO..."],
     up:["..O..........O..","..OO........OO..","..OFO......OFO..",".OFFFOOOOOOFFFO.",".OFFFFFFFFFFFFO.",".OFFFFFFFFFFFFO.",".OFFFFFFFFFFFFO.",".OFFFFFFFFFFFFO.","..OFFFFFFFFFFO..","...OOOOOOOOOO..."],
     right:[".....O..........",".....OO.........","....OFPO........","...OFFFFOO......","..OFFFFFFFFO....","..OFFFFFFRFFO...","..OFFFFFFFFNO...","..OFFFFCCCCFOW..","...OFFCCCCOO.W..","....OOOOOO......"]}
};
const TOP={down:["...OTTTTTTTTO...","..OFTTTTTTTTFO..","..OFTTTAATTTFO..","..OCOBBBBBBOCO..","...OTTTTTTTTO..."],
           up:["...OTTTTTTTTO...","..OFTTTKKTTTFO..","..OFTTKOOKTTFO..","..OCOBBBBBBOCO..","...OTTTTTTTTO..."],
           right:["....OTTTTTO.....","OKKOTTTTTTO.....","OKOOTTFFTTO.....",".O.OBBBCBBO.....","...OTTTTTTO....."]};
const LEGS={front:[["....OLLOOLLO....","....OLLOOLLO....","....OOO..OOO...."],["....OLLOOLLO....","....OOOOOLLO....",".........OOO...."],["....OLLOOLLO....","....OLLOOOOO....","....OOO........."]],
            side:[["....OLLLLO......","....OLLLLO......","....OOOOOO......"],["...OLLOOLLO.....","..OLLO..OLLO....","..OOO....OOO...."]]};
function buildChar(def){
  const out={};
  for(const dir of ['down','up','right']){
    const legs=dir==='right'?LEGS.side:LEGS.front;
    out[dir]=legs.map((lg,fi)=>{const [c,g]=mk(16,20);
      const rows=[...HEAD[def.head][dir],...TOP[dir],...lg];
      rows.forEach((row,y)=>{for(let x=0;x<16;x++){const ch=row[x];if(ch!=='.'){const col=def.pal[ch];if(col)px(g,x,y+2,col);}}});
      if(def.acc)def.acc(g,dir,fi);return c;});
  }
  out.left=out.right.map(flip);
  return out;
}
const basePal={O:'#1a0e08',E:'#140c0c',N:'#140c0c',P:'#f0a0a0',W:'#e8e8f0',R:'#ff3030'};
const SPR={};
SPR.hero=buildChar({head:'dog',pal:{...basePal,F:'#e8922c',C:'#fbe8c4',K:'#fbe8c4',T:'#6a4a2a',A:'#fbe8c4',B:'#b08a50',L:'#2856a8'},
  acc(g,d){// sleepy half-closed eyes: overwrite top half of eye pixels with fur
    if(d==='down'){px(g,5,7,'#e8922c');px(g,10,7,'#e8922c');}
    else if(d==='right'){px(g,11,7,'#e8922c');}
    // barrel hammer on right shoulder
    const H='#7a4a1a',Hd='#5a3414',Bb='#c09060',Bl='#a07040';
    if(d==='down'){rect(g,12,3,3,4,Bb);rect(g,12,3,3,1,Bl);px(g,13,7,H);px(g,13,8,H);px(g,13,9,H);px(g,13,10,H);px(g,13,11,H);}
    else if(d==='right'){rect(g,11,2,4,4,Bb);rect(g,11,2,4,1,Bl);px(g,12,6,H);px(g,12,7,H);px(g,12,8,H);px(g,12,9,H);}
    else{px(g,4,5,H);px(g,4,6,H);px(g,4,7,H);px(g,4,8,H);rect(g,3,1,3,4,Bb);rect(g,3,1,3,1,Bl);}}});
SPR.merchant=buildChar({head:'dog',pal:{...basePal,F:'#c97a2a',C:'#f4dcb0',K:'#f4dcb0',T:'#2856a8',A:'#204898',B:'#6a5030',L:'#204898'},
  acc(g,d){const Gg='#d0d0d0',Gl='#60e0e0',Wr='#a0a0a8',Wh='#808088';
    // goggles on forehead
    if(d==='down'){rect(g,3,4,4,2,Gg);px(g,5,4,Gl);px(g,5,5,Gl);rect(g,9,4,4,2,Gg);px(g,11,4,Gl);px(g,11,5,Gl);rect(g,7,4,2,1,Gg);
      // wrench in right hand
      rect(g,13,12,2,6,Wr);rect(g,12,12,1,2,Wh);rect(g,15,12,1,2,Wh);}
    else if(d==='right'){rect(g,9,4,4,2,Gg);px(g,11,4,Gl);px(g,11,5,Gl);
      rect(g,13,12,2,6,Wr);rect(g,12,12,1,2,Wh);rect(g,15,12,1,2,Wh);}
    else{rect(g,3,4,4,2,Gg);px(g,4,4,Gl);px(g,4,5,Gl);rect(g,9,4,4,2,Gg);px(g,10,4,Gl);px(g,10,5,Gl);rect(g,7,4,2,1,Gg);}}});
SPR.bank=buildChar({head:'dog',pal:{...basePal,F:'#e8c030',C:'#fff0a0',K:'#e8c030',T:'#2050a8',A:'#f0c030',B:'#f0c030',L:'#e8c030'},
  acc(g,d){const G='#f0c030',Bl='#2050a8',Gem='#40c8ff';
    // striped headdress (nemes) flowing down sides
    if(d==='down'){rect(g,3,2,10,4,G);for(let i=0;i<4;i++)rect(g,3,2+i,10,1,i%2?Bl:G);px(g,7,3,Gem);px(g,8,3,Gem);
      rect(g,1,6,3,12,G);rect(g,12,6,3,12,Bl);for(let y=6;y<18;y++){px(g,1+(y%2),y,y%2?G:Bl);px(g,12+(y%2),y,y%2?Bl:G);}}
    else if(d==='right'){rect(g,6,2,8,4,G);for(let i=0;i<4;i++)rect(g,6,2+i,8,1,i%2?Bl:G);px(g,10,3,Gem);
      rect(g,12,6,3,12,G);for(let y=6;y<18;y++)px(g,12+(y%2),y,y%2?G:Bl);}
    else{rect(g,3,2,10,4,G);for(let i=0;i<4;i++)rect(g,3,2+i,10,1,i%2?Bl:G);
      rect(g,1,6,3,12,Bl);rect(g,12,6,3,12,G);for(let y=6;y<18;y++){px(g,1+(y%2),y,y%2?Bl:G);px(g,12+(y%2),y,y%2?G:Bl);}}}});
// ---- Phase 4 partner NPCs (D-024), drawn in code from the user's reference images in docs/art/ ----
// Cloverheart (ReLotto): doge-orange shiba, green hooded robe, glowing clover emblem + clover staff
SPR.clover=buildChar({head:'dog',pal:{...basePal,F:'#e8922c',C:'#fbe8c4',K:'#fbe8c4',T:'#2e8b3e',A:'#9cff7a',B:'#6a4a20',L:'#1e5a28'},
  acc(g,d){const Hd='#1e5a28',Hl='#2e8b3e',St='#6a4a20',Cl='#48d848',Cg='#c8ffb8';
    // four-leaf clover head with a soft glow: leaves at the 4 diagonals, bright heart in the middle
    const staff=x=>{rect(g,x,5,1,14,St);for(const [dx,dy] of [[-1,0],[1,0],[-1,2],[1,2]])px(g,x+dx,dy+1,Cl);px(g,x,1,'#7cf07c');px(g,x,3,'#7cf07c');px(g,x-1,2,'#7cf07c');px(g,x+1,2,'#7cf07c');px(g,x,2,Cg);px(g,x,4,St);};
    if(d==='down'){rect(g,1,6,2,8,Hd);rect(g,13,6,2,8,Hd);px(g,2,5,Hl);px(g,13,5,Hl);staff(14);}
    else if(d==='right'){rect(g,2,6,2,8,Hd);px(g,3,5,Hl);staff(13);}
    else{rect(g,1,4,14,4,Hd);rect(g,2,3,12,1,Hl);staff(1);}}});
// a non-humanoid NPC: one 16x20 canvas used for every direction / frame (the NPC draw adds a gentle bob)
function staticSpr(draw){const [c,g]=mk(16,20);draw(g);const f=[c,c,c];return {down:f,up:f,right:f,left:f};}
// Noah (trynoah.ai): floating AI cube "MODEL N-01" with a holographic brain on top
SPR.noah=staticSpr(g=>{const O='#0e1a24';
  rect(g,5,0,6,3,'#9fd8ff');px(g,6,0,'#e0f4ff');px(g,9,1,'#e0f4ff');px(g,7,2,'#5ab0e8');px(g,8,1,'#5ab0e8'); // brain hologram
  rect(g,1,4,14,13,O);rect(g,2,5,12,2,'#3a6474');rect(g,2,7,12,9,'#24404e');           // cube: top face + body
  for(let y=8;y<15;y++)rect(g,4,y,8,1,y<10?'#f8d878':y<12?'#d8e8a8':'#9fd0ff');           // yellow -> blue screen
  for(let y=9;y<14;y++){px(g,5,y,O);px(g,10,y,O);}px(g,6,10,O);px(g,7,11,O);px(g,8,12,O);px(g,9,13,O); // the N
  rect(g,2,7,1,9,'#40e0ff');rect(g,13,7,1,9,'#ffd040');                                   // edge lights
});
// Bitget Wallet card: navy card body, cyan chevron, chip, eyes, little legs
SPR.bitget=staticSpr(g=>{const O='#000c12',N='#00202c',Ln='#0b3a4a',Cy='#00f0ff';
  rect(g,1,1,14,16,O);rect(g,2,2,12,14,N);for(let y=3;y<15;y+=3)rect(g,2,y,12,1,Ln);
  rect(g,3,3,3,2,'#c8c8c8');px(g,4,3,'#909090');                                          // chip
  px(g,9,4,'#fff');px(g,12,4,'#fff');px(g,9,5,O);px(g,12,5,O);                              // eyes
  for(let i=0;i<4;i++){px(g,5+i,7+i,Cy);px(g,6+i,7+i,Cy);px(g,5+i,13-i,Cy);px(g,6+i,13-i,Cy);} // chevron >
  rect(g,4,17,2,3,O);rect(g,10,17,2,3,O);
});
SPR.sage=buildChar({head:'dog',pal:{...basePal,F:'#a09890',C:'#d0ccc4',K:'#d0ccc4',T:'#c4a878',A:'#a08860',B:'#7a5a2a',L:'#3a3430',E:'#3a3030'},
  acc(g,d){const Wh='#e8e8e0',Gl='#c0e0ff',Gf='#4080a0',Cn='#7a4a1a';
    // white beard
    if(d==='down'){rect(g,5,11,6,2,Wh);rect(g,6,13,4,2,Wh);rect(g,7,15,2,1,Wh);
      // round glasses
      rect(g,3,7,3,2,Gl);px(g,4,7,Gf);rect(g,10,7,3,2,Gl);px(g,11,7,Gf);rect(g,6,7,4,1,Gf);
      // cane
      rect(g,14,5,1,15,Cn);rect(g,13,4,3,2,Cn);}
    else if(d==='right'){rect(g,9,11,5,2,Wh);rect(g,10,13,3,2,Wh);
      rect(g,11,7,3,2,Gl);px(g,12,7,Gf);
      rect(g,14,5,1,15,Cn);rect(g,13,4,3,2,Cn);}
    else{rect(g,1,5,1,15,Cn);rect(g,0,4,3,2,Cn);}}});
// ---- Phase 5 faction trainers (D-028): one Shibe per class, standing in the safe camp ----
// Warrior (Demolition Dogs): crimson tabard, steel pauldron, red headband
SPR.tWarrior=buildChar({head:'dog',pal:{...basePal,F:'#e8922c',C:'#fbe8c4',K:'#fbe8c4',T:'#8a1f24',A:'#d84038',B:'#4a4a54',L:'#5a1418'},
  acc(g,d){const St='#b8bcc8',Sd='#787c88',Rb='#e02828';
    rect(g,4,3,8,1,Rb); // red headband across the brow
    if(d==='down'){rect(g,10,6,5,3,St);rect(g,10,6,5,1,Sd);rect(g,12,9,2,2,Sd);}       // right steel pauldron
    else if(d==='right'){rect(g,10,5,5,3,St);rect(g,10,5,5,1,Sd);}
    else{rect(g,1,6,5,3,St);rect(g,1,6,5,1,Sd);}}});
// Archer (Kernel Crew): forest hood + cloak, a bow slung at the side
SPR.tArcher=buildChar({head:'dog',pal:{...basePal,F:'#e8922c',C:'#fbe8c4',K:'#fbe8c4',T:'#1f5a34',A:'#49b86a',B:'#3a2a18',L:'#153f24'},
  acc(g,d){const Hd='#17432a',Hl='#2a7a46',Bw='#caa060';
    if(d==='down'){rect(g,2,2,12,3,Hd);rect(g,3,1,10,1,Hl);px(g,4,3,'#0e2a1a');px(g,11,3,'#0e2a1a');
      for(let y=4;y<15;y++)px(g,0,y,Bw);px(g,1,4,Bw);px(g,1,14,Bw);}                      // bow at the left
    else if(d==='right'){rect(g,3,2,11,3,Hd);rect(g,4,1,8,1,Hl);for(let y=5;y<14;y++)px(g,2,y,Bw);}
    else{rect(g,2,2,12,3,Hd);rect(g,3,1,10,1,Hl);for(let y=4;y<15;y++)px(g,15,y,Bw);}}});
// Healer (Barkitects): white-blue robe, a soft halo and a mender's staff
SPR.tHealer=buildChar({head:'dog',pal:{...basePal,F:'#e8922c',C:'#fbe8c4',K:'#fbe8c4',T:'#e8edf4',A:'#4aa8e0',B:'#b0c0d0',L:'#9fb4c8'},
  acc(g,d){const St='#d0dae8',Gl='#9ff0ff',Pl='#50e0b0';
    const staff=x=>{rect(g,x,4,1,15,St);px(g,x-1,3,Pl);px(g,x+1,3,Pl);px(g,x,2,Pl);px(g,x,4,Pl);px(g,x,3,'#d8fff0');};
    if(d==='down'){px(g,7,1,Gl);px(g,8,1,Gl);px(g,6,2,Gl);px(g,9,2,Gl);staff(14);}        // halo + staff
    else if(d==='right'){px(g,7,1,Gl);px(g,8,1,Gl);staff(13);}
    else{px(g,7,1,Gl);px(g,8,1,Gl);staff(1);}}});
const catPal={O:'#120c16',E:'#120c16',N:'#e06080',P:'#e08090',W:'#e0e0e8',R:'#ff3030'};
SPR.alley=buildChar({head:'cat',pal:{...catPal,F:'#7a7a8e',C:'#c8c8d6',K:'#7a7a8e',T:'#8a2828',A:'#d0d0d0',B:'#3a2a2a',L:'#2a2a30'},
  acc(g,d){if(d==='down'){rect(g,13,13,1,4,'#d8e0f0');px(g,13,12,'#6a4a2a');}else if(d==='right'){rect(g,11,14,4,1,'#d8e0f0');px(g,10,14,'#6a4a2a');}}});
SPR.archer=buildChar({head:'cat',pal:{...catPal,F:'#2c2c38',C:'#62627a',K:'#2c2c38',T:'#2e6a3a',A:'#c0a040',B:'#5a3a1a',L:'#1e1e26',R:'#ffd020'},
  acc(g,d){const B='#9a6a2a';if(d==='down'){for(const [x,y] of [[13,10],[14,11],[14,12],[14,13],[14,14],[14,15],[13,16]])px(g,x,y,B);rect(g,12,11,1,5,'#e8e8e8');}
    else if(d==='right'){for(const [x,y] of [[13,10],[14,11],[14,12],[14,13],[14,14],[14,15],[13,16]])px(g,x,y,B);rect(g,12,11,1,5,'#e8e8e8');}
    else{for(let i=0;i<7;i++)px(g,4+i,11+i,B);}}});
SPR.brute=buildChar({head:'cat',pal:{...catPal,F:'#d0782a',C:'#f0c890',K:'#d0782a',T:'#5a6270',A:'#a8b0c0',B:'#30343c',L:'#2a2a30'},
  acc(g,d){const M='#8890a0',Hi='#c0c8d8',Bn='#f0e8d0';if(d==='right'){rect(g,3,4,9,2,M);rect(g,4,4,7,1,Hi);rect(g,3,2,2,2,Bn);}
    else{rect(g,2,4,12,2,M);rect(g,3,4,10,1,Hi);rect(g,0,2,2,2,Bn);rect(g,14,2,2,2,Bn);px(g,2,12,Hi);px(g,13,12,Hi);}}});
SPR.boss=buildChar({head:'cat',pal:{...catPal,F:'#ececf4',C:'#ffffff',K:'#ececf4',T:'#6a2a9a',A:'#f0c030',B:'#f0c030',L:'#2a1a3a',R:'#ff2050'},
  acc(g,d){const G='#f0c030';const crown=(x)=>{rect(g,x,2,8,3,G);px(g,x,1,G);px(g,x+3,1,G);px(g,x+4,1,G);px(g,x+7,1,G);px(g,x+2,3,'#e02040');px(g,x+5,3,'#3070f0');};
    if(d==='up'){rect(g,3,12,10,8,'#3a1050');rect(g,4,12,8,7,'#6a2a9a');crown(4);}
    else if(d==='right'){rect(g,0,12,4,8,'#3a1050');crown(5);}
    else{rect(g,1,12,2,8,'#3a1050');rect(g,13,12,2,8,'#3a1050');crown(4);}}});
// frog mage: teal skin, lily-pad hat, green cloak, purple orb staff
SPR.frog=buildChar({head:'cat',pal:{...catPal,O:'#0a2020',F:'#28a088',C:'#60d0a8',K:'#28a088',T:'#1a6838',A:'#28803a',B:'#2a5030',L:'#1a4828',N:'#28a088',R:'#e0e040',E:'#0a2020',P:'#60d0a8',W:'#60d0a8'},
  acc(g,d){// yellow spots
    if(d==='down'){px(g,4,4,'#e0d040');px(g,11,5,'#e0d040');px(g,6,8,'#e0d040');}
    // lily pad hat
    const Lp='#2a8a3a',Ld='#1a6a2a';
    if(d==='down'||d==='up'){rect(g,2,2,12,3,Lp);rect(g,3,2,10,1,Ld);rect(g,4,4,8,1,Ld);}
    else{rect(g,4,2,10,3,Lp);rect(g,5,2,8,1,Ld);}
    // purple orb staff
    const St='#6a4a2a',Ob='#a040e0',Oh='#d080ff';
    if(d==='down'){rect(g,13,10,1,10,St);rect(g,12,8,3,3,Ob);px(g,13,9,Oh);}
    else if(d==='right'){rect(g,13,10,1,10,St);rect(g,12,8,3,3,Ob);px(g,13,9,Oh);}
    else{rect(g,2,10,1,10,St);rect(g,1,8,3,3,Ob);px(g,2,9,Oh);}}});
// ninja shiba: dark orange fur, black gi, red scarf, twin daggers
SPR.ninja=buildChar({head:'dog',pal:{...basePal,F:'#c06820',C:'#f0b870',K:'#c06820',T:'#1a1a1a',A:'#1a1a1a',B:'#c02020',L:'#1a1a1a'},
  acc(g,d){const Sc='#d03030',Dg='#c0c8d0',Dh='#808890';
    // red scarf trailing
    if(d==='down'){rect(g,5,9,6,1,Sc);rect(g,4,10,2,3,Sc);rect(g,10,10,2,3,Sc);}
    else if(d==='right'){rect(g,0,9,5,1,Sc);rect(g,0,10,3,2,Sc);}
    else{rect(g,5,9,6,1,Sc);rect(g,11,10,3,2,Sc);}
    // twin daggers
    if(d==='down'){px(g,2,14,Dg);px(g,1,15,Dg);px(g,13,14,Dg);px(g,14,15,Dg);}
    else if(d==='right'){rect(g,12,13,3,1,Dg);px(g,14,12,Dh);}
    else{px(g,2,14,Dg);px(g,13,14,Dg);}
    // angry eyes (fangs)
    if(d==='down'){px(g,6,10,'#fff');px(g,9,10,'#fff');}}});
// green candle bull: dark hide, green horns, red eyes, spiked collar
SPR.bull=buildChar({head:'cat',pal:{...catPal,O:'#0a0a0a',F:'#2a2a30',C:'#4a4a54',K:'#2a2a30',T:'#1a3a1a',A:'#2a5a2a',B:'#4a4a4a',L:'#1a1a20',R:'#ff2020',E:'#ff2020',N:'#2a2a30',P:'#3a3a44',W:'#2a2a30'},
  acc(g,d){const Hn1='#30c040',Hn2='#e09020',Sp='#808080',Cl='#a03030';
    // gradient horns (green base -> orange tip)
    if(d==='down'){rect(g,1,2,3,2,Hn1);px(g,1,1,Hn2);px(g,2,0,Hn2);rect(g,12,2,3,2,Hn1);px(g,14,1,Hn2);px(g,13,0,Hn2);}
    else if(d==='right'){rect(g,10,2,3,2,Hn1);px(g,12,1,Hn2);px(g,11,0,Hn2);}
    else{rect(g,3,2,3,2,Hn1);px(g,3,1,Hn2);px(g,4,0,Hn2);rect(g,10,2,3,2,Hn1);px(g,12,1,Hn2);px(g,11,0,Hn2);}
    // spiked collar
    if(d==='down'||d==='up'){rect(g,3,10,10,1,Cl);for(let x=4;x<13;x+=2)px(g,x,9,Sp);}
    else{rect(g,5,10,8,1,Cl);for(let x=6;x<13;x+=2)px(g,x,9,Sp);}
    // iron bracers
    rect(g,d==='right'?2:1,15,3,2,'#606068');rect(g,d==='right'?10:11,15,3,2,'#606068');}});
// blue-tunic shiba knight: red headband, blue tunic with crown, sword
SPR.knight=buildChar({head:'dog',pal:{...basePal,F:'#d09030',C:'#f8d8a0',K:'#f8d8a0',T:'#2050b0',A:'#f0c030',B:'#5a3a1a',L:'#3a2820'},
  acc(g,d){const Hb='#d02020',Sw='#c8d0d8',Sh='#808890';
    // red headband
    if(d==='down'||d==='up')rect(g,2,5,12,1,Hb);
    else rect(g,4,5,10,1,Hb);
    // crown emblem on tunic
    if(d==='down'){px(g,7,12,'#f0c030');px(g,8,12,'#f0c030');px(g,7,11,'#f0c030');}
    // sword
    if(d==='down'){rect(g,14,11,1,7,Sw);px(g,14,10,Sh);px(g,13,11,'#8a6a2a');px(g,15,11,'#8a6a2a');}
    else if(d==='right'){rect(g,13,11,1,7,Sw);px(g,13,10,Sh);px(g,12,11,'#8a6a2a');px(g,14,11,'#8a6a2a');}
    else{rect(g,2,11,1,7,Sw);px(g,2,10,Sh);px(g,1,11,'#8a6a2a');px(g,3,11,'#8a6a2a');}}});

// small icons
const [SHADOW,sg]=mk(12,4);rect(sg,2,0,8,1,'rgba(0,0,0,.35)');rect(sg,0,1,12,2,'rgba(0,0,0,.35)');rect(sg,2,3,8,1,'rgba(0,0,0,.35)');
const [COIN,cg]=mk(7,7);rect(cg,2,0,3,1,'#7a5010');rect(cg,1,1,5,5,'#f0c030');rect(cg,0,2,1,3,'#7a5010');rect(cg,6,2,1,3,'#7a5010');rect(cg,2,6,3,1,'#7a5010');px(cg,1,1,'#7a5010');px(cg,5,1,'#7a5010');px(cg,1,5,'#7a5010');px(cg,5,5,'#7a5010');for(const [x,y] of [[2,1],[3,1],[2,2],[4,2],[1,3],[2,3],[3,3],[4,3],[2,4],[4,4],[2,5],[3,5]])px(cg,x,y,'#7a5010'); // Ð coin
const [WHISK,wg]=mk(9,7);for(let i=0;i<9;i++){px(wg,i,1+((i>6)?1:0),'#e8e8f0');px(wg,i,3,'#d0d0dc');px(wg,i,5-((i>6)?1:0),'#e8e8f0');}rect(wg,0,1,2,5,'#8a8a9c');
const [YARN,yg]=mk(9,9);for(let y=0;y<9;y++)for(let x=0;x<9;x++){const d=Math.hypot(x-4,y-4);if(d<4.5)px(yg,x,y,d>3.6?'#7a5010':((x+y)%3===0?'#fff0a0':'#f0c030'));}
// material drop icons
const [ORB_IC,og]=mk(7,7);for(let y=0;y<7;y++)for(let x=0;x<7;x++){const d=Math.hypot(x-3,y-3);if(d<3.5)px(og,x,y,d<1.5?'#d080ff':d<2.5?'#a040e0':'#6020a0');}
const [SCRAP_IC,scg]=mk(7,7);rect(scg,1,1,5,5,'#808890');rect(scg,2,2,3,3,'#c0c8d0');px(scg,3,0,'#606068');px(scg,0,3,'#606068');px(scg,6,3,'#606068');px(scg,3,6,'#606068');
const [HORN_IC,hig]=mk(7,7);rect(hig,2,0,3,7,'#30c040');rect(hig,3,0,1,3,'#e09020');px(hig,1,5,'#30c040');px(hig,5,5,'#30c040');
const [STEEL_IC,sti]=mk(7,7);rect(sti,1,1,5,5,'#a0a8b0');rect(sti,2,2,3,3,'#d0d8e0');px(sti,3,0,'#707880');px(sti,3,6,'#707880');
const [FISH_IC,fig]=mk(9,7);rect(fig,2,1,5,5,'#80c0e0');rect(fig,3,2,3,3,'#a0d8f0');px(fig,1,2,'#80c0e0');px(fig,1,4,'#80c0e0');px(fig,7,3,'#80c0e0');px(fig,0,3,'#60a0b8');px(fig,8,2,'#60a0b8');px(fig,8,4,'#60a0b8');px(fig,4,2,'#204060');
const [CFISH_IC,cfg2]=mk(9,7);rect(cfg2,2,1,5,5,'#f0a040');rect(cfg2,3,2,3,3,'#f8c060');px(cfg2,1,2,'#f0a040');px(cfg2,1,4,'#f0a040');px(cfg2,7,3,'#f0a040');px(cfg2,0,3,'#c08030');px(cfg2,8,2,'#c08030');px(cfg2,8,4,'#c08030');px(cfg2,4,2,'#604020');
const MAT_ICONS={steel:STEEL_IC};
function makeBone(vert){const [c,g]=mk(9,9);const P=(x,y,col)=>vert?px(g,y,x,col):px(g,x,y,col);for(let x=1;x<7;x++)P(x,4,'#f4f4f4');for(const x of [2,4])for(const y of [2,3,5,6])P(x,y,'#dcdcdc');P(7,3,'#f4f4f4');P(7,4,'#f4f4f4');P(7,5,'#f4f4f4');P(8,4,'#f4f4f4');P(0,3,'#dcdcdc');P(0,5,'#dcdcdc');P(7,4,'#202020');return c;}
const BONE=[makeBone(false),makeBone(true)];

// ================= TILES =================
const T={GRASS:0,FLOWER:1,TALL:2,DIRT:3,STONE:4,WATER:5,TREE:6,ROCK:7,FENCE:8,WALL:9,DFLOOR:10,GATE:11,TENT:12,FIRE:13,BUSH:14,DOOR:15,CRYSTAL:16,PAD:17};
const SOLID=new Set([T.WATER,T.TREE,T.ROCK,T.FENCE,T.WALL,T.GATE,T.TENT,T.FIRE,T.BUSH,T.DOOR,T.CRYSTAL]);
function plaza(g){rect(g,0,0,16,16,'#b4b0a4');rect(g,0,15,16,1,'#8a867c');rect(g,15,0,1,16,'#8a867c');rect(g,0,0,15,1,'#ccc8bc');rect(g,0,0,1,15,'#c4c0b4');}
function grassBase(g,seed){const r=mulberry(seed);rect(g,0,0,16,16,'#58b040');for(let i=0;i<16;i++)px(g,r()*16,r()*16,'#479a35');for(let i=0;i<7;i++)px(g,r()*16,r()*16,'#76cc56');for(let i=0;i<2;i++){const x=1+r()*12|0,y=2+r()*12|0;px(g,x,y,'#3a8a2c');px(g,x+2,y,'#3a8a2c');px(g,x+1,y+1,'#3a8a2c');}}
function blob(g,cx,cy,rx,ry,cols,seed){const r=mulberry(seed);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,d=Math.sqrt(dx*dx+dy*dy);if(d<1){let c=cols[2];if(d>1-1.2/Math.min(rx,ry))c=cols[0];else{const l=(-dx-dy);if(l>0.55)c=cols[3];else if(l<-0.5)c=cols[1];if(r()<0.13)c=cols[1];if(r()<0.05)c=cols[3];}px(g,x,y,c);}}}
function tile(fn){const [c,g]=mk(16,16);fn(g);return c;}
const TL={
 grass:[1,2,3].map(s=>tile(g=>grassBase(g,s*91))),
 flower:[4,5].map(s=>tile(g=>{grassBase(g,s*77);const r=mulberry(s*13);for(let i=0;i<3;i++){const x=2+r()*11|0,y=2+r()*11|0,pc=['#ffffff','#f86868','#f8a8f0','#a0c8ff'][r()*4|0];px(g,x-1,y,pc);px(g,x+1,y,pc);px(g,x,y-1,pc);px(g,x,y+1,pc);px(g,x,y,'#f8e040');}})),
 tall:[6,7].map(s=>tile(g=>{grassBase(g,s*55);const r=mulberry(s*31);for(let i=0;i<7;i++){const x=1+r()*14|0,h=3+r()*4|0;rect(g,x,14-h,1,h,'#2e7826');px(g,x,13-h,'#6cc04c');}})),
 dirt:[8,9].map(s=>tile(g=>{const r=mulberry(s*17);rect(g,0,0,16,16,'#c89c5e');for(let i=0;i<14;i++)px(g,r()*16,r()*16,'#ac844a');for(let i=0;i<8;i++)px(g,r()*16,r()*16,'#dcbc7c');const x=r()*13|0,y=r()*13|0;rect(g,x,y,2,2,'#9a7444');px(g,x,y,'#e8d0a0');})),
 stone:[tile(plaza)],
 door:tile(g=>{grassBase(g,35);rect(g,3,0,10,16,'#4a2c10');rect(g,4,1,8,14,'#9a6a34');for(const x of [6,9])rect(g,x,1,1,14,'#6a4418');rect(g,4,4,8,1,'#5a3414');rect(g,4,11,8,1,'#5a3414');}),
 crystal:tile(g=>{plaza(g);rect(g,4,13,8,2,'rgba(0,0,0,.25)');rect(g,5,4,6,10,'#7a5010');rect(g,6,3,4,11,'#f0c030');rect(g,6,4,2,9,'#fff0a0');px(g,7,2,'#7a5010');px(g,8,2,'#7a5010');}),
 pad:tile(g=>{plaza(g);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-7.5);if(d<7.5)px(g,x,y,d>6.3?'#7c786e':'#a8a49a');}}),
 water:[0,1].map(f=>tile(g=>{rect(g,0,0,16,16,'#2f6cc8');for(let i=0;i<6;i++)px(g,(i*5+3)%16,(i*7+f*3)%16,'#2458a8');for(let i=0;i<4;i++){const y=(i*4+f*2)%16,x0=(i*7+f*4)%16;for(let k=0;k<4;k++)px(g,(x0+k)%16,y+(k===1||k===2?0:1),'#6aaaf2');}})),
 tree:[11,12].map(s=>tile(g=>{grassBase(g,s);blob(g,8,8,8.2,8.2,['#123614','#226a24','#2f8a2c','#5cbc44'],s*7);})),
 rock:[tile(g=>{grassBase(g,21);rect(g,3,13,11,2,'rgba(0,0,0,.25)');blob(g,8,9,6.5,5.2,['#34343c','#6a6a74','#8c8c96','#c0c0ca'],5);})],
 bush:[tile(g=>{grassBase(g,23);blob(g,8,9,6.5,6,['#1a4a18','#3a8a30','#4caa3c','#84dc64'],9);px(g,6,8,'#e02838');px(g,10,10,'#e02838');px(g,8,6,'#e02838');})],
 fenceH:tile(g=>{grassBase(g,31);rect(g,0,5,16,2,'#b07a40');rect(g,0,7,16,1,'#5a3414');rect(g,0,10,16,2,'#b07a40');rect(g,0,12,16,1,'#5a3414');for(const x of [2,11]){rect(g,x-1,2,5,12,'#4a2c10');rect(g,x,3,3,10,'#9a6a34');rect(g,x,3,1,10,'#c08a4c');}}),
 fenceV:tile(g=>{grassBase(g,33);rect(g,5,0,2,16,'#b07a40');rect(g,9,0,2,16,'#b07a40');rect(g,7,0,1,16,'#5a3414');rect(g,11,0,1,16,'#5a3414');for(const y of [1,9]){rect(g,4,y,8,6,'#4a2c10');rect(g,5,y+1,6,4,'#9a6a34');rect(g,5,y+1,6,1,'#c08a4c');}}),
 wall:[tile(g=>{rect(g,0,0,16,16,'#3a3248');for(let r=0;r<4;r++){const y=r*4,off=(r%2)*4;for(let bx=-8;bx<16;bx+=8){rect(g,bx+off+1,y+1,6,3,'#6a6080');rect(g,bx+off+1,y+1,6,1,'#8a80a0');rect(g,bx+off+1,y+3,6,1,'#544a68');}}})],
 dfloor:[41,42].map(s=>tile(g=>{const r=mulberry(s);rect(g,0,0,16,16,'#5e4c3e');rect(g,0,0,16,1,'#3e3028');rect(g,0,8,16,1,'#3e3028');rect(g,0,0,1,8,'#3e3028');rect(g,8,8,1,8,'#3e3028');rect(g,1,1,15,1,'#705c4a');rect(g,0,9,16,1,'#705c4a');for(let i=0;i<6;i++)px(g,r()*16,r()*16,'#76624e');for(let i=0;i<4;i++)px(g,r()*16,r()*16,'#46382c');})),
 gate:null,
 tent:[tile(g=>{plaza(g);for(let y=3;y<15;y++){const hw=Math.floor((y-3)*0.62)+1;rect(g,8-hw,y,hw,1,'#c8b488');rect(g,8,y,hw,1,'#e8d8b0');px(g,8-hw-1,y,'#4a3018');px(g,8+hw,y,'#4a3018');}rect(g,2,15,13,1,'#4a3018');for(let y=9;y<15;y++){const hw=Math.floor((y-9)*0.5);rect(g,8-hw,y,hw*2+1,1,'#3a2814');}px(g,8,2,'#6a4018');px(g,8,1,'#d83030');px(g,9,1,'#d83030');})],
 fire:[tile(g=>{plaza(g);rect(g,3,8,10,5,'#7a5010');rect(g,4,8,8,4,'#f0c030');rect(g,4,8,8,1,'#fff0a0');rect(g,6,13,4,2,'#7a5010');rect(g,5,7,6,2,'#2a1a10');})]
};
TL.gate=[tile(g=>{g.drawImage(TL.dfloor[0],0,0);for(const x of [1,5,9,13]){rect(g,x,0,2,16,'#2a2a38');rect(g,x,0,1,16,'#9a9ab0');}rect(g,0,3,16,2,'#2a2a38');rect(g,0,3,16,1,'#a0a0b8');rect(g,0,11,16,2,'#2a2a38');rect(g,0,11,16,1,'#a0a0b8');})];
// camp coin mosaic: gold ring + our own shiba face (HEAD.dog template at 4x). Not the Dogecoin logo.
// The DOGE coin on the camp floor = the user's own Dogecoin-logo art (D-043), converted to 96x96 in-code pixel art
// (32-colour palette, '.' = transparent stone). Source: docs/art/dogecoin-coin-source.jpg - regenerate with scripts/coin2px.js.
const MOSAIC_PAL='0c0b0a,3d352e,5c3407,623b0a,6a3e05,75470d,73582f,955311,b56616,8c6a2c,bb8629,a07f39,c09e4a,a39986,d57313,da961c,e4a623,daa437,e6b537,efc048,d8b661,d3c9a6,ef8f1c,f39f2e,f6b321,fbd513,f6de40,f6c768,f2d373,f7e090,f8eba6,faf3c0'.split(',');
const MOSAIC_PX=
 '......................................................................................................................................9999999999999999999b........................................................................b36bcckqqqqqqqqqqqqqkccc639d.................................................................669btqqqqqppppppppppqqpqqqqqtc963d............................................................99cqqqqpppppppppppppppppppppppqqqjcb66........................................................9csqqppppppppqqqqqqqqqqqqqqqpppqqqpoojic96....................................................2cstvtqpppppqqqqtttttttttttttqqqqqqpoooorsih63................................................9cqqquvvqpqqqqjccb5444444545545bccssqpoooruvsjja6b.......................'+
 '......................bjqqppquqqqqkc96334333444333433233469bcijjjsuigffhb6..........................................9kqqpppppqqsc52333344444444444444444443225bjqjifffffgj9d.......................................9jqpppppqqkb3233344447777779797777775444444339cjggffffgi93.....................................cigopppqqk953333754798hfihihjhjhifghga79d94444339aggfffffgh9..................................6igfggopqh93344439fe79fffaffgahfhffafffaaftc775433325bgffffffh96...............................5igffgggic32344574hmee7hgifigofohjijhiijfogqjnf87542555bfgfffffh96.............................9hfffffga9324458ah4hieee7ahfgfgfgfihifihgfgfgggffh857hnf75aifffffg99...........................9ffffffgf534447afgg4hie8ee7igjgjgjhjijhjiogogoioggib9hmme723bgfffffgb9.............'+
 '............6ggffffga56547aaffff4hje7em7ahihihhhihihhhihhhhhhffb7hnmee74229gfffgojb6........................gogggfg836d99hggoggh3hjm77me9hqrtjjjqrqijjqjjjjjjic9hnmmmm772329gggoqqjb.......................goooooh72347afghhffgh3hjm778m87rjsjjijjsijjsiikjiib9hnmmmmm8723337foqqqqj9.....................foooooi92347agoorjooij3hjm877me8cststjrsusqstjrsssc9fnmmmeeme7424427hqqqpqj9...................aoooooi83349ffgighhiiii3hnme778em8csrsrrrsjsssjsrrcbfm8eee78ee752b5437hqppqqi9..................oooooi84447fgfijjhhssjj2hmmm8778ef999b99999bctstscbhme8ee7777m872ib4437hqqqqtc.................gooooob3448fffhhhihiiiij3hmmmeeeeeme88888888899bb9bfnm8emee777me72hga4327iqqtutb...............aoooooa4345agggijiijjrrjb7fmemnnmmmmmmmmmmmmmme8888enm88me87557me72hof43329qtuuuk9.......'+
 '.......poooof3249akrggiiijjjssk5fmmmnnnnmmmmmmmmmmmmmmmmemmm87em854447ee72hgfa9323cuuuuuc.............joooog7234agttijjisqjjqsbannnnnnnnmmmmmmmmmmmmmmmme8e878me874447ee72iofoa4335kuuvvt6............pooooa2249afhghhiijrjkbbannnnnnnnnmmemmmmmmmmmmmmmme877emme85447m872hgaff85449tvvvuk...........iooooh4235ffgggiijjstb9aannnnjrrinnmm8emmmmmmmmmmmmmme75emmm74458m752igfgff8444cuvvuub..........ojqop9247hifggiijsts5afnnnnnrsssrnne88emmmmmmmmmmmmmmme7emm74447em75kiifjigh8435svuuuk.........iooopc4457iifgiijrssbannnnnnisssssnne88mmmmmmmmmmmmmmmmm8em74447emm75rjihjioga533buuuqj9........ooooi6249ffgfgijijjaannnnnnnnrssssnme8emmnjjnmmmmmmmmmmmmm84247eeee75srskhhghh9325suqpoa.......pooopc2348gggfgjjij9annnnnnnnnnissrnmeemmnrrrrnmmmmmmmmmmmmme57eeee787tssjihgfia332bqoooj9...'+
 '...ooooj9237fggifgijjj6annnnnnhh8eerrjnmemmnjrrrrjnmmmmmmmmmmmmmeeeeeeee86krissihifb335joooob......ooooh4347fggjhiijjb8fninnn61128erjnmmemnjrrrrrimmmmmmmmmmmmmmmeee8888ea9jjrsjgifa542apoooi.....jooopa237ffijshirss6ansuria310018jnmmmmmnrrrrrjmmmmmmmmmmmmmmmmmee878emn6srrjjgifga429jooop9....jqooq9337gfghjhirs9anjuvur2ld0d18jnmmmmmnrrrrhfffmmmmmmmmmmmmmmmmm8778mm7ssjijhifga445iooooc....sujjj4349ghshgijrs9aitvvur1l1011anmmmnimnirkb31117fmmmmmmmmmmmmmmme888mm89ijjjhgfoa544cjopoh....vvutc247afhshfhjrrbatvvvuk2l6001hmmnnjjmmnnb9ld0005mmmmmmmmmmmmmmmmm88mme7hjiihgfga743bqoooi...stvsr5248gofiijjss9atvvvvkna6611cnmnnrrjmmm91vldd0007mmmmmmmmmmmmmmmmmemme7kqrrijgjia434joooj9..ppqqj3349fifggjirs9auvvvvinnfhcknmnjrrrnm8401ld000005ammnnnsjnmmnnmmmmemme7kqjjiigjg8432kpoopb.'+
 '.pppqc2348gjfgijijsbdvvvvvjnnnrrrnnjrrrjnme501ld00001bmmnsttvurhhrtimmmmmme7krjriigjg8432bqopqc..pppqb2478fkffhihjs9cvvvvvtihssrrrrrrrrjmmma61bd1001bmmfsvvvvvvvukuuhmmmmme7kjjjhgfgfe7329qptqc..pppp924bokurjjsjs6ctuvvvvvttrrrrrrrrrrjnjmmma6666bfmmnrvvvvvvvvvvvvuimmmmma5tstjjhjgga325jpppj..pppi5239gfhhiijjs9cutuvvvllkcccrrrrrrrrrrnmmmffffmmmnruvvvvvvvvvvvvurmmmmme5sjjiifgff8322ipppq..pppi4238ogoiqjqrt9dvvtuvl966661bcrrrrrrrrjnnnmmmmmnhsvvvvvvvvvvvvvvukmmmmme5ssrjqiogoa322hpppq..pppi5339ffghjirrsbkuuuul011166101bsssssrrrrsshnnnhrvvvvvvvvvvvvvvvvvufmmmmme5kjijhgfga442apppq..pppk3438gfogjjrrbktustt10000110000lvvutsrrsvvuuuuuvvvvvvvvvvvvvvvvvvtmmmmmmf5jqjtsggoa442bqppq..pppk3449fahfghjkbcssruu60000000000dvvvutsrsvvvvvvvvvvvvvvvvvvvvvvvvurmmmmmmm5cjjrkhffa442bqppq.'+
 '.pppk344bjisfgiqjbkuutuvd0000000000dvvvvutrsvvvvvvvvvvvvvvvvvvvvvvvvukmmmmmmm89qqjhjijf442bqppq..pppk3448ihifgijjbctttvvd1100010019dvvvvttrsuvvvvvvvvvvvvvvvvvvvvvvvvufmmmmmme9jjjhigga442bqppq..pppk444bogjiqiijbkttslud100000116dllvtvtrrrtuvvvvvvvvvvvvvvvvvvvvvvvvfmmmmmmf9sqqijioa442bqppq..pppk5449faffhhjk9ctutkld61000006bdululvskkkstuvvvvvvvvvvvvvvuuuuuuuutmmmmmmmm9ckjhfff8442bqppq..pppk5448ogjfistc6lvutvld66100166ddlvuvusrrsuvtuuuvvvvvvvvvuutttttttsnmmmmmmmna6ssjogoa442cqppq..pppj6248ffgfhijk9lutuulb66611666bddvlvskrrstuvuuuvvvvvvuuttttttttttsnmmmmmmmna6kihgfga433kqppq..pppqb24bogjgjijrbkuuuttd111116969blluurrrrrsttuvuuuvvuuttttttttttttrnmmmmmmmna6rjijgoa436qpppi..pppqc247ffgfiijjbkvuttuu600001166dlcrsrrrkbcrstttttuutttttttsstttttnmmmmmmmmnh9ajhghf9339qpppi.'+
 '.qppqc235agogjjsjbcuttuuub611100011dkrrkb6619rsttttttttttttssrrtttttnmmmmmmmnnrc5sijia732bqppph..qpppr3258fffhhiic9kttuuukb11111000166661016crrsttttttttttsrrrsttttjnmmmmmemmnic4ihgha533ktqqqa...pppq5248fjgjhijq6cuuuuutk961111110001136ccrrrsttttttttssrrrsttttsnmmmmmmeemmnkbchjib335qqqpq....pppqc247aihihiircbkuuuutrkb66b9b9636ccckrrrrrstttttttsrrrrstttttsnmmmmeeemnnnrk9hif743bqpogh....pppqr234bjgjijiqq9cuuuusrrkkkrkrkcckrrrrrrrrstttttttsrrrrstttttsimmmmme8mmnnnjk9hjf543cjgggh....ppppq6347gfghgijrcbltttrrrrrrrrrrrrrrrrrrrsttttttttrrrrrrtttttsimmmmmee8mmnmnjk6fga445igffgc.....pppqa347fijijirss9cssrrrrrrrrrrrrrrrrrrssttttttttrrrrrrstttttjnmmmmeeeemnmmnrk6hja439jgifi......ppopk5458higiijjjk9hrrrrrrrrrrrrrrrrsttttttttttsrrrrrrrstttttimmmme8eennnnnjrk6hf743ajsuii...'+
 '...qggoi9348foijijjjs9cijrrrrrrrrrrrrrsstttttttttsrrrrrrrstttttjnnnme888ennnnnrrk6hb435jistia.......fggoc247aghghjsss9cffjrrrrrrrrrrrrtttttttttssrrrrrrrstttttrrrinee888ennnnjrrk5a532bjfgii........ggggj5347fhoiqsqt9cfeejrrrrrrrrrrrrsssttttsrrrrrrrrstsstttstineee88emnnnnrrrf58335jgggga.........gggoh234bsjhijjj6cjnefjrrrrrrrrrrrrrrssssrrrrrrrrrrrssttttjnmemee8mnnnnrrrnf3534aofggg..........ghjgi9246hjijjraakjnmeejrrrrrrrrrrrrrrrrrrrrrrrihjrrstttttinnmmeeemnnjjrrjnf4439igffgf...........uvjfi6348hhjjj9crrnnmeeajrrrrrrrrrrrrrrrrrrheefrststtttttsrnnmeemnnjrrrrjnf444fofffg............ksffgb245ahjjj9crrjnnmeeeerrrrrrrrrrrrrieeeeenjrssttttttttinneemnjrrrrrrnf7439jfffgb.............iffgi9345aijj9crrrnnnmeeeeeeaiiiiiieeeeeeeemirrsttttttttrnmeemijrrrrrrjf7449igffff.......'+
 '.......gffggi6349hij9crrrrnnnnmeeeeeeeeeeeeeeeeennnirstsssstttsnmmeijrrrrrrrrja545hogfgg9...............ggggoh344bj93crrrrjnnnnneeeeeeeeeeeeeennnnjrrrrrrrrrrrrrrrrrrttttrrrra532ajgfggf.................ggggib235a95hrrrrrrnnnnmeeeeeeeeeeeemnnirrrrrrrrrrrrrrrrrrtttttttrrk5326iggggg..................gggfgg92355brrrrrrrrinnnmmeeeeeeeemmnnirrrrrrrrrrrrrrrrrrstttttttrh7436ioffggb...................igffoi9245crrrrrrrrrnnnnnmmeeeeennnnrrrrrrrrrrrrrrrrrrrttttttttrk7446ipoffga.....................gfgooj9445arrrrrrrrrjnnnnneeeennnirrrrrrrrrrrrrrrrrrrttttttttsk5446hqoooga.......................goooji9445ckrrrrrrrrnnnnnmeeennirrrrrrrrrrrrrrrrrrrttttttttka5446isujoof........................booojji93457crrrrrrrrinnnmeemnnjrrrrrrrrrrrrrrrrrstttttttts64436jqvvurh3............'+
 '.............coojjjqb5443kkrrrrrrjnnnnennnirrrrrrrrrrrrrrrrrttttttttss44336joosvjf5...........................aijjjjjc52357crrrrrrnnnnnnnnrrrrrrrrrrrrrrsttttttttttk964459jooojsf5.............................cjjjojqk93345akrrrrnnnnnnnirrrrrrrrrrrrrstttttttttkc75446croooooh3...............................bjjoooprb34445ckrjnnnnnnirrrrrrrrrrrrstttttttttsk94444bsjooooof3..................................jjoooojk954444ccnnnnnnjrrrrrrrrssttttttttttkc544446csjoooooa.....................................ioooojtsk6333557aafnirrrrrrrrsttttttttkkcb755445kjqoooooib.......................................hooorvtqtc52244447hhkkrrrrrstttttslrr94555446bsqppogooi9..........................................iqtvuqpqsc9544445545acccckkkkkc5444444459csqpppppoic......................'+
 '.......................aruqppppqqkcb423444455555555555443229aksqqppppppc6................................................hppppppppqqsk9643223333433323466ssqqppptqpppia....................................................hppppqpppppqqqjab9999999bakjqqppppppqpppib........................................................cqpppppppppppqqqqqqqqqqqpppppppppppph9............................................................aqpppppppppppppppppppppppppppppqh6.................................................................chijppppppppppppppppppppihca........................................................................bbchippppppppppicab9......................................................................................................................................';
const MOSAIC=(()=>{const [c,g]=mk(96,96),CH='0123456789abcdefghijklmnopqrstuv';
  for(let i=0;i<9216;i++){const k=MOSAIC_PX[i];if(k!=='.')px(g,i%96,(i/96)|0,'#'+MOSAIC_PAL[CH.indexOf(k)]);}
  return c;})();

// ================= MAP =================
const MW=80,MH=60;
const CX=40,CY=34;
const CAMP={x0:33,y0:27,x1:47,y1:41};
const FY=CY+4,MOS_Y=CY-1; // brazier row, coin mosaic centre row
const PADS=[[CX,CAMP.y0+2],[CAMP.x0+3,CY],[CAMP.x1-3,CY]]; // N, W, E NPC pads
const PADS2=[[CX-3,FY],[CX+3,FY],[CX+3,CY-3]]; // Phase 4 partner NPCs: beside the fire (W, E) and next to the Sphinx (D-024)
const PADS3=[[CX-4,CAMP.y1-1],[CX+4,CAMP.y1-1],[CAMP.x1-2,CAMP.y0+3]]; // D-095: Mender stands in front of the NE tent, off the coin (R1) // Phase 5 faction trainers: warrior + archer flank the south gate, healer by the hearth (D-028)
const DUN={x0:26,y0:2,x1:54,y1:17};
const GATE_ROW=9;
const PONDS_EXTRA=[[54,25,3.5,2.5],[24,53,4,2.5]]; // [cx,cy,rx,ry] tiles: NE of the camp fence (outside it), south-west field
const map=new Uint8Array(MW*MH);
const get=(x,y)=>(x<0||y<0||x>=MW||y>=MH)?T.TREE:map[y*MW+x];
const setT=(x,y,v)=>{if(x>=0&&y>=0&&x<MW&&y<MH)map[y*MW+x]=v;};
const inCampT=(x,y)=>x>=CAMP.x0&&x<=CAMP.x1&&y>=CAMP.y0&&y<=CAMP.y1;
const inDunT=(x,y)=>x>=DUN.x0&&x<=DUN.x1&&y>=DUN.y0&&y<=DUN.y1;
function genMap(){
  const r=mulberry(4242);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const v=r();setT(x,y,v<0.05?T.FLOWER:v<0.11?T.TALL:T.GRASS);}
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(((x-64)/7)**2+((y-44)/4.5)**2<1)setT(x,y,T.WATER);if(((x-13)/4.5)**2+((y-46)/3.2)**2<1)setT(x,y,T.WATER);if(((x-12)/3.5)**2+((y-14)/3)**2<1)setT(x,y,T.WATER);}
  const path=(x,y)=>{if(get(x,y)!==T.WATER)setT(x,y,T.DIRT);};
  for(let x=3;x<CAMP.x0;x++)for(let d=-1;d<=1;d++)path(x,CY+d+Math.round(Math.sin(x*0.3)*0.6));
  for(let x=CAMP.x1;x<MW-3;x++)for(let d=-1;d<=1;d++)path(x,CY+d+Math.round(Math.sin(x*0.25)*0.6));
  for(let y=CAMP.y1;y<MH-3;y++)for(let d=-1;d<=1;d++)path(CX+d+Math.round(Math.sin(y*0.3)*0.6),y);
  for(let y=DUN.y1;y<CAMP.y0;y++)for(let d=-1;d<=1;d++)path(CX+d,y);
  const reserved=(x,y)=>{const t=get(x,y);if(t===T.DIRT||t===T.WATER)return true;if(x>=CAMP.x0-3&&x<=CAMP.x1+3&&y>=CAMP.y0-3&&y<=CAMP.y1+3)return true;if(x>=DUN.x0-2&&x<=DUN.x1+2&&y>=DUN.y0&&y<=DUN.y1+2)return true;return false;};
  for(let i=0;i<85;i++){const cx=r()*MW,cy=r()*MH,rad=1+r()*2.6,kind=r()<0.2?T.BUSH:T.TREE;for(let y=Math.floor(cy-rad-1);y<=cy+rad+1;y++)for(let x=Math.floor(cx-rad-1);x<=cx+rad+1;x++){if(x<0||y<0||x>=MW||y>=MH)continue;if(reserved(x,y))continue;if(Math.hypot(x-cx,y-cy)<rad+r()*0.7)setT(x,y,kind);}}
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=get(x,y);if((t===T.GRASS||t===T.TALL)&&!reserved(x,y)){const v=r();if(v<0.012)setT(x,y,T.ROCK);else if(v<0.022)setT(x,y,T.BUSH);}}
  // fishing ponds (D-015) carved AFTER vegetation so the seeded RNG and the approved forest stay unchanged (D-017);
  // a ring of trees/bushes/rocks around each is cleared so its shore stays reachable
  for(const [px,py,rx,ry] of PONDS_EXTRA)for(let y=2;y<MH-2;y++)for(let x=2;x<MW-2;x++){const d=((x-px)/rx)**2+((y-py)/ry)**2,t=get(x,y);
    if(d<1)setT(x,y,T.WATER);else if(d<2.2&&(t===T.TREE||t===T.BUSH||t===T.ROCK))setT(x,y,T.GRASS);}
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(x<2||y<2||x>=MW-2||y>=MH-2)setT(x,y,T.TREE);}
  // camp
  for(let y=CAMP.y0;y<=CAMP.y1;y++)for(let x=CAMP.x0;x<=CAMP.x1;x++){const edge=x===CAMP.x0||x===CAMP.x1||y===CAMP.y0||y===CAMP.y1;const gap=Math.abs(x-CX)<=1||Math.abs(y-CY)<=1;setT(x,y,edge&&!gap?T.FENCE:T.STONE);}
  // camp layout (concept image 12): doors beside each gap, corner tents, crystals, NPC pads, brazier south of the coin
  for(const d of [-2,2]){setT(CX+d,CAMP.y0,T.DOOR);setT(CX+d,CAMP.y1,T.DOOR);setT(CAMP.x0,CY+d,T.DOOR);setT(CAMP.x1,CY+d,T.DOOR);}
  for(const [x,y] of [[CAMP.x0+2,CAMP.y0+2],[CAMP.x1-2,CAMP.y0+2],[CAMP.x0+2,CAMP.y1-2],[CAMP.x1-2,CAMP.y1-2]])setT(x,y,T.TENT);
  for(const [x,y] of [[CX-3,CY-4],[CX+3,CY-4],[CX-3,CY+2],[CX+3,CY+2]])setT(x,y,T.CRYSTAL);
  for(const [x,y] of [...PADS,...PADS2,...PADS3])setT(x,y,T.PAD);
  setT(CX,FY,T.FIRE);
  // ruins
  for(let y=DUN.y0;y<=DUN.y1;y++)for(let x=DUN.x0;x<=DUN.x1;x++){const edge=x===DUN.x0||x===DUN.x1||y===DUN.y0||y===DUN.y1||y===DUN.y0+1;setT(x,y,edge?T.WALL:T.DFLOOR);}
  for(let x=CX-1;x<=CX+1;x++)setT(x,DUN.y1,T.DFLOOR);
  for(let x=DUN.x0;x<=DUN.x1;x++)setT(x,GATE_ROW,Math.abs(x-CX)<=1?T.GATE:T.WALL);
  for(const x of [29,33,47,51])for(const y of [12,15])setT(x,y,T.WALL);
  for(const x of [30,34,46,50])setT(x,5,T.WALL);
}
function tileCanvas(tx,ty,t){
  const h=((tx*73856093)^(ty*19349663))>>>0;
  switch(t){
    case T.GRASS:return TL.grass[h%3];case T.FLOWER:return TL.flower[h%2];case T.TALL:return TL.tall[h%2];
    case T.DIRT:return TL.dirt[h%2];case T.STONE:return TL.stone[0];
    case T.WATER:return TL.water[(Math.floor(time*2)+((tx+ty)&1))%2];
    case T.TREE:return TL.tree[h%2];case T.ROCK:return TL.rock[0];case T.BUSH:return TL.bush[0];
    case T.FENCE:{const hz=get(tx-1,ty)===T.FENCE||get(tx+1,ty)===T.FENCE;return hz?TL.fenceH:TL.fenceV;}
    case T.WALL:return TL.wall[0];case T.DFLOOR:return TL.dfloor[h%2];
    case T.GATE:return state.gateOpen?TL.dfloor[0]:TL.gate[0];
    case T.TENT:return TL.tent[0];case T.FIRE:return TL.fire[0];
    case T.DOOR:return TL.door;case T.CRYSTAL:return TL.crystal;case T.PAD:return TL.pad;
  }
  return TL.grass[0];
}

// ================= GAME STATE =================
const DIRV={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
const ANG={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
const SWORD_DMG=[0,5,8,12,18],ARMOR_RED=[0,0.25,0.45];
// market (simulated DOGE/USD price, ticks once per second) + rest/respawn rules
const MARKET={start:0.25,min:0.05,max:1.5,vol:0.03,revert:0.02,avgN:30,sentScale:0.2,bearDmg:0.5,bearSpd:0.15,bullDmg:0.5,bullSpd:0.1};
const REST_DELAY=3,REST_HP=10,REST_MP=8,REST_CAP=0.6,RESPAWN_FRAC=0.35;
const SKILL_THRESH={combat:[0,10,25,50,100],fishing:[0,5,15,30,60],bark:[0,8,20,45,80]},SKILL_BONUS=0.08;
function skillLv(xp,kind){const t=SKILL_THRESH[kind||'combat'];for(let i=t.length-1;i>=0;i--)if(xp>=t[i])return i;return 0;}
function skillMul(xp,kind){return 1+skillLv(xp,kind)*SKILL_BONUS;}
// fishing (D-015): bar length in seconds (divided by the fishing skill multiplier); enemy pressure
const FISH_MIN=3,FISH_MAX=5,FIELD_POP=52,DUN_POP=6,SPAWN_EVERY=3,DUN_RESPAWN=20,MINI_RESPAWN=20,NINJA_WATER={r:4,p:0.25},QUEST_MATS=[null,{wood:2,stone:2,steel:2},{wood:4,stone:4,steel:4}]; // D-089 (user): dungeon cats + mini-bosses respawn every 20 s (was 2/4 min, D-063). NPCs never give DOGE: Elder quests pay materials (QUEST_MATS[stage])
function nearWaterT(tx,ty,r){for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++)if(get(x,y)===T.WATER)return true;return false;}
// casting up throws the float 16 px further so it lands above the hero's head, not on it (D-017)
function waterAt(d){const v=DIRV[d],x=P.x+v[0]*(P.hw+6),y=P.y+v[1]*(P.hh+6),o=d==='up'?16:6;return get(Math.floor(x/16),Math.floor(y/16))===T.WATER?{x:x+v[0]*o,y:y+v[1]*o}:null;}
// D-053 renewable gathering: face a tree -> WOOD, a rock -> STONE, hold F (same interrupt rules as fishing). Per-tile cooldown renews the node.
const GATHER_DUR=3.5,GATHER_CD=14;const gatherCD={};
function nodeAt(d){const v=DIRV[d],tx=Math.floor((P.x+v[0]*(P.hw+7))/16),ty=Math.floor((P.y+v[1]*(P.hh+7))/16),t=get(tx,ty),kind=t===T.TREE?'wood':t===T.ROCK?'stone':null;if(!kind||(gatherCD[tx+','+ty]||0)>time)return null;return {tx,ty,kind,x:tx*16+8,y:ty*16+8};}
function startFish(){
  if(P.moving){if(!toastMsg)toast('STAND STILL TO GATHER.',1.2);return;} // F while walking used to cast and instantly cancel (D-017)
  const n=nodeAt(P.dir); // D-053: a tree or rock in front? harvest it with the same bar/interrupt rules as fishing
  if(n){P.fishing=true;P.gNode=n;P.fishT=0;P.fishDur=GATHER_DUR/skillMul(P.skills.fishing,'fishing');P.fishX=n.x;P.fishY=n.y-4;sfx(380,0.12,'square',0.04,-120);return;}
  const w=waterAt(P.dir); // must FACE the water (PHASE3_BRIEF ambiguity 3)
  if(!w){if(!toastMsg)toast(['up','down','left','right'].some(d=>waterAt(d)||nodeAt(d))?'FACE THE WATER / TREE / ROCK.':'FIND WATER TO FISH OR A TREE/ROCK TO GATHER (F)',1.5);return;}
  P.fishing=true;P.gNode=null;P.fishT=0;P.fishDur=(FISH_MIN+Math.random()*(FISH_MAX-FISH_MIN))/skillMul(P.skills.fishing,'fishing');P.fishX=w.x;P.fishY=w.y;
  sfx(600,0.12,'triangle',0.04,-300);
}
function stopFish(msg){if(!P.fishing)return;P.fishing=false;P.fishT=0;P.gNode=null;if(msg)floater(P.x,P.y-32,msg,'#ff9050');}
function updFish(dt){
  if(!P.fishing)return;P.fishT+=dt;if(P.fishT<P.fishDur)return;
  P.fishing=false;P.fishT=0;
  if(P.gNode){const n=P.gNode;P.gNode=null;gatherCD[n.tx+','+n.ty]=time+GATHER_CD; // node depletes, renews after GATHER_CD
    if(n.kind==='stone'){items.push({x:n.x+R(-6,6),y:n.y+R(-4,4),kind:'steel',life:25,t:0});floater(P.x,P.y-34,'+1 IRON','#a0a8b0');} // stone always drops iron (D-067)
    if(addToBag(n.kind,1)){P.skills.fishing++;floater(P.x,P.y-24,n.kind==='wood'?'+1 WOOD':'+1 STONE',n.kind==='wood'?'#c08a4a':'#c0c8d0');sfx(760,0.13,'square',0.05,200);}
    else toast('BAG FULL!',2);
    return;}
  const fishKind=(P.skills.fishing>=1&&Math.random()<0.45)?'raw_salmon':'raw_fish';
  const fishName=fishKind==='raw_salmon'?'RAW SALMON':'RAW FISH (SARDINE)';
  if(addToBag(fishKind,1)){P.skills.fishing++;floater(P.x,P.y-24,'+1 '+fishName,fishKind==='raw_salmon'?'#ff7060':'#80c0e0');sfx(900,0.15,'triangle',0.05,500);}
  else toast('BAG FULL! THE FISH GOT AWAY.',2);
}
const BAG_SIZE=12,MENU_ROWS=13;
const FOODS={
  raw_fish:{name:'RAW FISH',heal:15,mp:0,col:'#80c0e0'},
  cooked_fish:{name:'COOKED FISH',heal:25,mp:0,col:'#f0a040'},
  raw_salmon:{name:'RAW SALMON',heal:25,mp:10,col:'#ff7060'},
  cooked_salmon:{name:'COOKED SALMON',heal:50,mp:25,col:'#ff9050'}
};
function addToBag(kind,qty){qty=qty||1;for(const s of P.bag){if(s.kind===kind&&s.qty<(FOODS[kind]?5:20)){const add=Math.min(qty,((FOODS[kind]?5:20))-s.qty);s.qty+=add;qty-=add;if(!qty)return true;}}while(qty>0&&P.bag.length<BAG_SIZE){const add=Math.min(qty,FOODS[kind]?5:20);P.bag.push({kind,qty:add});qty-=add;}return qty===0;}
function bagCount(kind){let n=0;for(const s of P.bag)if(s.kind===kind)n+=s.qty;return n;}
const BAG_MATS={wood:1,stone:1}; // D-103: wood + stone exist ONLY in the bag (no hidden second counter)
function matN(k){return BAG_MATS[k]?bagCount(k):(P[k]||0);}function matAdd(k,v){if(BAG_MATS[k])return addToBag(k,v);P[k]=(P[k]||0)+v;return true;}function matTake(k,v){if(BAG_MATS[k])bagRemove(k,v);else P[k]-=v;}
function bagRemove(kind,qty){qty=qty||1;for(let i=P.bag.length-1;i>=0;i--){if(P.bag[i].kind===kind){const take=Math.min(qty,P.bag[i].qty);P.bag[i].qty-=take;qty-=take;if(P.bag[i].qty<=0)P.bag.splice(i,1);if(!qty)return true;}}return qty===0;}
let mkt;
function newMarket(){mkt={p:MARKET.start,hist:[MARKET.start],t:0,sent:0};}
function updMarket(dt){
  mkt.t+=dt;if(mkt.t<1)return;mkt.t-=1;
  const n=(Math.random()+Math.random()+Math.random()-1.5)*2; // ~normal(0,1)
  const anchor=oracle.loaded?oracle.price:MARKET.start; // RedStone DOGE/USD when connected (D-024)
  mkt.p=Math.max(Math.min(MARKET.min,anchor/5),Math.min(Math.max(MARKET.max,anchor*5),mkt.p*Math.exp(n*MARKET.vol+Math.log(anchor/mkt.p)*MARKET.revert)));
  mkt.hist.push(mkt.p);if(mkt.hist.length>MARKET.avgN)mkt.hist.shift();
  const avg=mkt.hist.reduce((a,b)=>a+b,0)/mkt.hist.length;
  mkt.sent=Math.max(-1,Math.min(1,Math.log(mkt.p/avg)/MARKET.sentScale));
}
const bearF=()=>Math.max(0,-mkt.sent),bullF=()=>Math.max(0,mkt.sent);
// D-056 HARDCORE: normal monsters are +100% HP and +100% damage vs the ORIGINAL tuning (2x base; supersedes D-052's +50%).
// User: "i want the enemies 100% more hard." Boss keeps its tuned stats (not a "normal" monster; mini-bosses come later).
// D-055 rare drops: dropP = chance to drop the material at all (user: "not every monster drops something; hard as fuck to
// get resources"). D-097 (user): no in-game DOGE at all — monsters never drop coins; testnet DOGE is only for web3 (mint/DEX/stake/class).
const YARN_MATS={wood:3,stone:3,steel:3}; // the Cat Lord's Golden Yarn pays mint materials, not DOGE (D-097)
function giveMats(o){for(const [m,v] of Object.entries(o))if(!matAdd(m,v))for(let i=0;i<v;i++)items.push({x:P.x+R(-10,10),y:P.y+R(-8,8),kind:m,life:60,t:0});} // D-111 S4-4: bag full -> on the ground
const ETYPES={
  alley:{hp:30,spd:48,dmg:12,drop:1,dropP:0.2,hw:5,hh:4,chase:120,spr:'alley',mat:'whisk'},
  archer:{hp:24,spd:34,dmg:10,drop:1,dropP:0.2,hw:5,hh:4,chase:150,spr:'archer',mat:'whisk'},
  frog:{hp:28,spd:32,dmg:12,drop:1,dropP:0.25,hw:5,hh:4,chase:150,spr:'frog',mat:'whisk',ai:'archer'},
  ninja:{hp:36,spd:62,dmg:16,drop:1,dropP:0.25,hw:5,hh:4,chase:130,spr:'ninja',mat:'steel'},
  bull:{hp:110,spd:26,dmg:28,drop:1,dropP:0.35,hw:6,hh:5,chase:130,spr:'bull',mat:'steel',ai:'brute'},
  knight:{hp:70,spd:38,dmg:20,drop:1,dropP:0.35,hw:5,hh:4,chase:120,spr:'knight',mat:'steel'},
  brute:{hp:96,spd:28,dmg:24,drop:3,dropP:0.45,hw:6,hh:5,chase:130,spr:'brute',mat:'whisk'},
  boss:{hp:320,spd:38,dmg:12,drop:0,hw:10,hh:7,chase:999,spr:'boss',boss:true}
};
const BOSS_RESPAWN=60; // D-095 raid cycle: the Cat Lord returns 60 s after he falls and every heist restarts at quest 1 (relay-driven in MP)
let time=0,state={gateOpen:false,stage:0,won:false,bossT:0},P,enemies=[],projs=[],items=[],parts=[],floats=[],cam={x:0,y:0},ui=null,toastMsg=null,shakeT=0,spawnT=0,dunT=0,miniT=0,scene='title',winT=0;
// ---- Phase 5 classes / professions (D-028). id matches DogeProfession: 1 warrior, 2 archer, 3 healer ----
// spd/dmg/armor are multipliers/adds applied at use sites (classSpd/classDmg/classArmor); skill routing lands in a later part.
const CLASSES={
  warrior:{id:1,name:'WARRIOR',faction:'demo',factionName:'DEMOLITION DOGS',spr:'tWarrior',trainer:'SERGEANT IRONPAW',
    spd:0.95,dmg:1.35,armor:0.15,hp:25,mp:-10,skill:'GROUND POUND',
    mech:['A frontline tank. Heavy hammer cleave, thick armor, +25 max HP, -10 MP.','SPACE = heavy wide hammer smash (+35% dmg). +15% armor reduction.'],
    skillDesc:'K/Q = GROUND POUND (12 MP): shockwave that damages and knocks back every cat around you.'},
  archer:{id:2,name:'ARCHER',faction:'kernel',factionName:'KERNEL CREW',spr:'tArcher',trainer:'SCOUT FLEETWHISKER',
    spd:1.25,dmg:1.0,armor:0,hp:0,mp:0,skill:'ARROW VOLLEY',
    mech:['A fast ranged kiter. Choosing Archer replaces your hammer with a bow!','SPACE = shoot arrows at range (0 MP)! +25% move speed to kite brutes.'],
    skillDesc:'K/Q = ARROW VOLLEY (6 MP): fires a 3-arrow spread fan for crowd control.'},
  healer:{id:3,name:'HEALER',faction:'bark',factionName:'BARKITECTS',spr:'tHealer',trainer:'MENDER BRIGHTTAIL',
    spd:1.25,dmg:0.65,armor:0.05,hp:-15,mp:20,skill:'MEND',
    mech:['Fleet-footed mystic. -15 max HP and weak melee (-35% dmg), but +25% speed and +20 MP for healing!','SPACE = light staff strike (+2 MP on hit). Keep moving and heal through fights.'],
    skillDesc:'K/Q = MEND (10 MP): spend MP to heal +20 HP anytime. Staff hits restore +2 MP!'},
};
const CLASS_IDS={1:'warrior',2:'archer',3:'healer'};
const classOf=()=>P.prof?CLASSES[P.prof]:null;
const classSpd=()=>{const c=classOf();return (c?c.spd:1)*(P.lazy?0.85:1);};
const classDmg=()=>{const c=classOf();return c?c.dmg:1;};
const classArmor=()=>{const c=classOf();return c?c.armor:0;};
const CLASS_COL={warrior:'#ff8060',archer:'#80e080',healer:'#80d0ff'};
function syncMaxHp(){const c=classOf();P.maxHp=Math.max(20,60+(c?c.hp:0)+P.hpUps*15+gearStats().hp);P.hp=Math.min(P.hp,P.maxHp);} // D-109: a higher max is not a free heal (rest/eat to fill); floor 20 vs cursed gear
// D-054: per-class Max MP (user: "each hp and mp is different per profession"). Warrior 20, Archer 30, Healer 50. Mirrors syncMaxHp (absolute from class + mpUps).
function syncMaxMp(){const c=classOf();P.maxMp=Math.max(10,30+(c?c.mp||0:0)+P.mpUps*10+gearStats().mp);P.mp=Math.min(P.mp,P.maxMp);}
function applyClass(cls,onchain){if(!CLASSES[cls])return;P.prof=cls;syncMaxHp();syncMaxMp();const c=CLASSES[cls];puff(P.x,P.y-8,CLASS_COL[cls],14);
  toast(`${c.name} (${onchain?'ON-CHAIN':'ACTIVE'}): ${cls==='archer'?'SPACE SHOOTS ARROWS! K=VOLLEY':cls==='healer'?'FAST + K TO HEAL, WEAK MELEE':'+25 HP, +15% ARMOR, HEAVY HIT!'}`,3.5);}
const NPCS=[
  {id:'merchant',name:'WRENCHPAW THE MECHANIC',spr:'merchant',x:PADS[2][0]*16+8,y:PADS[2][1]*16+8,hw:6,hh:4,dir:'down',met:false},
  {id:'bank',name:'THE GREAT SPHINX OF DOGE',spr:'bank',x:PADS[0][0]*16+8,y:PADS[0][1]*16+8,hw:6,hh:4,dir:'down',met:false},
  {id:'quest',name:'ELDER SHIBE, KEEPER OF THE HEIST',spr:'sage',x:PADS[1][0]*16+8,y:PADS[1][1]*16+8,hw:6,hh:4,dir:'down',met:false},
  {id:'lotto',name:'CLOVERHEART, THE LUCKY GUIDE',spr:'clover',x:PADS2[0][0]*16+8,y:PADS2[0][1]*16+8,hw:6,hh:4,dir:'down',met:false},
  {id:'noah',name:'NOAH, THE AI BRAIN (MODEL N-01)',spr:'noah',x:PADS2[1][0]*16+8,y:PADS2[1][1]*16+8,hw:6,hh:4,dir:'down',met:false},
  {id:'bitget',name:'THE BITGET WALLET CARD',spr:'bitget',x:PADS2[2][0]*16+8,y:PADS2[2][1]*16+8,hw:6,hh:4,dir:'down',met:false},
  {id:'warrior',cls:'warrior',name:'SERGEANT IRONPAW (DEMOLITION DOGS)',spr:'tWarrior',x:PADS3[0][0]*16+8,y:PADS3[0][1]*16+8,hw:6,hh:4,dir:'up',met:false},
  {id:'archer',cls:'archer',name:'SCOUT FLEETWHISKER (KERNEL CREW)',spr:'tArcher',x:PADS3[1][0]*16+8,y:PADS3[1][1]*16+8,hw:6,hh:4,dir:'up',met:false},
  {id:'healer',cls:'healer',name:'MENDER BRIGHTTAIL (BARKITECTS)',spr:'tHealer',x:PADS3[2][0]*16+8,y:PADS3[2][1]*16+8,hw:6,hh:4,dir:'down',met:false}
];
function newGame(){
  state={gateOpen:false,stage:0,won:false,bossT:0};
  P={x:CX*16+8,y:(CY+3)*16+8,hw:5,hh:4,dir:'down',anim:0,moving:false,hp:60,maxHp:60,mp:30,maxMp:30,whisk:0,steel:2,orb:0,scrap:0,horn:0,sword:1,armor:0,hpUps:0,mpUps:0,iT:0,atkT:0,atkCd:0,kbx:0,kby:0,resting:false,dead:false,deathT:0,kills:0,bruteKills:0,bag:[{kind:'wood',qty:3},{kind:'stone',qty:3}],skills:{combat:0,fishing:0,bark:0},fishing:false,fishT:0,gNode:null,credits:{},faction:null,prof:null,lazy:false,lazyT:0,idleT:0};
  enemies=[];projs=[];items=[];parts=[];floats=[];ui=null;toastMsg=null;newMarket();
  for(const n of NPCS)n.met=false;
  for(let i=0;i<FIELD_POP;i++)spawnEnemy('field');
  for(let i=0;i<DUN_POP;i++)spawnEnemy('dun');
  for(const r in MINIS)spawnMini(r,MINIS[r]); // D-057/D-063: one mini-boss per region
  enemies.push(makeEnemy('boss',CX*16+8,5*16+8,'boss'));
  spawnT=SPAWN_EVERY;dunT=DUN_RESPAWN;miniT=MINI_RESPAWN; // D-062/D-063/D-089: don't refill until a full interval passes (dungeon stays cleared ~20s)
  cam.x=P.x-W/2;cam.y=P.y-H/2;
}
function makeEnemy(type,x,y,zone){const d=ETYPES[type];return {type,def:d,x,y,hw:d.hw,hh:d.hh,hp:d.hp,maxHp:d.hp,dir:'down',anim:0,state:'wander',t:0,wx:0,wy:0,flash:0,kbx:0,kby:0,cool:1+Math.random()*2,enemy:true,boss:!!d.boss,zone,summonT:4,dead:false};}
// D-057 mini-boss per region: a scaled-up elite of a region type. zone:'mini' keeps it OUT of the FIELD_POP/DUN_POP refill
// (it stays unique and respawns every MINI_RESPAWN s). Bigger, tankier, hits harder (3.5x HP, 1.6x dmg), with guaranteed drops.
const MINIS={field:'brute',dun:'knight'}; // one mini-boss type per region
function makeMini(type,x,y,region){const d=ETYPES[type],md={...d,hp:Math.round(d.hp*3.5),dmg:Math.round(d.dmg*1.6),spd:d.spd*1.12,drop:6,dropP:1,hw:d.hw+2,hh:d.hh+2,chase:d.chase+80}; // drop:6 = lots of loot
  return {type,def:md,x,y,hw:md.hw,hh:md.hh,hp:md.hp,maxHp:md.hp,dir:'down',anim:0,state:'wander',t:0,wx:0,wy:0,flash:0,kbx:0,kby:0,cool:1+Math.random()*2,enemy:true,boss:false,mini:true,region,zone:'mini',summonT:4,dead:false};}
function spawnMini(region,type){ // region 'field'|'dun' sets placement; the enemy is tagged zone:'mini'
  for(let tries=0;tries<150;tries++){let tx,ty;
    if(region==='dun'){tx=DUN.x0+1+Math.floor(Math.random()*(DUN.x1-DUN.x0-1));ty=GATE_ROW+1+Math.floor(Math.random()*7);}
    else{tx=3+Math.floor(Math.random()*(MW-6));ty=3+Math.floor(Math.random()*(MH-6));if(inDunT(tx,ty))continue;if(tx>=CAMP.x0-4&&tx<=CAMP.x1+4&&ty>=CAMP.y0-4&&ty<=CAMP.y1+4)continue;}
    const x=tx*16+8,y=ty*16+8;if(P&&dist(x,y,P.x,P.y)<220)continue;if(blocked({hw:9,hh:8,enemy:true},x,y))continue;
    enemies.push(makeMini(type,x,y,region));return;}
}
const nearResT=(tx,ty,r=2)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const t=get(tx+dx,ty+dy);if(t===T.TREE||t===T.ROCK||t===T.WATER)return true;}return false;};
function spawnEnemy(zone){
  for(let tries=0;tries<80;tries++){
    let tx,ty;
    if(zone==='dun'){tx=DUN.x0+1+Math.floor(Math.random()*(DUN.x1-DUN.x0-1));ty=GATE_ROW+1+Math.floor(Math.random()*7);}
    else{tx=3+Math.floor(Math.random()*(MW-6));ty=3+Math.floor(Math.random()*(MH-6));if(inDunT(tx,ty))continue;if(tx>=CAMP.x0-3&&tx<=CAMP.x1+3&&ty>=CAMP.y0-3&&ty<=CAMP.y1+3)continue;if(Math.random()<0.65&&!nearResT(tx,ty))continue;} // D-067: mobs cluster around resources
    const x=tx*16+8,y=ty*16+8;
    if(P&&dist(x,y,P.x,P.y)<200)continue;
    if(blocked({hw:7,hh:6,enemy:true},x,y))continue;
    const dc=dist(x,y,CX*16+8,CY*16+8),r=Math.random();let type;
    if(zone==='dun')type=r<0.2?'alley':r<0.35?'archer':r<0.5?'frog':r<0.65?'ninja':r<0.8?'knight':'brute';
    else if(dc<380)type=r<0.35?'alley':r<0.55?'ninja':r<0.75?'frog':'archer';
    else type=r<0.2?'alley':r<0.35?'archer':r<0.5?'frog':r<0.65?'ninja':r<0.8?'knight':r<0.9?'bull':'brute';
    if(zone==='field'&&type!=='ninja'&&nearWaterT(tx,ty,NINJA_WATER.r)&&Math.random()<NINJA_WATER.p)type='ninja'; // ponds are ninja turf (ambiguity 10)
    enemies.push(makeEnemy(type,x,y,zone));return;
  }
}
function summon(b){let n=0;for(const e of enemies)if(e.zone==='boss'&&!e.boss&&!e.dead)n++;if(n>=4)return;for(const ox of [-24,24]){const x=b.x+ox,y=b.y+10;if(!blocked({hw:5,hh:4,enemy:true},x,y)){const e=makeEnemy('alley',x,y,'boss');e.cool=0;enemies.push(e);puff(x,y,'#c0a0e0',8);}}sfx(300,0.3,'sawtooth',0.04,300);}

// ================= COLLISION =================
function solidFor(tx,ty,ent){if(ent.boss&&ty>=GATE_ROW)return true;const t=get(tx,ty);if(t===T.GATE)return !state.gateOpen;if(SOLID.has(t))return true;if(ent.enemy&&inCampT(tx,ty))return true;return false;}
function blocked(ent,x,y){
  const x0=Math.floor((x-ent.hw)/16),x1=Math.floor((x+ent.hw-0.01)/16),y0=Math.floor((y-ent.hh)/16),y1=Math.floor((y+ent.hh-0.01)/16);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(solidFor(tx,ty,ent))return true;
  if(ent===P){for(const n of NPCS)if(Math.abs(x-n.x)<ent.hw+n.hw&&Math.abs(y-n.y)<ent.hh+n.hh)return true;}
  return false;
}
function move(ent,dx,dy){
  let hit=false;const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/3));const sx=dx/steps,sy=dy/steps;
  for(let i=0;i<steps;i++){
    if(sx){if(!blocked(ent,ent.x+sx,ent.y))ent.x+=sx;else{hit=true;if(ent===P&&!sy){for(const n of [1,-1])if(!blocked(ent,ent.x+sx,ent.y+n*1.5)){ent.y+=n*0.75;break;}}}}
    if(sy){if(!blocked(ent,ent.x,ent.y+sy))ent.y+=sy;else{hit=true;if(ent===P&&!sx){for(const n of [1,-1])if(!blocked(ent,ent.x+n*1.5,ent.y+sy)){ent.x+=n*0.75;break;}}}}
  }
  return hit;
}
const overlap=(a,b,p=0)=>Math.abs(a.x-b.x)<a.hw+b.hw+p&&Math.abs(a.y-b.y)<a.hh+b.hh+p;
const dirOf=(vx,vy)=>Math.abs(vx)>Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');
function playerInCamp(){const tx=Math.floor(P.x/16),ty=Math.floor(P.y/16);return inCampT(tx,ty);}
function zoneOf(x,y){const tx=Math.floor(x/16),ty=Math.floor(y/16);if(inDunT(tx,ty))return ty<GATE_ROW?'boss':'dun';return 'field';}

// ================= FX =================
function puff(x,y,col,n=10){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=R(20,70);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:R(0.3,0.6),col});}}
function floater(x,y,t,col){floats.push({x,y,t:String(t),col,life:0.8});}
function toast(t,d=2.5){toastMsg={t,life:d};}
function shake(t){shakeT=Math.max(shakeT,t);}

// ================= COMBAT =================
function hurtPlayer(d,src){
  if(P.god||P.iT>0||P.dead||playerInCamp())return; // camp is a sanctuary: nothing hurts you inside (I-1)
  const dmg=Math.max(1,Math.round(d*(1+MARKET.bearDmg*bearF())*(1-Math.min(0.8,ARMOR_RED[armorLv()]+classArmor()+gearStats().def))));
  P.hp-=dmg;P.iT=0.9;P.resting=false;stopFish('LINE SNAPPED!'); // getting hit ruins the catch (D-015)
  const dx=P.x-src.x,dy=P.y-src.y,l=Math.hypot(dx,dy)||1;P.kbx=dx/l*190;P.kby=dy/l*190;
  floater(P.x,P.y-22,'-'+dmg,'#ff5050');shake(0.2);sfx(140,0.15,'sawtooth',0.07,-80);
  if(P.hp<=0){P.hp=0;P.dead=true;P.deathT=2.2;sfx(300,0.8,'triangle',0.08,-260);puff(P.x,P.y-8,'#e8922c',16);}
}
function respawn(){
  const lw=P.whisk,lf=P.bag.length;
  if(netLive()){const drops=[];for(const k of NET_LOOT)for(let i=0;i<Math.min(3,matN(k));i++)drops.push({k,x:Math.round(P.x+R(-12,12)),y:Math.round(P.y+R(-12,12))});netSend({t:'loot',items:drops});} // D-076: everyone sees + can steal your pile
  else{for(let i=0;i<Math.min(4,P.steel);i++)items.push({x:P.x+R(-12,12),y:P.y+R(-12,12),kind:'steel',life:30,t:0});
  for(let i=0;i<Math.min(4,lw);i++)items.push({x:P.x+R(-12,12),y:P.y+R(-12,12),kind:'whisk',life:30,t:0});}
  P.whisk=0;P.steel=0;P.orb=0;P.scrap=0;P.horn=0;P.bag=[]; // carried food is lost too; NFTs live on chain (D-020)
  P.dead=false;P.fishing=false;P.hp=Math.ceil(P.maxHp*RESPAWN_FRAC);P.mp=Math.floor(P.maxMp*RESPAWN_FRAC);P.x=CX*16+8;P.y=(CY+3)*16+8;P.iT=1.5;P.kbx=P.kby=0;P.dir='down';
  projs=[];
  for(const e of enemies){if(e.boss){if(!netLive())e.hp=e.maxHp;e.x=CX*16+8;e.y=5*16+8;}} // MP: the relay owns boss HP
  enemies=enemies.filter(e=>e.zone!=='boss'||e.boss);
  openDialog(null,['You wake up by the campfire, weak and hurt. Rest to recover.',`You lost ${lw} whiskers, all materials${lf?' and your bag of food':''}. Mint gear and preserve fish as NFTs: they live on chain and stay safe!`]);
}
function attack(){
  stopFish('REELED IN');P.atkT=0.18;P.atkCd=P.prof==='archer'?0.24:P.prof==='warrior'?0.34:0.28;
  const v=DIRV[P.dir],sdmg=Math.round((SWORD_DMG[swordLv()]+gatk())*(1+MARKET.bullDmg*bullF())*skillMul(P.skills.combat,'combat')*classDmg());
  if(P.prof==='archer'){
    projs.push({x:P.x+v[0]*9,y:P.y-6+v[1]*9,vx:v[0]*280,vy:v[1]*280,life:0.8,kind:'arrow',basic:true,dir:P.dir,dmg:sdmg,hits:new Set()});
    sfx(780,0.1,'triangle',0.045,-220);return;
  }
  sfx(P.prof==='healer'?840:P.prof==='warrior'?520:700,0.08,P.prof==='healer'?'sine':'square',0.04,P.prof==='healer'?180:-450);
  if(P.prof==='warrior')shake(0.08);
  const reach=P.prof==='warrior'?4:0,cx=P.x+v[0]*(13+reach),cy=P.y-5+v[1]*(12+reach),hw=(v[0]?10:12)+reach,hh=(v[0]?11:9)+reach;
  let hit=false;for(const e of enemies){if(e.dead)continue;const ew=e.boss?12:6,eh=e.boss?18:9,ey=e.y-(e.boss?14:6);if(Math.abs(e.x-cx)<hw+ew&&Math.abs(ey-cy)<hh+eh){damageEnemy(e,sdmg,v[0]*(P.prof==='warrior'?1.35:1),v[1]*(P.prof==='warrior'?1.35:1));hit=true;}}
  if(netPvp(cx,cy,hw,hh,sdmg))hit=true; // D-076 PvP melee
  if(hit){P.skills.combat++;if(P.prof==='healer')P.mp=Math.min(P.maxMp,P.mp+2);}
}
function bark(){
  if(P.mp<10){toast('NOT ENOUGH MP! REST AT THE CAMP.',1.5);sfx(110,0.1,'square',0.04);return;}
  stopFish('REELED IN');P.mp-=10;P.skills.bark++;const v=DIRV[P.dir];projs.push({x:P.x+v[0]*8,y:P.y-6+v[1]*8,vx:v[0]*150,vy:v[1]*150,life:0.7,kind:'wow',dmg:Math.round((8+swordLv()*3+gatk())*(1+MARKET.bullDmg*bullF())*skillMul(P.skills.bark,'bark')*classDmg()),hits:new Set()});
  sfx(500,0.25,'sawtooth',0.05,500);
}
// ---- Phase 5 (D-029): K/Q runs your class skill (replaces WOW), else the default bark ----
const SKILL_MP={warrior:12,archer:6,healer:10};
function useSkill(){const c=classOf();if(!c)return bark();if(P.prof==='warrior')return groundPound();if(P.prof==='archer')return quickShot();return mend();}
const noMp=n=>{if(P.mp<n){toast('NOT ENOUGH MP! REST AT THE CAMP.',1.5);sfx(110,0.1,'square',0.04);return true;}return false;};
// WARRIOR: GROUND POUND — a shockwave that damages + knocks back every cat around you
function groundPound(){if(noMp(SKILL_MP.warrior))return;stopFish('REELED IN');P.mp-=SKILL_MP.warrior;P.skills.bark++;
  const R=46,dmg=Math.round((10+swordLv()*4+gatk())*(1+MARKET.bullDmg*bullF())*skillMul(P.skills.bark,'bark')*classDmg());
  for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<R+(e.hw||6)){const l=d||1;damageEnemy(e,dmg,dx/l*1.5,dy/l*1.5);}} // radial knockback via damageEnemy
  enemies=enemies.filter(e=>!e.dead);
  for(let i=0;i<16;i++){const a=i/16*6.28;parts.push({x:P.x+Math.cos(a)*10,y:P.y+Math.sin(a)*10,vx:Math.cos(a)*130,vy:Math.sin(a)*130-10,life:0.4,col:i%2?'#e0a040':'#fff0c0'});}
  shake(0.22);sfx(90,0.3,'sawtooth',0.06,-40);sfx(170,0.18,'square',0.04);}
// ARCHER: ARROW VOLLEY (QUICK SHOT) — fires a 3-arrow fan (center + angled spread)
function quickShot(){if(noMp(SKILL_MP.archer))return;stopFish('REELED IN');P.mp-=SKILL_MP.archer;P.skills.bark++;const v=DIRV[P.dir],base=ANG[P.dir],dmg=Math.round((6+swordLv()*3+gatk())*(1+MARKET.bullDmg*bullF())*skillMul(P.skills.bark,'bark')*classDmg());
  for(const da of [0,-0.22,0.22]){const a=base+da;projs.push({x:P.x+v[0]*9,y:P.y-6+v[1]*9,vx:Math.round(Math.cos(a)*300),vy:Math.round(Math.sin(a)*300),life:0.85,kind:'arrow',dir:P.dir,dmg,hits:new Set()});}
  sfx(760,0.12,'triangle',0.045,-200);}
// HEALER: MEND — spend MP to heal HP (MP only refills by resting in camp or staff hits, D-028)
// Mission item 5: Healer heals itself AND other players (multiplayer pulse)
function mend(){if(noMp(SKILL_MP.healer))return;
  const allies=Object.values(net.peers).filter(p=>!p.dead&&p.h<100&&Math.hypot(p.x-P.x,p.y-P.y)<=72);
  if(P.hp>=P.maxHp&&!allies.length){toast('ALREADY FULL HP.',1.2);sfx(440,0.1,'sine',0.03);return;}
  stopFish('REELED IN');P.mp-=SKILL_MP.healer;P.skills.bark++;
  const heal=Math.round(20*skillMul(P.skills.bark,'bark'));P.hp=Math.min(P.maxHp,P.hp+heal);
  if(net.on&&net.ws&&net.ws.readyState===1)net.ws.send(JSON.stringify({t:'heal',id:net.id,amt:heal,x:Math.round(P.x),y:Math.round(P.y),r:72}));
  for(let i=0;i<10;i++)parts.push({x:P.x+(Math.random()*12-6),y:P.y+4+(Math.random()*8-4),vx:0,vy:-34,life:0.6,col:i%2?'#70f0b0':'#d8fff0'});
  floater(P.x,P.y-12,'+'+heal,'#80ffb0');sfx(620,0.14,'sine',0.05,220);sfx(880,0.2,'sine',0.04,180);}
function damageEnemy(e,dmg,kx,ky){
  if(P.lazy||P.lazyT>0){P.lazy=false;P.lazyT=0;P.idleT=0;toast('WARMED UP! BACK IN SHAPE.',2);}
  if(e.boss&&netLive()){netSend({t:'bhit',dmg:Math.round(dmg)});e.hp=Math.max(1,e.hp-dmg);e.flash=0.12;floater(e.x,e.y-42,dmg,'#ffffff');sfx(240,0.06,'square',0.05,-120);return;} // shared raid boss: relay owns HP + the kill
  e.hp-=dmg;e.flash=0.12;const ai=e.def.ai||e.type;const m=e.boss?0.15:ai==='brute'?(e.state==='dash'?0:0.45):1;e.kbx=kx*210*m;e.kby=ky*210*m;
  if(e.state==='wind'&&ai==='brute'&&dmg>=10){e.state='chase';e.cool=1.2;}
  floater(e.x,e.y-(e.boss?42:22),dmg,'#ffffff');sfx(240,0.06,'square',0.05,-120);
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  e.dead=true;puff(e.x,e.y-6,'#d8d8e8',14);sfx(180,0.25,'square',0.05,-150);
  const mat=e.def.mat||'whisk';
  if(Math.random()<(e.def.dropP??1))for(let i=0;i<e.def.drop;i++)items.push({x:e.x+R(-7,7),y:e.y+R(-4,4),kind:mat,life:18,t:Math.random()*3}); // D-055: drops are rare now
  if(Math.random()<0.25)items.push({x:e.x+R(-6,6),y:e.y+R(-4,4),kind:'steel',life:18,t:Math.random()*3}); // D-067: monsters drop iron (steel) too
  if(e.mini){toast('MINI-BOSS SLAIN! SUCH LOOT.',2.5);} // D-063: elite drops 6 materials (dropP 1) 
  if(state.stage===1){P.kills++;if(P.kills===8)toast('QUEST DONE! RETURN TO ELDER SHIBE');}
  if(state.stage===2&&e.type==='brute'){P.bruteKills++;if(P.bruteKills===3)toast('QUEST DONE! RETURN TO ELDER SHIBE');}
  if(e.boss){items.push({x:e.x,y:e.y,kind:'yarn',life:9999,t:0});state.won=true;state.bossT=BOSS_RESPAWN;if(state.stage<4)state.stage=4;winT=4.5;shake(0.6);puff(e.x,e.y-16,'#f0c030',30);sfx(400,1.2,'triangle',0.08,400);}
}
function shootBone(e,ux,uy,s){projs.push({x:e.x,y:e.y-(e.boss?16:7),vx:ux*s,vy:uy*s,life:2.6,kind:'bone',dmg:e.boss?9:5});sfx(900,0.04,'triangle',0.025,-300);}

// ================= ENEMY AI =================
function updEnemy(e,dt){
  const inCamp=playerInCamp();const d=dist(P.x,P.y,e.x,e.y);
  e.flash-=dt;e.cool-=dt;
  if(Math.abs(e.kbx)+Math.abs(e.kby)>6){move(e,e.kbx*dt,e.kby*dt);const k=Math.pow(0.002,dt);e.kbx*=k;e.kby*=k;return;}else{e.kbx=e.kby=0;}
  let aggro=!P.dead&&!inCamp&&d<e.def.chase;
  if(e.boss)aggro=!P.dead&&zoneOf(P.x,P.y)==='boss';
  if(e.zone==='boss'&&!e.boss)aggro=!P.dead&&!inCamp&&(zoneOf(P.x,P.y)==='boss'||d<e.def.chase);
  const ux=(P.x-e.x)/(d||1),uy=(P.y-e.y)/(d||1);
  const bs=1+MARKET.bearSpd*bearF();let mx=0,my=0,spd=e.def.spd*bs;
  if(e.state==='wind'){e.t-=dt;if(e.t<=0){e.state='dash';e.t=0.45;e.dx=ux;e.dy=uy;sfx(110,0.25,'sawtooth',0.06,-50);}}
  else if(e.state==='dash'){e.t-=dt;mx=e.dx;my=e.dy;spd=165*bs;if(e.t<=0){e.state='chase';e.cool=1.6;}}
  else if(aggro){
    e.state='chase';const ai=e.def.ai||e.type;
    if(ai==='archer'){if(d<62){mx=-ux;my=-uy;}else if(d>105){mx=ux;my=uy;}else{mx=-uy*0.6;my=ux*0.6;}if(e.cool<=0&&d<155){shootBone(e,ux,uy,95);e.cool=1.6+Math.random()*0.7;}}
    else if(ai==='brute'){mx=ux;my=uy;if(d<72&&e.cool<=0){e.state='wind';e.t=0.55;}}
    else if(e.boss){mx=ux;my=uy;const enr=e.hp<e.maxHp/2;if(d<30){mx=-ux*0.3;my=-uy*0.3;}
      if(e.cool<=0){const a0=Math.atan2(uy,ux),n=enr?7:5;for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*0.3;shootBone(e,Math.cos(a),Math.sin(a),88);}e.cool=enr?1.7:2.5;}
      if(enr){spd=52;e.summonT-=dt;if(e.summonT<=0){e.summonT=8;summon(e);}}}
    else{mx=ux;my=uy;}
  }else{
    e.state='wander';e.t-=dt;
    if(e.t<=0){e.t=1+Math.random()*2;if(Math.random()<0.4){e.wx=0;e.wy=0;}else{const a=Math.random()*6.283;e.wx=Math.cos(a);e.wy=Math.sin(a);}}
    mx=e.wx;my=e.wy;spd*=0.45;
  }
  if(mx||my){const hw=move(e,mx*spd*dt,my*spd*dt);e.dir=dirOf(mx,my);e.anim+=dt;
    if(hw&&e.state==='wander')e.t=0;
    if(hw&&e.state==='dash'){e.state='chase';e.cool=1.6;shake(0.15);puff(e.x,e.y,'#a89070',6);}}
  if(aggro&&((e.def.ai||e.type)==='archer'||e.state==='wind'))e.dir=dirOf(ux,uy);
  if(!P.dead&&!inCamp&&overlap(e,P,2))hurtPlayer(e.state==='dash'?Math.round(e.def.dmg*1.4):e.def.dmg,e);
}

// ================= CHAIN (DogeOS Chikyu testnet, EIP-1193, no library) =================
// Verified 2026-11-07: eth_chainId on CHAIN.rpc returns 0x5fdaf3 (6281971). The game makes NO network call
// itself: everything goes through the player's wallet (window.ethereum), and only after they press CONNECT.
const CHAIN={id:'0x5fdaf3',name:'DogeOS Chikyu Testnet',rpc:'https://rpc.testnet.dogeos.com',explorer:'https://dogeos-testnet.l2scan.co',faucet:'FAUCET.TESTNET.DOGEOS.COM'};
const wallet={connected:false,addr:null,bal:null,chainOk:false,busy:false,msg:'',hooked:false};
function eth(){try{if(typeof window==='undefined')return null;const e=window.ethereum,ps=e&&Array.isArray(e.providers)&&e.providers.length?e.providers:null;return ps?(ps.find(p=>p&&p.isMetaMask&&!p.isTron&&!p.isTronLink)||ps.find(p=>p&&!p.isTron&&!p.isTronLink)||e):(e||(window.bitkeep&&window.bitkeep.ethereum)||null);}catch(e){return null;}} // D-080: with several wallets injected prefer MetaMask/EVM, skip TRON multichain aggregators (CAIP-25 tron scope); Bitget = window.bitkeep.ethereum
const shortAddr=a=>a?a.slice(0,6)+'..'+a.slice(-4):'';
const fmtD=n=>typeof n==='number'?(n>=1000?Math.floor(n):n%1===0?n:Number(n.toFixed(2))):n;
function walletErr(err){const c=err&&err.code;if(c===4001)return 'YOU REJECTED IT IN THE WALLET.';if(c===-32002)return 'WALLET REQUEST PENDING. OPEN YOUR WALLET.';return 'WALLET ERROR: '+String((err&&err.message)||err).slice(0,40).toUpperCase();}
function setWalletMsg(m){wallet.msg=m;if(ui&&ui.type==='menu'&&ui.chain)ui.msg=m;}
async function switchChain(){
  const e=eth();
  try{await e.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN.id}]});}
  catch(err){
    if(err&&err.code===4001)throw err;
    // 4902 = chain unknown to the wallet (some wallets report it as -32603 or only in the message): add it, which also switches
    await e.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN.id,chainName:CHAIN.name,nativeCurrency:{name:'Dogecoin',symbol:'DOGE',decimals:18},rpcUrls:[CHAIN.rpc],blockExplorerUrls:CHAIN.explorer?[CHAIN.explorer]:null}]});
  }
  wallet.chainOk=String(await e.request({method:'eth_chainId'})).toLowerCase()===CHAIN.id;
}
async function refreshBal(){if(!wallet.addr||!wallet.chainOk){wallet.bal=null;return;}const h=await eth().request({method:'eth_getBalance',params:[wallet.addr,'latest']});wallet.bal=Number(BigInt(h)/10n**14n)/1e4;}
function hookWallet(e){if(wallet.hooked||!e.on)return;wallet.hooked=true;
  e.on('accountsChanged',a=>{if(!a||!a.length)disconnectWallet('WALLET DISCONNECTED.');else{wallet.addr=a[0];resetChainData();refreshChain().catch(()=>{});refreshBal().catch(()=>{});}});
  e.on('chainChanged',id=>{wallet.chainOk=String(id).toLowerCase()===CHAIN.id;resetChainData();refreshBal().catch(()=>{});if(wallet.chainOk){refreshChain().catch(()=>{});refreshOracle();}else setWalletMsg('WRONG NETWORK. PICK CONNECT TO SWITCH BACK.');});}
async function connectWallet(){
  const e=eth();if(!e){setWalletMsg('NO WALLET FOUND. GAME STILL WORKS OFFLINE.');return false;}
  if(wallet.busy)return false;wallet.busy=true;setWalletMsg('CHECK YOUR WALLET...');
  try{
    const acc=await e.request({method:'eth_requestAccounts'});if(!acc||!acc.length)throw new Error('no account');
    wallet.addr=acc[0];hookWallet(e);
    await switchChain();await refreshBal();
    wallet.connected=true;refreshChain().catch(e=>setWalletMsg(walletErr(e)));refreshOracle();setWalletMsg(wallet.chainOk?`CONNECTED TO ${DEV_LOCAL?'LOCAL ANVIL':'CHIKYU'}. SUCH CHAIN. WOW.`:'CONNECTED, BUT ON THE WRONG NETWORK.');
    return true;
  }catch(err){setWalletMsg(walletErr(err));return false;}
  finally{wallet.busy=false;}
}
function disconnectWallet(m){resetChainData();wallet.connected=false;wallet.addr=null;wallet.bal=null;wallet.chainOk=false;setWalletMsg(m||'DISCONNECTED. YOUR NFTS STAY ON CHAIN.');
  const e=eth();if(e)e.request({method:'wallet_revokePermissions',params:[{eth_accounts:{}}]}).catch(()=>{});}
let chainT=0;
function chainTick(dt){if(!wallet.connected||wallet.busy)return;chainT+=dt;if(chainT<15)return;chainT=0;refreshBal().catch(()=>{});if(oracleStale())refreshOracle().catch(()=>{});}
async function checkAuthWallet(){const e=eth();if(!e||wallet.connected)return;try{const acc=await e.request({method:'eth_accounts'});if(acc&&acc.length){wallet.addr=acc[0];hookWallet(e);wallet.chainOk=String(await e.request({method:'eth_chainId'})).toLowerCase()===CHAIN.id;if(wallet.chainOk){wallet.connected=true;await refreshBal();refreshChain().catch(()=>{});refreshOracle();}}}catch(e){}}
function walletRows(){
  if(!eth())return [{label:'WALLET: OFFLINE (PLAY FREE, NO DOGE NEEDED)',act:()=>'NO WALLET. INSTALL METAMASK + OPEN VIA LOCALHOST.'}];
  if(!wallet.connected)return [{label:wallet.busy?'CONNECTING... CHECK YOUR WALLET':'CONNECT WALLET (DOGEOS CHIKYU TESTNET)',act:()=>{connectWallet();return 'CHECK YOUR WALLET...';}}];
  return [{label:wallet.chainOk?`WALLET ${shortAddr(wallet.addr)} ${wallet.bal==null?'?':wallet.bal} DOGE`:'WRONG NETWORK - SWITCH TO CHIKYU',act:()=>{(wallet.chainOk?refreshBal():switchChain().then(refreshBal)).then(()=>setWalletMsg(`${wallet.bal} TEST DOGE. FAUCET: ${CHAIN.faucet}`)).catch(err=>setWalletMsg(walletErr(err)));return 'REFRESHING...';}}];
}
// ---- on-chain items (D-019): DogeItems + DogeDEX via precomputed selectors (`cast sig`), raw ABI, no library ----
// dev: open with ?chain=local to use a local anvil chain (contracts/README.md); Chikyu addresses go in CONTRACTS after deploy
const DEV_LOCAL=(()=>{try{return /[?&]chain=local\b/.test(location.search);}catch(e){return false;}})();
const MASTER_ADDR='0x7be839793765f18e36cc97b5312d094f6ae282ca';
const isMod=()=>!!(wallet.connected&&wallet.addr&&wallet.addr.toLowerCase()===MASTER_ADDR); // D-111 (user): mod mode ONLY for the master wallet; no ?mod=1 URL switch
if(DEV_LOCAL)Object.assign(CHAIN,{id:'0x7a69',name:'Anvil Local (DOGEON dev)',rpc:'http://127.0.0.1:8545',explorer:''});
const CONTRACTS={'0x5fdaf3':{items:'0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4',dex:'0x6E26235E3b359f9b78e5c420e8AfdF4140EE7590',prof:'0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055',stake:'0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d'},'0x7a69':{items:'0x5FbDB2315678afecb367f032d93F642f64180aa3',dex:'0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',prof:'',stake:''}};
const SEL={mint:'352926a8',withdrawFees:'476343ee',burn:'42966c68',inventoryOf:'7eaebb15',mintFee:'13966db5',setApprovalForAll:'a22cb465',isApprovedForAll:'e985e9c5',list:'50fd7367',delist:'964bc33f',buy:'d96a094a',activeListings:'aa4df6f0',listedCount:'f36065b3',addLiquidity:'c5bb3168',removeLiquidity:'f88bf15a',buyFromPool:'66c1dbf3',sellToPool:'0de77491',withdraw:'3ccfd60b',dogeUsd:'435a3613',proceeds:'35adde54',allPools:'c5c63e65',poolInfo:'81ea4ee7',chooseProf:'f94e349d',professionOf:'31544fd8',profFee:'ddca3f43',stakeDoge:'3a4b66f1',unstakeDoge:'2e17de78',claimStake:'4e71d92d',pendingRewards:'31d7a262',stakedOf:'98807d84',flushFees:'6811406e',stakerFeesView:'67f7cf97'};
const ITEM_TYPES={1:'HAMMER',2:'ARMOR',3:'RAW FISH',4:'COOKED FISH',5:'BONE CHARM',6:'MOON BISCUIT',7:'DOGE SWORD',8:'DOGE LEATHER ARMOR',9:'DOGE SHIELD',10:'DOGE STAFF',11:'DOGE ROBE',12:'DOGE WHIP',13:'DOGE BOW',14:'DOGE HEMP SHIRT',15:'DOGE QUIVER'},FOOD_TYPE={raw_fish:3,cooked_fish:4},TYPE_FOOD={3:'raw_fish',4:'cooked_fish'};
const PRICES=[0.1,0.25,0.5,1,2,5,10,25,50],LIST_PAGE=100,LIST_MAX=500; // sell / LP presets in DOGE, picked with A/D in the market menu
const W32=n=>BigInt(n).toString(16).padStart(64,'0'),A32=a=>String(a).toLowerCase().replace(/^0x/,'').padStart(64,'0');
const words=h=>{h=String(h||'0x').replace(/^0x/,'');const o=[];for(let i=0;i+64<=h.length;i+=64)o.push(BigInt('0x'+h.slice(i,i+64)));return o;};
function arrAt(w,slot){const off=Number(w[slot]/32n),n=Number(w[off]);return w.slice(off+1,off+1+n);} // dynamic array whose byte offset sits in head word `slot`
const toWei=d=>BigInt(Math.round(d*1e4))*10n**14n,fromWei=w=>Number(BigInt(w)/10n**14n)/1e4;
const unpack=p=>({id:Number(p>>16n),type:Number((p>>8n)&255n),level:Number(p&255n)});
const itemName=it=>(ITEM_TYPES[it.type]||'ITEM')+(it.type<=2?' LV'+it.level:'');
const addrs=()=>CONTRACTS[CHAIN.id]||{};
const chainReady=()=>wallet.connected&&wallet.chainOk&&!!addrs().items&&!!addrs().dex;
const chainData={inv:[],listings:[],pools:[],proceeds:0n,fee:10n**18n,profession:0,profFee:5n*10n**16n,staked:0n,rewards:0n,dexFees:0n,approved:false,loaded:false};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function resetChainData(){Object.assign(chainData,{inv:[],listings:[],pools:[],proceeds:0n,fee:10n**18n,profession:0,profFee:5n*10n**16n,staked:0n,rewards:0n,dexFees:0n,approved:false,loaded:false});}
async function ecall(to,data){const r=await eth().request({method:'eth_call',params:[{to,data:'0x'+data},'latest']});if(!r||r==='0x')throw new Error('NO CONTRACT THERE. DEPLOY FIRST (CONTRACTS/README)');return r;}
async function etx(to,data,value){
  const h=await eth().request({method:'eth_sendTransaction',params:[{from:wallet.addr,to,data:'0x'+data,value:'0x'+BigInt(value||0).toString(16)}]});
  setWalletMsg('TX '+String(h).slice(0,10)+'.. MINING, MUCH WAIT');
  const fail=(m,rev)=>Object.assign(new Error(m),{sent:true,reverted:!!rev,hash:h});
  for(let i=0;i<200;i++){let r;try{r=await eth().request({method:'eth_getTransactionReceipt',params:[h]});}catch(e){throw fail('TX SENT, STATUS UNKNOWN. CHECK THE EXPLORER');}
    if(r){if(r.status==='0x1'||r.status===1)return r;throw fail('TX REVERTED',true);}await sleep(1500);}
  throw fail('TX NOT MINED YET, CHECK THE EXPLORER');
}
async function refreshChain(){
  if(!chainReady())return;const c=addrs(),me=wallet.addr;
  const [inv,lst,pls,pr,fee,ap]=await Promise.all([ecall(c.items,SEL.inventoryOf+A32(me)),ecall(c.dex,SEL.listedCount),ecall(c.dex,SEL.allPools),
    ecall(c.dex,SEL.proceeds+A32(me)),ecall(c.items,SEL.mintFee),ecall(c.items,SEL.isApprovedForAll+A32(me)+A32(c.dex))]);
  if(!chainReady()||wallet.addr!==me)return;
  chainData.inv=arrAt(words(inv),0).map(unpack);
  const nList=Number(words(lst)[0]||0n),listings=[]; // paginated reads (audit D-022)
  for(let off=0;off<nList&&off<LIST_MAX;off+=LIST_PAGE){const lw=words(await ecall(c.dex,SEL.activeListings+W32(off)+W32(LIST_PAGE))),lp=arrAt(lw,0),lpr=arrAt(lw,1),ls=arrAt(lw,2);
    lp.forEach((p,i)=>listings.push({...unpack(p),price:lpr[i],mine:ls[i]===BigInt(me)}));}
  chainData.listings=listings;
  const keys=arrAt(words(pls),0),pools=[];
  for(const k of keys){const w=words(await ecall(c.dex,SEL.poolInfo+W32(k)+A32(me)));pools.push({key:k,type:Number(k>>8n),level:Number(k&255n),doge:w[0],n:Number(w[1]),shares:w[2],mine:w[3],buy:w[4],sell:w[5]});}
  chainData.pools=pools;chainData.proceeds=words(pr)[0]||0n;chainData.fee=words(fee)[0]||0n;chainData.approved=(words(ap)[0]||0n)===1n;
  if(c.prof){try{const [pw,pf]=await Promise.all([ecall(c.prof,SEL.professionOf+A32(me)),ecall(c.prof,SEL.profFee)]); // D-028 profession registry (optional until deployed)
    chainData.profession=Number(words(pw)[0]||0n);chainData.profFee=words(pf)[0]||0n;
    if(chainData.profession&&CLASS_IDS[chainData.profession])applyClass(CLASS_IDS[chainData.profession],true);}catch(e){}}
  if(c.stake){try{const [sk,rw,df]=await Promise.all([ecall(c.stake,SEL.stakedOf+A32(me)),ecall(c.stake,SEL.pendingRewards+A32(me)),ecall(c.dex,SEL.stakerFeesView)]); // D-030 staking (optional until deployed)
    chainData.staked=words(sk)[0]||0n;chainData.rewards=words(rw)[0]||0n;chainData.dexFees=words(df)[0]||0n;}catch(e){}}
  if(!chainReady()||wallet.addr!==me)return;
  chainData.loaded=true;syncMaxHp();syncMaxMp();
  await refreshBal();
}
// Phase 5 (D-028): claim your class on-chain. One per wallet forever; pays profFee DOGE + gas. Local pick stays free when offline.
function chooseProfession(cls){const c=CLASSES[cls];if(!c)return;if(chainReady()&&addrs().prof&&!chainData.loaded){refreshChain().catch(()=>{});return setWalletMsg('READING THE OATH FEE... TRY AGAIN.');} // D-112 S2-7
  
  if(!chainReady()||!addrs().prof){applyClass(cls,false);setWalletMsg(`YOU TRAIN AS A ${c.name} (LOCAL). SPACE=${cls==='archer'?'ARROWS':cls==='healer'?'STAFF':'CLEAVE'}!`);return;} // offline / registry not here: free local pick (game stays playable with no wallet)
  if(chainData.profession&&!isMod()){setWalletMsg(`THIS WALLET IS LOCKED IN AS A ${CLASSES[CLASS_IDS[chainData.profession]].name}. ONE CLASS PER WALLET.`);return;}
  return chainAct(`YOU ARE NOW A ${c.name}, SWORN ON-CHAIN. SUCH OATH.`,async()=>{await etx(addrs().prof,SEL.chooseProf+W32(c.id),chainData.profFee);applyClass(cls,true);});}
// Phase 5 (D-030): on-chain DOGE staking — stake real testnet DOGE, earn the holders' 0.8% share of every DEX trade
function stakeDoge(doge){if(!addrs().stake)return setWalletMsg('STAKING NOT DEPLOYED ON THIS CHAIN YET.');return chainAct(`STAKED ${doge} TESTNET DOGE. YOU SHARE THE FEES. NO REAL VALUE.`,()=>etx(addrs().stake,SEL.stakeDoge,toWei(doge)));}
function unstakeStake(){if(!(chainData.staked>0n))return setWalletMsg('NOTHING STAKED.');return chainAct('UNSTAKED. DOGE BACK IN YOUR WALLET.',()=>etx(addrs().stake,SEL.unstakeDoge+W32(chainData.staked),0));}
function claimStakeRewards(){if(!(chainData.rewards>0n))return setWalletMsg('NO REWARDS YET. THEY COME ONLY FROM FEES OTHERS PAY.');return chainAct('CLAIMED YOUR SHARE OF THE FEES. SUCH TESTNET.',()=>etx(addrs().stake,SEL.claimStake,0));}
function syncDexFees(){if(!(chainData.dexFees>0n))return setWalletMsg('NO UNSYNCED DEX FEES RIGHT NOW.');return chainAct('DEX FEES SENT TO THE STAKERS. MUCH SHARE.',()=>etx(addrs().dex,SEL.flushFees,0));}
// one chain action at a time; every result lands in the open menu via setWalletMsg
async function chainAct(done,fn){
  if(wallet.busy){setWalletMsg('WAIT, A TRANSACTION IS RUNNING.');return false;}
  if(!chainReady()){setWalletMsg('CONNECT AT THE SPHINX (DOGEOS CHIKYU) FIRST.');return false;}
  wallet.busy=true;setWalletMsg('CONFIRM IN YOUR WALLET...');
  try{await fn();await refreshChain().catch(()=>{});setWalletMsg(done);sfx(990,0.12,'triangle',0.05,300);return true;}
  catch(err){setWalletMsg(walletErr(err));return false;}
  finally{wallet.busy=false;cv.focus();}
}
async function ensureApproved(){if(chainData.approved)return;setWalletMsg('STEP 1/2: LET THE SPHINX MOVE YOUR NFTS...');await etx(addrs().items,SEL.setApprovalForAll+A32(addrs().dex)+W32(1),0);chainData.approved=true;setWalletMsg('STEP 2/2: CONFIRM IN YOUR WALLET...');}
const keyOfIt=it=>(BigInt(it.type)<<8n)|BigInt(it.level);
const myFree=()=>chainData.inv; // inventoryOf only returns NFTs in the wallet (escrowed ones belong to the DEX)
// owning a gear NFT = wearing it (D-019). Sold or listed NFTs stop counting at the next refresh.
function nftBest(type){if(!chainReady())return 0;let b=0;for(const it of chainData.inv)if(it.type===type&&it.level>b)b=it.level;return b;}
const swordLv=()=>Math.max(P.sword,Math.min(4,nftBest(1))),armorLv=()=>Math.max(P.armor,Math.min(2,nftBest(2)));
// D-060 gear stats: owning a DOGE gear NFT (types 7-15) = wearing it. Any class may wield any; bonuses sum. Only when connected.
const GEAR_STATS={7:{atk:4},8:{def:0.08,hp:15},9:{def:0.12},10:{mp:15},11:{def:0.05,mp:10},12:{atk:3,mp:5},13:{atk:4},14:{def:0.06,hp:10},15:{mp:12}};
// D-064 random loot: every minted item carries a rarity + buff, rolled deterministically from its on-chain tokenId (no
// redeploy — every client computes the same roll). Rarity scales the buff; even a COMMON can roll a huge MEME buff → mint bait.
const RARITY=[{n:'COMMON',w:60,mult:1,col:'#c8c8d0'},{n:'UNCOMMON',w:25,mult:1.5,col:'#60e060'},{n:'RARE',w:10,mult:2.3,col:'#60a0ff'},{n:'EPIC',w:4,mult:3.6,col:'#c080ff'},{n:'LEGENDARY',w:1,mult:6,col:'#ffc040'}];
const BUFFS=[{n:'SHARP',s:'atk',v:3},{n:'TOUGH',s:'def',v:0.06},{n:'HEARTY',s:'hp',v:12},{n:'WISE',s:'mp',v:10},
  {n:'MUCH DMG WOW',s:'atk',v:14,meme:1},{n:'SUCH HEAL',s:'hp',v:45,meme:1},{n:'BIG BRAIN',s:'mp',v:40,meme:1},{n:'DIAMOND PAWS',s:'def',v:0.22,meme:1},{n:'STONKS',s:'atk',v:9,meme:1},
  {n:'BLAZE 420',s:'hp',v:420,meme:1},{n:'NICE 69',s:'atk',v:69,meme:1},{n:'LUCKY 777',s:'hp',v:77,meme:1},{n:'MUCH 4.2',s:'def',v:0.42,meme:1},{n:'SPEED 6.9',s:'atk',v:6.9,meme:1},
  {n:'CURSED 69',s:'atk',v:-6.9,meme:1,curse:1},{n:'PAPER 4.2',s:'def',v:-0.42,meme:1,curse:1},{n:'HANGOVER 420',s:'hp',v:-42,meme:1,curse:1}];
function itemRoll(id){id=Number(id)||0;let h=(id*2654435761)>>>0,acc=0,rar=RARITY[RARITY.length-1];for(const t of RARITY){acc+=t.w;if(h%100<acc){rar=t;break;}}const buff=BUFFS[Math.floor(h/97)%BUFFS.length];return {rar,buff,amount:buff.v*rar.mult,label:`${rar.n}: ${buff.n}`};}
function gearStats(){const s={atk:0,def:0,hp:0,mp:0};if(!chainReady())return s;for(const it of chainData.inv){const g=GEAR_STATS[it.type];if(g){s.atk+=g.atk||0;s.def+=g.def||0;s.hp+=g.hp||0;s.mp+=g.mp||0;}if(it.type!==3&&it.type!==4){const r=itemRoll(it.id);s[r.buff.s]+=r.amount;}}s.atk=Math.max(-4,s.atk);s.def=Math.max(-0.25,s.def);return s;} // non-food items also add their random rolled buff
const gatk=()=>gearStats().atk;
function addCredit(t,l){const k=t+':'+l;P.credits[k]=(P.credits[k]||0)+1;}
// minting moves a crafted item onto the chain, so its off-chain effect goes away (one craft = one item, D-021)
function creditOk(t,l){if(!(P.credits[t+':'+l]>0))return false;if(t===1)return P.sword===l;if(t===2)return P.armor===l;if(t===5)return P.hpUps>0;if(t===6)return P.mpUps>0;return true;}
function takeOffChain(t,l){if(t===1)P.sword=Math.max(1,l-1);else if(t===2)P.armor=l-1;else if(t===5){P.hpUps--;P.maxHp-=15;P.hp=Math.min(P.hp,P.maxHp);}else if(t===6){P.mpUps--;P.maxMp-=10;P.mp=Math.min(P.mp,P.maxMp);}}
function putBack(t,l){if(t===1)P.sword=l;else if(t===2)P.armor=l;else if(t===5){P.hpUps++;P.maxHp+=15;}else if(t===6){P.mpUps++;P.maxMp+=10;}}
function mintNft(type,level,src){if(!chainData.loaded){refreshChain().catch(()=>{});return setWalletMsg('READING THE MINT FEE... TRY AGAIN IN A SECOND.');} // D-112 S2-7 // D-104 SPEND -> GET: src is 'credit' (crafted at the forge = materials burned) or a caught bag food; never nothing
  return chainAct(`MINTED ${itemName({type,level})} NFT! TO THE MOON.`,async()=>{
    const k=type+':'+level;
    if(!src||(src!=='credit'&&!FOOD_TYPE[src]))throw new Error('CRAFT IT AT THE FORGE FIRST: EVERY MINT SPENDS MATERIALS');
    if(src==='credit'){if(!creditOk(type,level))throw new Error('CRAFT IT FIRST AND KEEP IT EQUIPPED');P.credits[k]--;takeOffChain(type,level);}
    else if(!bagRemove(src,1))throw new Error('NOT IN YOUR BAG');
    try{await etx(addrs().items,SEL.mint+A32(wallet.addr)+W32(type)+W32(level),chainData.fee);}
    catch(e){if(!e.sent||e.reverted){if(src==='credit'){P.credits[k]++;putBack(type,level);}else if(!addToBag(src,1))items.push({x:P.x,y:P.y,kind:src,life:60,t:0});}throw e;} // unknown outcome: no refund (no dupes)
  });}
function useNft(it){ // eat food / drink charm: burns the NFT, then applies the effect
  const food=TYPE_FOOD[it.type];
  if(food&&P.hp>=P.maxHp){setWalletMsg('HP IS FULL ALREADY.');return;}
  if(it.type===5&&P.hpUps>=3||it.type===6&&P.mpUps>=2){setWalletMsg('MAXED ALREADY. SELL IT AT THE SPHINX.');return;}
  chainAct(`USED ${itemName(it)} #${it.id}. SUCH NOM.`,async()=>{await etx(addrs().items,SEL.burn+W32(it.id),0);
    if(food)P.hp=Math.min(P.maxHp,P.hp+FOODS[food].heal);else if(it.type===5){if(P.hpUps<3){P.hpUps++;P.maxHp+=15;}}else if(it.type===6){if(P.mpUps<2){P.mpUps++;P.maxMp+=10;}}});}
function burnAndReroll(it){if(!chainData.loaded)return setWalletMsg('READING THE MINT FEE... TRY AGAIN.');return chainAct(`BURNED #${it.id} & RE-ROLLED ${itemName(it)}!`,async()=>{await etx(addrs().items,SEL.burn+W32(it.id),0);await etx(addrs().items,SEL.mint+A32(wallet.addr)+W32(it.type)+W32(it.level),chainData.fee);});}
const dex=()=>addrs().dex;
function listNft(it,priceDoge){return chainAct(`LISTED #${it.id} FOR ${priceDoge} DOGE.`,async()=>{await ensureApproved();await etx(dex(),SEL.list+W32(it.id)+W32(toWei(priceDoge)),0);});}
function delistNft(l){return chainAct(`DELISTED #${l.id}.`,()=>etx(dex(),SEL.delist+W32(l.id),0));}
function buyListing(l){return chainAct(`BOUGHT ${itemName(l)} #${l.id}! WOW.`,()=>etx(dex(),SEL.buy+W32(l.id),l.price));}
// minShares = 99% of what the pool you are looking at would mint (0 for a new pool): a front-run or rounding to 0 reverts (audit D-022)
function addLp(ids,wei,p){const live=p&&p.shares>0n&&p.n>0,min=live?(p.shares*BigInt(ids.length)/BigInt(p.n))*99n/100n:0n;
  return chainAct(`LP ADDED: ${ids.length} ITEMS. YOU ARE THE MARKET.`,async()=>{await ensureApproved();
  await etx(dex(),SEL.addLiquidity+W32(64)+W32(min)+W32(ids.length)+ids.map(W32).join(''),wei);});}
function removeLp(p){const minItems=BigInt(p.n)*p.mine/p.shares,minDoge=(p.doge*p.mine/p.shares)*99n/100n; // slippage guard (audit D-022)
  return chainAct('LP REMOVED. DOGE IS IN YOUR PROCEEDS.',()=>etx(dex(),SEL.removeLiquidity+W32(p.key)+W32(p.mine)+W32(minItems)+W32(minDoge),0));}
function buyPool(p){return chainAct(`SWAPPED ${fromWei(p.buy)} DOGE FOR 1 ${itemName(p)}.`,()=>etx(dex(),SEL.buyFromPool+W32(p.key),p.buy));}
function sellPool(it,p){return chainAct(`SOLD #${it.id} FOR ${fromWei(p.sell)} DOGE (IN PROCEEDS).`,async()=>{await ensureApproved();await etx(dex(),SEL.sellToPool+W32(it.id)+W32(p.sell),0);});}
function withdrawProceeds(){return chainAct('PROCEEDS SENT TO YOUR WALLET.',()=>etx(dex(),SEL.withdraw,0));}
function chainBlockRow(){if(!eth())return 'NO WALLET: ON-CHAIN ITEMS NEED METAMASK.';if(!wallet.connected)return 'CONNECT YOUR WALLET AT THE SPHINX FIRST.';if(!wallet.chainOk)return 'WRONG NETWORK. SWITCH AT THE SPHINX.';if(!addrs().items)return 'NFT CONTRACTS NOT DEPLOYED ON CHIKYU YET.';return null;}
const MINTABLE=[{type:1,level:2},{type:1,level:3},{type:1,level:4},{type:2,level:1},{type:2,level:2},{type:3,level:1},{type:4,level:1},{type:5,level:1},{type:6,level:1},{type:7,level:1},{type:8,level:1},{type:9,level:1},{type:10,level:1},{type:11,level:1},{type:12,level:1},{type:13,level:1},{type:14,level:1},{type:15,level:1}];
const mktUI={price:{},lp:{},mint:0}; // per-row preset index for the market menu (NOT mkt = price sim)
const stakeUI={amt:3}; // preset index (PRICES) for the on-chain staking amount (D-030)
// Phase 5 (D-030): on-chain DOGE staking menu — stake real DOGE, earn the holders' 0.8% share of DEX fees
function stakeMenu(n){openMenu(n,'DOGE STAKING (TESTNET, NOT ADVICE)',()=>{
  if(!chainReady())return [...walletRows(),{label:'CONNECT YOUR WALLET TO STAKE',act:()=>'CONNECT AT THE SPHINX (DOGEOS CHIKYU) FIRST.'},{label:'BACK',act:()=>{bankMenu(n);return '';}}];
  if(!addrs().stake)return [{label:'STAKING NOT DEPLOYED ON THIS CHAIN YET',act:()=>'DEPLOY THE STAKING CONTRACT (CONTRACTS/README), THEN APPLY-DEPLOYMENT.'},{label:'BACK',act:()=>{bankMenu(n);return '';}}];
  const amt=PRICES[stakeUI.amt],o=[
    {label:`STAKE < ${amt} > TESTNET DOGE`,adj:d=>{stakeUI.amt=Math.max(0,Math.min(PRICES.length-1,stakeUI.amt+d));},act:()=>{stakeDoge(amt);return wallet.msg;}},
    {label:`YOUR STAKE: ${fromWei(chainData.staked)} DOGE`,act:()=>'STAKERS SHARE 0.8% OF EVERY DEX TRADE + 80% OF MINT FEES. NO REAL VALUE.'},
    {label:`PENDING REWARDS: ${fromWei(chainData.rewards)} DOGE (CLAIM)`,act:()=>{claimStakeRewards();return wallet.msg;}}];
  if(chainData.staked>0n)o.push({label:`UNSTAKE ALL (${fromWei(chainData.staked)} DOGE)`,act:()=>{unstakeStake();return wallet.msg;}});
  if(chainData.dexFees>0n)o.push({label:`SYNC DEX FEES TO STAKERS (${fromWei(chainData.dexFees)} DOGE)`,act:()=>{syncDexFees();return wallet.msg;}});
  o.push({label:'SEND MINT FEES TO STAKERS (80%)',act:()=>{chainAct('MINT FEES SENT: 80% STAKERS, 20% TREASURY.',()=>etx(addrs().items,SEL.withdrawFees,0));return wallet.msg;}}); // D-111 S2-6: DogeItems.withdrawFees() is public
  o.push({label:'REFRESH',act:()=>{refreshChain().then(()=>setWalletMsg('STAKING REFRESHED.')).catch(e=>setWalletMsg(walletErr(e)));return 'REFRESHING...';}});
  o.push({label:'BACK',act:()=>{bankMenu(n);return '';}});return o;});ui.chain=true;refreshChain().catch(()=>{});}
function marketMenu(n){openMenu(n,'DOGEON POOL DEX: MINT, SWAP & LP',()=>{const o=[],blk=chainBlockRow();
  if(blk){o.push({label:blk,act:()=>'SEE CONTRACTS/README.MD TO DEPLOY.'});o.push({label:'BACK',act:()=>{bankMenu(n);return '';}});return o;}
  const mr=mintRows();o.push(...(mr.length?mr:[{label:'NOTHING TO MINT: CRAFT AT FORGE OR CATCH FISH',act:()=>'EVERY MINT SPENDS MATERIALS + 1 DOGE. CRAFT GEAR AT WRENCHPAW FIRST.'}])); // D-104
  const inv=myFree(),invTxt=inv.length?inv.slice(0,2).map(it=>'#'+it.id+' '+itemName(it)).join(', ')+(inv.length>2?' +MORE':''):'NONE YET - CRAFT, THEN MINT';
  o.push({label:`WALLET ITEMS (${inv.length}): ${invTxt}`,act:()=>inv.length?inv.slice(0,4).map(it=>`#${it.id} ${itemName(it)} [${itemRoll(it.id).label}]`).join(' | '):'MINT AN ITEM ABOVE TO ROLL A RARITY + BUFF.'}); // D-064: show each item's rolled rarity + buff
  if(!chainData.loaded)o.push({label:'LOADING THE CHAIN...',act:()=>{refreshChain().catch(()=>{});return 'REFRESHING...';}});
  if(chainData.proceeds>0n)o.push({label:`WITHDRAW PROCEEDS: ${fromWei(chainData.proceeds)} DOGE`,act:()=>{withdrawProceeds();return wallet.msg;}});
  for(const l of chainData.listings)o.push(l.mine?{label:`DELIST ${itemName(l)} #${l.id} (YOURS, ${fromWei(l.price)})`,act:()=>{delistNft(l);return wallet.msg;}}
    :{label:`BUY ${itemName(l)} #${l.id} FOR ${fromWei(l.price)} DOGE`,act:()=>{buyListing(l);return wallet.msg;}});
  for(const p of chainData.pools){if(p.shares===0n)continue;const mine=myFree().filter(it=>keyOfIt(it)===p.key),lp=p.shares?Math.round(Number(p.mine*1000n/p.shares))/10:0,spot=fromWei(p.doge)/Math.max(1,p.n); // D-038: LP share % + price impact vs spot (<=50 chars)
    o.push({label:`POOL ${itemName(p)}: ${p.n} ITEMS / ${fromWei(p.doge)} DOGE (LP ${lp}%)`,act:()=>`SPOT ${spot.toFixed(3)} DOGE. YOUR SHARE ${lp}%.`});
    if(p.buy>0n){const bi=spot>0?Math.max(0,Math.round((fromWei(p.buy)/spot-1)*100)):0;o.push({label:` SWAP ${fromWei(p.buy)} DOGE -> 1 ${itemName(p)} (+${bi}%)`,act:()=>{buyPool(p);return wallet.msg;}});}
    if(mine.length&&p.sell>0n){const si=spot>0?Math.max(0,Math.round((1-fromWei(p.sell)/spot)*100)):0;o.push({label:` SWAP 1 ${itemName(p)} -> ${fromWei(p.sell)} DOGE (-${si}%)`,act:()=>{sellPool(mine[0],p);return wallet.msg;}});}
    if(mine.length&&p.n>0){const need=(BigInt(mine.length)*p.doge+BigInt(p.n-1))/BigInt(p.n);
      o.push({label:` ADD ${mine.length} ITEMS + ${fromWei(need)} DOGE AS LP`,act:()=>{addLp(mine.map(it=>it.id),need,p);return wallet.msg;}});}
    if(p.mine>0n)o.push({label:` REMOVE MY LP (${Math.round(Number(p.mine*1000n/p.shares))/10}%)`,act:()=>{removeLp(p);return wallet.msg;}});}
  const poolKeys=new Set(chainData.pools.filter(p=>p.shares>0n).map(p=>p.key)),groups={};
  for(const it of myFree()){const k=String(keyOfIt(it));if(!poolKeys.has(keyOfIt(it)))(groups[k]=groups[k]||[]).push(it);
    const pi=mktUI.price[it.id]??3,price=PRICES[pi];
    o.push({label:`SELL #${it.id} ${itemName(it)} FOR < ${price} > DOGE`,adj:d=>{mktUI.price[it.id]=Math.max(0,Math.min(PRICES.length-1,pi+d));},act:()=>{listNft(it,price);return wallet.msg;}});}
  for(const k in groups){const g=groups[k],li=mktUI.lp[k]??3,amt=PRICES[li];
    o.push({label:`CREATE POOL: ${g.length} ${itemName(g[0])} + < ${amt} > DOGE`,adj:d=>{mktUI.lp[k]=Math.max(0,Math.min(PRICES.length-1,li+d));},act:()=>{addLp(g.map(it=>it.id),toWei(amt));return wallet.msg;}});}
  if(chainData.loaded&&!chainData.listings.length&&!poolKeys.size)o.push({label:'NO POOLS YET. MINT AN ITEM ABOVE, THEN CREATE POOL!',act:()=>'MINT AN ITEM TOKEN FIRST, THEN ADD IT TO THE POOL WITH DOGE.'});
  o.push({label:'REFRESH',act:()=>{refreshChain().then(()=>setWalletMsg('MARKET REFRESHED.')).catch(e=>setWalletMsg(walletErr(e)));return 'REFRESHING...';}});
  o.push({label:'BACK',act:()=>{bankMenu(n);return '';}});return o;});ui.chain=true;ui.pooldex=true;refreshChain().catch(e=>setWalletMsg(walletErr(e)));}

// ================= UI (dialog / menus) =================
function openDialog(npc,lines,onEnd){ui={type:'dialog',npc,pages:lines,idx:0,chars:0,onEnd};sfx(660,0.04,'square',0.03);}
function openMenu(npc,title,build){ui={type:'menu',npc,title,build,sel:0,msg:''};}
function talk(n){
  n.dir=dirOf(P.x-n.x,P.y-n.y);
  if(n.id==='merchant'){
    if(!n.met){n.met=true;openDialog(n,['Wrenchpaw here. I forge gear from monster parts.','Bring me STEEL, WHISKERS, WOOD and STONE. Craft first, then mint.','I burn the materials and craft upgrades. No refunds. Very forge.'],()=>shopMenu(n));}
    else shopMenu(n);
  }else if(n.id==='bank'){
    if(!n.met){n.met=true;openDialog(n,['Welcome to the Sphinx DEX, door to DogeOS. I connect your wallet, add the DogeOS testnet and teach you DeFi.','Whiskers go to the forge. Real testnet DOGE pays for every mint.','Your NFTs live on chain: they stay safe when you die.','Connect a wallet for real DogeOS testnet NFTs, pools and staking, or play offline!'],()=>bankMenu(n));}
    else bankMenu(n);
  }else if(n.id==='quest'){if(state.stage===0)questTalk(n);else elderMenu(n);}
  else if(n.cls){professorTalk(n);}
  else partnerTalk(n);
}
// ---- Phase 5 (D-028): the three faction trainers. Tell their faction's story + class way, then let you take the oath. ----
function professorTalk(n){const c=CLASSES[n.cls];
  if(!n.met){n.met=true;openDialog(n,[`I am ${c.trainer} of the ${c.factionName}.`,...c.mech,c.skillDesc,'Walk the path only when you are ready. One class per wallet, forever.'],()=>professorMenu(n));}
  else professorMenu(n);}
function profClaimed(){return chainData.profession||0;} // on-chain class id, 0 if none / not connected
function professorMenu(n){const c=CLASSES[n.cls],fac=FACTIONS.find(f=>f.id===c.faction);
  openMenu(n,`${c.factionName}: THE ${c.name} PATH`,()=>{const o=[];
    o.push({label:`READ: ${fac.name} (FACTION)`,act:()=>{lesson(n,[fac.motto,...fac.entry],()=>professorMenu(n));return '';}});
    o.push({label:`THE ${c.name} WAY (MECHANIC + SKILL)`,act:()=>{lesson(n,[...c.mech,c.skillDesc],()=>professorMenu(n));return '';}});
    const locked=profClaimed(); // a class bound to this wallet on-chain
    if(P.prof===n.cls){
      o.push({label:`YOUR PATH: ${c.name}${locked===c.id?' (ON-CHAIN)':' (LOCAL)'}`,act:()=>locked===c.id?'SWORN ON-CHAIN. THIS IS YOUR CREW.':'PICKED LOCALLY. CONNECT AT THE SPHINX TO SWEAR IT ON-CHAIN.'});
      if(locked!==c.id&&chainReady()&&addrs().prof)o.push({label:`SWEAR ON-CHAIN (${fromWei(chainData.profFee||0n)} DOGE + GAS)`,act:()=>{chooseProfession(n.cls);return wallet.msg||'CONFIRM IN YOUR WALLET...';}});
    }else if(locked){
      o.push({label:`LOCKED ON-CHAIN: ${CLASSES[CLASS_IDS[locked]].name}`,act:()=>'ONE CLASS PER WALLET. THIS CHOICE IS FINAL ON-CHAIN.'});
    }else if(P.prof){
      o.push({label:`SWITCH TO ${c.name} (LOCAL)`,act:()=>{applyClass(n.cls,false);sfx(660,0.18,'triangle',0.05,300);return `YOU RETRAIN AS A ${c.name}. SPACE=${n.cls==='archer'?'SHOOT ARROWS':n.cls==='healer'?'STAFF (+2 MP)':'HEAVY CLEAVE'}!`;}});
    }else{
      const onchain=chainReady()&&addrs().prof;
      o.push({label:onchain?`BECOME A ${c.name} (${fromWei(chainData.profFee||0n)} DOGE + GAS)`:`BECOME A ${c.name}`,act:()=>{const r=chooseProfession(n.cls);return (r&&r.then)?(wallet.msg||'CONFIRM IN YOUR WALLET...'):(wallet.msg||`YOU TRAIN AS A ${c.name}.`);}});
    }
    o.push({label:'LEAVE',act:null});return o;});}
const RECIPES=[
  {name:'HAMMER LV2',nft:[1,2],need:{steel:2,wood:1},req:()=>P.sword<2,act:()=>{P.sword=2;return `HAMMER LV2! DMG ${SWORD_DMG[2]}. VERY FORGE.`;}},
  {name:'HAMMER LV3',nft:[1,3],need:{steel:4,stone:2},req:()=>swordLv()>=2&&P.sword<3,act:()=>{P.sword=3;return `HAMMER LV3! DMG ${SWORD_DMG[3]}. MUCH POWER.`;}},
  {name:'HAMMER LV4',nft:[1,4],need:{steel:6,whisk:4},req:()=>swordLv()>=3&&P.sword<4,act:()=>{P.sword=4;return `HAMMER LV4! DMG ${SWORD_DMG[4]}. WOW.`;}},
  {name:'DOGE ARMOR LV1',nft:[2,1],need:{steel:2,wood:2},req:()=>P.armor<1,act:()=>{P.armor=1;return `ARMOR LV1! -${ARMOR_RED[1]*100}% DMG.`;}},
  {name:'DOGE ARMOR LV2',nft:[2,2],need:{steel:5,stone:3},req:()=>armorLv()>=1&&P.armor<2,act:()=>{P.armor=2;return `ARMOR LV2! -${ARMOR_RED[2]*100}% DMG. SUCH PROTECT.`;}},
  {name:'BONE CHARM (+15 HP)',nft:[5,1],need:{whisk:3,stone:2},req:()=>P.hpUps<3,act:()=>{P.hpUps++;P.maxHp+=15;return 'MAX HP UP! REST TO FILL IT.';}},
  {name:'MOON BISCUIT (+10 MP)',nft:[6,1],need:{whisk:2,wood:2},req:()=>P.mpUps<2,act:()=>{P.mpUps++;P.maxMp+=10;return 'MAX MP UP! REST TO FILL IT.';}}
];
function mintRows(){const fee=chainData.loaded?fromWei(chainData.fee)+' DOGE':'FEE',o=[]; // D-104: only things you crafted or caught
  for(const k in P.credits){const [t,l]=k.split(':').map(Number);if(!creditOk(t,l))continue;o.push({label:`MINT ${itemName({type:t,level:l})} NFT x${P.credits[k]} (${fee})`,act:()=>{const b=chainBlockRow();if(b)return b;mintNft(t,l,'credit');return wallet.msg;}});}
  for(const f in FOOD_TYPE)if(bagCount(f))o.push({label:`PRESERVE ${FOODS[f].name} AS NFT (${fee})`,act:()=>{const b=chainBlockRow();if(b)return b;mintNft(FOOD_TYPE[f],1,f);return wallet.msg;}});
  return o;}
function shopMenu(n){openMenu(n,'WRENCHPAW\'S FORGE',()=>{const o=[];
  for(const r of RECIPES){if(!r.req())continue;
    const parts=Object.entries(r.need).map(([k,v])=>`${v} ${k==='whisk'?'WHISK':k.toUpperCase()}`).join('+');
    const has=Object.entries(r.need).every(([k,v])=>matN(k)>=v);
    o.push({label:`CRAFT ${r.name} (${parts})`,col:has?null:'#707890',act:has?()=>{if(wallet.busy)return 'WAIT FOR THE PENDING TRANSACTION.';for(const [k,v] of Object.entries(r.need))matTake(k,v);if(r.nft)addCredit(r.nft[0],r.nft[1]);return r.act()+(r.nft?' MINT IT BELOW.':'');}:()=>`NEED ${parts}. HUNT MORE.`});} // D-103
  // on-chain mint (D-019): crafted credits, starter wood+stone bag kit, or caught bag food can be minted
  o.push(...mintRows());
  o.push({label:`HAVE: STEEL ${P.steel} WHISK ${P.whisk} WOOD ${bagCount('wood')} STONE ${bagCount('stone')}`,act:()=>'MATERIALS FOR CRAFTING. LOST ON DEATH.'});
  o.push({label:'LEAVE',act:null});return o;});ui.chain=true;}
// ---- Phase 4 "The Grand Heist" (D-024): links, Sphinx DeFi hub + school, Elder heist lore + factions, partner NPCs ----
const LINKS={bitgetCard:'https://web3.bitget.com/card',relottoApp:'https://app.relotto.app',dogeos:'https://www.dogeos.com/',docs:'https://docs.dogeos.com/en/getting-started/overview',faucet:'https://faucet.testnet.dogeos.com',
  heist:'https://heist.dogeos.com/',redstone:'https://www.redstone.finance/',noah:'https://trynoah.ai/?utm_source=ambassador&utm_medium=affiliate&utm_campaign=ambassador_program&utm_content=afft5eetm&ref=AFF-T5EETM',bitget:'https://web3.bitget.com/pt-BR/wallet-download',bitgetShare:'https://web3.bitget.com/share/41bYlR?inviteCode=VovB4P5R',relotto:'https://relotto.app/'};
// links open only on an explicit menu choice; the URL is printed too, so it still works when popups are blocked
const shortUrl=u=>String(u).replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'').toUpperCase();
function openLink(url){if(!url)return 'LINK COMING SOON.';try{window.open(url,'_blank','noopener,noreferrer');}catch(e){}return 'LINK: '+shortUrl(url).slice(0,56);}
const linkRow=(label,url)=>({label,act:()=>openLink(url)});
// lessons are dialog pages; the last page (or ESC) returns to the menu they came from
function lesson(n,pages,back){openDialog(n,pages,back);}
const SCHOOL=[
  ['WALLET',['A wallet holds your keys. Keys prove you own your coins and items.','Never share your seed phrase. Not with a sphinx, not with a cat. Never.','MetaMask, Bitget Wallet and other EVM wallets all work at my door.']],
  ['RPC + TESTNET',['An RPC is the door your wallet uses to talk to a chain.','DogeOS Chikyu is the testnet, chain id 6281971. Its DOGE is free and has no value, so it is safe to learn.','Pick CONNECT and I add the network to your wallet for you. One click. Much easy.']],
  ['FAUCET + GAS',['Every transaction costs a small fee called gas, paid in DOGE.','A faucet gives free testnet DOGE for gas. Get some before you mint or trade.']],
  ['SWAP',['A swap trades one asset for another at the price of a pool.','Bigger trades move the price more. That is slippage. I always protect you with a limit.']],
  ['LIQUIDITY POOL',['A pool holds two things: here, items and DOGE. Liquidity providers deposit both and get shares.','Traders pay a 2% fee that stays in the pool, so LPs earn. The price follows x times y equals k.','Risk: when prices move you can end with more of the cheaper side. That is impermanent loss.']],
  ['STAKE',['Staking locks coins to earn a reward. Here you stake real testnet DOGE from your wallet, on chain.','DogeStaking pays stakers 0.8% of every DEX trade. There is no in-game DOGE: only your wallet.']],
  ['ORACLE (REDSTONE)',['Contracts cannot see the outside world. An oracle brings real prices on-chain.','RedStone posts signed DOGE and BTC prices on the DogeOS testnet, so swaps and other DeFi built here have real prices.','My DEX reads DOGE/USD from RedStone. Trade prices still come from the pool itself; the oracle is for display and safety.']],
  ['NFT',['An NFT is a token with its own id. Your crafted gear and preserved fish are NFTs you truly own.','Owning gear NFTs means wearing them. Sell them, pool them, or eat the fish. Your call.']],
];
function schoolMenu(n){openMenu(n,'SPHINX SCHOOL: DEFI 101',()=>[...SCHOOL.map(([t,pages])=>({label:'LESSON: '+t,act:()=>{lesson(n,pages,()=>schoolMenu(n));return '';}})),{label:'BACK',act:()=>{bankMenu(n);return '';}}]);}
// the Sphinx: DogeOS DeFi hub. Connect (auto add + switch DogeOS testnet), LP + swap, faucet, stake, oracle, links, school
function bankMenu(n){openMenu(n,'THE SPHINX DEX - DOGEOS DEFI HUB',()=>{
  return[
  ...walletRows(), // CONNECT adds + switches to DogeOS Chikyu (D-016)
  {label:'NFT MARKET: SWAP + LIQUIDITY POOLS',act:()=>{marketMenu(n);return '';}},
  {label:'ON-CHAIN STAKING (TESTNET DOGE)',act:()=>{stakeMenu(n);return '';}},
  linkRow('GET TESTNET DOGE (FAUCET)',LINKS.faucet),
  oracleRow(),
  {label:'SPHINX SCHOOL: DEFI 101 LESSONS',act:()=>{schoolMenu(n);return '';}},
  linkRow('DOGEOS.COM: THE APP + COMMUNITY',LINKS.dogeos),
  linkRow('BUILD ON DOGEOS (DEVELOPER DOCS)',LINKS.docs),
  ...(wallet.connected?[{label:'DISCONNECT WALLET',act:()=>{disconnectWallet();return wallet.msg;}}]:[]),
  {label:'LEAVE',act:null}];});ui.chain=true;refreshOracle().catch(()=>{});}
// ---- RedStone DOGE/USD oracle (D-024). Feeds from redstone-oracles-monorepo dogeOsTestnetMultiFeed.json, checked on-chain ----
const REDSTONE={'0x5fdaf3':{feed:'0x434F8D17c0301cfEa143dba912972E24B827C968',adapter:'0xB08342D907D2df47B6F73e25F4fa033978B344B1'}};
const DOGE_FEED_ID='444f4745'.padEnd(64,'0'); // bytes32("DOGE")
const ORACLE_MAX_AGE=86400; // RedStone DogeOS heartbeat: 24 h
const oracle={price:0,updated:0,src:'',loaded:false};
const oracleStale=()=>!oracle.loaded||Date.now()/1000-oracle.updated>ORACLE_MAX_AGE;
// order: our DogeDEX view -> the RedStone feed -> the RedStone adapter's last pushed value (works even when stale)
async function refreshOracle(){
  if(!wallet.connected||!wallet.chainOk)return;
  const set=(p8,ts,src)=>{if(p8>0n){oracle.price=Number(p8)/1e8;oracle.updated=Number(ts);oracle.src=src;oracle.loaded=true;}};
  const c=addrs(),rs=REDSTONE[CHAIN.id];
  try{if(c.dex){const w=words(await ecall(c.dex,SEL.dogeUsd));if(w[0]>0n){set(w[0],w[1],'DOGEDEX');return;}}}catch(e){}
  if(!rs)return;
  try{const w=words(await ecall(rs.feed,'feaf968c'));set(w[1],w[3],'FEED');return;}catch(e){} // reverts while RedStone data is stale
  try{const w=words(await ecall(rs.adapter,'729bfda4'+DOGE_FEED_ID));set(w[2],w[0]/1000n,'LAST PUSH');}catch(e){}
}
function oracleAge(){const h=Math.max(0,Math.round((Date.now()/1000-oracle.updated)/3600));return h<48?h+'H AGO':Math.round(h/24)+'D AGO';}
function oracleRow(){
  if(!oracle.loaded)return {label:'REDSTONE ORACLE: CONNECT TO READ DOGE/USD',act:()=>{refreshOracle().then(()=>setWalletMsg(oracle.loaded?'ORACLE READ. SUCH PRICE.':'NO ORACLE ON THIS CHAIN YET.'));return wallet.connected?'READING REDSTONE...':'CONNECT YOUR WALLET FIRST.';}};
  return {label:`REDSTONE DOGE/USD $${oracle.price.toFixed(4)}${oracleStale()?' (STALE)':''}`,act:()=>{refreshOracle();return `SOURCE: ${oracle.src}. UPDATED ${oracleAge()}. THE GAME MARKET FOLLOWS IT.`;}};
}
// the Elder: keeper of the Grand Heist (heist.dogeos.com)
const FACTIONS=[
  {id:'demo',name:'DEMOLITION DOGS',motto:'Breaking down the doors, spread the signal.',entry:['[ARCHIVE ENTRY #001] Demolition Dogs are the frontlines.','They run social quests and spread the signal. The Fat Cats are counting on silence, so they make sure every bark is heard around the world.']},
  {id:'kernel',name:'KERNEL CREW',motto:'Amplify the signal. Arm the troops.',entry:['[ARCHIVE ENTRY #002] Kernel Crew are the content creators, educators and culture shapers of the Heist.','They create the guides, threads and culture pieces that educate and motivate the doge army to mobilize.','Known weakness: squirrels.']},
  {id:'bark',name:'BARKITECTS',motto:'Go on-chain and execute.',entry:['[ARCHIVE ENTRY #003] The Barkitects are the users trained and comfortable with the apps.','They complete quests that bring their doge on-chain: into games, DeFi and beyond. The Sphinx trains them.','Known weakness: going full degen.']},
];
const HEIST_STORY=['The Fat Cats took the value of the doge world and locked it in their vaults. They count on our silence.',
  'This is the Grand Heist: the largest community activation in Dogecoin history. We take back what is ours.',
  'Shibes complete quests and earn collectible items by using the apps of the growing DogeOS ecosystem.',
  'Every great heist needs a crew: Demolition Dogs, Kernel Crew and Barkitects. Find where you belong.',
  'The operation is live. No fat cats. No squirrels. No excuses. Add your paw to the pile at HEIST.DOGEOS.COM.'];
const PONZI_STORY=[ // D-102: DOGEON's own satire chapter (same text as the landing, D-101); HEIST_STORY above stays the sourced Grand Heist
  'Long ago, in another dimension where magic is real, the Fat Cats did not just steal the treasury. They made it a PonziFi.',
  '"Stake your DOGE, number go up forever," they purred. Every yield was paid with the next fren\'s coins.',
  'Then the Cat Lord rugged the whole pool and sealed the loot behind the iron gate in the northern ruins.',
  'Fren, we do not paper-hand. Grab your hammer, raid the gate and bonk the Cat Lord. Such heist. Much wow.',
  'He comes back 60 seconds after he falls, and the heist starts over. A meme game on testnet tokens: nothing here is worth real money.'];
const factionOf=()=>FACTIONS.find(f=>f.id===P.faction);
function factionMenu(n){openMenu(n,'THE HEIST ARCHIVES: FACTIONS',()=>{const o=[];
  for(const f of FACTIONS){o.push({label:`READ: ${f.name}`,act:()=>{lesson(n,[f.motto,...f.entry],()=>factionMenu(n));return '';}});
    o.push({label:P.faction===f.id?`  YOUR CREW: ${f.name}`:`  JOIN ${f.name}`,act:()=>{P.faction=f.id;sfx(660,0.2,'triangle',0.05,300);return `WELCOME TO THE ${f.name}. ADD YOUR PAW TO THE PILE.`;}});}
  o.push({label:'BACK',act:()=>{elderMenu(n);return '';}});return o;});}
function elderMenu(n){openMenu(n,'ELDER SHIBE: KEEPER OF THE HEIST',()=>{const o=[
  {label:`QUEST: ${questText()}`,act:()=>{questTalk(n);return '';}},
  {label:'THE GRAND HEIST (STORY)',act:()=>{lesson(n,HEIST_STORY,()=>elderMenu(n));return '';}},
  {label:'DOGEON: THE PONZIFI CHAPTER',act:()=>{lesson(n,PONZI_STORY,()=>elderMenu(n));return '';}},
  {label:`FACTIONS${factionOf()?' (YOU: '+factionOf().name+')':''}`,act:()=>{factionMenu(n);return '';}},
  linkRow('JOIN THE HEIST: HEIST.DOGEOS.COM',LINKS.heist),
  {label:'PARTY & SQUAD ('+(NET_PARTY||'SOLO')+')',act:()=>{partyMenu(n);return '';}},
  {label:'DOGE MARKET REPORT',act:()=>{const pc=Math.round(mkt.sent*MARKET.sentScale*100);return `DOGE $${mkt.p.toFixed(3)} (${pc>=0?'+':''}${pc}%) ${pc>2?'BULL: FIGHTERS HIT HARDER':pc<-2?'BEAR: CATS HIT HARDER':'FLAT'}`;}}];
  if(state.won)o.splice(1,0,{label:'DOGEMASTER: MEME FORGE & RE-ROLL',act:()=>{dogeMasterMenu(n);return '';}}); // D-066: endgame DogeMaster
  o.push({label:'LEAVE',act:null});return o;});}
function dogeMasterMenu(n){openMenu(n,'DOGEMASTER: MEME FORGE & RE-ROLL',()=>{const o=[],inv=myFree();
  o.push({label:'DOGEMASTER: 420, 69, 777 STATS. SACRIFICE CURSES.',act:()=>'RE-ROLL = 2 TRANSACTIONS: BURN, THEN MINT (FEE). CONFIRM BOTH OR THE OLD ITEM IS GONE.'});
  if(inv.length){for(const it of inv){const r=itemRoll(it.id);o.push({label:`SACRIFICE #${it.id} ${itemName(it)} [${r.label}] -> RE-ROLL`,isNft:true,act:()=>{burnAndReroll(it);return wallet.msg;}});}}
  else{o.push({label:'NO GEAR NFTS IN WALLET TO RE-ROLL.',act:()=>'MINT OR CRAFT AN NFT FIRST TO RE-ROLL ITS MEME STATS.'});}
  o.push({label:'BACK',act:()=>{elderMenu(n);return '';}});return o;});}
function modMenu(){openMenu(null,'MASTER MOD MENU (TEST SUITE)',()=>[
  {label:P.god?'GOD MODE: [ON] (INVINCIBLE)':'GOD MODE: [OFF]',act:()=>{P.god=!P.god;return `GOD MODE ${P.god?'ENABLED':'DISABLED'}.`;}},
  {label:'GIVE 99 ALL MATERIALS (STEEL/WOOD/STONE/WHISK)',act:()=>{matAdd('wood',40);matAdd('stone',40);P.whisk=99;P.steel=99;return '99 OF ALL MATS ADDED. (NO FAKE DOGE — MINTING USES REAL TESTNET DOGE.)';}},
  {label:'SWITCH CLASS: WARRIOR',act:()=>{P.prof='warrior';syncMaxHp();syncMaxMp();return 'CLASS SET TO WARRIOR.';}},
  {label:'SWITCH CLASS: ARCHER',act:()=>{P.prof='archer';syncMaxHp();syncMaxMp();return 'CLASS SET TO ARCHER.';}},
  {label:'SWITCH CLASS: HEALER',act:()=>{P.prof='healer';syncMaxHp();syncMaxMp();return 'CLASS SET TO HEALER.';}},
  {label:'SWITCH CLASS: NONE (LONE DOGE)',act:()=>{P.prof=null;syncMaxHp();syncMaxMp();return 'CLASS CLEARED.';}},
  {label:'INSTA-KILL BOSS & SUMMON DOGEMASTER',act:()=>{state.won=true;state.stage=4;return 'CAT LORD SLAIN! DOGEMASTER AWAKENED.';}},
  {label:'GIVE MAX GEAR STATS',isNft:true,act:()=>{P.hpUps=3;P.mpUps=2;P.sword=4;P.armor=2;syncMaxHp();syncMaxMp();P.hp=P.maxHp;P.mp=P.maxMp;return 'MAX COMBAT GEAR GRANTED.';}},
  {label:'CLOSE',act:null}]);}
// partner NPCs: first talk = story, then a menu with the story + link (texts sourced in D-024)
const PARTNERS={ // stories are factual (sources in docs/DECISIONS.md D-024); no claim of official DogeOS partnership unless sourced
  lotto:{title:'CLOVERHEART: RELOTTO',story:['Need a map or a lucky charm, traveler? I am Cloverheart, the clover guide of the Dogeon.',
    'My clover grows where shibes recycle. Lucky shibes know the trick: Relotto, the recycling app that rewards you.',
    'Trade your recyclables with recyclers and earn Ecopoints. Spend them on rewards and gift cards, or play games to level up.',
    'Recycle, earn, play. Small acts add up, like every bark in the Heist. Find it at RELOTTO.APP.'],
    links:[['OPEN RELOTTO.APP','relotto'],['OPEN THE RELOTTO WEB APP','relottoApp']]},
  noah:{title:'NOAH: MODEL N-01',story:['Beep. I am Noah, a super AI brain in a box. Model N-01.',
    'Describe your dApp idea in a single prompt and I build it: frontend, smart contracts, backend and wallet hookup.',
    'Here on DogeOS, my builders ship EVM Solidity smart contracts powered by DOGE.',
    'DogeOS lists me in its ecosystem: build dApps by chatting with AI. Barkitects who want to build, start at TRYNOAH.AI.'],
    links:[['OPEN TRYNOAH.AI','noah']]},
  bitget:{title:'BITGET WALLET CARD',story:['Swipe right, shibe. I am the Bitget Wallet Card.',
    'Bitget Wallet is a multi-chain wallet for phone and Chrome. It can add custom EVM networks, like the DogeOS testnet.',
    'Connect it at the Sphinx and the DogeOS testnet is added for you. Same door as MetaMask.',
    'The card: top up with USDT, USDC, ETH or SOL and spend where card payments work. 50+ countries. ID check required.',
    'Fees and rewards vary by region. Always read the terms first. Very careful. Much smart.'],
    links:[['JOIN BITGET WALLET (INVITE)','bitgetShare'],['DOWNLOAD BITGET WALLET','bitget'],['ABOUT THE BITGET WALLET CARD','bitgetCard']]},
};
function partnerTalk(n){const p=PARTNERS[n.id];if(!p)return;
  if(!n.met){n.met=true;openDialog(n,p.story,()=>partnerMenu(n));}else partnerMenu(n);}
function partnerMenu(n){const p=PARTNERS[n.id];openMenu(n,p.title,()=>[
  {label:'HEAR THE STORY AGAIN',act:()=>{openDialog(n,p.story,()=>partnerMenu(n));return '';}},
  ...p.links.map(([label,k])=>linkRow(label,LINKS[k])),
  {label:'LEAVE',act:null}]);}
const DOGE_LORE=[ // Grand Heist lore (heist.dogeos.com), told by the Elder (D-024)
  'Take back what is yours. The Fat Cats hid the value of the doge world in their vaults.',
  'The Fat Cats are counting on silence. Every bark we make is heard around the world.',
  'Every great heist needs a crew. Demolition Dogs, Kernel Crew, Barkitects. Where do you belong?',
  'The Cat Lord is the fattest cat of all. He sits on the vault beneath the northern ruins.',
  'No fat cats. No squirrels. No excuses. This is our moment.',
  'Barkitects go on-chain and execute. The Sphinx will teach you how.',
  'Every shibe who shows up is part of the greatest mobilisation in doge history.',
  'Add your paw to the pile. Much heist. Very wow.'
];
function questTalk(n){
  const s=state.stage;
  const pc=Math.round(mkt.sent*MARKET.sentScale*100),up=pc>=0;
  const mktLine=`DOGE IS $${mkt.p.toFixed(3)} (${up?'+':''}${pc}% ${pc>2?'BULL':pc<-2?'BEAR':'FLAT'}). ${up?'GOOD TIMES FOR FIGHTERS.':'BE CAREFUL. ENEMIES GROW STRONGER.'}`;
  const lore=DOGE_LORE[Math.floor(time/20)%DOGE_LORE.length],qm=k=>Object.entries(QUEST_MATS[k]).map(([m,v])=>`${v} ${m==='steel'?'IRON':m.toUpperCase()}`).join(', '),give=k=>giveMats(QUEST_MATS[k]); // D-089: NPCs never give DOGE
  if(s===0)openDialog(n,[mktLine,lore,'...Young pup. The cats have risen. They took every field around our camp.','Outside the fence they hunt you. Inside, they cannot touch you. That is the old law.','Prove yourself. Slay 8 cats and return to me.'],()=>{state.stage=1;P.kills=0;toast('NEW QUEST: SLAY 8 CATS');});
  else if(s===1&&P.kills<8)openDialog(n,[mktLine,lore,`${P.kills}/8 cats. Keep fighting. When hurt, rest by the fire.`]);
  else if(s===1)openDialog(n,[mktLine,`Very fight. Much brave. Take ${qm(1)} for the forge.`,'Now the real test: armored BRUTE CATS roam far from camp and in the old ruins to the north.','They glow red before they charge. When you see it, dodge sideways. Slay 3 of them.'],()=>{give(1);state.stage=2;P.bruteKills=0;toast('NEW QUEST: SLAY 3 BRUTE CATS');});
  else if(s===2&&P.bruteKills<3)openDialog(n,[mktLine,lore,`Brutes slain: ${P.bruteKills}/3. They lurk far from camp and in the ruins.`]);
  else if(s===2)openDialog(n,[mktLine,`You crushed the brutes! Take ${qm(2)}.`,'I have opened the iron gate in the northern ruins. Beyond it waits the CAT LORD.','When he falls, he returns 60 seconds later and a new heist begins for everyone. Much loop.'],()=>{give(2);state.stage=3;state.gateOpen=true;toast('RUINS GATE OPEN! SLAY THE CAT LORD.');sfx(80,0.6,'sawtooth',0.06,40);});
  else if(s===3)openDialog(n,[mktLine,lore,'The Cat Lord waits beyond the iron gate, north of camp. Do not go in hurt.']);
  else openDialog(n,[mktLine,lore,'You did it. Such hero. Much legend. The camp is safe... for now.','Many cats still roam out there. Hunt them if you wish.']);
}
function invMenu(){
  openMenu(null,'INVENTORY',()=>{const o=[];
    o.push({label:`BAG ${P.bag.length}/${BAG_SIZE} SLOTS  WHISKERS x${P.whisk}`,act:()=>'FOOD STACKS TO 5. DEATH EMPTIES THE BAG. NFTS ARE SAFE.'});
    o.push({label:`HAVE: STEEL ${P.steel} WHISK ${P.whisk} WOOD ${bagCount('wood')} STONE ${bagCount('stone')}`,act:()=>'CRAFT AT WRENCHPAW. LOST ON DEATH.'});
    for(let i=0;i<P.bag.length;i++){const s=P.bag[i];const fd=FOODS[s.kind];
      if(fd){const nearFire=dist(P.x,P.y,CX*16+8,FY*16+8)<40;
        const mpStr=fd.mp?` +${fd.mp} MP`:'';
        o.push({label:`${fd.name} x${s.qty} [EAT +${fd.heal} HP${mpStr}]`,act:()=>{if(P.hp>=P.maxHp&&(!fd.mp||P.mp>=P.maxMp))return 'HP IS FULL ALREADY.';bagRemove(s.kind,1);P.hp=Math.min(P.maxHp,P.hp+fd.heal);if(fd.mp)P.mp=Math.min(P.maxMp,P.mp+fd.mp);sfx(660,0.1,'triangle',0.05,200);return `ATE ${fd.name}. +${fd.heal} HP${mpStr}. YUM.`;}});
        if(s.kind==='raw_fish'&&nearFire)o.push({label:`COOK RAW FISH -> COOKED FISH`,act:()=>{if(!bagRemove('raw_fish',1))return 'NO RAW FISH.';if(!addToBag('cooked_fish',1)){addToBag('raw_fish',1);return 'BAG FULL.';}sfx(440,0.15,'triangle',0.04);return 'COOKED SARDINE (+25 HP)! MUCH DELICIOUS.';}});
        if(s.kind==='raw_salmon'&&nearFire)o.push({label:`COOK RAW SALMON -> COOKED SALMON`,act:()=>{if(!bagRemove('raw_salmon',1))return 'NO SALMON.';if(!addToBag('cooked_salmon',1)){addToBag('raw_salmon',1);return 'BAG FULL.';}sfx(440,0.15,'triangle',0.04);return 'COOKED SALMON (+50 HP/+25 MP)! MUCH DELICIOUS.';}});
      }else{const names={wood:'WOOD',stone:'STONE',steel:'STEEL',whisk:'WHISKER'};o.push({label:`${names[s.kind]||s.kind.toUpperCase()} x${s.qty}`,act:()=>`CRAFTING MATERIAL: CRAFT AT THE FORGE, THEN MINT (${chainData.loaded?fromWei(chainData.fee):'1'} TESTNET DOGE).`});}}
    const sk=P.skills,lv=k=>skillLv(sk[k],k);o.push({label:`SKILLS: COMBAT LV${lv('combat')} (${sk.combat}XP) BARK LV${lv('bark')} (${sk.bark}XP) FISH LV${lv('fishing')} (${sk.fishing}XP)`,act:()=>`COMBAT +${Math.round(lv('combat')*SKILL_BONUS*100)}% DMG  BARK +${Math.round(lv('bark')*SKILL_BONUS*100)}% DMG  FISH +${Math.round(lv('fishing')*SKILL_BONUS*100)}% SPD`});
    const nfts=chainReady()?chainData.inv:[]; // D-038: explicit off-chain bag (at risk) vs on-chain wallet NFTs (safe) boundary
    o.push({label:`ON-CHAIN ITEMS (${nfts.length}): ${nfts.length?'SAFE ON DEATH':'MINT AT SPHINX/FORGE'}`,act:()=>'WALLET NFTS SURVIVE DEATH. BAG ITEMS & MATERIALS DROP WHEN YOU FALL.'});
    for(const it of nfts){const f=TYPE_FOOD[it.type];
      o.push({label:`NFT #${it.id} ${itemName(it)} `+(f?`[EAT +${FOODS[f].heal} HP, BURNS]`:(it.type<=2||it.type>=7)?'(OWNED = EQUIPPED)':'[USE, BURNS]'),isNft:true,act:it.type<=2?()=>`ON-CHAIN GEAR. EFFECTIVE HAMMER LV${swordLv()} ARMOR LV${armorLv()}.`:it.type>=7?()=>'DOGE GEAR WORKS WHILE YOU OWN IT. SELL OR RE-ROLL IT; NEVER BURN IT FOR NOTHING.':()=>{useNft(it);return wallet.msg;}});} // D-111 S2-4
    o.push({label:'PARTY: '+(NET_PARTY||'SOLO')+' [P TO CHANGE]',act:()=>{partyMenu(null);return '';}});
    if(!P.bag.length)o.push({label:'BAG IS EMPTY',act:()=>'HUNT MONSTERS OR CATCH FISH.'});
    o.push({label:'CLOSE',act:null});return o;});ui.chain=true;if(chainReady())refreshChain().catch(()=>{});}
function updateUI(dt){
  if(ui.type==='dialog'){
    const page=ui.pages[ui.idx];ui.chars+=70*dt;
    if(kp('e',' ','enter','j')){
      if(ui.chars<page.length)ui.chars=page.length;
      else{ui.idx++;ui.chars=0;sfx(520,0.03,'square',0.02);if(ui.idx>=ui.pages.length){const f=ui.onEnd;ui=null;if(f)f();}}
    }else if(kp('escape')){const f=ui.onEnd;ui=null;if(f)f();}
  }else{
    const opts=ui.build();ui.sel=Math.min(ui.sel,opts.length-1);
    if(kp('arrowup','w')){ui.sel=(ui.sel+opts.length-1)%opts.length;sfx(440,0.03,'square',0.02);}
    if(kp('arrowdown','s')){ui.sel=(ui.sel+1)%opts.length;sfx(440,0.03,'square',0.02);}
    if(opts[ui.sel]&&opts[ui.sel].adj){if(kp('arrowleft','a'))opts[ui.sel].adj(-1);if(kp('arrowright','d'))opts[ui.sel].adj(1);}
    if(kp('escape','q'))ui=null;
    else if(kp('e',' ','enter','j')){const o=opts[ui.sel];
      if(!o.act){ui=null;return;}
      ui.msg=o.act();sfx(780,0.08,'square',0.04,200);}
  }
}

// ================= MULTIPLAYER (opt-in, D-040) =================
// Served over http(s) it joins the relay on the same host; ?mp=ws(s)://host picks another, ?mp=off disables it (D-111). Native
// WebSocket only: no library, no CDN. From file:// (no host) the game makes ZERO network calls (single-player, sandboxed publishing).
// Scope = "the option": up to NET_MAX players see each other's doge (class sprite, facing, walk, HP, name). Shared enemies and
// loot need an authoritative server (e.g. Colyseus) and are deliberately NOT built. Host the relay: `node server/relay.mjs`.
// Peer data is untrusted: ids are whitelisted (no __proto__), coords must be finite, names sanitized + capped, peers capped.
const netParam=k=>{try{const m=location.search.match(new RegExp('[?&]'+k+'=([^&]+)'));return m?decodeURIComponent(m[1]):'';}catch(e){return '';}};
const defaultMp=()=>{const p=netParam('mp');if(p==='off')return '';if(p)return p;try{if(typeof location!=='undefined'&&location.host&&(location.protocol==='http:'||location.protocol==='https:'))return (location.protocol==='https:'?'wss://':'ws://')+location.host;}catch(e){}return '';};
const NET_URL=defaultMp(),NET_ROOM=(netParam('room').match(/^[\w-]{1,24}$/)||['heist'])[0];
const NET_HZ=10,NET_TTL=12,NET_MAX=8,NET_PEERS=32; // send rate, seconds before a silent peer drops, ghosts drawn, peers tracked
const net={ws:null,on:false,id:'',name:'',peers:Object.create(null),t:0,loot:Object.create(null),pend:Object.create(null)};
const netClean=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'').slice(0,12);
// D-076 shared world: the relay referees the Cat Lord's HP, PvP hits (same ?party= = no friendly fire) and death loot piles
let NET_PARTY=netClean(netParam('party'));
const NET_LOOT=['steel','whisk','wood','stone'],LOOT_COL={steel:'#a0a8b0',whisk:'#e0e0ff',wood:'#c08a4a',stone:'#c0c8d0'};
function setParty(name){NET_PARTY=name==='SOLO'?'':netClean(name);if(netLive())netSend({t:'party',party:NET_PARTY});toast(NET_PARTY?'JOINED PARTY '+NET_PARTY:'SOLO MODE (OPEN PVP)',2);}
function partyMenu(n){openMenu(n,'PARTY & SQUAD MANAGEMENT',()=>{const o=[];
  o.push({label:'CURRENT: '+(NET_PARTY?'PARTY ['+NET_PARTY+'] (FRIENDLY FIRE OFF)':'SOLO (OPEN PVP ENABLED)'),act:()=>NET_PARTY?'PARTY ALLIES SHOW IN GREEN AND CANNOT BE HURT.':'SOLO PLAYERS CAN ATTACK AND BE ATTACKED BY RIVALS OUTSIDE CAMP.'});
  for(const p of ['ALPHA','BRAVO','GOLD'])o.push({label:NET_PARTY===p?'* IN PARTY '+p:'  JOIN PARTY '+p,act:()=>{setParty(p);return 'JOINED PARTY '+p+'. ALLIES CANNOT HURT YOU!';}});
  o.push({label:!NET_PARTY?'* SOLO (OPEN PVP)':'  LEAVE PARTY (GO SOLO)',act:()=>{setParty('SOLO');return 'NOW SOLO. OPEN PVP OUTSIDE CAMP.';}});
  if(wallet.connected)o.push({label:'WALLET: '+shortAddr(wallet.addr),act:()=>'WALLET CONNECTED: '+wallet.addr});
  else o.push({label:'CONNECT DOGEOS WALLET',act:()=>{connectWallet();return wallet.msg||'CONNECTING WALLET...';}});
  o.push({label:'BACK',act:()=>{if(n)elderMenu(n);return '';}});return o;});}
const netLive=()=>!!(net.on&&net.ws&&net.ws.readyState===1);
function netSend(o){if(netLive())net.ws.send(JSON.stringify(Object.assign({},o,{id:net.id})));}
function netPvp(cx,cy,hw,hh,dmg,skip){ // client pre-check; the relay re-checks range, camp and party before anyone is hurt
  if(!netLive()||playerInCamp())return false;let hit=false;
  for(const k in net.peers){const g=net.peers[k];if(g.dead||(NET_PARTY&&g.pt===NET_PARTY)||(skip&&skip.has(k))||inCampT(Math.floor(g.x/16),Math.floor(g.y/16)))continue;
    if(Math.abs(g.x-cx)<hw+6&&Math.abs(g.y-6-cy)<hh+9){netSend({t:'pvp',to:k,dmg:Math.round(dmg)});if(skip)skip.add(k);hit=true;}}
  return hit;}
function bossCycle(){state.bossT=0;items=items.filter(i=>i.kind!=='yarn'); // D-112 S4-9: one yarn per kill
  if(!enemies.some(e=>e.boss))enemies.push(makeEnemy('boss',CX*16+8,5*16+8,'boss'));if(state.stage>=1){state.stage=1;P.kills=0;P.bruteKills=0;}state.gateOpen=false;if(zoneOf(P.x,P.y)==='boss'){P.x=CX*16+8;P.y=(GATE_ROW+3)*16+8;}toast('THE CAT LORD RETURNS! NEW HEIST: SLAY 8 CATS.',4);} // D-095 raid cycle
function netBoss(m){const e=enemies.find(e=>e.boss);if(!e)return;e.maxHp=Math.max(1,m.max|0);e.hp=Math.max(0,m.hp|0);
  if(m.dead&&!e.dead){if(zoneOf(P.x,P.y)==='boss')killEnemy(e);else{e.dead=true;state.bossT=BOSS_RESPAWN;toast('YOUR PARTY SLEW THE CAT LORD! HE RETURNS IN 60S.',3);}enemies=enemies.filter(x=>!x.dead);}}
function netConnect(){
  if(!NET_URL||typeof WebSocket==='undefined'||net.ws)return;
  net.id=net.id||Math.random().toString(36).slice(2,8); // lazy: normal play never draws this random number (seeded sims stay identical)
  net.name=netClean(netParam('name'))||net.name||HERO_NAMES[heroNameIdx]||'DOGE-'+net.id.slice(0,3).toUpperCase(); // never the wallet address (privacy)
  try{const ws=new WebSocket(NET_URL);net.ws=ws;
    ws.onopen=()=>{net.on=true;ws.send(JSON.stringify({t:'join',room:NET_ROOM,id:net.id,party:NET_PARTY}));toast('MULTIPLAYER: ROOM '+NET_ROOM.toUpperCase()+' AS '+net.name+(NET_PARTY?' PARTY '+NET_PARTY:' (SOLO: PVP ON)'),2.5);};
    ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data);}catch(e){return;}
      if(m&&m.t==='full'){toast('SERVER FULL (MAX 8 PLAYERS)',4);return;}
      if(m&&m.t==='boss'&&Number.isFinite(m.hp)){netBoss(m);return;} // relay-owned boss HP
      if(m&&m.t==='cycle'){bossCycle();return;} // D-095: the relay restarts the whole room's heist together (clients can't send this)
      if(m&&m.t==='hurt'&&Number.isFinite(m.dmg)){hurtPlayer(Math.min(40,Math.max(1,m.dmg|0)),{x:Number.isFinite(m.x)?m.x:P.x,y:Number.isFinite(m.y)?m.y:P.y});return;} // PvP hit (camp/god/iframes still protect)
      if(m&&m.t==='loot'&&Array.isArray(m.items)){for(const it of m.items.slice(0,12))if(it&&/^l\d{1,9}$/.test(it.lid)&&NET_LOOT.includes(it.k)&&Number.isFinite(it.x)&&Number.isFinite(it.y)&&Object.keys(net.loot).length<60)net.loot[it.lid]={k:it.k,x:it.x,y:it.y};return;}
      if(m&&m.t==='gone'){delete net.loot[m.lid];return;}
      if(m&&m.t==='got'&&NET_LOOT.includes(m.k)){delete net.loot[m.lid];matAdd(m.k,1);floater(P.x,P.y-24,'+1 '+(m.k==='whisk'?'WHISKER':m.k.toUpperCase()),LOOT_COL[m.k]);sfx(1100,0.05,'square',0.03,300);return;}
      if(!m||typeof m.id!=='string'||!/^[a-z0-9]{1,12}$/.test(m.id)||m.id===net.id)return;
      if(m.t==='bye'){delete net.peers[m.id];return;}
      if(m.t==='heal'&&Number.isFinite(m.x)&&Number.isFinite(m.y)){
        const hp=net.peers[m.id]; // D-111 S3-3: trust only a heal from the healer's last known spot, capped like MEND
        if(!P.dead&&hp&&Math.hypot(hp.x-m.x,hp.y-m.y)<=48&&Math.hypot(P.x-m.x,P.y-m.y)<=Math.min(72,m.r||72)){
          const amt=Math.max(1,Math.min(20,m.amt|0));P.hp=Math.min(P.maxHp,P.hp+amt);
          floater(P.x,P.y-12,'+'+amt,'#80ffb0');sfx(620,0.14,'sine',0.05,220);
        }
        return;
      }
      if(m.t!=='st'||!Number.isFinite(m.x)||!Number.isFinite(m.y))return;
      if(!net.peers[m.id]&&Object.keys(net.peers).length>=NET_PEERS)return;
      net.peers[m.id]={x:m.x,y:m.y,d:['down','up','left','right'].includes(m.d)?m.d:'down',m:!!m.m,c:Object.prototype.hasOwnProperty.call(CLASSES,m.c)?m.c:'',
        h:Math.max(0,Math.min(100,m.h|0)),n:netClean(m.n)||'DOGE',pt:netClean(m.pt),dead:!!m.dead,seen:time};};
    ws.onclose=()=>{net.on=false;net.ws=null;net.peers=Object.create(null);net.loot=Object.create(null);net.fails=(net.fails||0)+1;net.retry=time+Math.min(30,2**net.fails);}; // D-111 S3-9 backoff
  }catch(e){net.ws=null;}}
function netTick(dt){ // from update(): broadcast own state at NET_HZ, drop silent peers
  if(!NET_URL)return;
  if(!net.ws&&time>=(net.retry||0))netConnect();
  for(const k in net.peers)if(time-net.peers[k].seen>NET_TTL)delete net.peers[k];
  if(!P.dead)for(const lid in net.loot){const l=net.loot[lid];if(dist(l.x,l.y,P.x,P.y)<12&&!(time-(net.pend[lid]||-9)<1)){net.pend[lid]=time;netSend({t:'take',lid});}} // claim; relay decides who gets it
  net.t-=dt;if(net.t>0||!net.on||!net.ws||net.ws.readyState!==1)return;net.t=1/NET_HZ;
  net.ws.send(JSON.stringify({t:'st',id:net.id,x:Math.round(P.x),y:Math.round(P.y),d:P.dir,m:P.moving?1:0,c:P.prof||'',h:Math.round(100*P.hp/P.maxHp),n:net.name,pt:NET_PARTY,dead:P.dead?1:0}));}
function netDraw(list,ox,oy){ // from drawWorld(): ghosts join the y-sorted entity list
  for(const lid in net.loot){const l=net.loot[lid];list.push({y:l.y-4,f:()=>{const x=Math.round(l.x-ox),y=Math.round(l.y-oy);ctx.fillStyle='#000';ctx.fillRect(x-3,y-3,6,6);ctx.fillStyle=LOOT_COL[l.k];ctx.fillRect(x-2,y-2,4,4);}});}
  let n=0;for(const k in net.peers){const g=net.peers[k];if(g.dead||++n>NET_MAX)continue;
    list.push({y:g.y,f:()=>{drawChar(SPR[g.c?CLASSES[g.c].spr:'hero'],g.d,frameOf({dir:g.d,anim:time},g.m),g.x,g.y+4,1,ox,oy);
      textC(g.n,Math.round(g.x-ox),Math.round(g.y-30-oy),NET_PARTY&&g.pt===NET_PARTY?'#80ff80':'#ff8080'); // green = your party, red = can hit you
      const bx=Math.round(g.x-7-ox),by=Math.round(g.y-22-oy);ctx.fillStyle='#000';ctx.fillRect(bx-1,by-1,16,4);ctx.fillStyle='#063';ctx.fillRect(bx,by,14,2);ctx.fillStyle='#3f8';ctx.fillRect(bx,by,Math.round(14*g.h/100),2);}});}}

const HERO_NAMES=['DOGE','SHIBE','BARKUS','CHONK','FLOKI','KABOSU','AKITA','HERO'],PARTY_OPTS=['SOLO','ALPHA','BRAVO','GOLD'],CLASS_OPTS=['novice','warrior','archer','healer'];
let heroNameIdx=0,partyOptIdx=0,classOptIdx=0;
// ================= UPDATE =================
function update(dt){
  time+=dt;
  if(scene==='title'){updateParts(dt);
  if(kp('n')){heroNameIdx=(heroNameIdx+1)%HERO_NAMES.length;net.name=HERO_NAMES[heroNameIdx];sfx(440,0.06);}
  if(kp('c')){classOptIdx=(classOptIdx+1)%CLASS_OPTS.length;sfx(520,0.06);}
  if(kp('p')){partyOptIdx=(partyOptIdx+1)%PARTY_OPTS.length;NET_PARTY=PARTY_OPTS[partyOptIdx]==='SOLO'?'':PARTY_OPTS[partyOptIdx];sfx(600,0.06);}
  if(kp('enter',' ')){newGame();net.name=netClean(netParam('name'))||net.name||HERO_NAMES[heroNameIdx];if(CLASS_OPTS[classOptIdx]!=='novice'){P.wantClass=CLASS_OPTS[classOptIdx];toast('YOU START AS A NOVICE. SWEAR A CLASS AT A TRAINER (1 PER WALLET).',3.5);}scene='play';sfx(523,0.1);setTimeout(()=>sfx(784,0.15),100);}return;}
  updMarket(dt);chainTick(dt);
  netTick(dt); // opt-in multiplayer (no-op without ?mp); before the UI early-return so you stay visible while in menus
  if(toastMsg){toastMsg.life-=dt;if(toastMsg.life<=0)toastMsg=null;}
  if(winT>0)winT-=dt;
  shakeT=Math.max(0,shakeT-dt);
  if(state.bossT){state.bossT-=dt;if(state.bossT<=(netLive()?-10:0))bossCycle();} // D-095: offline the client runs the cycle; online the relay's {t:'cycle'} does (10 s fallback)
  if(ui){updateParts(dt);updateUI(dt);return;} // particles keep living while the world pauses (I-2)
  updateParts(dt);
  if(P.dead){P.deathT-=dt;if(P.deathT<=0)respawn();updateCam(dt);return;}
  const inCamp=playerInCamp();
  // rest
  if(kd('r')){if(inCamp){if(!P.resting){P.resting=true;sfx(330,0.2,'triangle',0.04);}}else if(!toastMsg)toast('YOU CAN ONLY REST INSIDE THE CAMP!',1.5);}
  else P.resting=false;
  if(P.resting){P.restT=(P.restT||0)+dt;if(P.restT>=REST_DELAY){const hpCap=Math.ceil(P.maxHp*REST_CAP);if(P.hp<hpCap)P.hp=Math.min(hpCap,P.hp+REST_HP*dt);P.mp=Math.min(P.maxMp,P.mp+REST_MP*dt);}}
  else P.restT=0;
  // move
  let vx=0,vy=0;
  if(!P.resting){if(kd('arrowleft','a'))vx-=1;if(kd('arrowright','d'))vx+=1;if(kd('arrowup','w'))vy-=1;if(kd('arrowdown','s'))vy+=1;}
  const l=Math.hypot(vx,vy);P.moving=l>0;
  if(l)stopFish('THE FISH GOT AWAY');
  if(l){vx/=l;vy/=l;if(P.atkT<=0){if(vx&&!vy)P.dir=vx>0?'right':'left';else if(vy&&!vx)P.dir=vy>0?'down':'up';else if(!(DIRV[P.dir][0]===Math.sign(vx)&&DIRV[P.dir][0])&&!(DIRV[P.dir][1]===Math.sign(vy)&&DIRV[P.dir][1]))P.dir=vy>0?'down':'up';}P.anim+=dt;}
  const spd=(P.atkT>0?45:82)*(1+MARKET.bullSpd*bullF())*classSpd();
  move(P,(vx*spd+P.kbx)*dt,(vy*spd+P.kby)*dt);
  const k=Math.pow(0.0005,dt);P.kbx*=k;P.kby*=k;
  P.iT-=dt;P.atkT-=dt;P.atkCd-=dt;
  if(!P.resting){
    if(kp(' ','j')&&P.atkCd<=0)attack();
    if(kp('k','q'))useSkill();
    if(kp('f')){if(P.fishing)stopFish('REELED IN');else startFish();}
  }
  updFish(dt);
  if(kp('e')){let best=null,bd=28;for(const n of NPCS){const d=dist(n.x,n.y,P.x,P.y);if(d<bd){bd=d;best=n;}}if(best)talk(best);}
  if(kp('i','tab'))invMenu();
  if(kp('p'))partyMenu(null);
  if(isMod()&&kp('m'))modMenu();
  if(P.moving||kp(' ','j','k','q','f')){P.idleT=0;if(P.lazyT>0)P.lazyT=Math.max(0,P.lazyT-dt*1.5);}
  else{P.idleT=(P.idleT||0)+dt;if(P.idleT>180&&!(P.lazyT>0)){P.lazyT=60;toast('LAZY DEBUFF: 60S SLOTH (-15% SPD)! MOVE & FIGHT!',2.5);}}
  if(P.lazyT>0){P.lazyT=Math.max(0,P.lazyT-dt);P.lazy=P.lazyT>0;}else{P.lazy=false;}
  // enemies
  for(const e of enemies)if(!e.dead)updEnemy(e,dt);
  enemies=enemies.filter(e=>!e.dead);
  // projectiles
  for(const p of projs){
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    const tx=Math.floor(p.x/16),ty=Math.floor((p.y+4)/16);
    if(solidFor(tx,ty,{enemy:p.kind==='bone'})){p.life=0;puff(p.x,p.y,p.kind==='bone'?'#e0e0e0':'#ffe040',4);continue;}
    if(p.kind==='bone'){if(!P.dead&&!playerInCamp()&&Math.abs(p.x-P.x)<P.hw+3&&Math.abs(p.y-(P.y-6))<10){hurtPlayer(p.dmg,{x:p.x-p.vx,y:p.y-p.vy+6});p.life=0;}}
    else{for(const e of enemies){if(e.dead||p.hits.has(e))continue;const ew=e.boss?14:e.mini?11:8,eh=e.boss?20:e.mini?15:11;if(Math.abs(p.x-e.x)<ew&&Math.abs(p.y-(e.y-(e.boss?14:6)))<eh){p.hits.add(e);if(p.basic)P.skills.combat++;damageEnemy(e,p.dmg,Math.sign(p.vx),Math.sign(p.vy));if(p.kind==='arrow'){p.life=0;break;}}}enemies=enemies.filter(e=>!e.dead);if(p.life>0&&netPvp(p.x,p.y,4,4,p.dmg,p.hits)&&p.kind==='arrow')p.life=0;}
  }
  projs=projs.filter(p=>p.life>0);
  // items
  for(const it of items){it.t+=dt;it.life-=dt;const d=dist(it.x,it.y,P.x,P.y);
    if(d<24){const s=130*dt/(d||1);it.x+=(P.x-it.x)*Math.min(1,s);it.y+=(P.y-it.y)*Math.min(1,s);}
    if(d<8){it.life=0;if(it.kind==='whisk'){P.whisk++;floater(P.x,P.y-24,'+1 WHISKER','#e0e0ff');sfx(1200,0.05,'square',0.03,400);}
      else if(it.kind==='yarn'){giveMats(YARN_MATS);floater(P.x,P.y-24,'+3 WOOD STONE IRON','#f0c030');toast('GOLDEN YARN! MINT MATERIALS: 3 WOOD, 3 STONE, 3 IRON',3);sfx(880,0.4,'triangle',0.06,600);}
      else if(it.kind==='steel'||it.kind==='wood'||it.kind==='stone'){floater(P.x,P.y-24,matAdd(it.kind,1)?'+1 '+it.kind.toUpperCase():'BAG FULL','#a0a8b0');sfx(1100,0.05,'square',0.03,300);}}}
  items=items.filter(i=>i.life>0);
  // respawn
  spawnT-=dt;if(spawnT<=0){spawnT=SPAWN_EVERY;let f=0;for(const e of enemies)if(e.zone==='field')f++;if(f<FIELD_POP)spawnEnemy('field');}
  dunT-=dt;if(dunT<=0){dunT=DUN_RESPAWN;let dn=0;for(const e of enemies)if(e.zone==='dun')dn++;if(dn<DUN_POP)spawnEnemy('dun');} // D-062 survivor: dungeon refills slowly
  miniT-=dt;if(miniT<=0){miniT=MINI_RESPAWN;for(const r in MINIS)if(!enemies.some(e=>e.mini&&e.region===r))spawnMini(r,MINIS[r]);} // D-063: mini-bosses return slowly (dead ones filtered out already)
  updateCam(dt);
}
function updateParts(dt){
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;p.life-=dt;}parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y-=22*dt;f.life-=dt;}floats=floats.filter(f=>f.life>0);
}
function updateCam(dt){
  const tx=P.x-W/2,ty=P.y-8-(H+HUD_H)/2;
  cam.x+=(tx-cam.x)*Math.min(1,dt*8);cam.y+=(ty-cam.y)*Math.min(1,dt*8);
  cam.x=Math.max(0,Math.min(MW*16-W,cam.x));cam.y=Math.max(-HUD_H,Math.min(MH*16-H,cam.y));
}

// ================= RENDER =================
function drawTiles(ox,oy){
  const x0=Math.floor(ox/16),y0=Math.floor(oy/16);
  for(let ty=y0;ty<=y0+H/16+1;ty++)for(let tx=x0;tx<=x0+W/16+1;tx++){
    ctx.drawImage(tileCanvas(tx,ty,get(tx,ty)),tx*16-Math.round(ox),ty*16-Math.round(oy));
  }
}
function frameOf(e,moving){const seq=(e.dir==='left'||e.dir==='right')?[0,1,0,1]:[0,1,0,2];return moving?seq[Math.floor(e.anim*8)%4]:0;}
function drawChar(spr,dir,fr,x,feetY,scale,ox,oy,tint){
  let c=spr.right[0];if(tint)c=tinted(c,tint); // D-044 (user): every character is drawn FROZEN, always facing right — no walk cycle,
  // no flip. dir/fr are kept in the signature (and in P.dir) because attacks, skills and fishing still aim in all 4 directions.
  const sx=Math.round(x-8*scale-ox),sy=Math.round(feetY-20*scale-oy);
  ctx.drawImage(SHADOW,0,0,12,4,Math.round(x-6*scale-ox),Math.round(feetY-3*scale+1-oy),12*scale,4*scale);
  ctx.drawImage(c,sx,sy,16*scale,20*scale);
}
function drawFire(ox,oy){
  const mx=CX*16+8-Math.round(ox),my=MOS_Y*16+8-Math.round(oy);
  ctx.drawImage(MOSAIC,mx-48,my-48); // the user's Dogecoin art (R1). No aura/sparkles — R2: light, no useless effects (D-075)
  const x=CX*16+8-Math.round(ox),y=FY*16+8-Math.round(oy);
  for(let i=0;i<14;i++){const h=5+Math.sin(time*14+i*1.7)*2+(i%3),w=i<7?i:13-i;const col=i<3||i>10?'#d83818':i<5||i>8?'#f88820':'#ffe060';ctx.fillStyle=col;ctx.fillRect(x-7+i,y+2-h-w*0.6,1,h+w*0.6);}
  ctx.fillStyle='#fff8c0';ctx.fillRect(x-1,y-3+Math.round(Math.sin(time*20)),2,3);
  if(Math.random()<0.3)parts.push({x:CX*16+8+R(-4,4),y:FY*16+2,vx:R(-5,5),vy:R(-30,-15),life:R(0.3,0.7),col:'#ffb040'});
}
function drawWorld(){
  const sx=shakeT>0?R(-2,2):0,sy=shakeT>0?R(-2,2):0;
  const ox=cam.x+sx,oy=cam.y+sy;
  drawTiles(ox,oy);
  drawFire(ox,oy);
  for(const it of items){if(it.life<4&&Math.floor(it.life*8)%2)continue;const bob=Math.round(Math.sin(it.t*5)*1.5);const img=it.kind==='whisk'?WHISK:it.kind==='yarn'?YARN:(MAT_ICONS[it.kind]||WHISK);ctx.drawImage(SHADOW,Math.round(it.x-6-ox),Math.round(it.y+1-oy));ctx.drawImage(img,Math.round(it.x-img.width/2-ox),Math.round(it.y-6+bob-oy));}
  const list=[];
  for(const n of NPCS)list.push({y:n.y,f:()=>{const near=dist(n.x,n.y,P.x,P.y)<40;const d=near?dirOf(P.x-n.x,P.y-n.y):'down';drawChar(SPR[n.spr],d,0,n.x,n.y+n.hh+Math.round(Math.sin(time*2+n.x)*0.6),1,ox,oy);if(near&&!ui){const b=Math.round(Math.sin(time*6));text('E',n.x-1-ox,n.y-30+b-oy,'#ffe040');}}});
  for(const e of enemies)list.push({y:e.y,f:()=>{
    const sc=e.boss?2:e.mini?1.5:1;let tint=e.flash>0?'#ffffff':null;if(e.state==='wind'&&Math.floor(time*20)%2)tint='#ff3030';
    drawChar(SPR[e.def.spr],e.dir,frameOf(e,e.state!=='wind'&&(e.wx||e.wy||e.state!=='wander')),e.x,e.y+e.hh,sc,ox,oy,tint);
    if(e.hp<e.maxHp&&!e.boss){const bx=Math.round(e.x-7-ox),by=Math.round(e.y+e.hh-24-oy);ctx.fillStyle='#000';ctx.fillRect(bx-1,by-1,16,4);ctx.fillStyle='#600';ctx.fillRect(bx,by,14,2);ctx.fillStyle='#f33';ctx.fillRect(bx,by,Math.ceil(14*e.hp/e.maxHp),2);}
  }});
  if(!P.dead)list.push({y:P.y,f:()=>{
    if(P.iT>0&&Math.floor(time*20)%2)return;
    const hSpr=SPR[classOf()?classOf().spr:'hero'];
    if(P.resting){drawChar(hSpr,'down',0,P.x,P.y+P.hh+1,1,ox,oy);const z=(time*1.2)%1;text('Z',P.x+5+z*6-ox,P.y-22-z*10-oy,'#c0d8ff');text('Z',P.x+3+((z+0.5)%1)*6-ox,P.y-22-((z+0.5)%1)*10-oy,'#c0d8ff');}
    else drawChar(hSpr,P.dir,P.atkT>0?0:frameOf(P,P.moving),P.x,P.y+P.hh,1,ox,oy);
    if(P.atkT>0)drawSlash(ox,oy);
    if(P.fishing)drawFishing(ox,oy);
    else if(!ui&&!P.resting&&(waterAt(P.dir)||nodeAt(P.dir))){const b=Math.round(Math.sin(time*6));textC(waterAt(P.dir)?'F FISH':'F GATHER',Math.round(P.x-ox),P.y-30+b-oy,'#80c0ff');}
  }});
  netDraw(list,ox,oy); // other players (opt-in multiplayer, D-040)
  list.sort((a,b)=>a.y-b.y);for(const o of list)o.f();
  for(const p of projs){if(p.kind==='bone')ctx.drawImage(BONE[Math.floor(time*12)%2],Math.round(p.x-4-ox),Math.round(p.y-4-oy));
    else if(p.kind==='arrow'){const hz=p.dir==='left'||p.dir==='right',x=Math.round(p.x-ox),y=Math.round(p.y-oy);ctx.fillStyle='#caa060';if(hz)ctx.fillRect(x-5,y-1,10,2);else ctx.fillRect(x-1,y-5,2,10);ctx.fillStyle='#fff0c0';ctx.fillRect(x+(p.vx>0?3:p.vx<0?-5:-1),y+(p.vy>0?3:p.vy<0?-5:-1),2,2);}
    else{const c=['#ffe040','#ff8040','#40e0ff'][Math.floor(time*14)%3];text('WOW',p.x-6-ox,p.y-3-oy,c,1,'#402000');}}
  for(const p of parts){ctx.fillStyle=p.col;ctx.fillRect(Math.round(p.x-ox),Math.round(p.y-oy),p.life>0.3?2:1,p.life>0.3?2:1);}
  for(const f of floats)textC(f.t,f.x-ox,f.y-oy,f.col);
  // boss hp bar
  const boss=enemies.find(e=>e.boss);
  if(boss&&zoneOf(P.x,P.y)==='boss'){ctx.fillStyle='#000';ctx.fillRect(59,H-14,202,8);ctx.fillStyle='#401020';ctx.fillRect(60,H-13,200,6);ctx.fillStyle='#e02050';ctx.fillRect(60,H-13,Math.ceil(200*boss.hp/boss.maxHp),6);ctx.fillStyle='#ff80a0';ctx.fillRect(60,H-13,Math.ceil(200*boss.hp/boss.maxHp),1);textC('THE CAT LORD',W/2,H-22,'#ffd0e0');}
}
function drawSlash(ox,oy){
  const p=1-P.atkT/0.18,base=ANG[P.dir],cx=P.x-ox,cy=P.y-6-oy;
  if(P.prof==='archer'){
    for(let da=-0.9;da<=0.9;da+=0.1){const r=11,an=base+da;ctx.fillStyle='#9a6a2a';ctx.fillRect(Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r),2,2);}
    const x0=cx+Math.cos(base-0.9)*10,y0=cy+Math.sin(base-0.9)*10,x1=cx+Math.cos(base+0.9)*10,y1=cy+Math.sin(base+0.9)*10;
    ctx.fillStyle='#e8e8e8';for(let i=0;i<=8;i++)ctx.fillRect(Math.round(x0+(x1-x0)*i/8),Math.round(y0+(y1-y0)*i/8),1,1);
    return;
  }
  const a0=base-1.25,a=a0+2.5*Math.min(1,p),maxR=P.prof==='warrior'?17:14;
  for(let r=3;r<=maxR;r++){const x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);ctx.fillStyle=P.prof==='healer'?'#80e8ff':'#7a4a1a';ctx.fillRect(x,y,1,1);}
  for(let dr=-2;dr<=2;dr++)for(let da=-0.15;da<=0.15;da+=0.07){const r=maxR+dr,an=a+da;const x=Math.round(cx+Math.cos(an)*r),y=Math.round(cy+Math.sin(an)*r);ctx.fillStyle=P.prof==='healer'?'#50f0b0':P.prof==='warrior'?(dr<0?'#b02020':'#d8d8e8'):(dr<0?'#a07040':'#c09060');ctx.fillRect(x,y,1,1);}
  ctx.fillStyle=P.prof==='healer'?'rgba(80,240,180,0.35)':P.prof==='warrior'?'rgba(255,90,60,0.35)':'rgba(200,180,140,0.3)';
  for(let t=a-0.6;t<a;t+=0.08)for(let r=maxR-2;r<=maxR+2;r+=2)ctx.fillRect(Math.round(cx+Math.cos(t)*r),Math.round(cy+Math.sin(t)*r),1,1);
}
function drawFishing(ox,oy){
  // line from the paw to a bobbing float, plus a catch bar over the head
  const hx=P.x-ox,hy=P.y-10-oy,bx=Math.round(P.fishX-ox),by=Math.round(P.fishY-oy+Math.sin(time*5));
  const n=Math.max(1,Math.round(Math.hypot(bx-hx,by-hy)));ctx.fillStyle='#e8e8f0';
  for(let i=0;i<=n;i++){const t=i/n;ctx.fillRect(Math.round(hx+(bx-hx)*t),Math.round(hy+(by-hy)*t+Math.sin(t*Math.PI)*-3),1,1);}
  ctx.fillStyle='#000';ctx.fillRect(bx-2,by-2,4,4);ctx.fillStyle='#ff3030';ctx.fillRect(bx-1,by-1,2,1);ctx.fillStyle='#fff';ctx.fillRect(bx-1,by,2,1);
  const x=Math.round(P.x-8-ox),y=Math.round(P.y-(P.dir==='up'?38:30)-oy);ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,18,5);ctx.fillStyle='#08143a';ctx.fillRect(x,y,16,3);
  ctx.fillStyle='#60c0ff';ctx.fillRect(x,y,Math.ceil(16*Math.min(1,P.fishT/P.fishDur)),3);
}
function bar(x,y,w,v,max,c1,c2,bg){ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,w+2,6);ctx.fillStyle=bg;ctx.fillRect(x,y,w,4);const f=Math.ceil(w*Math.max(0,v)/max);ctx.fillStyle=c1;ctx.fillRect(x,y,f,4);ctx.fillStyle=c2;ctx.fillRect(x,y,f,1);}
function questText(){const s=state.stage;return s===0?'TALK TO ELDER SHIBE':s===1?`SLAY CATS ${Math.min(P.kills,8)}/8`:s===2?`SLAY BRUTES ${Math.min(P.bruteKills,3)}/3`:s===3?'DEFEAT THE CAT LORD':'COMPLETE! MUCH WOW';}
const hudTag=()=>P.prof==='archer'?`ARCHER [SPC:ARROW K:VOLLEY ${SKILL_MP.archer}MP]`:P.prof==='healer'?`HEALER [SPC:STAFF K:MEND ${SKILL_MP.healer}MP]`:P.prof==='warrior'?`WARRIOR [SPC:CLEAVE K:SLAM ${SKILL_MP.warrior}MP]`:'NO CLASS [K:BARK 10MP]'; // D-038: HUD class + K/Q MP cost
function drawHUD(){
  ctx.fillStyle='#0c0c24';ctx.fillRect(0,0,W,HUD_H);ctx.fillStyle='#3848a0';ctx.fillRect(0,HUD_H-2,W,1);ctx.fillStyle='#000';ctx.fillRect(0,HUD_H-1,W,1);
  text('HP',3,3,'#ff6060');bar(14,3,64,P.hp,P.maxHp,'#e83030','#ff9090','#3a0808');text(`${Math.ceil(P.hp)}/${P.maxHp}`,82,3,'#fff');
  text('MP',3,10,'#60a0ff');bar(14,10,64,P.mp,P.maxMp,'#3070f0','#90c0ff','#08143a');text(`${Math.floor(P.mp)}/${P.maxMp}`,82,10,'#fff');
  ctx.drawImage(WHISK,118,2);text('x'+P.whisk,129,3,'#e0e0ff');
  ctx.drawImage(COIN,118,9);
  const wBal=wallet.connected&&wallet.bal!=null;
  text(wBal?fmtD(wallet.bal)+' DOGE':'NO WALLET',128,10,wBal?'#ffd700':'#808890'); // D-097: the only DOGE is the wallet's testnet DOGE
  const curP=oracle.loaded?oracle.price:mkt.p;
  text('DOGE $'+curP.toFixed(curP<1?3:2),168,3,oracle.loaded?'#80f8c0':'#f8d050');
  {const pc=Math.round(mkt.sent*MARKET.sentScale*100),up=pc>=0;text((up?'+':'')+pc+'% '+(pc>2?'BULL':pc<-2?'BEAR':'FLAT'),168,10,up?'#60e060':'#ff5050');}
  text(state.bossT>0?`BOSS IN ${Math.ceil(state.bossT)}S`:'RAID ON',214,3,state.bossT>0?'#ffa0a0':'#80ff80'); // D-095 raid cycle
  text(questText(),222,10,'#fff');
  if(P.lazy||P.lazyT>0)text(P.lazyT>0?`LAZY ${Math.ceil(P.lazyT)}S`:'LAZY',276,10,'#ff5050');
  else if(isMod())text('MOD[M]',285,10,'#ffc040');
  if(!P.dead&&playerInCamp()&&!ui){const wait=P.resting&&P.restT<REST_DELAY;const hpCap=Math.ceil(P.maxHp*REST_CAP);const capped=P.hp>=hpCap;const t=wait?'CATCHING BREATH... '+Math.ceil(REST_DELAY-P.restT):capped&&P.resting?'HP CAPPED AT 60%. EAT FOOD FOR MORE.':P.resting?'RESTING... HP/MP RECOVERING':(wallet.connected?`CHAIN ${shortAddr(wallet.addr)} (${wallet.bal==null?'?':fmtD(wallet.bal)} TESTNET DOGE)  R=REST  I=BAG`:'SAFE CAMP - R REST  I BAG  SPHINX=WALLET');textC(t,W/2,H-9,capped&&P.resting?'#f0c040':P.resting&&!wait?'#a0ffa0':'#c8e8ff');}
  if(!ui&&!P.dead){const c=classOf();text(hudTag(),3,playerInCamp()?H-17:H-9,c?CLASS_COL[P.prof]:'#80809a');} // persistent class + skill MP tag (D-028, D-038)
}
function box(x,y,w,h){ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle='#e8e8f8';ctx.fillRect(x,y,w,h);ctx.fillStyle='#0a1460';ctx.fillRect(x+2,y+2,w-4,h-4);ctx.fillStyle='#14248e';ctx.fillRect(x+2,y+2,w-4,Math.floor((h-4)*0.55));ctx.fillStyle='#1c30a8';ctx.fillRect(x+2,y+2,w-4,Math.floor((h-4)*0.2));}
function drawUI(){
  if(!ui)return;
  if(ui.type==='dialog'){
    const n=ui.npc;box(8,148,304,70);
    let tx=16;
    if(n){box(12,152,38,58);const bob=Math.round(Math.sin(time*4)*1.5);ctx.drawImage(SPR[n.spr].right[0],15,161+bob,32,40);tx=58;box(8,137,n.name.length*4+8,12);text(n.name,12,140,'#ffe040');}
    const page=ui.pages[ui.idx],shown=page.slice(0,Math.floor(ui.chars));
    const lines=wrap(page,n?60:72);let used=0;
    lines.forEach((ln,i)=>{const take=Math.max(0,Math.min(ln.length,shown.length-used));text(ln.slice(0,take),tx,156+i*9,'#fff');used+=ln.length+1;});
    text(`PAGE ${ui.idx+1}/${ui.pages.length}`,W-60,210,'#80d0ff');
    if(ui.chars>=page.length&&Math.floor(time*3)%2)text('>>',W-14,210,'#ffe040');
  }else{
    const all=ui.build(),top=Math.max(0,Math.min(ui.sel-Math.floor(MENU_ROWS/2),all.length-MENU_ROWS)),opts=all.slice(top,top+MENU_ROWS),h=44+opts.length*11;const y=Math.round((H-h)/2)+6;
    box(30,y,260,h);
    textC(ui.title,W/2,y+6,'#ffe040');
    if(ui.chain&&wallet.connected){const cp=oracle.loaded?oracle.price:mkt.p;text(`WALLET: ${wallet.bal==null?'?':fmtD(wallet.bal)} TESTNET DOGE`,40,y+16,'#f8d050');text(`ITEMS: ${chainData.inv.length}  STAKED: ${fromWei(chainData.staked)}`,172,y+16,'#60e0a0');}
    else text('TESTNET DOGE: CONNECT AT THE SPHINX',40,y+16,'#b0a060');
    ctx.fillStyle='#3848a0';ctx.fillRect(36,y+24,248,1);
    if(top>0)text('^',282,y+16,'#ffe040');if(top+MENU_ROWS<all.length)text('V',282,y+h-10,'#ffe040');
    opts.forEach((o,i)=>{const yy=y+29+i*11,idx=i+top,sel=idx===ui.sel,lb=o.label||'';
      const isMint=ui.pooldex&&/^MINT /.test(lb),isBal=ui.pooldex&&/^WALLET ITEMS/.test(lb),isPool=ui.pooldex&&/^(POOL | SWAP | ADD |CREATE POOL)/.test(lb);
      const isNft=o.isNft||o.nft||/^NFT #|^SACRIFICE #|^MINT .* NFT/.test(lb);
      if(!sel){if(isNft){ctx.fillStyle='#300808';ctx.fillRect(36,yy-2,248,10);}else if(isMint){ctx.fillStyle='#3a2208';ctx.fillRect(36,yy-2,248,10);}else if(isBal){ctx.fillStyle='#101838';ctx.fillRect(36,yy-2,248,10);}else if(isPool){ctx.fillStyle='#0c2624';ctx.fillRect(36,yy-2,248,10);}}
      if(sel){ctx.fillStyle=isNft?'#8c1414':isMint?'#b86810':'#2a48d0';ctx.fillRect(36,yy-2,248,9);text('>',38,yy,'#ffe040');}
      if(isNft){ctx.fillStyle='#ff4040';ctx.fillRect(43,yy+2,3,3);px(ctx,44,yy+1,'#ffa0a0');px(ctx,44,yy+5,'#a01010');}
      else if(isMint){ctx.fillStyle='#ffd860';ctx.fillRect(43,yy+2,3,3);}
      else if(isPool){ctx.fillStyle='#80f8c0';ctx.fillRect(43,yy+2,3,3);}
      const afford=true,col=o.col||(sel?(isNft?'#ff9090':'#fff'):isNft?'#ff4040':isMint?'#ffd860':isPool?'#80f8c0':isBal?'#f8e090':'#c8d0f0');
      text(lb.length>58?lb.slice(0,57)+'.':lb,49,yy,col);if(o.cost)text(o.cost+' DOGE',280-(String(o.cost).length+4)*4,yy,afford?'#f8d050':'#a05050');});
    text(ui.msg||(all[ui.sel]&&all[ui.sel].adj?'W/S SELECT  A/D PRICE  E OK  ESC LEAVE':'W/S SELECT   E BUY   ESC LEAVE'),40,y+h-10,ui.msg?'#a0ffa0':'#8090c0');
  }
}
const LOGO={D:['11110','10001','10001','10001','10001','10001','11110'],O:['01110','10001','10001','10001','10001','10001','01110'],G:['01110','10001','10000','10111','10001','10001','01111'],E:['11111','10000','10000','11110','10000','10000','11111'],N:['10001','11001','10101','10011','10001','10001','10001']};
function logo(x,y,s,col,hi){let cx=x;for(const ch of 'DOGEON'){const g=LOGO[ch];for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(g[r][c]==='1'){ctx.fillStyle=r<2?hi:col;ctx.fillRect(cx+c*s,y+r*s,s,s);}cx+=6*s;}}
function drawTitle(){
  cam.x=(Math.sin(time*0.05)*0.5+0.5)*(MW*16-W);cam.y=360+Math.sin(time*0.07)*100;
  drawTiles(cam.x,cam.y);drawFire(cam.x,cam.y);
  ctx.fillStyle='rgba(4,4,20,0.62)';ctx.fillRect(0,0,W,H);
  const s=5,tw=6*6*s-s,x=Math.round((W-tw)/2),y=22;
  for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2],[-2,-2],[2,2],[-2,2],[2,-2]])logo(x+dx,y+dy,s,'#1a0a00','#1a0a00');
  logo(x,y+3,s,'#8a4008','#8a4008');logo(x,y,s,'#f8c838','#fff4b0');
  textC('- THE GRAND HEIST - POWERED BY DOGEOS',W/2,y+44,'#ffe8c0',1);
  const b=Math.round(Math.sin(time*4));
  ctx.drawImage(SPR.hero.right[0],W/2-24,96+b,48,60);
  ctx.drawImage(SPR.ninja.right[0],W/2+44,108,32,40);
  ctx.drawImage(SPR.bull.right[0],W/2+76,104-b,32,40);
  ctx.drawImage(SPR.frog.right[0],W/2-110,108,32,40);
  ctx.drawImage(SPR.knight.right[0],W/2-80,108,16,20);ctx.drawImage(SPR.alley.right[0],W/2+30,118,16,20);
  ctx.drawImage(SPR.merchant.right[0],10,180,16,20);ctx.drawImage(SPR.bank.right[0],28,180,16,20);ctx.drawImage(SPR.sage.right[0],46,180,16,20);
  if(Math.floor(time*2.5)%2)textC('PRESS ENTER TO START',W/2,152,'#ffffff',2);
  const curHero=net.name||HERO_NAMES[heroNameIdx],curCls=CLASS_OPTS[classOptIdx].toUpperCase(),curPt=NET_PARTY||'SOLO (PVP)';
  textC(`[N] NAME: ${curHero}   [C] CLASS: ${curCls}   [P] PARTY: ${curPt}`,W/2,172,'#ffe040');
  textC('WASD MOVE  SPACE SLASH  K BARK/SKILL  F FISH  I BAG  P PARTY',W/2,190,'#a0b0e0');
  textC('E TALK  R REST  REST CAPS AT 60% HP - EAT FOOD!',W/2,199,'#a0b0e0');
  textC('WALLET + DOGEOS TESTNET: TALK TO THE SPHINX. CLICK GAME IF KEYS FAIL',W/2,212,'#606890');
}
function render(){
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  if(scene==='title'){drawTitle();return;}
  drawWorld();
  // falling DOGE price: darker, redder world
  if(bearF()>0){ctx.fillStyle=`rgba(70,0,0,${(0.45*bearF()).toFixed(3)})`;ctx.fillRect(0,0,W,H);}
  // ruins ambience
  if(zoneOf(P.x,P.y)!=='field'){ctx.fillStyle='rgba(20,0,40,0.22)';ctx.fillRect(0,0,W,H);}
  if(P.dead){const a=Math.min(1,(2.2-P.deathT)/1.5);ctx.fillStyle=`rgba(60,0,0,${a*0.75})`;ctx.fillRect(0,0,W,H);textC('YOU WERE DEFEATED',W/2,H/2-10,'#ff5050',2);textC('SUCH SAD. MUCH OUCH.',W/2,H/2+8,'#ffc0c0');}
  drawHUD();
  if(toastMsg&&!ui){const w=toastMsg.t.length*4+12;box((W-w)/2,24,w,13);textC(toastMsg.t,W/2,28,'#ffe040');}
  if(winT>0){const a=Math.min(1,winT);ctx.fillStyle=`rgba(0,0,0,${0.5*a})`;ctx.fillRect(0,80,W,56);textC('VICTORY!',W/2,88,'#f8c838',3);textC('SUCH HERO. MUCH WOW. THE CAT LORD IS NO MORE.',W/2,112,'#ffffff');textC('RETURN TO ELDER SHIBE',W/2,122,'#a0ffa0');}
  drawUI();
}

// ================= LOOP =================
genMap();
let last=performance.now();
function loop(now){
  const dt=Math.max(0,Math.min(0.05,(now-last)/1000));last=now;
  update(dt);render();
  for(const k in pressed)delete pressed[k];
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
cv.focus();
checkAuthWallet().catch(()=>{});
