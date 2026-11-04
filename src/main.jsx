import React, {useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ChevronDown,ExternalLink,Settings2,X,Check,Link2,Trash2,ShieldCheck,RefreshCw,MonitorSmartphone} from 'lucide-react';
import './style.css';
import {ArchiveManager,readArchived} from './ArchiveManager';
import {voiceSupabase} from './voiceSupabase';
import VoiceStudio from './VoiceStudio';

const HUB = "Voice Flow";
const MODES = [["expression","Expression",""],["voice","Voice",""],["playlist","Playlist",""],["sing","Sing","https://sing-flow.pages.dev/"],["dance","Dance",""],["muscle","Muscle",""]].map(([id,label,url])=>({id,label,defaultUrl:url}));
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

const VOICE_LEVELS = [{"id":1,"title":"기초","items":[{"id":1,"en":"Body Scan","ko":"신체 긴장 관찰","youtube":""},{"id":2,"en":"Head Massage","ko":"헤드 마사지","youtube":"https://youtu.be/VBk-3W0e0v4?si=QvrDQ6i6AdvnwTu4"},{"id":3,"en":"Jaw & Neck Release","ko":"턱 목 이완","youtube":""},{"id":4,"en":"Shoulder Release","ko":"어깨 이완","youtube":""},{"id":5,"en":"Scapular Release","ko":"견갑 이완","youtube":""},{"id":6,"en":"Thoracic Mobility","ko":"흉추 가동성","youtube":"https://youtu.be/9iHko2F81cE?si=SAP_8-7p_vHJwIYY"},{"id":7,"en":"Easy Onset","ko":"부드러운 발성 시작","youtube":""},{"id":8,"en":"Straw Phonation","ko":"빨대 발성","youtube":""},{"id":9,"en":"Gentle Humming","ko":"허밍","youtube":""},{"id":10,"en":"Comfortable Tone","ko":"편안한 지속 발성","youtube":""}]},{"id":2,"title":"제어","items":[{"id":11,"en":"Lip Trill","ko":"입술 트릴","youtube":""},{"id":12,"en":"Cup Bubble Phonation","ko":"물컵 발성","youtube":""},{"id":13,"en":"Pitch Glide","ko":"음높이 이동","youtube":""},{"id":14,"en":"Three-Pitch Pattern","ko":"3단 음높이","youtube":""},{"id":15,"en":"Soft-Medium Voice","ko":"음량 전환","youtube":""},{"id":16,"en":"M-N-NG Transition","ko":"비음 전환","youtube":""},{"id":17,"en":"Humming to Vowel","ko":"허밍·모음 연결","youtube":""},{"id":18,"en":"Resonant Syllables","ko":"공명 음절","youtube":""},{"id":19,"en":"Resonant Sentences","ko":"공명 문장","youtube":""},{"id":20,"en":"Voice-to-Speech","ko":"발성에서 말하기 연결","youtube":""}]},{"id":3,"title":"발음","items":[{"id":21,"en":"Vowel Precision","ko":"모음 정확도","youtube":""},{"id":22,"en":"Consonant Contrast","ko":"자음 구별","youtube":""},{"id":23,"en":"Final Consonants","ko":"받침 발음","youtube":""},{"id":24,"en":"Tongue Placement","ko":"혀의 위치","youtube":""},{"id":25,"en":"Tongue Twisters","ko":"잰말놀이","youtube":""},{"id":26,"en":"Rising-Falling Intonation","ko":"상승·하강 억양","youtube":""},{"id":27,"en":"Contrastive Stress","ko":"강세 전환","youtube":""},{"id":28,"en":"Rhythm Reading","ko":"리듬 낭독","youtube":""},{"id":29,"en":"Tempo Variation","ko":"속도 조절","youtube":""},{"id":30,"en":"Semantic Pausing","ko":"의미 단위 쉼","youtube":""}]},{"id":4,"title":"표현","items":[{"id":31,"en":"Volume Scale","ko":"음량 조절","youtube":""},{"id":32,"en":"Projection Without Shouting","ko":"소리 지르지 않는 투사","youtube":""},{"id":33,"en":"Clear Speech","ko":"명료한 말하기","youtube":""},{"id":34,"en":"Key Message Delivery","ko":"핵심 메시지 전달","youtube":""},{"id":35,"en":"Emotion Contrast","ko":"감정 변화","youtube":""},{"id":36,"en":"Emotional Restraint","ko":"절제된 감정","youtube":""},{"id":37,"en":"Action Verb Reading","ko":"행동 의도 표현","youtube":""},{"id":38,"en":"Intention Shift","ko":"의도 전환","youtube":""},{"id":39,"en":"Hidden Meaning","ko":"서브텍스트","youtube":""},{"id":40,"en":"Character Vocal Profile","ko":"캐릭터 음성","youtube":""}]},{"id":5,"title":"실전","items":[{"id":41,"en":"First-Sight Reading","ko":"초견 낭독","youtube":""},{"id":42,"en":"News Anchor Reading","ko":"뉴스 리딩","youtube":""},{"id":43,"en":"Numbers & Names","ko":"숫자·고유명사","youtube":""},{"id":44,"en":"Studio Reading","ko":"마이크 리딩","youtube":""},{"id":45,"en":"Narration Reading","ko":"내레이션","youtube":""},{"id":46,"en":"Dialogue Exchange","ko":"대사 교환","youtube":""},{"id":47,"en":"Monologue Delivery","ko":"독백","youtube":""},{"id":48,"en":"Scene Objective","ko":"장면 목표","youtube":""},{"id":49,"en":"One-Minute Speech","ko":"1분 스피치","youtube":""},{"id":50,"en":"Voice Recording Review","ko":"녹음 비교 평가","youtube":""}]}];
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
const VOICE_REORDER_MIGRATION='voice-flow-hub-reorder-v3';
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
    if(localStorage.getItem(VOICE_REORDER_MIGRATION)!=='done') {
      const thoracicLink=links[5];
      delete links[3];delete links[4];delete links[5];delete links[6];
      if(thoracicLink && youtubeId(thoracicLink)) links[6]=thoracicLink;
      localStorage.setItem(VOICE_LINKS_KEY,JSON.stringify(links));
      localStorage.setItem(VOICE_REORDER_MIGRATION,'done');
    }
    return links;
  } catch { return {}; }
}
const VOICE_TIME_KEY='voice-flow-hub-timestamps-v1';
const DEFAULT_VOICE_TIMES = {2:[0,65,104,190,275,345,425,493,546],6:[0]};
function readVoiceTimes() {
  try {
    const saved=JSON.parse(localStorage.getItem(VOICE_TIME_KEY)||'{}');
    const values=saved && typeof saved==='object' && !Array.isArray(saved) ? saved : {};
    if(localStorage.getItem('voice-flow-hub-time-reorder-v3')!=='done') {
      if(Array.isArray(values[5])) values[6]=values[5];
      delete values[5];
      localStorage.setItem(VOICE_TIME_KEY,JSON.stringify(values));
      localStorage.setItem('voice-flow-hub-time-reorder-v3','done');
    }
    return values;
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
  const [links,setLinks] = useState({});
  const [editing,setEditing] = useState(null);
  const [draft,setDraft] = useState('');
  const [message,setMessage] = useState('');
  const [times,setTimes] = useState({});
  const [activeStart,setActiveStart] = useState({});
  const [session,setSession] = useState(null);
  const [authReady,setAuthReady] = useState(false);
  const [dataReady,setDataReady] = useState(false);
  const [authMode,setAuthMode] = useState('login');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [authBusy,setAuthBusy] = useState(false);
  const [syncError,setSyncError] = useState('');
  const videoFrames=useRef({});
  const userId=session?.user?.id;

  useEffect(()=>{
    let alive=true;
    voiceSupabase.auth.getSession().then(({data,error})=>{
      if(!alive)return;
      if(error)setSyncError(error.message);
      setSession(data?.session||null);setAuthReady(true);
    }).catch(err=>{if(alive){setSyncError(err.message);setAuthReady(true)}});
    const {data:{subscription}}=voiceSupabase.auth.onAuthStateChange((_event,next)=>{
      if(alive)setSession(next);
    });
    return ()=>{alive=false;subscription.unsubscribe()};
  },[]);

  useEffect(()=>{
    if(!userId){setLinks({});setTimes({});setDataReady(false);return;}
    let alive=true;
    setDataReady(false);setSyncError('');
    async function load(){
      try {
        const {data,error}=await voiceSupabase.from('voice_studio_drills')
          .select('drill_id,video_url,timestamps').eq('user_id',userId);
        if(error)throw error;
        const remote={};
        for(const entry of data||[])remote[entry.drill_id]=entry;
        // Import legacy local data only for the first account to claim this browser.
        // Never transfer a prior account's local backup into a different account.
        const migrationOwner=localStorage.getItem('voice-studio-migration-owner-v1');
        if(!migrationOwner || migrationOwner===userId){
          const localLinks=readVoiceLinks(),localTimes=readVoiceTimes();
          const imports=[];
          if(!migrationOwner){
            for(const [key,url] of Object.entries(localLinks)){
              const id=Number(key);
              if(!Number.isInteger(id)||id<1||id>50||!youtubeId(url)||remote[id])continue;
              imports.push({user_id:userId,drill_id:id,video_url:url,timestamps:localTimes[id]||DEFAULT_VOICE_TIMES[id]||[0]});
            }
          }
          if(imports.length){
            const {error:importError}=await voiceSupabase.from('voice_studio_drills')
              .upsert(imports,{onConflict:'user_id,drill_id',ignoreDuplicates:true});
            if(importError)throw importError;
            for(const entry of imports)remote[entry.drill_id]=entry;
          }
          if(!migrationOwner)localStorage.setItem('voice-studio-migration-owner-v1',userId);
        }
        if(!alive)return;
        const cloudLinks={},cloudTimes={};
        for(const entry of Object.values(remote)){
          if(entry.video_url)cloudLinks[entry.drill_id]=entry.video_url;
          if(Array.isArray(entry.timestamps))cloudTimes[entry.drill_id]=entry.timestamps;
        }
        setLinks(cloudLinks);setTimes(cloudTimes);setDataReady(true);
      }catch(err){if(alive){setSyncError('동기화에 실패했어. Supabase 테이블 설정을 확인해 줘: '+err.message);setDataReady(true)}}
    }
    load();
    return ()=>{alive=false};
  },[userId]);

  async function submitAuth(event){
    event.preventDefault();setAuthBusy(true);setSyncError('');
    try{
      const credentials={email:email.trim(),password};
      const {data,error}=authMode==='signup'
        ?await voiceSupabase.auth.signUp(credentials)
        :await voiceSupabase.auth.signInWithPassword(credentials);
      if(error)throw error;
      if(authMode==='signup' && !data.session)setSyncError('이메일 확인 링크를 열어 가입을 완료한 다음 로그인해 줘.');
      setPassword('');
    }catch(err){setSyncError(err.message)}
    finally{setAuthBusy(false)}
  }

  async function saveLink(id,raw) {
    const url=String(raw||'').trim();
    if(!youtubeId(url)){setMessage('올바른 유튜브 영상 링크를 붙여넣어 줘.');return;}
    setMessage('');
    const row={user_id:userId,drill_id:id,video_url:url,timestamps:times[id]||DEFAULT_VOICE_TIMES[id]||[0]};
    const {error}=await voiceSupabase.from('voice_studio_drills')
      .upsert(row,{onConflict:'user_id,drill_id'});
    if(error){setMessage('서버 저장 실패: '+error.message);return;}
    setLinks(prev=>({...prev,[id]:url}));
    setEditing(null);setDraft('');setOpened(id);
  }
  async function removeLink(id) {
    setMessage('');
    const {error}=await voiceSupabase.from('voice_studio_drills')
      .upsert({user_id:userId,drill_id:id,video_url:null,timestamps:times[id]||DEFAULT_VOICE_TIMES[id]||[0]},
        {onConflict:'user_id,drill_id'});
    if(error){setMessage('삭제 실패: '+error.message);return;}
    setLinks(prev=>{const next={...prev};delete next[id];return next});
    setEditing(null);setDraft('');
  }
  async function addFromClipboard(item){
    setEditing(item.id);setDraft(links[item.id]||'');setMessage('');
    try{
      if(!navigator.clipboard?.readText)return;
      const copied=await navigator.clipboard.readText();
      if(youtubeId(copied.trim())){await saveLink(item.id,copied);return;}
      if(copied.trim())setMessage('복사한 내용이 유튜브 링크가 아니야. 아래 입력창에 붙여넣어 줘.');
    }catch{}
  }
  function seekToDrill(id,seconds){
    const frame=videoFrames.current[id];
    if(!frame?.contentWindow)return;
    const send=(func,args=[])=>frame.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}),'*');
    send('seekTo',[seconds,true]);send('playVideo');
    setActiveStart(prev=>({...prev,[id]:seconds}));
  }

  if(!authReady)return <div className="voice-auth-loading">로그인 확인 중…</div>;
  if(!session)return <section className="voice-auth">
    <form className="voice-auth-card" onSubmit={submitAuth}>
      <h2>Voice Studio</h2>
      <p>이메일로 로그인하면 영상 링크가 아이폰·아이패드·PC에 동기화돼.</p>
      <div className="voice-auth-modes">
        <button type="button" className={authMode==='login'?'selected':''} onClick={()=>{setAuthMode('login');setSyncError('')}}>로그인</button>
        <button type="button" className={authMode==='signup'?'selected':''} onClick={()=>{setAuthMode('signup');setSyncError('')}}>회원가입</button>
      </div>
      <input type="email" autoComplete="email" required placeholder="이메일" aria-label="이메일" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input type="password" minLength={6} autoComplete={authMode==='signup'?'new-password':'current-password'} required placeholder="비밀번호" aria-label="비밀번호" value={password} onChange={e=>setPassword(e.target.value)}/>
      <button className="primary" type="submit" disabled={authBusy}>{authBusy?'처리 중…':authMode==='login'?'이메일 로그인':'이메일 회원가입'}</button>
      {syncError&&<p className="voice-link-error" role="status">{syncError}</p>}
    </form>
  </section>;
  if(!dataReady)return <div className="voice-auth-loading">발성 Drill 동기화 중…</div>;

  const selectLevel=i=>{setLevel(i);setOpened(null);setEditing(null);setMessage('')};
  return <section className="voice-training" aria-label="발성 훈련 50 Drill">
    <div className="voice-heading"><div><strong>Voice Training</strong><span>5단계 × 10 Drill</span></div><button type="button" className="voice-logout" onClick={()=>voiceSupabase.auth.signOut()}>로그아웃</button></div>
    {syncError&&<p className="voice-sync-alert" role="alert">{syncError}</p>}
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
        {isOpen && <div className="voice-video-content">{video ? <>
          {(item.id===2 || item.id===6) && <div className="voice-time-panel">
            <div className="voice-time-buttons">{(times[item.id]||DEFAULT_VOICE_TIMES[item.id]||[0]).map((seconds,index)=><button key={seconds} className={'voice-time-number'+(Number(activeStart[item.id]||0)===seconds?' active':'')} type="button" title={formatVoiceTime(seconds)+'부터 재생'} aria-label={(index+1)+'번 구간 '+formatVoiceTime(seconds)+'부터 재생'} onClick={()=>seekToDrill(item.id,seconds)}>{index+1}</button>)}</div>
          </div>}
          <div className="voice-video-wrap"><iframe key={video} ref={node=>{videoFrames.current[item.id]=node}} title={item.en+' 유튜브 영상'} src={'https://www.youtube-nocookie.com/embed/'+video+'?enablejsapi=1&playsinline=1&origin='+encodeURIComponent(window.location.origin)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div>
        </> : <div className="voice-video-wait"><span>영상 링크 등록 대기</span><small>오른쪽 링크 아이콘을 눌러 유튜브 주소를 등록해 줘.</small></div>}</div>}
      </div>
    })}</div>
    <p className="voice-storage-note">로그인한 계정의 영상 링크는 Supabase에 저장돼. 이 기기의 기존 링크는 서버에 없는 항목만 최초 가져오기 해.</p>
  </section>;
}

