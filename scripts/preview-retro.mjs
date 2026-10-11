/** Local visual harness: fictional contacts, actual skin CSS/templates/preload. No WhatsApp connection. */
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
const root = path.resolve(import.meta.dirname, '..')
const settings = {skin:'msn',nick:'Licha',personalMessage:'Tecnología desde la trinchera',msnStatus:'online',icqStatus:'online',uin:'123456789',sounds:false,shake:false,toasts:false,alwaysOnTop:false}
const mock = 'const handlers=new Map(); let settings='+JSON.stringify(settings)+`; const emit=()=>handlers.get("wa:settings")?.({},settings); export const ipcRenderer={on:(name,fn)=>handlers.set(name,fn),send:(name,value)=>{parent.postMessage({kind:"event",name,value},location.origin);if(name==="wa:hello")queueMicrotask(emit);if(name==="wa:profile-edit"){settings={...settings,...value};queueMicrotask(emit)}}};window.addEventListener("message",e=>{if(e.origin!==location.origin)return;if(e.data.skin){settings={...settings,skin:e.data.skin};emit()}if(e.data.action==="chat"){const main=document.getElementById("main");main.hidden=!main.hidden;}if(e.data.action==="composer"){document.querySelector("#main footer").style.height=e.data.large?"140px":"68px";}});`
const outer = `<!doctype html>
<html>
<meta charset="utf-8">
<title>Revisión retro — datos ficticios</title>
<link rel="stylesheet" href="/src/renderer/styles/shell.css">
<link rel="stylesheet" href="/src/renderer/styles/msn.css">
<link rel="stylesheet" href="/src/renderer/styles/icq.css">
<style>body{background:#596575;overflow:auto;padding:16px;height:auto}#controls{color:white;margin-bottom:12px;display:flex;align-items:center;gap:8px}#controls button{color:#111;background:#eee}#stage{position:relative;width:1040px;height:690px;max-width:100%;box-shadow:0 6px 30px #0006}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}#events{color:#fff;white-space:pre-wrap;max-height:100px;overflow:auto;font:11px monospace}</style>
<div id="controls">
<b>Vista de prueba · datos ficticios</b>
<button data-skin="msn">MSN</button>
<button data-skin="icq">ICQ</button>
<button data-skin="off">Original</button>
<button id="compact">Ancho compacto</button>
<button id="chat">Abrir/cerrar chat</button>
<button id="composer">Editor multilínea</button>
</div>
<div id="stage">
<div id="root" data-wa="ready">
</div>
</div>
<pre id="events">Eventos de prueba</pre>
<script type="module">import {msnChrome,icqChrome,offChrome} from "/src/renderer/skins.ts";let settings=`+JSON.stringify(settings)+`;let frame;function render(){document.body.dataset.skin=settings.skin;document.getElementById("root").innerHTML=({msn:msnChrome,icq:icqChrome,off:offChrome}[settings.skin])(settings,false);if(!frame){frame=document.createElement("iframe");frame.src="/wa";frame.title="WhatsApp simulado";}if(!frame.isConnected)document.getElementById("stage").append(frame);layout();}function layout(){const stage=document.getElementById("stage").getBoundingClientRect(),r=document.getElementById("content").getBoundingClientRect();Object.assign(frame.style,{inset:"auto",left:(r.left-stage.left)+"px",top:(r.top-stage.top)+"px",width:r.width+"px",height:r.height+"px"});}render();new ResizeObserver(layout).observe(document.getElementById("stage"));document.querySelectorAll("#controls [data-skin]").forEach(b=>b.onclick=()=>{settings.skin=b.dataset.skin;render();frame.contentWindow.postMessage({skin:settings.skin},location.origin)});let compact=false,large=false;document.getElementById("compact").onclick=()=>{compact=!compact;document.getElementById("stage").style.width=compact?"720px":"1040px"};document.getElementById("chat").onclick=()=>frame.contentWindow.postMessage({action:"chat"},location.origin);document.getElementById("composer").onclick=()=>{large=!large;frame.contentWindow.postMessage({action:"composer",large},location.origin)};window.addEventListener("message",e=>{if(e.origin!==location.origin||e.data.kind!=="event")return;const log=document.getElementById("events");log.textContent+=String.fromCharCode(10)+e.data.name+" "+JSON.stringify(e.data.value??null);log.scrollTop=log.scrollHeight;});</script>
</html>`
const contacts = ['Ana García','Martín Pérez','Grupo del colegio','Soporte 24/7','Sofía','Diego']
const rows = contacts.map((name,i)=>'<div role="row"><div data-testid="cell-frame-container"><div><div class="avatar">'+(i===2?'<svg><title>group</title></svg>':'<img alt="" src="/avatar.svg">')+'</div></div><div><div data-testid="cell-frame-title"><span title="'+name+'">'+name+'</span></div><div data-testid="cell-frame-secondary"><span data-testid="last-msg-status">'+['Nos vemos mañana','Probamos la nueva skin','Ana: reunión a las 18','Sin incidentes pendientes','Foto','Gracias'][i]+'</span></div></div>'+(i===1?'<span data-testid="icon-unread-count" aria-label="2">2</span>':'')+'</div></div>').join('')
const messages = [['in','Ana García','¿Te acordás de las conversaciones de Messenger?'],['out','Licha','Sí. Hasta el espacio para la foto era parte de su identidad.'],['in','Ana García','Y la flor de ICQ con ocho pétalos.'],['in','Ana García','Probemos también un mensaje más largo para revisar el ajuste de líneas y el espacio del editor.']].map(([dir,name,text],i)=>'<div role="row"><div data-id="demo-'+i+'"><span data-testid="tail-'+dir+'"></span><div><div data-testid="msg-container"><div data-pre-plain-text="[18:05, 11/10/2026] '+name+': "><span data-testid="selectable-text">'+text+'</span><span data-testid="msg-meta">18:05 ✓✓</span></div></div></div></div></div>').join('')
const wa = `<!doctype html>
<html>
<meta charset="utf-8">
<title>WhatsApp simulado</title>
<style>*{box-sizing:border-box}html,body,#app{margin:0;height:100%;font:13px Arial,sans-serif}#app{display:flex;background:#efeae2}#side{width:310px;flex:none;display:flex;flex-direction:column;border-right:1px solid #ccc;background:#fff}#side header{height:44px;flex:none;padding:6px 12px;display:flex;align-items:center;justify-content:space-between}h2{font-size:16px;margin:0}button{font:inherit;padding:4px 6px;border:1px solid #bcc3ca;background:#eee}#side header button{border:0;background:transparent}[data-testid="chat-list-search-container"]{padding:8px}[data-testid="chat-list-search-container"]>div{padding:4px;background:#eee}input{width:100%;border:0;background:transparent;font:12px Arial}#pane-side{flex:1;min-height:0;overflow:auto}[data-testid="cell-frame-container"]{min-height:60px;display:flex;align-items:center;padding:6px 10px;gap:8px;border-bottom:1px solid #ddd}.avatar{width:36px;height:36px}.avatar img{width:100%;height:100%}[data-testid="cell-frame-secondary"]{color:#777;margin-top:4px;font-size:11px}[data-testid="icon-unread-count"]{border-radius:8px;padding:2px 5px;margin-left:auto}#main{flex:1;min-width:0;display:flex;flex-direction:column}#main[hidden]{display:none}#main header{height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#eee}#main header>div{display:flex;gap:10px;align-items:center}[data-testid="conversation-info-header"]{display:flex;flex-direction:column;gap:4px}[data-testid="conversation-info-header"]>span{font-size:10px;color:#888}[data-testid="conversation-background"]{flex:1;min-height:0;overflow:auto;padding:12px}[data-testid="msg-container"]{background:#d9fdd3;border-radius:8px;padding:8px;margin-bottom:10px}[data-testid="selectable-text"]{display:block;line-height:1.5}[data-testid="msg-meta"]{font-size:10px;float:right}#main footer{height:68px;flex:none;display:flex;align-items:center;gap:6px;padding:8px;background:#eee}[data-testid="conversation-compose-box-input"]{background:white;border:1px solid #aaa;flex:1;min-height:42px;padding:8px;max-height:120px;overflow:auto;outline:none}</style>
<link rel="stylesheet" href="/src/wa/css/base.css">
<link rel="stylesheet" href="/src/wa/css/chrome.css">
<link rel="stylesheet" href="/src/wa/css/msn.css">
<link rel="stylesheet" href="/src/wa/css/icq.css">
<script type="module">import {iconCssVars} from "/src/shared/icons.ts";document.head.insertAdjacentHTML("beforeend","<style>"+iconCssVars()+"</style>");</script>
<script type="module" src="/src/preload/whatsapp.ts">
</script>
<div id="app">
<aside id="side">
<header data-testid="chatlist-header">
<h2>
<span data-testid="wa-wordmark">Chats</span>
</h2>
<button title="Nuevo chat">＋</button>
</header>
<div data-testid="chat-list-search-container">
<div>
<input role="textbox" placeholder="Buscar o empezar un chat">
</div>
</div>
<div id="pane-side">
<div data-testid="chat-list">`+rows+'</div></div></aside><main id="main"><header data-testid="conversation-header"><div><div role="button"><img src="/avatar.svg" width="32" alt="Ana"></div><div data-testid="conversation-info-header"><b data-testid="conversation-info-header-chat-title">Ana García</b><span>en línea</span></div></div><button title="Opciones de conversación">⋮</button></header><div data-testid="conversation-background">'+messages+`</div>
<footer>
<button title="Emoticonos">
<svg width="14" height="14">
<title>smiley</title>
<circle cx="7" cy="7" r="6" fill="#f6bf33"/>
</svg>
</button>
<button title="Adjuntar">＋</button>
<div contenteditable="true" role="textbox" aria-label="Mensaje ficticio" data-testid="conversation-compose-box-input">
</div>
<button aria-label="Enviar mensaje" onclick="parent.postMessage({kind:&#39;event&#39;,name:&#39;demo:send&#39;},location.origin)">
<svg width="14" height="14">
<title>send</title>
<path d="M0 0 L14 7 L0 14Z" fill="#6c83a4"/>
</svg>
</button>
</footer>
</main>
</div>
</html>`
const server=http.createServer(async(req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname;res.setHeader('Cache-Control','no-store');if(route==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(outer)}if(route==='/wa'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(wa)}if(route==='/mock-electron.js'){res.setHeader('Content-Type','text/javascript');return res.end(mock)}if(route==='/avatar.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#badde8"/><circle cx="48" cy="35" r="19" fill="#eacdb0"/><path d="M16 96V79Q16 57 48 57T80 79V96" fill="#5c8ca7"/></svg>')}if(!route.startsWith('/src/')){res.writeHead(404);return res.end()}let file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep))throw Error('Invalid path');if(!path.extname(file))file+='.ts';let body=await fs.readFile(file,'utf8');if(file.endsWith('.ts')){body=ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;body=body.replace(/from ['"]@shared\/([^'"]+)['"]/g,'from "/src/shared/$1.ts"').replace(/from ['"]@wa\/([^'"]+)['"]/g,'from "/src/wa/$1.ts"').replace(/from ['"]electron['"]/g,'from "/mock-electron.js"');res.setHeader('Content-Type','text/javascript')}else res.setHeader('Content-Type','text/css');res.end(body)}catch(error){res.writeHead(500);res.end(String(error))}})
server.listen(4173,'127.0.0.1',()=>console.log('Retro preview: http://127.0.0.1:4173 — datos ficticios'))
