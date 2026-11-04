import React,{useEffect,useRef,useState} from 'react';
import {ChevronDown,Link2,Check,Trash2,Plus,Pencil,ArrowUp,ArrowDown,Download,ExternalLink,RotateCcw} from 'lucide-react';
import {voiceSupabase} from './voiceSupabase';
import './VoiceHubTraining.css';

const STARTER_LEVELS = [{"id":1,"title":"기초","items":[{"id":101,"en":"Appoggio","ko":"아포지오 · 호흡 지지","level":1,"deleted":false},{"id":102,"en":"Breath–Voice Coordination","ko":"호흡·성대 협응","level":1,"deleted":false},{"id":103,"en":"F–V Transition","ko":"F→V 전환","level":1,"deleted":false},{"id":104,"en":"S–Z Transition","ko":"S→Z 전환","level":1,"deleted":false},{"id":11,"en":"Lip Trill","ko":"립트릴","level":1,"deleted":false},{"id":105,"en":"Tongue Trill","ko":"텅트릴","level":1,"deleted":false},{"id":8,"en":"Straw Phonation","ko":"빨대 발성","level":1,"deleted":false},{"id":12,"en":"Water Resistance Phonation","ko":"물저항 발성","level":1,"deleted":false},{"id":9,"en":"Gentle Humming","ko":"허밍","level":1,"deleted":false},{"id":7,"en":"Easy Onset","ko":"부드러운 발성 시작","level":1,"deleted":false},{"id":106,"en":"Gentle Offset","ko":"부드러운 발성 종료","level":1,"deleted":false},{"id":17,"en":"Humming to Vowel","ko":"음→아 연결","level":1,"deleted":false}]},{"id":2,"title":"음정","items":[{"id":107,"en":"Single Note Matching","ko":"피아노 단음 따라 하기","level":2,"deleted":false},{"id":108,"en":"Pitch Accuracy","ko":"음정 정확도","level":2,"deleted":false},{"id":109,"en":"Semitone Steps","ko":"반음씩 상행·하행","level":2,"deleted":false},{"id":110,"en":"Interval Jumps","ko":"3도·5도·옥타브 도약","level":2,"deleted":false},{"id":13,"en":"Pitch Glide","ko":"피치 글라이드","level":2,"deleted":false},{"id":111,"en":"Siren","ko":"사이렌","level":2,"deleted":false},{"id":112,"en":"Range Expansion","ko":"음역 확장","level":2,"deleted":false}]},{"id":3,"title":"음색","items":[{"id":113,"en":"Chest Register","ko":"흉성","level":3,"deleted":false},{"id":114,"en":"Head Register","ko":"두성","level":3,"deleted":false},{"id":115,"en":"Mix Coordination","ko":"믹스 보이스","level":3,"deleted":false},{"id":116,"en":"Register Transition","ko":"성구 전환","level":3,"deleted":false},{"id":117,"en":"Vowel Resonance","ko":"모음·공명 조절","level":3,"deleted":false},{"id":118,"en":"Bright–Dark Tone","ko":"밝고 어두운 음색","level":3,"deleted":false},{"id":119,"en":"Light–Full Tone","ko":"가볍고 묵직한 음색","level":3,"deleted":false},{"id":16,"en":"M–N–NG Resonance","ko":"비음·공명 탐색","level":3,"deleted":false}]},{"id":4,"title":"기교","items":[{"id":31,"en":"Crescendo–Decrescendo","ko":"크레셴도·디크레셴도","level":4,"deleted":false},{"id":120,"en":"Messa di Voce","ko":"메사 디 보체","level":4,"deleted":false},{"id":121,"en":"Scale Agility","ko":"스케일 민첩성","level":4,"deleted":false},{"id":122,"en":"Arpeggio","ko":"아르페지오","level":4,"deleted":false},{"id":123,"en":"Melisma","ko":"멜리스마","level":4,"deleted":false},{"id":124,"en":"Legato","ko":"레가토","level":4,"deleted":false},{"id":125,"en":"Staccato","ko":"스타카토","level":4,"deleted":false},{"id":126,"en":"Vibrato","ko":"비브라토 조절","level":4,"deleted":false},{"id":15,"en":"Dynamic Control","ko":"음량 조절","level":4,"deleted":false}]},{"id":5,"title":"표현","items":[{"id":10,"en":"Sustained Tone","ko":"지속음·발성 안정성","level":5,"deleted":false},{"id":127,"en":"Long Phrase","ko":"긴 프레이즈·호흡 배분","level":5,"deleted":false},{"id":21,"en":"Clear Diction","ko":"자음·모음 딕션","level":5,"deleted":false},{"id":30,"en":"Semantic Pausing","ko":"의미 단위 쉼","level":5,"deleted":false},{"id":128,"en":"Musical Phrasing","ko":"프레이징","level":5,"deleted":false},{"id":27,"en":"Stress & Intonation","ko":"강세·억양","level":5,"deleted":false},{"id":35,"en":"Emotional Delivery","ko":"감정 표현","level":5,"deleted":false},{"id":129,"en":"Expressive Reading","ko":"표현 낭독","level":5,"deleted":false},{"id":20,"en":"Voice to Speech","ko":"발성에서 말하기 연결","level":5,"deleted":false}]}];
const DEFAULT_CATALOG = STARTER_LEVELS.flatMap(group=>group.items.map((item,i)=>({...item,sort:i})));
const LEVEL_NAMES=['기초','음정','음색','기교','표현'];
const CATALOG_ID=2147483000;
const MAX_VIDEOS=5;
const storageKey=user=>'voice-flow-drill-catalog-v2-'+user;
const videoKey=user=>'voice-flow-drill-videos-v2-'+user;
const parseJson=(raw,otherwise)=>{try{return JSON.parse(raw)}catch{return otherwise}};
const readLocal=(key,fallback)=>{try{return parseJson(localStorage.getItem(key),fallback)||fallback}catch{return fallback}};
const writeLocal=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
function videoId(text){
 try{
  const u=new URL(String(text||'').trim().replace(/^(?!https?:\/\/)/,'https://'));
  const host=u.hostname.toLowerCase();
  const id=host==='youtu.be'?u.pathname.split('/')[1]:
   ['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)?
    (u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1]):'';
  return /^[\w-]{11}$/.test(id||'')?id:'';
 }catch{return ''}
}
function normalizeVideos(value){
 if(typeof value==='string'){
  const parsed=parseJson(value,null);
  if(Array.isArray(parsed))value=parsed;
  else if(parsed?.kind==='voice-drill-videos-v2')value=parsed.videos;
  else value=[value];
 }
 return [...new Set((Array.isArray(value)?value:[]).map(x=>videoId(x)||(/^[\w-]{11}$/.test(x)?x:'')).filter(Boolean))].slice(0,MAX_VIDEOS);
}
const merge=(a,b)=>{
 const result={...a};
 for(const [id,arr] of Object.entries(b||{}))result[id]=[...new Set([...normalizeVideos(result[id]),...normalizeVideos(arr)])].slice(0,MAX_VIDEOS);
 return result;
};
function cleanCatalog(arr){
 if(!Array.isArray(arr))return null;
 const ids=new Set();
 return arr.filter(x=>{
  const id=Number(x?.id);
  if(!Number.isSafeInteger(id)||id<=0||id===CATALOG_ID||ids.has(id))return false;
  ids.add(id);return true;
 }).map((x,i)=>({id:Number(x.id),en:String(x.en||'').slice(0,150),ko:String(x.ko||'').slice(0,150),
  level:Math.max(1,Math.min(5,Number(x.level)||1)),sort:Number.isFinite(Number(x.sort))?Number(x.sort):i,deleted:!!x.deleted}));
}
function unpack(row){
 if(!row?.video_url)return [];
 return normalizeVideos(row.video_url);
}
function saveJson(name,payload){
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export default function VoiceHubTraining(){
 const [session,setSession]=useState(null),[authReady,setAuthReady]=useState(false),[ready,setReady]=useState(false);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false),[busy,setBusy]=useState(false);
 const [level,setLevel]=useState(1),[catalog,setCatalog]=useState(DEFAULT_CATALOG),[videos,setVideos]=useState({});
 const [expanded,setExpanded]=useState(null),[editing,setEditing]=useState(false),[archived,setArchived]=useState(false);
 const [editor,setEditor]=useState(null),[draft,setDraft]=useState({en:'',ko:'',level:1});
 const [linkDraft,setLinkDraft]=useState(''),[linkEditing,setLinkEditing]=useState(null),[activeVideo,setActiveVideo]=useState({});
 const [status,setStatus]=useState(''),[cloudLoaded,setCloudLoaded]=useState(false),[exporting,setExporting]=useState(false);
 const userId=session?.user?.id;
 const videosRef=useRef({}),saveQueue=useRef({});
 const note=msg=>setStatus(msg);
 useEffect(()=>{
  let alive=true;
  voiceSupabase.auth.getSession().then(({data,error})=>{if(!alive)return;if(error)note(error.message);setSession(data?.session||null);setAuthReady(true)})
   .catch(e=>{if(alive){note(e.message);setAuthReady(true)}});
  const {data:{subscription}}=voiceSupabase.auth.onAuthStateChange((_evt,s)=>{if(alive)setSession(s)});
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!userId){setReady(false);setCatalog(DEFAULT_CATALOG);setVideos({});return}
  let alive=true;
  setReady(false);setCloudLoaded(false);note('');
  const localCat=cleanCatalog(readLocal(storageKey(userId),null));
  const localVids=readLocal(videoKey(userId),{});
  setCatalog(localCat||DEFAULT_CATALOG);setVideos(localVids);videosRef.current=localVids;
  (async()=>{
   try{
    const {data,error}=await voiceSupabase.from('voice_studio_drills')
     .select('drill_id,video_url,timestamps').eq('user_id',userId);
    if(error)throw error;
    const rows=data||[];
    const meta=rows.find(r=>r.drill_id===CATALOG_ID);
    let remoteCatalog=null;
    if(meta?.video_url){
     const parsed=parseJson(meta.video_url,null);
     if(parsed?.kind==='voice-drill-catalog-v2')remoteCatalog=cleanCatalog(parsed.items);
    }
    const effective=remoteCatalog||localCat||DEFAULT_CATALOG;
    const cloud={};
    for(const row of rows){
     if(row.drill_id===CATALOG_ID)continue;
     const ids=unpack(row);
     if(ids.length)cloud[row.drill_id]=ids;
    }
    const combined=merge(cloud,merge(localVids,videosRef.current));
    if(!alive)return;
    videosRef.current=combined;setVideos(combined);writeLocal(videoKey(userId),combined);
    setCatalog(effective);writeLocal(storageKey(userId),effective);
    setCloudLoaded(true);setReady(true);
    // Create only a missing metadata record; never overwrite an existing user catalog on load.
    if(!remoteCatalog&&!meta){
     const result=await voiceSupabase.from('voice_studio_drills').upsert({
      user_id:userId,drill_id:CATALOG_ID,video_url:JSON.stringify({kind:'voice-drill-catalog-v2',items:effective}),timestamps:[]
     },{onConflict:'user_id,drill_id'});
     if(result.error&&alive)note('목록 클라우드 저장 확인 필요: '+result.error.message);
    }
    // Legacy single links stay in original database rows, regardless of whether they are displayed.
   }catch(e){if(alive){note('클라우드 조회 실패 · 기기 데이터 유지: '+e.message);setReady(true)}}
  })();
  return()=>{alive=false};
 },[userId]);
 const persistCatalog=async next=>{
  const safe=cleanCatalog(next);if(!safe)return;
  setCatalog(safe);writeLocal(storageKey(userId),safe);
  if(!userId)return;
  const {error}=await voiceSupabase.from('voice_studio_drills').upsert({
   user_id:userId,drill_id:CATALOG_ID,video_url:JSON.stringify({kind:'voice-drill-catalog-v2',items:safe}),timestamps:[]
  },{onConflict:'user_id,drill_id'});
  note(error?'목록은 기기에 저장됨 · 클라우드 오류: '+error.message:'목록 저장 완료');
 };
 const saveVideos=async(id,arr)=>{
  const list=normalizeVideos(arr),next={...videosRef.current,[id]:list};
  videosRef.current=next;setVideos(next);writeLocal(videoKey(userId),next);
  if(!userId)return;
  const {data:old,error:readError}=await voiceSupabase.from('voice_studio_drills')
   .select('timestamps').eq('user_id',userId).eq('drill_id',id).maybeSingle();
  if(readError){note('기기 저장됨 · 클라우드 조회 실패');return}
  const {error}=await voiceSupabase.from('voice_studio_drills').upsert({
   user_id:userId,drill_id:id,
   video_url:JSON.stringify({kind:'voice-drill-videos-v2',videos:list.map(v=>'https://www.youtube.com/watch?v='+v)}),
   timestamps:old?.timestamps||[]
  },{onConflict:'user_id,drill_id'});
  note(error?'영상은 기기에 저장됨 · 클라우드 오류: '+error.message:'영상 저장 완료');
 };
 const addLinks=async(id,raw)=>{
  const inputs=String(raw||'').match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s,，]+/gi)||[raw];
  const found=inputs.map(videoId).filter(Boolean);
  if(!found.length){note('올바른 유튜브 링크를 입력해 줘.');return}
  const before=normalizeVideos(videosRef.current[id]);
  const added=[...new Set([...before,...found])].slice(0,MAX_VIDEOS);
  if(added.length===before.length){note(before.length===MAX_VIDEOS?'영상은 항목당 최대 5개야.':'이미 등록된 링크야.');return}
  await saveVideos(id,added);setActiveVideo(a=>({...a,[id]:before.length}));setExpanded(id);setLinkEditing(null);setLinkDraft('');
 };
 const removeVideo=async(id,index)=>{
  if(!window.confirm('이 영상 링크를 삭제할까?'))return;
  await saveVideos(id,normalizeVideos(videosRef.current[id]).filter((_,i)=>i!==index));
  setActiveVideo(a=>({...a,[id]:0}));
 };
 const persistItem=e=>{
  e.preventDefault();if(!draft.en.trim()&&!draft.ko.trim())return note('이름을 입력해 줘.');
  const target=Number(draft.level);
  if(editor?.id){
   const old=catalog.find(x=>x.id===editor.id);
   const sort=old?.level===target?old.sort:1+Math.max(-1,...catalog.filter(x=>x.level===target).map(x=>x.sort));
   persistCatalog(catalog.map(x=>x.id===editor.id?{...x,en:draft.en.trim(),ko:draft.ko.trim(),level:target,sort}:x));
  }else{
   const id=Math.max(1000,...catalog.map(x=>x.id))+1;
   const sort=1+Math.max(-1,...catalog.filter(x=>x.level===target).map(x=>x.sort));
   persistCatalog([...catalog,{id,en:draft.en.trim(),ko:draft.ko.trim(),level:target,sort,deleted:false}]);
  }
  setLevel(target);setEditor(null);
 };
 const shift=(item,dir)=>{
  const group=catalog.filter(x=>x.level===item.level&&!x.deleted).sort((a,b)=>a.sort-b.sort||a.id-b.id);
  const index=group.findIndex(x=>x.id===item.id),other=group[index+dir];
  if(other)persistCatalog(catalog.map(x=>x.id===item.id?{...x,sort:other.sort}:x.id===other.id?{...x,sort:item.sort}:x));
 };
 const archive=item=>{
  if(!window.confirm('목록에서 숨길까? 기존 영상 링크는 보존되고 복구할 수 있어.'))return;
  persistCatalog(catalog.map(x=>x.id===item.id?{...x,deleted:true}:x));
 };
 const exportBackup=async()=>{
  if(exporting)return;setExporting(true);
  try{
   const {data,error}=await voiceSupabase.from('voice_studio_drills').select('drill_id,video_url,timestamps').eq('user_id',userId);
   const sourceRows=!error?(data||[]):[];
   const union=merge(Object.fromEntries(sourceRows.filter(r=>r.drill_id!==CATALOG_ID).map(r=>[r.drill_id,unpack(r)])),merge(readLocal(videoKey(userId),{}),videosRef.current));
   const now=new Date();
   const stamp=now.toISOString().replace(/[-:]/g,'').slice(0,13);
   saveJson('voice-flow-drills-'+stamp+'.json',{
    format:'voice-flow-drills-backup-v2',exportedAt:now.toISOString(),cloudStatus:error?'read-failed: '+error.message:'read-ok',
    levels:LEVEL_NAMES,catalog,links:Object.fromEntries(Object.entries(union).map(([k,v])=>[k,v.map(id=>'https://www.youtube.com/watch?v='+id)])),
    legacyRows:sourceRows.filter(r=>r.drill_id!==CATALOG_ID),
    note:'백업용: 기존 50 Drill 링크와 시간 기록도 포함. 파일은 서버 데이터를 변경하지 않습니다.'
   });
   note(error?'기기 데이터 백업 완료 · 클라우드 조회 실패':'JSON 백업 다운로드 완료');
  }catch(e){note('백업 실패: '+e.message)}finally{setExporting(false)}
 };
 if(!authReady)return <div className="voice-auth-loading">로그인 확인 중…</div>;
 if(!session)return <VoiceDrillAuth email={email} setEmail={setEmail} password={password} setPassword={setPassword} signup={signup} setSignup={setSignup} busy={busy} status={status} submit={async e=>{
  e.preventDefault();setBusy(true);note('');
  try{const {data,error}=signup?await voiceSupabase.auth.signUp({email:email.trim(),password}):await voiceSupabase.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw error;if(signup&&!data.session)note('이메일 인증 후 로그인해 줘.');setPassword('');
  }catch(e){note(e.message)}finally{setBusy(false)}
 }}/>;
 if(!ready)return <div className="voice-auth-loading">드릴 목록 동기화 중…</div>;
 const visible=catalog.filter(x=>x.level===level&&x.deleted===archived).sort((a,b)=>a.sort-b.sort||a.id-b.id);
 const total=catalog.filter(x=>!x.deleted).length;
 return <section className="voice-training">
  <div className="voice-heading"><div><strong>Voice Drill</strong><span>{total} Drill · 5 Stage</span></div><button className="voice-logout" onClick={()=>voiceSupabase.auth.signOut()}>로그아웃</button></div>
  <nav className="voice-levels" aria-label="드릴 스테이지">{LEVEL_NAMES.map((title,i)=><button key={title} type="button" className={level===i+1?'selected':''} onClick={()=>{setLevel(i+1);setExpanded(null)}}><small>Lv.{i+1}</small><b>{title}</b></button>)}</nav>
  <div className="voice-drill-tools">
   <button onClick={exportBackup} disabled={exporting}><Download size={15}/>{exporting?'백업 중…':'JSON 백업'}</button>
   <button className={editing?'selected':''} onClick={()=>setEditing(v=>!v)}><Pencil size={15}/>{editing?'편집 완료':'목록 편집'}</button>
  </div>
  <div className="voice-list-title"><b>LEVEL {level} · {LEVEL_NAMES[level-1]}</b><span>{visible.length} Drill</span></div>
  {editing&&<div className="voice-drill-tools"><button onClick={()=>{setDraft({en:'',ko:'',level});setEditor({mode:'new'})}}><Plus size={15}/>기술 추가</button><button onClick={()=>setArchived(v=>!v)}><RotateCcw size={15}/>{archived?'일반 목록':'보관 목록'}</button></div>}
  {editor&&<form className="voice-link-editor voice-catalog-editor" onSubmit={persistItem}>
   <input placeholder="영문 기술명" value={draft.en} onChange={e=>setDraft(d=>({...d,en:e.target.value}))}/>
   <input placeholder="한글 기술명" value={draft.ko} onChange={e=>setDraft(d=>({...d,ko:e.target.value}))}/>
   <select value={draft.level} onChange={e=>setDraft(d=>({...d,level:Number(e.target.value)}))}>{LEVEL_NAMES.map((t,i)=><option value={i+1} key={t}>{t}</option>)}</select>
   <div className="voice-drill-tools"><button type="submit"><Check size={15}/>저장</button><button type="button" onClick={()=>setEditor(null)}>취소</button></div>
  </form>}
  <div className="voice-list">{visible.map((item,index)=>{
   const list=normalizeVideos(videos[item.id]),open=expanded===item.id,active=Math.min(activeVideo[item.id]||0,Math.max(0,list.length-1));
   return <div className="voice-drill" key={item.id}>
    <div className="voice-drill-row">
     <button type="button" className="voice-drill-heading" onClick={()=>setExpanded(open?null:item.id)}>
      <span className="voice-drill-number">{String(index+1).padStart(2,'0')}</span>
      <span className="voice-drill-names"><b>{item.en||item.ko}</b><small>{item.ko}</small></span>
      {list.length>0&&<small className="voice-drill-count">{list.length}/5</small>}<ChevronDown size={16} className={open?'rotated':''}/>
     </button>
     {!editing&&<button className={'voice-link-btn'+(list.length?' linked':'')} title="영상 추가" onClick={()=>{setExpanded(item.id);setLinkEditing(item.id);setLinkDraft('')}}><Link2 size={17}/></button>}
    </div>
    {editing&&<div className="voice-drill-tools voice-row-actions">
     {item.deleted?<button onClick={()=>persistCatalog(catalog.map(x=>x.id===item.id?{...x,deleted:false}:x))}>복구</button>:<>
      <button onClick={()=>shift(item,-1)} disabled={index===0}><ArrowUp size={15}/></button>
      <button onClick={()=>shift(item,1)} disabled={index===visible.length-1}><ArrowDown size={15}/></button>
      <button onClick={()=>{setDraft({...item});setEditor({id:item.id})}}><Pencil size={15}/>수정</button>
      <button onClick={()=>archive(item)}><Trash2 size={15}/>보관</button>
     </>}
    </div>}
    {open&&<div className="voice-video-content">
     {list.length>0&&<><div className="voice-drill-video-tabs">{list.map((v,i)=><button key={v} className={active===i?'selected':''} onClick={()=>setActiveVideo(a=>({...a,[item.id]:i}))}>{i+1}</button>)}</div>
      <div className="voice-video-wrap"><iframe key={list[active]} title={item.en+' 영상'} src={'https://www.youtube-nocookie.com/embed/'+list[active]+'?playsinline=1'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div>
      <div className="voice-drill-tools"><button onClick={()=>navigator.clipboard.writeText('https://www.youtube.com/watch?v='+list[active]).then(()=>note('링크 복사 완료')).catch(()=>note('복사 권한을 확인해 줘.'))}><Link2 size={15}/>링크 복사</button>
       <a href={'https://www.youtube.com/watch?v='+list[active]} target="_blank" rel="noreferrer"><ExternalLink size={15}/>영상 열기</a>
       <button onClick={()=>removeVideo(item.id,active)}><Trash2 size={15}/>영상 삭제</button></div>
     </>}
     {list.length===0&&<div className="voice-video-wait">영상 링크 등록 대기</div>}
     {list.length<MAX_VIDEOS&&<form className="voice-link-editor" onSubmit={e=>{e.preventDefault();addLinks(item.id,linkDraft)}}>
      <input type="text" placeholder="유튜브 링크 입력 (여러 개 붙여넣기 가능)" value={linkEditing===item.id?linkDraft:''} onFocus={()=>setLinkEditing(item.id)} onChange={e=>{setLinkEditing(item.id);setLinkDraft(e.target.value)}}/>
      <div className="voice-drill-tools"><button type="submit"><Plus size={15}/>영상 등록</button></div>
     </form>}
    </div>}
   </div>
  })}</div>
  {status&&<p className="voice-sync-alert" role="status">{status}</p>}
  <p className="voice-storage-note">기술 목록은 개수 제한 없이 추가할 수 있어. 각 기술마다 영상은 5개까지 저장 가능하며, 기존 영상과 타임스탬프 기록은 삭제하지 않아.</p>
 </section>;
}
function VoiceDrillAuth({email,setEmail,password,setPassword,signup,setSignup,busy,status,submit}){
 return <section className="voice-auth"><form className="voice-auth-card" onSubmit={submit}>
  <h2>Voice Flow</h2><p>로그인하면 드릴 목록과 영상 링크가 기기 사이에 동기화돼.</p>
  <div className="voice-auth-modes"><button type="button" className={!signup?'selected':''} onClick={()=>setSignup(false)}>로그인</button><button type="button" className={signup?'selected':''} onClick={()=>setSignup(true)}>회원가입</button></div>
  <input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" required/>
  <input type="password" minLength={6} autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="비밀번호" required/>
  <button type="submit" className="primary" disabled={busy}>{busy?'처리 중…':signup?'회원가입':'로그인'}</button>{status&&<p className="voice-link-error">{status}</p>}
 </form></section>;
}