const ARCHIVE_KEY = STORAGE_KEY + '-archived-v1';
function App() {
  const [archived,setArchived] = useState(()=>readArchived(ARCHIVE_KEY, MODES));
  const [archiveOpen,setArchiveOpen] = useState(false);
  const visibleModes = MODES.filter(mode=>!archived.includes(mode.id));
  // Always open the first app in MODES. Old ?app= URLs must not override hub order.
  const [selected,setSelected] = useState(()=>visibleModes[0]?.id||'');
  const [links,setLinks] = useState(readSaved);
  const [settings,setSettings] = useState(false);
  const [draft,setDraft] = useState('');
  const [error,setError] = useState('');
  const current = visibleModes.find(m=>m.id===selected)||{id:'',label:'보관함',defaultUrl:''};
  const activeUrl = selected && sanitizeUrl(Object.prototype.hasOwnProperty.call(links,selected)?String(links[selected]||''):current.defaultUrl);
  useEffect(()=>{
    // Remove legacy app selection from the address bar; switching tabs stays in this visit only.
    const params = new URLSearchParams(window.location.search);
    if(!params.has('app'))return;
    params.delete('app');
    const qs=params.toString();
    window.history.replaceState(null,'',window.location.pathname+(qs?'?'+qs:'')+window.location.hash);
  },[]);
  useEffect(()=>{setDraft(activeUrl);setError('');setSettings(false)},[selected]);
  function toggleArchived(id) {
    const next=archived.includes(id)?archived.filter(value=>value!==id):[...archived,id];
    try {localStorage.setItem(ARCHIVE_KEY,JSON.stringify(next));}
    catch {return '보관 상태를 저장하지 못했어. 브라우저 저장 공간을 확인해 줘.';}
    setArchived(next);
    if(selected===id && next.includes(id))setSelected(MODES.find(mode=>!next.includes(mode.id))?.id||'');
    else if(!selected && !next.includes(id))setSelected(id);
    return '';
  }
  function saveUrl(e) {
    e.preventDefault();
    const url = draft.trim()?sanitizeUrl(draft):'';
    if (draft.trim() && !url) {setError('https://로 시작하는 올바른 주소를 입력해 줘.');return;}
    const next={...links,[selected]:url};
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));} catch {setError('브라우저 저장 공간을 확인해 줘.');return;}
    setLinks(next);setSettings(false);setError('');
  }
  function resetUrl() {
    const next={...links};delete next[selected];
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));} catch {}
    setLinks(next);setDraft(current.defaultUrl);setSettings(false);
  }
  return <div className="hub">
    <header className="topbar">
      <div className="brand">
        <span className="brand-symbol">✦</span>
        <div><strong>{HUB}</strong><small>MY FLOW STUDIO</small></div>
      </div>
      <div className="top-actions">
        <label className="mode-select"><span className="sr-only">앱 선택</span>
          <select value={selected} onChange={e=>{if(e.target.value==='__archive__'){setSettings(false);setArchiveOpen(true)}else {const id=e.target.value;setSelected(id);if(id==='voice')return;const mode=visibleModes.find(m=>m.id===id);const url=sanitizeUrl(Object.prototype.hasOwnProperty.call(links,id)?String(links[id]||''):mode?.defaultUrl||'');if(url)window.location.assign(url);}}} aria-label="앱 전환">
            {!selected&&<option value="" disabled>사용 중인 프로젝트 없음</option>}
            {visibleModes.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
            <option value="__archive__">보관함 · {archived.length}개</option>
          </select><ChevronDown size={14}/></label>
        <button className={'icon-btn'+(settings?' active':'')} type="button" aria-label="허브 설정" onClick={()=>{setDraft(activeUrl);setSettings(x=>!x);setError('')}}><Settings2 size={17}/></button>
      </div>
    </header>
    {settings&&<section className="settings" aria-label="원본 앱 주소 설정">
      <div className="settings-title"><b>{selected?current.label+' 배포 URL':'허브 설정'}</b><button type="button" className="icon-btn" onClick={()=>setSettings(false)} aria-label="닫기"><X size={17}/></button></div>
      {selected&&<>
      <p>원본 앱의 Cloudflare Pages 주소를 넣어줘. 이 허브에만 저장되며 기존 앱의 데이터는 변경되지 않아.</p>
      <form onSubmit={saveUrl}>
        <input type="url" inputMode="url" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="https://your-app.pages.dev/" autoCapitalize="off" autoCorrect="off" spellCheck="false" />
        {error&&<p className="error" role="alert">{error}</p>}
        <div className="form-buttons"><button type="button" className="secondary" onClick={resetUrl}>기본값 복원</button><button type="submit" className="primary"><Check size={15}/> 저장</button></div>
      </form></>}
      <button className="secondary archive-link" type="button" onClick={()=>{setSettings(false);setArchiveOpen(true)}}>프로젝트 보관·복원 <span>보관함 · {archived.length}개</span></button>
    </section>}
    {archiveOpen&&<ArchiveManager modes={MODES} archived={archived} onToggle={toggleArchived} onClose={()=>setArchiveOpen(false)}/>}
    <div className="info-strip">
      <span className="app-name"><ShieldCheck size={14}/> {current.label} <i>독립 로그인 · DB 유지</i></span>
      <div className="strip-actions">
        
        {selected!=='voice'&&activeUrl&&<a href={activeUrl} title="앱 열기"><ExternalLink size={15}/><span>앱 열기</span></a>}
      </div>
    </div>
    <main className="frame-area">
      {!selected ? <div className="empty"><h2>모든 프로젝트를 보관했어</h2><p>보관함에서 언제든 다시 꺼낼 수 있어.</p><button className="primary" type="button" onClick={()=>setArchiveOpen(true)}>보관함 · {archived.length}개</button></div> : selected === 'voice' ? <VoiceStudio/> : activeUrl ? <div className="empty"><div className="empty-icon"><ExternalLink size={25}/></div><h2>{current.label}</h2><p>로그인을 안정적으로 유지할 수 있도록 앱을 독립된 페이지로 열어 줘. 브라우저 뒤로 가기로 허브에 돌아올 수 있어.</p><a className="primary" href={activeUrl} style={{display:'inline-flex',alignItems:'center',gap:8,textDecoration:'none'}}><ExternalLink size={16}/> {current.label} 열기</a></div>:
        <div className="empty">
          <div className="empty-icon"><Link2 size={25}/></div>
          <h2>{current.label} 연결 준비</h2>
          <p>이 앱의 실제 배포 주소가 아직 등록되지 않았어. 우상단 설정에서 원본 앱 URL을 한 번 등록하면 연결할 수 있어.</p>
          <button className="primary" type="button" onClick={()=>{setSettings(true);setDraft('')}}><Settings2 size={16}/> URL 등록하기</button>
        </div>}
    </main>
    <footer className="foot"><MonitorSmartphone size={12}/><span>로그인 유지와 데이터 보호를 위해 각 앱을 독립 페이지에서 실행해. 뒤로 가기로 허브에 돌아올 수 있어.</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

import './mobile-readability.css';
