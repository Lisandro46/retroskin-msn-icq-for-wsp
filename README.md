# Retro Messenger para WhatsApp

**WhatsApp Web vestido de MSN Messenger 7.5 o de ICQ 2000b**, con zumbido, sonidos, avisos emergentes y todos los chiches. Hermano nostálgico de [Winamp Remote para TIDAL](https://github.com/Lisandro46/winamp-tidal).

> Proyecto de fan, gratis y de código abierto. **Todo es estético**: WhatsApp funciona exactamente igual que en el navegador. No está afiliado a WhatsApp, Meta, Microsoft ni ICQ. Los íconos y sonidos son imitaciones hechas a mano; no se incluye material original.

## Descargar e instalar (1 minuto)

### ⬇️ [Descargar el instalador para Windows](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-Setup.exe)

1. Abrí el archivo que se descargó. Se instala solo, sin preguntas ni permisos de administrador, y crea un acceso directo en el escritorio.
2. Si Windows muestra **"Windows protegió su PC"**, tocá **Más información → Ejecutar de todas formas**. Aparece porque la app no está firmada: un certificado cuesta cientos de dólares por año. El código es público y el instalador lo arma GitHub directamente desde este repo.
3. Se abre Messenger con un código QR. En tu teléfono: **WhatsApp → ⋮ / Configuración → Dispositivos vinculados → Vincular un dispositivo**, y escaneá el código.
4. ¡Listo! La sesión queda guardada. Para cambiar entre MSN e ICQ: **Herramientas → Skin** (en ICQ: **Main → Change Skin**).

¿No querés instalar nada? Bajate la [versión portable](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-Portable.exe): la abrís y listo.

Requisitos: Windows 10 u 11 (64 bits) y WhatsApp en tu teléfono. Para desinstalar: **Configuración de Windows → Aplicaciones → Retro Messenger para WhatsApp → Desinstalar**.

## Qué tiene

| | MSN Messenger 7.5 | ICQ 2000b |
|---|---|---|
| Ventana | Marco azul de Windows XP, menú Archivo / Contactos / Acciones / Herramientas / Ayuda | Gris Windows 98 con relieve, botones amarillos **Main** y **Services** |
| Vos | Foto, nick editable, `(Conectado) ▾`, `<Escribe un mensaje personal>` | **ICQ#** y nick editables, estado con florcita (Online, Away, N/A, Occupied, DND, Free For Chat, Invisible) |
| Lista de chats | "Contactos", muñequitos verdes, grupo "Conectado", contador naranja | "Contact List", florcitas, grupo "Online", notita amarilla que titila cuando hay mensajes |
| Conversación | Sin globos, **"Juan dice:"**, fotos a la derecha, barra Fuente / Emoticonos / **Zumbido** / Enviar, "Juan está escribiendo un mensaje..." | **"Juan (19:05):"** en rojo y lo tuyo en azul, botón **Zumbido!** y Send |
| Sonidos | "Doo-dun" de mensaje, campanita de conexión, zumbido | "Uh-oh!", toc-toc de conexión, zumbido |
| Extras | Banner de publicidad trucha, cartelito "X dice:" abajo a la derecha | Cartelito gris Win98 |

Además: skin **WhatsApp original** (con un botoncito de zumbido flotante), ícono en la bandeja y parpadeo en la barra de tareas.

### El zumbido

El botón **Zumbido** (o **Ctrl+G**) manda el texto `*ZUMBIDO*`, que WhatsApp muestra en negrita, y te sacude la ventana con sonido. Si te llega un **ZUMBIDO** en negrita, tu ventana también tiembla y se muestra como en MSN: "Juan te ha enviado un zumbido.". Como en MSN, no se puede mandar más de uno cada 10 segundos. Del otro lado, quien use WhatsApp normal ve simplemente **ZUMBIDO**.

### Tus propios sonidos

**Herramientas → Carpeta de sonidos…** (en ICQ: **Main → Preferences → Sounds folder…**) abre `%APPDATA%\retro-messenger-whatsapp\sounds`. Si ponés ahí `msn\message.wav`, `msn\nudge.wav`, `msn\online.wav`, `icq\message.wav` (tu "Uh-oh!"), etc., se usan en lugar de las imitaciones. También sirven `.mp3` y `.ogg`.

## Bueno saber

El nick, el mensaje personal, el estado y el ICQ# son decorativos: se guardan en tu PC y **no cambian nada en WhatsApp**.

## Desarrollo

```bash
npm install
npm run dev        # app en modo desarrollo
npm run typecheck
npm run dist       # instalador y portable en dist/
```

Para publicar una versión: `git tag v0.1.0 && git push origin v0.1.0` y GitHub Actions arma el instalador.

### Cómo está hecho

- `src/main` — ventana sin marco de Electron + un `WebContentsView` que carga web.whatsapp.com (con User-Agent de Chrome y sesión persistente), sacudida, bandeja y avisos.
- `src/renderer` — el marco de cada skin (barra de título, menús, cabecera, banner) y los sonidos sintetizados con WebAudio.
- `src/preload/whatsapp.ts` — corre dentro de WhatsApp: marca nodos con `data-wm-*`, dibuja la barra del zumbido y detecta zumbidos y mensajes nuevos.
- `src/wa/selectors.ts` — **todas** las referencias al HTML de WhatsApp (ids, roles, `data-testid`). WhatsApp cambia seguido: si algo deja de verse bien, se arregla ahí.
- `src/wa/css` — las skins aplicadas sobre WhatsApp.

## Licencia

MIT
