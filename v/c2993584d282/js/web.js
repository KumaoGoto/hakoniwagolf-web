(function(){
'use strict';
const WEB_VERSION='1.0.1';
const SITE_URL='https://hakoniwagolf.kumao.app/';
const COURSE_NAME='春の名門';
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const API=LOCAL&&new URLSearchParams(location.search).get('ranking')==='local'?'http://127.0.0.1:8791':'https://hakoniwagolf-ranking.saikyo-eigo.workers.dev';
const VER='r1', TERMS_VERSION=1, NAME_MAX=10, BOARD_SIZE=50, TIMEOUT_MS=8000;
const KEY={round:'hakoniwa-golf.round',best:'hakoniwa-golf.round-best',rank:'hakoniwa-golf.ranking',pending:'hakoniwa-golf.pending'};
const TERMS=[
  'ランキングには、決めた名前と合計打数が表示されます。',
  '記録を確かめるため、そのラウンドのショット（番手・向き・強さ・回転・球の位置）もサーバーに送ります。',
  '人を傷つける言葉、性的な言葉、他人の権利を侵す名前は使わないでください。見つけたものは予告なく非表示や変更にすることがあります。',
  'ふさわしくない名前やありえない記録は「通報」できます。通報した相手は、あなたの画面に出なくなります。運営が確かめて非表示にすることがあります。',
  '「名前を変える」の「ランキングをやめて記録を消す」で、名前と記録をいつでもサーバーから消せます。',
  'このブラウザのデータが消えると（しばらく開かないと消えるブラウザもあります）、同じ名前でも別の人として数えられ、前の記録を自分では消せなくなります。消すときは先に「ランキングをやめる」を。',
  'お問い合わせ: support.kumaogoto@gmail.com',
];
let g=null;
const R={mode:null,i:0,scores:[],shots:[],resume:null};
const load=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const save=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const drop=k=>{ try{ localStorage.removeItem(k); }catch(e){} };
const $=id=>document.getElementById(id);
function el(tag,cls,text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
const fmtPar=n=>n===0?'E':n>0?'+'+n:'−'+(-n);
const parOf=i=>g.LIST[i].par;
const capOf=i=>parOf(i)*2;
const totalOf=scores=>scores.reduce((a,b)=>a+b,0);
const toParOf=scores=>scores.reduce((a,s,i)=>a+s-parOf(i),0);
function setMode(m){ R.mode=m; document.documentElement.dataset.mode=m||''; }
function saveRound(strokes,x,y,flying){ save(KEY.round,{v:1,i:R.i,scores:R.scores,shots:R.shots,strokes,x,y,flying:!!flying}); }
function savedRound(){
  const d=load(KEY.round);
  if(!d||d.v!==1||!Array.isArray(d.scores)||!Array.isArray(d.shots)||!(d.i>=0&&d.i<g.LIST.length)||d.scores.length!==d.i) return null;
  return d;
}
function startRound(){
  R.i=0; R.scores=[]; R.shots=g.LIST.map(()=>[]); R.resume=null;
  drop(KEY.round);
  setMode('round'); wake(); g.beginHole(0);
}
function resumeRound(d){
  R.i=d.i; R.scores=d.scores; R.shots=g.LIST.map((_,k)=>Array.isArray(d.shots[k])?d.shots[k]:[]);
  R.resume=d.strokes>0&&isFinite(d.x)&&isFinite(d.y)?{strokes:d.strokes,x:d.x,y:d.y,flying:!!d.flying&&R.shots[R.i].length>0}:null;
  setMode('round'); wake(); g.beginHole(R.i);
}
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
  drop(KEY.round);
  const strokes=totalOf(R.scores), rec={strokes,holes:R.scores.slice(),shots:R.shots};
  const best=load(KEY.best), isBest=!(best&&best.strokes<=strokes);
  if(isBest) save(KEY.best,{strokes,at:Date.now()});
  Rank.enqueue(rec);
  showEndCard(rec,isBest);
}
function replayLast(r){
  const G=g.game, list=R.shots[R.i], [club,angle,power,side,back,x,y]=list[list.length-1];
  G.strokes=r.strokes-1; g.placeBall({x,y}); G.lie=g.surfaceAt(g.hole,x,y);
  G.club=club; G.spin={side,back};
  g.aim.dir={x:Math.cos(angle),y:Math.sin(angle)}; g.aim.power=power;
  R.replaying=true; g.shoot(); R.replaying=false;
  let n=0;
  while(n<60000&&(G.state==='flight'||G.state==='roll')){ g.physics(g.STEP); n++; }
}
function fillGrid(box,scores){
  box.innerHTML='';
  g.LIST.forEach((h,k)=>{
    const c=el('div','sc-cell'), s=scores[k];
    c.append(el('span','sc-no',String(k+1)),el('span','sc-par',`P${h.par}`));
    const v=el('b','sc-v',s==null?'·':String(s));
    if(s!=null){ const d=s-h.par; v.classList.add(d<0?'under':d===0?'even':d===1?'over':'far'); }
    c.append(v);
    c.setAttribute('aria-label',`${k+1}番 パー${h.par} ${s==null?'まだ':s+'打'}`);
    box.append(c);
  });
}
function showHoleCard(st){
  const k=R.i-1, h=g.LIST[k], capped=st>=capOf(k)&&!g.game.cleared;
  $('rcKicker').textContent=`HOLE ${k+1} · ${h.name}`;
  const t=$('rcTitle'); t.textContent=capped?'打ち切り':g.scoreName(st,h.par); t.className=st<h.par?'gold':capped?'fail':'';
  $('rcSub').textContent=`${st}打 · 通算 ${fmtPar(toParOf(R.scores))}`;
  fillGrid($('rcGrid'),R.scores);
  $('rcNext').textContent=R.i===g.LIST.length-1?'最終ホールへ':'次のホールへ';
  $('roundCard').hidden=false;
  setTimeout(()=>{ try{ $('rcNext').focus({preventScroll:true}); }catch(e){} },50);
}
function showEndCard(rec,isBest){
  const d=toParOf(rec.holes);
  $('reTotal').textContent=rec.strokes;
  $('reSub').textContent=`通算 ${fmtPar(d)}（パー ${g.LIST.reduce((a,h)=>a+h.par,0)}）`+(isBest?' · 自己ベスト!':'');
  fillGrid($('reGrid'),rec.holes);
  $('reStatus').textContent='';
  R.last=rec; R.declined=false;
  refreshEndButtons();
  $('endCard').hidden=false;
  if(Rank.joined) Rank.push().then(reportRank).catch(()=>{ $('reStatus').textContent='ランキングに送れませんでした（あとで送ります）'; });
}
function reportRank(r){
  const s=$('reStatus');
  if(!r){ s.textContent='ランキングに送れませんでした（あとで送ります）'; return; }
  if(r.rejected){ s.textContent='この記録はランキングに受け付けられませんでした'; return; }
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
  const text=`箱庭ゴルフ「${COURSE_NAME}」を ${r.strokes} 打で回った（${fmtPar(toParOf(r.holes))}）！ #箱庭ゴルフ\n${SITE_URL}`, data={text};
  if(navigator.share&&(!navigator.canShare||navigator.canShare(data))){
    try{ await navigator.share(data); return; }catch(e){ if(e&&e.name==='AbortError') return; }
  }
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
}
function refreshTitle(){
  const d=savedRound(), b=load(KEY.best);
  const main=$('roundBtn'), again=$('roundAgain');
  if(d){ main.textContent=`つづきから（${d.i+1} 番 · 通算 ${fmtPar(d.scores.reduce((a,s,i)=>a+s-parOf(i),0))}）`; again.hidden=false; }
  else { main.textContent='ラウンドを始める'; again.hidden=true; }
  $('titleBest').textContent=b&&b.strokes?`自己ベスト ${b.strokes} 打`:'';
}
function toTitle(){
  if(lock){ lock.release().catch(()=>{}); lock=null; }
  g.clear(); setMode(null); g.game.state='title'; g.setBottomMode('idle');
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
const Rank={
  state:load(KEY.rank)||{},
  pending:load(KEY.pending),
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
  enqueue(rec){ if(!this.pending||rec.strokes<this.pending.strokes){ this.pending=rec; save(KEY.pending,rec); } },
  push(){
    if(this.pushing) return this.pushing;
    this.pushing=(async()=>{
      let again=true, out=this.lastSent||null;
      while(this.pending&&this.joined){
        const rec=this.pending;
        try{
          out=await this.call('POST','/v1/submit',{uid:this.state.uid,ver:VER,strokes:rec.strokes,holes:rec.holes,shots:rec.shots});
          this.lastSent=out;
          if(this.pending===rec){ this.pending=null; drop(KEY.pending); }
        }catch(e){
          if(e.status===409&&again){
            again=false;
            await this.call('POST','/v1/register',{uid:this.state.uid,name:this.state.name,terms:TERMS_VERSION});
            continue;
          }
          if(e.status===0||e.status===429||e.status>=500) return null;
          if(this.pending===rec){ this.pending=null; drop(KEY.pending); }
          return {rejected:true};
        }
      }
      return out;
    })().finally(()=>{ this.pushing=null; });
    return this.pushing;
  },
  async join(raw){
    const name=cleanName(raw);
    if(!name) return '名前を入れてください';
    const uid=this.state.uid||newUid();
    try{
      const r=await this.call('POST','/v1/register',{uid,name,terms:TERMS_VERSION});
      this.state={joined:true,name:r.name||name,uid,pid:r.pid||''}; save(KEY.rank,this.state);
      if(R.last&&!$('endCard').hidden&&!this.pending&&!this.lastSent) this.enqueue(R.last);
      this.push().then(r2=>{ if(!$('endCard').hidden) reportRank(r2); }).catch(()=>{});
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
      this.state={}; drop(KEY.rank); this.pending=null; drop(KEY.pending); this.lastSent=null;
      return null;
    }catch(e){ return 'つながりませんでした。もう一度試してください'; }
  },
};
let rankSeq=0;
function openRank(view){
  const my=++rankSeq;
  $('rankSheet').hidden=false;
  const body=$('rankBody'); body.innerHTML='';
  if(view==='join'||view==='rename') renderJoin(body,view==='rename');
  else renderBoard(body,my);
}
function closeRank(){ rankSeq++; $('rankSheet').hidden=true; if(!$('endCard').hidden) refreshEndButtons(); }
async function renderBoard(body,my){
  body.append(el('p','rk-empty','読み込み中…'));
  try{
    if(Rank.joined) await Rank.push().catch(()=>{});
    const q=new URLSearchParams({ver:VER,limit:String(BOARD_SIZE)});
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
      const list=el('ol','rk-list');
      for(const e of r.top){
        const li=el('li','rk-row'+(e.mine?' mine':''));
        li.append(el('span','rk-rank',String(e.rank)),el('span','rk-name',e.name),el('b','rk-score',String(e.strokes)),el('span','rk-par',fmtPar(e.strokes-72)));
        if(!e.mine&&Rank.joined){ li.classList.add('tap'); li.onclick=()=>rowMenu(li,e); }
        list.append(li);
      }
      body.append(list);
      if(Rank.joined) body.append(el('p','rk-small','名前を押すと、通報・表示しないができます'));
    }
    if(Rank.joined&&!r.top.some(e=>e.mine)) body.append(el('p','rk-mine',r.myRank?`あなたは ${r.myRank} 位（${r.mine.strokes} 打）`:'あなたの記録はまだありません。18 ホールを回ると載ります'));
    if(!Rank.joined){
      if(Rank.pending){ const b=el('button','primary',`${Rank.pending.strokes} 打の記録を載せる`); b.onclick=()=>openRank('join'); body.append(b); }
      else body.append(el('p','rk-small','18 ホールを回ると、記録を載せるか聞きます'));
    }
  }catch(e){
    if(my!==rankSeq) return;
    body.innerHTML='';
    body.append(el('p','rk-empty','つながりませんでした'));
    const again=el('button','secondary','もう一度読む'); again.onclick=()=>openRank(); body.append(again);
  }
}
function rowMenu(li,e){
  const open=li.querySelector('.rk-menu'); if(open){ open.remove(); return; }
  const m=el('div','rk-menu'), act=(label,path,extra,done)=>{
    const b=el('button',null,label);
    b.onclick=async ev=>{ ev.stopPropagation(); b.disabled=true; try{ await Rank.call('POST',path,{uid:Rank.state.uid,pid:e.pid,...extra}); li.remove(); note(done); }catch(_){ b.disabled=false; note('つながりませんでした'); } };
    m.append(b);
  };
  act('この人を表示しない','/v1/block',{},`「${e.name}」を表示しないにしました`);
  act('通報する（名前）','/v1/report',{reason:'name'},'通報しました。ありがとうございます');
  act('通報する（ありえない記録）','/v1/report',{reason:'cheat'},'通報しました。ありがとうございます');
  li.append(m);
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
  <p class="kicker">${COURSE_NAME} · 18 ホール</p>
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
  <p class="kicker">${COURSE_NAME} · 18 ホールの合計打数</p>
  <h2 id="rkTitle" class="sheet-h">ランキング</h2>
  <div id="rankBody"></div>
  <button id="rkClose" class="secondary rk-close">閉じる</button>
</div></div>`;
function build(){
  $('app').insertAdjacentHTML('beforeend',CARD_HTML);
  const card=document.querySelector('.titlecard');
  card.querySelector('.kicker').textContent='春の 18 ホール、パーで回れるか。';
  const wind=card.querySelector('.howto li:last-child b'); if(wind) wind.textContent='風を読んで、少ない打数で';
  const start=$('startBtn');
  start.className='secondary'; start.textContent='練習';
  const main=el('button','primary'); main.id='roundBtn';
  const again=el('button','secondary wide','はじめから回る'); again.id='roundAgain'; again.hidden=true;
  const row=el('div','row2'), rank=el('button','secondary','ランキング'); rank.id='rankBtn';
  start.replaceWith(main); main.after(again); again.after(row); row.append(start,rank);
  const best=el('p','title-best'); best.id='titleBest'; main.before(best);
  const foot=el('p','fine'); foot.innerHTML=`ブラウザ版 ${WEB_VERSION} · <a href="privacy.html">プライバシー</a>`;
  card.append(foot);
  const back=el('button','secondary wide','タイトルへ'); back.id='selBack';
  document.querySelector('.selectcard').append(back);
  document.querySelector('.selectcard h2').textContent='練習するホールを選ぶ';
  main.onclick=()=>{ g.initAudio(); g.sfx('ui'); const d=savedRound(); if(d) resumeRound(d); else startRound(); };
  let armedAgain=false;
  again.onclick=()=>{
    g.initAudio(); g.sfx('ui');
    if(!armedAgain){ armedAgain=true; again.textContent='もう一度押すと、今の記録を消します'; setTimeout(()=>{ armedAgain=false; again.textContent='はじめから回る'; },4000); return; }
    armedAgain=false; again.textContent='はじめから回る'; startRound();
  };
  start.addEventListener('click',()=>{ setMode('practice'); wake(); });
  rank.onclick=()=>{ g.initAudio(); g.sfx('ui'); openRank(); };
  back.onclick=()=>{ g.sfx('ui'); toTitle(); };
  $('rcNext').onclick=()=>{ g.sfx('ui'); $('roundCard').hidden=true; g.beginHole(R.i); };
  $('reRank').onclick=()=>{ g.sfx('ui'); openRank(Rank.joined||R.declined?undefined:'join'); };
  $('reSkip').onclick=()=>{ g.sfx('ui'); R.declined=true; Rank.pending=null; drop(KEY.pending); refreshEndButtons(); $('reStatus').textContent='今回は載せません'; };
  $('reShare').onclick=()=>{ g.sfx('ui'); share(); };
  $('reAgain').onclick=()=>{ g.sfx('ui'); $('endCard').hidden=true; startRound(); };
  $('reTitle').onclick=()=>{ g.sfx('ui'); toTitle(); };
  $('rkClose').onclick=()=>{ g.sfx('ui'); closeRank(); };
  $('psBack').onclick=()=>{ g.sfx('ui'); $('pauseSheet').hidden=true; };
  $('psTitleBtn').onclick=()=>{ g.sfx('ui'); toTitle(); };
  let armed=false;
  $('psQuit').onclick=()=>{
    g.sfx('ui');
    if(!armed){ armed=true; $('psQuit').textContent='記録を消してやめる'; $('psNote').textContent='もう一度押すと、この回の記録を消します'; setTimeout(()=>{ armed=false; $('psQuit').textContent='やめる'; $('psNote').textContent='タイトルへ戻っても、続きから遊べます'; },4000); return; }
    armed=false; drop(KEY.round); toTitle();
  };
  $('menuBtn').setAttribute('aria-label','メニュー');
  refreshTitle();
}
window.addEventListener('storage',e=>{
  if(!g) return;
  if(e.key===KEY.rank||e.key===null) Rank.state=load(KEY.rank)||{};
  if(e.key===KEY.pending||e.key===null) Rank.pending=load(KEY.pending);
  if(e.key===KEY.round||e.key===null){ if(R.mode==='round') toTitle(); else refreshTitle(); }
});
let lock=null;
async function wake(){ try{ if(navigator.wakeLock&&!lock&&!document.hidden){ lock=await navigator.wakeLock.request('screen'); lock.addEventListener('release',()=>{ lock=null; }); } }catch(e){} }
document.addEventListener('visibilitychange',()=>{
  const c=g&&g.audio.ctx;
  if(document.hidden){ if(c&&c.state==='running') c.suspend().catch(()=>{}); }
  else { if(c&&c.state==='suspended') c.resume().catch(()=>{}); if(R.mode) wake(); }
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
  limit:h=>R.mode==='round'?h.par*2:h.par,
  holedTitle:(st,h)=>R.mode==='round'?g.scoreName(st,h.par):null,
  failText:h=>R.mode==='round'?['打ち切り',`${h.par*2}打を記録`]:null,
  onShot(club,dir,power,spin,x,y){
    if(R.mode!=='round'||R.replaying) return;
    R.shots[R.i].push([club,Math.atan2(dir.y,dir.x),power,spin.side,spin.back,x,y]);
    saveRound(g.game.strokes+1,x,y,true);
  },
  onAim(){ if(R.mode==='round') saveRound(g.game.strokes,g.ball.x,g.ball.y,false); },
  onHoleReady(){
    if(R.mode!=='round'||!R.resume) return false;
    const r=R.resume; R.resume=null;
    if(r.flying){ replayLast(r); return true; }
    g.game.strokes=r.strokes; g.placeBall({x:r.x,y:r.y}); g.game.lastPos={x:r.x,y:r.y}; g.updateScoreHud();
    if(r.strokes>=capOf(R.i)) g.fail(); else g.prepareShot();
    return true;
  },
  showResult(){
    if(R.mode!=='round') return false;
    const cap=capOf(R.i);
    endHole(Math.min(g.game.cleared?g.game.last:g.game.strokes,cap));
    return true;
  },
  afterHoleHud(){
    const round_=R.mode==='round', e=$('hGold');
    e.classList.toggle('gold',!round_);
    if(round_) e.textContent=g.hole.yards+'Y';
  },
  afterScoreHud(){
    const lbl=document.querySelector('.scorebox>div:nth-child(2) .lbl'), e=$('left');
    if(R.mode==='round'){
      lbl.textContent='通算'; e.textContent=fmtPar(toParOf(R.scores)); e.classList.remove('last');
      if(R.i<g.LIST.length) $('strokes').textContent=Math.min(g.game.strokes,capOf(R.i));
    }
    else lbl.textContent='あと';
  },
  afterIntro(){ if(R.mode==='round') $('inGold').textContent='通算 '+fmtPar(toParOf(R.scores)); },
  onMenu(){
    if(R.mode!=='round') return false;
    if(!['aim','intro'].includes(g.game.state)) return true;
    $('psSub').textContent=`${R.i+1} 番 · 通算 ${fmtPar(toParOf(R.scores))}`;
    $('pauseSheet').hidden=false;
    return true;
  },
  attach(api){
    g=api; build(); watchFrames();
    if(Rank.joined&&Rank.pending) Rank.push().catch(()=>{});
    if('serviceWorker' in navigator&&location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
    if(navigator.storage&&navigator.storage.persist&&!/firefox/i.test(navigator.userAgent)) navigator.storage.persist().catch(()=>{});
    if(LOCAL) window.__hg={g,R,Rank,KEY};
  },
};
})();
