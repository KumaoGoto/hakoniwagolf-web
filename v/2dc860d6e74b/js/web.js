(function(){
'use strict';
const WEB_VERSION='1.1.1';
const SITE_URL='https://hakoniwagolf.kumao.app/';
const COURSE_NAME='春の名門';
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const QS=new URLSearchParams(location.search);
const API=LOCAL&&QS.get('ranking')==='local'?'http://127.0.0.1:8791':'https://hakoniwagolf-ranking.saikyo-eigo.workers.dev';
const VER_ROUND='r1', TERMS_VERSION=1, NAME_MAX=10, BOARD_SIZE=50, TIMEOUT_MS=8000;
const KEY={round:'hakoniwa-golf.round',best:'hakoniwa-golf.round-best',week:'hakoniwa-golf.week',weekBest:'hakoniwa-golf.week-best',
  rank:'hakoniwa-golf.ranking',pending:'hakoniwa-golf.pending',pendingByVer:'hakoniwa-golf.pending-by-ver'};
const TERMS=[
  'ランキングには、決めた名前と合計打数、ホールごとの打数が表示されます。',
  '記録を確かめるため、そのラウンドのショット（番手・向き・強さ・回転・球の位置）もサーバーに送ります。',
  '人を傷つける言葉、性的な言葉、他人の権利を侵す名前は使わないでください。見つけたものは予告なく非表示や変更にすることがあります。',
  'ふさわしくない名前やありえない記録は「通報」できます。通報した相手は、あなたの画面に出なくなります。運営が確かめて非表示にすることがあります。',
  '「名前を変える」の「ランキングをやめて記録を消す」で、名前と記録をいつでもサーバーから消せます。',
  'このブラウザのデータが消えると（しばらく開かないと消えるブラウザもあります）、同じ名前でも別の人として数えられ、前の記録を自分では消せなくなります。消すときは先に「ランキングをやめる」を。',
  'お問い合わせ: support.kumaogoto@gmail.com',
];
const DAY=86400000, JST=9*3600000;
const NOW_SHIFT=(()=>{ if(!LOCAL) return 0; const t=Date.parse(QS.get('now')||''); return isFinite(t)?t-Date.now():0; })();
const now=()=>Date.now()+NOW_SHIFT;
let g=null;
const R={mode:null,i:0,scores:[],shots:[],resume:null,week:null};
const load=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const save=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const drop=k=>{ try{ localStorage.removeItem(k); }catch(e){} };
const $=id=>document.getElementById(id);
function el(tag,cls,text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
const fmtPar=n=>n===0?'E':n>0?'+'+n:'−'+(-n);
let weekCache=null;
function thisWeek(){ const t=now(); if(!weekCache||t<weekCache.start||t>=weekCache.end) weekCache=g.weeklyAt(t); return weekCache; }
function weekOfVer(ver){
  const m=/^w\d+-(\d{4}-\d{2}-\d{2})$/.exec(ver||''); if(!m) return null;
  const w=g.weeklyAt(Date.parse(m[1]+'T12:00:00Z')-JST);
  return w&&w.ver===ver?w:null;
}
const prevWeek=w=>w&&w.w>0?g.weeklyAt(w.start-DAY):null;
const md=day=>{ const p=day.split('-').map(Number); return `${p[1]}/${p[2]}`; };
const weekRange=w=>`${md(w.monday)}〜${md(new Date(Date.parse(w.monday+'T00:00:00Z')+6*DAY).toISOString().slice(0,10))}`;
function daysLeft(){ const d=Math.floor((now()+JST)/DAY); return 7-((d+3)%7+7)%7; }
const courseName=h=>{ const c=g.courseOf(h); return c?c.name:''; };
function holesOfVer(ver){ if(ver===VER_ROUND) return fHoles(); const w=weekOfVer(ver); return w?w.holes:[]; }
const fIndex=()=>g.COURSES.findIndex(c=>c.id==='F');
const fHoles=()=>g.COURSES[fIndex()].holes;
const inRound=()=>R.mode==='round'||R.mode==='weekly';
const parOf=i=>g.LIST[i].par;
const capOf=i=>parOf(i)*2;
const totalOf=scores=>scores.reduce((a,b)=>a+b,0);
const toParOf=(scores,list=g.LIST)=>scores.reduce((a,s,i)=>a+s-list[i].par,0);
const verOfMode=()=>R.mode==='weekly'&&R.week?R.week.ver:VER_ROUND;
function setMode(m){ R.mode=m; document.documentElement.dataset.mode=m||''; }
function saveRound(strokes,x,y,flying){
  const d={v:1,i:R.i,scores:R.scores,shots:R.shots,strokes,x,y,flying:!!flying};
  if(R.mode==='weekly'){ d.ver=R.week.ver; save(KEY.week,d); } else save(KEY.round,d);
}
function validSave(d,n){ return d&&d.v===1&&Array.isArray(d.scores)&&Array.isArray(d.shots)&&d.i>=0&&d.i<n&&d.scores.length===d.i; }
function savedRound(){ const d=load(KEY.round); return validSave(d,fHoles().length)?d:null; }
function savedWeek(){ const w=thisWeek(), d=load(KEY.week); return w&&validSave(d,w.holes.length)&&d.ver===w.ver?d:null; }
function begin(mode,list,d){
  R.i=d?d.i:0; R.scores=d?d.scores:[]; R.shots=list.map((_,k)=>d&&Array.isArray(d.shots[k])?d.shots[k]:[]);
  R.resume=d&&d.strokes>0&&isFinite(d.x)&&isFinite(d.y)?{strokes:d.strokes,x:d.x,y:d.y,flying:!!d.flying&&R.shots[R.i].length>0}:null;
  if(mode==='weekly') g.setList(list); else g.setCourse(fIndex());
  setMode(mode); wake(); g.beginHole(R.i);
}
function startRound(){ drop(KEY.round); R.week=null; begin('round',fHoles(),null); }
function resumeRound(d){ R.week=null; begin('round',fHoles(),d); }
function startWeekly(){ const w=thisWeek(); if(!w) return; drop(KEY.week); R.week=w; begin('weekly',w.holes,null); }
function resumeWeekly(d){ R.week=thisWeek(); begin('weekly',R.week.holes,d); }
function endHole(st){
  R.scores.push(st); R.i++;
  saveRound(0,null,null,false);
  g.updateScoreHud();
  if(R.i>=g.LIST.length) finishRound();
  else {
    showHoleCard(st);
    setTimeout(()=>{ try{ g.prebuild(R.i); }catch(e){} },450);
  }
}
function finishRound(){
  const ver=verOfMode(), list=g.LIST.slice();
  const strokes=totalOf(R.scores), rec={strokes,holes:R.scores.slice(),shots:R.shots};
  let isBest;
  if(R.mode==='weekly'){
    drop(KEY.week);
    const best=load(KEY.weekBest); isBest=!(best&&best.ver===ver&&best.strokes<=strokes);
    if(isBest) save(KEY.weekBest,{ver,strokes,at:Date.now()});
  } else {
    drop(KEY.round);
    const best=load(KEY.best); isBest=!(best&&best.strokes<=strokes);
    if(isBest) save(KEY.best,{strokes,at:Date.now()});
  }
  Rank.enqueue(ver,rec);
  showEndCard(rec,isBest,ver,list);
}
function weekBest(w){ const b=load(KEY.weekBest); return w&&b&&b.ver===w.ver&&b.strokes>0?b.strokes:null; }
function replayLast(r){
  const G=g.game, list=R.shots[R.i], [club,angle,power,side,back,x,y]=list[list.length-1];
  G.strokes=r.strokes-1; g.placeBall({x,y}); G.lie=g.surfaceAt(g.hole,x,y);
  G.club=club; G.spin={side,back};
  g.aim.dir={x:Math.cos(angle),y:Math.sin(angle)}; g.aim.power=power;
  R.replaying=true; g.shoot(); R.replaying=false;
  let n=0;
  while(n<60000&&(G.state==='flight'||G.state==='roll')){ g.physics(g.STEP); n++; }
}
function fillGrid(box,scores,list=g.LIST){
  box.innerHTML='';
  const few=list.length<=3;
  box.classList.toggle('three',few);
  list.forEach((h,k)=>{
    const c=el('div','sc-cell'), s=scores[k];
    c.append(el('span','sc-no',few?`${k+1} 番`:String(k+1)));
    if(few) c.append(el('span','sc-course',courseName(h)));
    c.append(el('span','sc-par',`P${h.par}`));
    const v=el('b','sc-v',s==null?'·':String(s));
    if(s!=null){ const d=s-h.par; v.classList.add(d<0?'under':d===0?'even':d===1?'over':'far'); }
    c.append(v);
    c.setAttribute('aria-label',`${k+1}番${few?' '+courseName(h):''} パー${h.par} ${s==null?'まだ':s+'打'}`);
    box.append(c);
  });
}
function showHoleCard(st){
  const k=R.i-1, h=g.LIST[k], capped=st>=capOf(k)&&!g.game.cleared;
  $('rcKicker').textContent=R.mode==='weekly'?`HOLE ${k+1} · ${courseName(h)} · ${h.name}`:`HOLE ${k+1} · ${h.name}`;
  const t=$('rcTitle'); t.textContent=capped?'打ち切り':g.scoreName(st,h.par); t.className=st<h.par?'gold':capped?'fail':'';
  $('rcSub').textContent=`${st}打 · 通算 ${fmtPar(toParOf(R.scores))}`;
  fillGrid($('rcGrid'),R.scores);
  $('rcNext').textContent=R.i===g.LIST.length-1?'最終ホールへ':'次のホールへ';
  $('roundCard').hidden=false;
  setTimeout(()=>{ try{ $('rcNext').focus({preventScroll:true}); }catch(e){} },50);
}
function showEndCard(rec,isBest,ver,list){
  const d=toParOf(rec.holes,list), w=weekOfVer(ver);
  $('reKicker').textContent=w?`今週の 3 ホール · ${weekRange(w)}`:`${COURSE_NAME} · 18 ホール`;
  $('reTotal').textContent=rec.strokes;
  $('reSub').textContent=`通算 ${fmtPar(d)}（パー ${list.reduce((a,h)=>a+h.par,0)}）`+(isBest?(w?' · 今週のベスト!':' · 自己ベスト!'):'');
  fillGrid($('reGrid'),rec.holes,list);
  $('reStatus').textContent='';
  R.last=rec; R.lastVer=ver; R.lastList=list; R.lastMode=R.mode; R.declined=false;
  refreshEndButtons();
  $('endCard').hidden=false;
  if(Rank.joined) Rank.push(ver).then(reportRank).catch(()=>{ $('reStatus').textContent='ランキングに送れませんでした（あとで送ります）'; });
}
function reportRank(r){
  const s=$('reStatus');
  if(!r){ s.textContent='ランキングに送れませんでした（あとで送ります）'; return; }
  if(r.rejected){ s.textContent=r.code==='closed'?'この週の受付は終わりました':'この記録はランキングに受け付けられませんでした'; return; }
  if(r.hidden){ s.textContent='あなたの名前は運営が確認中です'; return; }
  s.textContent=`${r.total} 人中 ${r.rank} 位`+(r.best?' · 記録を更新':` · あなたの記録は ${r.strokes}`);
}
function refreshEndButtons(){
  const ask=!Rank.joined&&!R.declined;
  $('reRank').textContent=ask?'載せる':'ランキングを見る';
  $('reSkip').hidden=!ask;
  if(ask) $('reStatus').textContent='ランキングに載せますか？';
}
async function share(){
  const r=R.last; if(!r) return;
  const w=weekOfVer(R.lastVer), d=fmtPar(toParOf(r.holes,R.lastList));
  const text=(w?`箱庭ゴルフ「今週の 3 ホール」（${weekRange(w)}）を ${r.strokes} 打で回った（${d}）！`:`箱庭ゴルフ「${COURSE_NAME}」を ${r.strokes} 打で回った（${d}）！`)+` #箱庭ゴルフ\n${SITE_URL}`, data={text};
  if(navigator.share&&(!navigator.canShare||navigator.canShare(data))){
    try{ await navigator.share(data); return; }catch(e){ if(e&&e.name==='AbortError') return; }
  }
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
}
function refreshTitle(){
  const w=thisWeek();
  $('weekBox').hidden=!w;
  if(w){
    const wd=savedWeek(), b=weekBest(w), left=daysLeft();
    $('weekSub').textContent=wd?`つづきから（${wd.i+1} 番 · 通算 ${fmtPar(toParOf(wd.scores,w.holes))}）`:w.holes.map(courseName).join(' · ');
    $('weekMeta').textContent=[left<=1?'今日まで':`あと ${left} 日`,b?`今週のベスト ${b} 打`:''].filter(Boolean).join(' · ');
    $('weekAgain').hidden=!wd;
  }
  const d=savedRound(), b=load(KEY.best), main=$('roundBtn');
  main.textContent=d?`${COURSE_NAME}のつづき（${d.i+1} 番 · 通算 ${fmtPar(toParOf(d.scores,fHoles()))}）`:`${COURSE_NAME} 18 ホール`;
  $('roundAgain').hidden=!d;
  $('titleBest').textContent=b&&b.strokes?`18 ホールの自己ベスト ${b.strokes} 打`:'';
}
function toTitle(){
  if(lock){ lock.release().catch(()=>{}); lock=null; }
  g.clear(); setMode(null); R.week=null; g.setCourse(fIndex()); g.game.state='title'; g.setBottomMode('idle');
  for(const id of ['roundCard','endCard','pauseSheet','select','card','intro','rankSheet']) $(id).hidden=true;
  refreshTitle(); $('title').hidden=false;
}
class HttpError extends Error{ constructor(status,code){ super(code||`HTTP ${status}`); this.status=status; this.code=code; } }
function graphemes(t){ return typeof Intl!=='undefined'&&Intl.Segmenter?Array.from(new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(t),x=>x.segment):Array.from(t); }
function cleanName(s){
  const t=String(s||'').replace(/[\u0000-\u001f\u007f-\u009f​‎‏‪-‮⁠-⁩﻿]/g,'').trim();
  return graphemes(t).slice(0,NAME_MAX).join('');
}
function newUid(){ const a=new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a,x=>x.toString(16).padStart(2,'0')).join(''); }
function loadPending(){
  const d=load(KEY.pendingByVer), out=d&&typeof d==='object'&&!Array.isArray(d)?d:{};
  const old=load(KEY.pending);
  if(old&&Array.isArray(old.holes)&&!(out[VER_ROUND]&&out[VER_ROUND].strokes<=old.strokes)) out[VER_ROUND]=old;
  if(old){ drop(KEY.pending); save(KEY.pendingByVer,out); }
  return out;
}
const Rank={
  state:load(KEY.rank)||{},
  pending:loadPending(),
  lastSent:{},
  get joined(){ return !!(this.state.joined&&this.state.uid&&this.state.name); },
  async call(method,path,body){
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),TIMEOUT_MS);
    try{
      const res=await fetch(API+path,{method,headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:ctl.signal,cache:'no-store'});
      let j={}; try{ j=await res.json(); }catch(e){}
      if(!res.ok) throw new HttpError(res.status,j.error);
      return j;
    }catch(e){
      if(e instanceof HttpError) throw e;
      throw new HttpError(0,'offline');
    }finally{ clearTimeout(timer); }
  },
  savePending(){ if(Object.keys(this.pending).length) save(KEY.pendingByVer,this.pending); else drop(KEY.pendingByVer); },
  enqueue(ver,rec){ const p=this.pending[ver]; if(!p||rec.strokes<p.strokes){ this.pending[ver]=rec; this.savePending(); } },
  dropPending(ver,rec){ if(this.pending[ver]&&(!rec||this.pending[ver]===rec)){ delete this.pending[ver]; this.savePending(); } },
  push(ver){
    const run=async()=>{
      if(ver) return this.pushOne(ver);
      for(const v of Object.keys(this.pending)) await this.pushOne(v);
      return null;
    };
    this.queue=(this.queue||Promise.resolve()).then(run,run);
    return this.queue;
  },
  async pushOne(ver){
    let again=true, out=this.lastSent[ver]||null;
    while(this.pending[ver]&&this.joined){
      const rec=this.pending[ver];
      try{
        out=await this.call('POST','/v1/submit',{uid:this.state.uid,ver,strokes:rec.strokes,holes:rec.holes,shots:rec.shots});
        this.lastSent[ver]=out;
        this.dropPending(ver,rec);
      }catch(e){
        if(e.status===409&&again){
          again=false;
          await this.call('POST','/v1/register',{uid:this.state.uid,name:this.state.name,terms:TERMS_VERSION});
          continue;
        }
        if(e.status===0||e.status===429||e.status>=500) return null;
        this.dropPending(ver,rec);
        return {rejected:true,code:e.code};
      }
    }
    return out;
  },
  async join(raw){
    const name=cleanName(raw);
    if(!name) return '名前を入れてください';
    const uid=this.state.uid||newUid();
    try{
      const r=await this.call('POST','/v1/register',{uid,name,terms:TERMS_VERSION});
      this.state={joined:true,name:r.name||name,uid,pid:r.pid||''}; save(KEY.rank,this.state);
      const onEnd=R.last&&!$('endCard').hidden;
      if(onEnd&&!R.declined&&!this.pending[R.lastVer]&&!this.lastSent[R.lastVer]) this.enqueue(R.lastVer,R.last);
      if(onEnd) this.push(R.lastVer).then(r2=>{ if(!$('endCard').hidden) reportRank(r2); }).catch(()=>{});
      this.push().catch(()=>{});
      return null;
    }catch(e){
      if(e.code==='ng name'||e.code==='bad name') return 'その名前は使えません';
      if(e.status===429) return '少し時間をおいて試してください';
      return 'つながりませんでした';
    }
  },
  async leave(){
    try{
      await this.call('POST','/v1/leave',{uid:this.state.uid});
      this.state={}; drop(KEY.rank); this.pending={}; this.savePending(); this.lastSent={};
      return null;
    }catch(e){ return 'つながりませんでした。もう一度試してください'; }
  },
};
let rankSeq=0;
let rankVer=null;
function openRank(view,ver){
  const my=++rankSeq;
  if(ver) rankVer=ver;
  if(!rankVer){ const w=thisWeek(); rankVer=w?w.ver:VER_ROUND; }
  $('rankSheet').hidden=false;
  renderRankHead();
  const body=$('rankBody'); body.innerHTML='';
  if(view==='join'||view==='rename') renderJoin(body,view==='rename');
  else renderBoard(body,my);
}
function closeRank(){ rankSeq++; $('rankSheet').hidden=true; if(!$('endCard').hidden) refreshEndButtons(); }
function renderRankHead(){
  const cur=thisWeek(), prev=prevWeek(cur), tabs=$('rkTabs'), w=weekOfVer(rankVer);
  tabs.innerHTML='';
  const tab=(label,ver)=>{
    const b=el('button','rk-tab',label); b.type='button'; b.setAttribute('aria-pressed',String(ver===rankVer));
    b.onclick=()=>{ if(ver===rankVer) return; g.sfx('ui'); openRank(undefined,ver); };
    tabs.append(b);
  };
  if(cur) tab('今週の 3 ホール',cur.ver);
  if(prev) tab('先週',prev.ver);
  if(w&&(!cur||w.ver!==cur.ver)&&(!prev||w.ver!==prev.ver)) tab(weekRange(w),w.ver);
  tab(`${COURSE_NAME} 18 ホール`,VER_ROUND);
  if(w){
    $('rkKicker').textContent=`${cur&&w.ver===cur.ver?'今週の 3 ホール':prev&&w.ver===prev.ver?'先週の 3 ホール':'3 ホール'} · ${weekRange(w)} · 合計打数`;
    $('rkHoles').textContent=w.holes.map(h=>`${courseName(h)} ${g.courseOf(h).holes.indexOf(h)+1} 番`).join(' · ');
  } else {
    $('rkKicker').textContent=`${COURSE_NAME} · 18 ホールの合計打数`;
    $('rkHoles').textContent='';
  }
}
async function renderBoard(body,my){
  const ver=rankVer, list=holesOfVer(ver), parTotal=list.reduce((a,h)=>a+h.par,0), n=list.length;
  body.append(el('p','rk-empty','読み込み中…'));
  try{
    if(Rank.joined) await Rank.push(ver).catch(()=>{});
    const q=new URLSearchParams({ver,limit:String(BOARD_SIZE)});
    if(Rank.joined) q.set('uid',Rank.state.uid);
    const r=await Rank.call('GET',`/v1/board?${q}`);
    if(my!==rankSeq) return;
    body.innerHTML='';
    const head=el('div','rk-head');
    head.append(el('span',null,`参加 ${r.total} 人`));
    if(Rank.joined){ const me=el('button','rk-link',`${Rank.state.name}（名前を変える）`); me.onclick=()=>openRank('rename'); head.append(me); }
    body.append(head);
    if(r.mine&&r.mine.hidden) body.append(el('p','rk-small','あなたの名前は運営が確認中のため、ほかの人には表示されていません'));
    if(!r.top.length) body.append(el('p','rk-empty','まだ誰の記録もありません'));
    else {
      const rows=el('ol','rk-list'), holesOf=e=>Array.isArray(e.holes)&&e.holes.length===n?e.holes:null;
      for(const e of r.top){
        const li=el('li','rk-row'+(e.mine?' mine':''));
        li.append(el('span','rk-rank',String(e.rank)),el('span','rk-name',e.name),el('b','rk-score',String(e.strokes)),el('span','rk-par',fmtPar(e.strokes-parTotal)));
        const holes=holesOf(e), menu=!e.mine&&Rank.joined;
        if(holes||menu){
          li.classList.add('tap'); li.tabIndex=0; li.setAttribute('aria-expanded','false');
          li.onclick=()=>rowDetail(rows,li,e,holes,menu,list);
          li.onkeydown=ev=>{ if(ev.target===li&&(ev.key==='Enter'||ev.key===' ')){ ev.preventDefault(); li.click(); } };
        }
        rows.append(li);
      }
      body.append(rows);
      const anyHoles=r.top.some(holesOf);
      if(anyHoles) body.append(el('p','rk-small',Rank.joined?'名前を押すと、各ホールの打数と、通報・表示しないが出ます':'名前を押すと、各ホールの打数が出ます'));
      else if(Rank.joined) body.append(el('p','rk-small','名前を押すと、通報・表示しないができます'));
    }
    const holesText=n===3?'3 ホール':'18 ホール';
    if(Rank.joined&&!r.top.some(e=>e.mine)) body.append(el('p','rk-mine',r.myRank?`あなたは ${r.myRank} 位（${r.mine.strokes} 打）`:`あなたの記録はまだありません。${holesText}を回ると載ります`));
    if(!Rank.joined){
      if(Rank.pending[ver]){ const b=el('button','primary',`${Rank.pending[ver].strokes} 打の記録を載せる`); b.onclick=()=>openRank('join'); body.append(b); }
      else body.append(el('p','rk-small',`${holesText}を回ると、記録を載せるか聞きます`));
    }
  }catch(e){
    if(my!==rankSeq) return;
    body.innerHTML='';
    body.append(el('p','rk-empty','つながりませんでした'));
    const again=el('button','secondary','もう一度読む'); again.onclick=()=>openRank(); body.append(again);
  }
}
function rowDetail(rows,li,e,holes,menu,list){
  const open=li.querySelector('.rk-detail');
  for(const d of rows.querySelectorAll('.rk-detail')){ d.parentNode.setAttribute('aria-expanded','false'); d.remove(); }
  if(open) return;
  const box=el('div','rk-detail');
  if(holes){ const grid=el('div','sc-grid'); fillGrid(grid,holes,list); box.append(grid); }
  if(menu) box.append(rowMenu(li,e));
  li.append(box); li.setAttribute('aria-expanded','true');
  try{ box.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(_){}
}
function rowMenu(li,e){
  const m=el('div','rk-menu'), act=(label,path,extra,done)=>{
    const b=el('button',null,label);
    b.onclick=async ev=>{ ev.stopPropagation(); b.disabled=true; try{ await Rank.call('POST',path,{uid:Rank.state.uid,pid:e.pid,...extra}); li.remove(); note(done); }catch(_){ b.disabled=false; note('つながりませんでした'); } };
    m.append(b);
  };
  act('この人を表示しない','/v1/block',{},`「${e.name}」を表示しないにしました`);
  act('通報する（名前）','/v1/report',{reason:'name'},'通報しました。ありがとうございます');
  act('通報する（ありえない記録）','/v1/report',{reason:'cheat'},'通報しました。ありがとうございます');
  return m;
}
function note(text){ const t=el('div','rk-note',text); $('rankSheet').querySelector('.card').append(t); setTimeout(()=>t.remove(),2400); }
function renderJoin(body,renaming){
  const box=el('div','rk-join');
  box.append(el('p','rk-lead',renaming?'新しい名前':'ランキングに出る名前を決めてください'));
  const input=el('input','rk-input'); input.type='text'; input.maxLength=40; input.placeholder='名前'; input.autocomplete='off'; input.value=renaming?Rank.state.name:'';
  const count=el('div','rk-count'), upd=()=>{ count.textContent=`${graphemes(cleanName(input.value)).length} / ${NAME_MAX} 文字`; };
  input.oninput=upd; upd();
  box.append(input,count);
  const terms=el('div','rk-terms'); terms.append(el('b',null,'利用規約'));
  const ul=el('ul'); for(const t of TERMS) ul.append(el('li',null,t)); terms.append(ul);
  box.append(terms);
  const row=el('label','rk-agree'), agree=el('input'); agree.type='checkbox'; row.append(agree,document.createTextNode(' 利用規約に同意する'));
  box.append(row);
  const msg=el('p','rk-error'), label=renaming?'この名前にする':'この名前で載せる', go=el('button','primary',label);
  go.onclick=async()=>{
    if(!agree.checked){ msg.textContent='利用規約に同意してください'; return; }
    go.disabled=true; go.textContent='送っています…';
    const my=rankSeq, err=await Rank.join(input.value);
    if(my!==rankSeq) return;
    if(err){ msg.textContent=err; go.disabled=false; go.textContent=label; return; }
    openRank();
  };
  box.append(msg,go);
  const back=el('button','rk-link','もどす'); back.onclick=()=>{ if($('endCard').hidden||renaming) openRank(); else closeRank(); }; box.append(back);
  if(renaming){
    const leave=el('button','rk-danger','ランキングをやめて記録を消す'); let armed=false;
    leave.onclick=async()=>{
      if(!armed){ armed=true; leave.textContent='もう一度押すと、名前と記録を消します'; return; }
      leave.disabled=true; leave.textContent='消しています…';
      const my=rankSeq, err=await Rank.leave();
      if(my!==rankSeq) return;
      if(err){ msg.textContent=err; leave.disabled=false; armed=false; leave.textContent='ランキングをやめて記録を消す'; return; }
      openRank();
    };
    box.append(leave,el('p','rk-id',`ID（問い合わせのときに使います）: ${Rank.state.pid}`));
  }
  body.append(box);
}
const CARD_HTML=`
<div id="roundCard" class="overlay" hidden><div class="card result rcard" role="dialog" aria-modal="true" aria-labelledby="rcTitle">
  <p class="kicker" id="rcKicker"></p><h2 id="rcTitle"></h2><p id="rcSub" class="cardSub"></p>
  <div id="rcGrid" class="sc-grid"></div>
  <button id="rcNext" class="primary">次のホールへ</button>
</div></div>
<div id="endCard" class="overlay" hidden><div class="card result rcard" role="dialog" aria-modal="true" aria-labelledby="reTotal">
  <p class="kicker" id="reKicker"></p>
  <h2 class="re-total"><span id="reTotal"></span><small>打</small></h2><p id="reSub" class="cardSub"></p>
  <div id="reGrid" class="sc-grid"></div>
  <p id="reStatus" class="re-status" aria-live="polite"></p>
  <button id="reRank" class="primary">ランキングを見る</button>
  <button id="reSkip" class="rk-link re-skip" hidden>今回は載せない</button>
  <div class="row2"><button id="reShare" class="secondary">シェア</button><button id="reAgain" class="secondary">もう一度回る</button></div>
  <button id="reTitle" class="rk-link re-title">タイトルへ</button>
</div></div>
<div id="pauseSheet" class="overlay" hidden><div class="card" role="dialog" aria-modal="true" aria-labelledby="psTitle">
  <h2 id="psTitle" class="sheet-h">ラウンド中</h2>
  <p id="psSub" class="cardSub"></p>
  <button id="psBack" class="primary">つづける</button>
  <div class="row2"><button id="psTitleBtn" class="secondary">タイトルへ</button><button id="psQuit" class="secondary">やめる</button></div>
  <p class="fine" id="psNote">タイトルへ戻っても、続きから遊べます</p>
</div></div>
<div id="rankSheet" class="overlay" hidden><div class="card ranksheet" role="dialog" aria-modal="true" aria-labelledby="rkTitle">
  <p class="kicker" id="rkKicker"></p>
  <h2 id="rkTitle" class="sheet-h">ランキング</h2>
  <div id="rkTabs" class="rk-tabs"></div>
  <p id="rkHoles" class="rk-holes"></p>
  <div id="rankBody"></div>
  <button id="rkClose" class="secondary rk-close">閉じる</button>
</div></div>`;
function armTwice(btn,label,go){
  let armed=false, timer=0;
  btn.onclick=()=>{
    g.initAudio(); g.sfx('ui');
    if(!armed){ armed=true; btn.textContent='もう一度押すと、今の記録を消します'; timer=setTimeout(()=>{ armed=false; btn.textContent=label; },4000); return; }
    clearTimeout(timer); armed=false; btn.textContent=label; go();
  };
}
function build(){
  $('app').insertAdjacentHTML('beforeend',CARD_HTML);
  const card=document.querySelector('.titlecard');
  card.querySelector('.kicker').textContent='毎週替わる 3 ホールと、春の 18 ホール。';
  const wind=card.querySelector('.howto li:last-child b'); if(wind) wind.textContent='風を読んで、少ない打数で';
  const start=$('startBtn');
  start.className='secondary'; start.textContent='練習';
  const week=el('div','week-box'); week.id='weekBox';
  const weekBtn=el('button','primary week-btn'); weekBtn.id='weekBtn';
  const weekSub=el('span','week-sub'); weekSub.id='weekSub';
  weekBtn.append(el('span','week-title','今週の 3 ホール'),weekSub);
  const weekMeta=el('p','week-meta'); weekMeta.id='weekMeta';
  const weekAgain=el('button','rk-link week-again','はじめから回る'); weekAgain.id='weekAgain'; weekAgain.hidden=true;
  week.append(weekBtn,weekMeta,weekAgain);
  const main=el('button','secondary wide round-btn'); main.id='roundBtn';
  const again=el('button','rk-link week-again','はじめから回る'); again.id='roundAgain'; again.hidden=true;
  const row=el('div','row2'), rank=el('button','secondary','ランキング'); rank.id='rankBtn';
  start.replaceWith(week); week.after(main); main.after(again); again.after(row); row.append(start,rank);
  const best=el('p','title-best'); best.id='titleBest'; again.after(best);
  const foot=el('p','fine'); foot.innerHTML=`ブラウザ版 ${WEB_VERSION} · <a href="privacy.html">プライバシー</a>`;
  card.append(foot);
  const back=el('button','secondary wide','タイトルへ'); back.id='selBack';
  document.querySelector('.selectcard').append(back);
  document.querySelector('.selectcard h2').textContent='練習するホールを選ぶ';
  const inCourse=el('p','in-course'); inCourse.id='inCourse'; inCourse.hidden=true; $('inName').before(inCourse);
  weekBtn.onclick=()=>{ g.initAudio(); g.sfx('ui'); const d=savedWeek(); if(d) resumeWeekly(d); else startWeekly(); };
  armTwice(weekAgain,'はじめから回る',startWeekly);
  main.onclick=()=>{ g.initAudio(); g.sfx('ui'); const d=savedRound(); if(d) resumeRound(d); else startRound(); };
  armTwice(again,'はじめから回る',startRound);
  start.addEventListener('click',()=>{ setMode('practice'); wake(); });
  rank.onclick=()=>{ g.initAudio(); g.sfx('ui'); const w=thisWeek(); openRank(undefined,w?w.ver:VER_ROUND); };
  back.onclick=()=>{ g.sfx('ui'); toTitle(); };
  $('rcNext').onclick=()=>{ g.sfx('ui'); $('roundCard').hidden=true; g.beginHole(R.i); };
  $('reRank').onclick=()=>{ g.sfx('ui'); openRank(Rank.joined||R.declined?undefined:'join',R.lastVer); };
  $('reSkip').onclick=()=>{ g.sfx('ui'); R.declined=true; Rank.dropPending(R.lastVer); refreshEndButtons(); $('reStatus').textContent='今回は載せません'; };
  $('reShare').onclick=()=>{ g.sfx('ui'); share(); };
  $('reAgain').onclick=()=>{ g.sfx('ui'); $('endCard').hidden=true; if(R.lastMode==='weekly'&&thisWeek()) startWeekly(); else startRound(); };
  $('reTitle').onclick=()=>{ g.sfx('ui'); toTitle(); };
  $('rkClose').onclick=()=>{ g.sfx('ui'); closeRank(); };
  $('psBack').onclick=()=>{ g.sfx('ui'); $('pauseSheet').hidden=true; };
  $('psTitleBtn').onclick=()=>{ g.sfx('ui'); toTitle(); };
  let armed=false;
  $('psQuit').onclick=()=>{
    g.sfx('ui');
    if(!armed){ armed=true; $('psQuit').textContent='記録を消してやめる'; $('psNote').textContent='もう一度押すと、この回の記録を消します'; setTimeout(()=>{ armed=false; $('psQuit').textContent='やめる'; $('psNote').textContent='タイトルへ戻っても、続きから遊べます'; },4000); return; }
    armed=false; drop(R.mode==='weekly'?KEY.week:KEY.round); toTitle();
  };
  $('menuBtn').setAttribute('aria-label','メニュー');
  refreshTitle();
  setInterval(()=>{ if(!$('title').hidden&&!document.hidden) refreshTitle(); },60000);
}
window.addEventListener('storage',e=>{
  if(!g) return;
  if(e.key===KEY.rank||e.key===null) Rank.state=load(KEY.rank)||{};
  if(e.key===KEY.pendingByVer||e.key===null) Rank.pending=load(KEY.pendingByVer)||{};
  const mine=R.mode==='weekly'?KEY.week:KEY.round, other=R.mode==='weekly'?KEY.round:KEY.week;
  if(e.key===mine||e.key===null){ if(inRound()) toTitle(); else refreshTitle(); }
  else if(e.key===other||e.key===KEY.best||e.key===KEY.weekBest){ if(!R.mode) refreshTitle(); }
});
let lock=null;
async function wake(){ try{ if(navigator.wakeLock&&!lock&&!document.hidden){ lock=await navigator.wakeLock.request('screen'); lock.addEventListener('release',()=>{ lock=null; }); } }catch(e){} }
document.addEventListener('visibilitychange',()=>{
  const c=g&&g.audio.ctx;
  if(document.hidden){ if(c&&c.state==='running') c.suspend().catch(()=>{}); }
  else { if(c&&c.state==='suspended') c.resume().catch(()=>{}); if(R.mode) wake(); else if(g&&!$('title').hidden) refreshTitle(); }
});
let dprCap=2;
function watchFrames(){
  let last=0, sum=0, n=0;
  const tick=t=>{
    const d=t-last; last=t;
    if(d>0&&d<250&&!document.hidden){ sum+=d; n++; }
    if(n>=120){ const avg=sum/n; sum=0; n=0; if(avg>40&&dprCap>1){ dprCap=Math.max(1,dprCap-.5); g.resize(); } }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
window.HG_WEB={
  dprCap:()=>dprCap,
  courses:c=>c.id==='F',
  limit:h=>inRound()?h.par*2:h.par,
  holedTitle:(st,h)=>inRound()?g.scoreName(st,h.par):null,
  failText:h=>inRound()?['打ち切り',`${h.par*2}打を記録`]:null,
  onShot(club,dir,power,spin,x,y){
    if(!inRound()||R.replaying) return;
    R.shots[R.i].push([club,Math.atan2(dir.y,dir.x),power,spin.side,spin.back,x,y]);
    saveRound(g.game.strokes+1,x,y,true);
  },
  onAim(){ if(inRound()) saveRound(g.game.strokes,g.ball.x,g.ball.y,false); },
  onHoleReady(){
    if(!inRound()||!R.resume) return false;
    const r=R.resume; R.resume=null;
    if(r.flying){ replayLast(r); return true; }
    g.game.strokes=r.strokes; g.placeBall({x:r.x,y:r.y}); g.game.lastPos={x:r.x,y:r.y}; g.updateScoreHud();
    if(r.strokes>=capOf(R.i)) g.fail(); else g.prepareShot();
    return true;
  },
  showResult(){
    if(!inRound()) return false;
    const cap=capOf(R.i);
    endHole(Math.min(g.game.cleared?g.game.last:g.game.strokes,cap));
    return true;
  },
  afterHoleHud(){
    const round_=inRound(), e=$('hGold');
    e.classList.toggle('gold',!round_);
    if(round_) e.textContent=g.hole.yards+'Y';
  },
  afterScoreHud(){
    const lbl=document.querySelector('.scorebox>div:nth-child(2) .lbl'), e=$('left');
    if(inRound()){
      lbl.textContent='通算'; e.textContent=fmtPar(toParOf(R.scores)); e.classList.remove('last');
      if(R.i<g.LIST.length) $('strokes').textContent=Math.min(g.game.strokes,capOf(R.i));
    }
    else lbl.textContent='あと';
  },
  afterIntro(){
    if(inRound()) $('inGold').textContent='通算 '+fmtPar(toParOf(R.scores));
    const c=$('inCourse'), weekly=R.mode==='weekly';
    c.hidden=!weekly; if(weekly) c.textContent=courseName(g.hole);
  },
  onMenu(){
    if(!inRound()) return false;
    if(!['aim','intro'].includes(g.game.state)) return true;
    $('psTitle').textContent=R.mode==='weekly'?'今週の 3 ホール':'ラウンド中';
    $('psSub').textContent=`${R.i+1} 番 · 通算 ${fmtPar(toParOf(R.scores))}`;
    $('pauseSheet').hidden=false;
    return true;
  },
  attach(api){
    g=api; build(); watchFrames();
    if(Rank.joined&&Object.keys(Rank.pending).length) Rank.push().catch(()=>{});
    if('serviceWorker' in navigator&&location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
    if(navigator.storage&&navigator.storage.persist&&!/firefox/i.test(navigator.userAgent)) navigator.storage.persist().catch(()=>{});
    if(LOCAL) window.__hg={g,R,Rank,KEY,thisWeek,weekOfVer};
  },
};
})();
