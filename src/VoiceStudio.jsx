import React,{useEffect,useRef,useState} from 'react';
import VoiceHubTraining from './VoiceHubTraining';
import './VoiceHubTraining.css';
export default function VoiceStudio(){
 const [page,setPage]=useState('home');
 const [audio,setAudio]=useState(null);
 const [begin,setBegin]=useState(0),[finish,setFinish]=useState(15),[speed,setSpeed]=useState(1),[loops,setLoops]=useState('infinite');
 const [textId,setTextId]=useState('sample');
 const [texts,setTexts]=useState(()=>{
  try{const x=JSON.parse(localStorage.getItem('voice-flow-reading-scripts-v1')||'null');if(Array.isArray(x))return x}catch{}
  return [{id:'sample',title:'발표 연습',body:'안녕하세요. / 오늘은 제가 준비한 내용을 / 세 가지로 나누어 말씀드리겠습니다.'}];
 });
 const [editingScript,setEditingScript]=useState(false);
 const player=useRef(null);
 const [playing,setPlaying]=useState(false),[repeatCount,setRepeatCount]=useState(0);
 useEffect(()=>{try{localStorage.setItem('voice-flow-reading-scripts-v1',JSON.stringify(texts))}catch{}},[texts]);
 useEffect(()=>()=>{if(audio)URL.revokeObjectURL(audio)},[audio]);
 const loadFile=file=>{if(!file)return;setAudio(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(file)});setBegin(0);setFinish(15);setRepeatCount(0)};
 const seekLoop=e=>{
  const element=e.currentTarget;if(!(finish>begin)||element.currentTime<finish)return;
  if(loops==='infinite'||repeatCount+1<Number(loops)){setRepeatCount(n=>n+1);element.currentTime=begin;element.play().catch(()=>{})}
  else{element.pause();setPlaying(false);setRepeatCount(0)}
 };
 const record=texts.find(x=>x.id===textId)||texts[0];
 const sections=[['home','홈'],['drill','드릴'],['shadow','쉐도잉'],['reading','낭독']];
 return <div className="voice-canonical">
  <header className="voice-canonical-header">
   <div><strong>Voice Flow</strong><small>VOICE STUDIO</small></div>
   <span className="voice-studio-note">드릴 · 쉐도잉 · 낭독</span>
  </header>
  <main className="voice-studio-content">
   {page==='home'&&<section className="voice-studio-panel">
    <h2>나의 목소리 훈련</h2><p>기초 발성부터 표현까지, 소리를 편안하고 자유롭게 조절하는 연습.</p>
    <div className="voice-home-grid">
     <button onClick={()=>setPage('drill')}><b>드릴</b><small>기초 · 음정 · 음색 · 기교 · 표현</small></button>
     <button onClick={()=>setPage('shadow')}><b>쉐도잉</b><small>음원 구간 반복 · 배속 조절</small></button>
     <button onClick={()=>setPage('reading')}><b>낭독</b><small>원고 읽기 · 프레이징 연습</small></button>
    </div>
    <p className="voice-studio-note">기존 Voice Flow의 녹음과 분석은 원본 앱에서 확인할 수 있어.</p>
   </section>}
   {page==='drill'&&<VoiceHubTraining/>}
   {page==='shadow'&&<section className="voice-studio-panel">
    <h2>쉐도잉</h2><p>원본 음원을 들으며 선택한 구간을 반복하고 따라 말해 봐.</p>
    <label className="voice-studio-upload">음원 파일 불러오기<input type="file" accept="audio/*" onChange={e=>loadFile(e.target.files?.[0])}/></label>
    {audio?<><audio ref={player} src={audio} controls preload="metadata" onTimeUpdate={seekLoop} onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d))setFinish(Math.min(15,d))}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>
    <div className="voice-studio-grid"><label>A 시작 (초)<input type="number" min="0" step="0.1" value={begin} onChange={e=>setBegin(Math.max(0,Number(e.target.value)||0))}/></label>
    <label>B 종료 (초)<input type="number" min="0" step="0.1" value={finish} onChange={e=>setFinish(Math.max(0,Number(e.target.value)||0))}/></label>
    <label>재생 속도<select value={speed} onChange={e=>{const n=Number(e.target.value);setSpeed(n);if(player.current)player.current.playbackRate=n}}>{[0.5,0.6,0.7,0.8,0.9,1,1.1,1.2,1.3,1.4,1.5].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>
    <label>반복 횟수<select value={loops} onChange={e=>setLoops(e.target.value)}>{['3','5','10','infinite'].map(n=><option key={n} value={n}>{n==='infinite'?'무한':n+'회'}</option>)}</select></label></div>
    <div className="voice-drill-tools"><button onClick={()=>{if(player.current)setBegin(Number(player.current.currentTime.toFixed(1)))}}>현재를 A로</button><button onClick={()=>{if(player.current)setFinish(Number(player.current.currentTime.toFixed(1)))}}>현재를 B로</button>
    <button onClick={()=>{if(!player.current||finish<=begin)return;player.current.currentTime=begin;player.current.playbackRate=speed;setRepeatCount(0);player.current.play().catch(()=>{})}}>구간 반복</button></div>
    <small>완료 반복 {repeatCount}회 · {playing?'재생 중':'일시정지'}</small></>:<p className="voice-studio-note">음원은 이 기기에서만 열려. 업로드하거나 서버에 저장하지 않아.</p>}
   </section>}
   {page==='reading'&&<section className="voice-studio-panel">
    <div className="voice-studio-title"><h2>낭독</h2><button onClick={()=>{const id=String(Date.now());setTexts(old=>[...old,{id,title:'새 원고',body:''}]);setTextId(id);setEditingScript(true)}}>+ 원고</button></div>
    <select value={record?.id||''} onChange={e=>{setTextId(e.target.value);setEditingScript(false)}}>{texts.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select>
    {editingScript?<><input value={record?.title||''} onChange={e=>setTexts(old=>old.map(x=>x.id===record?.id?{...x,title:e.target.value}:x))} placeholder="원고 제목"/>
    <textarea rows={12} value={record?.body||''} onChange={e=>setTexts(old=>old.map(x=>x.id===record?.id?{...x,body:e.target.value}:x))} placeholder="낭독할 원고"/>
    <button onClick={()=>setEditingScript(false)}>저장하고 읽기</button></>:<>
     <div className="voice-reading-text">{record?.body||'원고를 입력해 줘.'}</div>
     <p className="voice-studio-note">/ 짧은 쉼 · // 긴 쉼</p>
     <button onClick={()=>setEditingScript(true)}>원고 수정</button>
    </>}
    <p className="voice-studio-note">이 화면의 새 원고는 현재 기기에 저장돼. 기존 Supabase 원고와 녹음 자료는 상단 기존 녹음·분석에서 사용할 수 있어.</p>
   </section>}
  </main>
  <nav className="voice-studio-bottom" aria-label="Voice Flow 하단 메뉴">
   {sections.map(([id,title])=><button key={id} className={page===id?'active':''} onClick={()=>{setPage(id);window.scrollTo(0,0)}}>{title}</button>)}
  </nav>
 </div>
}
