(function(){
'use strict';
const $=id=>document.getElementById(id);
const WEB=(typeof window!=='undefined'&&window.HG_WEB)||null;
const TAU=Math.PI*2, DEG=Math.PI/180;
const G=20, DRAG=0.1, STEP=1/120, SIDE_K=12, LIFT_K=1.2, SLOPE_G=55, WIND_K=0.55;
const TILT=0.55, SUN={x:0.42,y:0.3};
const CUP_R=0.62, BALL_R=0.24, POLE_H=4.2;
const PUTT={capR:.7,capV:8,preview:2.2};
const PUTT_AIM={from:32,len:32,gap:8};
const AIM_SHOW={from:.8,grow:.6,mark:.78,show:.6,rate:18,near:10,fade:1.5,clubs:['9I','PW','SW']};
const FLY_Y={hold:1.6,rate:12,lift:15,gap:19,run:'#ffd84a'};
const reduceMotion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const rand=Math.random;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash2(i,j){let h=(Math.imul(i|0,374761393)+Math.imul(j|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=hash2(ix,iy),b=hash2(ix+1,iy),c=hash2(ix,iy+1),d=hash2(ix+1,iy+1);const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;}
const S={OB:0,ROUGH:1,FAIRWAY:2,GREEN:3,FRINGE:4,SAND:5,WATER:6,TEE:7,ISLAND:8,ICE:9};
const SURF=[];
SURF[S.OB]     ={name:'OB',e:.16,keep:.42,mu:3.2,grip:.2,lie:.92,spin:.35,dot:'#2f5a3a'};
SURF[S.ROUGH]  ={name:'ラフ',e:.16,keep:.42,mu:3.2,grip:.2,lie:.92,spin:.35,dot:'#4f8a3e'};
SURF[S.FAIRWAY]={name:'フェアウェイ',e:.26,keep:.6,mu:1.25,grip:.6,lie:1,spin:1,dot:'#7cc05a'};
SURF[S.GREEN]  ={name:'グリーン',e:.2,keep:.55,mu:.55,grip:1,lie:1,spin:1,dot:'#8fd46c'};
SURF[S.FRINGE] ={name:'カラー',e:.22,keep:.55,mu:.9,grip:.8,lie:1,spin:1,dot:'#6fb257'};
SURF[S.SAND]   ={name:'バンカー',e:.03,keep:.12,mu:10,grip:0,lie:.65,spin:.6,dot:'#e6d3a3'};
SURF[S.WATER]  ={name:'池',e:0,keep:0,mu:99,grip:0,lie:0,spin:0,dot:'#3f86a6'};
SURF[S.TEE]    ={name:'ティー',e:.26,keep:.6,mu:1.25,grip:.6,lie:1,spin:1,dot:'#86c862'};
SURF[S.ISLAND] ={name:'ラフ',e:.16,keep:.42,mu:3.2,grip:.2,lie:.92,spin:.35,dot:'#4f8a3e'};
SURF[S.ICE]    ={name:'氷',e:.42,keep:.9,mu:.16,grip:.15,lie:.92,spin:.4,dot:'#cfe6f2'};
const SURF_FROZEN={[S.GREEN]:{...SURF[S.GREEN],e:.34,keep:.8,mu:.34,grip:.4},[S.FRINGE]:{...SURF[S.FRINGE],e:.3,keep:.72,mu:.5,grip:.45}};
function SP(s){ return (hole&&hole.frozenGreen&&SURF_FROZEN[s])||SURF[s]; }
const carryLabel=c=>Math.round(c/5)*5;
const CLUBS=[
  {id:'1W',loft:13,v:108.6,spin:0,carry:0,chipLoft:4,chipV:.69},
  {id:'4UT',loft:23,v:77.4,spin:.3,carry:0,chipLoft:6,chipV:.85},
  {id:'5I',loft:19,v:79.3,spin:.15,carry:0,chipLoft:4,chipV:.83},
  {id:'9I',loft:30,v:58.4,spin:.5,carry:0,chipLoft:9.5,chipV:.87},
  {id:'PW',loft:37,v:51.2,spin:.55,carry:0,chipLoft:16.5,chipV:.84},
  {id:'SW',loft:46,v:43.9,spin:.6,carry:0,chipLoft:31,chipV:.8},
  {id:'PT',loft:0,v:30,spin:0,carry:0,chipLoft:0,chipV:1},
];
const PT_I=CLUBS.findIndex(c=>c.id==='PT');
const CHIP={a:.2,b:.6,keep:1.7};
const CLUB_IMG={"1W": "data:image/webp;base64,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", "4UT": "data:image/webp;base64,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", "5I": "data:image/webp;base64,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", "9I": "data:image/webp;base64,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", "PW": "data:image/webp;base64,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", "SW": "data:image/webp;base64,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", "PT": "data:image/webp;base64,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"};
const HOLES=[
{ name:'はじまりの池', par:3, yards:136, seed:11,
  tip:'左手前に池。9番アイアンで池の右側を越えて、グリーンに乗せよう。',
  tee:{x:0,y:0}, pin:{x:9,y:-138},
  bounds:{x0:-48,x1:58,y0:-172,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[1,-56],[4,-88],[6,-116]],w:11}],
  green:{cx:6,cy:-136,rx:14,ry:11,rot:.25},
  bunkers:[{cx:22,cy:-127,rx:6,ry:4,rot:.6},{cx:-9,cy:-150,rx:6,ry:3.5,rot:-.3}],
  water:[{cx:-9,cy:-100,rx:16,ry:10,rot:-.35}],
  hills:[{x:32,y:-60,s:18,a:2.6},{x:-32,y:-28,s:15,a:1.8},{x:-28,y:-150,s:12,a:2.2},{x:30,y:-150,s:10,a:1.6}],
  slope:{gx:-.022,gy:-.042}, bumps:[{x:1,y:-133,s:4,a:.35}],
  treeLines:[[-30,-20,-34,-160,9],[40,-15,44,-165,9],[-20,-166,35,-166,8]],
  trees:[{x:-26,y:-118,r:6,h:12},{x:25,y:-100,r:5,h:10}],
  wind:{dir:.15,speed:2.4}, koi:true },
{ name:'ドッグレッグ', par:4, yards:312, seed:23,
  tip:'右に曲がるコーナーは木で隠れている。右へカーブをかけて回り込もう。',
  tee:{x:0,y:0}, pin:{x:68,y:-300},
  bounds:{x0:-45,x1:110,y0:-332,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-24],[0,-118],[14,-182],[42,-238],[58,-272]],w:15}],
  green:{cx:64,cy:-296,rx:15,ry:12,rot:-.5},
  bunkers:[{cx:-13,cy:-176,rx:8,ry:5.5,rot:.5},{cx:49,cy:-289,rx:5.5,ry:4,rot:1},{cx:81,cy:-306,rx:6,ry:3.5,rot:-.4}],
  water:[{cx:88,cy:-258,rx:12,ry:7.5,rot:.6}],
  hills:[{x:-30,y:-90,s:16,a:3},{x:26,y:-60,s:14,a:2.2},{x:72,y:-205,s:20,a:3.2},{x:6,y:-262,s:14,a:2.6},{x:40,y:-320,s:12,a:2}],
  slope:{gx:.034,gy:-.016}, bumps:[{x:59,y:-291,s:5,a:-.3}],
  treeLines:[[-28,-20,-30,-150,9],[-26,-200,10,-300,9],[24,-30,26,-100,10]],
  trees:[{x:30,y:-128,r:6,h:13},{x:40,y:-140,r:6.5,h:14},{x:29,y:-153,r:5,h:12},{x:46,y:-158,r:6,h:14},{x:36,y:-167,r:5.5,h:13},{x:52,y:-176,r:6,h:12},{x:58,y:-150,r:6,h:13},{x:60,y:-195,r:5,h:11}],
  wind:{dir:2.36,speed:3.2}, koi:true },
{ name:'浮島グリーン', par:3, yards:118, seed:37,
  tip:'グリーンの周りはすべて池。風に流されるぶんを、狙いとカーブで打ち消そう。',
  tee:{x:0,y:0}, pin:{x:4,y:-121},
  bounds:{x0:-52,x1:54,y0:-162,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[-2,-52],[0,-80]],w:10}],
  green:{cx:2,cy:-118,rx:11,ry:9,rot:.15},
  bunkers:[{cx:6,cy:-104.5,rx:2.4,ry:1.6,rot:0}],
  islands:[{cx:2,cy:-117,rx:17,ry:15,rot:.15}],
  water:[{cx:1,cy:-113,rx:33,ry:26,rot:.08}],
  hills:[{x:-35,y:-40,s:14,a:2},{x:38,y:-50,s:16,a:2.4},{x:0,y:-155,s:18,a:1.5}],
  slope:{gx:-.03,gy:-.02}, bumps:[{x:6,y:-122,s:3.5,a:.25}],
  treeLines:[[-40,-20,-44,-140,9],[42,-20,46,-140,9],[-35,-152,40,-152,9]],
  trees:[],
  wind:{dir:-.5,speed:4.2}, koi:true, drop:{x:-3,y:-74} },
{ name:'クロスバンカー', par:4, yards:300, seed:41,
  tip:'斜めに並ぶバンカー。左ほど短く越えられるが、左は林。どこまで攻めるか。',
  tee:{x:0,y:0}, pin:{x:10,y:-298},
  bounds:{x0:-42,x1:50,y0:-325,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[0,-150],[6,-230],[10,-262]],w:15}],
  green:{cx:10,cy:-296,rx:14,ry:11,rot:-.15},
  bunkers:[{cx:-14,cy:-190,rx:6,ry:3.5,rot:-.75},{cx:-4,cy:-200,rx:6,ry:3.5,rot:-.75},{cx:6,cy:-210,rx:6,ry:3.5,rot:-.75},{cx:16,cy:-220,rx:6,ry:3.5,rot:-.75},{cx:26,cy:-230,rx:6,ry:3.5,rot:-.75},
    {cx:-4,cy:-281,rx:6,ry:3.5,rot:.3},{cx:27,cy:-292,rx:4.5,ry:6,rot:.2}],
  water:[],
  hills:[{x:-30,y:-100,s:18,a:2.4},{x:34,y:-160,s:20,a:2.6},{x:-26,y:-300,s:14,a:2},{x:40,y:-300,s:12,a:1.8}],
  slope:{gx:-.02,gy:-.03}, bumps:[{x:16,y:-300,s:4,a:-.3}],
  treeLines:[[-30,-20,-32,-250,9],[38,-20,40,-250,9]],
  trees:[{x:-24,y:-270,r:6,h:13},{x:-30,y:-285,r:5.5,h:12}],
  wind:{dir:-1.35,speed:2.4}, koi:false },
{ name:'小川', par:5, yards:470, seed:43,
  tip:'小川がフェアウェイを横切り、グリーンの右手前まで続く。2打目で川を越えて狙うか、刻むか。',
  tee:{x:0,y:0}, pin:{x:40,y:-466},
  bounds:{x0:-55,x1:80,y0:-500,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[-4,-200],[0,-300],[16,-380],[30,-430]],w:15}],
  green:{cx:40,cy:-462,rx:14,ry:12,rot:.3},
  bunkers:[{cx:-24,cy:-205,rx:7,ry:4,rot:.3},{cx:22,cy:-462,rx:5,ry:7,rot:.3},{cx:44,cy:-482,rx:8,ry:3.5,rot:.2}],
  water:[{cx:-38,cy:-244,rx:20,ry:5,rot:.22},{cx:-10,cy:-252,rx:20,ry:5.5,rot:.2},{cx:16,cy:-261,rx:19,ry:5,rot:.4},{cx:34,cy:-280,rx:6,ry:20,rot:.45},{cx:44,cy:-312,rx:5.5,ry:22,rot:.05},{cx:50,cy:-350,rx:5.5,ry:22,rot:-.12},{cx:56,cy:-390,rx:5.5,ry:24,rot:.1},{cx:62,cy:-432,rx:13,ry:8,rot:-.5}],
  hills:[{x:-38,y:-120,s:20,a:2.6},{x:30,y:-150,s:18,a:2.2},{x:-20,y:-360,s:22,a:3},{x:70,y:-470,s:14,a:2}],
  slope:{gx:.025,gy:-.02}, bumps:[{x:34,y:-458,s:4,a:.3}],
  treeLines:[[-42,-20,-44,-460,9],[36,-20,30,-225,9],[70,-300,72,-420,9]],
  trees:[{x:-30,y:-430,r:6,h:13}],
  wind:{dir:.6,speed:2.6}, koi:true },
{ name:'ポットバンカー', par:3, yards:108, seed:47,
  tip:'小さなグリーンを7つのバンカーが囲む。9番アイアンのバックスピンで、落ちた所に止めよう。',
  tee:{x:0,y:0}, pin:{x:-1,y:-108},
  bounds:{x0:-42,x1:42,y0:-140,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-40],[-1,-80]],w:9}],
  green:{cx:-2,cy:-106,rx:10,ry:8,rot:-.2},
  bunkers:[{cx:-14,cy:-96,rx:3,ry:2.4,rot:0},{cx:-3,cy:-93,rx:3.2,ry:2.2,rot:0},{cx:9,cy:-96,rx:3,ry:2.4,rot:.3},{cx:14,cy:-108,rx:2.6,ry:3.4,rot:0},{cx:9,cy:-119,rx:3,ry:2.4,rot:-.3},{cx:-4,cy:-121,rx:3.4,ry:2.2,rot:0},{cx:-16,cy:-115,rx:2.8,ry:3,rot:.2}],
  water:[],
  hills:[{x:-30,y:-40,s:14,a:2},{x:28,y:-70,s:16,a:2.4},{x:0,y:-140,s:16,a:1.8}],
  slope:{gx:-.03,gy:-.035}, bumps:[{x:3,y:-110,s:3,a:.3}],
  treeLines:[[-30,-20,-32,-125,9],[30,-20,32,-125,9]],
  trees:[],
  wind:{dir:2.8,speed:3.4}, koi:false },
{ name:'池の左コーナー', par:4, yards:330, seed:53,
  tip:'左へ曲がるコーナーは池。左へカーブをかけて池を越えれば近道。まっすぐ行けば安全。',
  tee:{x:0,y:0}, pin:{x:-94,y:-290},
  bounds:{x0:-130,x1:48,y0:-322,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[2,-150],[-8,-215],[-40,-260],[-70,-280]],w:15}],
  green:{cx:-92,cy:-288,rx:14,ry:11,rot:.4},
  bunkers:[{cx:18,cy:-222,rx:7,ry:4.5,rot:-.6},{cx:-74,cy:-304,rx:6,ry:3.5,rot:.4},{cx:-110,cy:-278,rx:4,ry:6,rot:.2}],
  water:[{cx:-50,cy:-170,rx:30,ry:40,rot:.5},{cx:-75,cy:-225,rx:18,ry:14,rot:.3}],
  hills:[{x:30,y:-90,s:18,a:2.5},{x:-100,y:-120,s:24,a:2.6},{x:20,y:-300,s:18,a:2.4},{x:-120,y:-310,s:12,a:1.8}],
  slope:{gx:.02,gy:-.03}, bumps:[{x:-98,y:-292,s:4,a:.3}],
  treeLines:[[-24,-20,-28,-110,9],[36,-20,38,-230,9],[30,-250,-40,-318,9]],
  trees:[],
  wind:{dir:-2.2,speed:2.4}, koi:true },
{ name:'飛び石', par:4, yards:300, seed:59,
  tip:'2つの池が道を切る。1打目は池と池の間に止めよう。ドライバーでは奥の池まで転がる。',
  tee:{x:0,y:0}, pin:{x:3,y:-299},
  bounds:{x0:-40,x1:40,y0:-330,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[0,-272]],w:16}],
  green:{cx:0,cy:-296,rx:13,ry:10,rot:0},
  bunkers:[{cx:-10,cy:-312,rx:6,ry:3,rot:.2},{cx:14,cy:-311,rx:5,ry:3,rot:-.3},{cx:18,cy:-282,rx:4,ry:3,rot:.4}],
  water:[{cx:0,cy:-100,rx:36,ry:12,rot:.08},{cx:2,cy:-230,rx:36,ry:12,rot:-.06}],
  hills:[{x:-30,y:-160,s:14,a:1.6},{x:30,y:-170,s:14,a:1.8},{x:0,y:-340,s:16,a:2}],
  slope:{gx:0,gy:-.03}, bumps:[{x:-4,y:-292,s:4,a:.25}],
  treeLines:[],
  trees:[],
  wind:{dir:1.57,speed:2.6}, koi:true },
{ name:'S字', par:5, yards:485, seed:61,
  tip:'右、左と曲がるS字。木の固まりを、カーブで2回かわそう。',
  tee:{x:0,y:0}, pin:{x:18,y:-462},
  bounds:{x0:-40,x1:100,y0:-490,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[2,-150],[30,-220],[60,-260],[64,-330],[40,-400],[22,-430]],w:15}],
  green:{cx:18,cy:-460,rx:14,ry:11,rot:-.3},
  bunkers:[{cx:76,cy:-245,rx:6,ry:4,rot:.6},{cx:2,cy:-452,rx:5,ry:4,rot:.5},{cx:32,cy:-475,rx:6,ry:3.5,rot:-.3}],
  water:[{cx:86,cy:-330,rx:10,ry:16,rot:.1}],
  hills:[{x:-20,y:-200,s:24,a:3},{x:90,y:-180,s:16,a:2.2},{x:-10,y:-380,s:20,a:2.8},{x:70,y:-440,s:14,a:2}],
  slope:{gx:-.025,gy:-.02}, bumps:[{x:22,y:-456,s:4,a:.3}],
  treeLines:[[-26,-20,-28,-300,9],[30,-20,32,-120,9],[-20,-320,-24,-470,9],[90,-380,80,-470,9]],
  trees:[{x:36,y:-140,r:6,h:13},{x:48,y:-150,r:6.5,h:14},{x:42,y:-165,r:5.5,h:13},{x:56,y:-172,r:6,h:14},{x:30,y:-160,r:5,h:12},{x:50,y:-190,r:5.5,h:12},
    {x:36,y:-315,r:6,h:13},{x:28,y:-330,r:6,h:14},{x:40,y:-335,r:5,h:12},{x:22,y:-345,r:5.5,h:13},{x:32,y:-350,r:5,h:12},{x:16,y:-362,r:6,h:14},{x:26,y:-372,r:5,h:12}],
  wind:{dir:-.3,speed:2.2}, koi:true },
{ name:'風の通り道', par:4, yards:320, seed:67,
  tip:'強い横風が吹き抜ける細い道。風上へカーブをかけて、まっすぐ飛ばそう。',
  tee:{x:0,y:0}, pin:{x:0,y:-322},
  bounds:{x0:-32,x1:32,y0:-345,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[-2,-150],[2,-260],[0,-290]],w:11}],
  green:{cx:0,cy:-320,rx:12,ry:10,rot:0},
  bunkers:[{cx:-16,cy:-318,rx:4,ry:7,rot:0},{cx:16,cy:-326,rx:4,ry:6,rot:0}],
  water:[],
  hills:[{x:-28,y:-100,s:14,a:2},{x:28,y:-220,s:14,a:2}],
  slope:{gx:.03,gy:-.02}, bumps:[],
  treeLines:[[-19,-30,-21,-300,7],[19,-30,21,-300,7]],
  trees:[],
  wind:{dir:0,speed:5.2}, koi:false },
{ name:'池越えのロング', par:3, yards:172, seed:71,
  tip:'池越えの長いショートホール。横に広く奥行きのないグリーン。距離をぴったり合わせよう。',
  tee:{x:0,y:0}, pin:{x:2,y:-172},
  bounds:{x0:-50,x1:46,y0:-205,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[-2,-80]],w:12}],
  green:{cx:-4,cy:-170,rx:18,ry:8,rot:.05},
  bunkers:[{cx:-14,cy:-184,rx:9,ry:3,rot:.1},{cx:12,cy:-185,rx:8,ry:3,rot:-.1},{cx:-26,cy:-166,rx:3.5,ry:6,rot:0}],
  water:[{cx:-6,cy:-125,rx:34,ry:24,rot:.15}],
  hills:[{x:-40,y:-40,s:16,a:2},{x:36,y:-60,s:16,a:2.2},{x:0,y:-210,s:18,a:2}],
  slope:{gx:-.02,gy:-.03}, bumps:[{x:-10,y:-168,s:4,a:.3}],
  treeLines:[[-36,-20,-40,-190,9],[34,-20,36,-190,9]],
  trees:[],
  wind:{dir:-1,speed:3}, koi:true, drop:{x:-4,y:-90} },
{ name:'ワンオン狙い', par:4, yards:262, seed:73,
  tip:'短いミドルホール。まっすぐピンを狙うと手前の池。右から回して転がし上げれば、1打でグリーンに届く。',
  tee:{x:0,y:0}, pin:{x:-8,y:-264},
  bounds:{x0:-50,x1:50,y0:-295,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[8,-150],[16,-205],[12,-240]],w:16}],
  green:{cx:-6,cy:-262,rx:13,ry:10,rot:.3},
  bunkers:[{cx:12,cy:-262,rx:4,ry:6,rot:.2},{cx:-8,cy:-279,rx:9,ry:3,rot:.25},{cx:6,cy:-246,rx:3,ry:2.4,rot:0}],
  water:[{cx:-16,cy:-228,rx:21,ry:13,rot:.45},{cx:-34,cy:-250,rx:10,ry:16,rot:.2}],
  hills:[{x:40,y:-80,s:18,a:2.4},{x:-36,y:-80,s:16,a:2},{x:38,y:-255,s:14,a:1.8}],
  slope:{gx:.03,gy:-.02}, bumps:[{x:-10,y:-260,s:4,a:.25}],
  treeLines:[[-30,-20,-34,-190,9],[36,-20,40,-230,9]],
  trees:[],
  wind:{dir:-1.8,speed:2.6}, koi:true },
{ name:'傾く谷', par:4, yards:340, seed:79,
  tip:'左が高い斜面。転がると右の池へ落ちやすい。左寄りに落とそう。',
  tee:{x:0,y:0}, pin:{x:8,y:-336},
  bounds:{x0:-55,x1:62,y0:-360,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[-4,-150],[0,-260],[6,-300]],w:15}],
  green:{cx:6,cy:-334,rx:13,ry:11,rot:.2},
  bunkers:[{cx:-12,cy:-330,rx:4,ry:6,rot:.2},{cx:-20,cy:-200,rx:6,ry:4,rot:.4}],
  water:[{cx:40,cy:-170,rx:16,ry:60,rot:-.05},{cx:36,cy:-300,rx:12,ry:18,rot:.3}],
  hills:[{x:-30,y:-120,s:22,a:5},{x:-34,y:-230,s:22,a:5},{x:-30,y:-330,s:16,a:2.4}],
  slope:{gx:-.035,gy:-.02}, bumps:[{x:2,y:-332,s:4,a:.25}],
  treeLines:[[-40,-20,-44,-340,9],[58,-20,58,-100,9]],
  trees:[],
  wind:{dir:.3,speed:2.4}, koi:true },
{ name:'湖を回る', par:5, yards:480, seed:83,
  tip:'大きな湖をぐるりと回るロングホール。2打目で湖を越えれば近道だが、グリーンの手前に木がある。',
  tee:{x:0,y:0}, pin:{x:130,y:-264},
  bounds:{x0:-40,x1:152,y0:-370,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[-4,-200],[10,-300],[50,-340],[100,-330],[125,-290]],w:15}],
  green:{cx:128,cy:-262,rx:13,ry:11,rot:-.4},
  bunkers:[{cx:-16,cy:-250,rx:7,ry:4,rot:.3},{cx:30,cy:-352,rx:8,ry:3.5,rot:-.1},{cx:143,cy:-250,rx:3.5,ry:6,rot:.3},{cx:118,cy:-282,rx:6,ry:3,rot:-.3}],
  water:[{cx:66,cy:-182,rx:40,ry:70,rot:.05},{cx:110,cy:-150,rx:32,ry:92,rot:0},{cx:80,cy:-92,rx:42,ry:30,rot:.2}],
  hills:[{x:-30,y:-120,s:20,a:2.6},{x:20,y:-360,s:16,a:2},{x:140,y:-300,s:14,a:2},{x:150,y:-40,s:16,a:2}],
  slope:{gx:-.025,gy:-.02}, bumps:[{x:132,y:-266,s:4,a:.3}],
  treeLines:[[-26,-20,-30,-330,9]],
  trees:[{x:102,y:-248,r:6,h:14},{x:104,y:-272,r:5.5,h:13}],
  wind:{dir:2.6,speed:2.8}, koi:true },
{ name:'うねるグリーン', par:3, yards:152, seed:89,
  tip:'大きくうねるグリーン。ピンの近くに止めないと、パットが難しい。',
  tee:{x:0,y:0}, pin:{x:12,y:-152},
  bounds:{x0:-50,x1:50,y0:-185,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[0,-115]],w:12}],
  green:{cx:2,cy:-148,rx:20,ry:14,rot:.25},
  bunkers:[{cx:-24,cy:-138,rx:4,ry:6,rot:.3},{cx:26,cy:-142,rx:4,ry:5,rot:-.3},{cx:0,cy:-168,rx:10,ry:3,rot:.25}],
  water:[{cx:-26,cy:-80,rx:12,ry:8,rot:.5}],
  hills:[{x:-40,y:-60,s:16,a:2},{x:40,y:-90,s:16,a:2.2},{x:0,y:-190,s:18,a:2}],
  slope:{gx:.03,gy:-.03}, bumps:[{x:-2,y:-146,s:5,a:.5},{x:-10,y:-140,s:4,a:-.35},{x:12,y:-156,s:4,a:.25}],
  treeLines:[[-36,-20,-38,-170,9],[36,-20,38,-170,9]],
  trees:[],
  wind:{dir:-1.57,speed:1.8}, koi:true },
{ name:'まん中の大木', par:4, yards:305, seed:97,
  tip:'フェアウェイのまん中に大きな木。左右どちらかへカーブで抜けるか、手前に刻むか。',
  tee:{x:0,y:0}, pin:{x:-3,y:-302},
  bounds:{x0:-36,x1:36,y0:-325,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[0,-270]],w:13}],
  green:{cx:0,cy:-300,rx:12,ry:10,rot:0},
  bunkers:[{cx:-14,cy:-288,rx:4,ry:3,rot:.4},{cx:15,cy:-306,rx:4,ry:5,rot:0}],
  water:[],
  hills:[{x:-30,y:-120,s:14,a:2},{x:30,y:-250,s:14,a:2}],
  slope:{gx:-.02,gy:-.035}, bumps:[],
  treeLines:[[-24,-20,-26,-290,8],[24,-20,26,-290,8]],
  trees:[{x:0,y:-205,r:7.5,h:16}],
  wind:{dir:2,speed:2.2}, koi:false },
{ name:'半島グリーン', par:3, yards:142, seed:101,
  tip:'湖に突き出た半島のグリーン。右と奥は池。風に流されないよう左めから。',
  tee:{x:0,y:0}, pin:{x:-1,y:-142},
  bounds:{x0:-50,x1:54,y0:-190,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[-4,-90]],w:11}],
  green:{cx:-4,cy:-140,rx:11,ry:9,rot:.3},
  bunkers:[{cx:-20,cy:-136,rx:3.5,ry:6,rot:.2}],
  water:[{cx:22,cy:-140,rx:26,ry:30,rot:0},{cx:-2,cy:-108,rx:16,ry:8,rot:-.3},{cx:-4,cy:-170,rx:20,ry:8,rot:.2}],
  hills:[{x:-40,y:-70,s:16,a:2.2},{x:-38,y:-160,s:14,a:2},{x:40,y:-40,s:14,a:1.6}],
  slope:{gx:-.025,gy:-.02}, bumps:[{x:-8,y:-138,s:3.5,a:.25}],
  treeLines:[[-36,-20,-38,-180,9],[44,-20,46,-90,9]],
  trees:[],
  wind:{dir:.2,speed:3.6}, koi:true, drop:{x:-24,y:-112} },
{ name:'最終ホール', par:5, yards:495, seed:103,
  tip:'左はずっと池の最終ホール。右から吹く風と斜面に負けず、右寄りに運ぼう。',
  tee:{x:0,y:0}, pin:{x:16,y:-492},
  bounds:{x0:-60,x1:58,y0:-525,y1:16},
  teebox:{cx:0,cy:1,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[2,-200],[8,-350],[18,-440],[22,-462]],w:16}],
  green:{cx:20,cy:-490,rx:14,ry:11,rot:-.2},
  bunkers:[{cx:28,cy:-230,rx:7,ry:4,rot:-.3},{cx:36,cy:-380,rx:6,ry:4,rot:-.4},{cx:40,cy:-488,rx:4,ry:7,rot:.1},{cx:20,cy:-510,rx:9,ry:3,rot:-.2}],
  water:[{cx:-36,cy:-110,rx:15,ry:85,rot:.03},{cx:-31,cy:-250,rx:15,ry:85,rot:-.04},{cx:-22,cy:-380,rx:16,ry:75,rot:-.1},{cx:-8,cy:-470,rx:16,ry:30,rot:-.5},{cx:-4,cy:-492,rx:22,ry:14,rot:.4}],
  hills:[{x:44,y:-120,s:18,a:2.4},{x:46,y:-320,s:18,a:2.6}],
  slope:{gx:.03,gy:-.02}, bumps:[{x:12,y:-494,s:4,a:.3}],
  treeLines:[[44,-20,46,-470,9]],
  trees:[{x:46,y:-500,r:6,h:14}],
  wind:{dir:3,speed:3}, koi:true },
];
const POND={k:3,a:1};
const SAND={k:1,wob:.25};
const LINE_GRID={cell:8,pad:16,r:48};
const TOY_DEF={bear:{r:3,h:9,t0:.7,t1:2.6,tr:.35},wall:{h:3,e:.75,w:1.8},bumper:{r:2.4,h:2.6,k:1.3},spring:{r:3,vz:15},fan:{len:40,w:16,v:16},spinner:{len:7,h:2.6,w:1.4,a0:0},tunnel:{r:2}};
function dbl(v){ return Number.isInteger(v)?v+1e-7:v; }
function normE(e){ const rot=e.rot||0; return {cx:dbl(e.cx),cy:dbl(e.cy),rx:dbl(e.rx),ry:dbl(e.ry),rot:dbl(rot),_c:dbl(Math.cos(rot)),_s:dbl(Math.sin(rot)),_R:dbl(Math.max(e.rx,e.ry)),_m:dbl(Math.min(e.rx,e.ry))}; }
function packG(list){ const a=new Float64Array(list.length*5); list.forEach((g,i)=>{ a[i*5]=g.x; a[i*5+1]=g.y; a[i*5+2]=16*g.s*g.s; a[i*5+3]=1/(2*g.s*g.s); a[i*5+4]=g.a; }); return a; }
function prepHole(h){
  h.islands=(h.islands||[]).map(normE); h.bumps=h.bumps||[];
  h.green=normE(h.green); h.bunkers=h.bunkers.map(prepBunker); h.water=h.water.map(normE);
  h.waterLines=(h.waterLines||[]).map(l=>l.seg?l:prepWaterLine(l)); if(h.pond===undefined) h.pond=POND; if(h.assist===undefined) h.assist=true;
  h.bunkerLines=(h.bunkerLines||[]).map(l=>l.seg?l:prepBunkerLine(l)); h.grassIslands=(h.grassIslands||[]).map(normE);
  if(h.ice&&h.ice.open) h.ice.open=h.ice.open.map(e=>e._c!=null?e:normE(e));
  if(h.tiers) h.tiers=h.tiers.map(t=>{ const m=Math.hypot(t.nx,t.ny)||1; return {...t,nx:t.nx/m,ny:t.ny/m,w:t.w||1.2}; });
  if(h.toys) h.toys=h.toys.map(prepToy);
  h._hills=packG(h.hills); h._bumps=packG(h.bumps);
  h._sgx=dbl(h.slope.gx); h._sgy=dbl(h.slope.gy);
  for(const f of h.fairways){ let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const q of f.pts){ x0=Math.min(x0,q[0]); x1=Math.max(x1,q[0]); y0=Math.min(y0,q[1]); y1=Math.max(y1,q[1]); } const m=f.w+3; f._bb=[x0-m,x1+m,y0-m,y1+m]; }
  h.gBase=1e-7;
  for(const g of h.hills){ const dx=h.green.cx-g.x, dy=h.green.cy-g.y; h.gBase+=g.a*Math.exp(-(dx*dx+dy*dy)/(2*g.s*g.s)); }
}
HOLES.forEach(h=>{ h.pond=null; h.assist=false; prepHole(h); });
const COURSE_F=[
{ id:'f01', name:'山笑う', par:4, gold:3, yards:445, seed:6007,
  tip:'上りの一番。右の角に深いバンカー。グリーンは高く、手前に落ちると戻ってくる。',
  tee:{x:0,y:0}, pin:{x:46.2,y:-437.4},
  bounds:{x0:-77,x1:120,y0:-510,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30],[0,-299.6],[.7,-301.8]],w:34},{pts:[[.7,-301.8],[37.2,-413.2]],w:28}],
  green:{cx:44.2,cy:-434.4,rx:13,ry:11,rot:-1.254},
  bunkers:[{cx:23,cy:-280.4,rx:6.5,ry:12,rot:0,wob:.6}],
  bunkerLines:[{pts:[[32.3,-421.7,2.7],[29.5,-426.4,3.4],[28.2,-431.5,3.4],[28.5,-436.7,2.7]]}],
  water:[],
  hills:[{x:44.2,y:-434.4,s:22,a:3.5},{x:23.4,y:-359.6,s:55,a:2}],
  slope:{gx:.007,gy:-.021}, bumps:[],
  treeLines:[],
  trees:[{x:15.7,y:-431.9,r:5.5,h:24.7},{x:-3.7,y:-422.2,r:5.7,h:25},{x:-7.4,y:-414.1,r:5.3,h:21.2},{x:-1.8,y:-404.9,r:4.9,h:20.5},{x:-8.9,y:-394.3,r:5.7,h:21.3},{x:4,y:-395.2,r:6.2,h:27.3},{x:-17.2,y:-373.6,r:6.4,h:22},{x:-8.6,y:-374.7,r:5.1,h:23.8},{x:-17.9,y:-357.3,r:4.9,h:20.9},{x:-7.3,y:-356.6,r:6.5,h:21.1},{x:-36,y:-347.4,r:6.1,h:21.6},{x:-25,y:-348.2,r:5.7,h:24.6},{x:-29.8,y:-338.5,r:5.7,h:21.9},{x:-34.4,y:-326.1,r:5.1,h:22.6},{x:-25,y:-328.3,r:5.4,h:24.4},{x:-27.9,y:-319,r:6.1,h:22.9},{x:-35.1,y:-306.6,r:5.3,h:23.1},{x:-42,y:-299.7,r:5.7,h:21.5},{x:-31.1,y:-297.5,r:5,h:23.4},{x:-44,y:-287.7,r:5.7,h:24.1},{x:-33.5,y:-290.5,r:5.4,h:22.6},{x:-40.1,y:-279.3,r:6.2,h:26.7},{x:-30.3,y:-279.9,r:6.4,h:26.6},{x:-44.1,y:-268.7,r:6,h:25.5},{x:-36.7,y:-270.7,r:5.1,h:23},{x:-40.3,y:-262,r:6.4,h:25.8},{x:-27.5,y:-258.9,r:5.1,h:26.9},{x:-35.1,y:-249.6,r:6,h:22.6},{x:-29.7,y:-239.9,r:4.9,h:24.2},{x:-34.4,y:-232.6,r:6.1,h:27.4},{x:-24.7,y:-233.4,r:6.3,h:27.6},{x:-41.9,y:-224.2,r:5.6,h:26.4},{x:-30.7,y:-223.4,r:4.9,h:26.1},{x:-46.2,y:-212.8,r:6.4,h:20.5},{x:-35.8,y:-211.6,r:6.1,h:22.7},{x:-40.5,y:-204.8,r:5.7,h:23},{x:-27.5,y:-201.7,r:5.4,h:26.7},{x:-35.8,y:-194.9,r:5.6,h:20.5},{x:-45.4,y:-172.6,r:5.9,h:27.1},{x:-39.4,y:-165.7,r:5.9,h:20.7},{x:-45,y:-153.5,r:6.3,h:24.8},{x:-27.4,y:-146.9,r:5.9,h:23.6},{x:-44.4,y:-135.7,r:5.2,h:24.5},{x:-35.1,y:-135.5,r:5.1,h:25.3},{x:-41.4,y:-124.8,r:4.9,h:27.1},{x:-31.1,y:-124.8,r:5.1,h:23.1},{x:-45.5,y:-116.1,r:5.7,h:23.6},{x:-34.3,y:-116,r:5.3,h:25.7},{x:-39.6,y:-108.1,r:5.7,h:27.3},{x:-28.9,y:-109.3,r:6,h:24.3},{x:-35.8,y:-98.8,r:6.1,h:21},{x:-41.7,y:-87.2,r:6.2,h:24.3},{x:-45.1,y:-79.6,r:4.9,h:25.5},{x:-36.1,y:-78.5,r:6.4,h:25},{x:-38.8,y:-69.8,r:6.2,h:24.9},{x:-27.5,y:-70.4,r:5.6,h:23.4},{x:-44.5,y:-60.3,r:5.4,h:24.7},{x:-36.2,y:-58.2,r:6.2,h:26},{x:-41.1,y:-50.4,r:4.8,h:22.9},{x:-29.2,y:-50.5,r:5.7,h:26.2},{x:-44.9,y:-39.7,r:5.9,h:22.7},{x:-36.3,y:-42,r:6.1,h:23.8},{x:-25.7,y:-40,r:6.3,h:21.3},{x:-40.5,y:-30.4,r:4.9,h:26.4},{x:-45.9,y:-20,r:6.2,h:23.6},{x:31.7,y:-241,r:6.1,h:26.1},{x:44,y:-241.2,r:5.9,h:26.4},{x:28,y:-229.4,r:4.8,h:21},{x:40.4,y:-230.5,r:6.4,h:23},{x:31.2,y:-222.4,r:6.3,h:25.1},{x:43.6,y:-220.7,r:4.8,h:22.7},{x:37.2,y:-211,r:5.3,h:22.3},{x:46,y:-200.6,r:5,h:25.5},{x:37.7,y:-192.9,r:5.4,h:23.2},{x:33.9,y:-182.1,r:6.1,h:24.5},{x:45,y:-182.2,r:5.3,h:25.1},{x:25.8,y:-172.3,r:6.3,h:23.4},{x:34.6,y:-165.1,r:4.9,h:26.4},{x:42.8,y:-165.2,r:5.1,h:22.2},{x:27.7,y:-152,r:5.1,h:21.8},{x:39,y:-152.5,r:5.1,h:27.3},{x:33,y:-146,r:5.2,h:21.7},{x:43.3,y:-143.3,r:5.1,h:23.5},{x:38.3,y:-134.3,r:5,h:24.2},{x:34,y:-124.3,r:6.5,h:27.4},{x:44.8,y:-123.3,r:5.4,h:21.3},{x:40.2,y:-117.4,r:6.1,h:25.8},{x:33.8,y:-107.8,r:5.5,h:23.6},{x:45.1,y:-104.6,r:5.2,h:23.9},{x:27.3,y:-98.2,r:4.9,h:21.3},{x:40.5,y:-98.2,r:6,h:25.7},{x:47.9,y:-98.2,r:6,h:24},{x:33.4,y:-86.9,r:5.4,h:26},{x:40.2,y:-79.2,r:4.9,h:26.4},{x:31.7,y:-68.7,r:6.3,h:25},{x:43.2,y:-65.9,r:6.2,h:26.6},{x:26,y:-58.6,r:5.6,h:25},{x:38.5,y:-59.6,r:5.6,h:23.6},{x:34.4,y:-46.9,r:6.3,h:26.5},{x:44.4,y:-48.4,r:5.2,h:22.3},{x:38.1,y:-37.7,r:5.1,h:25},{x:48.8,y:-40,r:5,h:20.6},{x:31.6,y:-30.8,r:5.8,h:27.2},{x:40.2,y:-20.9,r:5.7,h:24},{x:63.2,y:-342.4,r:6.5,h:24.6},{x:48.8,y:-330.6,r:5,h:20.6},{x:56.8,y:-331.1,r:4.9,h:25.9},{x:69.2,y:-332,r:5.8,h:22.8},{x:42.1,y:-322.6,r:5,h:25.6},{x:53,y:-322.9,r:4.9,h:23.3},{x:63.3,y:-323.1,r:5.7,h:23.1},{x:39.9,y:-302.4,r:6.1,h:26.3},{x:51.1,y:-301,r:5.1,h:27.5},{x:46.5,y:-293,r:5.1,h:27.1},{x:41,y:-284.5,r:6.4,h:20.4},{x:54.3,y:-282.3,r:5.3,h:23.6},{x:45.2,y:-274,r:5.1,h:21.7},{x:43,y:-263.5,r:6.5,h:24.9},{x:35,y:-255.5,r:6.1,h:25.1},{x:77.9,y:-408.7,r:6.3,h:24.9},{x:66.1,y:-390,r:5.3,h:21.8},{x:63.2,y:-377.3,r:5.6,h:22.8},{x:71.5,y:-377.5,r:5.2,h:21.8},{x:57.9,y:-368.7,r:6.3,h:23.4},{x:68.1,y:-367.7,r:4.9,h:22.8},{x:49.7,y:-358.8,r:5,h:24.2},{x:63,y:-358.8,r:5.7,h:23.1},{x:71.3,y:-359,r:5,h:24},{x:55.6,y:-351.8,r:5.1,h:21.2},{x:61.5,y:-342.3,r:5.9,h:21.4},{x:22.2,y:-479.8,r:6,h:18.6},{x:32.3,y:-480,r:5.7,h:18.7},{x:16.6,y:-468.2,r:5.1,h:19.6},{x:37.7,y:-467.8,r:6.1,h:15.6},{x:33,y:-458.2,r:6.2,h:17.2},{x:55.6,y:-459.7,r:5.6,h:19.7},{x:63.7,y:-458.4,r:5.7,h:17.4},{x:76.4,y:-459,r:6.1,h:15.6},{x:81.4,y:-449.7,r:5.5,h:20.3},{x:91,y:-452,r:5.2,h:18.6}],
  tiers:[{x:41.7,y:-426.8,nx:.312,ny:-.95,h:.6}],
  wind:{dir:.1014,speed:6}, koi:false },
{ id:'f02', name:'雪解け', par:5, gold:4, yards:585, seed:6014,
  tip:'下りの左ドッグレッグ。角の松をドローで回れば 3 打目が短い。グリーンの手前の左右に深いバンカー。',
  tee:{x:0,y:0}, pin:{x:-108.2,y:-564.2},
  bounds:{x0:-176,x1:90,y0:-632,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30.6],[0,-293.4],[-2.2,-299.1]],w:36},{pts:[[-2.2,-299.1],[-92.5,-529.6]],w:32}],
  green:{cx:-105.2,cy:-562.2,rx:10,ry:16,rot:-1.944},
  bunkers:[{cx:24,cy:-291,rx:6,ry:12,rot:0,wob:.6}],
  bunkerLines:[{pts:[[-100.2,-548,3],[-105.9,-546.6,3.8],[-112.4,-546.6,3.8],[-119.4,-548.8,3]]},{pts:[[-86.8,-560.1,2.6],[-91.5,-553.8,3.2],[-97,-549.8,2.6]]}],
  water:[],
  hills:[{x:0,y:10,s:70,a:5},{x:0,y:-183.4,s:60,a:2}],
  slope:{gx:-.007,gy:-.017}, bumps:[],
  treeLines:[],
  trees:[{x:-56.7,y:-345.4,r:6,h:22.3},{x:-73.5,y:-336.7,r:6,h:25.8},{x:-62.3,y:-338.7,r:6.2,h:23.2},{x:-53.7,y:-337.8,r:5.9,h:26.1},{x:-67.5,y:-326.4,r:6.3,h:25.5},{x:-56.1,y:-327.5,r:5.4,h:29.6},{x:-48.1,y:-328.1,r:6.5,h:23.8},{x:-64.9,y:-318.8,r:6.2,h:25.1},{x:-50.4,y:-318.5,r:5.5,h:29},{x:-41.2,y:-317.6,r:5.3,h:28.3},{x:-69.6,y:-308.7,r:4.9,h:27.9},{x:-56.1,y:-309.2,r:5.8,h:24.4},{x:-46.5,y:-307.5,r:6.2,h:27.3},{x:-35.5,y:-309.3,r:5.7,h:23.6},{x:-61.6,y:-298.7,r:5.7,h:28},{x:-50.5,y:-299.1,r:5.5,h:28.7},{x:-40.4,y:-297.4,r:5.2,h:26.1},{x:-31.1,y:-296.9,r:4.9,h:25.1},{x:-58.1,y:-289.4,r:6.2,h:22.8},{x:-47.8,y:-287.3,r:6.4,h:23.2},{x:-36.8,y:-288.5,r:5.6,h:28.4},{x:-25.4,y:-288.1,r:5.1,h:25.9},{x:-51.2,y:-279.8,r:5.6,h:28.6},{x:-41.2,y:-277.9,r:6.4,h:26.4},{x:-29.3,y:-280.6,r:4.9,h:27.5},{x:-46.4,y:-270.6,r:5.7,h:27.5},{x:-36.5,y:-270.5,r:5.3,h:26.3},{x:-22.8,y:-271.1,r:6,h:26},{x:-50.4,y:-260.8,r:5,h:23.9},{x:-42.5,y:-258.6,r:5.9,h:29},{x:-29.3,y:-259.3,r:5.2,h:22.6},{x:-57.9,y:-249.7,r:5.8,h:28.7},{x:-47.3,y:-252.2,r:4.9,h:26.4},{x:-37.4,y:-252,r:4.8,h:23.6},{x:-24.6,y:-252.3,r:6.3,h:28.1},{x:-51.8,y:-240.7,r:5.3,h:24.2},{x:-40.5,y:-242.6,r:6.3,h:26.9},{x:-28.5,y:-239.5,r:6.2,h:24.7},{x:-48.4,y:-230.5,r:5.5,h:23.3},{x:-35.5,y:-233.1,r:5.4,h:26.8},{x:-51.9,y:-220.5,r:6.3,h:28.8},{x:-40.2,y:-221.2,r:5.5,h:25.8},{x:-31.8,y:-221.5,r:5.1,h:28.4},{x:-57.7,y:-213.5,r:5.3,h:29.3},{x:-45.2,y:-213.1,r:5.3,h:22.8},{x:-34.4,y:-210.6,r:6.3,h:25.1},{x:-25.8,y:-210.8,r:5.5,h:25.1},{x:-51.8,y:-201.8,r:5.6,h:24.2},{x:-41.4,y:-203.3,r:5.2,h:28.2},{x:-31.7,y:-202,r:5.3,h:25.3},{x:-57.2,y:-192.2,r:6,h:28},{x:-46.4,y:-192.9,r:6.2,h:27.8},{x:-34.5,y:-193,r:6,h:24},{x:-51,y:-184.6,r:5.5,h:28.4},{x:-41,y:-185.7,r:5.3,h:29.4},{x:-30.3,y:-183.3,r:5.6,h:22.6},{x:-46.5,y:-172.7,r:5.4,h:26.9},{x:-35.6,y:-175.2,r:5.4,h:27.5},{x:-25.7,y:-176.2,r:6.4,h:29},{x:-51.4,y:-165.4,r:5.6,h:24.1},{x:-42.8,y:-166.2,r:5,h:22.4},{x:-29.9,y:-163.7,r:6.1,h:24.9},{x:-57,y:-154.1,r:5.1,h:27.6},{x:-46,y:-155.9,r:6,h:25.6},{x:-36.7,y:-156.7,r:5.9,h:23.3},{x:-53.3,y:-144.7,r:5.7,h:26.3},{x:-39.7,y:-144.9,r:6,h:29.9},{x:-30.7,y:-147.4,r:5.1,h:23.8},{x:-46.2,y:-137.6,r:5.6,h:25.8},{x:-36,y:-136.9,r:6,h:25.4},{x:-23.1,y:-135.5,r:6.1,h:26.7},{x:-53.2,y:-126.6,r:5.8,h:26.5},{x:-39.6,y:-126,r:6.4,h:27.8},{x:-29.4,y:-127.1,r:5.8,h:26.2},{x:-58.9,y:-117.3,r:6,h:29.7},{x:-44.8,y:-115.9,r:5.6,h:26.8},{x:-36.3,y:-118.4,r:6.3,h:24.3},{x:-51.3,y:-107.5,r:5.6,h:24.1},{x:-42.8,y:-106.2,r:6,h:23.4},{x:-29.9,y:-106.9,r:6.3,h:24},{x:-46.8,y:-98.6,r:4.9,h:29.8},{x:-34.3,y:-98.1,r:5.2,h:29.3},{x:-24.4,y:-99.3,r:5.3,h:28.7},{x:-52,y:-87.8,r:5,h:26.3},{x:-41.9,y:-89.4,r:6.4,h:23.6},{x:-28.9,y:-87.1,r:4.8,h:24},{x:-45.8,y:-77,r:5.3,h:29.2},{x:-35.9,y:-78.5,r:4.8,h:29},{x:-39.9,y:-70.3,r:5.3,h:26},{x:28,y:-237,r:4.8,h:21.4},{x:37.5,y:-235.1,r:5.6,h:26.3},{x:34.1,y:-226.4,r:5.7,h:21.8},{x:42.8,y:-227.2,r:5.3,h:21.7},{x:24,y:-207.6,r:5.5,h:26.9},{x:34.1,y:-207.1,r:6.5,h:23.2},{x:28.3,y:-198.5,r:6,h:21.5},{x:37.9,y:-195.7,r:6.2,h:25.6},{x:49.5,y:-198.1,r:6,h:27.5},{x:33.1,y:-189.1,r:6.1,h:25.7},{x:40,y:-179.8,r:5.7,h:25.3},{x:34.1,y:-168.5,r:6.4,h:25.9},{x:44.2,y:-170.4,r:5,h:23.5},{x:37,y:-157.5,r:6.3,h:22.6},{x:34.1,y:-149.2,r:5.5,h:27.2},{x:26.8,y:-140.7,r:6,h:25.1},{x:40.3,y:-140.4,r:6.3,h:24.6},{x:32.8,y:-131.1,r:5.7,h:26.1},{x:36.9,y:-122,r:5.7,h:27.6},{x:44.7,y:-111.3,r:5.3,h:26.9},{x:26.6,y:-102.5,r:6.5,h:27.4},{x:37,y:-102.3,r:5.4,h:25},{x:40,y:-80.8,r:6,h:25.9},{x:32.9,y:-74.6,r:5.5,h:23.7},{x:44,y:-73.1,r:5.5,h:27.4},{x:37.2,y:-63.5,r:5,h:21.2},{x:34.4,y:-55.1,r:5.3,h:25.4},{x:28.1,y:-42.5,r:6.4,h:27.1},{x:36.9,y:-43.5,r:5.1,h:21.2},{x:34.7,y:-33,r:6.2,h:24.8},{x:29.1,y:-25.6,r:4.9,h:26.3},{x:39.2,y:-24.9,r:6.4,h:26.1},{x:5.8,y:-403,r:5,h:24.8},{x:11.5,y:-393.5,r:5.6,h:22},{x:16.5,y:-383.8,r:5,h:23},{x:24.4,y:-376.1,r:5.4,h:24.6},{x:30.4,y:-346.7,r:5.9,h:24.5},{x:34.1,y:-336,r:5.3,h:24.3},{x:28.9,y:-326.7,r:5.8,h:21.3},{x:38.3,y:-326.1,r:6.3,h:25.3},{x:43.7,y:-316.7,r:5.3,h:27},{x:41.9,y:-307.6,r:5.6,h:25.8},{x:44.4,y:-299.9,r:5.4,h:27.1},{x:56.6,y:-300.1,r:5.8,h:20.6},{x:40.3,y:-289.1,r:5.2,h:22.5},{x:52.6,y:-289.4,r:6.4,h:24.9},{x:60.9,y:-290.1,r:5.1,h:22.1},{x:50.4,y:-271.7,r:5.2,h:23},{x:45.9,y:-260.9,r:5.1,h:24.4},{x:56.9,y:-261,r:5,h:25.2},{x:40.1,y:-249.2,r:5.8,h:21.3},{x:-139.3,y:-533.4,r:5.6,h:23.7},{x:-131.8,y:-523.7,r:5.5,h:23.4},{x:-122.6,y:-521.9,r:5.6,h:20.6},{x:-136.8,y:-513.1,r:6,h:25.2},{x:-126.8,y:-511.4,r:5.1,h:20},{x:-120.7,y:-504.3,r:6.3,h:19.8},{x:-127.1,y:-492.6,r:5.7,h:22.8},{x:-118.1,y:-494.7,r:5,h:22.1},{x:-123.9,y:-484.2,r:4.8,h:23.3},{x:-111.5,y:-485.9,r:5.1,h:24.3},{x:-115.8,y:-476.4,r:6.4,h:24.8},{x:-106.9,y:-473.5,r:5.4,h:24.1},{x:-100.1,y:-465.3,r:4.9,h:19.8},{x:-105.6,y:-453.9,r:6,h:19.9},{x:-95.2,y:-454.2,r:5.6,h:22.7},{x:-111,y:-447.2,r:5.7,h:24.3},{x:-100.2,y:-445.4,r:5.3,h:21.9},{x:-89.3,y:-448.1,r:5.3,h:19},{x:-85.1,y:-436.4,r:6,h:24.5},{x:-99.9,y:-425.2,r:5.9,h:21.3},{x:-89.7,y:-426.4,r:5,h:25.1},{x:-95.9,y:-418,r:5.4,h:23.9},{x:-83.6,y:-417.2,r:6.4,h:20.4},{x:-87.5,y:-406.1,r:5.9,h:22.4},{x:-78.1,y:-407.5,r:6.2,h:20.4},{x:-85,y:-399.9,r:6.3,h:21.3},{x:-76.9,y:-387.5,r:6,h:21.4},{x:-82.3,y:-380.2,r:5.3,h:21.3},{x:-72.7,y:-380.4,r:5.1,h:24.9},{x:-77.6,y:-368.7,r:5.7,h:22.7},{x:-66.5,y:-371.4,r:5.6,h:23},{x:-60.8,y:-361.9,r:6.2,h:23.1},{x:-65.3,y:-350.6,r:5.5,h:23.7},{x:-56.1,y:-348.7,r:5.9,h:19},{x:-60.6,y:-558.1,r:6.2,h:22.3},{x:-68.8,y:-546.1,r:6.2,h:20.9},{x:-56.9,y:-545.8,r:5.7,h:22.3},{x:-46,y:-546.4,r:6.2,h:20.2},{x:-52.3,y:-537.2,r:4.8,h:24},{x:-47.2,y:-526.6,r:6.2,h:19.3},{x:-39.3,y:-518,r:6.1,h:25.2},{x:-55.4,y:-507.2,r:6.3,h:24.7},{x:-46.3,y:-509.5,r:5.3,h:22.4},{x:-36.4,y:-509.3,r:5,h:24.9},{x:-41.1,y:-499.2,r:5.7,h:20.1},{x:-35.2,y:-490.6,r:5.9,h:23.9},{x:-39.6,y:-481.6,r:5.3,h:25.2},{x:-28.9,y:-480.1,r:5.4,h:22.9},{x:-35,y:-470.8,r:5.9,h:22.9},{x:-22.3,y:-472.3,r:6.5,h:19.1},{x:-38.5,y:-460.9,r:5.7,h:23.8},{x:-28.3,y:-460.2,r:5,h:23.3},{x:-17.2,y:-460.4,r:5.4,h:24},{x:-24.6,y:-450.8,r:5.9,h:21.3},{x:-11.8,y:-451,r:5.2,h:21.6},{x:-30.2,y:-440.6,r:5,h:20.2},{x:-19.2,y:-442,r:5.6,h:23.1},{x:-22.7,y:-430.6,r:5.9,h:24.2},{x:-11.7,y:-431.4,r:5,h:20.5},{x:-16.6,y:-423.5,r:6.2,h:20.6},{x:-8.8,y:-422.4,r:5.3,h:22.3},{x:-12.9,y:-413.1,r:6.3,h:22.7},{x:-1,y:-414.3,r:5.4,h:23.1},{x:-113,y:-600.1,r:6.3,h:17.5},{x:-91.2,y:-602.6,r:5.6,h:15.3},{x:-79.5,y:-599.5,r:5.7,h:17.3},{x:-120.3,y:-590.9,r:5,h:16.5},{x:-109.3,y:-590.5,r:6.4,h:18.3},{x:-97.6,y:-592.1,r:6.4,h:20.6},{x:-87.1,y:-590.1,r:5,h:19.1},{x:-146.6,y:-581.1,r:5,h:19.8},{x:-134.9,y:-581.1,r:5.9,h:20.1},{x:-125.9,y:-582.5,r:5.4,h:16.9},{x:-102.1,y:-582.2,r:5,h:16.8},{x:-131.2,y:-572.3,r:5.3,h:17.9}],
  wind:{dir:-3.6756,speed:7}, koi:false },
{ id:'f03', name:'つくし', par:4, gold:3, yards:350, seed:6021,
  tip:'短い上り。左に 4 つのバンカー。浅いグリーンは右から左へ傾き、左奥は狭い段。',
  tee:{x:0,y:0}, pin:{x:-18,y:-348.4},
  bounds:{x0:-87,x1:78,y0:-411,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-31],[0,-247.6],[-10.3,-326.8]],w:34}],
  green:{cx:-13,cy:-347.4,rx:6.5,ry:15,rot:-1.7},
  bunkers:[{cx:-14,cy:-227.8,rx:4.6,ry:7,rot:0,wob:.5},{cx:-4,cy:-246.4,rx:4,ry:6.5,rot:0,wob:.5},{cx:-18.6,cy:-266.4,rx:4.6,ry:7.5,rot:-.13,wob:.5},{cx:-11.4,cy:-288.3,rx:4,ry:6.5,rot:-.13,wob:.5}],
  bunkerLines:[{pts:[[-13.9,-336.2,2.7],[-17.7,-336.4,3.4],[-22,-337.3,3.4],[-27.3,-339.3,2.7]]}],
  water:[],
  hills:[{x:-13,y:-347.4,s:22,a:4},{x:-6,y:-284.9,s:50,a:1.5}],
  slope:{gx:.02,gy:-.015}, bumps:[],
  treeLines:[],
  trees:[{x:-51.9,y:-336.1,r:5.9,h:27.2},{x:-58.2,y:-327.9,r:4.8,h:23.3},{x:-47.4,y:-325.9,r:5,h:27.5},{x:-50.5,y:-317.7,r:5.5,h:23.9},{x:-42.1,y:-317.3,r:5.4,h:24.2},{x:-46,y:-309.4,r:4.8,h:23.6},{x:-39,y:-298,r:6.4,h:21},{x:-46.4,y:-287,r:5.7,h:23.4},{x:-36.4,y:-288.1,r:6.3,h:22.6},{x:-50.3,y:-280.8,r:5.4,h:24.4},{x:-41,y:-281,r:6.4,h:21.9},{x:-40.3,y:-258.3,r:6.1,h:23.9},{x:-31.1,y:-259.4,r:5.4,h:26},{x:-44.7,y:-250.6,r:6.4,h:26.2},{x:-35.6,y:-249.5,r:5.1,h:25.6},{x:-29.7,y:-240.4,r:5.7,h:26},{x:-34.5,y:-232,r:5.3,h:22.6},{x:-31.1,y:-222.2,r:5,h:23.8},{x:-44.7,y:-211.2,r:5.8,h:21.2},{x:-33.9,y:-212.2,r:6.4,h:27},{x:-40.2,y:-203.4,r:6.3,h:26.3},{x:-29.4,y:-202.6,r:5,h:25.8},{x:-34.3,y:-192.4,r:6.5,h:21.7},{x:-40.3,y:-182.2,r:5.3,h:23},{x:-28.1,y:-185.1,r:5.2,h:23.2},{x:-34.3,y:-175.2,r:6.2,h:23.6},{x:-25.9,y:-174.1,r:5.6,h:27.2},{x:-40.2,y:-164.2,r:6.3,h:22},{x:-27.9,y:-163.6,r:5.3,h:23.7},{x:-44.1,y:-156.2,r:6.3,h:26},{x:-36.8,y:-154.1,r:5.2,h:25.2},{x:-42.1,y:-143.8,r:6.2,h:26.2},{x:-28.9,y:-146.5,r:5.9,h:24.7},{x:-46.2,y:-134.8,r:5.3,h:26.6},{x:-36.6,y:-136.1,r:5.8,h:21.8},{x:-34,y:-117.3,r:6.4,h:26.8},{x:-42.2,y:-105.4,r:5.1,h:22.1},{x:-30.4,y:-107.6,r:5.8,h:26.9},{x:-45,y:-97.7,r:5.4,h:24.3},{x:-36.6,y:-98.3,r:4.9,h:26.9},{x:-29.6,y:-88.2,r:6.2,h:27},{x:-45.3,y:-76.6,r:6.2,h:22},{x:-35.8,y:-79.8,r:5.2,h:27.4},{x:-40.9,y:-68.9,r:5.5,h:23.7},{x:-30,y:-68.8,r:6.3,h:26.5},{x:-35,y:-57.9,r:4.9,h:24.6},{x:-23.1,y:-58.7,r:5.7,h:24.7},{x:-29.5,y:-48.1,r:5.8,h:23.4},{x:-36.8,y:-39,r:6.2,h:20.9},{x:-41.2,y:-31,r:4.9,h:26.9},{x:-30.7,y:-30.9,r:5.6,h:25.9},{x:-45.1,y:-19.7,r:5.2,h:22.1},{x:22.1,y:-343.9,r:5.2,h:22.9},{x:16.5,y:-334.3,r:5.6,h:23.6},{x:25.9,y:-337.6,r:5.2,h:22.1},{x:33.6,y:-327,r:5.9,h:21.5},{x:25.8,y:-316.5,r:6.1,h:26.9},{x:21.5,y:-305.9,r:5.2,h:26.2},{x:25.2,y:-297.5,r:5.3,h:23.5},{x:38.9,y:-297.8,r:6.1,h:22.9},{x:30.5,y:-286.6,r:6.2,h:20.9},{x:27.5,y:-278.1,r:6,h:22.4},{x:32.7,y:-268.2,r:6,h:21.4},{x:28,y:-260.1,r:5.5,h:24.9},{x:36.4,y:-259.9,r:5.6,h:23.4},{x:32.9,y:-251.7,r:5.3,h:24.9},{x:43,y:-250.2,r:4.9,h:25.9},{x:26.8,y:-241.9,r:5.2,h:22.4},{x:39.1,y:-240.8,r:5.6,h:25.6},{x:47.5,y:-238.7,r:6.5,h:27},{x:33.3,y:-232,r:5.1,h:22.8},{x:42.9,y:-229.4,r:4.8,h:23.4},{x:37.8,y:-223.2,r:5,h:22.3},{x:30.8,y:-212.9,r:6.3,h:24.8},{x:41.5,y:-210.9,r:4.8,h:22.3},{x:35.5,y:-202.4,r:5.9,h:20.9},{x:30,y:-191.2,r:5.9,h:21.9},{x:44.7,y:-193.2,r:6.3,h:24.3},{x:24.6,y:-181.4,r:6.1,h:21.2},{x:35.5,y:-184.4,r:6.1,h:25.4},{x:32.1,y:-172.1,r:5.4,h:21},{x:42.6,y:-175.4,r:6.2,h:26.9},{x:28.1,y:-165.3,r:5.2,h:20.5},{x:38.4,y:-145.2,r:5.4,h:26.4},{x:31,y:-137.1,r:5.1,h:24.2},{x:44.7,y:-136.1,r:5.1,h:21.3},{x:38.6,y:-123.9,r:5.9,h:22},{x:30.4,y:-117.6,r:6.1,h:25.2},{x:42.9,y:-116.1,r:5.1,h:26.1},{x:26.3,y:-108.1,r:6.1,h:27.4},{x:32.4,y:-96.1,r:6,h:20.5},{x:44,y:-96.1,r:5.9,h:21.2},{x:32.9,y:-77.5,r:5.3,h:24.5},{x:42.2,y:-76.3,r:5.3,h:21.5},{x:25.9,y:-69.4,r:5.5,h:22.5},{x:37.9,y:-67.9,r:5,h:22.9},{x:44.5,y:-58,r:5.6,h:26.3},{x:35.7,y:-50.9,r:6.3,h:20.4},{x:32.5,y:-38.8,r:5.3,h:20.5},{x:38.5,y:-28.6,r:5,h:20.5},{x:31.9,y:-21.3,r:5.3,h:26.9},{x:-26,y:-380.1,r:5.9,h:20.1},{x:17.9,y:-381.8,r:5,h:17.2},{x:-53.8,y:-370.3,r:5.6,h:16.2},{x:-42.9,y:-372.4,r:4.9,h:20.5},{x:-28.9,y:-372,r:4.9,h:19},{x:-19.6,y:-372,r:4.9,h:17.1},{x:-8.5,y:-372.9,r:6.1,h:16.6},{x:2.7,y:-371.3,r:5.7,h:17.5},{x:14.7,y:-370.4,r:4.9,h:19.4},{x:-47.4,y:-361.9,r:5.5,h:18.6},{x:-26.5,y:-361.2,r:4.9,h:20.1},{x:-12.4,y:-362.2,r:6,h:19},{x:-4.1,y:-362.9,r:5,h:15.7}],
  tiers:[{x:-12.5,y:-343.4,nx:-.129,ny:-.992,h:.5},{x:-19.1,y:-347.6,nx:-.907,ny:-.386,h:.6}],
  wind:{dir:-3.179,speed:8}, koi:false },
{ id:'f04', name:'春風', par:3, gold:2, yards:240, seed:6028,
  tip:'長い打ち下ろし。右手前に大きなバンカー。向かい風が右へ押す。',
  tee:{x:0,y:0}, pin:{x:-5,y:-240},
  bounds:{x0:-79,x1:81,y0:-301,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-179],[0,-220]],w:28}],
  green:{cx:0,cy:-236,rx:13,ry:16,rot:-1.571},
  bunkers:[],
  bunkerLines:[{pts:[[19.8,-229.6,3.2],[15.6,-223.8,4],[10,-220,4],[3.8,-218.1,3.2]]},{pts:[[-18.4,-228.6,2.4],[-20.3,-237.8,3],[-16.4,-246.3,2.4]]}],
  water:[],
  hills:[{x:0,y:10,s:45,a:4}],
  slope:{gx:0,gy:-.022}, bumps:[],
  treeLines:[],
  trees:[{x:-32.9,y:-224.1,r:5.6,h:25.6},{x:-35.6,y:-213,r:5.4,h:27},{x:-26.5,y:-214.5,r:5.8,h:25.8},{x:-41.3,y:-206.1,r:5.7,h:23},{x:-32.7,y:-203.3,r:5.3,h:23.1},{x:-37,y:-195.6,r:5.1,h:20.5},{x:-42,y:-184.1,r:5.6,h:27.1},{x:-36,y:-176.1,r:5.1,h:26.5},{x:-41,y:-167.1,r:5.4,h:23.4},{x:-47,y:-157.3,r:5.1,h:21.6},{x:-36.2,y:-155.7,r:5.8,h:22.7},{x:-43.7,y:-148.8,r:5.6,h:25.2},{x:-32.1,y:-149.1,r:5.1,h:24.3},{x:-48.5,y:-139.7,r:5.5,h:26.3},{x:-37.8,y:-137.2,r:5.5,h:25.3},{x:-44,y:-129.4,r:5.5,h:24.9},{x:-49.3,y:-118.6,r:5.9,h:23.9},{x:-35.6,y:-119,r:6.1,h:26.9},{x:-42.1,y:-108.6,r:4.8,h:26.6},{x:-47.4,y:-98.7,r:5.9,h:26.2},{x:-38.4,y:-98.3,r:6.2,h:26.2},{x:-41.5,y:-89.1,r:5.3,h:25.9},{x:-38.4,y:-79.3,r:6.4,h:26.4},{x:-31.9,y:-71.5,r:5.4,h:20.5},{x:-38.9,y:-61.5,r:5.6,h:25.7},{x:-36.3,y:-43.5,r:5.1,h:22.3},{x:-42.3,y:-33.9,r:4.8,h:22.3},{x:36.2,y:-232.8,r:5.4,h:21.9},{x:47.7,y:-229.7,r:5.6,h:25.1},{x:39.8,y:-221.3,r:5.8,h:21.2},{x:50.9,y:-222.9,r:5.6,h:22.5},{x:45.5,y:-211.7,r:4.9,h:21.6},{x:40.1,y:-201.6,r:5.1,h:23.2},{x:35.6,y:-193.9,r:6.2,h:22.7},{x:45.9,y:-191.1,r:5.3,h:22.8},{x:29.8,y:-181.7,r:4.9,h:24},{x:42.7,y:-183.7,r:4.8,h:26.8},{x:34.5,y:-175.4,r:5.1,h:27.5},{x:46.7,y:-174.9,r:6.3,h:25.9},{x:39.1,y:-165,r:6.3,h:22.2},{x:35.6,y:-152.8,r:5.8,h:25.4},{x:28.1,y:-146.1,r:5.8,h:21.1},{x:41.9,y:-143.7,r:5.5,h:22.4},{x:35.5,y:-135.3,r:6,h:20.9},{x:40.1,y:-124.3,r:4.9,h:21.3},{x:34.5,y:-116,r:6.1,h:24.4},{x:31.2,y:-107,r:5.2,h:23.1},{x:41.7,y:-107.3,r:6.4,h:25.7},{x:34.8,y:-95.9,r:5.9,h:22.4},{x:47.9,y:-96,r:5.6,h:22},{x:33.6,y:-77.7,r:6.1,h:23.5},{x:45.3,y:-77.4,r:5.1,h:22.2},{x:28.8,y:-69,r:6.3,h:26.8},{x:41.1,y:-69.3,r:6,h:27.2},{x:35.6,y:-59.5,r:5.6,h:25.6},{x:29.5,y:-48.2,r:5.1,h:21.5},{x:42.7,y:-48.3,r:5.9,h:24.3},{x:35.9,y:-39.4,r:5.4,h:23.6},{x:39.6,y:-31.8,r:6.3,h:21.7},{x:-30.2,y:-269.1,r:6.4,h:22.2},{x:-20.2,y:-270.9,r:5,h:17.3},{x:2.3,y:-271.2,r:5.6,h:19.7},{x:10.7,y:-271.1,r:5.2,h:18.6},{x:24.3,y:-271.5,r:5.7,h:22.7},{x:33.2,y:-270.6,r:6.2,h:20},{x:-24.9,y:-259.2,r:6,h:21.9},{x:-13.9,y:-262.1,r:5.7,h:17.9},{x:-2.3,y:-262,r:6.2,h:21.4},{x:6.9,y:-260.5,r:5.7,h:18.8},{x:30.7,y:-260.7,r:5.6,h:17.5},{x:38.7,y:-261.4,r:6.4,h:20.8}],
  tiers:[{x:0,y:-236,nx:0,ny:-1,h:.5}],
  wind:{dir:.8727,speed:8}, koi:false },
{ id:'f05', name:'陽炎', par:4, gold:3, yards:495, seed:6035,
  tip:'上りの左ドッグレッグ。角の左に深いバンカー 2 つ。グリーンは中ほどの尾根から手前へ落ちる。',
  tee:{x:0,y:0}, pin:{x:-54,y:-487.1},
  bounds:{x0:-124,x1:78,y0:-552,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-31.2],[0,-306.2],[-1.8,-312.2]],w:34},{pts:[[-1.8,-312.2],[-46.5,-464.4]],w:30}],
  green:{cx:-52,cy:-483.1,rx:14,ry:11,rot:-1.857},
  bunkers:[{cx:-22,cy:-287.5,rx:5.5,ry:9.5,rot:0,wob:.6},{cx:-27.6,cy:-315.1,rx:5,ry:8.5,rot:-.286,wob:.6}],
  bunkerLines:[{pts:[[-66.9,-491.2,2.6],[-63.6,-497,3.2],[-57.8,-500.9,3.2],[-50.8,-501.3,2.6]]}],
  water:[],
  hills:[{x:0,y:-187.5,s:60,a:2},{x:-36.3,y:-412.8,s:55,a:3},{x:-52,y:-483.1,s:22,a:2}],
  slope:{gx:-.008,gy:-.029}, bumps:[],
  treeLines:[],
  trees:[{x:-30.9,y:-182.3,r:6.4,h:21.7},{x:-40.1,y:-171,r:6.4,h:24.3},{x:-44.1,y:-163.4,r:5.3,h:20.7},{x:-34.7,y:-162,r:5,h:22.4},{x:-48,y:-152.2,r:6,h:24.9},{x:-36.7,y:-155.2,r:6.1,h:22.9},{x:-44.3,y:-144.2,r:6,h:25.6},{x:-32.7,y:-142.3,r:6.3,h:23.6},{x:-50.1,y:-136.1,r:6.3,h:26.7},{x:-43.5,y:-125.7,r:4.9,h:22.9},{x:-32.3,y:-125.1,r:5.6,h:20.9},{x:-50.7,y:-117,r:5.7,h:22.9},{x:-39.8,y:-117,r:5.7,h:20.8},{x:-42,y:-107.3,r:5.5,h:24.5},{x:-32.6,y:-104.9,r:6.4,h:22.1},{x:-48.3,y:-94.7,r:6.4,h:21.5},{x:-39.5,y:-96,r:5.2,h:26.9},{x:-43.5,y:-85.1,r:5.4,h:24.9},{x:-38.4,y:-75.2,r:5.1,h:24.6},{x:-43.5,y:-68.9,r:6.4,h:26.8},{x:-48.6,y:-59.5,r:5.6,h:25.9},{x:-37.7,y:-58.2,r:5.7,h:26.4},{x:-42.3,y:-49.6,r:6.1,h:20.7},{x:-31.5,y:-48.4,r:5.9,h:23.3},{x:-38.3,y:-38.6,r:5.7,h:25.9},{x:-42.4,y:-27.9,r:5.1,h:26.7},{x:-32.4,y:-29.6,r:5.1,h:26.1},{x:-40.1,y:-20.3,r:5.1,h:23},{x:-65.6,y:-395,r:5.8,h:28.5},{x:-83.1,y:-388.5,r:5.3,h:27.7},{x:-69.8,y:-387.2,r:6.3,h:23.4},{x:-58.2,y:-388.6,r:5.5,h:28.8},{x:-74.6,y:-376.4,r:5.9,h:27.3},{x:-64.3,y:-377.3,r:6.1,h:23.2},{x:-52.6,y:-375.7,r:5.2,h:29},{x:-80.5,y:-366.8,r:6.1,h:26.8},{x:-70.2,y:-369.6,r:5,h:23.8},{x:-60.7,y:-369.8,r:4.8,h:28.2},{x:-48.2,y:-366.6,r:6.2,h:24.2},{x:-75.7,y:-359.1,r:5,h:27.5},{x:-64.7,y:-357.5,r:5.9,h:29.6},{x:-53,y:-358.6,r:5.6,h:26.7},{x:-69.9,y:-350.5,r:5.2,h:24.8},{x:-59.5,y:-349,r:5.2,h:28.9},{x:-50.7,y:-349.6,r:5.3,h:24.3},{x:-75.1,y:-339.6,r:5.3,h:29.1},{x:-67.1,y:-340.3,r:6.3,h:23.2},{x:-55.1,y:-337.4,r:4.9,h:27.4},{x:-43.5,y:-339.8,r:6,h:27.4},{x:-71.2,y:-329.8,r:5.2,h:27.7},{x:-58.6,y:-330.1,r:5.1,h:25},{x:-50,y:-330.9,r:5.3,h:25.2},{x:-64.4,y:-319.7,r:5.1,h:28.7},{x:-54.4,y:-321.5,r:4.8,h:22.6},{x:-42,y:-320.3,r:5.5,h:23.9},{x:-60.1,y:-311.7,r:6.3,h:29.6},{x:-49.6,y:-310.9,r:6.2,h:26.1},{x:-36.8,y:-309.3,r:5.9,h:27.8},{x:-67,y:-302.3,r:6,h:25.2},{x:-53.4,y:-302,r:6,h:22.7},{x:-43.7,y:-299.2,r:4.8,h:28.7},{x:-33.1,y:-299.5,r:5.7,h:25.4},{x:-59.1,y:-289.6,r:6.3,h:27.8},{x:-48.1,y:-291.3,r:6.1,h:29.7},{x:-38.4,y:-292.1,r:4.9,h:27.6},{x:-65.5,y:-280.3,r:5.5,h:27.2},{x:-54.6,y:-281.8,r:5.7,h:23.6},{x:-43.4,y:-280.8,r:5.5,h:27.1},{x:-30.6,y:-282.9,r:6.3,h:24.7},{x:-58.7,y:-273.3,r:5.7,h:27.1},{x:-48.5,y:-271.7,r:5,h:26.2},{x:-38.4,y:-271.4,r:5.7,h:28.1},{x:-27.8,y:-273.9,r:6.4,h:25.8},{x:-55,y:-262.9,r:5.4,h:22.6},{x:-42.8,y:-264,r:5.7,h:23.6},{x:-32.3,y:-262.4,r:5.1,h:23.7},{x:-59.4,y:-251.5,r:5.5,h:27.5},{x:-47.5,y:-254.4,r:5,h:24.7},{x:-36,y:-252.2,r:5.4,h:22.8},{x:-55.4,y:-243.2,r:5.6,h:23.6},{x:-43.4,y:-242.2,r:6.2,h:28.3},{x:-31.7,y:-242.9,r:5.4,h:25.3},{x:-58.6,y:-235.4,r:5.1,h:24.1},{x:-49.9,y:-232.6,r:5.3,h:24},{x:-38.9,y:-235.8,r:6.4,h:28.5},{x:-55.9,y:-225.5,r:5.2,h:26.1},{x:-42.4,y:-223,r:5.1,h:24.9},{x:-33,y:-224.5,r:6,h:22.2},{x:-59.2,y:-214.7,r:5.3,h:27.3},{x:-48.1,y:-214.8,r:5.2,h:28.2},{x:-37.2,y:-214,r:5.4,h:27.1},{x:-55.3,y:-204.4,r:6.4,h:24.9},{x:-42.5,y:-205.4,r:6.5,h:23.7},{x:-30.9,y:-205.7,r:5.8,h:25},{x:-47,y:-196.6,r:5.6,h:23.5},{x:-39.1,y:-196.5,r:5.1,h:29.4},{x:-22.5,y:-480.9,r:5.8,h:26.6},{x:-13.3,y:-482.5,r:6,h:27},{x:-7.6,y:-472.7,r:5.5,h:22},{x:-13.7,y:-462,r:5.1,h:26.5},{x:-2.2,y:-461.7,r:5.5,h:27.2},{x:-2.1,y:-443.1,r:6.4,h:21.5},{x:-9.1,y:-436,r:5.2,h:23.6},{x:1.7,y:-435.1,r:6.1,h:26.6},{x:13,y:-433.1,r:5.5,h:25.7},{x:-1.3,y:-423.1,r:6.4,h:21.2},{x:10.4,y:-426,r:4.9,h:26.7},{x:2.8,y:-413.4,r:5.3,h:26.4},{x:9.8,y:-406.5,r:5.8,h:27.6},{x:15.9,y:-376.6,r:6.4,h:23.1},{x:9.7,y:-365.5,r:6.3,h:25.7},{x:20.8,y:-368.2,r:5.9,h:24},{x:15.3,y:-357.7,r:6.4,h:26.7},{x:23.4,y:-358.2,r:6.4,h:24.9},{x:18.8,y:-350.1,r:5.5,h:22},{x:30.9,y:-346.8,r:5.6,h:21.5},{x:26.5,y:-337.1,r:4.9,h:24.6},{x:31.5,y:-330.5,r:5.6,h:26.8},{x:37.5,y:-321.2,r:5.9,h:26.8},{x:21,y:-308.6,r:5.3,h:21.2},{x:28.9,y:-309.7,r:5.9,h:27.5},{x:42.9,y:-309,r:4.9,h:25.6},{x:35.2,y:-302,r:5.7,h:26.2},{x:45.7,y:-300.1,r:6.3,h:26.2},{x:43.3,y:-289.6,r:6.4,h:20.5},{x:37.9,y:-282.2,r:6.3,h:26},{x:40.9,y:-273.3,r:6.2,h:21.3},{x:25.7,y:-262,r:5.4,h:21.5},{x:36.2,y:-262,r:6.2,h:24},{x:29.1,y:-253.4,r:5.5,h:25.6},{x:23.5,y:-241.8,r:5.2,h:22.8},{x:35.2,y:-244.2,r:5.7,h:22.5},{x:31,y:-234.9,r:5.6,h:26.9},{x:35,y:-223.9,r:5.8,h:21.4},{x:40.2,y:-213.8,r:6.4,h:23.3},{x:26,y:-204.1,r:5.8,h:22.7},{x:36.4,y:-203.1,r:4.9,h:21.4},{x:30.1,y:-196.8,r:5.9,h:25},{x:42.8,y:-196.5,r:5.3,h:22.1},{x:36.8,y:-183.7,r:6.4,h:23.6},{x:46.1,y:-185.8,r:5.4,h:23.8},{x:30,y:-158.4,r:5,h:25},{x:36.2,y:-146.3,r:6.5,h:22.7},{x:45.5,y:-147.5,r:5.5,h:22.6},{x:30.7,y:-136.4,r:5.7,h:23.2},{x:35.3,y:-129.1,r:6.2,h:23.1},{x:40.1,y:-118.1,r:5.4,h:25.8},{x:37.1,y:-110.9,r:5.5,h:21.9},{x:45.7,y:-108.1,r:5.1,h:22.1},{x:31.3,y:-100.1,r:5.2,h:21},{x:35.3,y:-91,r:5.6,h:25.8},{x:31.2,y:-79.6,r:5.5,h:21.6},{x:34.8,y:-71.6,r:5.8,h:22.6},{x:48.5,y:-72.1,r:5.9,h:21.9},{x:42.1,y:-62.3,r:5.8,h:26.2},{x:36.9,y:-51.4,r:5.6,h:20.5},{x:30.4,y:-42.2,r:5.2,h:23.4},{x:37.2,y:-31.7,r:5.2,h:27.2},{x:40.9,y:-23.4,r:5.8,h:24.1},{x:-54.1,y:-521.1,r:5.4,h:19.9},{x:-46,y:-520.8,r:5.2,h:19.5},{x:-33.7,y:-521.6,r:5.5,h:20},{x:-24.1,y:-521.3,r:6.4,h:20},{x:-82.9,y:-511,r:5.4,h:19.9},{x:-72.2,y:-512.8,r:5.4,h:16.6},{x:-59.1,y:-512.6,r:5.9,h:17.5},{x:-51.4,y:-509.6,r:6,h:17.1},{x:-38.6,y:-512.1,r:5.4,h:17},{x:-26.4,y:-512.7,r:6.3,h:17.6},{x:-89.6,y:-502.3,r:5.5,h:16.2},{x:-66,y:-502.5,r:5.8,h:19.7},{x:-94.2,y:-491.9,r:5.6,h:19.5}],
  tiers:[{x:-52,y:-483.1,nx:-.282,ny:-.959,h:.8}],
  wind:{dir:-3.0743,speed:8}, koi:false },
{ id:'f06', name:'つばめ', par:3, gold:2, yards:180, seed:6042,
  tip:'高いティーから谷越え。左手前に大きなバンカー。右奥は一段高い台。',
  tee:{x:0,y:0}, pin:{x:6,y:-179.9},
  bounds:{x0:-69,x1:77,y0:-241,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-127.9],[0,-161.9]],w:26}],
  green:{cx:0,cy:-175.9,rx:12,ry:16,rot:-1.571},
  bunkers:[],
  bunkerLines:[{pts:[[-.6,-158.7,3.2],[-7.4,-159.8,4],[-13.9,-163.1,4],[-19.3,-168.9,3.2]]}],
  water:[],
  hills:[{x:0,y:6,s:35,a:6},{x:0,y:-100.8,s:30,a:-1.5}],
  slope:{gx:0,gy:-.015}, bumps:[],
  treeLines:[],
  trees:[{x:-38.6,y:-142.3,r:6,h:20.1},{x:-38.6,y:-123.8,r:5,h:19.9},{x:-27.3,y:-123.8,r:5.1,h:24.9},{x:-34.7,y:-112.6,r:6.1,h:20.2},{x:-38.6,y:-105.2,r:5.4,h:21.7},{x:-26.7,y:-104.6,r:6.3,h:21.1},{x:-34.2,y:-94.7,r:6.2,h:20.9},{x:-36.5,y:-84,r:5.7,h:24.3},{x:-34.1,y:-77.2,r:5.2,h:25.1},{x:-36.4,y:-64.5,r:6,h:24.4},{x:-28.2,y:-64.8,r:5.3,h:25.3},{x:-32.1,y:-55.1,r:5.6,h:20.7},{x:-38,y:-45.9,r:5.5,h:20.9},{x:-28.7,y:-48.1,r:5.2,h:22.7},{x:-31,y:-35.9,r:6.3,h:20.6},{x:45.5,y:-143.3,r:6.5,h:24.5},{x:30,y:-136.3,r:5.6,h:21.4},{x:38.6,y:-136.4,r:5.9,h:21.1},{x:32.3,y:-124.2,r:4.9,h:21},{x:29.8,y:-115,r:5.8,h:23.9},{x:38.1,y:-116.4,r:6.4,h:23.6},{x:33.1,y:-106.3,r:4.9,h:22.1},{x:38.7,y:-95.6,r:5.3,h:24.9},{x:31.8,y:-86.8,r:6.3,h:19.5},{x:40.7,y:-78.3,r:5.7,h:24.9},{x:35.2,y:-69.2,r:6.3,h:23.7},{x:46.3,y:-67.9,r:6.2,h:20.2},{x:34.1,y:-50.4,r:5.8,h:23.9},{x:40.9,y:-40.2,r:5.6,h:23.2},{x:32.4,y:-31.4,r:5.7,h:19.6},{x:39.7,y:-22.1,r:5.5,h:19.6},{x:-33.2,y:-210.6,r:4.9,h:18.1},{x:-20.4,y:-208.9,r:6,h:17.8},{x:-9,y:-210.7,r:5,h:18.3},{x:2.3,y:-210.2,r:6.2,h:19.3},{x:10.7,y:-209,r:6.1,h:19.3},{x:23.2,y:-211.6,r:5.4,h:15.8},{x:7.4,y:-201.7,r:5.7,h:20.4},{x:18.4,y:-201.3,r:5.7,h:15.6},{x:29.2,y:-202.6,r:6.4,h:15.8}],
  tiers:[{x:4,y:-178.9,nx:.7,ny:-.7,h:.8}],
  wind:{dir:-3.8397,speed:8}, koi:false },
{ id:'f07', name:'松の芯', par:4, gold:3, yards:450, seed:6049,
  tip:'松に挟まれた狭い道。高くて浅いグリーンを 5 つのバンカーが囲む。',
  tee:{x:0,y:0}, pin:{x:4,y:-450},
  bounds:{x0:-75,x1:80,y0:-512,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-32.7],[0,-432]],w:26}],
  green:{cx:0,cy:-450,rx:7,ry:15,rot:-1.571},
  bunkers:[],
  bunkerLines:[{pts:[[-4.8,-439.3,2.4],[-7.7,-440.1,3],[-11,-441.4,2.4]]},{pts:[[2.7,-439,2.4],[0,-438.8,3],[-2.7,-439,2.4]]},{pts:[[11,-441.4,2.4],[7.7,-440.1,3],[4.8,-439.3,2.4]]},{pts:[[-10.5,-458.8,2.4],[-6.4,-460.3,3],[-2.7,-461,2.4]]},{pts:[[2.7,-461,2.4],[6.4,-460.3,3],[10.5,-458.8,2.4]]}],
  water:[],
  hills:[{x:0,y:-450,s:20,a:3.5}],
  slope:{gx:0,gy:-.015}, bumps:[],
  treeLines:[],
  trees:[{x:-34.6,y:-410.1,r:5.5,h:23.1},{x:-24.6,y:-410,r:5,h:21.5},{x:-40.4,y:-400.4,r:5.1,h:25.4},{x:-27.8,y:-399.8,r:5.1,h:22.4},{x:-32.7,y:-388.5,r:5.5,h:21.5},{x:-21.9,y:-390.4,r:5.9,h:27.9},{x:-26.9,y:-380.9,r:6.2,h:23},{x:-35.6,y:-369.2,r:5.6,h:25.5},{x:-40.5,y:-362.6,r:5.5,h:21.4},{x:-27.3,y:-359.4,r:5.2,h:28.5},{x:-32.1,y:-351.1,r:5.1,h:27},{x:-23.9,y:-350.7,r:5.5,h:27.6},{x:-29.1,y:-343.1,r:5.2,h:24.1},{x:-22.7,y:-331.7,r:6.2,h:24.1},{x:-38,y:-322.3,r:5.4,h:22.4},{x:-28.2,y:-324.2,r:6.4,h:24.7},{x:-32.9,y:-314.9,r:5.8,h:22.4},{x:-23.3,y:-312.4,r:6.3,h:24.8},{x:-38.5,y:-302.3,r:5.5,h:26.4},{x:-26.5,y:-304.3,r:5.6,h:26.9},{x:-32.4,y:-294.8,r:6.4,h:22.6},{x:-24.5,y:-293.6,r:5.2,h:22.6},{x:-28.3,y:-285,r:6.2,h:23.1},{x:-18,y:-285,r:5.6,h:24.6},{x:-34.9,y:-276,r:5.4,h:28.4},{x:-27.5,y:-267.1,r:6.2,h:24.4},{x:-32.9,y:-255,r:5,h:22.8},{x:-23.2,y:-257.6,r:5.7,h:27.8},{x:-39.6,y:-247.7,r:5.8,h:24.1},{x:-28.6,y:-246.1,r:5.5,h:25.9},{x:-18.7,y:-244.7,r:5.5,h:22.6},{x:-33,y:-238.2,r:6.1,h:26.2},{x:-21.9,y:-235,r:5,h:25.3},{x:-27.3,y:-225.2,r:5,h:25.3},{x:-18,y:-225.5,r:6.3,h:24.6},{x:-35.3,y:-216.5,r:5.2,h:26.2},{x:-22.9,y:-216.2,r:6.1,h:22.3},{x:-37.9,y:-206.2,r:5.8,h:26.8},{x:-23,y:-199.7,r:5,h:24.2},{x:-39.4,y:-188.1,r:6.1,h:21.6},{x:-29.9,y:-190.4,r:5.2,h:26.9},{x:-32.4,y:-178.3,r:5.3,h:23.1},{x:-24.6,y:-180.6,r:5.3,h:26.8},{x:-37.8,y:-170.4,r:5.2,h:21.4},{x:-27.9,y:-170.7,r:5.6,h:22.4},{x:-32.3,y:-158.7,r:5.3,h:27},{x:-21.2,y:-161.7,r:6.1,h:25.2},{x:-26.6,y:-149.2,r:6.5,h:25.6},{x:-34.3,y:-138.9,r:5.2,h:22},{x:-28.2,y:-129.4,r:5,h:21.9},{x:-18.7,y:-130.5,r:5.8,h:26.6},{x:-21.4,y:-123.2,r:5.7,h:22.2},{x:-37.7,y:-111.1,r:5.9,h:28.3},{x:-27.7,y:-113.8,r:6.4,h:24.6},{x:-34.5,y:-103,r:5,h:26.8},{x:-28.3,y:-92.6,r:5.9,h:26.1},{x:-17.5,y:-91.5,r:5.1,h:25.1},{x:-33,y:-62.9,r:4.9,h:22.3},{x:-22.4,y:-62.6,r:6.4,h:26.4},{x:-28.2,y:-53,r:6.3,h:22.1},{x:-33.6,y:-46.7,r:5.5,h:25.2},{x:-29.6,y:-36.1,r:6.4,h:24.5},{x:-31.9,y:-27.4,r:6.5,h:23.7},{x:-37.5,y:-15.3,r:6.1,h:26.8},{x:25.6,y:-407.6,r:5.4,h:27.7},{x:37.1,y:-409.2,r:6.3,h:22.1},{x:31,y:-399,r:5.2,h:26.1},{x:41.7,y:-397.7,r:4.8,h:27.4},{x:27.7,y:-388.8,r:6,h:21.4},{x:30,y:-381.6,r:6.2,h:26.3},{x:26.6,y:-371.4,r:6.3,h:28.3},{x:31.8,y:-361.1,r:5.5,h:27.3},{x:28,y:-352.3,r:5.8,h:24},{x:25.2,y:-333.7,r:6.1,h:21.9},{x:37.3,y:-332.2,r:5,h:21.9},{x:20.1,y:-323.4,r:6,h:21.6},{x:32.4,y:-322.8,r:5,h:23.4},{x:37,y:-313.2,r:5.6,h:22.7},{x:31.5,y:-304.4,r:5,h:27.3},{x:35.5,y:-295,r:5.1,h:23.2},{x:22.1,y:-285,r:5.9,h:27.7},{x:26.9,y:-274.1,r:4.9,h:25.8},{x:36.1,y:-275.5,r:5.6,h:22.4},{x:20.9,y:-266.9,r:6.1,h:26.6},{x:29.8,y:-264,r:5.3,h:23.6},{x:24.2,y:-254,r:4.9,h:22.2},{x:31.9,y:-247.3,r:5.1,h:23.9},{x:44,y:-248,r:6.3,h:26.7},{x:25.5,y:-236.3,r:5.8,h:25.4},{x:29.8,y:-227.5,r:5,h:26.3},{x:24.7,y:-217,r:6.3,h:28.4},{x:37.9,y:-217,r:5.4,h:27.6},{x:20.9,y:-209,r:5.1,h:23.2},{x:31.2,y:-207.2,r:4.9,h:25.5},{x:24.4,y:-197.1,r:5.7,h:24.3},{x:38.9,y:-199.2,r:6.2,h:27.3},{x:30.4,y:-187,r:5.9,h:23.6},{x:25.8,y:-179.4,r:4.9,h:27.5},{x:31.4,y:-167.9,r:6.4,h:26.1},{x:26.5,y:-159.9,r:6.1,h:23.4},{x:22.2,y:-149.5,r:5.5,h:22.9},{x:32,y:-149.3,r:5.7,h:26.1},{x:27,y:-140.8,r:6,h:26.7},{x:32.6,y:-132.6,r:5.4,h:25.5},{x:27.8,y:-122.5,r:5.1,h:24.8},{x:36.4,y:-120.6,r:5,h:23.7},{x:25.7,y:-104.3,r:5.2,h:21.7},{x:21.6,y:-93.8,r:5.9,h:26.2},{x:30.8,y:-92.8,r:5.1,h:21.5},{x:42.1,y:-94.6,r:5.9,h:26},{x:25.3,y:-82.6,r:5.6,h:22.6},{x:37.4,y:-85.3,r:6.5,h:24.9},{x:33.2,y:-75.4,r:6.3,h:28.2},{x:25.9,y:-62.6,r:5,h:25.3},{x:30.9,y:-53.3,r:6.2,h:23.6},{x:26.6,y:-46.8,r:6.3,h:25},{x:36.8,y:-45.1,r:6.4,h:22.3},{x:26,y:-27.3,r:5.6,h:27.2},{x:36.7,y:-25.6,r:5.2,h:24.5},{x:30,y:-16.1,r:6.4,h:21.7},{x:-41.6,y:-443.2,r:5.3,h:21.3},{x:-44.5,y:-436.7,r:5.9,h:24.8},{x:-38.6,y:-424.6,r:5.5,h:24.5},{x:-44.7,y:-416.4,r:6.5,h:19},{x:36.9,y:-436.1,r:5.4,h:24.9},{x:45,y:-434.2,r:5.8,h:23.8},{x:40.3,y:-424.3,r:5.6,h:19.8},{x:51.5,y:-424.1,r:4.9,h:20},{x:-35.3,y:-479.4,r:5.4,h:20.2},{x:-1.9,y:-478.7,r:6.5,h:22.2},{x:8.1,y:-481.1,r:6.4,h:19.1},{x:17.4,y:-479,r:5.4,h:22.2},{x:31.6,y:-481.9,r:5.4,h:23},{x:40.6,y:-482.1,r:6.3,h:20.2},{x:-29,y:-471.2,r:5.8,h:17.8},{x:-19.2,y:-470.4,r:6.1,h:19.8},{x:-9,y:-469.2,r:6.2,h:20.8},{x:.9,y:-470.3,r:6.1,h:19.1},{x:11.6,y:-469.7,r:5.9,h:21.8},{x:25.8,y:-471.6,r:5.7,h:20.7},{x:48.1,y:-469.9,r:5.7,h:18.1},{x:-37.4,y:-462.2,r:6.5,h:21.4},{x:28.6,y:-463.2,r:6,h:21.8}],
  wind:{dir:1.2217,speed:8}, koi:false },
{ id:'f08', name:'遠足', par:5, gold:4, yards:570, seed:6056,
  tip:'長い上り。右のバンカーを避けて。グリーンにバンカーは無いが、左の盛り土から寄せるのは難しい。',
  tee:{x:0,y:0}, pin:{x:-35.9,y:-567.6},
  bounds:{x0:-106,x1:84,y0:-633,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-29.1],[0,-300.7]],w:36},{pts:[[0,-300.7],[0,-308.8],[-30.4,-524.7]],w:30}],
  green:{cx:-35.9,cy:-563.6,rx:15,ry:9,rot:-1.711},
  bunkers:[{cx:24,cy:-258.7,rx:6.5,ry:12,rot:0,wob:.6}],
  water:[],
  hills:[{x:0,y:-233.1,s:70,a:3},{x:-28.9,y:-521.5,s:55,a:4},{x:-51.6,y:-553.3,s:6,a:2.2},{x:-54.3,y:-565,s:6,a:2.4},{x:-49.7,y:-575.8,s:5,a:1.6},{x:-19.4,y:-553.8,s:5,a:1.2}],
  slope:{gx:-.003,gy:-.02}, bumps:[{x:-33.3,y:-567,s:4,a:.3}],
  treeLines:[],
  trees:[{x:-65,y:-529.9,r:5.8,h:27.3},{x:-69.4,y:-520,r:5.3,h:23.3},{x:-63.6,y:-509.7,r:6.1,h:25.1},{x:-76.9,y:-491,r:5,h:24.3},{x:-65.1,y:-490.3,r:5.9,h:24.1},{x:-71.7,y:-480.3,r:5.4,h:23.7},{x:-58.9,y:-481.5,r:6.3,h:21.1},{x:-66.5,y:-470.7,r:6.3,h:27.2},{x:-69.3,y:-462.1,r:6.3,h:23.9},{x:-59.8,y:-460.4,r:6,h:25.4},{x:-49.9,y:-462.8,r:5.7,h:27.5},{x:-63.8,y:-453.1,r:6,h:24.1},{x:-53.3,y:-451.8,r:5.4,h:24.4},{x:-58.9,y:-443.8,r:5.1,h:27},{x:-49,y:-442.3,r:6.2,h:27.1},{x:-66.9,y:-433.7,r:6.5,h:21.4},{x:-54.9,y:-431,r:5,h:21.5},{x:-58.4,y:-423.7,r:4.9,h:26.7},{x:-67.2,y:-415.1,r:5.7,h:25},{x:-53.9,y:-414.7,r:5.6,h:21.8},{x:-55,y:-394.7,r:4.9,h:27},{x:-44.5,y:-394.5,r:5.6,h:26},{x:-58,y:-383.4,r:5.5,h:26.2},{x:-50.7,y:-382.7,r:6.2,h:20.8},{x:-52.7,y:-375.3,r:5.1,h:22.7},{x:-43,y:-376.4,r:5.1,h:21.2},{x:-48.7,y:-364.3,r:6,h:24.2},{x:-39.6,y:-364.6,r:5.7,h:20.7},{x:-49.5,y:-344.9,r:5.7,h:26.1},{x:-43.8,y:-335.6,r:6,h:21.6},{x:-31.6,y:-337.4,r:5.4,h:24.9},{x:-48.2,y:-325.4,r:5.3,h:20.5},{x:-39.4,y:-326.5,r:5.1,h:22},{x:-43.3,y:-318.3,r:6.2,h:26.2},{x:-31.6,y:-317.7,r:6.1,h:26.3},{x:-49.9,y:-309.3,r:6.2,h:23.7},{x:-38.1,y:-307.7,r:6.1,h:26.7},{x:-42,y:-298,r:5.9,h:24.7},{x:-33.6,y:-298.6,r:5.1,h:25.5},{x:-37.5,y:-287.4,r:5,h:22.7},{x:-45.1,y:-280.7,r:6.4,h:27.1},{x:-47.6,y:-269.5,r:6.2,h:27.4},{x:-38.7,y:-271.1,r:5.3,h:21.4},{x:-44.1,y:-260.2,r:6,h:24},{x:-33.3,y:-260.9,r:5.7,h:24},{x:-37.7,y:-250.8,r:5.7,h:23.6},{x:-42.8,y:-240,r:6.5,h:23.3},{x:-32.5,y:-240.6,r:5.6,h:26.9},{x:-48.9,y:-232,r:5.6,h:26.7},{x:-38.2,y:-230.1,r:5.2,h:20.6},{x:-28.7,y:-231.2,r:5.6,h:25.3},{x:-42.5,y:-221.7,r:5.8,h:25.4},{x:-49.7,y:-213.7,r:5.1,h:22.5},{x:-36.8,y:-213.3,r:5.5,h:26},{x:-25.8,y:-211,r:6.4,h:23.9},{x:-44,y:-201,r:5,h:27.5},{x:-33.6,y:-204.1,r:5.8,h:26.5},{x:-38.3,y:-191.4,r:5.1,h:25.9},{x:-41.6,y:-184.4,r:4.9,h:23.2},{x:-32.9,y:-183.5,r:6.4,h:25.9},{x:-39.3,y:-173.3,r:6,h:22.8},{x:-26.5,y:-175.1,r:5.7,h:20.7},{x:-45,y:-163.5,r:5.7,h:20.7},{x:-33.9,y:-163.9,r:5.8,h:26.9},{x:-38.1,y:-154.8,r:5.6,h:22.6},{x:-31.6,y:-144.3,r:6.2,h:22.3},{x:-49,y:-134.7,r:5.2,h:21.7},{x:-38.7,y:-135.2,r:5.4,h:21.4},{x:-25.6,y:-137.3,r:6.3,h:27.2},{x:-41.8,y:-127.9,r:4.9,h:24.4},{x:-34.3,y:-127.9,r:6,h:22.4},{x:-37.1,y:-117.7,r:6.4,h:23.9},{x:-42.2,y:-106.7,r:6.1,h:27.1},{x:-47.1,y:-98.2,r:6.3,h:21.9},{x:-37.3,y:-98.6,r:5.6,h:23.3},{x:-39.7,y:-77.7,r:6.2,h:25.1},{x:-43.8,y:-70.5,r:5.4,h:21.6},{x:-37.5,y:-57.8,r:5.6,h:24.3},{x:-41.5,y:-51.4,r:6,h:22.6},{x:-30.8,y:-48.4,r:4.9,h:24.9},{x:-37.6,y:-39.8,r:5,h:22.2},{x:32.1,y:-226.8,r:6.1,h:20.9},{x:45.2,y:-227.6,r:5.2,h:24.2},{x:27.8,y:-217.7,r:5.3,h:24.1},{x:37.9,y:-217.2,r:5.7,h:20.6},{x:23.8,y:-208.4,r:5.7,h:25.9},{x:34.1,y:-208.4,r:6.3,h:27.5},{x:37.1,y:-199.9,r:6.1,h:25.3},{x:32.6,y:-190.6,r:5.4,h:22.6},{x:43.6,y:-190.6,r:6.4,h:26.8},{x:27.1,y:-179.9,r:5.8,h:25.1},{x:38.8,y:-179.8,r:5.7,h:21.8},{x:31.6,y:-170.5,r:5.7,h:24},{x:26.1,y:-141.2,r:6,h:24.2},{x:38.7,y:-142.8,r:5.6,h:24.3},{x:23,y:-133.3,r:4.8,h:27.5},{x:32.8,y:-133.4,r:5.4,h:21.6},{x:38.1,y:-123.7,r:5,h:20.5},{x:48.5,y:-121.6,r:6.5,h:22.4},{x:32.1,y:-114.7,r:5.9,h:21.7},{x:44.2,y:-114,r:6.1,h:20.7},{x:25.7,y:-102.6,r:5.7,h:23.4},{x:37.3,y:-105.8,r:5.1,h:27.4},{x:32.9,y:-94.1,r:5.6,h:26.6},{x:26.6,y:-86.6,r:6.4,h:23.2},{x:34.7,y:-73.5,r:5.2,h:22},{x:42.6,y:-73.5,r:6.5,h:24.3},{x:40.4,y:-67.6,r:6.1,h:22.5},{x:49.2,y:-64.1,r:6,h:27.2},{x:34,y:-56,r:5.5,h:25.8},{x:44.1,y:-57.9,r:4.9,h:21.7},{x:38.9,y:-46.2,r:4.8,h:27.2},{x:34.6,y:-37,r:5.4,h:21.8},{x:29.4,y:-27.2,r:4.9,h:22.9},{x:38.1,y:-28.9,r:5.3,h:24.8},{x:33.9,y:-19.3,r:6.4,h:22.7},{x:33,y:-351.2,r:5.5,h:20.8},{x:41,y:-351.9,r:6.3,h:24.7},{x:37.5,y:-339.3,r:6.3,h:22.5},{x:40.5,y:-330.8,r:5.2,h:22.1},{x:46.8,y:-321.3,r:5.4,h:21.4},{x:40.5,y:-311.5,r:6.5,h:22.3},{x:37.7,y:-303.8,r:5.8,h:27.4},{x:46.5,y:-301.8,r:5,h:25.4},{x:43.7,y:-293.3,r:6.4,h:26.4},{x:52.8,y:-292.2,r:5.1,h:25.7},{x:48.8,y:-283.6,r:5.6,h:27},{x:41.7,y:-272.5,r:5.8,h:20.8},{x:53,y:-273.9,r:6,h:25.1},{x:46,y:-262.9,r:5.7,h:26.2},{x:42.3,y:-256.9,r:6.3,h:27.3},{x:51.9,y:-253.1,r:6.3,h:22},{x:42.2,y:-235.5,r:6.1,h:27.1},{x:54.7,y:-235.7,r:5,h:21.4},{x:3.5,y:-550.2,r:5.6,h:19.7},{x:.2,y:-540,r:6.4,h:22.6},{x:10.6,y:-540.5,r:6.3,h:23.8},{x:3.7,y:-528.4,r:5.3,h:21.9},{x:13.7,y:-530.7,r:5.8,h:21.8},{x:0,y:-518.6,r:5.2,h:23.9},{x:11.1,y:-520.7,r:4.9,h:21.9},{x:4.2,y:-509.9,r:5.7,h:22.2},{x:13.3,y:-510.3,r:5.7,h:23.9},{x:9.5,y:-499.9,r:4.8,h:20.2},{x:4.7,y:-492.7,r:5.1,h:23.8},{x:13.7,y:-491.8,r:6.4,h:21.9},{x:19.1,y:-482,r:6.2,h:23.7},{x:16.1,y:-471.9,r:6.1,h:19.1},{x:26.9,y:-472.1,r:5,h:20.7},{x:10.9,y:-462.4,r:5.1,h:22.6},{x:20.2,y:-463.3,r:6.3,h:22.1},{x:5.4,y:-454.5,r:5.3,h:22.3},{x:15.8,y:-452.3,r:5.7,h:20.7},{x:8,y:-442.4,r:5.5,h:24.4},{x:19.2,y:-443.8,r:5.7,h:21.7},{x:30,y:-441.7,r:5,h:23.9},{x:13,y:-432.5,r:5.2,h:20.7},{x:11,y:-423.8,r:5.2,h:23.6},{x:21.3,y:-422.9,r:5,h:19.8},{x:16.4,y:-412.8,r:5.3,h:24.2},{x:27.4,y:-415.7,r:6.1,h:19.4},{x:35.4,y:-414.6,r:5.4,h:22.4},{x:19.4,y:-403.5,r:5.8,h:25.3},{x:30.7,y:-405.8,r:5.4,h:23},{x:15.1,y:-396.3,r:6.3,h:23.6},{x:25.9,y:-393.6,r:5.9,h:20.4},{x:38.1,y:-396.3,r:5.3,h:23.7},{x:19.9,y:-386.4,r:6,h:19},{x:32.2,y:-385.8,r:5,h:20.6},{x:25.8,y:-377.4,r:5.1,h:25.3},{x:30.7,y:-366.9,r:5.2,h:21.6},{x:27.3,y:-355.5,r:6,h:21.1},{x:-51.1,y:-601.4,r:5.8,h:20.2},{x:-19.1,y:-604.2,r:5.1,h:15.8},{x:-6.2,y:-602.5,r:5.6,h:20.7},{x:-68.6,y:-591.9,r:4.9,h:17.2},{x:-55,y:-592.5,r:5.4,h:18.6},{x:-31.8,y:-594.6,r:5.5,h:16.8},{x:-22,y:-593,r:6.5,h:15.9},{x:-11.5,y:-593.9,r:5.9,h:17.9},{x:-1.3,y:-591.9,r:6.4,h:20},{x:-62.1,y:-583.5,r:4.9,h:19.9},{x:-26.4,y:-584,r:5,h:17.8}],
  wind:{dir:-.0636,speed:8}, koi:false },
{ id:'f09', name:'谷渡り', par:4, gold:3, yards:460, seed:6063,
  tip:'下りの左ドッグレッグから、上りの 2 打目。グリーンの手前は落ちる。左に 2 つのバンカー。',
  tee:{x:0,y:0}, pin:{x:-58.9,y:-449.4},
  bounds:{x0:-124,x1:82,y0:-515,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-30.9],[0,-290.4],[-2.1,-296.2]],w:34},{pts:[[-2.1,-296.2],[-49.1,-425]],w:28}],
  green:{cx:-56.9,cy:-446.4,rx:13,ry:12,rot:-1.921},
  bunkers:[],
  bunkerLines:[{pts:[[-56.9,-428.9,2.7],[-63,-430.4,3.4],[-68.2,-433.9,2.7]]},{pts:[[-71.5,-438.6,2.6],[-73.3,-444.1,3.2],[-73.3,-449.9,2.6]]}],
  water:[],
  hills:[{x:0,y:10,s:50,a:3.5},{x:-6.3,y:-309,s:45,a:-1.5},{x:-56.9,y:-446.4,s:24,a:4}],
  slope:{gx:-.01,gy:-.028}, bumps:[],
  treeLines:[],
  trees:[{x:-50.8,y:-289.1,r:5.9,h:27.1},{x:-39.9,y:-287.3,r:5.4,h:23.8},{x:-30.6,y:-286.6,r:6.3,h:26.4},{x:-54.3,y:-280.4,r:5.6,h:25.2},{x:-43.7,y:-277.4,r:4.8,h:26},{x:-34.3,y:-278,r:4.9,h:24.9},{x:-24.1,y:-278.5,r:5.2,h:25.2},{x:-49.7,y:-268.4,r:6.5,h:26.3},{x:-41.3,y:-270.7,r:5.9,h:26.2},{x:-27.9,y:-269.3,r:6.3,h:29.4},{x:-56,y:-258.7,r:6,h:26},{x:-44,y:-258.8,r:6.3,h:29.2},{x:-35,y:-261.2,r:5.1,h:28.8},{x:-52.3,y:-249.6,r:5.7,h:28.8},{x:-41,y:-250.2,r:6,h:25.2},{x:-27.4,y:-251.5,r:5.5,h:29.1},{x:-46.4,y:-241.1,r:6,h:28.2},{x:-35,y:-242,r:6.2,h:28.2},{x:-24.4,y:-240.2,r:6.5,h:29.8},{x:-51.2,y:-232.7,r:5.9,h:24.8},{x:-39.2,y:-232.3,r:6.2,h:24},{x:-28.7,y:-230.8,r:5.1,h:24.2},{x:-43.4,y:-223.2,r:5.9,h:28.9},{x:-34.2,y:-219.8,r:6.4,h:22.9},{x:-52,y:-212.3,r:5.9,h:26.6},{x:-41.4,y:-211,r:6.1,h:28.2},{x:-28.1,y:-210.9,r:5.4,h:25.2},{x:-55.3,y:-203.7,r:5.2,h:29.6},{x:-44.5,y:-203.3,r:5.2,h:23.2},{x:-35.8,y:-200.3,r:5.1,h:25.2},{x:-23.2,y:-200.8,r:6.1,h:26.4},{x:-50.7,y:-194.2,r:5.6,h:26.5},{x:-39.7,y:-190.7,r:6.3,h:25.8},{x:-30.6,y:-193.6,r:6.2,h:29.1},{x:-56.3,y:-182.9,r:4.9,h:26.7},{x:-46.4,y:-184.5,r:6.1,h:22.6},{x:-32.4,y:-184.4,r:5,h:28.3},{x:-50,y:-175.1,r:5.7,h:26.9},{x:-40.9,y:-173.3,r:5.2,h:23.7},{x:-29.9,y:-172,r:4.9,h:26},{x:-44.4,y:-162.6,r:6.4,h:29.2},{x:-35.5,y:-162.9,r:5.7,h:26.1},{x:-50.5,y:-154.8,r:5.2,h:25.8},{x:-38.5,y:-154.3,r:4.9,h:28.6},{x:-29.4,y:-154.1,r:6.3,h:28.4},{x:-55.5,y:-145.4,r:5.4,h:22.7},{x:-45.9,y:-144.4,r:5.5,h:27.9},{x:-32.4,y:-143.8,r:6.4,h:27.5},{x:-23,y:-144.6,r:4.9,h:22.9},{x:-50.4,y:-136.2,r:5,h:29.4},{x:-39.7,y:-136.4,r:6.2,h:23.8},{x:-27.5,y:-137,r:6.2,h:26.6},{x:-56.5,y:-126.6,r:5.8,h:26.2},{x:-45.5,y:-126.8,r:6.3,h:27.5},{x:-34.8,y:-126.9,r:6,h:27.5},{x:-50.2,y:-115,r:4.8,h:26.3},{x:-40,y:-115.6,r:5.4,h:28.7},{x:-28.4,y:-114.6,r:5.9,h:25.1},{x:-56.4,y:-107.3,r:5,h:24.6},{x:-44.3,y:-104.9,r:5.7,h:24.2},{x:-33.7,y:-105.5,r:6,h:29.2},{x:-51.3,y:-97,r:5.2,h:22.1},{x:-40,y:-98.8,r:5.9,h:22.8},{x:-28.7,y:-98.3,r:5.4,h:24.3},{x:-44.7,y:-86.9,r:5.3,h:22.2},{x:-34.1,y:-88.7,r:5.5,h:27.2},{x:-24.1,y:-85.9,r:6.4,h:24.7},{x:-51.4,y:-79.5,r:5.5,h:29.7},{x:-41,y:-79.6,r:5.4,h:27.1},{x:-29.5,y:-77.9,r:5.7,h:29.2},{x:8.7,y:-412.3,r:5.9,h:26.8},{x:-8.8,y:-404.1,r:6,h:21.5},{x:14.6,y:-402.7,r:6,h:22.5},{x:-3.1,y:-395.6,r:5.9,h:27.3},{x:7.3,y:-395.6,r:5.5,h:23},{x:3.4,y:-386.1,r:5.4,h:26.5},{x:15.1,y:-382.8,r:5.7,h:27.1},{x:-2.8,y:-376.6,r:5.4,h:24.2},{x:8.1,y:-376.8,r:6.2,h:27.3},{x:19.5,y:-374.4,r:6.3,h:23.8},{x:14,y:-367.4,r:5.2,h:26.8},{x:23.6,y:-364.7,r:6,h:23.6},{x:21.2,y:-357.6,r:5.4,h:26.7},{x:15.6,y:-345.2,r:5.9,h:27.4},{x:21.3,y:-337.7,r:5.6,h:25.3},{x:26.4,y:-327.9,r:6,h:26},{x:20.7,y:-317.2,r:5.5,h:22.1},{x:31.3,y:-318.2,r:6.1,h:21.2},{x:41,y:-316.2,r:6,h:23.7},{x:35.6,y:-308.6,r:6.2,h:23.7},{x:31.5,y:-296.6,r:4.9,h:25},{x:41.7,y:-299.1,r:6.5,h:20.7},{x:35.2,y:-288.3,r:6.1,h:21.2},{x:35.9,y:-271.8,r:5.6,h:21.7},{x:32.4,y:-261.4,r:6.4,h:27.1},{x:42.5,y:-259,r:5.5,h:20.8},{x:36.9,y:-249.3,r:4.9,h:20.7},{x:30.7,y:-240.8,r:5,h:26.8},{x:42.3,y:-240.9,r:5.7,h:22},{x:35.2,y:-232.8,r:5.4,h:25.8},{x:31.2,y:-220.1,r:5.3,h:22.7},{x:40.6,y:-221.3,r:5.9,h:22.1},{x:34.4,y:-211.1,r:5.4,h:22.1},{x:46.2,y:-210.5,r:5.5,h:23.6},{x:29.5,y:-203.3,r:5.4,h:21.5},{x:39.7,y:-201.9,r:5.6,h:26.4},{x:51.8,y:-201.5,r:5.8,h:25.1},{x:35.7,y:-191.8,r:5.6,h:23.7},{x:43.1,y:-183,r:4.8,h:21},{x:36.6,y:-172.8,r:6.3,h:27.1},{x:42.6,y:-163.7,r:5.5,h:23.3},{x:37.6,y:-156.3,r:5.2,h:24},{x:46.1,y:-154.4,r:6.5,h:25},{x:29.1,y:-146.1,r:6.4,h:25.4},{x:41.5,y:-144.3,r:5.2,h:20.9},{x:35.8,y:-134.4,r:6.3,h:21},{x:31.5,y:-127.3,r:5.3,h:25.1},{x:39.7,y:-125.2,r:6,h:25},{x:37.9,y:-115.6,r:5.9,h:21.6},{x:29.1,y:-89.7,r:5,h:26.9},{x:41.2,y:-86.1,r:5.6,h:22.3},{x:24.8,y:-80,r:6.5,h:27.1},{x:35.4,y:-80.2,r:5.8,h:20.5},{x:32.4,y:-69,r:5.3,h:23.6},{x:48.3,y:-60.2,r:5.4,h:27.3},{x:29.3,y:-51.1,r:6.3,h:22.6},{x:41.2,y:-50.4,r:5.8,h:27.5},{x:37.4,y:-38.7,r:5.8,h:22.4},{x:30.8,y:-31.7,r:5.2,h:25.2},{x:26.7,y:-21.1,r:6.1,h:23.2},{x:-89.3,y:-427.5,r:5,h:24.8},{x:-94.6,y:-420.9,r:5.7,h:21.9},{x:-85.5,y:-418.9,r:5,h:20.9},{x:-80,y:-410.8,r:5.4,h:19.3},{x:-84.1,y:-399.3,r:5.3,h:24.1},{x:-73.5,y:-399.8,r:5.6,h:24.6},{x:-83.1,y:-382.7,r:5.5,h:19.5},{x:-72.5,y:-382.1,r:4.8,h:23},{x:-68.6,y:-372.5,r:5,h:22.2},{x:-73.4,y:-360.8,r:5.5,h:20.6},{x:-69.1,y:-353.9,r:5.6,h:21.4},{x:-57.4,y:-352.9,r:5.3,h:20},{x:-63,y:-341.2,r:5.3,h:22.1},{x:-66.6,y:-335.3,r:5.3,h:19.3},{x:-55,y:-334.1,r:6.4,h:19.6},{x:-46.2,y:-332.1,r:5.1,h:24.5},{x:-51.2,y:-324.5,r:5.1,h:20.1},{x:-54.5,y:-315.4,r:5.7,h:21.6},{x:-43.9,y:-313.1,r:6,h:19.6},{x:-41,y:-303.2,r:6.2,h:21.7},{x:-42.6,y:-486.1,r:5.4,h:19.1},{x:-69.5,y:-474.2,r:5.5,h:18},{x:-48.3,y:-474.6,r:5.1,h:18},{x:-62.1,y:-466.7,r:5,h:17},{x:-89.7,y:-455.3,r:5.8,h:16.5}],
  tiers:[{x:-54.8,y:-440.8,nx:-.343,ny:-.939,h:.6}],
  wind:{dir:-4.3156,speed:8}, koi:false },
{ id:'f10', name:'花吹雪', par:4, gold:3, yards:495, seed:6070,
  tip:'大きく下る左ドッグレッグ。ドローで角を回ろう。手前の右の大きなバンカーと、グリーンの右のバンカー。',
  tee:{x:0,y:0}, pin:{x:-92.6,y:-477.9},
  bounds:{x0:-156,x1:77,y0:-555,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:-.024},
  fairways:[{pts:[[-.8,-31.9],[-6.4,-268],[-8.7,-273.8]],w:38},{pts:[[-8.7,-273.8],[-83.5,-460.6]],w:32}],
  green:{cx:-89.6,cy:-475.9,rx:14,ry:12,rot:-1.951},
  bunkers:[{cx:-52.1,cy:-414.6,rx:7.5,ry:11,rot:-.381,wob:.8}],
  bunkerLines:[{pts:[[-77.3,-487.7,2.7],[-74.2,-482.7,3.4],[-72.6,-477,3.4],[-72.8,-471,2.7]]}],
  water:[],
  hills:[{x:0,y:15,s:80,a:7},{x:-11.2,y:-229.8,s:60,a:2}],
  slope:{gx:.013,gy:-.021}, bumps:[],
  treeLines:[],
  trees:[{x:-57.8,y:-286.9,r:5.2,h:23.9},{x:-46.1,y:-284.8,r:5.5,h:29.4},{x:-63.3,y:-275.9,r:5.3,h:30.6},{x:-52.5,y:-276.9,r:6.4,h:24.6},{x:-40.9,y:-274.6,r:5.3,h:24.4},{x:-58.9,y:-266.1,r:5.2,h:26.7},{x:-48.8,y:-267.7,r:6.3,h:29.8},{x:-36.5,y:-268,r:6.1,h:26},{x:-54.3,y:-255.2,r:4.8,h:23.3},{x:-44,y:-256.2,r:6.4,h:29.5},{x:-59.9,y:-246.8,r:6.2,h:29.5},{x:-46.5,y:-247.9,r:5.4,h:26.4},{x:-35.1,y:-247.5,r:6.2,h:29.7},{x:-54.3,y:-237.2,r:4.9,h:25.3},{x:-40.4,y:-237.5,r:6.4,h:26.1},{x:-30.8,y:-238.4,r:5.2,h:28.4},{x:-58.2,y:-229.9,r:5.4,h:23.1},{x:-49.5,y:-229.9,r:5.6,h:26.3},{x:-38.8,y:-227.8,r:6.4,h:23.3},{x:-64.8,y:-219.3,r:5.8,h:25.1},{x:-51.8,y:-219.8,r:5.5,h:28.9},{x:-43.5,y:-216.9,r:5,h:24.1},{x:-29.5,y:-218.8,r:5.8,h:29.4},{x:-57.7,y:-209.9,r:4.9,h:28.5},{x:-47.5,y:-208.3,r:5.1,h:25.6},{x:-36.2,y:-209.2,r:5,h:24},{x:-52.3,y:-199.3,r:5.2,h:26.6},{x:-42.9,y:-198.1,r:5.5,h:24.8},{x:-58.1,y:-190,r:6.2,h:25.2},{x:-46.7,y:-191.2,r:5.2,h:25.2},{x:-37.1,y:-189.5,r:6,h:26.5},{x:-52.8,y:-181.6,r:5.2,h:28.6},{x:-41.8,y:-179.1,r:6.2,h:30.5},{x:-58.4,y:-169.9,r:6,h:27},{x:-46.3,y:-171,r:6.1,h:26.5},{x:-38.6,y:-171.5,r:6,h:24},{x:-51.5,y:-162.2,r:6.1,h:23},{x:-43.3,y:-163.1,r:4.9,h:24.9},{x:-47.9,y:-151.8,r:5.9,h:28.8},{x:-38.1,y:-153.5,r:6,h:24.8},{x:-51.5,y:-142.2,r:4.9,h:25},{x:-41.8,y:-142.3,r:5.7,h:28.6},{x:-30.8,y:-142.4,r:5,h:29.7},{x:-57.1,y:-133.1,r:5.8,h:23.8},{x:-48.1,y:-131.2,r:5.5,h:25.3},{x:-37,y:-131.7,r:6.4,h:30.2},{x:-53.8,y:-121.9,r:5.2,h:23.1},{x:-40.5,y:-123,r:5.5,h:28.4},{x:-31.1,y:-125,r:6.1,h:24.1},{x:-57.5,y:-112.7,r:6.3,h:27.4},{x:-47.2,y:-112.7,r:6.3,h:28.9},{x:-37.2,y:-113.3,r:5.3,h:23.8},{x:-23.9,y:-111.8,r:5,h:29.9},{x:-52.4,y:-105.1,r:5.5,h:29.1},{x:-41.3,y:-102.7,r:6.4,h:26.7},{x:-32.9,y:-104.9,r:6,h:24.2},{x:-58.5,y:-95.1,r:5.3,h:23.6},{x:-46,y:-95.7,r:5,h:27.6},{x:-35.6,y:-93.4,r:5.9,h:25.4},{x:-51.6,y:-86.6,r:6.4,h:25.1},{x:-43.7,y:-83.8,r:6.1,h:30.1},{x:-32.4,y:-84.3,r:6.1,h:24.3},{x:-48.2,y:-77,r:5.4,h:27.1},{x:-62,y:-488.7,r:5.9,h:24.1},{x:-49.9,y:-490.9,r:5.6,h:22.4},{x:-57.3,y:-479.3,r:6,h:23.1},{x:-46.2,y:-479.2,r:5,h:25.4},{x:-40.7,y:-451.3,r:5.9,h:27.1},{x:-48,y:-441.7,r:5.7,h:26.8},{x:-35,y:-439.8,r:5.8,h:23.7},{x:-28,y:-432.9,r:5.3,h:24},{x:-33.9,y:-421.7,r:5.4,h:27.4},{x:-30,y:-411.9,r:4.9,h:25.6},{x:-19.3,y:-412.5,r:5.8,h:22.3},{x:-13,y:-403.6,r:6.3,h:24.2},{x:-17.8,y:-395,r:5,h:21.3},{x:-8.1,y:-395.2,r:5.1,h:26.8},{x:-25.4,y:-385.8,r:5.3,h:24.7},{x:-11.9,y:-382.7,r:5.6,h:21.4},{x:-7.7,y:-374.7,r:6,h:23.4},{x:2.4,y:-373.6,r:5.9,h:26.6},{x:-3.4,y:-363.5,r:5.2,h:26.3},{x:9.8,y:-346.7,r:5.5,h:25.6},{x:4.3,y:-335.5,r:4.9,h:27.6},{x:14.1,y:-336.2,r:5.1,h:23.7},{x:7.4,y:-325.3,r:5.2,h:24},{x:19,y:-326.7,r:6.1,h:21.8},{x:18.8,y:-308.1,r:6.2,h:21.1},{x:29,y:-306.8,r:5.5,h:20.6},{x:27,y:-296.7,r:5.7,h:21.9},{x:35.9,y:-297.3,r:5.9,h:24.8},{x:32.3,y:-287.3,r:6.1,h:22.6},{x:24.4,y:-277.4,r:6.2,h:27.3},{x:29.8,y:-270.3,r:5.9,h:25.7},{x:34.7,y:-240.1,r:5.4,h:26.9},{x:31.5,y:-229.7,r:5.9,h:23.2},{x:25.2,y:-220.6,r:4.9,h:24.9},{x:21.5,y:-210.4,r:4.9,h:25},{x:31.8,y:-211.3,r:6,h:26.8},{x:40.7,y:-210.9,r:6.1,h:21.6},{x:25.6,y:-203.9,r:6.2,h:20.9},{x:35.2,y:-201.1,r:6,h:25.3},{x:32.7,y:-192.5,r:6.1,h:23.7},{x:42.3,y:-191.6,r:5.9,h:23.4},{x:37.9,y:-182.2,r:6.2,h:26.1},{x:29.5,y:-173.8,r:6.2,h:20.6},{x:25.3,y:-165.1,r:6.3,h:26.4},{x:35,y:-164.1,r:5.3,h:23.8},{x:46.7,y:-164.9,r:6.5,h:22.9},{x:35.5,y:-144.9,r:5.2,h:21.8},{x:26.4,y:-126.3,r:5,h:25.1},{x:36.5,y:-125.5,r:6.2,h:23},{x:46.8,y:-125.4,r:5.7,h:21},{x:36.1,y:-105.6,r:6.1,h:27.1},{x:32.1,y:-98.5,r:4.9,h:22.2},{x:42.8,y:-95.3,r:6.3,h:26.5},{x:37.6,y:-88.9,r:6.2,h:25.7},{x:45.8,y:-86,r:6.4,h:21.8},{x:30.5,y:-77.4,r:6.4,h:26.6},{x:42,y:-79.3,r:6.2,h:21.3},{x:36.7,y:-66.3,r:5.6,h:25.1},{x:29.9,y:-57.9,r:5.3,h:21.5},{x:40.1,y:-60.2,r:5.7,h:20.8},{x:34.7,y:-49.3,r:5.8,h:24.3},{x:31.6,y:-39.1,r:6.3,h:27.6},{x:41.3,y:-40.8,r:6.2,h:26.1},{x:37.7,y:-30.1,r:6.2,h:25.7},{x:46.9,y:-30,r:6.5,h:21.7},{x:-126.9,y:-448.7,r:5,h:24.2},{x:-113.8,y:-449.6,r:4.9,h:22.3},{x:-120.4,y:-439.7,r:5.3,h:19.9},{x:-110.2,y:-439.3,r:5.3,h:24.7},{x:-114.9,y:-429.3,r:5.6,h:21.3},{x:-108.5,y:-419.7,r:5,h:21.1},{x:-103.3,y:-412.4,r:4.9,h:22.3},{x:-108.1,y:-401.2,r:6.4,h:21.9},{x:-97.8,y:-401,r:5.9,h:20},{x:-93.5,y:-392.4,r:4.9,h:21.3},{x:-98.3,y:-382.9,r:5.8,h:22.1},{x:-88.5,y:-383.6,r:6.2,h:23.3},{x:-79.7,y:-352.7,r:6.4,h:19.7},{x:-86.2,y:-342.4,r:6.5,h:22},{x:-75.1,y:-344,r:6.2,h:23.1},{x:-82.7,y:-332.8,r:6.1,h:19.9},{x:-69.9,y:-336.2,r:5.1,h:21.6},{x:-59.7,y:-333.6,r:5.1,h:23.8},{x:-74.9,y:-325.5,r:5.1,h:19.9},{x:-65.3,y:-324.4,r:5.5,h:22.9},{x:-57.8,y:-316.7,r:5.9,h:23.4},{x:-60,y:-296.1,r:5.7,h:18.7},{x:-48.7,y:-296.8,r:6.2,h:20.7},{x:-53.1,y:-287.4,r:6.3,h:23.4},{x:-69.6,y:-526.3,r:4.9,h:16},{x:-72.7,y:-518.4,r:5,h:16.9},{x:-63,y:-516.8,r:6.3,h:20.2},{x:-114.1,y:-506.1,r:5.8,h:18.5},{x:-101.6,y:-506.7,r:6,h:15.7},{x:-107.9,y:-497.7,r:6.2,h:18.6},{x:-96.2,y:-499.5,r:6.5,h:19.5},{x:-83.4,y:-496.4,r:5.2,h:20.3},{x:-122.7,y:-489.3,r:5.8,h:19}],
  wind:{dir:-.1861,speed:7}, koi:false },
{ id:'f11', name:'水温む', par:4, gold:3, yards:520, seed:6077,
  tip:'木の間から打ち出す長いパー 4。グリーンの左は池。左へ押す風で池が近くなる。',
  tee:{x:0,y:0}, pin:{x:-11.2,y:-517.8},
  bounds:{x0:-106,x1:94,y0:-615,y1:32},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:.048},
  fairways:[{pts:[[2.5,-51.6],[15.5,-323],[14.8,-329.1]],w:34},{pts:[[14.8,-329.1],[-6.2,-502.4]],w:30}],
  green:{cx:-8.2,cy:-518.8,rx:13,ry:12,rot:-1.691},
  bunkers:[],
  bunkerLines:[{pts:[[-3.6,-535.8,2.6],[1.4,-533.2,3.2],[5.2,-529.1,3.2],[7.7,-524.2,2.6]]}],
  water:[{cx:-31.3,cy:-510,rx:22,ry:12,rot:-1.691}],
  waterLines:[[[-81.8,-544.1,3.5],[-32.4,-552.1,3.5],[12.5,-555.6,3.5],[51.8,-564.3,3.5]]],
  hills:[{x:0,y:0,s:50,a:3},{x:42.8,y:-258.8,s:50,a:2.5}],
  slope:{gx:.019,gy:-.012}, bumps:[],
  treeLines:[],
  trees:[{x:-16.3,y:-83.1,r:5.8,h:27},{x:-21.5,y:-74.4,r:5,h:26.7},{x:-25.8,y:-64.4,r:5.9,h:22.7},{x:-14.3,y:-63.9,r:6.4,h:23.2},{x:-26.1,y:-45.5,r:5.3,h:22.3},{x:-14.5,y:-46.8,r:5.4,h:25.6},{x:-22.8,y:-36.6,r:5.2,h:27.7},{x:-28.7,y:-25.3,r:6.1,h:22.8},{x:-31.3,y:-18.3,r:6.1,h:21.9},{x:-22.5,y:-16.5,r:5,h:25.6},{x:-36.2,y:-7.7,r:4.9,h:26.2},{x:-28.7,y:-5.5,r:5.4,h:21.3},{x:-23.4,y:2.3,r:6,h:28.5},{x:25.5,y:-83.7,r:6.3,h:21.7},{x:29.3,y:-74.5,r:4.9,h:26},{x:24,y:-65.3,r:6,h:23.9},{x:35.7,y:-66.1,r:4.9,h:22.6},{x:31.9,y:-56,r:5.7,h:28.3},{x:26.2,y:-44.2,r:5.5,h:26.2},{x:36.3,y:-47.6,r:5.9,h:22.5},{x:29.4,y:-34.9,r:6,h:28.1},{x:27.1,y:-28.3,r:6.2,h:26.1},{x:35.5,y:-26.4,r:6.4,h:27.5},{x:29.4,y:-19,r:5.7,h:25.4},{x:26.8,y:-5.9,r:6.2,h:23.5},{x:-34.2,y:-409.1,r:6,h:27.5},{x:-40.8,y:-400.2,r:5.5,h:26.2},{x:-30.1,y:-397.5,r:5.7,h:23.2},{x:-34.1,y:-388.1,r:5,h:27.5},{x:-25.1,y:-388.6,r:5.9,h:20.9},{x:-42.3,y:-378.6,r:5.4,h:21.5},{x:-29.4,y:-378.4,r:5.2,h:21.3},{x:-18.8,y:-379.9,r:5.5,h:26.3},{x:-34.5,y:-372,r:4.9,h:24.6},{x:-25.2,y:-372.2,r:6.3,h:20.5},{x:-13.9,y:-370.6,r:5.6,h:23.3},{x:-18.9,y:-360.2,r:5.7,h:21.4},{x:-34.8,y:-350.2,r:6,h:26.8},{x:-23.1,y:-350.3,r:6.1,h:21.7},{x:-15.3,y:-350.5,r:6.2,h:20.6},{x:-30.8,y:-342,r:6.4,h:27.3},{x:-20.5,y:-339.8,r:6.3,h:25.8},{x:-23.1,y:-332.3,r:6.1,h:24.7},{x:-18,y:-323.8,r:6.4,h:26.6},{x:-23,y:-311,r:6.2,h:23.7},{x:-14.5,y:-312.2,r:5.1,h:26},{x:-31.3,y:-302.9,r:6.3,h:23.8},{x:-20.6,y:-302.4,r:5.8,h:21.8},{x:-34.6,y:-292.8,r:5.9,h:23.1},{x:-23.3,y:-292.9,r:5.6,h:22.9},{x:-29.5,y:-283.1,r:6.4,h:25.4},{x:-20.5,y:-284.4,r:5.2,h:24.4},{x:-23.1,y:-273.7,r:5.6,h:23.8},{x:-13.7,y:-276.3,r:5.6,h:27.4},{x:-30.7,y:-266,r:5.8,h:21.7},{x:-20.5,y:-263.9,r:6,h:22.6},{x:-23,y:-237.8,r:6.5,h:24.9},{x:-29,y:-225.3,r:5.3,h:23.5},{x:-22.8,y:-219,r:6.3,h:24.5},{x:-29.1,y:-208.8,r:4.9,h:23.4},{x:-19.7,y:-207.9,r:5.1,h:22},{x:-35.8,y:-199.1,r:6.2,h:26.9},{x:-24.4,y:-197.5,r:6,h:21.8},{x:-30.1,y:-188.4,r:5.6,h:21.3},{x:-35.5,y:-177.4,r:6,h:24.1},{x:-24.6,y:-177.9,r:6.2,h:27.1},{x:-30.1,y:-168.6,r:5.4,h:27.4},{x:-17.6,y:-169.6,r:6.2,h:20.5},{x:-34,y:-157.9,r:4.9,h:25},{x:-31.3,y:-152,r:5.4,h:23.1},{x:-17.6,y:-151.9,r:6.2,h:26},{x:-23.7,y:-139.8,r:5.9,h:23.4},{x:-28.4,y:-129.5,r:6.1,h:25.8},{x:-37.2,y:-123.2,r:5.2,h:20.5},{x:-23.3,y:-121.9,r:5.1,h:27.4},{x:-31.2,y:-111,r:5.1,h:24},{x:-35.9,y:-103.4,r:4.9,h:26},{x:-30.3,y:-93.8,r:6.4,h:24.2},{x:27.9,y:-502.5,r:4.9,h:21},{x:33.1,y:-493.5,r:5.3,h:27.3},{x:30.7,y:-484.2,r:5,h:21},{x:41.6,y:-484.4,r:5.3,h:24.3},{x:23.8,y:-473.6,r:6.1,h:26.3},{x:35.5,y:-473.4,r:5.9,h:23},{x:29.9,y:-464.7,r:5.5,h:27.3},{x:41.6,y:-464,r:4.8,h:23.6},{x:33.9,y:-454,r:5.1,h:23.4},{x:29.8,y:-445.5,r:6.4,h:24.8},{x:40.9,y:-447.4,r:6.1,h:26.3},{x:49.9,y:-447.4,r:6,h:23},{x:43.8,y:-435.7,r:6.1,h:24.1},{x:39.1,y:-427.1,r:4.9,h:27.1},{x:33.5,y:-417.2,r:4.9,h:21.9},{x:46.4,y:-417.3,r:5.2,h:21.9},{x:41.1,y:-409.8,r:4.9,h:20.5},{x:51.9,y:-409.4,r:5.2,h:23.7},{x:35.7,y:-396.6,r:5.9,h:26.7},{x:43.8,y:-397.6,r:6.1,h:23.4},{x:55.4,y:-400,r:5.5,h:23.4},{x:39.4,y:-390.5,r:5.1,h:21.9},{x:51.5,y:-387.2,r:5.8,h:21.3},{x:36.2,y:-378.4,r:5.8,h:27},{x:50.1,y:-369,r:5.8,h:24.4},{x:52.5,y:-350,r:5.8,h:26.2},{x:46,y:-340.8,r:5.1,h:20.6},{x:56.6,y:-339.8,r:5,h:20.5},{x:40.6,y:-331.6,r:5.2,h:21.4},{x:51.2,y:-330.6,r:4.9,h:23.4},{x:46.1,y:-320.4,r:5.5,h:21.6},{x:55.6,y:-320.8,r:6.4,h:22.1},{x:50.3,y:-312.1,r:5.6,h:27.4},{x:63.5,y:-311.4,r:6.1,h:24.2},{x:39.9,y:-294.8,r:5.2,h:20.9},{x:57.6,y:-283.3,r:5.8,h:23},{x:49.9,y:-272.9,r:4.8,h:22.4},{x:44.5,y:-264.1,r:5.8,h:24.2},{x:56.2,y:-264.9,r:5,h:21.4},{x:51.4,y:-253.5,r:6.4,h:27.5},{x:44,y:-247,r:5.9,h:22.4},{x:50.9,y:-234.8,r:5.9,h:27.2},{x:43.7,y:-226.5,r:5.2,h:22.6},{x:58.3,y:-226.1,r:5.6,h:22.4},{x:38.2,y:-198.3,r:6.4,h:27},{x:49.3,y:-198,r:6,h:25.7},{x:47.4,y:-186.8,r:6.4,h:25.6},{x:49.2,y:-178.3,r:5.4,h:23.6},{x:43.8,y:-167.3,r:6.2,h:22.6},{x:49.2,y:-158.5,r:6.2,h:26.7},{x:44.7,y:-148.6,r:5,h:21.4},{x:54.9,y:-147.9,r:5.4,h:21},{x:41,y:-139.4,r:5,h:20.6},{x:39.2,y:-119,r:5.5,h:24.5},{x:35.6,y:-111.8,r:4.8,h:21.2},{x:47.3,y:-110.4,r:5.1,h:23},{x:30.6,y:-103.2,r:5.9,h:24.7},{x:41.9,y:-100.1,r:5.6,h:21.3},{x:34.5,y:-91.9,r:5.3,h:22.8},{x:9.3,y:-585.4,r:5.5,h:18.9},{x:19.4,y:-582.6,r:6.4,h:22.6},{x:32.6,y:-585.3,r:5.8,h:17.1},{x:41.3,y:-583.4,r:6.4,h:17.2},{x:-71.4,y:-573.2,r:6.3,h:21.7},{x:-49.1,y:-575.1,r:6.3,h:19.3},{x:-41.5,y:-574.8,r:6.3,h:20.1},{x:-17.2,y:-575.1,r:5.4,h:20.6},{x:-8.1,y:-575,r:6,h:21.9},{x:5.2,y:-575.3,r:5.3,h:22.8},{x:15,y:-575.5,r:5.3,h:20.8},{x:24.8,y:-574.5,r:5.3,h:18.4},{x:36.6,y:-574.4,r:5.3,h:22.8},{x:-76.9,y:-562.8,r:5.4,h:21.6},{x:-67.7,y:-566.1,r:4.9,h:19.7},{x:-35.3,y:-565.6,r:5.1,h:23},{x:-24.1,y:-565.6,r:6.3,h:21.7}],
  wind:{dir:-3.1574,speed:8}, koi:true },
{ id:'f12', name:'花筏', par:3, gold:2, yards:155, seed:6084,
  tip:'小川越えの短いパー 3。浅いグリーンは右ほど遠い。風を読み切ろう。',
  tee:{x:0,y:0}, pin:{x:11,y:-154.6},
  bounds:{x0:-82,x1:92,y0:-216,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-70.8],[0,-124.6]],w:30}],
  green:{cx:2,cy:-152.6,rx:17,ry:5.5,rot:-.25},
  bunkers:[],
  bunkerLines:[{pts:[[5.1,-144.9,1.6],[2.6,-144.2,2],[-.2,-143.9,1.6]]},{pts:[[-5.8,-159.7,2.2],[-2.9,-161.1,2.8],[0,-162,2.2]]},{pts:[[4.7,-162.5,2.2],[8.5,-162.4,2.8],[13.9,-161.9,2.2]]}],
  water:[],
  waterLines:[[[-62,-129.6,4],[-25,-133.6,4.5],[5,-135.6,4.5],[35,-138.6,4.5],[62,-142.6,4]]],
  hills:[{x:0,y:-192.6,s:25,a:4}],
  slope:{gx:0,gy:-.012}, bumps:[],
  treeLines:[],
  trees:[{x:-51.1,y:-185.7,r:5.1,h:21.9},{x:-37.9,y:-184.2,r:6,h:20.6},{x:15.9,y:-184.5,r:6.1,h:19.6},{x:25.9,y:-183.2,r:5.5,h:22.7},{x:37,y:-183.4,r:5.9,h:20.1},{x:47.6,y:-185.5,r:6.1,h:18.3},{x:62.3,y:-185.3,r:5.6,h:22.4},{x:-44.1,y:-175,r:6.3,h:20.1},{x:-20.4,y:-176.1,r:5.1,h:22.5},{x:-11.3,y:-173.4,r:5.9,h:20},{x:.6,y:-174.1,r:5.6,h:17.1},{x:23.3,y:-176.5,r:5,h:21.2},{x:33.4,y:-175.1,r:4.9,h:17.7},{x:44.9,y:-173.4,r:6.4,h:19.5},{x:54.3,y:-174.8,r:5.9,h:22.2},{x:-46.8,y:-119.6,r:6,h:22.2},{x:-53,y:-110,r:5,h:23.1},{x:-47.9,y:-102.3,r:6.3,h:21.7},{x:-40.8,y:-94,r:6.3,h:24.1},{x:-40.8,y:-71.2,r:5,h:25.2},{x:-45.5,y:-64.6,r:6.1,h:22.6},{x:-35.3,y:-65,r:5.8,h:19.4},{x:-44.9,y:-43,r:5,h:20.2},{x:-52,y:-35.1,r:5.4,h:24.4},{x:-42.3,y:-35.9,r:6.2,h:21.2},{x:-34.6,y:-25.7,r:6.1,h:19.2},{x:-52.4,y:-16.6,r:5.5,h:22.1},{x:41.7,y:-117.5,r:6.4,h:22.6},{x:51.9,y:-116.5,r:6.3,h:22.2},{x:33.6,y:-89.1,r:5.2,h:22},{x:46.1,y:-89.1,r:6.1,h:24.9},{x:39.9,y:-80.3,r:5.3,h:22.6},{x:53.5,y:-81,r:5.8,h:24.2},{x:47.9,y:-69.7,r:5.4,h:24},{x:40.8,y:-60,r:4.9,h:18.9},{x:46.2,y:-48.6,r:5.2,h:23.8},{x:41,y:-39.8,r:5.6,h:25},{x:33.8,y:-30.9,r:5.2,h:20.7},{x:44.6,y:-30.4,r:5.8,h:25.2},{x:39,y:-22.9,r:5,h:19.9}],
  wind:{dir:.7854,speed:7}, koi:true },
{ id:'f13', name:'春の小川', par:5, gold:4, yards:545, seed:6091,
  tip:'左ドッグレッグ。左の小川に沿ってドローで回る。グリーンを狙うときは、手前の小川を越える。',
  tee:{x:0,y:0}, pin:{x:-111.8,y:-514.6},
  bounds:{x0:-192,x1:89,y0:-595,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:.044},
  fairways:[{pts:[[1.4,-30.5],[12.2,-274.4],[8.5,-281.7]],w:34},{pts:[[8.5,-281.7],[-90,-473.9]],w:32}],
  green:{cx:-109.8,cy:-512.6,rx:10,ry:16,rot:-2.044},
  bunkers:[],
  bunkerLines:[{pts:[[-127.4,-513.5,2.2],[-125.3,-517.3,2.8],[-122.7,-520.3,2.2]]},{pts:[[-121.2,-521.8,2.2],[-118.6,-523.8,2.8],[-115.8,-525.4,2.2]]},{pts:[[-114,-526.1,2.2],[-110.8,-527.1,2.8],[-107.4,-527.8,2.2]]},{pts:[[-105.2,-527.9,2.2],[-100.9,-527.6,2.8],[-96.4,-526.1,2.2]]}],
  water:[],
  waterLines:[[[-23.4,-13.2,3.5],[-20.7,-74.2,3.5],[-18,-135.1,3.5],[-15.3,-196,3.5],[-13.1,-244.7,3.5],[-11.8,-275.2,3.5],[-22.9,-290.3,3.5],[-50.7,-344.6,3.5],[-78.5,-398.8,3.5],[-105.8,-452.2,3.5],[-115.7,-471.4,3.5],[-115.4,-492.9,3.5],[-101.2,-500.2,3.5],[-86.5,-511,3.5]]],
  hills:[],
  slope:{gx:-.008,gy:-.016}, bumps:[],
  treeLines:[],
  trees:[{x:-44.3,y:-289.5,r:6.3,h:25.9},{x:-33.9,y:-291.4,r:5.5,h:24.1},{x:-52.8,y:-281.2,r:6,h:24.6},{x:-42,y:-279.9,r:6.1,h:25.7},{x:-30.5,y:-280.3,r:6.3,h:28.9},{x:-56,y:-269.3,r:5.7,h:25.2},{x:-44.7,y:-271.1,r:6.5,h:22.1},{x:-34.9,y:-272.9,r:6.3,h:24.3},{x:-24.7,y:-271.2,r:6.2,h:27.3},{x:-51.3,y:-262.7,r:6.2,h:29},{x:-38.7,y:-262.4,r:5.3,h:24.3},{x:-29.1,y:-262.7,r:5.3,h:22.3},{x:-17.6,y:-261.1,r:6.2,h:28.6},{x:-56.7,y:-250.4,r:5.7,h:24.8},{x:-44.6,y:-252.2,r:5.5,h:26.7},{x:-34.4,y:-250.3,r:5.1,h:27.5},{x:-24.5,y:-252.6,r:6,h:25.7},{x:-51.9,y:-242.2,r:5.6,h:27.3},{x:-41.2,y:-241,r:6.4,h:28.7},{x:-29.8,y:-242.3,r:6,h:25.2},{x:-55.2,y:-232.5,r:6.1,h:27.5},{x:-46,y:-232.3,r:5,h:28.7},{x:-34.4,y:-233.2,r:5.1,h:28.1},{x:-25.5,y:-231.8,r:6.2,h:28.1},{x:-49.3,y:-223.7,r:5.5,h:25.7},{x:-39.7,y:-222,r:6.3,h:26.9},{x:-29.6,y:-223.4,r:4.9,h:28.1},{x:-55.4,y:-215.4,r:6.5,h:23},{x:-44.7,y:-212.2,r:6.5,h:29.1},{x:-35.7,y:-214.5,r:5,h:22.8},{x:-25.5,y:-215.1,r:6.4,h:27.1},{x:-52.4,y:-202.7,r:6,h:29.8},{x:-39.3,y:-203.5,r:5.1,h:25.6},{x:-30,y:-206,r:5.3,h:27.8},{x:-54.9,y:-193.3,r:5.2,h:29.2},{x:-45.8,y:-193.9,r:6.3,h:27.3},{x:-35,y:-194.7,r:5.9,h:27.3},{x:-25.2,y:-193.3,r:5.4,h:24.1},{x:-51.5,y:-186.7,r:4.9,h:27.6},{x:-39.8,y:-186.3,r:5.8,h:23.9},{x:-29.4,y:-183.6,r:5.4,h:27.6},{x:-55.5,y:-173.7,r:5.1,h:26.6},{x:-45.2,y:-174.4,r:5.8,h:22.6},{x:-34.6,y:-175.1,r:5.9,h:29.3},{x:-24,y:-176.9,r:5.3,h:24.7},{x:-52.9,y:-165.5,r:5.6,h:25.4},{x:-41.3,y:-167,r:5.9,h:26.9},{x:-27.8,y:-164.8,r:5.3,h:29.6},{x:-55.8,y:-157.9,r:6.3,h:29.1},{x:-46.9,y:-157.9,r:5.8,h:27.8},{x:-34.5,y:-156.5,r:5.1,h:23},{x:-25,y:-157.1,r:6,h:23.8},{x:-51,y:-146.4,r:6.4,h:22.1},{x:-40.4,y:-148.2,r:5.3,h:25.5},{x:-27.5,y:-145.1,r:5.3,h:27.8},{x:-46.4,y:-136.1,r:6.4,h:23.1},{x:-33.3,y:-137.2,r:5.1,h:25},{x:-52.7,y:-127.7,r:6.4,h:27.6},{x:-38.4,y:-129.2,r:6.2,h:29.3},{x:-27.4,y:-128.1,r:6.2,h:29.6},{x:-56.6,y:-117.2,r:5,h:29.4},{x:-45,y:-117.2,r:5.7,h:28.2},{x:-35,y:-116.9,r:5.6,h:28.9},{x:-60.8,y:-109.1,r:5.7,h:28},{x:-51.6,y:-108.2,r:5.2,h:25.2},{x:-39.7,y:-107.3,r:6.3,h:26.2},{x:-30.5,y:-106.7,r:6.4,h:23.5},{x:-55.7,y:-100.5,r:5.3,h:29.1},{x:-43.9,y:-99.4,r:5.2,h:24.6},{x:-33.2,y:-97,r:6.3,h:27.5},{x:46.7,y:-255.6,r:5.4,h:22.9},{x:40.3,y:-245.3,r:6,h:23.9},{x:49.5,y:-244.2,r:4.9,h:24.7},{x:60.1,y:-244.7,r:5.3,h:25.3},{x:44.4,y:-234.5,r:5.2,h:21.1},{x:57.5,y:-235.7,r:5,h:26.5},{x:49,y:-226.7,r:6,h:24.1},{x:34.1,y:-214.1,r:5.1,h:26.9},{x:44.7,y:-217.4,r:6.2,h:23.6},{x:52.1,y:-204.2,r:6.2,h:26.4},{x:35.6,y:-197,r:5.7,h:25.9},{x:43.8,y:-195.8,r:5.7,h:26.4},{x:40.2,y:-188.3,r:4.9,h:21.3},{x:45.8,y:-177.1,r:5.8,h:24},{x:49.2,y:-168.6,r:6.4,h:24},{x:34.9,y:-157.2,r:5.4,h:23.6},{x:47.1,y:-157.4,r:4.9,h:22.6},{x:40.7,y:-148.6,r:6,h:24.3},{x:35.2,y:-137.5,r:5.9,h:27.2},{x:47,y:-138.5,r:5.9,h:22.5},{x:50.3,y:-130.2,r:5.1,h:21.2},{x:33,y:-121.1,r:6,h:20.6},{x:40.3,y:-110.1,r:5.7,h:27},{x:33,y:-100.2,r:5,h:27.4},{x:47.1,y:-102.3,r:5.7,h:24.6},{x:29.4,y:-92.8,r:5.4,h:27},{x:40.2,y:-90.3,r:5.9,h:22.1},{x:40.1,y:-72.9,r:5.4,h:24},{x:50.3,y:-73.9,r:5.1,h:20.9},{x:40.5,y:-54.8,r:4.8,h:21.5},{x:45.1,y:-42.9,r:6.2,h:23.5},{x:40.5,y:-33.3,r:5.8,h:22.4},{x:-9.8,y:-402.5,r:4.9,h:24.2},{x:.5,y:-404.3,r:5.3,h:26.4},{x:-16.9,y:-392.5,r:5.5,h:22.4},{x:-3.8,y:-394.5,r:6.5,h:24.8},{x:12.2,y:-366.1,r:5,h:23.5},{x:21.6,y:-363.3,r:6.2,h:26.4},{x:4.1,y:-356.4,r:6.4,h:27.3},{x:18.1,y:-355.1,r:5.4,h:24.8},{x:12.5,y:-347.2,r:4.8,h:25.1},{x:22.8,y:-344.8,r:5.6,h:25.5},{x:17,y:-336,r:5.6,h:20.9},{x:28.5,y:-338,r:4.8,h:26.4},{x:40.4,y:-336.9,r:5.2,h:22.1},{x:21.9,y:-326.3,r:5.1,h:25.8},{x:34.6,y:-328.5,r:6,h:24.1},{x:28.8,y:-316.8,r:6.3,h:21.7},{x:40.4,y:-316.2,r:6.5,h:27.5},{x:45.7,y:-308.1,r:5.8,h:24.4},{x:50.2,y:-297,r:5.4,h:22.5},{x:54.7,y:-290.2,r:6.4,h:24.5},{x:48.1,y:-278.6,r:4.9,h:21.3},{x:60,y:-279.3,r:5.1,h:24.9},{x:45.9,y:-268.8,r:5.1,h:25.2},{x:53.3,y:-268.2,r:6.3,h:23.1},{x:-118.7,y:-439.2,r:5.5,h:21.5},{x:-107.7,y:-437.7,r:5.5,h:24.9},{x:-114.4,y:-427.5,r:5.9,h:22.8},{x:-117,y:-416.7,r:6.1,h:22.5},{x:-107.6,y:-417.2,r:4.8,h:20.1},{x:-103.3,y:-406.8,r:5.7,h:20.9},{x:-106.2,y:-399.5,r:6.1,h:24.7},{x:-97.1,y:-400.3,r:5.8,h:22},{x:-86.3,y:-399.5,r:6.4,h:19.6},{x:-90.4,y:-389.2,r:5.6,h:22.7},{x:-97.3,y:-378.8,r:5.1,h:19.1},{x:-92.7,y:-371.3,r:6.4,h:25},{x:-80.6,y:-371.3,r:5.5,h:21},{x:-94.9,y:-362.5,r:5.5,h:20.5},{x:-85.1,y:-361,r:6.2,h:21.3},{x:-75.9,y:-361.7,r:5.8,h:21},{x:-70.4,y:-350.5,r:5.3,h:22.8},{x:-63.6,y:-341.8,r:6.2,h:19.9},{x:-70.6,y:-333.2,r:6.2,h:19.2},{x:-58.6,y:-331.4,r:6.2,h:19.6},{x:-75.1,y:-323.2,r:5.4,h:24.5},{x:-62.7,y:-320.6,r:5.9,h:23.3},{x:-68.1,y:-312.6,r:5,h:21.3},{x:-59.6,y:-314.1,r:6.3,h:22.2},{x:-48.1,y:-314,r:4.8,h:21.4},{x:-54.3,y:-303.3,r:6.1,h:24},{x:-59,y:-294.8,r:5.4,h:19.7},{x:-96.7,y:-565.3,r:5.6,h:17.6},{x:-86.4,y:-562.7,r:5.2,h:20.5},{x:-75.9,y:-562.2,r:6,h:19.6},{x:-90.6,y:-553.6,r:5,h:17.4},{x:-82,y:-553.1,r:5.7,h:15.9},{x:-109.9,y:-543.8,r:5.8,h:17.8},{x:-95.4,y:-545.9,r:6,h:16.2},{x:-134.9,y:-533.7,r:5.7,h:15.9},{x:-114.8,y:-534.7,r:5.8,h:18.8},{x:-163,y:-524,r:5.2,h:17.8},{x:-141.7,y:-523.6,r:5.9,h:19.9},{x:-155.8,y:-517.4,r:5.1,h:20},{x:-153.8,y:-507.6,r:6.1,h:17}],
  tiers:[{x:-109.8,y:-512.6,nx:-.456,ny:-.89,h:.6}],
  wind:{dir:-.211,speed:8}, koi:true },
{ id:'f14', name:'青き踏む', par:4, gold:3, yards:440, seed:6098,
  tip:'バンカーは無い。グリーンの手前は大きく落ち、中は波打つ。右へ押す横風で、どこに止めるか。',
  tee:{x:0,y:0}, pin:{x:-27.1,y:-436.3},
  bounds:{x0:-105,x1:84,y0:-504,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:.022},
  fairways:[{pts:[[.7,-31.1],[6.2,-286],[-18.8,-416.1]],w:36}],
  green:{cx:-22.1,cy:-433.3,rx:13,ry:16,rot:-1.761},
  bunkers:[],
  water:[],
  hills:[{x:-22.1,y:-433.3,s:24,a:3}],
  slope:{gx:-.016,gy:-.017}, bumps:[{x:-27.4,y:-434.3,s:4,a:.35},{x:-15.8,y:-432.5,s:3.5,a:-.3}],
  treeLines:[],
  trees:[{x:-56.6,y:-411.1,r:6.1,h:21.6},{x:-54.1,y:-393.4,r:5.7,h:25.6},{x:-44.8,y:-393.6,r:5,h:23.1},{x:-48.7,y:-384.1,r:5.5,h:21.4},{x:-45.9,y:-371.9,r:5.7,h:27.2},{x:-48.8,y:-364.9,r:6.3,h:25.1},{x:-32.2,y:-354,r:5.7,h:23.9},{x:-50.5,y:-345.9,r:5.7,h:27.2},{x:-40.9,y:-345.9,r:6.4,h:25.4},{x:-46.2,y:-336.8,r:5.3,h:21.4},{x:-40.8,y:-327.2,r:5.9,h:21.3},{x:-44.5,y:-317,r:5.7,h:25.9},{x:-35.5,y:-316,r:6.2,h:25.8},{x:-40.5,y:-304.9,r:5.4,h:25.2},{x:-34.6,y:-295.1,r:6.1,h:22},{x:-24.5,y:-295.3,r:5,h:27.6},{x:-41.2,y:-286.6,r:5.7,h:27},{x:-29.1,y:-286.2,r:5.7,h:20.6},{x:-35.3,y:-278.3,r:4.9,h:27.2},{x:-28.6,y:-269.3,r:4.9,h:23.3},{x:-33.9,y:-258,r:5.3,h:23.6},{x:-24.7,y:-259.4,r:5.2,h:25.8},{x:-38.1,y:-250.1,r:5.4,h:25},{x:-27.9,y:-250.5,r:5.9,h:23.1},{x:-35.4,y:-241,r:5.2,h:20.7},{x:-40.1,y:-230,r:5.6,h:24.6},{x:-27.4,y:-231.3,r:6.2,h:24.1},{x:-19,y:-231.4,r:5.3,h:26.4},{x:-33.6,y:-218.6,r:6,h:22.6},{x:-37.6,y:-212.1,r:6.3,h:22.6},{x:-28.8,y:-209.5,r:5.6,h:20.6},{x:-34.9,y:-201.8,r:4.8,h:23.4},{x:-29.5,y:-193.2,r:5.9,h:27.5},{x:-35.2,y:-183.1,r:6,h:26.1},{x:-27.5,y:-171.1,r:5.6,h:24.9},{x:-35.7,y:-163.6,r:5.4,h:20.4},{x:-37.7,y:-152,r:5.9,h:24.3},{x:-29.2,y:-154.4,r:6.3,h:27.3},{x:-43,y:-144.7,r:5.9,h:22},{x:-29.3,y:-133.9,r:5.3,h:21.3},{x:-43.7,y:-126.1,r:6.1,h:22.6},{x:-33.2,y:-122.8,r:6.2,h:25.3},{x:-24.1,y:-123,r:5.9,h:21.8},{x:-43.1,y:-103.5,r:5.8,h:27.1},{x:-34,y:-104.9,r:6,h:23.9},{x:-38,y:-96.6,r:5.6,h:21.6},{x:-27.3,y:-95.2,r:5.7,h:26.3},{x:-45.9,y:-84.8,r:5.3,h:24},{x:-35.1,y:-87.1,r:4.8,h:24.9},{x:-39.2,y:-76.5,r:6.1,h:23.5},{x:-30,y:-77,r:5.7,h:26.9},{x:-32.1,y:-65.8,r:5.7,h:27.5},{x:-23,y:-66.4,r:6.2,h:25.9},{x:-38.5,y:-58.6,r:4.9,h:23.8},{x:-46.3,y:-46.9,r:6.1,h:24.7},{x:-32.8,y:-46.9,r:5.8,h:24.7},{x:-39,y:-38.8,r:5.2,h:20.5},{x:-27.4,y:-40.2,r:5.2,h:23.8},{x:15.1,y:-422.9,r:5.5,h:22.7},{x:21.9,y:-411.5,r:5.3,h:26.4},{x:23.9,y:-400.2,r:6.5,h:25.8},{x:20.1,y:-393.6,r:5.6,h:21.7},{x:30.4,y:-390.8,r:5.2,h:21.6},{x:14.7,y:-384.1,r:5.1,h:26},{x:24.5,y:-383.1,r:5.4,h:25},{x:21.8,y:-372.7,r:5.9,h:26.1},{x:30,y:-372.3,r:5.5,h:25},{x:16.5,y:-365.5,r:4.8,h:21.9},{x:25.4,y:-362,r:6.1,h:21},{x:20.3,y:-352.4,r:6,h:26.7},{x:33,y:-352.4,r:5.4,h:24},{x:25.2,y:-346.4,r:5.8,h:22.2},{x:35.4,y:-342.7,r:5.2,h:27.6},{x:40.6,y:-335.4,r:5.8,h:25.8},{x:37.3,y:-326.2,r:5.2,h:22.3},{x:31.8,y:-315,r:6.1,h:21.5},{x:40.4,y:-315.3,r:5.2,h:25},{x:27,y:-306.6,r:6,h:26.1},{x:36.1,y:-307.5,r:6,h:24.5},{x:46,y:-304.5,r:6.1,h:24.1},{x:42.4,y:-296.8,r:6,h:24.1},{x:37.5,y:-287.5,r:6,h:27.3},{x:29.8,y:-278.4,r:5.1,h:20.6},{x:43.8,y:-276.2,r:5.8,h:25},{x:35.4,y:-267.7,r:5.6,h:27.5},{x:49.5,y:-266.2,r:5.7,h:21.2},{x:42.4,y:-260,r:5.6,h:22.4},{x:36.1,y:-249.3,r:5.8,h:22.7},{x:44,y:-240.8,r:6.2,h:22.4},{x:32.6,y:-219.4,r:5.6,h:24.9},{x:42.9,y:-221.3,r:5.4,h:23.6},{x:35.2,y:-211.2,r:5.8,h:24.9},{x:32.6,y:-201.9,r:5.9,h:24.8},{x:41.9,y:-202,r:4.9,h:27.5},{x:53.4,y:-199.5,r:6.5,h:22.2},{x:37.3,y:-192.5,r:5.2,h:25.7},{x:46.3,y:-190.5,r:5.1,h:24.9},{x:32.2,y:-181.4,r:6.2,h:26.5},{x:42.1,y:-180.3,r:6.1,h:23.1},{x:38,y:-173.4,r:5.8,h:26.9},{x:35,y:-152.9,r:6,h:25.8},{x:30.3,y:-142.6,r:5.8,h:22.6},{x:43.2,y:-142.6,r:5.3,h:20.9},{x:38,y:-132.5,r:6.4,h:23.1},{x:48.5,y:-133.3,r:6.2,h:24.2},{x:30.8,y:-125.1,r:5.1,h:27.2},{x:41.3,y:-125.1,r:5.8,h:22.4},{x:38.5,y:-115.6,r:5.8,h:26.1},{x:45.9,y:-113.4,r:5.2,h:21.7},{x:41.2,y:-107,r:5.9,h:27.5},{x:37.2,y:-95.5,r:5.6,h:23.5},{x:43.2,y:-84.5,r:5.1,h:26.3},{x:23.7,y:-75.8,r:4.8,h:27.5},{x:35.7,y:-77.3,r:6.4,h:22.3},{x:41.7,y:-68.8,r:5.5,h:21.1},{x:38.1,y:-58.2,r:5.2,h:25},{x:42.9,y:-49.4,r:4.9,h:27.4},{x:27,y:-37.9,r:5.5,h:24.6},{x:38.3,y:-36.3,r:4.8,h:27.4},{x:42.3,y:-27.8,r:6.1,h:25.4},{x:48.7,y:-18.8,r:4.9,h:26},{x:2.7,y:-474.3,r:5.8,h:19},{x:-36.6,y:-466,r:5.6,h:18.6},{x:-25.9,y:-463.9,r:5.2,h:16.5},{x:-15.8,y:-464,r:5,h:19.4},{x:-1.6,y:-464,r:4.9,h:20.3},{x:8.4,y:-464.6,r:5.6,h:16.9},{x:17.8,y:-467,r:5.3,h:15.6},{x:-74.7,y:-456.1,r:6,h:17.3},{x:-63.6,y:-454.2,r:5.8,h:18.5},{x:-50.8,y:-454.2,r:5.6,h:16},{x:-40.9,y:-456.8,r:6.4,h:20.3},{x:-31.1,y:-456.8,r:5.2,h:15.8},{x:2.6,y:-457.5,r:5.3,h:16.2}],
  tiers:[{x:-20.8,y:-426.4,nx:-.189,ny:-.982,h:.7}],
  wind:{dir:-.051,speed:8}, koi:false },
{ id:'f15', name:'蛙', par:5, gold:4, yards:550, seed:6105,
  tip:'グリーンのすぐ手前は池。越えるか、刻むか。奥へこぼすと下の池。',
  tee:{x:0,y:0}, pin:{x:10.8,y:-549.2},
  bounds:{x0:-88,x1:96,y0:-662,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:-.018},
  fairways:[{pts:[[-.5,-30.5],[-6.1,-342.1],[6.4,-516.8]],w:36}],
  green:{cx:8.8,cy:-551.2,rx:11,ry:14,rot:-1.5},
  bunkers:[],
  bunkerLines:[{pts:[[24.5,-559.5,2.7],[27.4,-553.3,3.4],[26.9,-546.4,3.4],[23.2,-540.7,2.7]]}],
  water:[{cx:7.1,cy:-527.3,rx:9,ry:28,rot:-1.5},{cx:-24.7,cy:-587.7,rx:25,ry:20,rot:-1.5}],
  hills:[{x:-5.9,y:-287.2,s:45,a:2.5},{x:-9.6,y:-574.6,s:15,a:-1.5}],
  slope:{gx:.002,gy:-.022}, bumps:[],
  treeLines:[],
  trees:[{x:-35.8,y:-524.8,r:5.7,h:22.8},{x:-23.7,y:-526.6,r:5.5,h:24.5},{x:-28.4,y:-515.4,r:5.3,h:26.8},{x:-24,y:-507.6,r:5.3,h:27.5},{x:-29.1,y:-496.9,r:5.9,h:24.2},{x:-36.4,y:-487.6,r:5.4,h:26.6},{x:-39.8,y:-478,r:5.5,h:21.8},{x:-32,y:-477.4,r:4.9,h:22.2},{x:-29.5,y:-460.9,r:5.9,h:26.9},{x:-35.9,y:-450.6,r:5.6,h:22.5},{x:-34.2,y:-431.2,r:5.8,h:26.6},{x:-29.8,y:-422.1,r:6.2,h:25.1},{x:-47.8,y:-412.3,r:6.4,h:26.6},{x:-34.5,y:-409.8,r:5,h:24.4},{x:-42.9,y:-402.7,r:5.5,h:24.2},{x:-53.1,y:-381.2,r:5.1,h:21.7},{x:-43,y:-381.3,r:4.9,h:25.6},{x:-48.1,y:-374.1,r:6,h:21.9},{x:-35.2,y:-373.5,r:5.3,h:25.4},{x:-42,y:-363.9,r:6.3,h:22.7},{x:-31.1,y:-362.8,r:4.9,h:21.4},{x:-48,y:-354.7,r:5.3,h:25.7},{x:-33.7,y:-352.4,r:6.2,h:23.8},{x:-51.5,y:-344.2,r:5,h:21.8},{x:-41,y:-346,r:5.4,h:27},{x:-41.7,y:-325.3,r:5.5,h:25.9},{x:-45.4,y:-316.5,r:5.6,h:25.7},{x:-50.9,y:-304.6,r:5.1,h:21.3},{x:-43.1,y:-304.7,r:6.3,h:23.6},{x:-46,y:-297.8,r:6.3,h:27.3},{x:-52.3,y:-288.4,r:5.9,h:23.2},{x:-42.1,y:-269.4,r:6,h:24.8},{x:-28.6,y:-267.3,r:5.4,h:23.5},{x:-47.8,y:-258.3,r:5.6,h:25.9},{x:-34.5,y:-258.6,r:5.6,h:24.7},{x:-51.3,y:-250.1,r:5.7,h:26.8},{x:-41.4,y:-250.3,r:5.3,h:26},{x:-36.2,y:-237.4,r:5.9,h:21.6},{x:-41,y:-230.8,r:5.4,h:26.5},{x:-41,y:-210,r:5.4,h:24.7},{x:-48.5,y:-202.4,r:5,h:25.3},{x:-41.5,y:-191,r:5.7,h:26.6},{x:-44.7,y:-181.1,r:4.9,h:22.8},{x:-35,y:-181.1,r:5.7,h:22.5},{x:-50.8,y:-173,r:5,h:23.1},{x:-39.4,y:-170.7,r:5.4,h:25},{x:-40.9,y:-153.8,r:5,h:21.3},{x:34.4,y:-511.8,r:6.5,h:22.4},{x:43.6,y:-511.3,r:6.2,h:21.5},{x:40.4,y:-501.2,r:6.1,h:22.7},{x:46.2,y:-494.4,r:5.9,h:23.2},{x:29.9,y:-484.1,r:6.5,h:24.2},{x:41.1,y:-483.6,r:5.8,h:24.2},{x:33.8,y:-475.4,r:5.3,h:23.7},{x:43.7,y:-475.3,r:4.9,h:22.6},{x:36.3,y:-453.4,r:6.2,h:24.9},{x:43.8,y:-454.6,r:5.6,h:23.5},{x:41.7,y:-443.4,r:6.4,h:22.3},{x:36.4,y:-435.8,r:4.9,h:22.9},{x:45.1,y:-434.8,r:4.9,h:23.5},{x:29.6,y:-426.2,r:6.1,h:22.7},{x:39,y:-425.9,r:4.8,h:23.3},{x:34.6,y:-414.6,r:5.9,h:22.7},{x:29,y:-406.9,r:5.1,h:22.1},{x:41.2,y:-407.2,r:6.4,h:24.5},{x:33.5,y:-399.1,r:4.9,h:25.4},{x:29.6,y:-386.8,r:5.9,h:20.6},{x:41.3,y:-386,r:6.4,h:20.8},{x:29.3,y:-370.1,r:5.7,h:22.8},{x:33.1,y:-357.4,r:5.6,h:25.2},{x:28.6,y:-349.8,r:6.2,h:22.7},{x:23.3,y:-340.6,r:5.9,h:26.3},{x:32.9,y:-340.3,r:4.8,h:20.5},{x:29.9,y:-331.8,r:5.9,h:23.7},{x:38.3,y:-328.8,r:4.9,h:26.3},{x:34,y:-322.4,r:5.8,h:22.3},{x:30.3,y:-310,r:6.4,h:22.3},{x:34.4,y:-300.2,r:5.3,h:25},{x:45.3,y:-300.8,r:6.1,h:21.2},{x:34,y:-283.9,r:5.4,h:22.2},{x:28.3,y:-272.2,r:6.4,h:25.4},{x:34.1,y:-263.7,r:6.4,h:21.5},{x:27.9,y:-254.6,r:6.1,h:25.8},{x:38.3,y:-255.3,r:5.1,h:25.2},{x:23.7,y:-245.1,r:6.4,h:22.7},{x:29.2,y:-235.6,r:5.3,h:26.2},{x:41,y:-234.2,r:4.9,h:27.6},{x:24,y:-225.6,r:5,h:26.2},{x:33.9,y:-223.6,r:6.2,h:22.6},{x:29.2,y:-215.3,r:5.3,h:24.4},{x:41.1,y:-215.5,r:6.1,h:24},{x:35.5,y:-205.3,r:6,h:24.3},{x:44.8,y:-205.9,r:6.2,h:23.8},{x:27.9,y:-198,r:5.6,h:26.2},{x:39.3,y:-196.2,r:5.7,h:26.8},{x:24.4,y:-185,r:6,h:20.9},{x:34.2,y:-185.5,r:5.1,h:24.4},{x:27.4,y:-177.6,r:6.4,h:22.3},{x:41.1,y:-176,r:5.1,h:20.7},{x:33.7,y:-168.7,r:5.9,h:26.3},{x:47.1,y:-169.3,r:5.7,h:26.9},{x:28.7,y:-157.3,r:5.8,h:26.7},{x:40.2,y:-158.1,r:5.1,h:24.5},{x:33.1,y:-149.9,r:5.9,h:25},{x:46.6,y:-149.5,r:6,h:23.2},{x:27.2,y:-137.3,r:5.2,h:20.8},{x:39.1,y:-138.6,r:6.5,h:24.5},{x:33.9,y:-130.9,r:5.2,h:23},{x:45.8,y:-127.5,r:5.7,h:21},{x:29.6,y:-119.7,r:5.5,h:22.9},{x:33.5,y:-109.5,r:6.2,h:22.4},{x:30,y:-100.3,r:6.2,h:21.5},{x:41.6,y:-99.7,r:6.4,h:27.2},{x:32.8,y:-90.3,r:4.8,h:22.4},{x:28.8,y:-81.2,r:5.6,h:22.9},{x:25.3,y:-73.1,r:6,h:24.7},{x:32.8,y:-72,r:4.9,h:25.6},{x:27.6,y:-62.6,r:6.1,h:21.1},{x:40.6,y:-60.9,r:5.9,h:27.3},{x:34.9,y:-53.3,r:5.4,h:27.2},{x:38.1,y:-42.4,r:5.3,h:21.1},{x:33.5,y:-33.9,r:6,h:24.5},{x:-36.1,y:-137,r:6.3,h:19.4},{x:-51.1,y:-128.8,r:6.4,h:24.2},{x:-43,y:-126.7,r:6,h:24.5},{x:-31.8,y:-127,r:6,h:23.2},{x:-46.1,y:-118.5,r:5.9,h:20.9},{x:-36.7,y:-117.4,r:5.3,h:21},{x:-40.1,y:-108.5,r:5.6,h:23.7},{x:-48,y:-100.7,r:6.5,h:21.9},{x:-52.7,y:-90.2,r:5.2,h:24.2},{x:-42,y:-91.1,r:5.5,h:21.6},{x:-41.2,y:-68.9,r:6.2,h:22},{x:-35,y:-62,r:6.2,h:22.8},{x:-40.1,y:-49.6,r:5.3,h:19.1},{x:-30.3,y:-52,r:6.2,h:21.1},{x:-36.6,y:-40.9,r:5.7,h:24.8},{x:-41.8,y:-33.2,r:5.3,h:21.8},{x:-35.5,y:-21.8,r:6.3,h:21.7},{x:16.3,y:-607.8,r:6.1,h:15.7},{x:28.3,y:-608.8,r:5.3,h:19.5},{x:36.7,y:-608,r:5.4,h:17.4},{x:66.7,y:-608.4,r:5.7,h:16.5},{x:21.7,y:-599.2,r:5.3,h:18.4},{x:40.4,y:-600.9,r:6.4,h:16.2},{x:52.1,y:-598.6,r:6.1,h:16.8},{x:37.7,y:-590.7,r:6.2,h:16.9},{x:45.5,y:-590.2,r:5.7,h:15.3},{x:55.6,y:-592.3,r:5.1,h:17.8},{x:40.7,y:-581.9,r:5.2,h:18.3},{x:52.2,y:-581,r:5.2,h:18.7},{x:38.4,y:-573.6,r:6,h:20.1},{x:45.8,y:-573.4,r:5.4,h:15.4},{x:57.7,y:-574.3,r:5,h:18},{x:-43.6,y:-631.6,r:6.2,h:18.9},{x:-58.7,y:-624.9,r:5.6,h:19.8},{x:-40.7,y:-622.2,r:6.1,h:19.4},{x:-21,y:-624.2,r:5.6,h:17.3},{x:-11.1,y:-625,r:5.7,h:19.8},{x:-45.2,y:-613.5,r:5,h:20.6},{x:-34.7,y:-615.8,r:6.1,h:18.2},{x:-24.6,y:-616.1,r:5.1,h:17.4},{x:-5.1,y:-614.8,r:4.9,h:17.2},{x:4.3,y:-614.5,r:5.8,h:19.6}],
  wind:{dir:.6268,speed:7}, koi:true },
{ id:'f16', name:'朧月', par:3, gold:2, yards:170, seed:6112,
  tip:'池越え。グリーンは左の池へ強く傾く。左へ押す風で池へ流される。',
  tee:{x:0,y:0}, pin:{x:16.5,y:-169.2},
  bounds:{x0:-48,x1:99,y0:-231,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:.123},
  fairways:[],
  green:{cx:20.5,cy:-165.2,rx:12,ry:15,rot:-1.447},
  bunkers:[],
  bunkerLines:[{pts:[[32.8,-177.5,2.6],[37.6,-172.4,3.2],[39.9,-165.5,2.6]]},{pts:[[39.3,-160.1,2.6],[34.1,-152.9,3.2],[26.6,-149.3,2.6]]}],
  water:[{cx:-12.3,cy:-98.5,rx:34,ry:68,rot:.15},{cx:-9.6,cy:-165.9,rx:22,ry:14,rot:-1.447}],
  hills:[],
  slope:{gx:.03,gy:0}, bumps:[],
  treeLines:[],
  trees:[{x:67.1,y:-162.4,r:5.3,h:24.6},{x:52.7,y:-156,r:6.3,h:24.8},{x:64.4,y:-154.8,r:4.9,h:22.9},{x:45,y:-143.6,r:5.6,h:22.9},{x:56.5,y:-146.8,r:5,h:20.4},{x:69.3,y:-144.5,r:6.1,h:19.7},{x:51.6,y:-134.6,r:6,h:23.4},{x:63.2,y:-137.3,r:5.9,h:23.5},{x:58,y:-124.7,r:5,h:19.9},{x:61.5,y:-115.4,r:6,h:19.3},{x:45.1,y:-106,r:6.4,h:22.6},{x:58.6,y:-106.1,r:5.7,h:22.8},{x:53.5,y:-95.9,r:6.2,h:21.2},{x:47,y:-86.5,r:4.8,h:24.3},{x:57.8,y:-89.1,r:5.2,h:20.4},{x:52.5,y:-77.2,r:5.5,h:18.9},{x:47.2,y:-66.6,r:5.3,h:24.5},{x:40.8,y:-60.2,r:5.7,h:18.8},{x:53.1,y:-59.8,r:4.9,h:18.7},{x:46.9,y:-48.8,r:4.9,h:18.8},{x:57.4,y:-47.7,r:4.9,h:22.1},{x:42.7,y:-38.7,r:5.9,h:23.8},{x:35.1,y:-29.5,r:5.9,h:18.9},{x:46.4,y:-29.2,r:5.1,h:25.2},{x:42.9,y:-19.9,r:6,h:22.8},{x:51.3,y:-22.4,r:6.2,h:20.8},{x:34,y:-11.6,r:5.5,h:22.9},{x:-13.1,y:-202.1,r:4.9,h:17.3},{x:-.9,y:-199.1,r:6.3,h:18},{x:6.7,y:-201.2,r:5.3,h:18.3},{x:53.4,y:-199.7,r:5.1,h:19.4},{x:-19.1,y:-191.5,r:5.2,h:18.7},{x:2.3,y:-192,r:6,h:16.7},{x:12.5,y:-192,r:5.2,h:16.7},{x:25.3,y:-189.4,r:6.1,h:17.4},{x:36.6,y:-191.2,r:6.3,h:15.4},{x:48.2,y:-191.6,r:5.9,h:17.3},{x:58.7,y:-189.1,r:5.9,h:17},{x:67.2,y:-192,r:5.7,h:19.4},{x:28.7,y:-182.2,r:5.3,h:17.7},{x:52.2,y:-179.5,r:6.2,h:16.3},{x:61.6,y:-182.5,r:6.4,h:20.7}],
  tiers:[{x:23.5,y:-164.8,nx:.992,ny:.123,h:.5}],
  wind:{dir:-3.0181,speed:9}, koi:true },
{ id:'f17', name:'風光る', par:4, gold:3, yards:450, seed:6119,
  tip:'ほぼまっすぐな上り。グリーンの手前の 2 つのバンカーの間を、向かい風に負けずに。',
  tee:{x:0,y:0}, pin:{x:-9,y:-449.4},
  bounds:{x0:-88,x1:84,y0:-513,y1:24},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:.012},
  fairways:[{pts:[[.4,-31.7],[3.8,-304],[-9.4,-430.8]],w:34}],
  green:{cx:-11,cy:-446.4,rx:12,ry:14,rot:-1.674},
  bunkers:[],
  bunkerLines:[{pts:[[-12.8,-429.8,2.7],[-18.8,-431.1,3.4],[-24.3,-434.5,2.7]]},{pts:[[3.6,-436.6,2.6],[-.8,-432.8,3.2],[-5.9,-430.6,2.6]]}],
  water:[],
  hills:[{x:-5.8,y:-380,s:60,a:2}],
  slope:{gx:-.002,gy:-.02}, bumps:[],
  treeLines:[],
  trees:[{x:-47.4,y:-433.5,r:4.9,h:23.6},{x:-54.3,y:-426.1,r:6.1,h:23.8},{x:-43.2,y:-425.3,r:5.4,h:24},{x:-58.9,y:-415.6,r:4.9,h:25.2},{x:-49.7,y:-414.3,r:5.2,h:20.6},{x:-53,y:-408.3,r:5.1,h:24.3},{x:-41.7,y:-405.4,r:5.6,h:22.7},{x:-50,y:-398.2,r:5.6,h:24.2},{x:-39.3,y:-395.2,r:5.3,h:21},{x:-33.7,y:-389.3,r:4.9,h:20.4},{x:-36.7,y:-378.5,r:5,h:26.2},{x:-44.5,y:-369.9,r:5.9,h:23.7},{x:-42.6,y:-351.1,r:6.3,h:23.4},{x:-36.2,y:-339.8,r:6.3,h:21.5},{x:-26.4,y:-340.9,r:5.3,h:21.3},{x:-43,y:-329.3,r:5.2,h:26.4},{x:-33.1,y:-328.9,r:5.5,h:25.4},{x:-47.4,y:-320.7,r:4.9,h:24.4},{x:-28.5,y:-319.8,r:6.3,h:20.7},{x:-32.6,y:-310,r:5.4,h:23.3},{x:-25.7,y:-299.8,r:5.8,h:21.7},{x:-33.6,y:-291.3,r:5.3,h:24.7},{x:-21.9,y:-292,r:4.9,h:27.6},{x:-37.9,y:-282.2,r:5,h:25.7},{x:-25.1,y:-282.6,r:5.3,h:26.5},{x:-33.1,y:-271.1,r:6.3,h:21.3},{x:-36.3,y:-263.2,r:6.3,h:25.3},{x:-39.7,y:-243.6,r:6.1,h:24.4},{x:-28.2,y:-243.2,r:4.9,h:21.7},{x:-34.4,y:-235.6,r:6.1,h:24.9},{x:-22,y:-234.8,r:6.2,h:22.8},{x:-28.9,y:-223.6,r:5.2,h:24.7},{x:-42,y:-215.3,r:6.5,h:23.8},{x:-31.6,y:-215.5,r:6.4,h:24.8},{x:-39.1,y:-206.9,r:5.3,h:24.8},{x:-25.6,y:-205.6,r:4.8,h:22.3},{x:-37.4,y:-186.9,r:5.1,h:20.5},{x:-27.7,y:-186.9,r:5.1,h:25.6},{x:-45.3,y:-176,r:6.3,h:25.5},{x:-32.1,y:-175.9,r:5.4,h:20.8},{x:-31.2,y:-158.6,r:5.3,h:26.5},{x:-39.5,y:-149.7,r:5.5,h:23.6},{x:-26.9,y:-148.2,r:5.3,h:25.7},{x:-36.4,y:-128.7,r:5.8,h:21.5},{x:-28.5,y:-127.3,r:5.5,h:22.9},{x:-32.6,y:-120.8,r:5.2,h:25.4},{x:-47.5,y:-109.2,r:5.4,h:26.5},{x:-36.5,y:-108.4,r:5.9,h:26.9},{x:-43.9,y:-102.2,r:5.9,h:24.2},{x:-34,y:-102.3,r:4.9,h:26.8},{x:-36.3,y:-91.6,r:5.5,h:24.8},{x:-43.6,y:-79.7,r:5.1,h:21.1},{x:-33.2,y:-80.1,r:5.5,h:25.9},{x:-36.5,y:-73.2,r:6.1,h:23.5},{x:-33.2,y:-63.1,r:6.3,h:23.3},{x:-37.3,y:-50.9,r:6,h:24.7},{x:-32.2,y:-42,r:5.2,h:22.6},{x:-39,y:-33.7,r:6.2,h:25.6},{x:-27.5,y:-31.7,r:6,h:27.4},{x:24.6,y:-440.5,r:5.7,h:26.8},{x:19.7,y:-431.1,r:5.7,h:21.5},{x:32.9,y:-434.2,r:6.3,h:22},{x:25.2,y:-423.6,r:6.2,h:23.4},{x:32.2,y:-411.5,r:5.9,h:21},{x:34.7,y:-404.8,r:6.4,h:23},{x:21.5,y:-392.7,r:5.1,h:23.8},{x:30,y:-394,r:5,h:22.6},{x:25.9,y:-383.2,r:5.5,h:23.1},{x:35.1,y:-383.4,r:6,h:20.8},{x:30,y:-376.2,r:6.2,h:22.6},{x:43.9,y:-374,r:5.7,h:22.2},{x:26.8,y:-364.2,r:6.1,h:22.2},{x:37.4,y:-366,r:5.8,h:27.1},{x:32.6,y:-357.2,r:5.7,h:21.8},{x:35.2,y:-345.2,r:5.4,h:24.6},{x:29.9,y:-338,r:5.2,h:27},{x:43.1,y:-337.7,r:5.7,h:24.1},{x:37.1,y:-326.8,r:5.1,h:25.2},{x:32.3,y:-319,r:5.8,h:22},{x:44,y:-318.9,r:6.3,h:26.2},{x:36.8,y:-309.8,r:5,h:20.9},{x:42.1,y:-297.9,r:5.2,h:26.1},{x:38.2,y:-289.9,r:5.6,h:25.2},{x:47.5,y:-290.2,r:4.9,h:22.7},{x:41.2,y:-279.4,r:6.3,h:21.2},{x:35.6,y:-269,r:5.2,h:26.6},{x:29.7,y:-259.3,r:6.4,h:24.6},{x:37,y:-250.8,r:4.8,h:22.6},{x:40.8,y:-240.9,r:5.1,h:26.2},{x:38.1,y:-231.1,r:5.8,h:22.1},{x:47.9,y:-232.1,r:5.2,h:24},{x:32.5,y:-223.7,r:6.4,h:26.7},{x:40.6,y:-220.9,r:6.3,h:24.9},{x:35.3,y:-213.4,r:6,h:23.4},{x:31.9,y:-204.4,r:5.5,h:26},{x:42.8,y:-202.1,r:6.2,h:26},{x:53.8,y:-204.1,r:6,h:20.9},{x:46.7,y:-193.4,r:6.5,h:21.9},{x:42.9,y:-184.7,r:6.2,h:22.4},{x:36.9,y:-175.6,r:6.3,h:22.3},{x:31.9,y:-166,r:5.9,h:24.6},{x:42.1,y:-163.5,r:5.2,h:23.4},{x:48,y:-154.1,r:5,h:21.8},{x:40.3,y:-146.6,r:5.8,h:23},{x:34.7,y:-135,r:5.9,h:20.7},{x:42.5,y:-125.1,r:5.8,h:25.4},{x:37.6,y:-115.3,r:5.4,h:21.5},{x:47.3,y:-115.9,r:5.1,h:21.6},{x:32.8,y:-105.7,r:4.9,h:20.5},{x:40.9,y:-108,r:5.8,h:26.7},{x:36,y:-95.5,r:5.9,h:26.9},{x:30,y:-86.5,r:5.4,h:25.5},{x:42.4,y:-88.2,r:5.6,h:26},{x:26.3,y:-79.4,r:4.8,h:27.2},{x:36.1,y:-77.6,r:6.1,h:20.5},{x:46.5,y:-77.2,r:5.7,h:26.7},{x:29.8,y:-66.8,r:5.8,h:27.2},{x:41.1,y:-68,r:5.8,h:26},{x:37.4,y:-60.2,r:5.8,h:22.5},{x:46,y:-59.1,r:5.9,h:27.4},{x:32.1,y:-47.6,r:5.8,h:25.6},{x:43.1,y:-48.3,r:5,h:26.7},{x:38.3,y:-41,r:5.6,h:23.6},{x:31.4,y:-30.4,r:5,h:24.3},{x:43.4,y:-28.8,r:5.4,h:22.9},{x:36.2,y:-20.6,r:6.3,h:25.5},{x:-48.7,y:-481.5,r:4.8,h:17.2},{x:-37.8,y:-482,r:5.9,h:18.1},{x:-24.1,y:-482.3,r:6.1,h:17.8},{x:6,y:-482.9,r:6,h:17.5},{x:16.8,y:-480.6,r:5,h:17.9},{x:29.4,y:-482.1,r:5.7,h:20.5},{x:-52.6,y:-474.4,r:5.4,h:20.3},{x:-41.9,y:-472,r:5.9,h:16.7},{x:-31.5,y:-474.5,r:4.8,h:17},{x:-21.3,y:-473.7,r:5.8,h:19.4},{x:13.2,y:-471.6,r:5,h:19.5},{x:24.1,y:-471.3,r:5,h:17.7},{x:-48.3,y:-465,r:5.2,h:15.8},{x:-15.6,y:-465.3,r:5.8,h:15.9}],
  wind:{dir:-3.6898,speed:8}, koi:false },
{ id:'f18', name:'春惜しむ', par:4, gold:3, yards:465, seed:6126,
  tip:'木の間を上る最後の一打。角の左のバンカーを避け、フェードで。グリーンは奥が一段高い。',
  tee:{x:0,y:0}, pin:{x:52.4,y:-457.1},
  bounds:{x0:-83,x1:131,y0:-521,y1:25},
  teebox:{cx:0,cy:0,hw:7,hh:4.5,rad:1.5,rot:0},
  fairways:[{pts:[[0,-35.9],[0,-287.3],[1.7,-293]],w:30},{pts:[[1.7,-293],[43.8,-431.4]],w:28}],
  green:{cx:50.4,cy:-453.1,rx:14,ry:12,rot:-1.276},
  bunkers:[{cx:-20,cy:-275.3,rx:5.5,ry:9.5,rot:0,wob:.6},{cx:-15.5,cy:-312,rx:5,ry:8.5,rot:.295,wob:.6}],
  bunkerLines:[{pts:[[42.4,-435.8,3],[37.6,-439.6,3.8],[34.5,-444.7,3.8],[33.2,-450.4,3]]},{pts:[[66.8,-454.6,2.2],[66,-448.4,2.8],[63.2,-442.7,2.2]]}],
  water:[],
  hills:[{x:0,y:-179.6,s:70,a:2.5},{x:35.4,y:-395.2,s:55,a:3},{x:50.4,y:-453.1,s:24,a:2.5}],
  slope:{gx:.006,gy:-.019}, bumps:[],
  treeLines:[],
  trees:[{x:-36.2,y:-121,r:5.1,h:26.9},{x:-41.5,y:-109.5,r:5.3,h:23.7},{x:-30.3,y:-110,r:6.5,h:26},{x:-33.9,y:-102.4,r:6.3,h:24.4},{x:-25.1,y:-100.4,r:5.2,h:24.5},{x:-31.4,y:-93.9,r:5.7,h:23.5},{x:-36.7,y:-81.1,r:5.3,h:27.1},{x:-23.2,y:-83,r:5.2,h:29.9},{x:-30,y:-71.5,r:6,h:26.1},{x:-36.9,y:-65.1,r:5.4,h:27.2},{x:-26.4,y:-63.1,r:6.3,h:24.8},{x:-29.8,y:-54.2,r:5.7,h:26.1},{x:-34.6,y:-42.6,r:5,h:24.6},{x:-31.3,y:-33.1,r:5.9,h:28.8},{x:-37.1,y:-25.5,r:5.7,h:26.9},{x:-24.6,y:-24.6,r:4.9,h:22.2},{x:-41.8,y:-17.1,r:5.8,h:22.5},{x:-29.5,y:-15.7,r:5.2,h:26.1},{x:-33.8,y:-5.3,r:5.8,h:27.4},{x:27.2,y:-124.3,r:6.4,h:26.6},{x:22.3,y:-113.5,r:5.9,h:26.3},{x:29.7,y:-104.1,r:5.9,h:29.3},{x:37.9,y:-103,r:5.7,h:24.3},{x:23,y:-92.6,r:6.4,h:28.3},{x:28.9,y:-84.4,r:6.3,h:23.8},{x:23.6,y:-75.3,r:6.5,h:29.7},{x:29.1,y:-63.7,r:5.4,h:26.5},{x:32.3,y:-53.8,r:5.2,h:26.9},{x:26.6,y:-44.4,r:5.7,h:24.2},{x:40.3,y:-44.2,r:6.2,h:29},{x:34.1,y:-37.8,r:5.1,h:29.4},{x:28.4,y:-27.9,r:6.2,h:22.5},{x:33.6,y:-16.6,r:4.9,h:24.8},{x:45.8,y:-15.7,r:5.1,h:27.1},{x:42.8,y:-340.9,r:5.8,h:28.4},{x:54.5,y:-340.4,r:5.9,h:22.8},{x:66.1,y:-339,r:4.8,h:23},{x:47.4,y:-329.1,r:4.9,h:24.9},{x:60.2,y:-331,r:6,h:24.3},{x:70.7,y:-330.3,r:4.8,h:24.9},{x:33.7,y:-319.9,r:5.7,h:23.2},{x:44.6,y:-319.2,r:5.8,h:24.4},{x:52.3,y:-321.3,r:5.5,h:26.2},{x:63.9,y:-319.3,r:5.8,h:28},{x:38.1,y:-312.2,r:5.9,h:27.7},{x:50,y:-312.9,r:6.1,h:23.7},{x:60.7,y:-312.7,r:5.3,h:23.6},{x:44.4,y:-301.8,r:6.1,h:26.2},{x:52.9,y:-302.6,r:5.2,h:26.8},{x:35.9,y:-290.7,r:5.5,h:27.6},{x:48.3,y:-291.4,r:5.7,h:24},{x:58.5,y:-290.1,r:6.1,h:23},{x:31.7,y:-280.5,r:5.6,h:28.7},{x:41.4,y:-283.6,r:5.1,h:22.3},{x:54.4,y:-283,r:5.4,h:29.4},{x:28,y:-272.7,r:5.4,h:29.3},{x:36.1,y:-271.4,r:5.7,h:28.1},{x:49.5,y:-273.3,r:4.9,h:29.6},{x:32.1,y:-263.3,r:5.3,h:26.5},{x:43.1,y:-264.3,r:6.2,h:28},{x:53,y:-262.4,r:6,h:26.2},{x:27.2,y:-252.9,r:6.2,h:24.6},{x:36.6,y:-253.5,r:6.3,h:23.5},{x:46.8,y:-254,r:4.9,h:23.7},{x:22.1,y:-244.5,r:6.4,h:23.9},{x:31.7,y:-244.6,r:5.3,h:25.8},{x:43.7,y:-243,r:5.1,h:24.5},{x:54.2,y:-244.8,r:5.4,h:26.4},{x:27.9,y:-234.1,r:6,h:25.8},{x:39.3,y:-234.5,r:5.9,h:27.4},{x:46.8,y:-235.1,r:5.9,h:25.5},{x:61.3,y:-232.8,r:6.4,h:24.6},{x:32.9,y:-225.9,r:5.9,h:29.3},{x:44.7,y:-225.6,r:4.8,h:23.2},{x:53.7,y:-224.8,r:5,h:29.2},{x:37.8,y:-216,r:5.6,h:23.8},{x:47.2,y:-214,r:5.6,h:23.4},{x:30.8,y:-206.7,r:5.6,h:28.2},{x:44.1,y:-206.3,r:6,h:24.5},{x:54.7,y:-206.7,r:6.4,h:29.2},{x:28.2,y:-195,r:5.1,h:23},{x:37.2,y:-196.5,r:5.7,h:22.2},{x:48.6,y:-195.7,r:5.7,h:23.2},{x:33.7,y:-188.3,r:6.3,h:28.4},{x:42,y:-188.5,r:5.4,h:27.4},{x:54.5,y:-186.2,r:5.8,h:25.7},{x:26,y:-177.8,r:5.3,h:28.4},{x:37.6,y:-176.1,r:6.2,h:22.5},{x:47.1,y:-176.5,r:6.2,h:24.9},{x:33.7,y:-168.9,r:5.8,h:22.8},{x:44.6,y:-165.8,r:5.2,h:24.5},{x:55.2,y:-168.6,r:5.6,h:24.2},{x:24.7,y:-159.7,r:6,h:28},{x:38.9,y:-158.6,r:5.4,h:24.8},{x:46.6,y:-156.4,r:5.5,h:28.6},{x:30.8,y:-148.5,r:5.8,h:26.9},{x:44.3,y:-149.9,r:5.4,h:23.6},{x:53.1,y:-150,r:5.9,h:24.7},{x:28.2,y:-140.6,r:5.3,h:29.5},{x:37.4,y:-140.1,r:5.1,h:29.1},{x:47,y:-139.1,r:5.2,h:26.5},{x:32.7,y:-131,r:6.1,h:25.2},{x:-3.3,y:-460.3,r:6.4,h:26.9},{x:10.1,y:-459.6,r:6.3,h:23.3},{x:17.8,y:-459.8,r:6.2,h:20.9},{x:3.1,y:-450.5,r:6.5,h:23.5},{x:-.9,y:-443,r:5.5,h:21},{x:9.9,y:-442.7,r:5.5,h:25.8},{x:2.6,y:-433.6,r:5,h:20.8},{x:-3.4,y:-422.1,r:5.9,h:22.7},{x:9.5,y:-424.2,r:6.1,h:27.3},{x:-8.6,y:-412.8,r:6.1,h:22.4},{x:4.4,y:-413.1,r:5.5,h:27.6},{x:-15.1,y:-403.9,r:5.2,h:23},{x:-3.4,y:-402.9,r:5.6,h:26.4},{x:-19.5,y:-392.3,r:5.1,h:22.6},{x:-15.3,y:-382.6,r:5.8,h:22.5},{x:-17.6,y:-375.6,r:5.9,h:23.3},{x:-37.4,y:-346.9,r:5.4,h:26.9},{x:-23.4,y:-345.5,r:5.3,h:22.7},{x:-31.9,y:-336.9,r:6.1,h:27},{x:-34.9,y:-326.1,r:6.3,h:21.2},{x:-25.2,y:-325.8,r:5.2,h:26.4},{x:-40.8,y:-317.2,r:5.4,h:21.6},{x:-47.3,y:-308.4,r:4.9,h:21.1},{x:-37,y:-306.2,r:6.2,h:21.6},{x:-51.6,y:-298.5,r:4.9,h:26.4},{x:-40.8,y:-296.7,r:5.6,h:23.5},{x:-44.7,y:-286.9,r:5.1,h:21.3},{x:-35.7,y:-290.3,r:4.9,h:21.4},{x:-40.1,y:-279.5,r:5.3,h:23.9},{x:-29.8,y:-278.7,r:6.4,h:21.3},{x:-45.3,y:-267.8,r:5,h:26},{x:-35.2,y:-269.4,r:5.2,h:23.4},{x:-41.4,y:-260.7,r:5.2,h:25.6},{x:-31.6,y:-259.5,r:5.3,h:26.4},{x:-47.4,y:-249.4,r:5.1,h:25.1},{x:-51.4,y:-241.6,r:5.9,h:22.4},{x:-40,y:-241.1,r:5.9,h:23.6},{x:-29.7,y:-241.2,r:6.1,h:23},{x:-46,y:-229.4,r:4.9,h:21.1},{x:-35.5,y:-231.8,r:5.2,h:26.4},{x:-39.4,y:-220,r:5.3,h:27},{x:-47.4,y:-211.1,r:5.9,h:25.8},{x:-39.2,y:-203.7,r:5.9,h:26.5},{x:-48.5,y:-191,r:5.2,h:20.5},{x:-35.6,y:-191.5,r:6.4,h:22.5},{x:-39.5,y:-184.2,r:5.9,h:26.9},{x:-47.1,y:-175.5,r:5.2,h:24.7},{x:-36.3,y:-174.8,r:6.4,h:25.9},{x:-53.9,y:-163.2,r:5,h:26.4},{x:-41.7,y:-163.8,r:5.4,h:27.3},{x:-34.2,y:-154.4,r:5.5,h:27.3},{x:-52.5,y:-143.7,r:5.2,h:25},{x:-42.6,y:-145.8,r:5.6,h:27.1},{x:-34.1,y:-135,r:5,h:25},{x:24,y:-491.4,r:5.9,h:15.4},{x:34.7,y:-491.5,r:4.8,h:19.5},{x:27.4,y:-482.1,r:5,h:19.5},{x:38.7,y:-480.9,r:5.3,h:18.8},{x:50.4,y:-483.5,r:5.9,h:16.1},{x:72,y:-480.7,r:4.9,h:19.2},{x:83.7,y:-480.4,r:5.6,h:18.2},{x:56.7,y:-472.9,r:5.4,h:19.9},{x:76.2,y:-474.2,r:4.9,h:20.3},{x:89.2,y:-473.7,r:5.2,h:19.8},{x:100.9,y:-474.1,r:5.6,h:17.7},{x:73.5,y:-462.9,r:5.2,h:18},{x:94.9,y:-461.1,r:5.2,h:15.3}],
  tiers:[{x:50.4,y:-453.1,nx:.291,ny:-.957,h:.9}],
  wind:{dir:-3.0308,speed:8}, koi:false },
];
const COURSES=[
  {id:'F',name:'春の名門',level:'',sub:'',look:{turf:'T6',water:'W2',sand:'S2',tree:'H'},holes:COURSE_F},
];
COURSES.forEach(c=>c.holes.forEach(prepHole));
let courseNo=0, LIST=COURSE_F;
function setCourse(c){ courseNo=c; LIST=COURSES[c].holes; }
function sdEllipse(e,x,y){ const dx=x-e.cx, dy=y-e.cy; const u=(dx*e._c+dy*e._s)/e.rx, v=(-dx*e._s+dy*e._c)/e.ry; return (Math.sqrt(u*u+v*v)-1)*e._m; }
function sdRoundRect(r,x,y){ const c=Math.cos(r.rot||0), s=Math.sin(r.rot||0), dx=x-r.cx, dy=y-r.cy; const u=Math.abs(dx*c+dy*s)-(r.hw-r.rad), v=Math.abs(-dx*s+dy*c)-(r.hh-r.rad); return Math.hypot(Math.max(u,0),Math.max(v,0))+Math.min(Math.max(u,v),0)-r.rad; }
function sdPath(f,x,y,info){
  let best=1e18, along=0, acc=0; const p=f.pts;
  for(let k=0;k<p.length-1;k++){ const ax=p[k][0], ay=p[k][1], dx=p[k+1][0]-ax, dy=p[k+1][1]-ay, L2=dx*dx+dy*dy, L=Math.sqrt(L2); const t=clamp(((x-ax)*dx+(y-ay)*dy)/L2,0,1); const qx=ax+dx*t-x, qy=ay+dy*t-y, d=qx*qx+qy*qy; if(d<best){best=d; along=acc+t*L;} acc+=L; }
  if(info) info.along=along;
  return Math.sqrt(best)-f.w;
}
function smin(a,b,k){ const t=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-t*t*k*.25; }
function sdEllipseT(e,x,y){
  const dx=x-e.cx, dy=y-e.cy, u=(dx*e._c+dy*e._s)/e.rx, v=(-dx*e._s+dy*e._c)/e.ry, q=Math.sqrt(u*u+v*v);
  if(q<1e-9) return -e._m;
  const g=Math.sqrt(u*u/(e.rx*e.rx)+v*v/(e.ry*e.ry))/q;
  return Math.max((q-1)/g,-e._m);
}
function sdCone(x,y,ax,ay,bx,by,ra,rb){
  const dx=bx-ax, dy=by-ay, L=Math.hypot(dx,dy);
  if(L<1e-9||Math.abs(ra-rb)>=L) return Math.min(Math.hypot(x-ax,y-ay)-ra,Math.hypot(x-bx,y-by)-rb);
  const ux=dx/L, uy=dy/L, px=x-ax, py=y-ay, qy=px*ux+py*uy, qx=Math.abs(-px*uy+py*ux);
  const b=(ra-rb)/L, a=Math.sqrt(1-b*b), k=-b*qx+a*qy;
  if(k<0) return Math.hypot(qx,qy)-ra;
  if(k>a*L) return Math.hypot(qx,qy-L)-rb;
  return qx*a+qy*b-ra;
}
function prepWaterLine(pts){
  const n=pts.length, P=k=>pts[clamp(k,0,n-1)], seg=[];
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9, prev=null;
  for(let k=0;k<n-1;k++) for(let s=0;s<8;s++){
    const t=s/8, a=P(k-1), b=P(k), c=P(k+1), d=P(k+2), t2=t*t, t3=t2*t;
    const cr=i=>.5*(2*b[i]+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t2+(-a[i]+3*b[i]-3*c[i]+d[i])*t3);
    const q=[cr(0),cr(1),Math.max(.5,cr(2))];
    if(prev) seg.push(prev[0],prev[1],q[0],q[1],prev[2],q[2]);
    prev=q;
  }
  const e=pts[n-1]; seg.push(prev[0],prev[1],e[0],e[1],prev[2],e[2]);
  const box=[];
  for(let i=0;i<seg.length;i+=6){ const r=Math.max(seg[i+4],seg[i+5]), a=Math.min(seg[i],seg[i+2])-r, b=Math.max(seg[i],seg[i+2])+r, c=Math.min(seg[i+1],seg[i+3])-r, e=Math.max(seg[i+1],seg[i+3])+r; box.push(a,b,c,e); x0=Math.min(x0,a); x1=Math.max(x1,b); y0=Math.min(y0,c); y1=Math.max(y1,e); }
  return lineGrid({pts,seg:Float64Array.from(seg),box:Float64Array.from(box),bb:[x0,x1,y0,y1]});
}
function lineGrid(l){
  const C=LINE_GRID.cell, R=LINE_GRID.r, gx0=l.bb[0]-LINE_GRID.pad, gy0=l.bb[2]-LINE_GRID.pad;
  const nx=Math.max(1,Math.ceil((l.bb[1]-l.bb[0]+2*LINE_GRID.pad)/C)), ny=Math.max(1,Math.ceil((l.bb[3]-l.bb[2]+2*LINE_GRID.pad)/C)), b=l.box, n=b.length/4;
  const start=new Int32Array(nx*ny+1), idx=[];
  for(let cj=0;cj<ny;cj++) for(let ci=0;ci<nx;ci++){
    const cx0=gx0+ci*C, cy0=gy0+cj*C; start[cj*nx+ci]=idx.length;
    const cand=[], mx=cx0+C/2, my=cy0+C/2;
    for(let s=0;s<n;s++){ const j=s*4, ox=Math.max(b[j]-(cx0+C),0,cx0-b[j+1]), oy=Math.max(b[j+2]-(cy0+C),0,cy0-b[j+3]); if(ox*ox+oy*oy<=R*R){ const qx=Math.max(b[j]-mx,0,mx-b[j+1]), qy=Math.max(b[j+2]-my,0,my-b[j+3]); cand.push([qx*qx+qy*qy,s]); } }
    cand.sort((u,v)=>u[0]-v[0]||u[1]-v[1]); for(const c of cand) idx.push(c[1]);
  }
  start[nx*ny]=idx.length;
  l.grid={x0:gx0,y0:gy0,nx,ny,start,idx:Int32Array.from(idx)};
  return l;
}
function sdWaterLine(l,x,y){
  const s=l.seg, b=l.box, G=l.grid; let d=1e9;
  const ci=G?Math.floor((x-G.x0)/LINE_GRID.cell):-1, cj=G?Math.floor((y-G.y0)/LINE_GRID.cell):-1;
  if(ci>=0&&ci<G.nx&&cj>=0&&cj<G.ny){
    const c=cj*G.nx+ci, ix=G.idx;
    for(let t=G.start[c],te=G.start[c+1];t<te;t++){
      const k=ix[t], i=k*6, j=k*4;
      const ox=Math.max(b[j]-x,0,x-b[j+1]), oy=Math.max(b[j+2]-y,0,y-b[j+3]);
      const q=ox*ox+oy*oy; if(d>0?q>=d*d:q>0) continue;
      const v=sdCone(x,y,s[i],s[i+1],s[i+2],s[i+3],s[i+4],s[i+5]); if(v<d) d=v;
    }
    return d;
  }
  for(let i=0,j=0;i<s.length;i+=6,j+=4){
    const ox=Math.max(b[j]-x,0,x-b[j+1]), oy=Math.max(b[j+2]-y,0,y-b[j+3]);
    const q=ox*ox+oy*oy; if(d>0?q>=d*d:q>0) continue;
    const v=sdCone(x,y,s[i],s[i+1],s[i+2],s[i+3],s[i+4],s[i+5]); if(v<d) d=v;
  }
  return d;
}
function shoreWob(x,y){ return (vnoise(x*.11+7.3,y*.11-3.1)-.5)*1.8+(vnoise(x*.29-5.7,y*.29+9.2)-.5)*.7; }
let swH=null, swX=NaN, swY=NaN, swV=0;
const WATER_FAR={cell:4,lip:1.5};
function farGrid(h,f,sub,near){
  const B=h.bounds, c=WATER_FAR.cell, m=40, x0=B.x0-m, y0=B.y0-m, nx=Math.ceil((B.x1-B.x0+2*m)/c), ny=Math.ceil((B.y1-B.y0+2*m)/c), lb=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const x=x0+(i+.5)*c, y=y0+(j+.5)*c; lb[j*nx+i]=near&&near(x,y)?-1e9:f(h,x,y)-sub; }
  return {x0,y0,cell:c,nx,ny,lb};
}
function farAt(G,x,y,lim){
  if(!G) return false;
  const i=Math.floor((x-G.x0)/G.cell), j=Math.floor((y-G.y0)/G.cell);
  if(i<0||j<0||i>=G.nx||j>=G.ny) return false;
  return G.lb[j*G.nx+i]>=lim;
}
function waterFar(h,x,y,lim){ let G=h._wfar; if(G===undefined) G=h._wfar=waterFarGrid(h); return farAt(G,x,y,lim); }
function waterFarGrid(h){
  if(!h.pond||(!h.water.length&&!(h.waterLines&&h.waterLines.length))) return null;
  return farGrid(h,sdWater0,WATER_FAR.lip*WATER_FAR.cell*Math.SQRT1_2+1.25*h.pond.a);
}
function sandFar(h,x,y,lim){ let G=h._sfar; if(G===undefined) G=h._sfar=sandFarGrid(h); return farAt(G,x,y,lim); }
function sandFarGrid(h){
  const bl=h.bunkerLines||[];
  if(!h.pond||(!h.bunkers.length&&!bl.length)) return null;
  let mw=0; for(const k of h.bunkers) mw=Math.max(mw,k.wob||0); for(const l of bl) mw=Math.max(mw,l.wob||0);
  const r=WATER_FAR.cell*Math.SQRT1_2, gi=h.grassIslands||[];
  const G=farGrid(h,sdSand0,WATER_FAR.lip*r+2*mw+.5,(x,y)=>gi.some(g=>Math.abs(x-g.cx)<g._R+r+3&&Math.abs(y-g.cy)<g._R+r+3));
  sandPot=0; return G;
}
function sdWater(h,x,y){
  if(h===swH&&x===swX&&y===swY) return swV;
  const v=sdWater0(h,x,y); swH=h; swX=x; swY=y; swV=v; return v;
}
function sdWater0(h,x,y){
  const P=h.pond; let d=1e9;
  if(!P){ const wt=h.water; for(let i=0;i<wt.length;i++){ const k=wt[i]; if(Math.abs(x-k.cx)>k._R||Math.abs(y-k.cy)>k._R) continue; const v=sdEllipse(k,x,y); if(v<d) d=v; } return d; }
  const K=P.k, M=K+P.a+6, wt=h.water, wl=h.waterLines;
  for(let i=0;i<wt.length;i++){ const k=wt[i]; if(Math.abs(x-k.cx)>k._R+M||Math.abs(y-k.cy)>k._R+M) continue; d=smin(d,sdEllipseT(k,x,y),K); }
  for(let i=0;i<wl.length;i++){ const b=wl[i].bb; if(x<b[0]-M||x>b[1]+M||y<b[2]-M||y>b[3]+M) continue; d=smin(d,sdWaterLine(wl[i],x,y),K); }
  const ad=Math.abs(d); if(ad>=7) return d;
  return d+P.a*shoreWob(x,y)*(ad>4?1-sstep(4,7,ad):1);
}
function waterEff(h,x,y){
  let d=sdWater(h,x,y); if(d>9) return d;
  const B=h.bounds, ob=Math.max(B.x0-x,x-B.x1,B.y0-y,y-B.y1);
  if(ob>-4) d=Math.max(d,ob-(1.7+1.1*shoreWob(x*1.3+17,y*1.3-5)));
  d=Math.max(d,1.7-sdEllipse(h.green,x,y));
  for(const k of h.islands) if(Math.abs(x-k.cx)<k._R+9&&Math.abs(y-k.cy)<k._R+9) d=Math.max(d,-sdEllipse(k,x,y));
  if(h.pond) d=Math.max(d,-sdSand(h,x,y));
  else for(const k of h.bunkers) if(Math.abs(x-k.cx)<k._R+9&&Math.abs(y-k.cy)<k._R+9) d=Math.max(d,-sdEllipse(k,x,y));
  return d;
}
function waterBox(h){
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const k of h.water){ x0=Math.min(x0,k.cx-k._R); x1=Math.max(x1,k.cx+k._R); y0=Math.min(y0,k.cy-k._R); y1=Math.max(y1,k.cy+k._R); }
  for(const l of h.waterLines||[]){ x0=Math.min(x0,l.bb[0]); x1=Math.max(x1,l.bb[1]); y0=Math.min(y0,l.bb[2]); y1=Math.max(y1,l.bb[3]); }
  if(x0>x1) return null;
  const B=h.bounds, m=4;
  x0=Math.max(x0-m,B.x0-4); x1=Math.min(x1+m,B.x1+4); y0=Math.max(y0-m,B.y0-4); y1=Math.min(y1+m,B.y1+4);
  return x0<x1&&y0<y1?{x0,x1,y0,y1}:null;
}
function sandWob(x,y){ return (vnoise(x*.55+3.3,y*.55-8.1)-.5)*1.4+(vnoise(x*1.3-4.4,y*1.3+2.2)-.5)*.6; }
function prepBunker(e){ const o=normE(e); o.wob=e.wob!=null?e.wob:SAND.wob; o.pot=e.pot||0; return o; }
function prepBunkerLine(l){ const o=prepWaterLine(l.pts); o.wob=l.wob!=null?l.wob:SAND.wob; o.pot=l.pot||0; return o; }
let snH=null, snX=NaN, snY=NaN, snV=0, snP=0, sandPot=0;
function sdSand(h,x,y){
  if(h===snH&&x===snX&&y===snY){ sandPot=snP; return snV; }
  const v=sdSand0(h,x,y); snH=h; snX=x; snY=y; snV=v; snP=sandPot; return v;
}
function sdSand0(h,x,y){
  const bk=h.bunkers; let d=1e9; sandPot=0;
  if(!h.pond){ for(let i=0;i<bk.length;i++){ const k=bk[i]; if(Math.abs(x-k.cx)>k._R||Math.abs(y-k.cy)>k._R) continue; const v=sdEllipse(k,x,y); if(v<d) d=v; } return d; }
  const K=SAND.k, bl=h.bunkerLines; let best=1e9, nw=NaN;
  const add=(v,w,pot)=>{ if(w>0&&v<w*1.2+1){ if(nw!==nw) nw=sandWob(x,y); v+=w*nw; } d=smin(d,v,K); if(v<best){ best=v; sandPot=pot; } };
  for(let i=0;i<bk.length;i++){ const k=bk[i], M=k._R+K+k.wob+3; if(Math.abs(x-k.cx)>M||Math.abs(y-k.cy)>M) continue; add(sdEllipseT(k,x,y),k.wob,k.pot); }
  for(let i=0;i<bl.length;i++){ const l=bl[i], b=l.bb, M=K+l.wob+3; if(x<b[0]-M||x>b[1]+M||y<b[2]-M||y>b[3]+M) continue; add(sdWaterLine(l,x,y),l.wob,l.pot); }
  if(d<1e8) for(const g of h.grassIslands){ if(Math.abs(x-g.cx)>g._R+3||Math.abs(y-g.cy)>g._R+3) continue; if(nw!==nw) nw=sandWob(x,y); d=Math.max(d,-(sdEllipseT(g,x,y)+.3*nw)); }
  return d;
}
function iceOpenSd(h,x,y,sw){
  const I=h.ice; if(!I||sw>=3) return sw;
  if(I.all){ let d=1e9; const op=I.open||[]; for(let i=0;i<op.length;i++) d=Math.min(d,sdEllipseT(op[i],x,y)); return Math.max(sw,d); }
  return sw+I.w+I.v*vnoise(x*.42+31.7,y*.42-12.3);
}
function surfaceAt(h,x,y,info){
  const B=h.bounds;
  if(x<B.x0||x>B.x1||y<B.y0||y>B.y1){ if(info) info.sd=0; return S.OB; }
  const sg=sdEllipse(h.green,x,y);
  if(sg<0){ if(info) info.sd=sg; return S.GREEN; }
  if(h.pond){ if(!sandFar(h,x,y,0)){ const sb=sdSand(h,x,y); if(sb<0){ if(info) info.sd=sb; return S.SAND; } } }
  else { const bk=h.bunkers; for(let i=0;i<bk.length;i++){ const k=bk[i]; if(Math.abs(x-k.cx)>k._R||Math.abs(y-k.cy)>k._R) continue; const sb=sdEllipse(k,x,y); if(sb<0){ if(info) info.sd=sb; return S.SAND; } } }
  if(sg<1.7){ if(info) info.sd=sg; return S.FRINGE; }
  const il=h.islands;
  for(let i=0;i<il.length;i++){ const k=il[i]; if(Math.abs(x-k.cx)>k._R||Math.abs(y-k.cy)>k._R) continue; const si=sdEllipse(k,x,y); if(si<0){ if(info){ info.sd=si; info.ix=k.cx; info.iy=k.cy; } return S.ISLAND; } }
  if(h.pond){ if(!waterFar(h,x,y,0)){ const sw=sdWater(h,x,y); if(sw<0){ if(info) info.sd=sw; return h.ice&&iceOpenSd(h,x,y,waterEff(h,x,y))>=0?S.ICE:S.WATER; } } }
  else { const wt=h.water; for(let i=0;i<wt.length;i++){ const k=wt[i]; if(Math.abs(x-k.cx)>k._R||Math.abs(y-k.cy)>k._R) continue; const sw=sdEllipse(k,x,y); if(sw<0){ if(info) info.sd=sw; return S.WATER; } } }
  const st=sdRoundRect(h.teebox,x,y); if(st<0){ if(info) info.sd=st; return S.TEE; }
  let fw=1e9; const fs=h.fairways;
  for(let i=0;i<fs.length;i++){ const f=fs[i], b=f._bb; if(x<b[0]||x>b[1]||y<b[2]||y>b[3]) continue; const r=sdPath(f,x,y,info); if(r<fw) fw=r; }
  if(fw<0){ if(info) info.sd=fw; return S.FAIRWAY; }
  if(info){ info.sd=0; info.fw=fw; }
  return S.ROUGH;
}
function heightAt(h,x,y){
  let z=0; const hl=h._hills;
  for(let i=0;i<hl.length;i+=5){ const dx=x-hl[i], dy=y-hl[i+1], d2=dx*dx+dy*dy; if(d2<hl[i+2]) z+=hl[i+4]*Math.exp(-d2*hl[i+3]); }
  const gr=h.green, sg=sdEllipse(gr,x,y);
  if(sg<7){ const m=sstep(7,-1,sg); let gz=h.gBase+h._sgx*(x-gr.cx)+h._sgy*(y-gr.cy); const bm=h._bumps; for(let i=0;i<bm.length;i+=5){ const dx=x-bm[i], dy=y-bm[i+1]; gz+=bm[i+4]*Math.exp(-(dx*dx+dy*dy)*bm[i+3]); } const tr=h.tiers; if(tr) for(let i=0;i<tr.length;i++){ const t=tr[i]; gz+=t.h*sstep(-t.w,t.w,(x-t.x)*t.nx+(y-t.y)*t.ny); } z+=(gz-z)*m; }
  const bk=h.bunkers;
  if(h.pond){ if(!sandFar(h,x,y,.6)){ const sb=sdSand(h,x,y); if(sb<.6) z-=sandPot?1.1*sstep(.15,-.45,sb):.55*sstep(.6,-1.2,sb); } }
  else for(let i=0;i<bk.length;i++){ const k=bk[i]; if(Math.abs(x-k.cx)>k._R+1||Math.abs(y-k.cy)>k._R+1) continue; const sb=sdEllipse(k,x,y); if(sb<.6) z-=.55*sstep(.6,-1.2,sb); }
  const wt=h.water, il=h.islands;
  if(h.pond){ const sw=waterFar(h,x,y,1.2)?99:h.ice?Math.max(sdWater(h,x,y),-.3):sdWater(h,x,y); if(sw<1.2){ let m=sstep(1.2,-3,sw); for(let j=0;j<il.length;j++) m*=sstep(-.2,1.5,sdEllipse(il[j],x,y)); z-=1.1*m; } }
  else for(let i=0;i<wt.length;i++){ const k=wt[i]; if(Math.abs(x-k.cx)>k._R+2||Math.abs(y-k.cy)>k._R+2) continue; const sw=sdEllipse(k,x,y); if(sw<1.2){ let m=sstep(1.2,-3,sw); for(let j=0;j<il.length;j++) m*=sstep(-.2,1.5,sdEllipse(il[j],x,y)); z-=1.1*m; } }
  return z;
}
function gradAt(x,y){ const e=.25; return {x:(heightAt(hole,x+e,y)-heightAt(hole,x-e,y))/(2*e), y:(heightAt(hole,x,y+e)-heightAt(hole,x,y-e))/(2*e)}; }
const BULK=10;
const WATER_STYLE={gl:true,deep:[22,70,96],mid:[40,112,122],shal:[118,140,96],sky:[196,222,232],foam:[234,242,238],len:2.2,refl:1,wave:.34,spec:1,foamW:.3,caus:.22,shade:1,cloud:1};
const SAND_STYLE={gl:true,col:[232,212,164],col2:[150,146,136],grain:.07,rake:.035,period:.6,mode:0,shadow:.38,light:.1,collar:.2,dir:0};
let WSD=99;
function shadeWaterBaked(acc,sd){
  const st=WATER_STYLE, d=Math.max(0,-sd), tr=Math.exp(-d/st.len)*.9, tm=Math.exp(-d/(st.len*4)), f=sstep(st.foamW+.12,0,d)*.45, sk=.08*st.refl;
  for(let c=0;c<3;c++){ let v=lerp(lerp(st.deep[c],st.mid[c],tm),st.shal[c],tr); v=lerp(v,st.sky[c],sk); acc[c]+=lerp(v,st.foam[c],f); }
}
function waterDataBase(h,x,y){ return waterEff(h,x,y); }
function shadeSandBaked(acc,h,x,y,sd,i,j,n2,L){
  const st=SAND_STYLE, dep=Math.max(0,-sd), e=.15;
  const gx=sdSand(h,x+e,y)-sdSand(h,x-e,y), gy=sdSand(h,x,y+e)-sdSand(h,x,y-e), gl=Math.hypot(gx,gy)||1;
  sdSand(h,x,y); const pot=sandPot, tow=(gx*SUNL.hx+gy*SUNL.hy)/gl;
  let v=1+(hash2(i*7+3,j*13+1)-.5)*st.grain+.05*(n2-.5);
  { const an=vnoise(x*.16+2,y*.16+2)*2*Math.PI, ph=x*Math.cos(an)+y*Math.sin(an); v*=1+st.rake*1.6*Math.sin(ph*2*Math.PI/st.period)*sstep(.3,.8,dep)*sstep(.4,.7,vnoise(x*.45+9,y*.45+9)); }
  v*=1-st.shadow*sstep(pot?1.1:.5,0,dep)*clamp(tow*1.3,0,1);
  let r=st.col[0], g=st.col[1], b=st.col[2];
  if(pot){ const w=1-sstep(.55,.75,dep), str=(dep*5.5+.3*n2)%1<.5; r=lerp(r,str?92:76,w); g=lerp(g,str?104:64,w); b=lerp(b,str?52:42,w); }
  const m=v*L; acc[0]+=r*m; acc[1]+=g*m; acc[2]+=b*m;
}
function shadeIntoBase(acc,h,s,sd,along,x,y,i,j,n1,n2,L){
  if(s===S.WATER){ shadeWaterBaked(acc,sd); return; }
  if(s===S.SAND&&h.pond){ shadeSandBaked(acc,h,x,y,sd,i,j,n2,L); return; }
  let r,gg,b,v;
  switch(s){
    case S.OB: r=38;gg=74;b=44; v=.76+.34*n1+.16*(n2-.5); break;
    case S.ROUGH: {
      const t=sstep(1.6,.8,sd);
      r=lerp(66,84,t); gg=lerp(118,142,t); b=lerp(50,58,t);
      v=lerp(.86+.22*n1+.14*(n2-.5),1+.06*(n2-.5),t);
    } break;
    case S.FAIRWAY: { r=104;gg=166;b=68; const st=Math.sin(along*Math.PI/7.5); v=1+clamp(st*4,-1,1)*.055+.07*(n2-.5)+.05*(n1-.5); v*=1-.05*sstep(-1,-.2,sd); } break;
    case S.TEE: r=110;gg=176;b=76; v=1+clamp(Math.sin(y*Math.PI/1.6)*3,-1,1)*.035+.05*(n2-.5); v*=1-.1*sstep(-.7,-.1,sd); break;
    case S.GREEN: { r=106;gg=182;b=82; const hz=clamp(Math.sin((x+y)*1.6)*3,-1,1)*.022+clamp(Math.sin((x-y)*1.6)*3,-1,1)*.018; v=1+hz+.035*(n2-.5); } break;
    case S.FRINGE: r=90;gg=156;b=68; v=1+.06*(n2-.5); break;
    case S.SAND: r=230;gg=210;b=162; v=1+(hash2(i*7+3,j*13+1)-.5)*.07+.05*(n2-.5); v*=.84+.16*clamp(-sd/.7,0,1); break;
    case BULK: { let is=h.islands[0]; if(h.islands.length>1){ let bd=1e9; for(const k of h.islands){ const d=Math.abs(sdEllipse(k,x,y)); if(d<bd){ bd=d; is=k; } } } const a=Math.atan2(y-is.cy,x-is.cx); r=122;gg=86;b=54; v=Math.sin(a*70)>.8?.72:1; v*=1+.2*sstep(-.45,-.15,sd); L=1; } break;
    case S.ISLAND: r=66;gg=118;b=50; v=.9+.18*n1+.1*(n2-.5); break;
    default: r=66;gg=118;b=50; v=1;
  }
  if(WSD<1.1&&s!==BULK){ const e=sstep(.55+.35*n2,0,WSD)*.85; r=lerp(r,104,e); gg=lerp(gg,96,e); b=lerp(b,64,e); v=lerp(v,.9+.12*n1,e); }
  const m=v*L; acc[0]+=r*m; acc[1]+=gg*m; acc[2]+=b*m;
}
const LOOK_NAMES={
  tree:{A:'A 前の絵',B:'B もこもこ',C:'C 模型',D:'D カクカク',E:'E 針葉樹',F:'F 絵本',G:'G まぜ',H:'H 春（松と花の木）'},
  turf:{T1:'いまの芝',T2:'市松刈り',T3:'秋',T4:'冬',T5:'おもちゃ',T6:'春の名門'},
  water:{W1:'ふつうの池',W2:'澄んだ池',W3:'蓮の池',W4:'氷の池',W5:'おもちゃ'},
  sand:{S1:'いまの砂',S2:'白砂と熊手',S3:'枯山水',S4:'赤い砂',S5:'おもちゃ'},
};
const GROUND={turf:'T1',water:'W1',sand:'S1'};
function lookOf(h){ const c=COURSES.find(c=>c.holes.includes(h)); return {turf:'T1',water:'W1',sand:'S1',...(c&&c.look||{}),...(h&&h.look||{})}; }
const SUNH=(()=>{ const m=Math.hypot(SUN.x,SUN.y); return {x:-SUN.x/m,y:-SUN.y/m}; })();
const TURF=new Set([S.OB,S.ROUGH,S.FAIRWAY,S.GREEN,S.FRINGE,S.TEE,S.ISLAND]);
function put(acc,r,g,b,m){ acc[0]+=r*m; acc[1]+=g*m; acc[2]+=b*m; }
let GPPY=5;
const fine=P=>clamp((P*GPPY-2.4)/2.2,0,1);
let WEH=null, WEX=NaN, WEY=NaN, WEV=0;
function waterShore(h,x,y){ return h===WEH&&x===WEX&&y===WEY?WEV:waterEff(h,x,y); }
const WATER_W1={...WATER_STYLE};
const WATER_STYLES={
  W2:{deep:[24,92,124],mid:[50,146,158],shal:[198,190,148],sky:[206,230,238],len:3.6,caus:.75,wave:.28,foamW:.36,cloud:.9},
  W3:{deep:[24,62,38],mid:[42,90,50],shal:[86,104,58],sky:[168,200,178],foam:[140,150,104],len:1.5,caus:0,wave:.14,refl:.7,spec:.55,foamW:.18,cloud:.6},
  W4:{deep:[16,40,62],mid:[34,70,92],shal:[70,104,124],sky:[212,228,238],foam:[236,244,250],len:1.8,caus:0,wave:.12,spec:.8,foamW:.12,cloud:.8},
  W5:{gl:false},
};
function applyWaterStyle(){ Object.assign(WATER_STYLE,WATER_W1,WATER_STYLES[GROUND.water]||{}); applySandStyle(); }
const SAND_S1={...SAND_STYLE};
const SAND_STYLES={
  S2:{col:[240,234,214],mode:1,rake:.07,period:.75,grain:.05,dir:0},
  S3:{col:[224,222,210],col2:[122,120,112],mode:2,rake:.12,period:.62,shadow:.25},
  S4:{col:[222,156,94],mode:3,rake:.07,period:1.1,grain:.07},
  S5:{col:[250,226,164],col2:[236,200,132],mode:4},
};
function applySandStyle(){
  if(hole) SAND_STYLES.S2.dir=Math.atan2(hole.pin.y-hole.tee.y,hole.pin.x-hole.tee.x)+Math.PI/2;
  Object.assign(SAND_STYLE,SAND_S1,SAND_STYLES[GROUND.sand]||{});
}
function waterData(h,x,y){ return iceOpenSd(h,x,y,waterDataBase(h,x,y)); }
const LEAF=[[214,118,46],[196,72,48],[222,178,64],[168,92,44]];
function leafAt(x,y,dens){
  const lx=Math.floor(x/.3), ly=Math.floor(y/.3); if(hash2(lx*5+1,ly*7+3)>=dens) return null;
  const cx=(lx+.25+.5*hash2(lx*3+9,ly*11+2))*.3, cy=(ly+.25+.5*hash2(lx*13+4,ly*3+8))*.3;
  return Math.hypot(x-cx,y-cy)<.12?LEAF[(hash2(lx+77,ly-31)*LEAF.length)|0]:null;
}
const GROUND_BG={T1:[35,75,50],T2:[33,76,42],T3:[78,84,44],T4:[228,235,240],T5:[62,136,64],T6:[92,66,40]};
function groundBg(){ return GROUND_BG[GROUND.turf]||GROUND_BG.T1; }
function groundBgCss(){ const c=groundBg(); return `rgb(${c[0]},${c[1]},${c[2]})`; }
function shadeInto(acc,h,s,sd,along,x,y,i,j,n1,n2,L){
  if(!(h.frozenGreen&&(s===S.GREEN||s===S.FRINGE))) return shadeIntoLook(acc,h,s,sd,along,x,y,i,j,n1,n2,L);
  const q=[0,0,0]; shadeIntoLook(q,h,s,sd,along,x,y,i,j,n1,n2,L);
  const f=(s===S.GREEN?.4:.24)+.12*(n2-.5), sp=hash2(i*5+7,j*11+3)<.03?40:0;
  acc[0]+=lerp(q[0],214*L,f)+sp; acc[1]+=lerp(q[1],232*L,f)+sp; acc[2]+=lerp(q[2],242*L,f)+sp;
}
function shadeIntoLook(acc,h,s,sd,along,x,y,i,j,n1,n2,L){
  if(s===S.ICE||(s===S.WATER&&(GROUND.water!=='W1'||h.ice))) return shadeWater(acc,h,x,y,i,j,n1,n2);
  if(s===S.SAND&&GROUND.sand!=='S1') return shadeSand(acc,h,x,y,i,j,n1,n2,L);
  if(TURF.has(s)&&GROUND.turf!=='T1') return shadeTurf(acc,h,s,sd,along,x,y,i,j,n1,n2,L);
  shadeIntoBase(acc,h,s,sd,along,x,y,i,j,n1,n2,L);
}
function snowN(x,y){
  const a=vnoise(x*.075+y*.04+3.1,-x*.04+y*.075-7.7), b=vnoise(x*.21-y*.15+11.3,x*.15+y*.21+5.9), c=vnoise(x*.62+y*.33-2.2,-x*.33+y*.62+8.4);
  return a*.6+b*.28+c*.12;
}
const T5_COL={[S.OB]:[62,136,64],[S.ROUGH]:[94,172,74],[S.FAIRWAY]:[130,208,90],[S.TEE]:[142,216,98],[S.GREEN]:[156,230,116],[S.FRINGE]:[122,200,88],[S.ISLAND]:[94,172,74]};
function shadeTurf(acc,h,s,sd,along,x,y,i,j,n1,n2,L){
  const T=GROUND.turf, gr=hash2(i*7+3,j*13+1)-.5, first=s===S.ROUGH?sstep(1.6,.8,sd):0;
  let r=66,g=118,b=50,v=1;
  if(T==='T2'){
    switch(s){
      case S.OB: r=34;g=78;b=42; v=.8+.3*n1+.12*(n2-.5); break;
      case S.ROUGH: case S.ISLAND: r=lerp(60,80,first); g=lerp(124,152,first); b=lerp(46,56,first); v=.9+.18*n1+.1*(n2-.5)+.03*gr; break;
      case S.FAIRWAY: { r=96;g=174;b=62; const a=clamp(Math.sin(along*Math.PI/8)*6,-1,1)*clamp(Math.sin(-sd*Math.PI/4.5+.6)*6,-1,1); v=1+.07*a+.035*(n2-.5); v*=1-.06*sstep(-1,-.2,sd); } break;
      case S.TEE: r=104;g=182;b=70; v=(1+clamp(Math.sin(y*Math.PI/1.4)*5,-1,1)*.05+.03*(n2-.5))*(1-.1*sstep(-.7,-.1,sd)); break;
      case S.GREEN: { r=98;g=190;b=80; const a=clamp(Math.sin((x+y)*Math.PI/2.4)*6,-1,1), ring=sstep(-1.15,-1,sd)*(1-sstep(-.3,-.15,sd)); v=lerp(1+.045*a,1.05,ring)+.025*(n2-.5); } break;
      case S.FRINGE: r=86;g=164;b=64; v=1+.04*(n2-.5)+.02*gr; break;
    }
  } else if(T==='T3'){
    let lf=null;
    switch(s){
      case S.OB: r=86;g=92;b=46; v=.8+.3*n1+.12*(n2-.5); lf=leafAt(x,y,.09); break;
      case S.ROUGH: case S.ISLAND: { r=lerp(128,116,first); g=lerp(136,150,first); b=lerp(60,62,first); const m=sstep(.55,.8,n1)*(1-first); r=lerp(r,152,m); g=lerp(g,136,m); b=lerp(b,64,m); v=.88+.2*n1+.1*(n2-.5)+.03*gr; lf=leafAt(x,y,first>.5?.02:.05); } break;
      case S.FAIRWAY: r=118;g=160;b=68; v=1+clamp(Math.sin(along*Math.PI/7.5)*4,-1,1)*.05+.06*(n2-.5); v*=1-.05*sstep(-1,-.2,sd); lf=leafAt(x,y,.006); break;
      case S.TEE: r=122;g=168;b=74; v=(1+clamp(Math.sin(y*Math.PI/1.6)*3,-1,1)*.035+.05*(n2-.5))*(1-.1*sstep(-.7,-.1,sd)); break;
      case S.GREEN: { r=104;g=174;b=78; const hz=clamp(Math.sin((x+y)*1.6)*3,-1,1)*.022+clamp(Math.sin((x-y)*1.6)*3,-1,1)*.018; v=1+hz+.035*(n2-.5); } break;
      case S.FRINGE: r=108;g=152;b=64; v=1+.06*(n2-.5); break;
    }
    if(lf){ r=lf[0]; g=lf[1]; b=lf[2]; v=.92+.16*(n2-.5); }
  } else if(T==='T4'){
    switch(s){
      case S.OB: case S.ROUGH: case S.ISLAND: {
        const B=h.bounds, out=Math.max(B.x0-x,x-B.x1,B.y0-y,y-B.y1,0), thr=s===S.OB?.4-.022*out:.6+.28*first, sn=snowN(x,y), m=sstep(thr-.07,thr+.07,sn);
        let gr0=s===S.OB?[98,98,70]:[146,140,94]; const gv=.9+.16*n1+.08*(n2-.5)+.03*gr;
        const sl=Math.pow(L,1.6), cool=clamp((1-L)*3,0,1);
        r=lerp(gr0[0]*gv*L,lerp(238,204,cool)*sl,m); g=lerp(gr0[1]*gv*L,lerp(243,220,cool)*sl,m); b=lerp(gr0[2]*gv*L,lerp(247,238,cool)*sl,m);
        put(acc,r,g,b,1+.03*gr*m); return;
      }
      case S.FAIRWAY: { r=134;g=154;b=92; v=1+clamp(Math.sin(along*Math.PI/7.5)*4,-1,1)*.04+.05*(n2-.5); v*=1-.05*sstep(-1,-.2,sd); if(hash2(i*3+5,j*7+1)<.05) v*=1.12; } break;
      case S.TEE: r=138;g=158;b=96; v=(1+.05*(n2-.5))*(1-.1*sstep(-.7,-.1,sd)); break;
      case S.GREEN: { r=92;g=148;b=96; const hz=clamp(Math.sin((x+y)*1.6)*3,-1,1)*.022+clamp(Math.sin((x-y)*1.6)*3,-1,1)*.018; v=1+hz+.035*(n2-.5); } break;
      case S.FRINGE: r=116;g=142;b=90; v=1+.06*(n2-.5); break;
    }
  } else if(T==='T6'){
    const B=h.bounds, edge=Math.min(x-B.x0,B.x1-x,y-B.y0,B.y1-y), straw=s===S.OB?1:sstep(7,3,edge)*sstep(.5,.62,n1*.6+n2*.4+.15);
    switch(s){
      case S.OB: case S.ROUGH: case S.ISLAND: r=lerp(50,68,first); g=lerp(110,138,first); b=lerp(44,54,first); v=.9+.14*n1+.08*(n2-.5)+.02*gr; break;
      case S.FAIRWAY: { r=86;g=166;b=72; const st=Math.sin(along*Math.PI/9)>0?1:-1; v=1+.07*st+.03*(n2-.5); v*=1-.05*sstep(-1,-.2,sd); } break;
      case S.TEE: r=92;g=172;b=78; v=(1+(Math.sin(y*Math.PI/1.5)>0?.05:-.05)+.03*(n2-.5))*(1-.1*sstep(-.7,-.1,sd)); break;
      case S.GREEN: { r=94;g=190;b=88; const a=Math.sin((x-y)*Math.PI/2.2)>0?1:-1; v=1+.03*a+.02*(n2-.5); } break;
      case S.FRINGE: r=82;g=168;b=74; v=1+.04*(n2-.5); break;
    }
    if(straw>0&&(s===S.OB||s===S.ROUGH)){ const k=clamp(straw,0,1), w=.9+.2*n2+.06*gr; r=lerp(r,166*w,k); g=lerp(g,104*w,k); b=lerp(b,58*w,k); v=lerp(v,.92+.1*n1,k); }
  } else {
    const C=T5_COL[s];
    r=C[0]; g=C[1]; b=C[2]; v=1+.025*gr;
    if(s===S.FAIRWAY) v*=Math.sin(along*Math.PI/8)>0?1:.93;
    else if(s===S.GREEN) v*=((Math.floor((x+y)*.45)+Math.floor((x-y)*.45))&1)?1:.965;
    else if(s===S.ROUGH||s===S.OB||s===S.ISLAND) v*=1+.06*(n1-.5);
    const edge=s===S.FRINGE?sd-1.7:sd;
    if((s===S.FAIRWAY||s===S.TEE||s===S.GREEN||s===S.FRINGE)&&edge>-.5) v*=.66;
    put(acc,r,g,b,v*(1+(L-1)*.4)); return;
  }
  if(WSD<1.1&&T!=='T4'){ const e=sstep(.55+.35*n2,0,WSD)*.85; r=lerp(r,104,e); g=lerp(g,96,e); b=lerp(b,64,e); v=lerp(v,.9+.12*n1,e); }
  put(acc,r,g,b,v*L);
}
function shadeWater(acc,h,x,y,i,j,n1,n2){
  const W=GROUND.water, d=-waterShore(h,x,y);
  let r,g,b;
  if(W==='W2'){
    const t=sstep(.2,4,d); r=lerp(160,34,t); g=lerp(206,128,t); b=lerp(178,160,t);
    const wx=x+1.6*vnoise(y*.35+5,x*.35), wy=y+1.6*vnoise(x*.35-3,y*.35+7);
    const c1=1-Math.abs(vnoise(wx*.9,wy*.9)*2-1), c2=1-Math.abs(vnoise(wx*1.7+9,wy*1.7-4)*2-1), c=Math.pow(c1,7)*.7+Math.pow(c2,9)*.5, k=((1-t)*.85+.15)*c;
    r+=(255-r)*k*.5; g+=(255-g)*k*.5; b+=(240-b)*k*.45;
    if(d<2.2&&hash2(Math.floor(x/.35)*3+1,Math.floor(y/.35)*5+2)<.12*(1-t)){ r*=.86; g*=.88; b*=.86; }
    const f=sstep(.3,.06,d); r=lerp(r,236,f*.7); g=lerp(g,242,f*.7); b=lerp(b,232,f*.7);
    put(acc,r,g,b,1+.03*(n2-.5)); return;
  }
  if(W==='W3'){
    const t=sstep(.3,5,d); r=lerp(96,34,t); g=lerp(118,74,t); b=lerp(72,62,t);
    const f=sstep(.5,.1,d); r=lerp(r,74,f); g=lerp(g,72,f); b=lerp(b,46,f);
    const rf=.07*sstep(.4,.7,vnoise(x*.12+4,y*.5)); r+=(200-r)*rf; g+=(220-g)*rf; b+=(214-b)*rf;
    put(acc,r,g,b,1+.07*(n1-.5)+.03*(n2-.5)); return;
  }
  if(W==='W4'||h.ice){
    const os=iceOpenSd(h,x,y,-d), ice=sstep(-.08,.08,os), t=sstep(.3,6,d);
    let wr=lerp(52,22,t), wg=lerp(84,46,t), wb=lerp(108,74,t); const e=sstep(-.7,-.05,os)*(1-ice); wr*=1-.25*e; wg*=1-.25*e; wb*=1-.2*e;
    const iv=.94+.1*n1, ck=sstep(.035,0,Math.abs(vnoise(x*.55+11,y*.55-7)-.5))*.8, rim=sstep(.3,.05,os)*ice;
    let ir=lerp(214*iv,150,ck), ig=lerp(232*iv,178,ck), ib=lerp(242*iv,196,ck); ir=lerp(ir,250,rim*.6); ig=lerp(ig,252,rim*.6); ib=lerp(ib,255,rim*.6);
    put(acc,lerp(wr,ir,ice),lerp(wg,ig,ice),lerp(wb,ib,ice),1); return;
  }
  const t=sstep(.5,6,d); r=lerp(72,44,t); g=lerp(182,138,t); b=lerp(240,214,t);
  const row=Math.floor(y/2.6), ox=(row&1)*1.3, cx=Math.floor((x-ox)/2.6)*2.6+ox+1.3, cy=row*2.6+1.3, rr=Math.hypot(x-cx,y-cy-.25);
  const arc=d>1.2&&y-cy<-.02?sstep(.13,.06,Math.abs(rr-.55))*(.4+.6*fine(.3)):0, rim=sstep(.8,.62,d), w=Math.max(arc,rim);
  put(acc,lerp(r,250,w),lerp(g,252,w),lerp(b,255,w),1);
}
function shadeSand(acc,h,x,y,i,j,n1,n2,L){
  const SS=GROUND.sand, e=.15, sd=sdSand(h,x,y);
  const gx=sdSand(h,x+e,y)-sdSand(h,x-e,y), gy=sdSand(h,x,y+e)-sdSand(h,x,y-e), gl=Math.hypot(gx,gy)||1, n={x:gx/gl,y:gy/gl};
  const dep=-sd, lit=n.x*SUNH.x+n.y*SUNH.y, gr=hash2(i*7+3,j*13+1)-.5;
  const lipSh=sstep(1.3,.1,dep)*Math.max(0,lit), lipLit=sstep(.9,.1,dep)*Math.max(0,-lit);
  const rd=Math.atan2(h.pin.y-h.tee.y,h.pin.x-h.tee.x)+Math.PI/2, cross=x*Math.cos(rd)+y*Math.sin(rd);
  let r,g,b,v;
  if(SS==='S2'){
    r=240;g=234;b=214; v=1+.045*fine(.75)*Math.sin(cross*2*Math.PI/.75+1.5*n2)+.05*gr+.03*(n1-.5); v*=(1-.32*lipSh)*(1+.08*lipLit);
  } else if(SS==='S3'){
    r=224;g=222;b=210; const ph=dep*2*Math.PI/.62, fa=fine(.62); v=1+fa*(.1*Math.sin(ph)*lit-.045*Math.cos(ph))+.07*gr; v*=1-.2*lipSh;
    if(dep<.26){ const e=sstep(.18,.26,dep); r=lerp(122,r,e); g=lerp(120,g,e); b=lerp(112,b,e); v=lerp(.92+.25*gr,v,e); }
  } else if(SS==='S4'){
    r=222;g=156;b=94; const wd=(h.wind&&h.wind.dir)||0, q=x*Math.cos(wd)+y*Math.sin(wd)+1.4*n2+.8*n1; v=1+.06*Math.sin(q*2*Math.PI/1.1)+.04*gr;
    const m=sstep(.4,.75,n1); r=lerp(r,204,m); g=lerp(g,132,m); b=lerp(b,82,m); v*=(1-.3*lipSh)*(1+.08*lipLit);
  } else {
    r=250;g=226;b=164; v=1+.02*gr; const fx=x-Math.floor(x)-.5, fy=y-Math.floor(y)-.5, dt=sstep(.2,.15,Math.hypot(fx,fy));
    r=lerp(r,236,dt); g=lerp(g,200,dt); b=lerp(b,132,dt); if(dep<.45) v*=.74;
    put(acc,r,g,b,v*(1+(L-1)*.4)); return;
  }
  put(acc,r,g,b,v*L);
}
let pads=[], floes=[], bushes=[];
function placeBushes(){
  bushes=[]; if(!hole||GROUND.turf!=='T6') return;
  const h=hole, B=h.bounds, rng=mulberry32(h.seed*53+11), g=h.green, cols=[['#e46a9e','#f7b3cf'],['#c93a72','#ee86b0'],['#f2eee6','#ffffff'],['#e46a9e','#f7b3cf']];
  for(let k=0;k<1600&&bushes.length<56;k++){
    const x=lerp(B.x0,B.x1,rng()), y=lerp(B.y0,B.y1,rng()), edge=Math.min(x-B.x0,B.x1-x,y-B.y0,B.y1-y), sg=sdEllipse(g,x,y);
    if(!(edge<9||(sg>5&&sg<16))) continue;
    if(surfaceAt(h,x,y)!==S.ROUGH) continue;
    const R=1.9+rng()*1.7; if(bushes.some(b=>Math.hypot(b.x-x,b.y-y)<b.r+R+.4)) continue;
    const c=cols[(rng()*cols.length)|0], pts=[]; for(let q=0;q<7;q++){ const a=rng()*TAU, d=rng()*.6; pts.push([Math.cos(a)*d,Math.sin(a)*d,.35+rng()*.45]); }
    bushes.push({x,y,r:R,c,pts});
  }
}
function drawBushes(){
  for(const b of bushes){
    const p=pj(b.x,b.y,0), sh=pj(b.x+SUN.x*1.4,b.y+SUN.y*1.4,0); if(!p||!sh) continue; const R=b.r*p.s; if(R<1) continue;
    ctx.fillStyle='rgba(8,26,12,.24)'; ctx.beginPath(); ctx.ellipse(sh.x,sh.y,R*1.1,R*1.1*p.k,0,0,TAU); ctx.fill();
    ctx.fillStyle='#2f5a2c'; ctx.beginPath(); ctx.ellipse(p.x,p.y-R*.25,R,R*.75,0,0,TAU); ctx.fill();
    for(let i=0;i<b.pts.length;i++){ const [dx,dy,rr]=b.pts[i], q=pj(b.x+dx*b.r,b.y+dy*b.r,b.r*.6); if(!q) continue; ctx.fillStyle=i<4?b.c[0]:b.c[1]; ctx.beginPath(); ctx.ellipse(q.x,q.y,rr*R,rr*R*.8,0,0,TAU); ctx.fill(); }
  }
}
function groundAfterLoad(){
  pads=[]; floes=[]; placeBushes();
  if(!hole||!pond||!pond.outline.length) return;
  const h=hole, rng=mulberry32(h.seed*31+5), wb=waterBox(h);
  let area=0; for(let y=wb.y0;y<wb.y1;y+=2) for(let x=wb.x0;x<wb.x1;x+=2) if(waterData(h,x,y)<0) area+=4;
  const rp=()=>[lerp(wb.x0,wb.x1,rng()),lerp(wb.y0,wb.y1,rng())];
  if(GROUND.water==='W3'){
    const cols=['#4f8f45','#5c9a48','#46833f','#6aa552'], n=Math.round(clamp(area/9,4,70));
    for(let k=0;k<n*8&&pads.length<n;k++){
      const [x,y]=rp(), d=-waterShore(h,x,y), R=.5+.7*rng(); if(d<R+.4||d>7) continue;
      if(pads.some(p=>Math.hypot(p.x-x,p.y-y)<p.r+R+.15)) continue;
      const fl=rng()<.22, fa=rng()*TAU;
      pads.push({x,y,r:R,a:rng()*TAU,col:cols[(rng()*cols.length)|0],fl,fx:Math.cos(fa)*R*.3,fy:Math.sin(fa)*R*.3});
    }
  }
  if(GROUND.water==='W4'||hole.ice){
    const n=Math.round(clamp(area/120,1,14));
    for(let k=0;k<n*10&&floes.length<n;k++){
      const [x,y]=rp(), R=.7+1.2*rng();
      if(-waterData(h,x,y)<R+1.6||floes.some(f=>Math.hypot(f.x-x,f.y-y)<f.r+R+1)) continue;
      const m=6+((rng()*3)|0), pts=[]; for(let q=0;q<m;q++){ const aa=q/m*TAU+(rng()-.5)*.6; pts.push([Math.cos(aa)*R*(.7+.4*rng()),Math.sin(aa)*R*(.7+.4*rng())]); }
      floes.push({x,y,r:R,pts,ph:rng()*TAU});
    }
    glints=glints.filter(g=>waterData(h,g.x,g.y)<-.5);
  }
}
function loadHole(i){ if(!LIST[i]) return; Object.assign(GROUND,lookOf(LIST[i])); hole=LIST[i]; applyWaterStyle(); loadHoleBase(i); groundAfterLoad(); }
function drawWater(){
  const keep=koi; if(GROUND.water==='W4'||hole.ice) koi=[];
  try{ drawWaterBase(); } finally { koi=keep; }
  for(const p of pads){
    const c=pj(p.x,p.y,0); if(!c) continue; const R=p.r*c.s; if(R<.7) continue;
    const q=pj(p.x+Math.cos(p.a),p.y+Math.sin(p.a),0), na=q?Math.atan2((q.y-c.y)/(c.k||1),q.x-c.x):p.a;
    ctx.save(); ctx.translate(c.x,c.y); ctx.scale(1,c.k);
    ctx.fillStyle='rgba(8,28,20,.28)'; ctx.beginPath(); ctx.arc(R*.1,R*.14,R,0,TAU); ctx.fill();
    ctx.fillStyle=p.col; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,na+.3,na-.3+TAU); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(196,232,150,.55)'; ctx.lineWidth=Math.max(.6,R*.07); ctx.beginPath(); ctx.arc(0,0,R*.9,na+.36,na-.36+TAU); ctx.stroke();
    ctx.strokeStyle='rgba(28,66,30,.32)'; ctx.lineWidth=Math.max(.5,R*.045); ctx.beginPath();
    for(let k=1;k<7;k++){ const aa=na+.3+k*(TAU-.6)/7; ctx.moveTo(0,0); ctx.lineTo(Math.cos(aa)*R*.82,Math.sin(aa)*R*.82); } ctx.stroke();
    ctx.restore();
    if(p.fl){ const z=pj(p.x+p.fx,p.y+p.fy,.15); if(z){ const fr=Math.max(1.3,.34*z.s);
      ctx.fillStyle='#f3a9c4'; for(let k=0;k<6;k++){ const aa=k/6*TAU+p.a; ctx.beginPath(); ctx.ellipse(z.x+Math.cos(aa)*fr*.55,z.y+Math.sin(aa)*fr*.55*z.k,fr*.42,fr*.42*z.k,0,0,TAU); ctx.fill(); }
      ctx.fillStyle='#fbe58a'; ctx.beginPath(); ctx.ellipse(z.x,z.y,fr*.3,fr*.3*z.k,0,0,TAU); ctx.fill(); } }
  }
  for(const f of floes){
    const ox=Math.sin(now*.25+f.ph)*.25, oy=Math.cos(now*.2+f.ph)*.2, top=[], sh=[];
    for(const [px,py] of f.pts){ const a=pj(f.x+ox+px,f.y+oy+py,.12), b=pj(f.x+ox+px+.35,f.y+oy+py+.25,0); if(!a||!b){ top.length=0; break; } top.push(a); sh.push(b); }
    if(!top.length) continue;
    ctx.fillStyle='rgba(6,20,36,.35)'; ctx.beginPath(); sh.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#dcecf4'; ctx.beginPath(); top.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=Math.max(.8,.12*top[0].s); ctx.stroke();
  }
}
const TIER_LOOK={lip:.2,foot:.15,top:.05};
function tierShade(h,x,y){
  let m=1; const tr=h.tiers;
  for(let i=0;i<tr.length;i++){ const t=tr[i], u=(x-t.x)*t.nx+(y-t.y)*t.ny, a=(u-t.w-.25)/.3, b=(u+t.w+.2)/.35; m*=1+TIER_LOOK.lip*Math.exp(-a*a)-TIER_LOOK.foot*Math.exp(-b*b)+TIER_LOOK.top*sstep(t.w,t.w+1.5,u); }
  return m;
}
function buildLayer(h,x0,y0,w,hh,ppy){ GPPY=ppy;
  const W=Math.max(2,Math.round(w*ppy)), Ht=Math.max(2,Math.round(hh*ppy)), inv=1/ppy, N=W*Ht;
  const hs=new Float32Array(N), sid=new Uint8Array(N), sdA=new Float32Array(N), alA=new Float32Array(N);
  const info={sd:0,along:0,fw:9,ix:0,iy:0};
  const wb=waterBox(h), wsA=new Float32Array(N).fill(99), weA=new Float64Array(N).fill(NaN);
  let i0=W, i1=0, j0=Ht, j1=0;
  if(wb){ i0=clamp(Math.floor((wb.x0-x0)*ppy),0,W); i1=clamp(Math.ceil((wb.x1-x0)*ppy),0,W); j0=clamp(Math.floor((wb.y0-y0)*ppy),0,Ht); j1=clamp(Math.ceil((wb.y1-y0)*ppy),0,Ht); }
  for(let j=0;j<Ht;j++){ const y=y0+(j+.5)*inv; for(let i=0;i<W;i++){ const x=x0+(i+.5)*inv, k=j*W+i; hs[k]=heightAt(h,x,y); let sf=surfaceAt(h,x,y,info); if(sf===S.ISLAND&&info.sd>-.9) sf=BULK; sid[k]=sf; sdA[k]=sf===S.ROUGH?info.fw:info.sd; alA[k]=info.along;
    if(i>=i0&&i<i1&&j>=j0&&j<j1){ if(waterFar(h,x,y,3)) wsA[k]=99; else { wsA[k]=waterData(h,x,y); weA[k]=waterEff(h,x,y); } if(sf===S.WATER) sdA[k]=Math.min(wsA[k],-1e-3); } } }
  const c=document.createElement('canvas'); c.width=W; c.height=Ht;
  const g=c.getContext('2d'), im=g.createImageData(W,Ht), d=im.data;
  const LX=-.6, LY=-.8, K=5, acc=[0,0,0], q=.25*inv;
  for(let j=0;j<Ht;j++){
    const y=y0+(j+.5)*inv, ju=j>0?j-1:j, jd=j<Ht-1?j+1:j, ky=ppy/(jd-ju||1);
    for(let i=0;i<W;i++){
      const x=x0+(i+.5)*inv, il=i>0?i-1:i, ir=i<W-1?i+1:i, k=j*W+i;
      const hx=(hs[j*W+ir]-hs[j*W+il])*ppy/(ir-il||1), hy=(hs[jd*W+i]-hs[ju*W+i])*ky;
      let L=clamp(1+K*(-hx*LX-hy*LY),.78,1.24);
      if(h.tiers&&(sid[k]===S.GREEN||sid[k]===S.FRINGE)) L*=tierShade(h,x,y);
      const n1=vnoise(x*.085,y*.085), n2=vnoise(x*.42+31.7,y*.42-12.3);
      const sf=sid[k];
      acc[0]=acc[1]=acc[2]=0; WSD=wsA[k];
      if(sf===sid[j*W+il]&&sf===sid[j*W+ir]&&sf===sid[ju*W+i]&&sf===sid[jd*W+i]){
        if(weA[k]===weA[k]){ WEH=h; WEX=x; WEY=y; WEV=weA[k]; }
        shadeInto(acc,h,sf,sdA[k],alA[k],x,y,i,j,n1,n2,L);
      } else {
        for(let t=0;t<4;t++){
          const sx=x+((t&1)?q:-q), sy=y+((t&2)?q:-q);
          let s2=surfaceAt(h,sx,sy,info); if(s2===S.ISLAND&&info.sd>-.9) s2=BULK;
          shadeInto(acc,h,s2,s2===S.ROUGH?info.fw:s2===S.WATER?Math.min(wsA[k],-1e-3):info.sd,info.along,sx,sy,i,j,n1,n2,L);
        }
        acc[0]*=.25; acc[1]*=.25; acc[2]*=.25;
      }
      const o=k*4; d[o]=acc[0]; d[o+1]=acc[1]; d[o+2]=acc[2]; d[o+3]=255;
    }
  }
  WSD=99; WEH=null;
  g.putImageData(im,0,0);
  let wat=null;
  if(i1>i0||h.bunkers.length||h.bunkerLines&&h.bunkerLines.length){
    const dd=new Uint8Array(N*4);
    for(let j=0;j<Ht;j++){ const y=y0+(j+.5)*inv; for(let i=0;i<W;i++){ const x=x0+(i+.5)*inv, k=j*W+i, o=k*4, far=sandFar(h,x,y,2), sb=far?99:sdSand(h,x,y);
      dd[o]=Math.round(clamp((wsA[k]+12)/15,0,1)*255); dd[o+1]=Math.round(clamp((sb+6)/8,0,1)*255); dd[o+2]=!far&&sandPot&&sb<1?255:0; dd[o+3]=255; } }
    wat={data:dd,dw:W,dh:Ht,x0,y0,w:W*inv,h:Ht*inv};
  }
  return {canvas:c,x0,y0,w:W*inv,h:Ht*inv,ppy,wat};
}
function buildCourse(h){
  const B=h.bounds, M=26;
  const base=buildLayer(h,B.x0-M,B.y0-M,(B.x1-B.x0)+2*M,(B.y1-B.y0)+2*M,5);
  const g=h.green, R=Math.max(g.rx,g.ry)+7;
  const green=buildLayer(h,g.cx-R,g.cy-R,2*R,2*R,18);
  return {base,green};
}
function mkTree(x,y,r,hgt,rng){ return {x,y,r,h:hgt,v:(rng()*3)|0,ph:rng()*TAU,d:0}; }
function treeOk(h,t){ for(let k=0;k<7;k++){ const a=k/6*TAU, rr=k===6?0:t.r*.9; const s=surfaceAt(h,t.x+Math.cos(a)*rr,t.y+Math.sin(a)*rr); if(s!==S.ROUGH&&s!==S.OB) return false; } return true; }
function genTrees(h){
  const rng=mulberry32(h.seed), out=[], B=h.bounds;
  const edges=[[B.x0,B.y1,B.x0,B.y0,-1,0],[B.x0,B.y0,B.x1,B.y0,0,-1],[B.x1,B.y0,B.x1,B.y1,1,0],[B.x1,B.y1,B.x0,B.y1,0,1]];
  for(const [ax,ay,bx,by,nx,ny] of edges){
    const len=Math.hypot(bx-ax,by-ay), n=Math.ceil(len/5.5);
    for(let k=0;k<=n;k++) for(let row=0;row<3;row++){
      const t=(k+rng()*.8)/n, off=2.5+row*6.5+rng()*3;
      out.push(mkTree(lerp(ax,bx,t)+nx*off+(rng()-.5)*2, lerp(ay,by,t)+ny*off+(rng()-.5)*2, 4.2+rng()*2.8, 9+rng()*6, rng));
    }
  }
  for(const [ax,ay,bx,by,sp] of h.treeLines){
    const len=Math.hypot(bx-ax,by-ay), n=Math.max(1,Math.round(len/sp));
    for(let k=0;k<=n;k++){ const t=k/n; const tr=mkTree(lerp(ax,bx,t)+(rng()-.5)*4, lerp(ay,by,t)+(rng()-.5)*4, 4+rng()*2.4, 9+rng()*5, rng); if(treeOk(h,tr)) out.push(tr); }
  }
  for(const t of h.trees) out.push(mkTree(t.x,t.y,t.r,t.h,rng));
  for(const t of out) t.d=t.y+t.h*.8;
  out.sort((a,b)=>a.d-b.d);
  return out;
}
function makeTreeSprite(base,light,dark,seed){
  const N=192, c=document.createElement('canvas'); c.width=c.height=N;
  const g=c.getContext('2d'), cx=N/2, cy=N/2, R=N/2-3, rng=mulberry32(seed);
  g.fillStyle=dark; g.beginPath(); g.arc(cx,cy,R*.8,0,TAU); g.fill();
  for(let k=0;k<11;k++){ const a=k/11*TAU+rng()*.3; g.beginPath(); g.arc(cx+Math.cos(a)*R*.6,cy+Math.sin(a)*R*.6,R*.4,0,TAU); g.fill(); }
  g.globalCompositeOperation='source-atop';
  const bg=g.createRadialGradient(cx-R*.3,cy-R*.35,R*.1,cx,cy,R); bg.addColorStop(0,base); bg.addColorStop(1,dark); g.fillStyle=bg; g.fillRect(0,0,N,N);
  for(let k=0;k<14;k++){
    const a=rng()*TAU, rr=R*Math.sqrt(rng())*.75, lx=cx+Math.cos(a)*rr, ly=cy+Math.sin(a)*rr, lr=R*(.22+.18*rng());
    const gr=g.createRadialGradient(lx-lr*.4,ly-lr*.45,lr*.05,lx,ly,lr); gr.addColorStop(0,light); gr.addColorStop(.6,base); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(lx,ly,lr,0,TAU); g.fill();
  }
  const sh=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R); sh.addColorStop(0,'rgba(255,255,230,.12)'); sh.addColorStop(.55,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,25,10,.38)');
  g.fillStyle=sh; g.fillRect(0,0,N,N);
  g.globalCompositeOperation='source-over';
  return c;
}
const treeSprites=[
  makeTreeSprite('#2f7a45','#86c46e','#1b4c2f',3),
  makeTreeSprite('#4b7f35','#b0cd70','#2c5320',7),
  makeTreeSprite('#256b5c','#78b9a0','#15463a',13),
];
let TREE='B';
const TREE_PAL={
  B:[['#1b4c2f','#2f7a45','#8cc76e','#c9dd7a'],['#2c5320','#4b7f35','#b3cf72','#dcd67e'],['#15463a','#256b5c','#7dbca2','#b9dcae']],
  C:[['#23472a','#3f7a3c','#93c35c','#d4e690'],['#34501f','#5b8530','#adcc5f','#e6ea98'],['#1e4a3d','#2f7058','#77b48e','#c0e2b8']],
  D:[['#22553a','#3b8a52','#8acb72','#000000'],['#3a5c24','#62923b','#b6d46c','#000000'],['#1d5447','#2f826c','#7cc3a6','#000000']],
  E:[['#143528','#235a42','#6aa57a','#000000'],['#1b3e24','#2d6634','#79ac5c','#000000'],['#123637','#20564d','#5f9f8c','#000000']],
  F:[['#285f37','#43974f','#98cf6e','#163a27'],['#466f28','#6ca13a','#b7d270','#283c18'],['#205f53','#35937d','#8ccbb1','#12392f']],
  P:[['#a8577c','#e597bb','#ffd9ea','#fff1f7'],['#9a9a8e','#ece8de','#ffffff','#fff6e8'],['#8e2c5a','#d24f88','#f6a3c6','#ffe0ee']],
};
const TREE_KIND={B:1,C:2,D:3,E:4,F:5,P:1};
const TB={ok:null,gl:null,cv:null,prog:null,U:{},atlas:null,actx:null,CELL:144,COLS:18,GCOLS:8,map:new Map(),slots:[],use:null,box:[],free:[],tick:0,models:new Map(),trunks:null};
const TOPTH=Math.atan(1/TILT);
const SUNL=(()=>{ const m=Math.hypot(SUN.x,SUN.y); return {hx:-SUN.x/m,hy:-SUN.y/m,el:Math.atan(1/m)}; })();
const TB_VS=`#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;
const TB_FS=`#version 300 es
precision highp float; precision highp int;
uniform vec4 u_cell;
uniform vec3 u_box;
uniform float u_th;
uniform vec3 u_L;
uniform int u_kind;
uniform vec4 u_bnd;
uniform int u_ns; uniform vec4 u_s[40];
uniform int u_nc; uniform vec4 u_c[8]; uniform float u_ca[8];
uniform int u_np; uniform ivec2 u_pr[3]; uniform vec4 u_p[48];
uniform vec3 u_k0,u_k1,u_k2,u_k3;
uniform float u_seed;
out vec4 o;
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
vec3 vn3(vec3 p){ return vec3(vn(p),vn(p+vec3(17.3,5.1,9.7)),vn(p+vec3(3.7,29.1,13.3)))-.5; }
float T; vec3 N; float ID;
void sph(vec3 ro, vec3 rd){
  for(int i=0;i<40;i++){ if(i>=u_ns) break; vec4 s=u_s[i]; vec3 oc=ro-s.xyz; float b=dot(oc,rd), c=dot(oc,oc)-s.w*s.w, d=b*b-c;
    if(d>0.){ float t=-b-sqrt(d); if(t>0.&&t<T){ T=t; N=(oc+rd*t)/s.w; ID=float(i); } } }
}
void cone(vec3 ro, vec3 rd){
  for(int i=0;i<8;i++){ if(i>=u_nc) break; vec4 c=u_c[i]; float ap=u_ca[i], hg=ap-c.z; vec3 co=ro-vec3(c.x,c.y,ap);
    float k=hg*hg/(hg*hg+c.w*c.w), dv=-rd.z, cv=-co.z;
    float a=dv*dv-k, b=2.*(dv*cv-dot(rd,co)*k), cc=cv*cv-dot(co,co)*k, disc=b*b-4.*a*cc;
    if(disc<0.||abs(a)<1e-7) continue;
    float sq=sqrt(disc), t1=(-b-sq)/(2.*a), t2=(-b+sq)/(2.*a), ta=min(t1,t2), tb=max(t1,t2);
    for(int j=0;j<2;j++){ float t=j==0?ta:tb; if(t<=0.||t>=T) continue; vec3 w=co+rd*t; float y=-w.z; if(y<0.||y>hg) continue;
      if(hg-y<.15*(.5+.5*cos(atan(w.y,w.x)*9.+float(i)*1.7))) break;
      T=t; N=normalize(w+vec3(0.,0.,dot(w,w)/y)); ID=float(i); break; } }
}
void poly(vec3 ro, vec3 rd){
  for(int q=0;q<3;q++){ if(q>=u_np) break; ivec2 r=u_pr[q]; float tn=-1e9, tf=1e9, fi=0.; vec3 nn=vec3(0.,0.,1.); bool ok=true;
    for(int i=0;i<24;i++){ if(i>=r.y) break; vec4 p=u_p[r.x+i]; float dn=dot(p.xyz,rd), dist=p.w-dot(p.xyz,ro);
      if(abs(dn)<1e-7){ if(dist<0.){ ok=false; break; } continue; }
      float t=dist/dn; if(dn<0.){ if(t>tn){ tn=t; nn=p.xyz; fi=float(r.x+i); } } else tf=min(tf,t); }
    if(ok&&tn<=tf&&tn>0.&&tn<T){ T=tn; N=nn; ID=fi; } }
}
void trace(vec3 ro, vec3 rd){ T=1e9; ID=-1.; N=vec3(0.,0.,1.); if(u_kind==3) poly(ro,rd); else if(u_kind==4) cone(ro,rd); else sph(ro,rd); }
float lit(vec3 p, vec3 L){ float s=0.; trace(p,normalize(L+vec3(.07,-.05,0.))); s+=T<1e8?0.:1.; trace(p,normalize(L+vec3(-.06,.06,.02))); s+=T<1e8?0.:1.; return s*.5; }
float occ(vec3 p, vec3 n){ trace(p+n*.02,normalize(n+vec3(0.,0.,.4))); return T<.8?.45+.55*T/.8:1.; }
vec3 ramp(float x){ x=clamp(x,0.,1.3); vec3 c=x<.5?mix(u_k0,u_k1,x*2.):mix(u_k1,u_k2,min(1.,(x-.5)*2.)); if(x>1.) c=mix(c,min(vec3(1.),c*1.1+.06),(x-1.)/.3); return c; }
vec3 shade(vec3 p, vec3 n, float id, vec3 V){
  vec3 L=normalize(u_L), sd=u_seed*vec3(1.,1.7,2.3);
  if(u_kind==1){
    vec3 nb=normalize(n+.45*vn3(p*7.+sd)+.35*vn3(p*19.+sd));
    float dif=clamp((dot(nb,L)+.3)/1.3,0.,1.), s=lit(p+n*.02,L), a=occ(p,n);
    float x=(.16+.1*nb.z)*a+.85*dif*mix(.28,1.,s)*mix(.75,1.,a);
    x*=.74+.5*(smoothstep(.25,.75,vn(p*24.+sd))*.6+vn(p*11.+sd)*.4);
    return mix(ramp(x),u_k3*clamp(x+.25,.5,1.1),.14*h31(vec3(id,u_seed,3.)));
  }
  if(u_kind==2){
    vec3 nb=normalize(n+.9*vn3(p*11.+sd)+.5*vn3(p*23.+sd));
    float dif=clamp((dot(nb,L)+.2)/1.2,0.,1.), s=lit(p+n*.02,L), a=occ(p,n);
    float x=.17*a+.86*dif*mix(.3,1.,s)*mix(.72,1.,a);
    x+=(vn(p*34.+sd)-.5)*.42; x=floor(x*4.+.5)/4.;
    vec3 c=ramp(x);
    return mix(c,u_k3,step(.76,vn(p*52.+sd*1.3))*.55*s);
  }
  if(u_kind==3){
    float dif=max(dot(n,L),0.), s=lit(p+n*.01,L);
    float x=.22+.9*dif*mix(.4,1.,s)+.06*n.z;
    return ramp(x*(.93+.14*h31(vec3(id,u_seed,7.))));
  }
  if(u_kind==4){
    int ci=int(id+.5); vec4 c=u_c[ci]; vec2 cs=normalize(p.xy-c.xy+1e-5);
    float st=vn(vec3(cs*2.5,p.z*2.)+sd+id)*.45+vn(vec3(cs*7.,p.z*5.)+sd)*.35+vn(vec3(cs*15.,p.z*12.)+sd)*.2;
    vec3 nb=normalize(n+.3*vn3(vec3(cs*4.,p.z*6.)+sd+id));
    float dif=clamp((dot(nb,L)+.25)/1.25,0.,1.), s=lit(p+n*.02,L);
    float rel=clamp((p.z-c.z)/(u_ca[ci]-c.z),0.,1.);
    float x=(.14+.12*nb.z+.85*dif*mix(.3,1.,s))*mix(.68,1.05,smoothstep(0.,.35,rel))*(.78+.4*st);
    return ramp(x);
  }
  vec3 nb=normalize(n+.4*vn3(p*5.+sd));
  float d=dot(nb,L), s=lit(p+n*.02,L), e=d*mix(.1,1.,s);
  float x=mix(.3,.64,smoothstep(0.,.06,e)); x=mix(x,.94,smoothstep(.5,.56,e));
  return mix(ramp(x),u_k3,1.-smoothstep(.16,.25,dot(n,V)));
}
void main(){
  vec2 px=gl_FragCoord.xy-u_cell.xy; float sz=u_cell.z, ct=cos(u_th), st=sin(u_th);
  vec3 v=vec3(0.,ct,-st), up=vec3(0.,st,ct), acc=vec3(0.); float cov=0.;
  for(int k=0;k<4;k++){
    vec2 off=k==0?vec2(-.125,-.375):k==1?vec2(.375,-.125):k==2?vec2(.125,.375):vec2(-.375,.125);
    vec2 q=(px+off)/sz;
    vec3 ro=vec3((q.x*2.-1.)*u_box.x,0.,0.)+up*(u_box.y+(q.y*2.-1.)*u_box.z)-v*12.;
    vec3 oc=ro-u_bnd.xyz; float b=dot(oc,v), c=dot(oc,oc)-u_bnd.w*u_bnd.w; if(b*b-c<0.) continue;
    trace(ro,v); if(T>1e8) continue;
    vec3 p=ro+v*T, n=normalize(N); float id=ID;
    acc+=shade(p,n,id,-v); cov+=1.;
  }
  o=vec4(acc*.25,cov*.25);
}`;
function tbInit(){
  if(TB.ok!==null) return TB.ok; TB.ok=false;
  try{
    const C=TB.CELL, cv=document.createElement('canvas'); cv.width=cv.height=TB.GCOLS*C;
    const gl=cv.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
    if(!gl) throw new Error('webgl2 なし');
    const sh=(t,src)=>{ const o=gl.createShader(t); gl.shaderSource(o,src); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,TB_VS)); gl.attachShader(p,sh(gl.FRAGMENT_SHADER,TB_FS)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const al=gl.getAttribLocation(p,'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
    for(const n of ['u_cell','u_box','u_th','u_L','u_kind','u_bnd','u_ns','u_s','u_nc','u_c','u_ca','u_np','u_pr','u_p','u_k0','u_k1','u_k2','u_k3','u_seed']) TB.U[n]=gl.getUniformLocation(p,n);
    const at=document.createElement('canvas'); at.width=at.height=TB.COLS*C;
    TB.gl=gl; TB.cv=cv; TB.prog=p; TB.atlas=at; TB.actx=at.getContext('2d');
    const n=TB.COLS*TB.COLS; TB.use=new Float64Array(n); TB.slots=new Array(n).fill(null); TB.box=new Array(n).fill(null); TB.free=[]; for(let i=n-1;i>=0;i--) TB.free.push(i);
    TB.trunks=[0,1,2,3,4].map(i=>makeTrunkSprite(i/2-1));
    TB.ok=true;
  }catch(e){ console.warn('木の見本: WebGL2 で木を描けないので、いまの木で描く',e); }
  return TB.ok;
}
function tbClear(){ if(!TB.ok) return; TB.map.clear(); TB.slots.fill(null); TB.box.fill(null); TB.use.fill(0); TB.free=[]; for(let i=TB.slots.length-1;i>=0;i--) TB.free.push(i); }
function makeTrunkSprite(lx){
  const W=24, H=96, c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'), im=g.createImageData(W,H), rng=mulberry32(77);
  const streak=[]; for(let x=0;x<W;x++) streak.push(.9+rng()*.2);
  for(let y=0;y<H;y++){ const v=y/(H-1), hw=W/2*(.62+.38*v);
    for(let x=0;x<W;x++){ const dx=(x+.5-W/2)/hw; if(Math.abs(dx)>1) continue;
      const nx=dx, nz=Math.sqrt(1-nx*nx), b=clamp(.34+.66*Math.max(0,nx*lx*.85+nz*.5),0,1)*streak[x]*(v<.42?.55+.45*v/.42:1);
      const i=(y*W+x)*4, a=clamp((1-Math.abs(dx))*hw,0,1);
      im.data[i]=lerp(44,120,b); im.data[i+1]=lerp(30,86,b); im.data[i+2]=lerp(20,56,b); im.data[i+3]=255*a; } }
  g.putImageData(im,0,0); return c;
}
const frac=x=>x-Math.floor(x);
const hex3=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
function treeModel(st,v,sh,si){
  const key=st+v+sh+si; let m=TB.models.get(key); if(m) return m;
  const S=[1,1.45,1.9][si], rng=mulberry32(4099+v*131+sh*977+si*31+st.charCodeAt(0)*7), R=(a,b)=>a+(b-a)*rng();
  m={kind:TREE_KIND[st],sph:[],cone:[],ca:[],pl:[],pr:[],col:TREE_PAL[st][v].map(hex3),seed:R(0,40)};
  const zb=-(S-1)*1.75;
  if(st==='B'||st==='F'||st==='P'){
    const big=st==='F', nc=1+Math.round((S-1)*2.6);
    for(let i=0;i<nc;i++) m.sph.push([R(-.05,.05),R(-.05,.05),(nc<2?0:lerp(0,zb,i/(nc-1)))-.05,.62]);
    const n=(big?6:15+sh*3)+Math.round((S-1)*(big?6:14));
    for(let i=0;i<n;i++){ const a=i*2.39996+R(-.3,.3), rr=big?R(.46,.54):R(.32,.44), d=.95-rr+R(-.04,.05), zc=S>1?lerp(0,zb,rng()):0, el=R(-.7,.85);
      m.sph.push([Math.cos(a)*Math.cos(el)*d,Math.sin(a)*Math.cos(el)*d,zc+Math.sin(el)*d,rr]); }
    for(let i=0;i<(big?2:4);i++){ const a=R(0,TAU), rr=big?R(.36,.42):R(.3,.38); m.sph.push([Math.cos(a)*.22,Math.sin(a)*.22,.6-rr*.25+R(0,.06),rr]); }
  } else if(st==='C'){
    const nc=1+Math.round((S-1)*2.2);
    for(let i=0;i<nc;i++){ const z=nc<2?0:lerp(0,zb,i/(nc-1)); m.sph.push([R(-.06,.06),R(-.06,.06),z,.68]);
      const k=4+sh; for(let j=0;j<k;j++){ const a=j/k*TAU+R(-.4,.4); m.sph.push([Math.cos(a)*.42,Math.sin(a)*.42,z+R(-.25,.3),R(.48,.6)]); } }
    m.sph.push([R(-.1,.1),R(-.1,.1),.42,.52]);
  } else if(st==='D'){
    const add=(cx,cy,cz,rad,K,sz)=>{ const s0=m.pl.length;
      for(let i=0;i<K;i++){ const y=1-(i+.5)/K*2, rr=Math.sqrt(1-y*y), a=i*2.39996+R(-.25,.25);
        let nx=Math.cos(a)*rr, ny=Math.sin(a)*rr, nz=y/sz; const l=Math.hypot(nx,ny,nz); nx/=l; ny/=l; nz/=l;
        m.pl.push([nx,ny,nz,rad*R(.96,1.02)/l+nx*cx+ny*cy+nz*cz]); }
      m.pr.push([s0,K]); };
    const sz=1.12+(S-1)*1.1;
    add(0,0,.02-(S-1)*.95,.84,16,sz);
    if(sh) add(R(.3,.42)*(rng()<.5?-1:1),R(-.1,.1),-.3-(S-1)*.9,.56,12,1.05);
  } else {
    const n=(sh?4:3)+Math.round((S-1)*2.5), top=1.12, span=2.57*(1+(S-1)*.75), bot=top-span;
    for(let i=0;i<n;i++){ const z0=bot+span*(i/n)*.86, ap=i===n-1?top:z0+(top-z0)*.55, r0=.97*(1-.58*i/Math.max(1,n-1))*R(.95,1.03);
      m.cone.push([R(-.03,.03),R(-.03,.03),z0,r0]); m.ca.push(ap); }
  }
  let zlo=1e9, zhi=-1e9, rad=0;
  for(const s of m.sph){ zlo=Math.min(zlo,s[2]-s[3]); zhi=Math.max(zhi,s[2]+s[3]); rad=Math.max(rad,Math.hypot(s[0],s[1])+s[3]); }
  for(let i=0;i<m.cone.length;i++){ const c=m.cone[i]; zlo=Math.min(zlo,c[2]); zhi=Math.max(zhi,m.ca[i]); rad=Math.max(rad,Math.hypot(c[0],c[1])+c[3]); }
  if(m.pl.length){ zlo=Math.min(zlo,-1.05-(S-1)*1.8); zhi=Math.max(zhi,1.05); rad=Math.max(rad,1.08); }
  m.zlo=zlo; m.zhi=zhi; m.rad=rad;
  const cz=(zlo+zhi)/2; m.bnd=[0,0,cz,Math.hypot(rad,(zhi-zlo)/2)*1.02];
  TB.models.set(key,m); return m;
}
function thOf(tb){ return tb>15?TOPTH:tb*6*DEG; }
function boxOf(m,th){
  const ct=Math.cos(th), st=Math.sin(th), Hx=m.rad+.06, Uhi=m.zhi*ct+m.rad*st, Ulo=m.zlo*ct-m.rad*st;
  return [Hx,(Uhi+Ulo)/2,Math.max(Hx,(Uhi-Ulo)/2+.06)];
}
function treeModelOf(t){
  let st=TREE; if(st==='G') st=frac(t.ph*5.17)<.4?'E':'B'; else if(st==='H') st=frac(t.ph*5.17)<.55?'E':'P';
  const q=t.h/t.r; return {st,v:t.v,sh:Math.floor(t.ph*7.3)&1,si:q<2.9?0:q<3.7?1:2};
}
function tbKeyFor(t){
  const m=treeModelOf(t); let th, fx, fy;
  if(drawRear){ const dx=t.x-pv.Cx, dy=t.y-pv.Cy, hd=Math.hypot(dx,dy)||1; th=Math.atan2(pv.Cz-t.h,hd); fx=dx/hd; fy=dy/hd; }
  else { th=-1; fx=0; fy=-1; }
  const rx=-fy, ry=fx, Lx=SUNL.hx*rx+SUNL.hy*ry, Ly=SUNL.hx*fx+SUNL.hy*fy;
  const tb=th<0?16:clamp(Math.round(th/(6*DEG)),0,15), pb=((Math.round(Math.atan2(Lx,Ly)/(15*DEG))%24)+24)%24;
  t._lx=Lx;
  return {key:m.st+m.v+m.sh+m.si+'|'+tb+'|'+pb,m,tb,pb};
}
function tbAlloc(){
  if(TB.free.length) return TB.free.pop();
  let best=-1, bu=Infinity; for(let i=0;i<TB.use.length;i++) if(TB.use[i]<TB.tick&&TB.use[i]<bu){ bu=TB.use[i]; best=i; }
  if(best>=0&&TB.slots[best]!=null) TB.map.delete(TB.slots[best]);
  return best;
}
function tbBake(list){
  const gl=TB.gl, C=TB.CELL, G=TB.GCOLS, GH=G*C, U=TB.U;
  gl.useProgram(TB.prog);
  for(let b0=0;b0<list.length;b0+=G*G){
    const batch=[];
    for(const k of list.slice(b0,b0+G*G)){ const s=tbAlloc(); if(s<0) break; TB.use[s]=TB.tick; TB.slots[s]=null; batch.push([k,s]); }
    if(!batch.length) return;
    gl.viewport(0,0,GH,GH); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    batch.forEach(([k,s],i)=>{
      const gx=(i%G)*C, gy=Math.floor(i/G)*C, M=treeModel(k.m.st,k.m.v,k.m.sh,k.m.si), th=thOf(k.tb), box=boxOf(M,th), ph=k.pb*15*DEG;
      TB.box[s]=box;
      gl.viewport(gx,gy,C,C);
      gl.uniform4f(U.u_cell,gx,gy,C,0); gl.uniform3f(U.u_box,box[0],box[1],box[2]); gl.uniform1f(U.u_th,th);
      gl.uniform3f(U.u_L,Math.cos(SUNL.el)*Math.sin(ph),Math.cos(SUNL.el)*Math.cos(ph),Math.sin(SUNL.el));
      gl.uniform1i(U.u_kind,M.kind); gl.uniform4f(U.u_bnd,M.bnd[0],M.bnd[1],M.bnd[2],M.bnd[3]);
      gl.uniform1i(U.u_ns,M.sph.length); if(M.sph.length) gl.uniform4fv(U.u_s,new Float32Array(M.sph.flat()));
      gl.uniform1i(U.u_nc,M.cone.length); if(M.cone.length){ gl.uniform4fv(U.u_c,new Float32Array(M.cone.flat())); gl.uniform1fv(U.u_ca,new Float32Array(M.ca)); }
      gl.uniform1i(U.u_np,M.pr.length); if(M.pr.length){ gl.uniform2iv(U.u_pr,new Int32Array(M.pr.flat())); gl.uniform4fv(U.u_p,new Float32Array(M.pl.flat())); }
      gl.uniform3fv(U.u_k0,M.col[0]); gl.uniform3fv(U.u_k1,M.col[1]); gl.uniform3fv(U.u_k2,M.col[2]); gl.uniform3fv(U.u_k3,M.col[3]); gl.uniform1f(U.u_seed,M.seed);
      gl.drawArrays(gl.TRIANGLES,0,3);
    });
    batch.forEach(([k,s],i)=>{
      const gx=(i%G)*C, gy=Math.floor(i/G)*C, ax=(s%TB.COLS)*C, ay=Math.floor(s/TB.COLS)*C;
      TB.actx.clearRect(ax,ay,C,C); TB.actx.drawImage(TB.cv,gx,GH-gy-C,C,C,ax,ay,C,C);
      TB.slots[s]=k.key; TB.map.set(k.key,s);
    });
  }
}
function tbFrame(ts){
  if(TREE==='A'||!tbInit()) return;
  TB.tick++;
  const need=new Map();
  for(const t of ts){ const k=tbKeyFor(t); t._k=k; const s=TB.map.get(k.key); if(s!=null) TB.use[s]=TB.tick; else if(!need.has(k.key)) need.set(k.key,k); }
  if(need.size) tbBake([...need.values()]);
}
function setTreeStyle(id){ if(id===TREE) return; TREE=id; tbClear(); }
function treeStyleOf(h){ if(h.treeStyle) return h.treeStyle; if(h.look&&h.look.tree) return h.look.tree; for(const c of COURSES) if(c.holes.includes(h)) return c.treeStyle||(c.look&&c.look.tree)||'B'; return 'B'; }
const shadowSprite=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(6,22,12,.46)'); gr.addColorStop(.55,'rgba(6,22,12,.36)'); gr.addColorStop(1,'rgba(6,22,12,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return c; })();
const ballSprite=(()=>{ const c=document.createElement('canvas'); c.width=c.height=48; const g=c.getContext('2d'); const gr=g.createRadialGradient(17,15,2,24,24,22); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.5,'#eef1ec'); gr.addColorStop(1,'#9ea89f'); g.fillStyle=gr; g.beginPath(); g.arc(24,24,21,0,TAU); g.fill(); g.lineWidth=2.5; g.strokeStyle='rgba(10,30,20,.45)'; g.stroke(); return c; })();
const app=$('app'), cv=$('cv');
let ctx=cv.getContext('2d');
let dpr=1;
const view={W:360,H:640,top:100,bot:120,left:0,topPx:0};
const cam={x:0,y:-60,s:3,ox:0,oy:0,shake:0};
const camR={cx:180,cy:320};
const REAR={pitch:40*DEG,pitchMin:26*DEG,pitchMax:80*DEG,zoomMin:.4,zoomMax:2.5,fov:44*DEG,near:1.5,strip:.025,swap:.9,swapReduced:.3,mimicPitch:Math.atan(1/TILT),mimicF:2.5,orbitYaw:Math.PI,orbitPitch:Math.PI/2,orbitRate:14,ballClear:22};
const rear={on:false,u:0,k:0,shown:false,lockYaw:null,yawOff:0,pitch:40*DEG,zoom:1,orbitT:9};
const cam3={x:0,y:-60,d:300,yaw:-Math.PI/2,pitch:40*DEG};
const pv={Cx:0,Cy:0,Cz:1,fx:0,fy:-1,fz:0,rx:1,ry:0,ux:0,uy:0,uz:1,d:300,F:900,yaw:-Math.PI/2,pcx:0,pcy:0,lightRot:0};
let drawRear=false;
const game={state:'boot',hole:0,best:{},cleared:false,strokes:0,club:3,lie:S.TEE,lieAtShot:S.TEE,overview:false,ts:1,lastPos:{x:0,y:0},hints:{aim:0,putt:0,cam:0,near:0},seq:0,spin:{side:0,back:0}};
const ball={x:0,y:0,z:0,vx:0,vy:0,vz:0,ss:0,sb:0,chip:0,mode:'rest',bounces:0,treeCd:0,ox:0,oy:0,lipCd:0,lipped:false,putt:false,holedT:0,sinkFrom:null};
const wind={dir:0,speed:0}, windVec={x:0,y:0};
const flyY={on:false,carry:0,run:0,ran:false,t:0,a:0,r:0};
const aim={active:false,id:null,x0:0,y0:0,x:0,y:0,dir:{x:0,y:-1},pull:0,power:0,rv:0,cancel:true,moved:false,preview:null,hist:[]};
let hole=null, course=null, trees=[], koi=[], glints=[], tracer=[], tracerA=0, pred=null, pond=null;
const parts=[], ripples=[], flow=[], specks=[], birds=[];
let flowAlpha=0, birdT=5, toastTimer=0, now=0;
let schedules=[];
function schedule(sec,fn){ schedules.push({t:sec,fn,seq:game.seq}); }
function runSchedules(dt){ if(!schedules.length) return; const due=[]; schedules=schedules.filter(s=>{ s.t-=dt; if(s.t<=0){ if(s.seq===game.seq) due.push(s.fn); return false; } return true; }); for(const f of due) f(); }
const cache=new Map(), CACHE_MAX=4;
function prebuild(i){
  const h=LIST[i]; if(!h||cache.has(h)) return;
  const tr=genTrees(h); cache.set(h,{course:buildCourse(h),trees:tr,pond:pondInfo(h,tr)});
  for(const k of cache.keys()){ if(cache.size<=CACHE_MAX) break; if(k!==hole&&k!==h) cache.delete(k); }
}
function waterGrid(h,box,g){
  const nx=Math.ceil((box.x1-box.x0)/g)+3, ny=Math.ceil((box.y1-box.y0)/g)+3, X0=box.x0-g, Y0=box.y0-g, f=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++) f[j*nx+i]=(i===0||j===0||i===nx-1||j===ny-1)?99:waterData(h,X0+i*g,Y0+j*g);
  return {nx,ny,X0,Y0,g,f};
}
function contourLoops(G,c){
  const {nx,ny,X0,Y0,g}=G, v=new Float32Array(nx*ny);
  for(let k=0;k<v.length;k++){ const e=G.f[k]-c; v[k]=e===0?1e-6:e; }
  const adj=new Map(), pts=new Map();
  const P=e=>{ let p=pts.get(e); if(p) return p; const k=e>>1, i=k%nx, j=(k/nx)|0, a=v[k], b=(e&1)?v[k+nx]:v[k+1], t=a/(a-b); p=(e&1)?[X0+i*g,Y0+(j+t)*g]:[X0+(i+t)*g,Y0+j*g]; pts.set(e,p); return p; };
  const link=(a,b)=>{ let l=adj.get(a); if(!l) adj.set(a,l=[]); l.push(b); l=adj.get(b); if(!l) adj.set(b,l=[]); l.push(a); };
  for(let j=0;j<ny-1;j++) for(let i=0;i<nx-1;i++){
    const k=j*nx+i, a=v[k], b=v[k+1], cc=v[k+nx+1], d=v[k+nx], code=(a<0?1:0)|(b<0?2:0)|(cc<0?4:0)|(d<0?8:0);
    if(code===0||code===15) continue;
    const T=k*2, R=(k+1)*2+1, B=(k+nx)*2, L=k*2+1, mid=a+b+cc+d<0;
    switch(code){
      case 1: case 14: link(L,T); break;
      case 2: case 13: link(T,R); break;
      case 3: case 12: link(L,R); break;
      case 4: case 11: link(R,B); break;
      case 6: case 9: link(T,B); break;
      case 7: case 8: link(L,B); break;
      case 5: if(mid){ link(T,R); link(B,L); } else { link(L,T); link(R,B); } break;
      case 10: if(mid){ link(L,T); link(R,B); } else { link(T,R); link(B,L); } break;
    }
  }
  const seen=new Set(), loops=[];
  for(const e0 of adj.keys()){
    if(seen.has(e0)) continue;
    const loop=[]; let prev=-1, e=e0;
    while(e!==undefined&&!seen.has(e)){ seen.add(e); loop.push(P(e)); const n=adj.get(e), nx2=n[0]!==prev?n[0]:n[1]; prev=e; e=nx2; }
    if(loop.length>2) loops.push(loop);
  }
  return loops;
}
function pathOf(pts){ const cum=new Float64Array(pts.length+1); for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; cum[i+1]=cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]); } return {pts,cum,len:cum[pts.length]}; }
function pathAt(p,s){
  const c=p.cum, n=p.pts.length; s=((s%p.len)+p.len)%p.len;
  let lo=0, hi=n; while(hi-lo>1){ const m=(lo+hi)>>1; if(c[m]<=s) lo=m; else hi=m; }
  const a=p.pts[lo], b=p.pts[(lo+1)%n], L=c[lo+1]-c[lo]||1, t=(s-c[lo])/L;
  return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/L,dy:(b[1]-a[1])/L};
}
function pondInfo(h,tr){
  const box=waterBox(h); if(!box) return {outline:[],swim:[],refl:[]};
  const G=waterGrid(h,box,.7), outline=contourLoops(G,0);
  let swim=[];
  for(const c of [-3,-2,-1.2]){ swim=contourLoops(G,c).map(pathOf).filter(p=>p.len>24); if(swim.length) break; }
  swim.sort((a,b)=>b.len-a.len);
  const refl=outline.length?tr.filter(t=>waterData(h,t.x,t.y)<t.h+t.r):[];
  return {outline,swim,refl};
}
function loadHoleBase(i){
  hole=LIST[i];
  prebuild(i);
  course=cache.get(hole).course;
  trees=cache.get(hole).trees;
  setTreeStyle(treeStyleOf(hole));
  const rng=mulberry32(hole.seed*7+1);
  pond=cache.get(hole).pond;
  koi=[];
  if(hole.koi&&pond.swim.length){ const cols=['#f08a3c','#f4f1e8','#e8603a','#f5c04a']; for(let k=0;k<4;k++){ const p=pond.swim[k%pond.swim.length]; koi.push({p,s:rng()*p.len,sp:(1.1+1.3*rng())*(rng()<.5?-1:1),col:cols[k],ph:rng()*TAU}); } }
  glints=[];
  const wb=waterBox(hole);
  if(wb) for(let y=wb.y0;y<wb.y1;y+=3.4) for(let x=wb.x0;x<wb.x1;x+=3.4){ const jx=x+(hash2(x*10|0,y*10|0)-.5)*2.4, jy=y+(hash2(y*10|0,x*10|0)-.5)*2.4; if(waterData(hole,jx,jy)<-.8) glints.push({x:jx,y:jy,ph:hash2(jx*7|0,jy*7|0)*TAU,sp:.8+hash2(jy*3|0,jx*5|0)*1.2}); }
  parts.length=0; ripples.length=0; flow.length=0; birds.length=0; tracer.length=0; tracerA=0;
  specks.length=0; for(let k=0;k<18;k++) specks.push({x:0,y:0,z:1+rand()*4,ph:rand()*TAU,init:true});
}
function stepAir(b,dt,w){
  const vh=Math.hypot(b.vx,b.vy)||1e-6, px=-b.vy/vh, py=b.vx/vh, f=vh/70, lat=b.ss*SIDE_K*f;
  let ax=-DRAG*b.vx+px*lat, ay=-DRAG*b.vy+py*lat;
  if(w){ ax+=w.x*WIND_K; ay+=w.y*WIND_K; }
  b.vx+=ax*dt; b.vy+=ay*dt;
  b.vz+=(-G+Math.max(0,b.sb)*LIFT_K*f-DRAG*b.vz)*dt;
  b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt;
}
function simulateFlight(st,useWind){
  const b={x:st.x,y:st.y,z:Math.max(st.z,.001),vx:st.vx,vy:st.vy,vz:st.vz,ss:st.ss,sb:st.sb};
  const pts=[]; let apex=b.z, apx=b.x, apy=b.y; const dt=1/60;
  for(let i=0;i<720;i++){ stepAir(b,dt,useWind?windVec:null); pts.push(b.x,b.y,Math.max(0,b.z)); if(b.z>apex){ apex=b.z; apx=b.x; apy=b.y; } if(b.z<=0) break; }
  return {pts,land:{x:b.x,y:b.y},apex,apx,apy:apy-apex*TILT};
}
function lieFactor(c,s){ if(c.id==='PT') return 1; if(s===S.SAND) return c.id==='SW'?.9:.65; if(SURF[s].lie<1) return c.id==='SW'?.96:c.id==='4UT'?.98:SURF[s].lie; return 1; }
function launchState(dir,power,ci,spin){
  const c=CLUBS[ci==null?game.club:ci], chip=c.id==='PT'||game.lie===S.SAND?0:1-sstep(CHIP.a,CHIP.b,power), v=c.v*Math.sqrt(power)*lieFactor(c,game.lie)*lerp(1,c.chipV,chip), lo=lerp(c.loft,c.chipLoft,chip)*DEG;
  const sp=spin&&c.id!=='PT'?spin:{side:0,back:0};
  return {x:ball.x,y:ball.y,z:.02,vx:dir.x*v*Math.cos(lo),vy:dir.y*v*Math.cos(lo),vz:v*Math.sin(lo),ss:clamp(sp.side,-1,1),sb:clamp(c.spin*SURF[game.lie].spin*(1-chip)+sp.back,-1,1.2),v,chip};
}
function puttMu(){ return (game.lie===S.GREEN||game.lie===S.FRINGE)?SP(S.GREEN).mu:SP(game.lie).mu; }
function computeCarries(){
  for(let i=0;i<CLUBS.length;i++){ const c=CLUBS[i];
    if(c.id==='PT'){ c.carry=c.v*c.v/(2*puttMu()*G); continue; }
    const st=launchState({x:0,y:-1},1,i); st.x=0; st.y=0; const r=simulateFlight(st,false); c.carry=Math.hypot(r.land.x,r.land.y);
  }
}
function distPin(){ return Math.hypot(hole.pin.x-ball.x,hole.pin.y-ball.y); }
function autoClub(){
  const d=distPin();
  if(game.lie===S.GREEN||(game.lie===S.FRINGE&&d<20)) return PT_I;
  let best=-1; for(let i=0;i<CLUBS.length;i++){ if(i===PT_I||CLUBS[i].carry<d-3) continue; if(best<0||CLUBS[i].carry<CLUBS[best].carry) best=i; }
  return best<0?0:best;
}
function physics(dt){
  if(ball.mode==='air'){
    stepAir(ball,dt,hole.toys&&toyFanWind(ball)||windVec);
    if(hole.toys){ const o=toyHit(ball,true); if(o) toyFx(o.type); }
    if(ball.treeCd>0) ball.treeCd-=dt;
    else if(ball.z>.2){ for(let i=0;i<trees.length;i++){ const t=trees[i]; if(ball.z<t.h+t.r*.5){ const dx=ball.x-t.x, dy=ball.y-t.y; if(dx*dx+dy*dy<t.r*t.r*.8){ const ox=ball.ox-t.x, oy=ball.oy-t.y; if(ox*ox+oy*oy<t.r*t.r&&ball.z<2) continue; hitTree(); break; } } } }
    if(ball.z<=0){ ball.z=0; if(hole.toys&&toySpring(ball,true)) toyFx('spring'); else land(); }
  } else if(ball.mode==='roll') roll(dt);
  ball.t+=dt;
}
let shotRng=mulberry32(1);
function hitTree(){
  const sp=Math.hypot(ball.vx,ball.vy), ang=Math.atan2(ball.vy,ball.vx)+Math.PI+(shotRng()-.5)*1.8, ns=sp*.16;
  ball.vx=Math.cos(ang)*ns; ball.vy=Math.sin(ang)*ns; ball.vz=Math.min(ball.vz,0)*.2; ball.ss=0; ball.sb=0; ball.treeCd=.6;
  emit(16,ball.x,ball.y,ball.z,{spread:6,vz:2,life:1.3,col:['#4f9a4a','#6fb35a','#2f6e3a'],size:.32,g:5});
  sfx('tree'); cam.shake=7; buzz(18);
  toast('木に当たった','','bad');
}
function land(){
  const s=surfaceAt(hole,ball.x,ball.y), vh=Math.hypot(ball.vx,ball.vy), impact=Math.abs(ball.vz);
  if(s===S.WATER){ penalty('water'); return; }
  if(Math.hypot(ball.x-hole.pin.x,ball.y-hole.pin.y)<CUP_R*.9&&vh<26){ holeOut(true); return; }
  const P=SP(s), steep=impact/(impact+vh+1e-6);
  let keep=lerp(P.keep*(1-.6*steep),Math.min(1,P.keep*CHIP.keep),ball.chip);
  const dx=vh?ball.vx/vh:0, dy=vh?ball.vy/vh:0;
  if(ball.bounces===0){ if(ball.sb>0) keep*=1-.5*Math.min(1,ball.sb); else keep=Math.min(.95,keep*(1+.4*(-ball.sb))); }
  ball.vx*=keep; ball.vy*=keep;
  if(ball.bounces===0&&ball.sb>.35){ const back=(ball.sb-.35)*P.grip*14; ball.vx-=dx*back; ball.vy-=dy*back; }
  ball.vz=-ball.vz*P.e; ball.bounces++; ball.ss=0; ball.sb=0;
  landFx(s,ball.x,ball.y,impact);
  if(ball.vz<2.2){ ball.mode='roll'; ball.vz=0; ball.z=0; }
}
function landFx(s,x,y,impact){
  if(s===S.SAND) emit(10+(impact*.6|0),x,y,0,{spread:5,vz:6,life:.8,col:['#e8d6a8','#d9c28e'],size:.2,g:18});
  else if(s===S.ROUGH||s===S.ISLAND||s===S.OB) emit(8,x,y,0,{spread:3.5,vz:4,life:.6,col:['#5f9a46','#80b85c'],size:.15,g:16});
  else if(impact>6) emit(5,x,y,0,{spread:3,vz:3,life:.5,col:['#a7dc7c'],size:.12,g:16});
  sfx('land',s,impact);
}
function prepToy(o){
  if(o._p) return o;
  const t={...TOY_DEF[o.type],...o,_p:true,hitT:-9};
  if(t.type==='fan'){ t.ux=Math.cos(t.dir); t.uy=Math.sin(t.dir); }
  if(t.type==='tunnel') for(const m of [t.a,t.b]){ m.ux=Math.cos(m.dir); m.uy=Math.sin(m.dir); }
  return t;
}
function toyBearPos(o,t){ const u=t<o.t1?easeIO(clamp((t-o.t0)/o.tr,0,1)):1-easeIO(clamp((t-o.t1)/o.tr,0,1)); return {x:lerp(o.x0,o.x1,u),y:lerp(o.y0,o.y1,u),u}; }
function spinAng(o,t){ return o.a0+o.w*t; }
function toyBounce(b,nx,ny,pen,e,mvx,mvy){
  b.x+=nx*pen; b.y+=ny*pen;
  const rvx=b.vx-mvx, rvy=b.vy-mvy, vn=rvx*nx+rvy*ny;
  if(vn>=0) return false;
  b.vx-=(1+e)*vn*nx; b.vy-=(1+e)*vn*ny; b.ss=0; return true;
}
function toySeg(b,ax,ay,bx,by,hw,e,w,cx,cy){
  const ex=bx-ax, ey=by-ay, l2=ex*ex+ey*ey||1e-9, u=clamp(((b.x-ax)*ex+(b.y-ay)*ey)/l2,0,1), px=ax+ex*u, py=ay+ey*u;
  let dx=b.x-px, dy=b.y-py; const d=Math.hypot(dx,dy), R=hw+BALL_R;
  if(d>=R) return false;
  if(d<1e-6){ const l=Math.sqrt(l2); dx=-ey/l; dy=ex/l; } else { dx/=d; dy/=d; }
  const mvx=w?-w*(py-cy):0, mvy=w?w*(px-cx):0;
  return toyBounce(b,dx,dy,R-d,e,mvx,mvy);
}
function toyHit(b,air){
  const T=hole.toys, t=b.t||0;
  for(let i=0;i<T.length;i++){
    const o=T[i]; let hit=false;
    switch(o.type){
      case 'bear': { if(air&&b.z>=o.h) break; const p=toyBearPos(o,t); if(p.u<=.02) break; const dx=b.x-p.x, dy=b.y-p.y, d=Math.hypot(dx,dy), R=o.r+BALL_R; if(d>=R||d<1e-6) break;
        const q=toyBearPos(o,t+.01); hit=toyBounce(b,dx/d,dy/d,R-d,.45,(q.x-p.x)*100,(q.y-p.y)*100); } break;
      case 'bumper': { if(air&&b.z>=o.h) break; const dx=b.x-o.x, dy=b.y-o.y, d=Math.hypot(dx,dy), R=o.r+BALL_R; if(d>=R||d<1e-6) break;
        hit=toyBounce(b,dx/d,dy/d,R-d,.9,0,0); if(hit){ const v=Math.hypot(b.vx,b.vy), nv=Math.min(45,Math.max(8,v*o.k)); b.vx*=nv/(v||1); b.vy*=nv/(v||1); } } break;
      case 'wall': { if(air&&b.z>=o.h) break; const P=o.pts; for(let k=0;k+1<P.length;k++) if(toySeg(b,P[k][0],P[k][1],P[k+1][0],P[k+1][1],o.w/2,o.e,0)) hit=true; } break;
      case 'spinner': { if(air&&b.z>=o.h) break; const a=spinAng(o,t), cx=Math.cos(a)*o.len, cy=Math.sin(a)*o.len; hit=toySeg(b,o.x-cx,o.y-cy,o.x+cx,o.y+cy,.35,.6,o.w,o.x,o.y); } break;
    }
    if(hit){ o.hitT=t; b.lastToy=o; return o; }
  }
  return null;
}
function toyFanWind(b){
  let wx=0, wy=0;
  for(const o of hole.toys){ if(o.type!=='fan'||b.z>16) continue; const dx=b.x-o.x, dy=b.y-o.y, u=dx*o.ux+dy*o.uy, v=-dx*o.uy+dy*o.ux; if(u<0||u>o.len||Math.abs(v)>o.w/2) continue; const f=o.v*(1-.5*u/o.len); wx+=o.ux*f; wy+=o.uy*f; }
  return wx||wy?{x:windVec.x+wx,y:windVec.y+wy}:null;
}
function toySpring(b,air){
  for(const o of hole.toys){ if(o.type!=='spring') continue; const d=Math.hypot(b.x-o.x,b.y-o.y); if(d>=o.r){ if(b.onSpring===o) b.onSpring=null; continue; }
    if(!air&&b.onSpring===o) continue;
    b.onSpring=o; b.z=.02; b.vz=air?Math.max(o.vz,-b.vz*.6):o.vz*.7; b.vx*=.9; b.vy*=.9; b.bounces=0; o.hitT=b.t||0; return true; }
  return false;
}
function toyTunnel(b){
  for(const o of hole.toys){ if(o.type!=='tunnel') continue;
    for(const [m,n] of [[o.a,o.b],[o.b,o.a]]){ const dx=b.x-m.x, dy=b.y-m.y; if(dx*dx+dy*dy>=o.r*o.r||b.vx*m.ux+b.vy*m.uy>=0) continue;
      const sp=Math.max(3,Math.hypot(b.vx,b.vy)*.85); b.tun={t:.45,vx:n.ux*sp,vy:n.uy*sp}; b.x=n.x+n.ux*.3; b.y=n.y+n.uy*.3; b.vx=b.vy=0; o.hitT=b.t||0; return true; } }
  return false;
}
function rollStep(b,dt){
  if(b.tun){ b.tun.t-=dt; if(b.tun.t>0) return null; b.vx=b.tun.vx; b.vy=b.tun.vy; b.tun=null; }
  const s=surfaceAt(hole,b.x,b.y);
  if(s===S.WATER) return 'water';
  const P=SP(s), gr=gradAt(b.x,b.y), ax=-SLOPE_G*gr.x, ay=-SLOPE_G*gr.y, f=P.mu*G;
  let sp=Math.hypot(b.vx,b.vy), ev=null;
  const dxc=b.x-hole.pin.x, dyc=b.y-hole.pin.y, dc=Math.hypot(dxc,dyc), A=b.putt&&hole.assist, cr=A?PUTT.capR:CUP_R;
  if(b.lipCd>0) b.lipCd-=dt;
  if(dc<cr&&b.lipCd<=0&&!b.nocup){
    const q=dc/cr, thr=A?PUTT.capV*(1-.35*q*q):10*(1-.55*q*q);
    if(sp<thr) return 'holed';
    const ang=Math.atan2(b.vy,b.vx), dev=.25+.5*q, a1=ang+dev, a2=ang-dev, ox=dc?dxc/dc:0, oy=dc?dyc/dc:0;
    const na=(Math.cos(a1)*ox+Math.sin(a1)*oy)>=(Math.cos(a2)*ox+Math.sin(a2)*oy)?a1:a2, ns=sp*.7;
    b.vx=Math.cos(na)*ns; b.vy=Math.sin(na)*ns; b.lipCd=.3; b.lipped=true; ev='lip';
  }
  b.vx+=ax*dt; b.vy+=ay*dt;
  sp=Math.hypot(b.vx,b.vy);
  if(sp>1e-6){ const dec=Math.min(sp,f*dt); b.vx-=b.vx/sp*dec; b.vy-=b.vy/sp*dec; }
  b.x+=b.vx*dt; b.y+=b.vy*dt;
  if(hole.toys){ if(toySpring(b,false)) return 'spring'; if(toyTunnel(b)) return 'tunnel'; if(toyHit(b,false)) ev='toy'; }
  sp=Math.hypot(b.vx,b.vy);
  if(sp<.18&&Math.hypot(ax,ay)<f*.95) return 'rest';
  if(sp<1e-6&&Math.hypot(ax,ay)<f) return 'rest';
  return ev;
}
function cupNear(b){ return Math.hypot(b.x-hole.pin.x,b.y-hole.pin.y)<(b.putt&&hole.assist?PUTT.capR:CUP_R*1.1); }
function roll(dt){
  const ev=rollStep(ball,dt);
  if(ev==='water'){ penalty('water'); return; }
  if(ev==='holed'){ holeOut(false); return; }
  if(ev==='lip') sfx('lip');
  else if(ev==='rest') rest();
  else if(ev==='spring'){ ball.mode='air'; toyFx('spring'); }
  else if(ev==='tunnel') toyFx('tunnel');
  else if(ev==='toy') toyFx(ball.lastToy?ball.lastToy.type:'wall');
}
function rest(){
  ball.mode='rest'; ball.vx=ball.vy=0;
  if(cupNear(ball)){ holeOut(false); return; }
  const s=surfaceAt(hole,ball.x,ball.y);
  if(s===S.OB){ penalty('ob'); return; }
  if(s===S.WATER){ penalty('water'); return; }
  game.state='settle'; setBottomMode('idle');
  if(s===S.GREEN&&game.lieAtShot!==S.GREEN&&game.lieAtShot!==S.FRINGE) toast('ナイスオン!','','');
  else if(ball.lipped) toast('おしい!','カップに蹴られた','');
  else if(s===S.SAND&&game.lieAtShot!==S.SAND) toast('バンカー','','bad');
  if(game.strokes>=holeLimit()){ schedule(1,fail); return; }
  schedule(.75,prepareShot);
}
function holeLimit(){ return WEB?WEB.limit(hole):hole.par; }
function holeOut(dunk){
  game.state='holed'; ball.sinkFrom={x:ball.x,y:ball.y}; ball.mode='holed'; ball.holedT=0; ball.vx=ball.vy=ball.vz=0; ball.z=0;
  const st=game.strokes, gold=st<=hole.gold;
  game.cleared=true; game.last=st; if(!WEB||st<=hole.par) saveBest(st);
  const fromOff=game.lieAtShot!==S.GREEN&&game.lieAtShot!==S.FRINGE&&st>1;
  const how=fromOff?(dunk?'ダイレクトでカップイン':'チップイン'):`${st}打でカップイン`, headed=WEB&&WEB.holedTitle(st,hole);
  toast(headed||(gold?'金!':'クリア!'), headed?how:scoreName(st,hole.par)+' · '+how,'big');
  sfx('cup'); schedule(.3,()=>{ if(!(gold&&jingle())) sfx('clap'); });
  emit(gold?60:44,hole.pin.x,hole.pin.y,.3,{spread:7,vz:10,life:1.7,col:gold?['#ffffff','#f2c14e','#e8a71c','#fff1b8']:['#ffffff','#e23f2c','#f2c14e','#9fe0ff'],size:.24,g:11});
  buzz(35); updateScoreHud(); setBottomMode('idle');
  schedule(2.7,showResult);
}
function penalty(kind){
  game.state='penalty'; setBottomMode('idle');
  if(kind==='water'){ splash(ball.x,ball.y); sfx('splash'); toast('池ポチャ',hole.drop?'1打罰 · ドロップゾーンから':'1打罰 · 元の場所から打ち直し','bad'); }
  else { sfx('lip'); toast('OB','1打罰 · 元の場所から打ち直し','bad'); }
  ball.mode='gone'; game.strokes+=1; updateScoreHud(); buzz(20);
  schedule(1.7,()=>{ if(game.strokes>=holeLimit()){ fail(); return; } const p=(kind==='water'&&hole.drop)?hole.drop:game.lastPos; placeBall(p); prepareShot(); });
}
function fail(){
  game.state='over'; game.cleared=false; game.last=null; setBottomMode('idle');
  const failed=(WEB&&WEB.failText(hole))||['失敗',`パー${hole.par}以内に入らなかった`];
  toast(failed[0],failed[1],'bad'); buzz(20);
  schedule(1.6,showResult);
}
function splash(x,y){
  emit(26,x,y,0,{spread:6,vz:9,life:.9,col:['#d8eef0','#ffffff','#a8d6e0'],size:.2,g:22});
  for(let k=0;k<3;k++) ripples.push({x,y,r:.3,life:-k*.25,max:1.8});
}
function placeBall(p){ ball.x=p.x; ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; ball.mode='rest'; ball.bounces=0; }
function scoreName(st,par){ if(st===1) return 'ホールインワン'; const d=st-par; return ({'-3':'アルバトロス','-2':'イーグル','-1':'バーディー','0':'パー','1':'ボギー','2':'ダブルボギー','3':'トリプルボギー'})[d]||('+'+d); }
function shoot(){
  const c=CLUBS[game.club], st=launchState(aim.dir,aim.power,null,game.spin);
  if(WEB) WEB.onShot(game.club,aim.dir,aim.power,game.spin,ball.x,ball.y);
  game.lastPos={x:ball.x,y:ball.y}; game.lieAtShot=game.lie; game.strokes++; updateScoreHud();
  rear.lockYaw=rear.u>0?wrapA(cam3.yaw-rear.yawOff):angTo(ball.x,ball.y,hole.pin.x,hole.pin.y,-Math.PI/2);
  shotRng=mulberry32(hole.seed*1009+game.strokes*7919);
  Object.assign(ball,{vx:st.vx,vy:st.vy,vz:st.vz,ss:st.ss,sb:st.sb,chip:st.chip,bounces:0,treeCd:0,ox:ball.x,oy:ball.y,lipCd:0,lipped:false,putt:c.id==='PT',t:0,tun:null,onSpring:null,lastToy:null});
  tracer.length=0; tracerA=1;
  if(c.id==='PT'){ ball.mode='roll'; ball.z=0; ball.vz=0; game.state='roll'; setBottomMode('idle'); game.hints.putt++; }
  else {
    ball.mode='air'; ball.z=.02; game.state='flight'; setBottomMode('idle'); if(game.hints.aim>=2) game.hints.near++; game.hints.aim++;
    if(game.lie===S.SAND) emit(22,ball.x,ball.y,0,{spread:5,vz:7,life:.9,col:['#e8d6a8','#d9c28e'],size:.22,g:18,vx:st.vx*.08,vy:st.vy*.08});
    else emit(6,ball.x,ball.y,0,{spread:2.5,vz:4,life:.6,col:['#5f9a46','#a7dc7c'],size:.15,g:16,vx:st.vx*.05,vy:st.vy*.05});
  }
  Object.assign(flyY,{on:c.id!=='PT',carry:0,run:0,ran:false,t:FLY_Y.hold,a:0,r:0});
  sfx('hit',c.id,aim.power); buzz(c.id==='PT'?6:14);
  aim.active=false; aim.preview=null; updateHint();
}
function setSpin(side,back){
  const m=Math.hypot(side,back); if(m>1){ side/=m; back/=m; }
  game.spin={side,back}; updateSpinHud();
}
function newWind(){ const w=hole.wind; wind.dir=w.dir; wind.speed=w.speed; windVec.x=Math.cos(wind.dir)*wind.speed; windVec.y=Math.sin(wind.dir)*wind.speed; updateWindHud(); }
function beginHole(i,quick){
  game.seq++; schedules=[]; game.hole=i; toastTimer=0; $('toast').className='';
  $('card').hidden=true; $('title').hidden=true; $('select').hidden=true; $('intro').hidden=true;
  aim.active=false; aim.id=null; aim.preview=null;
  const go=()=>{
    if(hole!==LIST[i]||!course) loadHole(i);
    game.strokes=0; game.cleared=false; game.hints.putt=Math.min(game.hints.putt,1);
    placeBall(hole.tee); game.lie=surfaceAt(hole,ball.x,ball.y); game.lieAtShot=game.lie;
    newWind(); updateHoleHud(); updateScoreHud();
    if(WEB&&WEB.onHoleReady()) return;
    if(quick){ computeCarries(); prepareShot(); } else startIntro();
  };
  if(hole===LIST[i]&&course) go();
  else { game.state='loading'; $('loading').hidden=false; setTimeout(()=>{ go(); $('loading').hidden=true; },40); }
}
function startIntro(){
  game.state='intro'; setBottomMode('idle'); updateHint();
  $('inNo').textContent=game.hole+1; $('inName').textContent=hole.name; $('inPar').textContent='PAR '+hole.par; $('inGold').textContent='金 '+hole.gold; $('inYd').textContent=hole.yards+'Y'; $('inTip').textContent=hole.tip;
  if(WEB) WEB.afterIntro();
  $('intro').hidden=false;
  const g=hole.green, t=fit([[g.cx-g.rx-10,g.cy-g.ry-10],[g.cx+g.rx+10,g.cy+g.ry+10]],20,2,10);
  cam.x=t.x; cam.y=t.y; cam.s=t.s;
  rear.yawOff=0; rear.zoom=1;
  if(rear.on){ const y3=angTo(hole.tee.x,hole.tee.y,hole.pin.x,hole.pin.y,-Math.PI/2), t3=fit3([[g.cx-g.rx-10,g.cy-g.ry-10],[g.cx+g.rx+10,g.cy+g.ry+10],[g.cx-g.rx-10,g.cy+g.ry+10],[g.cx+g.rx+10,g.cy-g.ry-10]],20,2,10,y3); Object.assign(cam3,t3); rear.u=1; rear.k=1; }
  computeCarries(); game.club=autoClub(); updateClubsHud(); updateLieHud();
  const seq=game.seq; schedule(3.6,()=>{ if(game.seq===seq) endIntro(); });
}
function endIntro(){ if(game.state!=='intro') return; $('intro').hidden=true; prepareShot(); }
function prepareShot(){
  game.state='aim'; ball.mode='rest'; ball.z=0; ball.vx=ball.vy=ball.vz=0; rear.lockYaw=null; rear.yawOff=0; rear.zoom=1; updateCamReset();
  game.lie=surfaceAt(hole,ball.x,ball.y); setSpin(0,0);
  computeCarries(); setClub(autoClub(),false);
  game.overview=false; $('viewBtn').setAttribute('aria-pressed','false');
  updateLieHud(); updateScoreHud(); setBottomMode('aim'); updateHint();
  if(WEB) WEB.onAim();
}
function setClub(i,snd){ game.club=i; updateClubsHud(); updateHint(); if(snd) sfx('ui'); }
function updateSpinPanel(){ const on=CLUBS[game.club].id==='PT'?'off':'on', b=$('bottom'); if(b.dataset.spin!==on){ b.dataset.spin=on; requestAnimationFrame(measureHud); } }
const FLAG_SVG='<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M6 2.5v15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 3.2c3.5.7 6 1.8 9.5 3.6-3.5 1.7-6 2.8-9.5 3.6z" fill="#e23f2c"/></svg>';
const GOLD_SVG='<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#f2c14e" stroke="#b07a12" stroke-width="1.6"/><path d="M10 5.2l1.4 3 3.2.3-2.4 2.1.7 3.2-2.9-1.7-2.9 1.7.7-3.2-2.4-2.1 3.2-.3z" fill="#fff6dc"/></svg>';
const LOCK_SVG='<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="4" y="9" width="12" height="8.5" rx="2" fill="#5b7569"/><path d="M6.8 9V6.6a3.2 3.2 0 0 1 6.4 0V9" fill="none" stroke="#5b7569" stroke-width="2"/></svg>';
function bestOf(i){ const h=LIST[i]; return h?game.best[h.id]:null; }
function stageState(i){ const b=bestOf(i), h=LIST[i]; if(b!=null) return b<=h.gold?'gold':'clear'; return (WEB||i===0||bestOf(i-1)!=null)?'open':'locked'; }
function showResult(){
  game.state='card';
  if(WEB&&WEB.showResult()) return;
  const ok=game.cleared, st=game.last, b=bestOf(game.hole), last=game.hole>=LIST.length-1;
  const gold=ok&&st<=hole.gold;
  $('cardKicker').textContent=`HOLE ${game.hole+1} · ${hole.name}`;
  const h2=$('cardTitle'); h2.textContent=ok?(gold?'金!':'クリア!'):'失敗'; h2.className=ok?(gold?'gold':''):'fail';
  $('cardSub').textContent=ok?`${scoreName(st,hole.par)} · ${st}打でカップイン`:`パー${hole.par}以内にカップに入らなかった`;
  const pass=b!=null, gb=b!=null&&b<=hole.gold;
  $('mdPass').className='medal'+(pass?' on':''); $('mdPass').innerHTML=FLAG_SVG+`合格 · パー${hole.par}`;
  $('mdGold').className='medal gold'+(gb?' on':''); $('mdGold').innerHTML=GOLD_SVG+`金 · ${hole.gold}打`;
  $('cardBest').textContent=b!=null?`自己ベスト ${b}打`:'まだ合格していない';
  const next=$('nextBtn');
  if(ok&&!last){ next.hidden=false; next.textContent='次のホールへ'; }
  else if(ok){ next.hidden=false; next.textContent='ホールを選ぶ'; }
  else { next.hidden=false; next.textContent='もう一度'; }
  $('retryBtn').hidden=!ok; $('retryBtn').textContent=gold?'もう一度':'金をねらう';
  $('card').hidden=false;
  if(ok&&!last) setTimeout(()=>{ try{ prebuild(game.hole+1); }catch(e){} },450);
  setTimeout(()=>{ try{ next.focus({preventScroll:true}); }catch(e){} },50);
}
function showSelect(){
  game.seq++; schedules=[]; game.state='select'; setBottomMode('idle'); toastTimer=0; $('toast').className='';
  aim.active=false; aim.id=null; aim.preview=null;
  $('card').hidden=true; $('title').hidden=true; $('intro').hidden=true;
  const tabs=$('ctabs'); tabs.innerHTML=''; tabs.hidden=COURSES.length<2;
  COURSES.forEach((c,k)=>{
    const t=document.createElement('button'); t.type='button'; t.className='ctab'; t.setAttribute('aria-pressed',String(k===courseNo));
    const nc=c.holes.filter(h=>game.best[h.id]!=null).length;
    t.innerHTML=`<b>${c.name}<i class="lv" data-lv="${c.level}">${c.level}</i></b><span>${c.sub} · ${nc}/${c.holes.length}</span>`;
    t.addEventListener('click',()=>{ if(k===courseNo) return; sfx('ui'); setCourse(k); showSelect(); });
    tabs.appendChild(t);
  });
  const el=$('stages'); el.innerHTML='';
  let nc=0, ng=0;
  LIST.forEach((h,i)=>{
    const st=stageState(i); if(st==='clear'||st==='gold') nc++; if(st==='gold') ng++;
    const b=document.createElement('button'); b.type='button'; b.className='stage'; b.dataset.state=st; b.setAttribute('role','listitem');
    const mark=st==='gold'?GOLD_SVG:st==='clear'?FLAG_SVG:st==='locked'?LOCK_SVG:'';
    b.innerHTML=`<b class="st-no">${i+1}</b><span class="st-name">${h.name}</span><span class="st-par">PAR ${h.par} · 金 ${h.gold}</span><i class="st-mark">${mark}</i>`;
    b.setAttribute('aria-label',`${i+1}番 ${h.name} パー${h.par}`+(st==='locked'?' まだ遊べない':st==='gold'?' 金':st==='clear'?' 合格':''));
    if(st==='locked') b.disabled=true;
    else b.addEventListener('click',()=>{ initAudio(); sfx('ui'); beginHole(i); });
    el.appendChild(b);
  });
  $('selKicker').textContent=`クリア ${nc}/${LIST.length} · 金 ${ng}`;
  $('select').hidden=false;
}
const SAVE_KEY='hakoniwa-golf-puzzle-1';
function loadSave(){ try{ const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'); if(d&&typeof d.best==='object'&&d.best) game.best=d.best; }catch(e){} }
function saveBest(st){ const id=hole.id, b=game.best[id]; if(b==null||st<b) game.best[id]=st; try{ localStorage.setItem(SAVE_KEY,JSON.stringify({best:game.best})); }catch(e){} }
function emit(n,x,y,z,o){
  for(let i=0;i<n;i++){ const a=rand()*TAU, r=rand()*o.spread; const cols=o.col; parts.push({x,y,z,vx:Math.cos(a)*r+(o.vx||0),vy:Math.sin(a)*r+(o.vy||0),vz:o.vz*(.5+rand()),life:0,max:o.life*(.6+.8*rand()),col:cols[(rand()*cols.length)|0],size:o.size*(.6+.8*rand()),g:o.g}); }
  if(parts.length>500) parts.splice(0,parts.length-500);
}
function updateParticles(dt){
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.vz-=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; if(p.z<0){ p.z=0; p.vz*=-.25; p.vx*=.5; p.vy*=.5; } p.life+=dt; if(p.life>p.max) parts.splice(i,1); }
  for(let i=ripples.length-1;i>=0;i--){ const r=ripples[i]; r.life+=dt; if(r.life>0) r.r+=dt*3.2; if(r.life>r.max) ripples.splice(i,1); }
}
function onGreenish(){ const s=surfaceAt(hole,ball.x,ball.y); return s===S.GREEN||s===S.FRINGE; }
function updateFlow(dt){
  const want=(game.state==='aim'&&CLUBS[game.club].id==='PT')||(game.state==='roll'&&game.lieAtShot!==undefined&&CLUBS[game.club].id==='PT');
  flowAlpha=clamp(flowAlpha+(want?dt*2:-dt*2.5),0,1);
  if(flowAlpha<=0){ flow.length=0; return; }
  const g=hole.green, R=Math.max(g.rx,g.ry);
  let guard=0;
  while(flow.length<110&&guard<400){ guard++; const x=g.cx+(rand()*2-1)*R, y=g.cy+(rand()*2-1)*R; if(sdEllipse(g,x,y)<-.3) flow.push({x,y,vx:0,vy:0,life:rand()*.5,max:1.4+rand()*1.6}); }
  for(let i=flow.length-1;i>=0;i--){ const p=flow[i], gr=gradAt(p.x,p.y); p.vx=-gr.x*140; p.vy=-gr.y*140; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life+=dt; if(p.life>p.max||sdEllipse(g,p.x,p.y)>.4) flow.splice(i,1); }
}
function updateAmbient(dt){
  for(const k of koi) k.s+=k.sp*dt;
  const vr=visRect(rear.shown);
  for(const p of specks){
    p.x+=(windVec.x*1.4+Math.sin(now*1.3+p.ph)*.6)*dt; p.y+=(windVec.y*1.4+Math.cos(now*1.1+p.ph)*.6)*dt;
    if(p.init||p.x<vr.x0-6||p.x>vr.x1+6||p.y<vr.y0-6||p.y>vr.y1+6){ p.init=false; p.x=lerp(vr.x0,vr.x1,rand()); p.y=lerp(vr.y0,vr.y1,rand()); }
  }
  birdT-=dt;
  if(birdT<=0&&hole){ birdT=12+rand()*12; const side=rand()<.5?-1:1, y=lerp(vr.y0,vr.y1,.2+rand()*.6), x=side<0?vr.x0-25:vr.x1+25, vx=-side*(9+rand()*3), vy=(rand()-.5)*3; for(let k=0;k<4;k++) birds.push({x:x+k*3.2*side,y:y+(k%2?1:-1)*Math.ceil(k/2)*2.2,z:24+rand()*5,vx,vy,ph:rand()*TAU}); }
  for(let i=birds.length-1;i>=0;i--){ const b=birds[i]; b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.x<vr.x0-90||b.x>vr.x1+90) birds.splice(i,1); }
}
function frameRect(){ return {x:0,y:view.top,w:view.W,h:Math.max(90,view.H-view.top-view.bot)}; }
function fit(pts,pad,sMin,sMax){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const p of pts){ if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<y0)y0=p[1]; if(p[1]>y1)y1=p[1]; }
  const r=frameRect(), padX=Math.min(pad,r.w*.3), padY=Math.min(pad,r.h*.3);
  const s=clamp(Math.min((r.w-2*padX)/Math.max(x1-x0,.01),(r.h-2*padY)/Math.max(y1-y0,.01)),sMin,sMax);
  return {x:(x0+x1)/2,y:(y0+y1)/2,s};
}
function overviewTarget(){ const B=hole.bounds; return fit([[B.x0+6,B.y0+6],[B.x1-6,B.y1-4]],10,.5,8); }
function aimTarget(){
  if(game.overview) return overviewTarget();
  const c=CLUBS[game.club], bx=ball.x, by=ball.y, dpx=hole.pin.x-bx, dpy=hole.pin.y-by, d=Math.hypot(dpx,dpy)||1;
  if(c.id==='PT'){ const pts=[[bx,by],[hole.pin.x,hole.pin.y]]; if(aim.active&&aim.preview) pts.push([aim.preview.land.x,aim.preview.land.y]); return fit(pts,64,5,16); }
  const reach=Math.min(c.carry||100,d+8), ux=dpx/d, uy=dpy/d;
  const pts=[[bx,by],[bx+ux*reach,by+uy*reach],[bx+ux*reach*.5,by+uy*reach*.5-16*TILT]];
  if(d<reach+25) pts.push([hole.pin.x,hole.pin.y]);
  if(aim.active&&aim.preview&&!aim.preview.putt&&aimShown()){ pts.push([aim.preview.land.x,aim.preview.land.y]); pts.push([aim.preview.apx,aim.preview.apy]); }
  return fit(pts,46,1.2,9);
}
function flightTarget(){ const pts=[[ball.x,ball.y],[ball.x,ball.y-ball.z*TILT]]; if(pred) pts.push([pred.land.x,pred.land.y]); return fit(pts,76,1.2,8); }
function rollTarget(){
  const dc=distPin(), sp=Math.hypot(ball.vx,ball.vy);
  if(game.ts<.7&&dc<4) return fit([[ball.x,ball.y],[hole.pin.x,hole.pin.y]],90,10,20);
  const pts=[[ball.x,ball.y],[ball.x+ball.vx*.7,ball.y+ball.vy*.7]];
  if(dc<30) pts.push([hole.pin.x,hole.pin.y]);
  return fit(pts,80,2.5,(onGreenish()||sp<1)?17:10);
}
function holedTarget(){ const p=hole.pin; return fit([[p.x-2.4,p.y-2.4],[p.x+2.4,p.y+2.4]],40,10,18); }
function updateCam(dt){
  let t=null, rate=3;
  if(!hole) return;
  switch(game.state){
    case 'title': case 'select': { const o=overviewTarget(); t={x:o.x+Math.sin(now*.12)*8,y:o.y+Math.cos(now*.09)*12,s:o.s*1.15}; rate=.5; break; }
    case 'intro': t=aimTarget(); rate=.75; break;
    case 'aim': t=aimTarget(); rate=aim.active?1.4:3; break;
    case 'flight': t=flightTarget(); rate=2.6; break;
    case 'roll': case 'settle': t=rollTarget(); rate=2.4; break;
    case 'holed': t=holedTarget(); rate=2.2; break;
    case 'card': if(game.cleared){ t=holedTarget(); rate=.8; } break;
  }
  if(t){ const k=1-Math.exp(-dt*rate); cam.x+=(t.x-cam.x)*k; cam.y+=(t.y-cam.y)*k; cam.s=Math.exp(lerp(Math.log(cam.s),Math.log(t.s),k)); }
  const r=frameRect(), k2=1-Math.exp(-dt*5); camR.cx+=(r.x+r.w/2-camR.cx)*k2; camR.cy+=(r.y+r.h/2-camR.cy)*k2;
  if(cam.shake>0&&!reduceMotion){ cam.shake=Math.max(0,cam.shake-dt*22); cam.ox=(rand()-.5)*cam.shake; cam.oy=(rand()-.5)*cam.shake; } else { cam.shake=0; cam.ox=cam.oy=0; }
}
const SX=x=>(x-cam.x)*cam.s+camR.cx+cam.ox;
const SY=(y,z)=>(y-cam.y)*cam.s+camR.cy-(z||0)*TILT*cam.s+cam.oy;
const WX=px=>(px-camR.cx-cam.ox)/cam.s+cam.x;
const WY=py=>(py-camR.cy-cam.oy)/cam.s+cam.y;
function visRect(rearView){ if(rearView===undefined?drawRear:rearView) return visRect3(); return {x0:WX(0),x1:WX(view.W),y0:WY(0),y1:WY(view.H)}; }
function rearF(){ return view.H*.5/Math.tan(REAR.fov*.5); }
function wrapA(a){ return Math.atan2(Math.sin(a),Math.cos(a)); }
function angTo(ax,ay,bx,by,fb){ const dx=bx-ax, dy=by-ay; return dx*dx+dy*dy>1?Math.atan2(dy,dx):fb; }
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function setPose(p){
  const cp=Math.cos(p.pitch), sp=Math.sin(p.pitch), gx=Math.cos(p.yaw), gy=Math.sin(p.yaw);
  pv.fx=cp*gx; pv.fy=cp*gy; pv.fz=-sp; pv.rx=-gy; pv.ry=gx; pv.ux=sp*gx; pv.uy=sp*gy; pv.uz=cp;
  pv.Cx=p.x-pv.fx*p.d; pv.Cy=p.y-pv.fy*p.d; pv.Cz=sp*p.d; pv.d=p.d; pv.F=p.F; pv.yaw=p.yaw;
  pv.pcx=camR.cx+cam.ox; pv.pcy=camR.cy+cam.oy;
  const lx=-SUN.x*pv.rx-SUN.y*pv.ry, ly=SUN.x*pv.ux+SUN.y*pv.uy-pv.uz;
  pv.lightRot=Math.atan2(ly,lx)-Math.atan2(-SUN.y,-SUN.x);
}
function rearPose(){
  const F=rearF(), k=rear.k;
  if(k>=1||reduceMotion) return {x:cam3.x,y:cam3.y,d:cam3.d,yaw:cam3.yaw,pitch:cam3.pitch,F};
  const Fm=F*REAR.mimicF, dm=Fm/cam.s;
  return {x:lerp(cam.x,cam3.x,k),y:lerp(cam.y,cam3.y,k),d:Math.exp(lerp(Math.log(dm),Math.log(cam3.d),k)),
    yaw:-Math.PI/2+wrapA(cam3.yaw+Math.PI/2)*k,pitch:lerp(REAR.mimicPitch,cam3.pitch,k),F:Math.exp(lerp(Math.log(Fm),Math.log(F),k))};
}
function groundAt(sx,sy){
  const X=(sx-pv.pcx)/pv.F, Y=-(sy-pv.pcy)/pv.F, dx=pv.fx+pv.rx*X+pv.ux*Y, dy=pv.fy+pv.ry*X+pv.uy*Y, dz=pv.fz+pv.uz*Y;
  if(dz>-1e-4) return null;
  const t=-pv.Cz/dz; return {x:pv.Cx+dx*t,y:pv.Cy+dy*t,t};
}
function visRect3(){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const add=(x,y)=>{ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; };
  for(const [sx,sy] of [[0,0],[view.W,0],[0,view.H],[view.W,view.H]]){ const g=groundAt(sx,sy); if(g) add(g.x,g.y); else add(pv.Cx+pv.fx/Math.hypot(pv.fx,pv.fy)*1200,pv.Cy+pv.fy/Math.hypot(pv.fx,pv.fy)*1200); }
  return {x0,x1,y0,y1};
}
function fit3(pts,pad,sMin,sMax,yaw,pitch){
  if(pitch==null) pitch=rear.pitch;
  const r=frameRect(), padX=Math.min(pad,r.w*.3), padY=Math.min(pad,r.h*.3), aw=r.w-2*padX, ah=r.h-2*padY;
  const F=rearF(), cp=Math.cos(pitch), sp=Math.sin(pitch), gx=Math.cos(yaw), gy=Math.sin(yaw);
  const fx=cp*gx, fy=cp*gy, fz=-sp, rx=-gy, ry=gx, ux=sp*gx, uy=sp*gy, uz=cp, dMin=F/sMax, dMax=F/sMin;
  let x=0, y=0; for(const p of pts){ x+=p[0]; y+=p[1]; } x/=pts.length; y/=pts.length;
  let d=clamp(cam3.d,dMin,dMax);
  for(let it=0;it<14;it++){
    const Cx=x-fx*d, Cy=y-fy*d, Cz=sp*d;
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9, bad=false;
    for(const p of pts){
      const dx=p[0]-Cx, dy=p[1]-Cy, dz=(p[2]||0)-Cz, cz=dx*fx+dy*fy+dz*fz;
      if(cz<REAR.near*4){ bad=true; break; }
      const s=F/cz, X=(dx*rx+dy*ry)*s, Y=-(dx*ux+dy*uy+dz*uz)*s;
      if(X<x0)x0=X; if(X>x1)x1=X; if(Y<y0)y0=Y; if(Y>y1)y1=Y;
    }
    if(bad){ d=Math.min(d*1.5,dMax); continue; }
    const s0=F/d, ox=(x0+x1)/2, oy=(y0+y1)/2;
    x+=(rx*ox/s0-gx*oy/(s0*sp))*.8; y+=(ry*ox/s0-gy*oy/(s0*sp))*.8;
    d=clamp(d*Math.pow(Math.max((x1-x0)/aw,(y1-y0)/ah,.05),.8),dMin,dMax);
  }
  return {x,y,d:d*rear.zoom,yaw,pitch};
}
function rearTarget(){
  const st=game.state;
  if(st==='aim'||st==='intro'){
    if(st==='aim'&&game.overview){ const B=hole.bounds; return fit3([[B.x0+6,B.y0+6],[B.x1-6,B.y0+6],[B.x0+6,B.y1-4],[B.x1-6,B.y1-4]],10,.4,8,angTo(hole.tee.x,hole.tee.y,hole.pin.x,hole.pin.y,-Math.PI/2)+rear.yawOff); }
    const c=CLUBS[game.club], to=angTo(ball.x,ball.y,hole.pin.x,hole.pin.y,null), bx=ball.x, by=ball.y, d=distPin();
    const ua=to==null?wrapA(cam3.yaw-rear.yawOff):to, yaw=ua+rear.yawOff;
    if(c.id==='PT'){ const pts=[[bx,by],[hole.pin.x,hole.pin.y]]; if(aim.active&&aim.preview) pts.push([aim.preview.land.x,aim.preview.land.y]); return fit3(pts,64,3,11,yaw); }
    const reach=Math.min(c.carry||100,d+8), ux=Math.cos(ua), uy=Math.sin(ua);
    const pts=[[bx,by],[bx+ux*reach,by+uy*reach],[bx+ux*reach*.5,by+uy*reach*.5,16]];
    if(d<reach+25) pts.push([hole.pin.x,hole.pin.y]);
    if(aim.active&&aim.preview&&!aim.preview.putt&&aimShown()){ const p=aim.preview; pts.push([p.land.x,p.land.y]); pts.push([p.apx,p.apy+p.apex*TILT,p.apex]); }
    return fit3(pts,46,1,9,yaw);
  }
  const yaw=(rear.lockYaw!=null?rear.lockYaw:wrapA(cam3.yaw-rear.yawOff))+rear.yawOff;
  switch(st){
    case 'flight': { const pts=[[ball.x,ball.y],[ball.x,ball.y,ball.z]]; if(pred) pts.push([pred.land.x,pred.land.y]); return fit3(pts,76,1,5,yaw); }
    case 'roll': case 'settle': {
      const dc=distPin(), sp=Math.hypot(ball.vx,ball.vy);
      if(game.ts<.7&&dc<4) return fit3([[ball.x,ball.y],[hole.pin.x,hole.pin.y]],90,8,14,yaw);
      const pts=[[ball.x,ball.y],[ball.x+ball.vx*.7,ball.y+ball.vy*.7]];
      if(dc<30) pts.push([hole.pin.x,hole.pin.y]);
      return fit3(pts,80,2,(onGreenish()||sp<1)?11:6,yaw);
    }
    case 'holed': return holedTarget3(yaw);
    case 'card': if(game.cleared) return holedTarget3(yaw); break;
  }
  return null;
}
function aimDir3(ux,uy){
  const b=pj3(ball.x,ball.y,0); if(!b) return null;
  for(const L of [40,12]){ const g=groundAt(b.x+ux*L,b.y+uy*L); if(!g) continue; const dx=g.x-ball.x, dy=g.y-ball.y, l=Math.hypot(dx,dy); if(l>1e-6) return {x:dx/l,y:dy/l}; }
  return null;
}
function holedTarget3(yaw){ const p=hole.pin; return fit3([[p.x-2.4,p.y-2.4],[p.x+2.4,p.y+2.4],[p.x,p.y,POLE_H]],40,8,12,yaw); }
const REAR_STATES=new Set(['intro','aim','flight','roll','settle','holed','penalty','over','card','loading']);
function updateCam3(dt){
  const want=rear.on&&REAR_STATES.has(game.state);
  const was=rear.u;
  rear.orbitT+=dt;
  rear.u=clamp(rear.u+(want?dt:-dt)/(reduceMotion?REAR.swapReduced:REAR.swap),0,1);
  rear.k=easeIO(rear.u);
  if(!hole||(rear.u<=0&&!want)) return;
  const t=rearTarget();
  if(!t) return;
  if(was<=0){ cam3.x=t.x; cam3.y=t.y; cam3.d=t.d; cam3.yaw=t.yaw; cam3.pitch=t.pitch; return; }
  let rate=3;
  switch(game.state){ case 'intro': rate=.75; break; case 'aim': rate=aim.active?1.4:3; break; case 'flight': rate=2.6; break; case 'roll': case 'settle': rate=2.4; break; case 'holed': rate=2.2; break; case 'card': rate=.8; break; }
  if(rear.orbitT<.3) rate=Math.max(rate,REAR.orbitRate);
  const k=1-Math.exp(-dt*rate);
  cam3.x+=(t.x-cam3.x)*k; cam3.y+=(t.y-cam3.y)*k; cam3.d=Math.exp(lerp(Math.log(cam3.d),Math.log(t.d),k)); cam3.yaw=wrapA(cam3.yaw+wrapA(t.yaw-cam3.yaw)*k); cam3.pitch+=(t.pitch-cam3.pitch)*k;
}
let windYawShown=-Math.PI/2;
function setWindYaw(yaw){ if(Math.abs(wrapA(yaw-windYawShown))<.004) return; windYawShown=yaw; updateWindArrow(); }
function updateWindArrow(){ $('windArrow').style.transform=`rotate(${wind.dir-windYawShown-Math.PI/2}rad)`; }
function setRear(on,snd){
  rear.on=on; $('rearBtn').setAttribute('aria-pressed',String(on));
  if(snd) sfx('ui');
  updateCamReset(); updateHint();
}
let camResetShown=false;
function updateCamReset(){
  const on=rear.on&&rear.shown&&(Math.abs(rear.yawOff)>.03||Math.abs(rear.pitch-REAR.pitch)>.02||Math.abs(rear.zoom-1)>.04);
  if(on===camResetShown) return; camResetShown=on; $('camReset').hidden=!on;
}
const gl3={gl:null,prog:null,buf:null,u:null,tex:new Map(),aniso:null,tried:false};
const GL3_VS=`#version 300 es
in vec2 a_pos;
uniform vec3 u_C, u_r, u_u, u_f;
uniform vec3 u_cam;
uniform vec2 u_size;
uniform vec4 u_rect;
uniform vec4 u_top;
uniform vec2 u_topo;
out vec2 v_uv; out vec2 v_w;
void main(){
  v_uv=(a_pos-u_rect.xy)/u_rect.zw; v_w=a_pos;
  if(u_top.w>0.5){ vec2 q=(a_pos-u_top.xy)*u_top.z+u_topo; gl_Position=vec4(2.0*q.x/u_size.x-1.0,1.0-2.0*q.y/u_size.y,0.0,1.0); return; }
  vec3 d=vec3(a_pos,0.0)-u_C;
  float cx=dot(d,u_r), cy=dot(d,u_u), cz=dot(d,u_f);
  float X=u_cam.y*cz+u_cam.x*cx, Y=u_cam.z*cz-u_cam.x*cy;
  gl_Position=vec4(2.0*X/u_size.x-cz, cz-2.0*Y/u_size.y, 0.0, cz);
}`;
const GL3_FS=`#version 300 es
precision highp float;
in vec2 v_uv; in vec2 v_w;
uniform sampler2D u_tex, u_wat;
uniform vec4 u_wrect;
uniform vec3 u_eye;
uniform float u_topv;
uniform float u_t;
uniform vec2 u_wind;
uniform vec3 u_sun;
uniform vec3 u_deep, u_mid, u_shal, u_sky, u_foam;
uniform vec4 u_wp;
uniform vec4 u_wq;
uniform float u_wgl, u_sgl;
uniform vec3 u_sand, u_sand2;
uniform vec4 u_sp;
uniform vec4 u_sq;
out vec4 o;
float hs(vec2 p){ p=fract(p*vec2(0.1031,0.1030)); p+=dot(p,p.yx+33.33); return fract((p.x+p.y)*p.x); }
vec3 nd(vec2 p){
  vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f), du=6.0*f*(1.0-f);
  float a=hs(i), b=hs(i+vec2(1,0)), c=hs(i+vec2(0,1)), d=hs(i+vec2(1,1));
  return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y, du*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
}
const float TAU=6.2831853;
void main(){
  vec4 base=texture(u_tex,v_uv);
  vec2 q=(v_w-u_wrect.xy)/max(u_wrect.zw,vec2(1e-3));
  vec4 D=texture(u_wat,q);
  vec2 ts=1.0/vec2(textureSize(u_wat,0));
  vec4 Dx=texture(u_wat,q+vec2(ts.x,0.0))-texture(u_wat,q-vec2(ts.x,0.0));
  vec4 Dy=texture(u_wat,q+vec2(0.0,ts.y))-texture(u_wat,q-vec2(0.0,ts.y));
  float sd=D.r*15.0-12.0, sb=D.g*8.0-6.0, pot=D.b;
  vec2 gsd=vec2(Dx.g,Dy.g)/ts; vec2 gsn=length(gsd)>1e-6?normalize(gsd):vec2(0.0);
  vec3 baseOut=texture(u_tex,v_uv+gsn*clamp(0.75-sb,0.0,1.2)/max(u_wrect.zw,vec2(1e-3))).rgb;
  float aa=max(fwidth(sd),0.03), ab=max(fwidth(sb),0.02), px=length(fwidth(v_w));
  bool inr=u_wrect.z>0.0&&q.x>0.0&&q.y>0.0&&q.x<1.0&&q.y<1.0;
  float m=(inr&&u_wgl>0.5)?1.0-smoothstep(-aa,aa,sd):0.0;
  float ms=(inr&&u_sgl>0.5)?1.0-smoothstep(-ab,ab,sb):0.0;
  float mc=(inr&&u_sgl>0.5&&sb<0.5)?1.0:0.0;
  vec3 col=base.rgb;
  float t=u_t;
  vec2 sh=normalize(u_sun.xy+vec2(1e-5));
  if(mc>0.0){
    vec2 gn=gsn;
    float dep=max(-sb,0.0), mode=u_sp.w, fine=1.0-smoothstep(0.05,0.18,px);
    float tuft=nd(v_w*3.3+17.0).x;
    col=mix(col,baseOut,(1.0-smoothstep(0.3,0.6,sb))*step(0.0,sb+0.3));
    col*=1.0-u_sq.z*(1.0-smoothstep(0.0,0.45,sb))*(1.0-ms)*(0.55+0.45*tuft);
    float g1=hs(floor(v_w*9.0)), g2=nd(v_w*2.2+4.0).x;
    vec3 sc=u_sand*(1.0+u_sp.x*((g1-0.5)*fine+(g2-0.5)*0.8));
    float tow=dot(gn,sh), fw=mix(1.8,0.9,pot), face=1.0-smoothstep(0.0,fw,dep);
    float sha=1.0, rk=0.0;
    if(mode<3.5){
      sha=1.0+u_sq.y*face*clamp(-tow,0.0,1.0)-0.16*face*clamp(tow,0.0,1.0);
      sha*=1.0-u_sq.x*(1.0-smoothstep(0.0,mix(0.5,1.1,pot),dep))*clamp(tow*1.3,0.0,1.0);
      float ph=0.0;
      if(mode<0.5){ float an=nd(v_w*0.16+2.0).x*TAU; ph=dot(v_w,vec2(cos(an),sin(an))); }
      else if(mode<1.5) ph=dot(v_w,vec2(cos(u_sq.w),sin(u_sq.w)));
      else if(mode<2.5) ph=dep;
      else ph=dot(v_w,normalize(u_wind+vec2(1e-4,0.0)))+1.4*nd(v_w*0.35).x;
      float w=sin(ph*TAU/u_sp.z);
      rk=u_sp.y*w*fine*smoothstep(0.25,0.7,dep);
      if(mode<0.5) rk*=smoothstep(0.4,0.7,nd(v_w*0.45+9.0).x)*1.6;
      if(mode>1.5&&mode<2.5) rk=u_sp.y*fine*(w*clamp(-tow*1.5+0.3,-1.0,1.0)-0.4*cos(ph*TAU/u_sp.z))*smoothstep(0.26,0.4,dep);
      sc*=sha*(1.0+rk);
      if(mode>1.5&&mode<2.5) sc=mix(u_sand2*(0.85+0.3*hs(floor(v_w*3.0))),sc,smoothstep(0.18,0.26,dep));
      float wall=pot*(1.0-smoothstep(0.55,0.75,dep));
      float st=step(0.5,fract(dep*5.5+0.3*g2));
      vec3 wc=mix(vec3(0.30,0.25,0.16),vec3(0.36,0.41,0.20),st)*(1.0+0.25*face*clamp(-tow,0.0,1.0)-0.35*clamp(tow,0.0,1.0));
      sc=mix(sc,wc,wall);
    } else {
      vec2 f=fract(v_w)-0.5; float dot2=1.0-smoothstep(0.15,0.2,length(f));
      sc=mix(u_sand,u_sand2,dot2*fine); if(dep<0.45) sc*=0.74;
    }
    col=mix(col,sc,ms);
  }
  if(m>0.0){
    float dep=max(-sd,0.0), ws=length(u_wind);
    vec2 wd=ws>0.05?u_wind/ws:vec2(0.0,-1.0), wn=vec2(-wd.y,wd.x);
    vec2 p=vec2(dot(v_w,wd),dot(v_w,wn));
    float calm=0.3+0.7*smoothstep(0.0,8.0,ws);
    float f2=1.0-smoothstep(0.18,0.55,px), f3=1.0-smoothstep(0.08,0.3,px);
    vec3 n1=nd(p*vec2(0.42,0.75)-vec2(t*(0.35+0.06*ws),0.0));
    vec3 n2=nd(p*vec2(1.3,2.1)+vec2(-t*(0.9+0.1*ws),t*0.25)+7.3);
    mat2 R2=mat2(0.8,0.6,-0.6,0.8);
    vec3 n3=nd(R2*p*3.4+vec2(-t*1.5,t*0.4)+3.1);
    vec2 g=n1.yz*vec2(0.42,0.75)*0.55+n2.yz*vec2(1.3,2.1)*0.2*f2+(transpose(R2)*n3.yz)*3.4*0.07*f3;
    g*=u_wp.z*calm;
    vec2 gw=wd*g.x+wn*g.y;
    vec3 N=normalize(vec3(-gw,1.0));
    vec3 V=u_topv>0.5?normalize(vec3(0.0,0.55,1.0)):normalize(u_eye-vec3(v_w,0.0));
    float tr=exp(-dep/u_wp.x), tm=exp(-dep/(u_wp.x*4.0));
    vec2 bq=v_w+gw*0.6;
    float c1=nd(bq*0.85+vec2(t*0.21,-t*0.17)).x, c2=nd(bq*1.1-vec2(t*0.19,t*0.23)+5.0).x;
    float ca=pow(1.0-abs(c1-c2),7.0)*u_wq.y*(1.0-smoothstep(0.15,0.5,px));
    vec3 bot=u_shal*(0.86+0.24*nd(v_w*0.35+11.0).x)+ca*tr;
    vec3 wc=mix(u_deep,u_mid,tm);
    wc=mix(wc,bot,tr*0.9);
    wc*=1.0+1.5*(dot(N,u_sun)-u_sun.z);
    vec2 cp=v_w*0.02-u_wind*t*0.003;
    float cl=nd(cp).x*0.65+nd(cp*2.3+4.0).x*0.35;
    wc=mix(wc,u_sky,smoothstep(0.48,0.82,cl)*0.2*u_wq.w);
    float fr=0.02+0.98*pow(1.0-max(dot(N,V),0.0),5.0);
    vec3 Rf=reflect(-V,N);
    vec3 sky=mix(u_sky*1.06,u_sky*0.8,smoothstep(0.15,0.95,Rf.z));
    wc=mix(wc,sky,clamp((fr*0.9+0.05)*u_wp.y,0.0,0.85));
    float sp=max(dot(Rf,u_sun),0.0);
    wc+=vec3(1.0,0.97,0.9)*(pow(sp,300.0)*2.4+pow(sp,24.0)*0.06)*u_wp.w*(0.35+0.65*f2);
    vec2 gc=floor(v_w/0.9); float hh=hs(gc*1.7+3.3);
    vec2 cc=(gc+0.25+0.5*vec2(hs(gc+7.1),hs(gc-3.7)))*0.9;
    float tw=pow(max(sin(t*(1.6+2.4*hs(gc+1.3))+hh*60.0),0.0),14.0);
    float gl=step(1.0-0.015*calm*(0.15+0.85*pow(sp,10.0)),hh)*tw*(1.0-smoothstep(max(0.16,px*0.7),max(0.3,px*1.6),length(v_w-cc)));
    wc+=vec3(1.0,0.98,0.9)*gl*0.75*u_wp.w*smoothstep(0.6,1.6,dep);
    vec2 gn=length(vec2(Dx.r,Dy.r))>1e-5?normalize(vec2(Dx.r,Dy.r)/ts):vec2(0.0);
    wc*=1.0-0.3*u_wq.z*(1.0-smoothstep(0.0,1.3,dep))*max(dot(gn,sh),0.0);
    float fo=(1.0-smoothstep(0.0,u_wq.x,dep))*(0.6+0.4*nd(v_w*2.3+vec2(t*0.5,-t*0.4)).x);
    wc=mix(wc,u_foam,fo*0.5);
    col=mix(col,wc,m);
  }
  o=vec4(col,1.0);
}`;
const GL3_U=['u_C','u_r','u_u','u_f','u_cam','u_size','u_rect','u_tex','u_top','u_topo','u_wat','u_wrect','u_eye','u_topv','u_t','u_wind','u_sun','u_deep','u_mid','u_shal','u_sky','u_foam','u_wp','u_wq','u_wgl','u_sgl','u_sand','u_sand2','u_sp','u_sq'];
function initGL3(){
  if(gl3.tried) return !!gl3.gl; gl3.tried=true;
  try{
    const gl=$('gl3').getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
    if(!gl) return false;
    const sh=(t,src)=>{ const o=gl.createShader(t); gl.shaderSource(o,src); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,GL3_VS)); gl.attachShader(p,sh(gl.FRAGMENT_SHADER,GL3_FS)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl3.prog=p; gl3.buf=gl.createBuffer(); gl3.aniso=gl.getExtension('EXT_texture_filter_anisotropic');
    gl3.u={}; for(const n of GL3_U) gl3.u[n]=gl.getUniformLocation(p,n);
    gl3.apos=gl.getAttribLocation(p,'a_pos');
    gl3.noWat=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,gl3.noWat); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,0,255])); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl3.gl=gl; return true;
  }catch(e){ console.warn('WebGL2 なし。地面は 2D で貼り、水は地面の絵に焼いたもの',e); gl3.gl=null; return false; }
}
function texOf(cv){
  const gl=gl3.gl; let t=gl3.tex.get(cv);
  if(t) return t;
  const keep=new Set(); for(const L of [course.base,course.green]){ keep.add(L.canvas); if(L.wat) keep.add(L.wat); }
  for(const [c,o] of gl3.tex) if(!keep.has(c)){ gl.deleteTexture(o); gl3.tex.delete(c); }
  t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  if(cv.data) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,cv.dw,cv.dh,0,gl.RGBA,gl.UNSIGNED_BYTE,cv.data);
  else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(gl3.aniso) gl.texParameterf(gl.TEXTURE_2D,gl3.aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(gl3.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  gl3.tex.set(cv,t); return t;
}
function drawGround3(top){
  const gl=gl3.gl, c=$('gl3');
  if(c.width!==cv.width||c.height!==cv.height){ c.width=cv.width; c.height=cv.height; }
  gl.viewport(0,0,c.width,c.height); { const bg=groundBg(); gl.clearColor(bg[0]/255,bg[1]/255,bg[2]/255,1); } gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(gl3.prog); const u=gl3.u, st=WATER_STYLE, c3=a=>[a[0]/255,a[1]/255,a[2]/255];
  if(top){ gl.uniform4f(u.u_top,cam.x,cam.y,cam.s,1); gl.uniform2f(u.u_topo,camR.cx+cam.ox,camR.cy+cam.oy); }
  else { gl.uniform4f(u.u_top,0,0,1,0); gl.uniform3f(u.u_C,pv.Cx,pv.Cy,pv.Cz); gl.uniform3f(u.u_r,pv.rx,pv.ry,0); gl.uniform3f(u.u_u,pv.ux,pv.uy,pv.uz); gl.uniform3f(u.u_f,pv.fx,pv.fy,pv.fz); gl.uniform3f(u.u_cam,pv.F,pv.pcx,pv.pcy); }
  gl.uniform2f(u.u_size,view.W,view.H); gl.uniform1i(u.u_tex,0); gl.uniform1i(u.u_wat,1);
  gl.uniform3f(u.u_eye,pv.Cx,pv.Cy,pv.Cz); gl.uniform1f(u.u_topv,top?1:0); gl.uniform1f(u.u_t,now%600);
  gl.uniform2f(u.u_wind,Math.cos(wind.dir)*wind.speed,Math.sin(wind.dir)*wind.speed);
  { const m=Math.hypot(SUN.x,SUN.y,1); gl.uniform3f(u.u_sun,-SUN.x/m,-SUN.y/m,1/m); }
  gl.uniform3f(u.u_deep,...c3(st.deep)); gl.uniform3f(u.u_mid,...c3(st.mid)); gl.uniform3f(u.u_shal,...c3(st.shal)); gl.uniform3f(u.u_sky,...c3(st.sky)); gl.uniform3f(u.u_foam,...c3(st.foam));
  gl.uniform4f(u.u_wp,st.len,st.refl,st.wave,st.spec); gl.uniform4f(u.u_wq,st.foamW,st.caus,st.shade,st.cloud);
  const ss=SAND_STYLE; gl.uniform1f(u.u_wgl,st.gl?1:0); gl.uniform1f(u.u_sgl,ss.gl&&hole&&hole.pond?1:0);
  gl.uniform3f(u.u_sand,...c3(ss.col)); gl.uniform3f(u.u_sand2,...c3(ss.col2)); gl.uniform4f(u.u_sp,ss.grain,ss.rake,ss.period,ss.mode); gl.uniform4f(u.u_sq,ss.shadow,ss.light,ss.collar,ss.dir);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl3.buf); gl.enableVertexAttribArray(gl3.apos); gl.vertexAttribPointer(gl3.apos,2,gl.FLOAT,false,0,0);
  for(const L of [course.base,course.green]){
    const x0=L.x0, y0=L.y0, x1=L.x0+L.w, y1=L.y0+L.h, W=L.wat;
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([x0,y0,x1,y0,x0,y1,x1,y0,x1,y1,x0,y1]),gl.STREAM_DRAW);
    gl.uniform4f(u.u_rect,x0,y0,L.w,L.h);
    if(W) gl.uniform4f(u.u_wrect,W.x0,W.y0,W.w,W.h); else gl.uniform4f(u.u_wrect,0,0,0,0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,W?texOf(W):gl3.noWat);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texOf(L.canvas));
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
}
function showGL3(on){ const c=$('gl3'); if(c.hidden===!on) return; c.hidden=!on; }
function pj(x,y,z){
  z=z||0;
  if(!drawRear) return {x:SX(x),y:SY(y,z),s:cam.s,k:1,z:0};
  return pj3(x,y,z);
}
function pj3(x,y,z){
  const dx=x-pv.Cx, dy=y-pv.Cy, dz=z-pv.Cz, cz=dx*pv.fx+dy*pv.fy+dz*pv.fz;
  if(cz<REAR.near) return null;
  const s=pv.F/cz;
  return {x:pv.pcx+(dx*pv.rx+dy*pv.ry)*s,y:pv.pcy-(dx*pv.ux+dy*pv.uy+dz*pv.uz)*s,s,k:-dz/Math.sqrt(dx*dx+dy*dy+dz*dz),z:cz};
}
function gs(){ return drawRear?pv.F/pv.d:cam.s; }
let groundGL=false;
function drawLayer(L,vr){
  if(groundGL) return;
  if(drawRear){ drawLayer3(L); return; }
  const ax=Math.max(L.x0,vr.x0-1), ay=Math.max(L.y0,vr.y0-1), bx=Math.min(L.x0+L.w,vr.x1+1), by=Math.min(L.y0+L.h,vr.y1+1);
  if(bx<=ax||by<=ay) return;
  ctx.drawImage(L.canvas,(ax-L.x0)*L.ppy,(ay-L.y0)*L.ppy,(bx-ax)*L.ppy,(by-ay)*L.ppy,SX(ax),SY(ay),(bx-ax)*cam.s,(by-ay)*cam.s);
}
function drawLayer3(L){
  const W=view.W, Hd=Math.round(view.H*dpr), cw=L.canvas.width, ch=L.canvas.height, ppy=L.ppy, dev=ctx.canvas.width;
  let yd=0;
  while(yd<Hd){
    const y0=yd/dpr, w=-(pv.fz-pv.uz*(y0-pv.pcy)/pv.F);
    const step=w>0?clamp(REAR.strip*w*pv.F/pv.uz,2,32):16;
    const top=yd; yd=Math.min(Hd,yd+Math.max(1,Math.round(step*dpr)));
    const y1=yd/dpr, A=groundAt(0,y0), B=groundAt(W,y0), C=groundAt(0,y1), D=groundAt(W,y1);
    if(!A||!B||!C||!D) continue;
    const su=Math.max(0,Math.floor((Math.min(A.x,B.x,C.x,D.x)-L.x0)*ppy-2)), eu=Math.min(cw,Math.ceil((Math.max(A.x,B.x,C.x,D.x)-L.x0)*ppy+2));
    const sv=Math.max(0,Math.floor((Math.min(A.y,B.y,C.y,D.y)-L.y0)*ppy-2)), ev=Math.min(ch,Math.ceil((Math.max(A.y,B.y,C.y,D.y)-L.y0)*ppy+2));
    if(eu<=su||ev<=sv) continue;
    const e1x=B.x-A.x, e1y=B.y-A.y, e2x=C.x-A.x, e2y=C.y-A.y, det=e1x*e2y-e2x*e1y;
    if(Math.abs(det)<1e-9) continue;
    const h=y1-y0, a=W*e2y/det, c=-W*e2x/det, b=-h*e1y/det, d=h*e1x/det, e=-(a*A.x+c*A.y), f=y0-(b*A.x+d*A.y);
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.beginPath(); ctx.rect(0,top,dev,yd-top); ctx.clip();
    ctx.setTransform(dpr*a/ppy,dpr*b/ppy,dpr*c/ppy,dpr*d/ppy,dpr*(a*L.x0+c*L.y0+e),dpr*(b*L.x0+d*L.y0+f));
    ctx.drawImage(L.canvas,su,sv,eu-su,ev-sv,su,sv,eu-su,ev-sv);
    ctx.restore();
  }
}
function polyPath3(pts){
  const N=REAR.near, cs=[], out=[];
  for(const p of pts){ const dx=p[0]-pv.Cx, dy=p[1]-pv.Cy, dz=-pv.Cz; cs.push([dx*pv.rx+dy*pv.ry,dx*pv.ux+dy*pv.uy+dz*pv.uz,dx*pv.fx+dy*pv.fy+dz*pv.fz]); }
  for(let i=0;i<cs.length;i++){
    const a=cs[i], b=cs[(i+1)%cs.length], ain=a[2]>=N, bin=b[2]>=N;
    if(ain) out.push(a);
    if(ain!==bin){ const t=(N-a[2])/(b[2]-a[2]); out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,N]); }
  }
  if(out.length<3) return;
  for(let i=0;i<out.length;i++){ const p=out[i], s=pv.F/p[2], x=pv.pcx+p[0]*s, y=pv.pcy-p[1]*s; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }
  ctx.closePath();
}
function waterPath(){
  ctx.beginPath();
  for(const l of pond.outline){
    if(drawRear){ polyPath3(l); continue; }
    for(let i=0;i<l.length;i++){ const x=SX(l[i][0]), y=SY(l[i][1]); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }
    ctx.closePath();
  }
}
function drawTreeRefl(t){
  const s=TREE!=='A'&&TB.ok&&t._k?TB.map.get(t._k.key):null; if(s==null) return;
  const sway=Math.sin(now*1.6+t.ph)*wind.speed*.045*(t.h/12), ox=Math.cos(wind.dir)*sway, oy=Math.sin(wind.dir)*sway;
  const b=pj(t.x,t.y,0), c=pj(t.x+ox,t.y+oy,-t.h); if(!b||!c) return;
  const box=TB.box[s], th=thOf(t._k.tb), stv=drawRear?1:1/Math.sin(th), sc=t.r*c.s;
  const dx=c.x-b.x, dy=c.y-b.y, len=Math.hypot(dx,dy);
  if(len>.5){
    const tw=Math.max(1.2,(t._k.m.st==='E'?.6:.8)*c.s), cs=-dy/len, sn=dx/len, tk=TB.trunks[clamp(Math.round((t._lx+1)*2),0,4)];
    ctx.setTransform(dpr*cs,dpr*sn,-dpr*sn,dpr*cs,dpr*b.x,dpr*b.y); ctx.drawImage(tk,-tw/2,-len,tw,len);
  }
  const w=2*box[0]*sc, hh=2*box[2]*sc*stv, off=box[1]*sc*stv, C=TB.CELL, ax=(s%TB.COLS)*C, ay=Math.floor(s/TB.COLS)*C;
  const ang=len>.5?Math.atan2(dx,-dy):Math.PI, ca=Math.cos(ang), sa=Math.sin(ang);
  ctx.setTransform(-dpr*ca,-dpr*sa,-dpr*sa,dpr*ca,dpr*c.x,dpr*c.y);
  ctx.drawImage(TB.atlas,ax,ay,C,C,-w/2,-off-hh/2,w,hh);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function drawWaterBase(){
  if(!pond||!pond.outline.length) return;
  const glw=WATER_STYLE.gl&&!!gl3.gl, vr=visRect();
  ctx.save(); waterPath(); ctx.clip('evenodd');
  if(glw&&TREE!=='A'&&TB.ok){
    ctx.globalAlpha=.26;
    for(const t of pond.refl) if(t.x>vr.x0-t.h-4&&t.x<vr.x1+t.h+4&&t.y>vr.y0-t.h-4&&t.y<vr.y1+t.h+4) drawTreeRefl(t);
    ctx.globalAlpha=1;
  }
  for(const k of koi){
    const q=pathAt(k.p,k.s), w=Math.sin(now*.8+k.ph)*.9, sg=Math.sign(k.sp)||1, hx=q.dx*sg, hy=q.dy*sg, x=q.x-q.dy*w, y=q.y+q.dx*w;
    const p=pj(x,y,0); if(!p) continue;
    let ang=Math.atan2(hy,hx);
    if(drawRear){ const r=pj(x+hx*.05,y+hy*.05,0); if(!r) continue; ang=Math.atan2(r.y-p.y,r.x-p.x); }
    const L=Math.max(5,1.3*p.s), wag=Math.sin(now*6+k.ph)*.35;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(ang); ctx.globalAlpha=glw?.55:.72; ctx.fillStyle=k.col;
    ctx.beginPath(); ctx.ellipse(0,0,L*.5,L*.17,0,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-L*.42,0); ctx.lineTo(-L*.78,-L*.18+wag*L*.2); ctx.lineTo(-L*.78,L*.18+wag*L*.2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha=1;
  ctx.strokeStyle='#fff'; ctx.lineCap='round';
  if(!glw){
    ctx.lineWidth=Math.max(1,.18*gs());
    for(const g of glints){
      if(g.x<vr.x0-2||g.x>vr.x1+2||g.y<vr.y0-2||g.y>vr.y1+2) continue;
      const a=Math.sin(now*g.sp+g.ph); if(a<.55) continue;
      const p=pj(g.x+Math.sin(now*.4+g.ph)*.6,g.y,0); if(!p) continue;
      ctx.globalAlpha=(a-.55)*1.3; const l=Math.max(3,.8*p.s);
      ctx.beginPath(); ctx.moveTo(p.x-l,p.y); ctx.lineTo(p.x+l,p.y); ctx.stroke();
    }
  }
  ctx.lineWidth=Math.max(1,.12*gs());
  for(const r of ripples){ if(r.life<=0) continue; const p=pj(r.x,r.y,0); if(!p) continue; ctx.globalAlpha=(1-r.life/r.max)*.8; ctx.beginPath(); ctx.ellipse(p.x,p.y,r.r*p.s,r.r*p.s*.92*p.k,0,0,TAU); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha=1;
}
function drawGroundMarks(){
  const t=hole.tee;
  for(const dx of [-3.4,3.4]){ const p=pj(t.x+dx,t.y-1.6,0); if(!p) continue; const x=p.x, y=p.y, r=Math.max(2.2,.45*p.s); ctx.fillStyle='rgba(6,22,12,.3)'; ctx.beginPath(); ctx.ellipse(x+r*.5,y+r*.4,r,r*.8,0,0,TAU); ctx.fill(); ctx.fillStyle='#2f6fd0'; ctx.beginPath(); ctx.arc(x,y-r*.3,r,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x-r*.3,y-r*.65,r*.35,0,TAU); ctx.fill(); }
  if(hole.drop){ const p=pj(hole.drop.x,hole.drop.y,0); if(p){ const x=p.x, y=p.y, s=p.s, r=2.8*s; ctx.setLineDash([Math.max(2,.6*s),Math.max(2,.5*s)]); ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=Math.max(1,.2*s); ctx.beginPath(); ctx.ellipse(x,y,r,r*p.k,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); if(s>3) label('DROP',x,y+4,Math.max(10,.9*s),'center','num',.85); } }
}
function drawFlow(){
  if(flowAlpha<=0) return;
  ctx.lineCap='round'; ctx.lineWidth=Math.max(1.3,.13*gs());
  for(const p of flow){ const a=Math.sin(Math.PI*clamp(p.life/p.max,0,1))*flowAlpha; if(a<.03) continue; const q=pj(p.x,p.y,0), b=pj(p.x-p.vx*.11,p.y-p.vy*.11,0); if(!q||!b) continue; ctx.strokeStyle=`rgba(232,255,222,${a*.85})`; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(q.x,q.y); ctx.stroke(); }
}
function drawCup(){ const p=pj(hole.pin.x,hole.pin.y,0); if(!p) return; const x=p.x, y=p.y, r=Math.max(2.6,CUP_R*p.s), k=p.k; ctx.fillStyle='rgba(255,255,255,.92)'; ctx.beginPath(); ctx.ellipse(x,y,r*1.14,r*1.14*k,0,0,TAU); ctx.fill(); ctx.fillStyle='#0c1b12'; ctx.beginPath(); ctx.ellipse(x,y+r*.14*k,r,r*k,0,0,TAU); ctx.fill(); }
function flagScale(){ return Math.max(cam.s,6.5); }
function drawFlagShadow(){ const b=pj(hole.pin.x,hole.pin.y,0); if(!b) return; const m=Math.max(b.s,6.5)/b.s, e=pj(hole.pin.x+POLE_H*SUN.x*m,hole.pin.y+POLE_H*SUN.y*m,0); if(!e) return; ctx.strokeStyle='rgba(6,22,12,.28)'; ctx.lineWidth=Math.max(1.4,.1*b.s*m); ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(e.x,e.y); ctx.stroke(); }
function drawFlag(){
  if(drawRear){ drawFlag3(); return; }
  const ps=flagScale(), x=SX(hole.pin.x), y=SY(hole.pin.y), top=y-POLE_H*TILT*ps;
  ctx.strokeStyle='#f6f6ef'; ctx.lineWidth=Math.max(1.5,.1*ps); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,top); ctx.stroke();
  const wl=clamp(wind.speed/5,.25,1), fx=Math.cos(wind.dir), fy=Math.sin(wind.dir)*.5, len=1.5*ps*(.55+.45*wl), hh=.95*ps*TILT, fl=Math.sin(now*7.5)*.2*wl;
  ctx.fillStyle='#e23f2c'; ctx.beginPath(); ctx.moveTo(x,top);
  ctx.quadraticCurveTo(x+fx*len*.55,top+fy*len*.55+fl*hh*1.6,x+fx*len,top+fy*len+hh*.5+fl*hh);
  ctx.quadraticCurveTo(x+fx*len*.5,top+fy*len*.5+hh*.8-fl*hh,x,top+hh); ctx.closePath(); ctx.fill();
}
function drawFlag3(){
  const px=hole.pin.x, py=hole.pin.y, b=pj(px,py,0); if(!b) return;
  const m=Math.max(b.s,6.5)/b.s, H=POLE_H*m, t=pj(px,py,H); if(!t) return;
  ctx.strokeStyle='#f6f6ef'; ctx.lineWidth=Math.max(1.5,.1*b.s*m); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(t.x,t.y); ctx.stroke();
  const wl=clamp(wind.speed/5,.25,1), fx=Math.cos(wind.dir), fy=Math.sin(wind.dir), len=1.5*m*(.55+.45*wl), hh=.95*m, fl=Math.sin(now*7.5)*.2*wl;
  const c1=pj(px+fx*len*.55,py+fy*len*.55,H-fl*hh*1.6), tip=pj(px+fx*len,py+fy*len,H-hh*.5-fl*hh), c2=pj(px+fx*len*.5,py+fy*len*.5,H-hh*.8+fl*hh), bot=pj(px,py,H-hh);
  if(!c1||!tip||!c2||!bot) return;
  ctx.fillStyle='#e23f2c'; ctx.beginPath(); ctx.moveTo(t.x,t.y);
  ctx.quadraticCurveTo(c1.x,c1.y,tip.x,tip.y); ctx.quadraticCurveTo(c2.x,c2.y,bot.x,bot.y); ctx.closePath(); ctx.fill();
}
function ballR(){ return Math.max(3.4,BALL_R*cam.s)*(1+ball.z*.02); }
function drawBallShadow(){ if(ball.mode==='gone'||ball.mode==='holed'||ball.tun) return; const z=ball.z, p=pj(ball.x+z*SUN.x,ball.y+z*SUN.y,0); if(!p) return; const r=Math.max(3.4,BALL_R*p.s)*(1+z*.015); ctx.globalAlpha=clamp(.6/(1+z*.07),.14,.6); ctx.drawImage(shadowSprite,p.x-r*1.15,p.y-r*p.k,r*2.3,r*2*p.k); ctx.globalAlpha=1; }
function drawBall(){
  if(ball.mode==='gone'||ball.tun) return;
  const p=pj(ball.x,ball.y,ball.z); if(!p) return;
  let x=p.x, y=p.y, r=drawRear?Math.max(3.4,BALL_R*p.s):ballR();
  if(ball.mode==='holed'){ if(ball.holedT>.55) return; const a=pj(ball.sinkFrom.x,ball.sinkFrom.y,0), b=pj(hole.pin.x,hole.pin.y,0); if(!a||!b) return; const t=clamp(ball.holedT/.3,0,1); x=lerp(a.x,b.x,t); y=lerp(a.y,b.y,t)+t*r*.3; r*=1-.5*t; ctx.globalAlpha=1-clamp((ball.holedT-.3)/.25,0,1); }
  if(drawRear&&ball.mode==='air'&&ball.z>.4){ const g=pj(ball.x,ball.y,0); if(g){ ctx.strokeStyle='rgba(255,255,255,.42)'; ctx.lineWidth=1.2; ctx.setLineDash([2,3]); ctx.beginPath(); ctx.moveTo(g.x,g.y); ctx.lineTo(x,y+r); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.ellipse(g.x,g.y,3.2,3.2*g.k,0,0,TAU); ctx.stroke(); } }
  ctx.drawImage(ballSprite,x-r,y-r,2*r,2*r); ctx.globalAlpha=1;
  if(game.state==='aim'&&!aim.active&&r<5){ ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y,r+5+Math.sin(now*4)*1.5,0,TAU); ctx.stroke(); }
}
function treeVisible(t,vr){ const m=t.r+t.h*TILT+2; return t.x+m>vr.x0&&t.x-m<vr.x1&&t.y+m>vr.y0&&t.y-m<vr.y1+t.h*SUN.y; }
function drawTreeShadowOld(t){ const p=pj(t.x+t.h*SUN.x,t.y+t.h*SUN.y,0); if(!p) return; const r=t.r*p.s*1.08; ctx.drawImage(shadowSprite,p.x-r,p.y-r*.9*p.k,2*r,1.8*r*p.k); }
function drawTreeOld(t,fade){
  const sway=Math.sin(now*1.6+t.ph)*wind.speed*.045*(t.h/12), ox=Math.cos(wind.dir)*sway, oy=Math.sin(wind.dir)*sway;
  const b=pj(t.x,t.y,0), c=pj(t.x+ox,t.y+oy,t.h); if(!b||!c) return;
  const bx=b.x, by=b.y, cx=c.x, cy=c.y, r=t.r*c.s;
  if(fade) ctx.globalAlpha=fade;
  if(by-cy>r*.7){ ctx.strokeStyle='#5a3d27'; ctx.lineWidth=Math.max(1,.7*c.s); ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(cx,cy); ctx.stroke(); }
  if(drawRear){ ctx.save(); ctx.translate(cx,cy); ctx.rotate(pv.lightRot); ctx.drawImage(treeSprites[t.v],-r,-r,2*r,2*r); ctx.restore(); }
  else ctx.drawImage(treeSprites[t.v],cx-r,cy-r,2*r,2*r);
  if(fade) ctx.globalAlpha=1;
}
function drawTreeShadow(t){
  if(TREE==='A'||!TB.ok||!t._k) return drawTreeShadowOld(t);
  const cone=t._k.m.st==='E', p=pj(t.x+t.h*SUN.x,t.y+t.h*SUN.y,0); if(!p) return;
  const r=t.r*p.s*(cone?.82:1.05); ctx.drawImage(shadowSprite,p.x-r,p.y-r*.9*p.k,2*r,1.8*r*p.k);
  const b=pj(t.x,t.y,0), e=pj(t.x+(t.h-t.r*.6)*SUN.x,t.y+(t.h-t.r*.6)*SUN.y,0); if(!b||!e) return;
  ctx.strokeStyle='rgba(6,22,12,.26)'; ctx.lineWidth=Math.max(1,.6*b.s); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(e.x,e.y); ctx.stroke();
  const q=Math.max(1.5,1.2*b.s); ctx.globalAlpha=.6; ctx.drawImage(shadowSprite,b.x-q,b.y-q*.7*b.k,2*q,1.4*q*b.k); ctx.globalAlpha=1;
}
function drawTree(t,fade){
  const s=TREE!=='A'&&TB.ok&&t._k?TB.map.get(t._k.key):null;
  if(s==null) return drawTreeOld(t,fade);
  const sway=Math.sin(now*1.6+t.ph)*wind.speed*.045*(t.h/12), ox=Math.cos(wind.dir)*sway, oy=Math.sin(wind.dir)*sway;
  const b=pj(t.x,t.y,0), c=pj(t.x+ox,t.y+oy,t.h); if(!b||!c) return;
  if(fade) ctx.globalAlpha=fade;
  const box=TB.box[s], th=thOf(t._k.tb), stv=drawRear?1:1/Math.sin(th), sc=t.r*c.s;
  const dx=c.x-b.x, dy=c.y-b.y, len=Math.hypot(dx,dy);
  if(len>.5){
    const tw=Math.max(1.2,(t._k.m.st==='E'?.6:.8)*c.s), cs=-dy/len, sn=dx/len, tk=TB.trunks[clamp(Math.round((t._lx+1)*2),0,4)];
    ctx.setTransform(dpr*cs,dpr*sn,-dpr*sn,dpr*cs,dpr*b.x,dpr*b.y); ctx.drawImage(tk,-tw/2,-len,tw,len);
  }
  const w=2*box[0]*sc, hh=2*box[2]*sc*stv, off=box[1]*sc*stv, C=TB.CELL, ax=(s%TB.COLS)*C, ay=Math.floor(s/TB.COLS)*C;
  const ang=drawRear&&len>.5?Math.atan2(dx,-dy):0, ca=Math.cos(ang), sa=Math.sin(ang);
  ctx.setTransform(dpr*ca,dpr*sa,-dpr*sa,dpr*ca,dpr*c.x,dpr*c.y);
  ctx.drawImage(TB.atlas,ax,ay,C,C,-w/2,-off-hh/2,w,hh);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(fade) ctx.globalAlpha=1;
}
function label(text,x,y,size,align,face,alpha,col){
  ctx.font=(face==='num'?`800 ${size}px "Big Shoulders Display","Arial Narrow",sans-serif`:`900 ${size}px "Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif`);
  ctx.textAlign=align||'center'; ctx.textBaseline='alphabetic'; ctx.globalAlpha=alpha==null?1:alpha;
  ctx.lineJoin='round'; ctx.lineWidth=3.5; ctx.strokeStyle='rgba(8,24,16,.78)'; ctx.strokeText(text,x,y); ctx.fillStyle=col||'#fff'; ctx.fillText(text,x,y); ctx.globalAlpha=1;
}
function ring(x,y,r,col,w,dash,k){ ctx.strokeStyle=col; ctx.lineWidth=w; if(dash) ctx.setLineDash(dash); ctx.beginPath(); if(k!=null&&k!==1) ctx.ellipse(x,y,r,r*k,0,0,TAU); else ctx.arc(x,y,r,0,TAU); ctx.stroke(); if(dash) ctx.setLineDash([]); }
function fmtY(d){ return d<10?d.toFixed(1):String(Math.round(d)); }
function drawFlyYards(){
  if(flyY.a<.01||ball.mode==='gone'||ball.tun) return;
  const p=pj(ball.x,ball.y,ball.z); if(!p) return;
  const y=Math.max(view.top+18+FLY_Y.gap*flyY.r,p.y-FLY_Y.lift), run=Math.round(flyY.run);
  label(Math.round(flyY.carry)+'Y',p.x,y-FLY_Y.gap*flyY.r,18,'center','num',flyY.a);
  if(flyY.ran) label((run<0?'':'+')+run+'Y',p.x,y,18,'center','num',flyY.a*flyY.r,FLY_Y.run);
}
function drawTracer(){
  if(tracer.length<2||tracerA<=0) return;
  ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath();
  let on=false;
  for(let i=0;i<tracer.length;i++){ const p=tracer[i], q=pj(p.x,p.y,p.z); if(!q){ on=false; continue; } if(on) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y); on=true; }
  ctx.strokeStyle=`rgba(255,86,56,${.3*tracerA})`; ctx.lineWidth=7; ctx.stroke();
  ctx.strokeStyle=`rgba(255,228,216,${.95*tracerA})`; ctx.lineWidth=2.2; ctx.stroke();
}
function drawAim(){
  if(game.state!=='aim') return;
  const c=CLUBS[game.club], bp=pj(ball.x,ball.y,0); if(!bp) return;
  const bx=bp.x, by=bp.y;
  if(!aim.active){
    const d=distPin(), L=Math.min(d,c.carry||d), ux=(hole.pin.x-ball.x)/(d||1), uy=(hole.pin.y-ball.y)/(d||1), e=pj(ball.x+ux*L,ball.y+uy*L,0);
    if(!e) return;
    ctx.setLineDash([4,7]); ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(e.x,e.y); ctx.stroke(); ctx.setLineDash([]);
    return;
  }
  const p=aim.preview;
  if(p){
    if(p.putt&&p.path){
      const n=p.pts.length/2, cut=p.end==='cut';
      ctx.fillStyle='#fff';
      for(let i=1;i<n;i++){ const q=pj(p.pts[i*2],p.pts[i*2+1],0); if(!q) continue; ctx.globalAlpha=cut?.95*(1-sstep(.55,1,i/n)):.95; ctx.beginPath(); ctx.arc(q.x,q.y,1.9,0,TAU); ctx.fill(); }
      ctx.globalAlpha=1;
      const q=pj(p.land.x,p.land.y,0);
      if(q){
        if(p.end==='rest') ring(q.x,q.y,Math.max(6,.5*q.s),'#fff',2,null,q.k);
        else if(p.end==='water') ring(q.x,q.y,Math.max(6,.5*q.s),'#ff8a7a',2,null,q.k);
      }
      const o=pj(ball.x+aim.dir.x,ball.y+aim.dir.y,0);
      if(o){
        const m=Math.hypot(o.x-bx,o.y-by)||1, ux=(o.x-bx)/m, uy=(o.y-by)/m, A=PUTT_AIM;
        ctx.fillStyle='#fff';
        for(let d=0;d<=A.len;d+=A.gap){ ctx.globalAlpha=.95-.6*d/A.len; ctx.beginPath(); ctx.arc(bx+ux*(A.from+d),by+uy*(A.from+d),1.9,0,TAU); ctx.fill(); }
        ctx.globalAlpha=1;
        const e=A.from+A.len+13;
        label(fmtY(p.dist)+'Y',bx+ux*e,by+uy*e+5,16,'center','num');
      }
    } else if(p.putt){
      const q=pj(p.land.x,p.land.y,0);
      if(q){
        const ex=q.x, ey=q.y;
        ctx.setLineDash([6,6]); ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
        ring(ex,ey,Math.max(6,.5*q.s),'#fff',2,null,q.k);
        label(fmtY(p.dist)+'Y',ex,ey-Math.max(10,.7*q.s),17,'center','num');
      }
    } else {
      const n=p.pts.length/3, rv=aim.rv;
      let ai=0; for(let i=1;i<n;i++) if(p.pts[i*3+2]>p.pts[ai*3+2]) ai=i;
      const cutA=lerp(ai*AIM_SHOW.show*.55,n,rv), cutB=lerp(ai*AIM_SHOW.show,n*1.5,rv);
      if(drawRear){
        ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1.4; ctx.beginPath(); let on=false;
        for(let i=0;i<n&&i<(cutA+cutB)/2;i+=2){ const q=pj(p.pts[i*3],p.pts[i*3+1],0); if(!q){ on=false; continue; } if(on) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y); on=true; }
        ctx.stroke();
      }
      ctx.fillStyle='#fff';
      for(let i=2;i<n;i+=3){ const q=pj(p.pts[i*3],p.pts[i*3+1],p.pts[i*3+2]); if(!q) continue; ctx.globalAlpha=lerp(.85,.35+.6*(i/n),rv)*(1-sstep(cutA,cutB,i)); ctx.beginPath(); ctx.arc(q.x,q.y,2.1,0,TAU); ctx.fill(); }
      ctx.globalAlpha=1;
      const ma=aimMark(), q=ma>0?pj(p.land.x,p.land.y,0):null;
      if(q){
        const lx=q.x, ly=q.y, rr=Math.max(10,2.2*q.s), ry=rr*q.k;
        ctx.globalAlpha=ma;
        ctx.fillStyle='rgba(255,255,255,.16)'; ctx.beginPath(); ctx.ellipse(lx,ly,rr,ry,0,0,TAU); ctx.fill();
        ring(lx,ly,rr,'#fff',2,[5,4],q.k);
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(lx,ly,2.4,0,TAU); ctx.fill();
        label(Math.round(p.carry)+'Y',lx,ly-ry-6,18,'center','num',ma);
        label('無風時',lx,ly+ry+14,11,'center','jp',.85*ma);
      }
    }
  }
  const pr=24, pw=aim.power;
  ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(bx,by,pr,0,TAU); ctx.stroke();
  if(pw>0){ ctx.strokeStyle=`hsl(${120-112*pw},82%,58%)`; ctx.beginPath(); ctx.arc(bx,by,pr,-Math.PI/2,-Math.PI/2+pw*TAU); ctx.stroke(); }
  const isPT=CLUBS[game.club].id==='PT';
  if(!isPT){ const a=-Math.PI/2+AIM_SHOW.from*TAU, on=pw>=AIM_SHOW.from, r1=pr+(on?10:8); ctx.strokeStyle=on?'#fff':'rgba(255,255,255,.7)'; ctx.lineWidth=on?2.6:1.8; ctx.beginPath(); ctx.moveTo(bx+Math.cos(a)*(pr+3.5),by+Math.sin(a)*(pr+3.5)); ctx.lineTo(bx+Math.cos(a)*r1,by+Math.sin(a)*r1); ctx.stroke(); }
  const pctL=bx+pr+52>view.W;
  label(Math.max(aim.pull>=SHOT_PULL?1:0,Math.round(pw*100))+'%',pctL?bx-pr-12:bx+pr+8,by+5,15,pctL?'right':'left','num');
  const cx=aim.x0, cy=aim.y0, back=aim.cancel&&aim.moved, xr=6;
  if(back){ ctx.fillStyle='rgba(16,30,24,.55)'; ctx.beginPath(); ctx.arc(cx,cy,CANCEL_PX,0,TAU); ctx.fill(); }
  else { ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=1.5; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(aim.x,aim.y); ctx.stroke(); ctx.setLineDash([]); }
  ring(cx,cy,CANCEL_PX,back?'rgba(255,255,255,.95)':'rgba(255,255,255,.4)',back?2.2:1.5);
  ctx.strokeStyle=back?'#fff':'rgba(255,255,255,.4)'; ctx.lineWidth=back?2.4:1.6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx-xr,cy-xr); ctx.lineTo(cx+xr,cy+xr); ctx.moveTo(cx+xr,cy-xr); ctx.lineTo(cx-xr,cy+xr); ctx.stroke();
  if(back) label('離すと取り消し',cx,cy-CANCEL_PX-10,13,'center','jp');
  else { ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(aim.x,aim.y,6,0,TAU); ctx.fill(); }
}
function drawParticles(){
  for(const p of parts){ const q=pj(p.x,p.y,p.z); if(!q) continue; const s=Math.max(1.6,p.size*q.s); ctx.globalAlpha=1-p.life/p.max; ctx.fillStyle=p.col; ctx.fillRect(q.x-s/2,q.y-s/2,s,s); }
  ctx.globalAlpha=1;
}
function drawSpecks(){ ctx.fillStyle='rgba(255,255,236,.55)'; for(const p of specks){ const q=pj(p.x,p.y,p.z); if(q) ctx.fillRect(q.x,q.y,2,2); } }
function drawBirdShadows(){ for(const b of birds){ const q=pj(b.x+b.z*SUN.x,b.y+b.z*SUN.y,0); if(!q) continue; const w=Math.max(3,.9*q.s); ctx.globalAlpha=.2; ctx.drawImage(shadowSprite,q.x-w,q.y-w*.6*q.k,2*w,1.2*w*q.k); } ctx.globalAlpha=1; }
function drawBirds(){
  ctx.strokeStyle='#1c2b22'; ctx.lineWidth=1.8; ctx.lineCap='round';
  for(const b of birds){ const q=pj(b.x,b.y,b.z); if(!q) continue; const x=q.x, y=q.y, w=Math.max(5,1.1*q.s), f=Math.sin(now*9+b.ph); ctx.beginPath(); ctx.moveTo(x-w,y-f*w*.45); ctx.quadraticCurveTo(x-w*.4,y-w*.35,x,y); ctx.quadraticCurveTo(x+w*.4,y-w*.35,x+w,y-f*w*.45); ctx.stroke(); }
}
const TC={red:'#e2453a',yel:'#f5c43a',blue:'#3d86de',grn:'#4cbf6a',ora:'#f28c38',pur:'#8a63d2',white:'#fbf8f0',ink:'#24303a',brown:'#b8743f',dark:'#7e4a24',muz:'#f1d2a6'};
const BRICK=[TC.red,TC.yel,TC.blue,TC.grn];
function shadeCol(hex,k){ const n=parseInt(hex.slice(1),16), r=(n>>16)&255, g=(n>>8)&255, b=n&255; return `rgb(${Math.round(r*k)},${Math.round(g*k)},${Math.round(b*k)})`; }
function toyT(){ return (game.state==='flight'||game.state==='roll')?(ball.t||0):(game.state==='aim'||game.state==='intro')?0:(ball.t||0); }
function farOf(x,y,z){ if(drawRear){ const p=pj3(x,y,z); return p?p.z:-1e9; } return -(y+z*.8); }
function toyFx(type){
  sfx(type==='wall'||type==='spinner'?'block':type==='bear'?'squeak':type==='spring'?'spring':type==='tunnel'?'tunnel':'boing');
  if(type!=='tunnel') emit(10,ball.x,ball.y,Math.max(.3,ball.z),{spread:4,vz:5,life:.7,col:[TC.red,TC.yel,TC.blue,TC.grn,TC.white],size:.2,g:14});
  cam.shake=Math.max(cam.shake,type==='bumper'||type==='spring'?6:3); buzz(type==='bumper'?22:12);
}
function poly(pts,fill,stroke,lw){ ctx.beginPath(); pts.forEach((q,k)=>k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)); ctx.closePath(); if(fill){ ctx.fillStyle=fill; ctx.fill(); } if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||1; ctx.stroke(); } }
function drawBox(ax,ay,bx,by,w,z0,z1,col){
  const ex=bx-ax, ey=by-ay, l=Math.hypot(ex,ey)||1, nx=-ey/l*w/2, ny=ex/l*w/2;
  const G=[[ax+nx,ay+ny],[bx+nx,by+ny],[bx-nx,by-ny],[ax-nx,ay-ny]], lo=G.map(g=>pj(g[0],g[1],z0)), hi=G.map(g=>pj(g[0],g[1],z1));
  if(lo.some(q=>!q)||hi.some(q=>!q)) return;
  const faces=[];
  for(let k=0;k<4;k++){ const k2=(k+1)%4, mx=(G[k][0]+G[k2][0])/2, my=(G[k][1]+G[k2][1])/2, fx=mx-(ax+bx)/2, fy=my-(ay+by)/2, fl=Math.hypot(fx,fy)||1;
    const lit=clamp(.82-.28*((fx/fl)*SUN.x+(fy/fl)*SUN.y)/Math.hypot(SUN.x,SUN.y),.5,1.05); faces.push({d:farOf(mx,my,(z0+z1)/2),q:[lo[k],lo[k2],hi[k2],hi[k]],c:shadeCol(col,lit)}); }
  faces.sort((a,b)=>b.d-a.d);
  for(const f of faces) poly(f.q,f.c,'rgba(20,28,34,.55)',1);
  poly(hi,shadeCol(col,1.08),'rgba(20,28,34,.6)',1.1);
  const c=pj((ax+bx)/2,(ay+by)/2,z1); if(c&&l>1.2){ const r=Math.max(1.2,.28*c.s); ctx.fillStyle=shadeCol(col,1.18); ctx.beginPath(); ctx.ellipse(c.x,c.y,r,r*c.k,0,0,TAU); ctx.fill(); }
}
function drawCyl(x,y,r,z0,z1,side,top){
  const b=pj(x,y,z0), t=pj(x,y,z1); if(!b||!t) return null;
  const R=r*b.s, Rt=r*t.s;
  ctx.fillStyle=side; ctx.beginPath(); ctx.ellipse(b.x,b.y,R,R*b.k,0,0,Math.PI); ctx.lineTo(t.x-Rt,t.y); ctx.ellipse(t.x,t.y,Rt,Rt*t.k,0,Math.PI,0,true); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(20,28,34,.5)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle=top; ctx.beginPath(); ctx.ellipse(t.x,t.y,Rt,Rt*t.k,0,0,TAU); ctx.fill(); ctx.stroke();
  return t;
}
function toyShadow(x,y,r){ const p=pj(x+SUN.x*1.2,y+SUN.y*1.2,0); if(!p) return; ctx.fillStyle='rgba(8,24,14,.26)'; ctx.beginPath(); ctx.ellipse(p.x,p.y,r*p.s,r*p.s*p.k,0,0,TAU); ctx.fill(); }
function drawBear(o){
  const t=toyT(), P=toyBearPos(o,t), x=P.x, y=P.y, b=pj(x,y,0), up=pj(x,y,1); if(!b||!up) return;
  const S=o.r*b.s, V=Math.max(.35,(b.y-up.y)/(b.s||1)), hop=P.u>0&&P.u<1?Math.sin(P.u*Math.PI)*.5:0;
  const Y=z=>b.y-(z+hop)*V*b.s, wig=P.u===0?Math.sin(now*3)*.06:0;
  toyShadow(x,y,o.r*.9);
  const ell=(cx,cz,rx,rz,col)=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(b.x+cx*S,Y(cz),rx*S,rz*S*Math.max(.55,V),0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(36,24,16,.55)'; ctx.lineWidth=Math.max(1,S*.06); ctx.stroke(); };
  const H=o.h;
  ell(-.45,H*.08,.32,.22,TC.dark); ell(.45,H*.08,.32,.22,TC.dark);
  ell(0,H*.33,.78,.62,TC.brown); ell(0,H*.3,.45,.38,TC.muz);
  ell(-.82,H*.42,.24,.36,TC.brown); ell(.82,H*.42,.24,.36,TC.brown);
  ell(-.5,H*.86+wig,.24,.24,TC.brown); ell(.5,H*.86-wig,.24,.24,TC.brown);
  ell(0,H*.7,.62,.52,TC.brown); ell(0,H*.64,.28,.2,TC.muz);
  ctx.fillStyle=TC.ink; for(const dx of [-.24,.24]){ ctx.beginPath(); ctx.arc(b.x+dx*S,Y(H*.74),Math.max(1,S*.07),0,TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(b.x,Y(H*.67),S*.1,S*.07,0,0,TAU); ctx.fill();
  ctx.fillStyle=TC.red; ctx.beginPath(); ctx.moveTo(b.x,Y(H*.5)); ctx.lineTo(b.x-S*.26,Y(H*.54)); ctx.lineTo(b.x-S*.26,Y(H*.46)); ctx.closePath(); ctx.moveTo(b.x,Y(H*.5)); ctx.lineTo(b.x+S*.26,Y(H*.54)); ctx.lineTo(b.x+S*.26,Y(H*.46)); ctx.closePath(); ctx.fill();
}
function drawBumper(o){
  const t=toyT(), fl=(game.state==='flight'||game.state==='roll')?sstep(.3,0,t-o.hitT):0, r=o.r*(1+.12*fl);
  toyShadow(o.x,o.y,r);
  const top=drawCyl(o.x,o.y,r,0,o.h,shadeCol(TC.red,.78),fl>.1?'#ffd6cf':TC.red); if(!top) return;
  const R=r*top.s*.62; ctx.fillStyle=TC.white; ctx.beginPath(); ctx.ellipse(top.x,top.y,R,R*top.k,0,0,TAU); ctx.fill();
  ctx.fillStyle=TC.yel; ctx.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr=k%2?R*.38:R*.86; ctx.lineTo(top.x+Math.cos(a)*rr,top.y+Math.sin(a)*rr*top.k); } ctx.closePath(); ctx.fill();
}
function drawSpring(o){
  const t=toyT(), sq=(game.state==='flight'||game.state==='roll')?sstep(.35,0,t-o.hitT):0, h=.45*(1-.6*sq);
  const top=drawCyl(o.x,o.y,o.r,0,h,shadeCol(TC.blue,.75),TC.yel); if(!top) return;
  const R=o.r*top.s; ctx.strokeStyle=TC.red; ctx.lineWidth=Math.max(1.4,.16*top.s); ctx.beginPath(); ctx.ellipse(top.x,top.y,R*.8,R*.8*top.k,0,0,TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(top.x,top.y,R*.42,R*.42*top.k,0,0,TAU); ctx.stroke();
}
function drawSpinner(o){
  const a=spinAng(o,toyT()), cx=Math.cos(a)*o.len, cy=Math.sin(a)*o.len;
  toyShadow(o.x,o.y,.9);
  drawBox(o.x-cx,o.y-cy,o.x+cx,o.y+cy,1.2,o.h-1.2,o.h,TC.pur);
  drawCyl(o.x,o.y,.8,0,o.h+.3,shadeCol(TC.white,.8),TC.yel);
}
function drawFan(o){
  const b=pj(o.x,o.y,0); if(!b) return;
  toyShadow(o.x,o.y,2.6);
  drawCyl(o.x,o.y,.6,0,3.6,shadeCol(TC.white,.75),TC.white);
  const c=pj(o.x,o.y,5), px=-o.uy, py=o.ux, e1=pj(o.x+px*3,o.y+py*3,5), e2=pj(o.x,o.y,8); if(!c||!e1||!e2) return;
  const rx=Math.max(3,Math.hypot(e1.x-c.x,e1.y-c.y)), ry=Math.max(3,Math.hypot(e2.x-c.x,e2.y-c.y));
  ctx.fillStyle=TC.blue; ctx.beginPath(); ctx.ellipse(c.x,c.y,rx,ry,0,0,TAU); ctx.fill(); ctx.strokeStyle=TC.ink; ctx.lineWidth=1.2; ctx.stroke();
  ctx.strokeStyle=TC.white; ctx.lineWidth=Math.max(1.5,rx*.18); const sp=now*14;
  ctx.beginPath(); for(let k=0;k<3;k++){ const aa=sp+k*TAU/3; ctx.moveTo(c.x,c.y); ctx.lineTo(c.x+Math.cos(aa)*rx*.8,c.y+Math.sin(aa)*ry*.8); } ctx.stroke();
  ctx.fillStyle=TC.red; ctx.beginPath(); ctx.ellipse(c.x,c.y,rx*.2,ry*.2,0,0,TAU); ctx.fill();
}
function drawFanFlow(o){
  const n=6, lanes=3, sp=o.v*1.6;
  ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineCap='round';
  for(let l=0;l<lanes;l++) for(let k=0;k<n;k++){
    const u=((now*sp+k*o.len/n+l*o.len/(n*lanes))%o.len), v=(l-(lanes-1)/2)*o.w/lanes, x=o.x+o.ux*u-o.uy*v, y=o.y+o.uy*u+o.ux*v;
    const a=pj(x-o.ux*1.1+o.uy*.9,y-o.uy*1.1-o.ux*.9,.15), m=pj(x,y,.15), c=pj(x-o.ux*1.1-o.uy*.9,y-o.uy*1.1+o.ux*.9,.15); if(!a||!m||!c) continue;
    ctx.globalAlpha=.75*sstep(0,.12,u/o.len)*sstep(1,.7,u/o.len); ctx.lineWidth=Math.max(1.2,.22*m.s); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(m.x,m.y); ctx.lineTo(c.x,c.y); ctx.stroke();
  }
  ctx.globalAlpha=1;
}
function drawMouth(m,r,col){
  const px=-m.uy, py=m.ux, arch=(ox,oy,R)=>{ const q=[]; for(let k=0;k<=12;k++){ const f=k/12*Math.PI, p=pj(ox+px*Math.cos(f)*R,oy+py*Math.cos(f)*R,Math.sin(f)*R*1.1); if(!p) return null; q.push(p); } return q; };
  const bx=m.x-m.ux*2.2, by=m.y-m.uy*2.2, back=arch(bx,by,r+.8), inner=arch(m.x,m.y,r), outer=arch(m.x,m.y,r+.8); if(!back||!inner||!outer) return;
  poly(back,shadeCol(col,.62),'rgba(20,28,34,.5)',1);
  poly(inner,'#1b2226');
  poly(outer.concat(inner.slice().reverse()),col,'rgba(20,28,34,.6)',1.1);
}
function toyEntries(){
  const out=[]; if(!hole||!hole.toys) return out;
  const t=toyT();
  for(const o of hole.toys){
    switch(o.type){
      case 'bear': { const P=toyBearPos(o,t); out.push({x:P.x,y:P.y,z:o.h*.5,f:()=>drawBear(o)}); } break;
      case 'bumper': out.push({x:o.x,y:o.y,z:o.h*.5,f:()=>drawBumper(o)}); break;
      case 'spring': out.push({x:o.x,y:o.y,z:0,f:()=>drawSpring(o)}); break;
      case 'spinner': out.push({x:o.x,y:o.y,z:o.h*.5,f:()=>drawSpinner(o)}); break;
      case 'fan': out.push({x:o.x,y:o.y,z:2,f:()=>drawFan(o)}); break;
      case 'tunnel': for(const m of [o.a,o.b]) out.push({x:m.x,y:m.y,z:.6,f:()=>drawMouth(m,o.r,TC.grn)}); break;
      case 'wall': { const P=o.pts; let n=0; for(let k=0;k+1<P.length;k++){ const [ax,ay]=P[k], [bx,by]=P[k+1], L=Math.hypot(bx-ax,by-ay), m=Math.max(1,Math.round(L/3.2));
        for(let q=0;q<m;q++){ const u0=q/m, u1=(q+1)/m, x0=lerp(ax,bx,u0), y0=lerp(ay,by,u0), x1=lerp(ax,bx,u1), y1=lerp(ay,by,u1), col=BRICK[(n++)%4];
          out.push({x:(x0+x1)/2,y:(y0+y1)/2,z:o.h*.5,f:()=>drawBox(x0,y0,x1,y1,o.w,0,o.h,col)}); } } } break;
    }
  }
  return out;
}
function drawToyGround(){ if(!hole||!hole.toys) return; for(const o of hole.toys) if(o.type==='fan') drawFanFlow(o); }
function drawObjects3(){
  const W=view.W, H=view.H, list=[];
  for(const t of trees){ const c=pj(t.x,t.y,t.h); if(!c) continue; const r=t.r*c.s; if(c.x+r<0||c.x-r>W||c.y+r<0||c.y-r>H+t.h*c.s) continue; list.push({z:c.z,t,c}); }
  tbFrame(list.map(o=>o.t));
  for(const o of list) drawTreeShadow(o.t);
  drawFlagShadow(); drawBallShadow(); drawBirdShadows();
  const bp=ball.mode==='gone'?null:pj(ball.x,ball.y,ball.z), fp=pj(hole.pin.x,hole.pin.y,POLE_H*.5);
  if(fp) list.push({z:fp.z,f:drawFlag3});
  if(bp) list.push({z:bp.z,f:drawBall});
  for(const e of toyEntries()){ const q=pj3(e.x,e.y,e.z); if(q) list.push({z:q.z,f:e.f}); }
  list.sort((a,b)=>b.z-a.z);
  for(const o of list){
    if(o.f){ o.f(); continue; }
    let fade=0;
    if(bp&&o.z<bp.z){
      const r=o.t.r*o.c.s+REAR.ballClear, b=pj(o.t.x,o.t.y,0);
      let dx=bp.x-o.c.x, dy=bp.y-o.c.y;
      if(b){ const ex=b.x-o.c.x, ey=b.y-o.c.y, l2=ex*ex+ey*ey, u=l2>0?clamp((dx*ex+dy*ey)/l2,0,1):0; dx-=ex*u; dy-=ey*u; }
      if(dx*dx+dy*dy<r*r) fade=.38;
    }
    drawTree(o.t,fade);
  }
}
function drawHaze(){ const H=view.H*.45, g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(214,234,228,.3)'); g.addColorStop(1,'rgba(214,234,228,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,view.W,H); }
function drawWorld(){
  const vr=visRect();
  drawLayer(course.base,vr); drawLayer(course.green,vr);
  drawWater(); drawGroundMarks(); drawToyGround(); drawBushes(); drawFlow(); drawCup();
  if(drawRear){ drawObjects3(); drawHaze(); }
  else {
    const vis=[]; for(const t of trees) if(treeVisible(t,vr)) vis.push(t);
    tbFrame(vis);
    for(const t of vis) drawTreeShadow(t);
    drawFlagShadow(); drawBallShadow(); drawBirdShadows();
    const dyn=[{d:hole.pin.y+POLE_H*.4,f:drawFlag},{d:ball.y+ball.z*.8,f:drawBall}];
    for(const e of toyEntries()) dyn.push({d:e.y+e.z*.8,f:e.f});
    dyn.sort((a,b)=>a.d-b.d);
    let di=0;
    for(const t of vis){ while(di<dyn.length&&dyn[di].d<t.d){ dyn[di].f(); di++; } drawTree(t); }
    while(di<dyn.length){ dyn[di].f(); di++; }
  }
  drawTracer(); drawAim(); drawParticles(); drawSpecks(); drawBirds(); drawFlyYards();
}
let offCv=null;
function render(){
  const W=view.W, H=view.H;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const k=rear.k, a=!course||k<=0?0:reduceMotion?k:sstep(0,.45,k);
  if(rear.shown!==(a>=.5)){ rear.shown=a>=.5; updateCamReset(); }
  const useGL=!!course&&initGL3();
  showGL3(useGL);
  if(useGL) ctx.clearRect(0,0,W,H); else { ctx.fillStyle=groundBgCss(); ctx.fillRect(0,0,W,H); }
  if(!course) return;
  ctx.imageSmoothingEnabled=true;
  if(a<=0){ drawRear=false; if(useGL) drawGround3(true); groundGL=useGL; try{ drawWorld(); } finally { groundGL=false; } setWindYaw(-Math.PI/2); return; }
  setPose(rearPose()); setWindYaw(pv.yaw);
  if(useGL) drawGround3(false);
  drawRear=true; groundGL=useGL;
  try{ drawWorld(); } finally { drawRear=false; groundGL=false; }
  if(a<1){
    if(!offCv) offCv=document.createElement('canvas');
    if(offCv.width!==cv.width||offCv.height!==cv.height){ offCv.width=cv.width; offCv.height=cv.height; }
    const main=ctx; ctx=offCv.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle=groundBgCss(); ctx.fillRect(0,0,W,H); ctx.imageSmoothingEnabled=true;
    try{ drawWorld(); } finally { ctx=main; }
    ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1-a; ctx.drawImage(offCv,0,0); ctx.globalAlpha=1; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
}
const clubsEl=$('clubs');
CLUBS.forEach((c,i)=>{ const b=document.createElement('button'); b.className='club'; b.type='button'; b.dataset.i=i; b.setAttribute('aria-pressed','false'); b.innerHTML=`${CLUB_IMG[c.id]?`<img class="cimg" src="${CLUB_IMG[c.id]}" alt="" draggable="false">`:''}<b>${c.id}</b><small>–</small>`; b.addEventListener('click',()=>{ if(game.state==='aim'&&!aim.active) setClub(i,true); }); clubsEl.appendChild(b); });
function updateClubsHud(){ updateSpinPanel(); [...clubsEl.children].forEach((b,i)=>{ b.setAttribute('aria-pressed',String(i===game.club)); const cy=i===PT_I?Math.round(CLUBS[i].carry):carryLabel(CLUBS[i].carry); b.querySelector('small').textContent=cy+'Y'; b.setAttribute('aria-label',`${CLUBS[i].id} 最大${cy}ヤード`); }); }
function updateHoleHud(){ $('hNo').textContent=game.hole+1; $('hName').textContent=hole.name; $('hPar').textContent='PAR '+hole.par; $('hGold').textContent='金 '+hole.gold; if(WEB) WEB.afterHoleHud(); }
function updateScoreHud(){ $('strokes').textContent=game.strokes; const n=Math.max(0,hole.par-game.strokes), el=$('left'); el.textContent=n; el.classList.toggle('last',n<=1); if(WEB) WEB.afterScoreHud(); }
function updateWindHud(){ updateWindArrow(); $('windSpd').textContent=wind.speed.toFixed(1); }
function updateLieHud(){ const L=SURF[game.lie], el=$('lie'); el.querySelector('span').textContent=L.name; el.style.setProperty('--dot',L.dot); $('toPin').querySelector('b').textContent=fmtY(distPin()); }
function setBottomMode(m){ $('bottom').dataset.mode=m; $('lie').style.visibility=m==='aim'?'':'hidden'; requestAnimationFrame(measureHud); }
function updateHint(){
  let t='';
  if(game.state==='aim'){ if(CLUBS[game.club].id==='PT'){ if(game.hints.putt<2) t='光の粒が流れる向きが下り坂。曲がりを読んで打とう'; } else if(game.hints.aim<2) t='引っぱって離すとショット。戻すと取り消し'; else if(game.hints.near<2) t=`着地が見えるのは強さ ${Math.round(AIM_SHOW.from*100)} % から。9I・PW・SW は ${AIM_SHOW.near}Y まで`; }
  if(!t&&game.state==='aim'&&rear.on&&!game.hints.cam&&game.hints.aim>=2) t='2本の指でなぞるとカメラが回る（パソコンは右ドラッグ）';
  const el=$('hint'); const ch=el.hidden!==!t; el.textContent=t; el.hidden=!t; if(ch) requestAnimationFrame(measureHud);
}
function updateSpinHud(){
  const s=game.spin.side, b=game.spin.back;
  $('spinDot').style.transform=`translate(${s*17}px,${b*17}px)`;
  $('spinSide').textContent=Math.abs(s)<.05?'まっすぐ':(s>0?'右へ ':'左へ ')+Math.abs(s).toFixed(1);
  $('spinBack').textContent=Math.abs(b)<.05?'なし':(b>0?'バック ':'トップ ')+Math.abs(b).toFixed(1);
}
function toast(title,sub,cls){ const el=$('toast'); el.querySelector('b').textContent=title; const s=el.querySelector('span'); s.textContent=sub||''; s.hidden=!sub; el.className='show '+(cls||''); toastTimer=cls==='big'?2.3:1.5; }
const audio={ctx:null,on:true,noise:null,master:null};
const BGM_FEEL={vol:.3,xf:4,tau:.45,jingle:.5,duck:.25};
const BGM_FILES={F:'assets/audio/bgm_f.mp4',title:'assets/audio/bgm_title.mp4'};
const JINGLE_FILE='assets/audio/jingle_gold.mp4';
const bgm={ok:false,els:[],gains:[],master:null,cur:-1,track:null,xing:false,jEl:null,jGain:null,duckUntil:0};
function bgmInit(){
  if(bgm.ok||!audio.ctx||typeof Audio==='undefined') return;
  try{
    const c=audio.ctx; bgm.master=c.createGain(); bgm.master.gain.value=audio.on?BGM_FEEL.vol:0; bgm.master.connect(c.destination);
    for(let k=0;k<2;k++){ const el=new Audio(); el.preload='auto'; el.crossOrigin='anonymous'; const src=c.createMediaElementSource(el), g=c.createGain(); g.gain.value=0; src.connect(g); g.connect(bgm.master); bgm.els.push(el); bgm.gains.push(g);
      try{ el.muted=true; const pr=el.play(); if(pr&&pr.catch) pr.catch(()=>{}); el.pause(); el.muted=false; }catch(e){} }
    const j=new Audio(); j.preload='auto'; j.crossOrigin='anonymous'; j.src=JINGLE_FILE; const js=c.createMediaElementSource(j); bgm.jGain=c.createGain(); bgm.jGain.gain.value=BGM_FEEL.jingle; js.connect(bgm.jGain); bgm.jGain.connect(c.destination); bgm.jEl=j;
    try{ j.muted=true; const pr=j.play(); if(pr&&pr.catch) pr.catch(()=>{}); j.pause(); j.muted=false; }catch(e){}
    bgm.ok=true;
  }catch(e){ bgm.ok=false; }
}
function bgmFade(k,to){ const g=bgm.gains[k]; if(!g) return; const t=audio.ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(to,t,BGM_FEEL.tau); }
function bgmStart(k,url){ const el=bgm.els[k]; try{ if(el.dataset.src!==url){ el.src=url; el.dataset.src=url; } el.currentTime=0; const pr=el.play(); if(pr&&pr.catch) pr.catch(()=>{}); }catch(e){} bgmFade(k,1); }
function bgmStop(k){ const el=bgm.els[k]; if(!el) return; bgmFade(k,0); setTimeout(()=>{ if(bgm.cur!==k||!bgm.track) try{ el.pause(); }catch(e){} },BGM_FEEL.tau*5000); }
function bgmWant(){ if(['boot','title','select'].includes(game.state)) return 'title'; const c=COURSES[courseNo]; return c?c.id:null; }
function bgmTick(){
  if(!bgm.ok) return;
  const t=audio.ctx.currentTime; bgm.master.gain.setTargetAtTime(audio.on?BGM_FEEL.vol*(t<bgm.duckUntil?BGM_FEEL.duck:1):0,t,t<bgm.duckUntil?.12:BGM_FEEL.tau);
  if(bgm.jGain) bgm.jGain.gain.setTargetAtTime(audio.on?BGM_FEEL.jingle:0,t,.1);
  const want=bgmWant(), url=BGM_FILES[want]||null;
  if(want!==bgm.track){ bgm.track=want; if(bgm.cur>=0) bgmStop(bgm.cur); bgm.xing=false; if(url){ bgm.cur=(bgm.cur+1)&1; bgmStart(bgm.cur,url); } else bgm.cur=-1; return; }
  if(bgm.cur<0||!url) return;
  const el=bgm.els[bgm.cur];
  if(el.duration&&isFinite(el.duration)&&el.currentTime>el.duration-BGM_FEEL.xf&&!bgm.xing){ bgm.xing=true; const old=bgm.cur; bgm.cur=(bgm.cur+1)&1; bgmStop(old); bgmStart(bgm.cur,url); setTimeout(()=>{ bgm.xing=false; },BGM_FEEL.xf*1000); }
}
function jingle(){
  const j=bgm.jEl; if(!bgm.ok||!j||!audio.on||audio.ctx.state!=='running'||j.error||!(j.duration>0)) return false;
  try{ j.currentTime=0; const pr=j.play(); if(pr&&pr.catch) pr.catch(()=>{}); }catch(e){ return false; }
  bgm.duckUntil=audio.ctx.currentTime+j.duration; return true;
}
function initAudio(){ initSfx(); bgmInit(); }
function initSfx(){
  if(audio.ctx){ if(audio.ctx.state==='suspended') audio.ctx.resume().catch(()=>{}); return; }
  try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; const c=new AC(); audio.ctx=c; audio.master=c.createGain(); audio.master.gain.value=.8; audio.master.connect(c.destination); const len=c.sampleRate|0, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; audio.noise=buf; if(c.state==='suspended') c.resume().catch(()=>{}); }catch(e){ audio.ctx=null; }
}
function nz(t,dur,type,f,q,gain,f2){ const c=audio.ctx, s=c.createBufferSource(); s.buffer=audio.noise; s.loop=true; const fl=c.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+dur); fl.Q.value=q; const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+dur); s.connect(fl); fl.connect(g); g.connect(audio.master); s.start(t,Math.random()*.5); s.stop(t+dur+.05); }
function tn(t,f0,f1,dur,gain,type){ const c=audio.ctx, o=c.createOscillator(); o.type=type||'sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur); const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+.004); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(audio.master); o.start(t); o.stop(t+dur+.05); }
function sfx(name,a,b){
  if(!audio.on||!audio.ctx||audio.ctx.state!=='running') return;
  const t=audio.ctx.currentTime+.005;
  try{ switch(name){
    case 'hit': if(a==='PT'){ tn(t,1250,950,.05,.16,'triangle'); nz(t,.025,'bandpass',2200,1.5,.12); } else { const p=b||.5; nz(t,.06,'bandpass',3200,1.1,.25+.35*p); tn(t,190,70,.1,.35+.2*p); tn(t,2400,1900,.03,.08,'triangle'); } break;
    case 'land': { const k=Math.min(1,(b||0)/20); if(a===S.SAND) nz(t,.2,'lowpass',900,.7,.25*k+.05); else if(a===S.GREEN||a===S.FRINGE) tn(t,150,85,.07,.22*k+.04); else tn(t,110,60,.08,.25*k+.04); } break;
    case 'cup': tn(t,1500,1150,.05,.18,'triangle'); tn(t+.07,1150,900,.05,.15,'triangle'); tn(t+.13,900,760,.05,.12,'triangle'); tn(t+.2,240,120,.14,.3); break;
    case 'lip': tn(t,1350,900,.05,.14,'triangle'); break;
    case 'splash': nz(t,.6,'lowpass',2200,.8,.35,260); tn(t,320,90,.18,.12); break;
    case 'tree': nz(t,.35,'bandpass',2600,.7,.28); tn(t,320,140,.06,.2,'triangle'); break;
    case 'ui': tn(t,900,880,.035,.06,'triangle'); break;
    case 'boing': tn(t,300,760,.07,.2,'triangle'); tn(t+.07,760,330,.16,.16,'triangle'); break;
    case 'block': nz(t,.05,'bandpass',1500,2,.3); tn(t,640,320,.06,.18,'square'); break;
    case 'squeak': tn(t,1400,2300,.07,.12,'triangle'); tn(t+.08,2300,1600,.08,.08,'triangle'); break;
    case 'spring': tn(t,180,980,.28,.2,'triangle'); break;
    case 'tunnel': tn(t,420,180,.32,.14); tn(t+.18,380,160,.3,.06); break;
    case 'clap': for(let i=0;i<46;i++){ const dt=Math.random()*1.6, env=Math.sin(Math.min(1,dt/1.6)*Math.PI)+.15; nz(t+dt,.03,'bandpass',1800+Math.random()*1600,1.4,.04+.1*env); } break;
  } }catch(e){}
}
function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
let appRect=app.getBoundingClientRect();
function pt(e){ return {x:e.clientX-appRect.left,y:e.clientY-appRect.top}; }
const PULL=.5, PUTT_EXP=1.5, SETTLE_T=.06, SETTLE_PX=12, SHOT_PULL=.001, PREVIEW_PULL=.001, CANCEL_PX=26;
function setAimPoint(x,y){
  aim.x=x; aim.y=y;
  const dx=x-aim.x0, dy=y-aim.y0, len=Math.hypot(dx,dy);
  aim.cancel=len<CANCEL_PX;
  if(aim.cancel){ aim.pull=0; aim.power=0; return; }
  aim.moved=true;
  const r=clamp((len-CANCEL_PX)/(PULL*Math.min(view.W,view.H)-CANCEL_PX),0,1);
  aim.dir={x:-dx/len,y:-dy/len};
  if(rear.shown){ const d=aimDir3(aim.dir.x,aim.dir.y); if(d) aim.dir=d; }
  aim.pull=r; aim.power=CLUBS[game.club].id==='PT'?Math.pow(r,PUTT_EXP):r;
}
const touches=new Map(), orbit={mode:null,ids:[],mx:0,my:0,dist:1,ang:0};
const ORBIT1_STATES=new Set(['flight','roll','settle','holed','penalty']);
function orbitOn(){ return rear.on&&rear.shown&&REAR_STATES.has(game.state); }
function orbitBy(dYaw,dPitch,zf){
  rear.yawOff=wrapA(rear.yawOff+dYaw); rear.pitch=clamp(rear.pitch+dPitch,REAR.pitchMin,REAR.pitchMax);
  if(zf) rear.zoom=clamp(rear.zoom*zf,REAR.zoomMin,REAR.zoomMax);
  rear.orbitT=0; updateCamReset();
  if(!game.hints.cam){ game.hints.cam=1; updateHint(); }
}
function twoTouch(){ const a=touches.get(orbit.ids[0]), b=touches.get(orbit.ids[1]); if(!a||!b) return null; return {mx:(a.x+b.x)/2,my:(a.y+b.y)/2,dist:Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)),ang:Math.atan2(b.y-a.y,b.x-a.x)}; }
cv.addEventListener('pointerdown',e=>{
  initAudio();
  const p0=pt(e); if(e.pointerType==='mouse') touches.clear(); touches.set(e.pointerId,p0);
  if(game.state==='intro'){ endIntro(); return; }
  if(orbitOn()&&!orbit.mode){
    if(touches.size===2&&e.pointerType!=='mouse'){
      if(aim.active){ aim.active=false; aim.id=null; aim.preview=null; }
      orbit.mode='two'; orbit.ids=[...touches.keys()]; Object.assign(orbit,twoTouch());
      try{ cv.setPointerCapture(e.pointerId); }catch(_){}
      return;
    }
    if(touches.size===1&&(e.button===2||e.shiftKey||ORBIT1_STATES.has(game.state))){
      orbit.mode='one'; orbit.ids=[e.pointerId]; orbit.mx=p0.x; orbit.my=p0.y;
      try{ cv.setPointerCapture(e.pointerId); }catch(_){}
      return;
    }
  }
  if(orbit.mode||e.button===2) return;
  if(aim.active&&e.pointerId!==aim.id&&e.pointerType!=='mouse'){ aim.active=false; aim.id=null; aim.preview=null; toast('取り消し','',''); return; }
  if(game.state==='aim'&&aim.id===null){
    const p=pt(e); aim.id=e.pointerId; aim.active=true; aim.x0=aim.x=p.x; aim.y0=aim.y=p.y; aim.pull=0; aim.power=0; aim.rv=0; aim.cancel=true; aim.moved=false; aim.preview=null; aim.hist=[{t:performance.now()/1000,x:p.x,y:p.y}];
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    return;
  }
});
cv.addEventListener('pointermove',e=>{
  if(touches.has(e.pointerId)) touches.set(e.pointerId,pt(e));
  if(orbit.mode==='two'&&orbit.ids.includes(e.pointerId)){
    const g=twoTouch(); if(!g) return;
    orbitBy((g.mx-orbit.mx)/view.W*REAR.orbitYaw-wrapA(g.ang-orbit.ang),(g.my-orbit.my)/view.H*REAR.orbitPitch,orbit.dist/g.dist);
    Object.assign(orbit,g); return;
  }
  if(orbit.mode==='one'&&e.pointerId===orbit.ids[0]){
    const p=pt(e); orbitBy((p.x-orbit.mx)/view.W*REAR.orbitYaw,(p.y-orbit.my)/view.H*REAR.orbitPitch); orbit.mx=p.x; orbit.my=p.y; return;
  }
  if(aim.active&&e.pointerId===aim.id){
    const p=pt(e); aim.hist.push({t:performance.now()/1000,x:p.x,y:p.y}); if(aim.hist.length>40) aim.hist.shift();
    setAimPoint(p.x,p.y);
  }
});
function endPointer(e,cancel){
  touches.delete(e.pointerId);
  if(orbit.mode&&orbit.ids.includes(e.pointerId)){ orbit.mode=null; orbit.ids=[]; return; }
  if(aim.active&&e.pointerId===aim.id){
    aim.id=null;
    if(!cancel){ const t=performance.now()/1000; let s=null; for(let i=aim.hist.length-1;i>=0;i--) if(t-aim.hist[i].t>=SETTLE_T){ s=aim.hist[i]; break; } if(s&&Math.hypot(aim.x-s.x,aim.y-s.y)<SETTLE_PX) setAimPoint(s.x,s.y); }
    if(!cancel&&game.state==='aim'&&!aim.cancel&&aim.pull>=SHOT_PULL) shoot(); else { if(aim.moved&&game.state==='aim') toast('取り消し','',''); aim.active=false; aim.preview=null; }
  }
}
cv.addEventListener('pointerup',e=>endPointer(e,false));
cv.addEventListener('pointercancel',e=>endPointer(e,true));
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{ if(!orbitOn()) return; e.preventDefault(); orbitBy(0,0,Math.exp(clamp(e.deltaY,-120,120)*(e.ctrlKey?.01:.0015))); },{passive:false});
const spinPad={id:null,x:0,y:0,moved:0,lastTap:-1}, SPIN_PAD_PX=60;
$('spin').addEventListener('pointerdown',e=>{
  if(game.state!=='aim'||aim.active||spinPad.id!==null) return;
  spinPad.id=e.pointerId; spinPad.x=e.clientX; spinPad.y=e.clientY; spinPad.moved=0;
  try{ $('spin').setPointerCapture(e.pointerId); }catch(_){}
});
$('spin').addEventListener('pointermove',e=>{
  if(e.pointerId!==spinPad.id) return;
  const dx=e.clientX-spinPad.x, dy=e.clientY-spinPad.y; spinPad.x=e.clientX; spinPad.y=e.clientY; spinPad.moved+=Math.hypot(dx,dy);
  if(game.state==='aim') setSpin(game.spin.side+dx/SPIN_PAD_PX,game.spin.back+dy/SPIN_PAD_PX);
});
function endSpinPad(e){
  if(e.pointerId!==spinPad.id) return;
  spinPad.id=null;
  if(spinPad.moved<6){ if(now-spinPad.lastTap<.35){ setSpin(0,0); sfx('ui'); spinPad.lastTap=-1; } else spinPad.lastTap=now; return; }
  setSpin(Math.abs(game.spin.side)<.05?0:game.spin.side,Math.abs(game.spin.back)<.05?0:game.spin.back);
}
$('spin').addEventListener('pointerup',endSpinPad);
$('spin').addEventListener('pointercancel',endSpinPad);
$('intro').addEventListener('pointerdown',()=>{ initAudio(); endIntro(); });
document.addEventListener('gesturestart',e=>e.preventDefault());
$('startBtn').addEventListener('click',()=>{ initAudio(); sfx('ui'); showSelect(); });
$('nextBtn').addEventListener('click',()=>{ sfx('ui'); if(!game.cleared) beginHole(game.hole,true); else if(game.hole>=LIST.length-1) showSelect(); else beginHole(game.hole+1); });
$('retryBtn').addEventListener('click',()=>{ sfx('ui'); beginHole(game.hole,true); });
$('listBtn').addEventListener('click',()=>{ sfx('ui'); showSelect(); });
$('menuBtn').addEventListener('click',()=>{ if(game.state==='title'||game.state==='select'||game.state==='loading') return; sfx('ui'); if(WEB&&WEB.onMenu()) return; showSelect(); });
$('retryBtn2').addEventListener('click',()=>{ if(game.state!=='aim'||aim.active) return; sfx('ui'); beginHole(game.hole,true); });
$('viewBtn').addEventListener('click',()=>{ if(game.state!=='aim') return; game.overview=!game.overview; $('viewBtn').setAttribute('aria-pressed',String(game.overview)); sfx('ui'); });
$('rearBtn').addEventListener('click',()=>{ if(aim.active) return; setRear(!rear.on,true); });
$('camReset').addEventListener('click',()=>{ rear.yawOff=0; rear.pitch=REAR.pitch; rear.zoom=1; rear.orbitT=9; sfx('ui'); updateCamReset(); });
$('snd').addEventListener('click',()=>{ audio.on=!audio.on; if(audio.on){ initAudio(); } const b=$('snd'); b.setAttribute('aria-pressed',String(audio.on)); b.setAttribute('aria-label',audio.on?'効果音をオフにする':'効果音をオンにする'); $('sndOn').hidden=!audio.on; $('sndOff').hidden=audio.on; sfx('ui'); });
function measureHud(){
  const r=app.getBoundingClientRect(); appRect=r;
  const tr=$('top').getBoundingClientRect(), br=$('bottom').getBoundingClientRect(), hn=$('hint');
  let bt=br.top; if(!hn.hidden){ const hr=hn.getBoundingClientRect(); if(hr.height) bt=Math.min(bt,hr.top); }
  view.top=tr.bottom-r.top+6; view.bot=r.bottom-bt+6;
}
function resize(){
  const r=app.getBoundingClientRect();
  view.W=Math.max(1,r.width); view.H=Math.max(1,r.height);
  dpr=Math.min(WEB?WEB.dprCap():2,window.devicePixelRatio||1);
  cv.width=Math.round(view.W*dpr); cv.height=Math.round(view.H*dpr);
  measureHud();
}
window.addEventListener('resize',resize);
if(window.ResizeObserver){ const ro=new ResizeObserver(()=>measureHud()); ro.observe($('top')); ro.observe($('bottom')); }
let last=0, acc=0;
function update(dt){
  aim.rv+=(Math.max(aimNear(),sstep(AIM_SHOW.grow,AIM_SHOW.from,aim.power))-aim.rv)*(1-Math.exp(-dt*AIM_SHOW.rate));
  if(flyY.on){
    const far=Math.hypot(ball.x-game.lastPos.x,ball.y-game.lastPos.y), moving=game.state==='flight'||game.state==='roll';
    if(game.state==='flight'&&ball.mode==='air'&&ball.bounces===0) flyY.carry=far;
    else if(moving){ flyY.ran=true; flyY.run=far-flyY.carry; }
    if(!moving) flyY.t-=dt;
    if(flyY.t<=0||aim.active||(!moving&&game.state!=='settle'&&game.state!=='aim'&&game.state!=='holed')) flyY.on=false;
  }
  { const k=1-Math.exp(-dt*FLY_Y.rate); flyY.a+=((flyY.on?1:0)-flyY.a)*k; flyY.r+=((flyY.ran?1:0)-flyY.r)*k; }
  runSchedules(dt);
  let ts=1;
  if(game.state==='roll'){ const dxc=hole.pin.x-ball.x, dyc=hole.pin.y-ball.y, dc=Math.hypot(dxc,dyc), sp=Math.hypot(ball.vx,ball.vy); if(dc<2.8&&sp<11&&sp>.4&&(ball.vx*dxc+ball.vy*dyc)>0) ts=.42; }
  game.ts+=(ts-game.ts)*(1-Math.exp(-dt*10));
  const sdt=dt*game.ts;
  if(game.state==='flight'||game.state==='roll'){
    acc+=sdt; let n=0;
    while(acc>=STEP&&n<60){ physics(STEP); acc-=STEP; n++; if(game.state!=='flight'&&game.state!=='roll'){ acc=0; break; } }
  } else acc=0;
  if(game.state==='flight'&&ball.mode==='roll'){ game.state='roll'; setBottomMode('idle'); }
  if(ball.mode==='air'){ if(tracer.length<900) tracer.push({x:ball.x,y:ball.y,z:ball.z}); tracerA=1; }
  else if(game.state!=='aim'||!aim.active) tracerA=Math.max(0,tracerA-dt*.32);
  pred=(game.state==='flight'&&ball.mode==='air'&&ball.bounces===0)?simulateFlight(ball,true):null;
  if(ball.mode==='holed') ball.holedT+=dt;
  if(game.state==='aim'&&aim.active) aim.preview=computePreview();
  if(hole){ updateParticles(sdt); updateFlow(sdt); updateAmbient(dt); }
  updateCam(dt); updateCam3(dt); bgmTick();
  if(game.state==='flight'||game.state==='roll'||game.state==='settle') $('toPin').querySelector('b').textContent=fmtY(distPin());
  if(toastTimer>0){ toastTimer-=dt; if(toastTimer<=0) $('toast').className=''; }
}
function simulatePutt(st){
  const b={x:st.x,y:st.y,vx:st.vx,vy:st.vy,lipCd:0,lipped:false,putt:true,nocup:true,t:0,tun:null,onSpring:null}, pts=[b.x,b.y]; let len=0, end='cut';
  for(let i=0;i<120*20;i++){
    const px=b.x, py=b.y, ev=rollStep(b,STEP); b.t+=STEP;
    if(ev==='spring'){ pts.push(b.x,b.y); break; }
    if(ev==='tunnel'){ pts.push(px,py); break; }
    if(ev==='water'){ end='water'; pts.push(b.x,b.y); break; }
    len+=Math.hypot(b.x-px,b.y-py);
    if(ev==='rest'){ end='rest'; pts.push(b.x,b.y); break; }
    if(len>=PUTT.preview){ pts.push(b.x,b.y); break; }
    if(i%4===3) pts.push(b.x,b.y);
  }
  return {putt:true,path:true,pts,end,land:{x:pts[pts.length-2],y:pts[pts.length-1]}};
}
function aimNear(){ const p=aim.preview; return aim.active&&p&&!p.putt&&AIM_SHOW.clubs.includes(CLUBS[game.club].id)?1-sstep(AIM_SHOW.near,AIM_SHOW.near+AIM_SHOW.fade,p.carry):0; }
function aimShown(){ return aimNear()>=.5||aim.power>=AIM_SHOW.from; }
function aimMark(){ return sstep(AIM_SHOW.mark,1,aim.rv); }
function computePreview(){
  if(aim.pull<PREVIEW_PULL) return null;
  const c=CLUBS[game.club], st=launchState(aim.dir,aim.power,null,game.spin);
  if(c.id==='PT'){ const d=st.v*st.v/(2*puttMu()*G); if(!hole.assist) return {putt:true,land:{x:ball.x+aim.dir.x*d,y:ball.y+aim.dir.y*d},dist:d}; const r=simulatePutt(st); r.dist=d; return r; }
  const r=simulateFlight(st,false); r.carry=Math.hypot(r.land.x-ball.x,r.land.y-ball.y); return r;
}
function frame(ts){
  const t=ts/1000, dt=last?Math.min(.05,t-last):.016; last=t; now=t;
  try{ update(dt); render(); }catch(err){ console.error(err); }
  requestAnimationFrame(frame);
}
function snapshot(){ return {started:game.state!=='title'&&game.state!=='boot'&&game.state!=='select',course:courseNo,hole:game.hole,soundOn:audio.on,rear:rear.on}; }
function start(data){
  data=data||{};
  resize();
  camR.cx=view.W/2; camR.cy=(view.top+view.H-view.bot)/2;
  if(data.soundOn===false){ audio.on=false; $('sndOn').hidden=true; $('sndOff').hidden=false; $('snd').setAttribute('aria-pressed','false'); }
  loadSave();
  setRear(typeof data.rear==='boolean'?data.rear:true,false);
  if(data.course>=0&&data.course<COURSES.length) setCourse(data.course);
  if(data.started&&typeof data.hole==='number'&&data.hole>=0&&data.hole<LIST.length){
    $('title').hidden=true;
    beginHole(data.hole);
  } else if(LIST.length){
    loadHole(0); game.state='title'; game.hole=0;
    placeBall(hole.tee); game.lie=S.TEE; newWind(); updateHoleHud(); updateScoreHud(); computeCarries(); game.club=autoClub(); updateClubsHud(); updateLieHud();
    const o=overviewTarget(); cam.x=o.x; cam.y=o.y; cam.s=o.s*1.15;
  } else game.state='title';
  requestAnimationFrame(frame);
}
if(WEB) WEB.attach({$,game,ball,aim,rear,audio,CLUBS,get hole(){return hole;},get LIST(){return LIST;},beginHole,showSelect,placeBall,prepareShot,fail,prebuild,sfx,initAudio,scoreName,setBottomMode,updateScoreHud,resize,shoot,physics,surfaceAt,STEP,
  clear(){ game.seq++; schedules=[]; toastTimer=0; $('toast').className=''; aim.active=false; aim.id=null; aim.preview=null; }});
try{ const hot=window.claude&&window.claude.hot; if(hot&&typeof hot.snapshot==='function') hot.snapshot(snapshot); }catch(e){}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.ready) hot.ready(start); else start((hot&&hot.data)||{});
})();
