import React, {useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ChevronDown,ExternalLink,Settings2,X,Check,Link2,Trash2,ShieldCheck,RefreshCw,MonitorSmartphone} from 'lucide-react';
import './style.css';

const HUB = "Voice Flow";
const MODES = [["expression","Expression",""],["voice","Voice",""],["sing","Sing","https://sing-flow.pages.dev/"],["dance","Dance",""],["muscle","Muscle",""]].map(([id,label,url])=>({id,label,defaultUrl:url}));
const STORAGE_KEY = 'flow-hub-links-v1-' + HUB.toLowerCase().replace(/\W+/g,'-');
const sanitizeUrl = value => {
  try {
    const input = value.trim();
    const u = new URL(input);
    if (u.protocol !== 'https:') return '';
    if (u.username || u.password) return '';
    return u.href;
  } catch { return ''; }
};
function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

const VOICE_LEVELS = [{"id":1,"title":"기초","items":[{"id":1,"en":"Body Scan","ko":"신체 긴장 관찰","youtube":""},{"id":2,"en":"Head Massage","ko":"헤드 마사지","youtube":"https://youtu.be/VBk-3W0e0v4?si=QvrDQ6i6AdvnwTu4"},{"id":3,"en":"Jaw Release","ko":"턱 이완","youtube":""},{"id":4,"en":"Natural Breath","ko":"자연호흡","youtube":"https://youtu.be/ndXdxpItYww?si=zZm_tkHGtEfZe9dy"},{"id":5,"en":"Thoracic Mobility","ko":"흉추 가동성","youtube":"https://youtu.be/9iHko2F81cE?si=SAP_8-7p_vHJwIYY"},{"id":6,"en":"S-Hiss","ko":"일정한 호기","youtube":""},{"id":7,"en":"Easy Onset","ko":"부드러운 발성 시작","youtube":""},{"id":8,"en":"Straw Phonation","ko":"빨대 발성","youtube":""},{"id":9,"en":"Gentle Humming","ko":"허밍","youtube":""},{"id":10,"en":"Comfortable Tone","ko":"편안한 지속 발성","youtube":""}]},{"id":2,"title":"제어","items":[{"id":11,"en":"Lip Trill","ko":"입술 트릴","youtube":""},{"id":12,"en":"Cup Bubble Phonation","ko":"물컵 발성","youtube":""},{"id":13,"en":"Pitch Glide","ko":"음높이 이동","youtube":""},{"id":14,"en":"Three-Pitch Pattern","ko":"3단 음높이","youtube":""},{"id":15,"en":"Soft-Medium Voice","ko":"음량 전환","youtube":""},{"id":16,"en":"M-N-NG Transition","ko":"비음 전환","youtube":""},{"id":17,"en":"Humming to Vowel","ko":"허밍·모음 연결","youtube":""},{"id":18,"en":"Resonant Syllables","ko":"공명 음절","youtube":""},{"id":19,"en":"Resonant Sentences","ko":"공명 문장","youtube":""},{"id":20,"en":"Voice-to-Speech","ko":"발성에서 말하기 연결","youtube":""}]},{"id":3,"title":"발음","items":[{"id":21,"en":"Vowel Precision","ko":"모음 정확도","youtube":""},{"id":22,"en":"Consonant Contrast","ko":"자음 구별","youtube":""},{"id":23,"en":"Final Consonants","ko":"받침 발음","youtube":""},{"id":24,"en":"Tongue Placement","ko":"혀의 위치","youtube":""},{"id":25,"en":"Tongue Twisters","ko":"잰말놀이","youtube":""},{"id":26,"en":"Rising-Falling Intonation","ko":"상승·하강 억양","youtube":""},{"id":27,"en":"Contrastive Stress","ko":"강세 전환","youtube":""},{"id":28,"en":"Rhythm Reading","ko":"리듬 낭독","youtube":""},{"id":29,"en":"Tempo Variation","ko":"속도 조절","youtube":""},{"id":30,"en":"Semantic Pausing","ko":"의미 단위 쉼","youtube":""}]},{"id":4,"title":"표현","items":[{"id":31,"en":"Volume Scale","ko":"음량 조절","youtube":""},{"id":32,"en":"Projection Without Shouting","ko":"소리 지르지 않는 투사","youtube":""},{"id":33,"en":"Clear Speech","ko":"명료한 말하기","youtube":""},{"id":34,"en":"Key Message Delivery","ko":"핵심 메시지 전달","youtube":""},{"id":35,"en":"Emotion Contrast","ko":"감정 변화","youtube":""},{"id":36,"en":"Emotional Restraint","ko":"절제된 감정","youtube":""},{"id":37,"en":"Action Verb Reading","ko":"행동 의도 표현","youtube":""},{"id":38,"en":"Intention Shift","ko":"의도 전환","youtube":""},{"id":39,"en":"Hidden Meaning","ko":"서브텍스트","youtube":""},{"id":40,"en":"Character Vocal Profile","ko":"캐릭터 음성","youtube":""}]},{"id":5,"title":"실전","items":[{"id":41,"en":"First-Sight Reading","ko":"초견 낭독","youtube":""},{"id":42,"en":"News Anchor Reading","ko":"뉴스 리딩","youtube":""},{"id":43,"en":"Numbers & Names","ko":"숫자·고유명사","youtube":""},{"id":44,"en":"Studio Reading","ko":"마이크 리딩","youtube":""},{"id":45,"en":"Narration Reading","ko":"내레이션","youtube":""},{"id":46,"en":"Dialogue Exchange","ko":"대사 교환","youtube":""},{"id":47,"en":"Monologue Delivery","ko":"독백","youtube":""},{"id":48,"en":"Scene Objective","ko":"장면 목표","youtube":""},{"id":49,"en":"One-Minute Speech","ko":"1분 스피치","youtube":""},{"id":50,"en":"Voice Recording Review","ko":"녹음 비교 평가","youtube":""}]}];
function youtubeId(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : '';
    if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname)) {
      const id = u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : u.searchParams.get('v');
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    }
  } catch {}
  return '';
}
const VOICE_LINKS_KEY = 'voice-flow-hub-drill-youtube-v1';
const HEAD_MASSAGE_LINK_MIGRATION='voice-flow-hub-head-massage-link-v2';
function readVoiceLinks() {
  try {
    const value=JSON.parse(localStorage.getItem(VOICE_LINKS_KEY)||'{}');
    const links=value && typeof value==='object' && !Array.isArray(value) ? value : {};
    // One-time replacement of any previously saved drill 2 URL, preserving other drills.
    if(localStorage.getItem(HEAD_MASSAGE_LINK_MIGRATION)!=='done') {
      delete links[2];
      localStorage.setItem(VOICE_LINKS_KEY,JSON.stringify(links));
      localStorage.setItem(HEAD_MASSAGE_LINK_MIGRATION,'done');
    }
    return links;
  } catch { return {}; }
}
const VOICE_TIME_KEY='voice-flow-hub-timestamps-v1';
const DEFAULT_VOICE_TIMES = {2:[0,65,104,190,275,345,425,493,546],5:[0]};
function readVoiceTimes() {
  try {
    const saved=JSON.parse(localStorage.getItem(VOICE_TIME_KEY)||'{}');
    return saved && typeof saved==='object' && !Array.isArray(saved) ? saved : {};
  } catch {return {};}
}
function parseVoiceTime(value) {
  const parts=String(value||'').trim().split(':');
  if (parts.length!==2 && parts.length!==3) return null;
  if (!parts.every(p=>/^\d+$/.test(p))) return null;
  const nums=parts.map(Number);
  if (nums.slice(1).some(n=>n>59)) return null;
  return nums.reduce((a,b)=>a*60+b,0);
}
function formatVoiceTime(seconds) {
  const s=Math.floor(seconds),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;
  return (h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(sec).padStart(2,'0');
}
function VoiceTraining() {
  const [level,setLevel] = useState(0);
  const [opened,setOpened] = useState(null);
  const [links,setLinks] = useState(readVoiceLinks);
  const [editing,setEditing] = useState(null);
  const [draft,setDraft] = useState('');
  const [message,setMessage] = useState('');
  const [times,setTimes] = useState(readVoiceTimes);
  const [activeStart,setActiveStart] = useState({});
  const videoFrames=useRef({});
  function seekToDrill(id,seconds) {
    const frame=videoFrames.current[id];
    if (!frame?.contentWindow) return;
    // YouTube IFrame Player API: seek in-place so the existing player is never recreated.
    const send=(func,args=[])=>frame.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}),'*');
    send('seekTo',[seconds,true]);
    send('playVideo');
    setActiveStart(prev=>({...prev,[id]:seconds}));
  }
  const selectLevel = i => {setLevel(i);setOpened(null);setEditing(null);setMessage('')};
  function saveLink(id,raw) {
    const url=String(raw||'').trim();
    const vid=youtubeId(url);
    if (!vid) {setMessage('올바른 유튜브 영상 링크를 붙여넣어 줘.');return;}
    const next={...links,[id]:url};
    try {localStorage.setItem(VOICE_LINKS_KEY,JSON.stringify(next))}
    catch {setMessage('브라우저 저장소에 저장하지 못했어. 저장 공간을 확인해 줘.');return;}
    setLinks(next);setEditing(null);setDraft('');setOpened(id);setMessage('');
  }
  async function addFromClipboard(item) {
    setEditing(item.id);
    setDraft(links[item.id]||'');
    setMessage('');
    try {
      if (!navigator.clipboard?.readText) return;
      const copied=await navigator.clipboard.readText();
      if (youtubeId(copied.trim())) {saveLink(item.id,copied);return;}
      if (copied.trim()) setMessage('복사한 내용이 유튜브 영상 링크가 아니야. 아래에 붙여넣어 줘.');
    } catch {
      // Clipboard read may be blocked in iOS or inside an iframe. Manual paste remains available.
    }
  }
  function removeLink(id) {
    const next={...links};delete next[id];
    try {localStorage.setItem(VOICE_LINKS_KEY,JSON.stringify(next))}
    catch {setMessage('삭제 내용을 저장하지 못했어.');return;}
    setLinks(next);setDraft('');setMessage('');setEditing(null);
  }
  return <section className="voice-training" aria-label="발성 훈련 50 Drill">
    <div className="voice-heading"><div><strong>Voice Training</strong><span>5단계 × 10 Drill</span></div><small>LEVEL {level+1} / 5</small></div>
    <nav className="voice-levels" aria-label="발성 훈련 단계">{VOICE_LEVELS.map((l,i)=><button type="button" className={level===i?'selected':''} aria-current={level===i?'step':undefined} onClick={()=>selectLevel(i)} key={l.id}><small>Lv.{l.id}</small><b>{l.title}</b></button>)}</nav>
    <div className="voice-list-title"><b>LEVEL {level+1} · {VOICE_LEVELS[level].title}</b><span>10 Drill</span></div>
    <div className="voice-list">{VOICE_LEVELS[level].items.map(item=>{
      const isOpen=opened===item.id;
      const video=youtubeId(links[item.id]||item.youtube);
      return <div className="voice-drill" key={item.id}>
        <div className="voice-drill-row">
          <button type="button" className="voice-drill-heading" aria-expanded={isOpen} onClick={()=>{setOpened(isOpen?null:item.id);setEditing(null);setMessage('')}}>
            <span className="voice-drill-number">{String(item.id).padStart(2,'0')}</span>
            <span className="voice-drill-names"><b>{item.en}</b><small>{item.ko}</small></span>
            <ChevronDown size={16} className={isOpen?'rotated':''}/>
          </button>
          <button type="button" className={'voice-link-btn'+(video?' linked':'')} title={video?'유튜브 링크 수정':'복사한 유튜브 링크 등록'} aria-label={item.ko+' 유튜브 링크 '+(video?'수정':'등록')} onClick={()=>addFromClipboard(item)}><Link2 size={17}/></button>
        </div>
        {editing===item.id && <form className="voice-link-editor" onSubmit={e=>{e.preventDefault();saveLink(item.id,draft)}}>
          <input aria-label={item.ko+' 유튜브 링크'} type="url" inputMode="url" placeholder="유튜브 URL 붙여넣기" autoCapitalize="off" autoCorrect="off" spellCheck="false" value={draft} onChange={e=>{setDraft(e.target.value);setMessage('')}}/>
          <div className="voice-link-actions">
            <button className="primary" type="submit"><Check size={15}/> 저장</button>
            {video&&<button className="secondary" type="button" onClick={()=>removeLink(item.id)}><Trash2 size={15}/> 삭제</button>}
            <button className="secondary" type="button" onClick={()=>{setEditing(null);setMessage('')}}>취소</button>
          </div>
          {message&&<p role="alert" className="voice-link-error">{message}</p>}
        </form>}
        {isOpen && <div className="voice-video-content">{video ?
          <>
            {(item.id===2 || item.id===5) && <div className="voice-time-panel">
              <div className="voice-time-buttons">{(times[item.id]||DEFAULT_VOICE_TIMES[item.id]||[0]).map((seconds,index)=><button key={seconds} className={'voice-time-number'+(Number(activeStart[item.id]||0)===seconds?' active':'')} type="button" title={formatVoiceTime(seconds)+'부터 재생'} aria-label={(index+1)+'번 구간 '+formatVoiceTime(seconds)+'부터 재생'} onClick={()=>seekToDrill(item.id,seconds)}>{index+1}</button>)}</div>
            </div>}
            <div className="voice-video-wrap"><iframe key={video} ref={node=>{videoFrames.current[item.id]=node}} title={item.en+' 유튜브 영상'} src={'https://www.youtube-nocookie.com/embed/'+video+'?enablejsapi=1&playsinline=1&origin='+encodeURIComponent(window.location.origin)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div>
          </>:
          <div className="voice-video-wait"><span>영상 링크 등록 대기</span><small>오른쪽 링크 아이콘을 눌러 유튜브 주소를 등록해 줘.</small></div>}
        </div>}
      </div>
    })}</div>
    <p className="voice-storage-note">등록한 링크는 현재 기기의 브라우저에 저장돼. 다른 기기와는 아직 동기화되지 않아.</p>
  </section>;
}

