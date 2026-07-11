import { useEffect, useMemo, useState } from "react";
import { Client } from "@stomp/stompjs";
import { request } from "./api/client";
import AuthPage from "./components/AuthPage";
import AppHeader from "./components/AppHeader";
import Dashboard from "./components/Dashboard";
import EventBrowser from "./components/EventBrowser";
import EventEditor from "./components/EventEditor";
import EventDetails from "./components/EventDetails";
import FloatingChat from "./components/FloatingChat";

const emptyEventForm = { title:"", description:"", location:"", startTime:"", endTime:"", capacity:1 };

export default function App(){
 const [currentUser,setCurrentUser]=useState(()=>{const s=sessionStorage.getItem("user");return s?JSON.parse(s):null});
 const [view,setView]=useState("HOME"); const [events,setEvents]=useState([]); const [users,setUsers]=useState([]); const [registrations,setRegistrations]=useState([]); const [myEventIdSet,setMyEventIdSet]=useState(new Set()); const [selectedEventId,setSelectedEventId]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [editingEventId,setEditingEventId]=useState(null); const [eventForm,setEventForm]=useState(emptyEventForm); const [chatMessages,setChatMessages]=useState([]); const [chatForm,setChatForm]=useState({content:"",type:"PUBLIC"});
 const selectedEvent=useMemo(()=>events.find(e=>String(e.id)===String(selectedEventId)),[events,selectedEventId]);
 const isAdmin=currentUser?.role==="ADMIN", isOrganizer=currentUser?.role==="ORGANIZER", isParticipant=currentUser?.role==="PARTICIPANT", canManageEvents=isAdmin||isOrganizer;
 const myEvents=useMemo(()=>isAdmin?events:events.filter(e=>myEventIdSet.has(String(e.id))),[events,myEventIdSet,isAdmin]);
 const canEditSelected=selectedEvent && (isAdmin || (isOrganizer && selectedEvent.organizerId===currentUser.userId));

 async function login(e,form){e.preventDefault();setError("");try{const data=await request("/api/auth/login",{method:"POST",body:JSON.stringify(form)});sessionStorage.setItem("token",data.token);sessionStorage.setItem("user",JSON.stringify(data));setCurrentUser(data);setView("HOME");setMessage(`Uspešno ste se prijavili kao ${data.username}.`)}catch{setError("Pogrešan email ili lozinka.")}}
 async function registerAccount(e,form,done){e.preventDefault();setError("");try{await request("/api/auth/register",{method:"POST",body:JSON.stringify(form)});setMessage("Registracija je uspešna. Sada se prijavite.");done()}catch(err){setError(err.message)}}
 function logout(){sessionStorage.clear();setCurrentUser(null);setEvents([]);setRegistrations([]);setSelectedEventId("");setView("HOME");setMessage("");setError("")}

 async function loadData(){if(!currentUser)return;setError("");try{const loaded=await request("/api/events");setEvents(loaded||[]);if(isAdmin){const u=await request("/api/users");setUsers(u||[])}else setUsers([{id:currentUser.userId,username:currentUser.username,email:currentUser.email,role:currentUser.role}]);
   if(isOrganizer){setMyEventIdSet(new Set((loaded||[]).filter(e=>e.organizerId===currentUser.userId).map(e=>String(e.id))))}
   else if(isParticipant){const pairs=await Promise.all((loaded||[]).map(async ev=>{try{const regs=await request(`/api/events/${ev.id}/registrations`);return (regs||[]).some(r=>r.userId===currentUser.userId&&r.status!=="CANCELLED")?String(ev.id):null}catch{return null}}));setMyEventIdSet(new Set(pairs.filter(Boolean)))}
   else setMyEventIdSet(new Set((loaded||[]).map(e=>String(e.id))));
 }catch(err){setError(err.message)}}
 async function loadEventData(id){if(!id)return;try{const regs=await request(`/api/events/${id}/registrations`);setRegistrations(regs||[]);const chat=await request(`/api/events/${id}/chat`);setChatMessages(chat||[])}catch(err){setError(err.message)}}
 useEffect(()=>{if(currentUser)loadData()},[currentUser]);
 useEffect(()=>{if(selectedEventId)loadEventData(selectedEventId);else{setRegistrations([]);setChatMessages([])}},[selectedEventId]);
 useEffect(()=>{if(!currentUser||!selectedEventId)return;const client=new Client({brokerURL:"ws://localhost:8080/ws/websocket",reconnectDelay:5000,connectHeaders:{Authorization:`Bearer ${sessionStorage.getItem("token")}`},onConnect:()=>{client.subscribe(`/topic/events/${selectedEventId}`,async()=>{await loadData();await loadEventData(selectedEventId)});client.subscribe(`/topic/events/${selectedEventId}/chat/updates`,async()=>await loadEventData(selectedEventId))},onStompError:f=>console.error("STOMP",f),onWebSocketError:e=>console.error("WS",e)});client.activate();return()=>client.deactivate()},[currentUser,selectedEventId]);

 function openEvent(id){setSelectedEventId(String(id));setView("DETAIL")}
 function backToList(){setSelectedEventId("");setView("ALL")}
 function startCreate(){setEditingEventId(null);setEventForm(emptyEventForm);setView("CREATE")}
 function editEvent(){if(!selectedEvent)return;setEditingEventId(selectedEvent.id);setEventForm({title:selectedEvent.title,description:selectedEvent.description||"",location:selectedEvent.location,startTime:selectedEvent.startTime?.slice(0,16)||"",endTime:selectedEvent.endTime?.slice(0,16)||"",capacity:selectedEvent.capacity});setView("CREATE")}
 async function saveEvent(e){e.preventDefault();setError("");try{const payload={...eventForm,capacity:Number(eventForm.capacity)};const result=editingEventId?await request(`/api/events/${editingEventId}`,{method:"PUT",body:JSON.stringify(payload)}):await request("/api/events",{method:"POST",body:JSON.stringify(payload)});setMessage(editingEventId?`Događaj „${result.title}” je izmenjen.`:`Događaj „${result.title}” je kreiran.`);setEventForm(emptyEventForm);setEditingEventId(null);await loadData();openEvent(result.id)}catch(err){setError(err.message)}}
 async function deleteEvent(){if(!selectedEvent||!confirm("Da li želite da obrišete događaj?"))return;try{await request(`/api/events/${selectedEvent.id}`,{method:"DELETE"});setMessage("Događaj je obrisan.");setSelectedEventId("");setView("ALL");await loadData()}catch(err){setError(err.message)}}
 async function register(type){if(!selectedEventId)return;try{const reg=await request(`/api/events/${selectedEventId}/registrations/${type}?userId=${currentUser.userId}`,{method:"POST"});setMessage(`Prijava uspešna. Status: ${reg.status}`);await loadData();await loadEventData(selectedEventId)}catch(err){setError(err.message)}}
 async function cancelRegistration(userId){try{await request(`/api/events/${selectedEventId}/registrations?userId=${userId}`,{method:"DELETE"});setMessage("Prijava je otkazana.");await loadData();await loadEventData(selectedEventId)}catch(err){setError(err.message)}}
 async function sendChatMessage(e){e.preventDefault();if(!chatForm.content.trim())return;try{await request(`/api/events/${selectedEventId}/chat`,{method:"POST",body:JSON.stringify({content:chatForm.content.trim(),type:chatForm.type})});setChatForm({content:"",type:"PUBLIC"});await loadEventData(selectedEventId)}catch(err){setError(err.message)}}

 if(!currentUser)return <AuthPage login={login} registerAccount={registerAccount} message={message} error={error}/>;
 return <div className="app-shell"><AppHeader currentUser={currentUser} view={view} setView={v=>{if(v==="CREATE")startCreate();else{setView(v);if(v!=="DETAIL")setSelectedEventId("")}}} canManageEvents={canManageEvents} refresh={async()=>{await loadData();if(selectedEventId)await loadEventData(selectedEventId)}} logout={logout}/><main className="app-main">{message&&<div className="toast success dismissible">{message}<button onClick={()=>setMessage("")}>×</button></div>}{error&&<div className="toast error dismissible">{error}<button onClick={()=>setError("")}>×</button></div>}
 {view==="HOME"&&<Dashboard currentUser={currentUser} events={events} myEvents={myEvents} registrations={registrations} setView={v=>v==="CREATE"?startCreate():setView(v)} canManageEvents={canManageEvents}/>} 
 {view==="ALL"&&<EventBrowser title="Svi događaji" subtitle="Pregledajte sve dostupne događaje u sistemu." events={events} onOpen={openEvent} onBack={()=>setView("HOME")}/>} 
 {view==="MINE"&&<EventBrowser title="Moji događaji" subtitle={isOrganizer?"Događaji koje organizujete.":"Događaji na koje ste prijavljeni."} events={myEvents} onOpen={openEvent} onBack={()=>setView("HOME")}/>} 
 {view==="CREATE"&&<EventEditor editing={!!editingEventId} form={eventForm} setForm={setEventForm} onSubmit={saveEvent} onCancel={()=>{setEventForm(emptyEventForm);setEditingEventId(null);setView("HOME")}} onBack={()=>setView(selectedEventId?"DETAIL":"HOME")}/>} 
 {view==="DETAIL"&&selectedEvent&&<EventDetails event={selectedEvent} currentUser={currentUser} isParticipant={isParticipant} canEdit={canEditSelected} registrations={registrations} users={users} onBack={backToList} onEdit={editEvent} onDelete={deleteEvent} onRegister={register} onCancelRegistration={cancelRegistration}/>} 
 </main>{view==="DETAIL"&&selectedEvent&&<FloatingChat event={selectedEvent} messages={chatMessages} currentUser={currentUser} form={chatForm} setForm={setChatForm} onSend={sendChatMessage}/>}</div>
}
