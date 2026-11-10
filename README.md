# Retro Messenger para WhatsApp

**WhatsApp Web vestido de MSN Messenger 7.5 o de ICQ 2000b**, con zumbido, sonidos, avisos emergentes y todos los chiches. Hermano nostálgico de [Winamp Remote para TIDAL](https://github.com/Lisandro46/winamp-tidal).

**Página oficial y descargas: [retro.trincherai.com](https://retro.trincherai.com)**

> Proyecto de fan, gratis y de código abierto. **Todo es estético**: WhatsApp funciona exactamente igual que en el navegador. No está afiliado a WhatsApp, Meta, Microsoft ni ICQ. Los íconos son imitaciones hechas a mano. Los sonidos son los originales de MSN e ICQ, de sus respectivos dueños, incluidos solo por nostalgia ([créditos](resources/sounds/CREDITOS.md)).

## Descargar e instalar (1 minuto)

Hay versión para **Windows**, **Mac** y **Linux**.

### Windows

#### ⬇️ [Descargar el instalador para Windows](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-Setup.exe)

1. Abrí el archivo que se descargó. Se instala solo, sin preguntas ni permisos de administrador, y crea un acceso directo en el escritorio.
2. Si Windows muestra **"Windows protegió su PC"**, tocá **Más información → Ejecutar de todas formas**. Aparece porque la app no está firmada: un certificado cuesta cientos de dólares por año. El código es público y el instalador lo arma GitHub directamente desde este repo.
3. Se abre Messenger con un código QR. En tu teléfono: **WhatsApp → ⋮ / Configuración → Dispositivos vinculados → Vincular un dispositivo**, y escaneá el código.
4. ¡Listo! La sesión queda guardada. Para cambiar entre MSN e ICQ: **Herramientas → Skin** (en ICQ: **Main → Change Skin**).

¿No querés instalar nada? Bajate la [versión portable](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-Portable.exe): la abrís y listo.

Requisitos: Windows 10 u 11 (64 bits) y WhatsApp en tu teléfono. Para desinstalar: **Configuración de Windows → Aplicaciones → Retro Messenger para WhatsApp → Desinstalar**.

### Mac

#### ⬇️ Descargar para [Mac con Apple Silicon (M1, M2, M3…)](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-mac-arm64.dmg) · [Mac con Intel](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-mac-x64.dmg)

¿No sabés cuál tenés? **Menú Apple → Acerca de esta Mac**: si dice "Chip Apple", es Apple Silicon.

1. Abrí el `.dmg` y arrastrá **Retro Messenger para WhatsApp** a **Aplicaciones**.
2. La primera vez, macOS la bloquea porque no está firmada por Apple (la firma cuesta USD 99 por año). Abrí **Aplicaciones**, hacé **clic derecho → Abrir** y confirmá con **Abrir**. Si dice que la app "está dañada", abrí la Terminal y pegá:
   ```bash
   xattr -cr "/Applications/Retro Messenger para WhatsApp.app"
   ```
3. Escaneá el QR igual que en Windows (paso 3 de arriba).

Requisitos: macOS 12 o más nuevo.

### Linux

Elegí el formato según tu distribución:

- ⬇️ [**.deb**](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-linux-amd64.deb) — Ubuntu, Debian, Mint, Pop!_OS. Instalalo con doble clic o desde la terminal, en la carpeta de descargas:
  ```bash
  sudo apt install ./Retro-Messenger-linux-amd64.deb
  ```
- ⬇️ [**.rpm**](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-linux-x86_64.rpm) — Fedora, openSUSE:
  ```bash
  sudo dnf install ./Retro-Messenger-linux-x86_64.rpm
  ```
- ⬇️ [**AppImage**](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp/releases/latest/download/Retro-Messenger-linux-x86_64.AppImage) — cualquier distro, sin instalar nada:
  ```bash
  chmod +x Retro-Messenger-linux-x86_64.AppImage
  ./Retro-Messenger-linux-x86_64.AppImage
  ```
  Si no arranca, falta `libfuse2` (Ubuntu 22.04: `sudo apt install libfuse2`; en 24.04: `sudo apt install libfuse2t64`). Si en Ubuntu 24.04 se cierra con un error de "sandbox", abrila con `./Retro-Messenger-linux-x86_64.AppImage --no-sandbox` o usá el .deb, que no tiene ese problema.

Con .deb o .rpm aparece como **Retro Messenger para WhatsApp** en el menú de aplicaciones. Después escaneá el QR igual que en Windows (paso 3). Requisitos: Linux de 64 bits (x86_64).

La bandeja del sistema necesita soporte de AppIndicator (en GNOME, la extensión "AppIndicator and KStatusNotifierItem Support").

## Qué tiene

| | MSN Messenger 7.5 | ICQ 2000b |
|---|---|---|
| Ventana | Marco azul de Windows XP, menú Archivo / Contactos / Acciones / Herramientas / Ayuda | Gris Windows 98 con relieve, controles **Main** y **Services**, ICQuick lateral y pie con estado |
| Vos | Perfil sobre la lista: foto, nick editable, `(Conectado) ▾`, `<Escribe un mensaje personal>` | **ICQ#** y nick editables, estado con florcita (Online, Away, N/A, Occupied, DND, Free For Chat, Invisible) |
| Lista de chats | "Contactos", íconos neutros cuando no conocemos presencia, contador naranja | "My Contact List", flores grises con presencia desconocida, nota amarilla para mensajes pendientes |
| Conversación | Sin globos, **"Juan dice:"**, fotos a la derecha, barra Fuente / Emoticonos / **Zumbido** / Enviar, "Juan está escribiendo un mensaje..." | **"Juan (19:05):"** en rojo y lo tuyo en azul, cabecera **Message Session** y botón **Send**; zumbido disponible como extra desde menú o Ctrl+G |
| Sonidos | Los originales: mensaje nuevo, contacto en línea y zumbido | Los originales: "Uh-oh!", contacto en línea y alerta |
| Extras | Banner de publicidad ficticia limitado al pie de contactos, cartelito "X dice:" abajo a la derecha | Cartelito gris Win98 |

Además: skin **WhatsApp original** (con un botoncito de zumbido flotante), ícono en la bandeja y parpadeo en la barra de tareas (en Mac, rebota el ícono del Dock).

### El zumbido

El botón **Zumbido** (o **Ctrl+G**) manda el texto `*ZUMBIDO*`, que WhatsApp muestra en negrita, y te sacude la ventana con sonido. Si te llega un **ZUMBIDO** en negrita, tu ventana también tiembla y se muestra como en MSN: "Juan te ha enviado un zumbido.". Como en MSN, no se puede mandar más de uno cada 10 segundos. Del otro lado, quien use WhatsApp normal ve simplemente **ZUMBIDO**.

### Tus propios sonidos

**Herramientas → Carpeta de sonidos…** (en ICQ: **Main → Preferences → Sounds folder…**) abre la carpeta de sonidos:

- Windows: `%APPDATA%\retro-messenger-whatsapp\sounds`
- Mac: `~/Library/Application Support/retro-messenger-whatsapp/sounds`
- Linux: `~/.config/retro-messenger-whatsapp/sounds`

Si ponés ahí `msn/message.wav`, `msn/nudge.wav`, `msn/online.wav`, `icq/message.wav`, etc., se usan en lugar de los originales que trae la app. También sirven `.mp3` y `.ogg`. Si falta alguno, suena una imitación sintetizada.

## Bueno saber

El nick, el mensaje personal, el estado y el ICQ# son decorativos: se guardan en tu computadora y **no cambian nada en WhatsApp**.

## Desarrollo

```bash
npm install
npm run dev        # app en modo desarrollo
npm run preview:retro  # revisión visual local con datos ficticios, puerto 4173
npm run typecheck
npm run dist:win   # instalador y portable en dist/ (también: npm run dist)
npm run dist:mac   # .dmg y .zip (solo desde una Mac)
npm run dist:linux # AppImage, .deb y .rpm (desde Linux; .rpm necesita rpmbuild)
npm run icon       # regenera build/icon.png a 1024 px
npm run web:assets # capturas e imagen para compartir de la página web/ (ver PUBLICAR.md)
```

Para publicar una versión: `git tag v0.2.0 && git push origin v0.2.0` y GitHub Actions arma los paquetes de Windows, Mac y Linux. También se puede correr a mano desde **Actions → Release → Run workflow** para bajar los archivos sin publicar.

### Cómo está hecho

- `src/main` — ventana sin marco de Electron + un `WebContentsView` que carga web.whatsapp.com (con User-Agent de Chrome y sesión persistente), sacudida, bandeja y avisos.
- `src/renderer` — el marco de cada skin (barra de título y menús) y los sonidos (originales en `resources/sounds`, imitaciones sintetizadas con WebAudio como respaldo).
- `src/preload/whatsapp.ts` — corre dentro de WhatsApp: marca nodos con `data-wm-*`, dibuja perfil y pie sobre la lista, cabecera y herramientas sobre la conversación; detecta zumbidos y mensajes nuevos.
- `src/wa/selectors.ts` — **todas** las referencias al HTML de WhatsApp (ids, roles, `data-testid`). WhatsApp cambia seguido: si algo deja de verse bien, se arregla ahí.
- `src/wa/css` — las skins aplicadas sobre WhatsApp.

La vista de prueba usa las plantillas, estilos y preload reales sobre un DOM sintético. No se conecta a WhatsApp ni prueba la compatibilidad con su DOM actual. Ver [registro de la primera etapa](docs/ETAPA_1_FIDELIDAD.md) y [plan completo](docs/PLAN_FIDELIDAD_RETRO.md).

## Licencia

MIT
