'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws'),crypto=require('crypto');
const PORT=Number(process.env.PORT||3000),MAX=8,ROUND=90;
const grid=["111111111111111111111111","100000010000000100000001","100000010000000100000001","100000000000000000000001","100000010000000100000001","111011111110111111101111","100000010000000100000001","100000010000000100000001","100000000000000000000001","100000010000000100000001","111011111110111111101111","100000010000000100000001","100000000000000000000001","100000010000000100000001","100000010000000100000001","111111111111111111111111"];
const lockers=[[2.5,2.5],[11.5,2.5],[19.5,3.5],[3.5,8.5],[19.5,8.5],[4.5,14.5],[12.5,14.5],[20.5,14.5]];
const rooms=new Map();let nextId=1;
function solid(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return true;const i=Math.floor(x),j=Math.floor(y);return !grid[j]||grid[j][i]!=='0'}
function free(x,y){const r=.17;return !solid(x-r,y-r)&&!solid(x+r,y-r)&&!solid(x-r,y+r)&&!solid(x+r,y+r)}
function move(o,dx,dy){if(free(o.x+dx,o.y))o.x+=dx;if(free(o.x,o.y+dy))o.y+=dy}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function send(ws,data){if(ws.readyState===1)ws.send(JSON.stringify(data))}
function broadcast(room,data){for(const p of room.players.values())send(p.ws,data)}
function snapshot(room){return {type:'state',room:room.id,phase:room.phase,elapsed:room.elapsed,bon:room.bon,players:[...room.players.values()].map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,a:p.a,alive:p.alive,hidden:p.hidden,crouch:p.crouch,stamina:p.stamina})),count:room.players.size}}
function listRooms(){return [...rooms.values()].filter(r=>r.public).map(r=>({id:r.id,name:r.name,count:r.players.size,max:MAX,phase:r.phase}))}
function refreshList(){for(const ws of wss.clients)if(ws.readyState===1&&ws.listening)send(ws,{type:'rooms',rooms:listRooms()})}
function newRoom(name,isPublic){let id=crypto.randomBytes(3).toString('hex').toUpperCase();while(rooms.has(id))id=crypto.randomBytes(3).toString('hex').toUpperCase();const r={id,name:String(name||'Blue Bon Pizzeria').slice(0,40),public:isPublic,players:new Map(),phase:'waiting',elapsed:0,bon:{x:20.5,y:14.5},path:null,pathTimer:0};rooms.set(id,r);return r}
function pathTo(from,to){const start=[Math.floor(from.x),Math.floor(from.y)],goal=[Math.floor(to.x),Math.floor(to.y)],key=(x,y)=>x+','+y,q=[start],prev=new Map(),seen=new Set([key(...start)]);for(let i=0;i<q.length;i++){const [x,y]=q[i];if(x===goal[0]&&y===goal[1])break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!solid(nx+.5,ny+.5)&&!seen.has(k)){seen.add(k);prev.set(k,key(x,y));q.push([nx,ny])}}}let k=key(...goal);if(!seen.has(k))return null;while(prev.has(k)&&prev.get(k)!==key(...start))k=prev.get(k);const [x,y]=k.split(',').map(Number);return {x:x+.5,y:y+.5}}
function leave(ws){const r=ws.room;if(!r)return;r.players.delete(ws.id);ws.room=null;broadcast(r,{type:'notice',text:'A survivor left the server'});if(!r.players.size)rooms.delete(r.id);refreshList()}
function join(ws,room,name){if(room.players.size>=MAX)return send(ws,{type:'error',message:'Server is full'});if(room.phase!=='waiting')return send(ws,{type:'error',message:'Round already started. Join a waiting server.'});leave(ws);const n=room.players.size;const spawn=[[11.5,8.5],[12.5,8.5],[10.5,8.5],[13.5,8.5],[11.5,9.5],[12.5,9.5],[10.5,9.5],[13.5,9.5]][n];const p={id:ws.id,ws,name:String(name||'Survivor').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,18)||'Survivor',x:spawn[0],y:spawn[1],a:0,alive:true,hidden:false,crouch:false,stamina:100,keys:{},lastInput:Date.now()};room.players.set(ws.id,p);ws.room=room;send(ws,{type:'joined',id:ws.id,room:room.id,name:room.name});broadcast(room,snapshot(room));refreshList()}
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!['index.html','game.html'].includes(file)){res.writeHead(404);return res.end('Not found')}fs.readFile(path.join(__dirname,'public',file),(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data)})});
const wss=new WebSocketServer({server,maxPayload:4096});wss.on('connection',ws=>{ws.id=String(nextId++);ws.listening=true;send(ws,{type:'rooms',rooms:listRooms()});ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(!m||typeof m.type!=='string')return;
if(m.type==='list'){ws.listening=true;return send(ws,{type:'rooms',rooms:listRooms()})}
if(m.type==='create'){if(rooms.size>=40)return send(ws,{type:'error',message:'Server limit reached'});const r=newRoom(m.name,m.public!==false);join(ws,r,m.playerName);return}
if(m.type==='join'){const r=rooms.get(String(m.room||'').toUpperCase());return r?join(ws,r,m.playerName):send(ws,{type:'error',message:'Server not found'})}
if(m.type==='leave')return leave(ws);
const r=ws.room,p=r&&r.players.get(ws.id);if(!p)return;
if(m.type==='start'&&r.phase==='waiting'){r.phase='playing';r.elapsed=0;r.bon={x:20.5,y:14.5};for(const v of r.players.values()){v.alive=true;v.hidden=false;v.stamina=100;v.keys={}}broadcast(r,{type:'notice',text:'Night started — survive until 6 AM!'});return}
if(m.type==='input'&&r.phase==='playing'&&p.alive){p.keys={w:!!m.w,a:!!m.a,s:!!m.s,d:!!m.d,shift:!!m.shift,crouch:!!m.crouch};if(Number.isFinite(m.angle))p.a=((m.angle%(2*Math.PI))+2*Math.PI)%(2*Math.PI);p.lastInput=Date.now();return}
if(m.type==='hide'&&r.phase==='playing'&&p.alive){if(p.hidden)p.hidden=false;else if(lockers.some(([x,y])=>Math.hypot(x-p.x,y-p.y)<.8))p.hidden=true;return}
});ws.on('close',()=>leave(ws));ws.on('error',()=>{})});
let previous=Date.now();setInterval(()=>{const now=Date.now(),dt=Math.min(.1,(now-previous)/1000);previous=now;for(const r of rooms.values()){if(r.phase==='playing'){
r.elapsed+=dt;for(const p of r.players.values()){if(!p.alive||p.hidden)continue;const k=now-p.lastInput<700?p.keys:{};const f=Number(!!k.w)-Number(!!k.s),s=Number(!!k.d)-Number(!!k.a),len=Math.hypot(f,s),sprint=k.shift&&p.stamina>0&&!k.crouch&&len>0;const speed=k.crouch?1.05:sprint?3.8:2.3;if(len)move(p,(Math.cos(p.a)*f-Math.sin(p.a)*s)/len*speed*dt,(Math.sin(p.a)*f+Math.cos(p.a)*s)/len*speed*dt);p.stamina=Math.max(0,Math.min(100,p.stamina+(sprint?-38:22)*dt));p.crouch=!!k.crouch}
const targets=[...r.players.values()].filter(p=>p.alive&&!p.hidden).sort((a,b)=>dist(a,r.bon)-dist(b,r.bon));if(targets.length){r.pathTimer-=dt;if(r.pathTimer<=0){r.path=pathTo(r.bon,targets[0]);r.pathTimer=.2}if(r.path){const dx=r.path.x-r.bon.x,dy=r.path.y-r.bon.y,n=Math.hypot(dx,dy);if(n>.05)move(r.bon,dx/n*1.9*dt,dy/n*1.9*dt)}}else r.path=null;
for(const p of r.players.values())if(p.alive&&!p.hidden&&dist(p,r.bon)<.55){p.alive=false;broadcast(r,{type:'caught',id:p.id,name:p.name})}
if(![...r.players.values()].some(p=>p.alive)){r.phase='lost';broadcast(r,{type:'notice',text:'Bon caught everyone!'})}else if(r.elapsed>=ROUND){r.phase='won';broadcast(r,{type:'notice',text:'6 AM — survivors win!'})}}
broadcast(r,snapshot(r))}},50);
server.listen(PORT,'0.0.0.0',()=>console.log('Stay Alive multiplayer listening on port '+PORT));