function App() {
  // Always open the first app in MODES. Old ?app= URLs must not override hub order.
  const [selected,setSelected] = useState(MODES[0].id);
  const [links,setLinks] = useState(readSaved);
  const [settings,setSettings] = useState(false);
  const [draft,setDraft] = useState('');
  const [error,setError] = useState('');
  const [frameVersion,setFrameVersion] = useState(0);
  const current = MODES.find(m=>m.id===selected)||MODES[0];
  const activeUrl = sanitizeUrl(Object.prototype.hasOwnProperty.call(links,selected)?String(links[selected]||''):current.defaultUrl);
  useEffect(()=>{
    // Remove legacy app selection from the address bar; switching tabs stays in this visit only.
    const params = new URLSearchParams(window.location.search);
    if(!params.has('app'))return;
    params.delete('app');
    const qs=params.toString();
    window.history.replaceState(null,'',window.location.pathname+(qs?'?'+qs:'')+window.location.hash);
  },[]);
  useEffect(()=>{setDraft(activeUrl);setError('');setSettings(false)},[selected]);
  function saveUrl(e) {
    e.preventDefault();
    const url = draft.trim()?sanitizeUrl(draft):'';
    if (draft.trim() && !url) {setError('https://로 시작하는 올바른 주소를 입력해 줘.');return;}
    const next={...links,[selected]:url};
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));} catch {setError('브라우저 저장 공간을 확인해 줘.');return;}
    setLinks(next);setFrameVersion(n=>n+1);setSettings(false);setError('');
  }
  function resetUrl() {
    const next={...links};delete next[selected];
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));} catch {}
    setLinks(next);setDraft(current.defaultUrl);setFrameVersion(n=>n+1);setSettings(false);
  }
  return <div className="hub">
    <header className="topbar">
      <div className="brand">
        <span className="brand-symbol">✦</span>
        <div><strong>{HUB}</strong><small>MY FLOW STUDIO</small></div>
      </div>
      <div className="top-actions">
        <label className="mode-select"><span className="sr-only">앱 선택</span>
          <select value={selected} onChange={e=>setSelected(e.target.value)} aria-label="앱 전환">
            {MODES.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
          </select><ChevronDown size={14}/></label>
        <button className={'icon-btn'+(settings?' active':'')} type="button" aria-label="배포 주소 설정" onClick={()=>{setDraft(activeUrl);setSettings(x=>!x);setError('')}}><Settings2 size={17}/></button>
      </div>
    </header>
    {settings&&<section className="settings" aria-label="원본 앱 주소 설정">
      <div className="settings-title"><b>{current.label} 배포 URL</b><button type="button" className="icon-btn" onClick={()=>setSettings(false)} aria-label="닫기"><X size={17}/></button></div>
      <p>원본 앱의 Cloudflare Pages 주소를 넣어줘. 이 허브에만 저장되며 기존 앱의 데이터는 변경되지 않아.</p>
      <form onSubmit={saveUrl}>
        <input type="url" inputMode="url" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="https://your-app.pages.dev/" autoCapitalize="off" autoCorrect="off" spellCheck="false" />
        {error&&<p className="error" role="alert">{error}</p>}
        <div className="form-buttons"><button type="button" className="secondary" onClick={resetUrl}>기본값 복원</button><button type="submit" className="primary"><Check size={15}/> 저장</button></div>
      </form>
    </section>}
    <div className="info-strip">
      <span className="app-name"><ShieldCheck size={14}/> {current.label} <i>독립 로그인 · DB 유지</i></span>
      <div className="strip-actions">
        {activeUrl&&<button type="button" onClick={()=>setFrameVersion(n=>n+1)} aria-label="앱 새로고침" title="앱 새로고침"><RefreshCw size={15}/></button>}
        {activeUrl&&<a href={activeUrl} target="_blank" rel="noopener noreferrer" title="원본 앱 열기"><ExternalLink size={15}/><span>원본 열기</span></a>}
      </div>
    </div>
    <main className="frame-area">
      {selected === 'voice' ? <VoiceTraining/> : activeUrl ? <iframe key={selected+'-'+frameVersion+'-'+activeUrl} title={current.label+' 앱'} src={activeUrl} allow="microphone; camera; clipboard-write" referrerPolicy="strict-origin-when-cross-origin"/>:
        <div className="empty">
          <div className="empty-icon"><Link2 size={25}/></div>
          <h2>{current.label} 연결 준비</h2>
          <p>이 앱의 실제 배포 주소가 아직 등록되지 않았어. 우상단 설정에서 원본 앱 URL을 한 번 등록하면 이 화면에 표시돼.</p>
          <button className="primary" type="button" onClick={()=>{setSettings(true);setDraft('')}}><Settings2 size={16}/> URL 등록하기</button>
        </div>}
    </main>
    <footer className="foot"><MonitorSmartphone size={12}/><span>앱 화면이 표시되지 않으면 ‘원본 열기’를 사용해 줘. 일부 앱은 외부 삽입이 제한될 수 있어.</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

import './mobile-readability.css';
