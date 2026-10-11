# Publicar retro.trincherai.com

La página de descarga vive en la carpeta [`web/`](web/) de este repo. Es HTML estático: no hay que compilar nada. Se publica como un sitio aparte en Netlify, así no se mezcla con trincherai.com.

## 1. Subir la página a Netlify (una sola vez)

1. Entrá a [app.netlify.com](https://app.netlify.com) con tu cuenta.
2. **Add new project → Deploy manually**.
3. Arrastrá la carpeta **`web`** (la carpeta entera, no los archivos sueltos) a la zona que dice *Drag and drop your project folder here*.
4. Cuando termine, andá a **Project configuration → General → Project details → Change project name** y ponele **`retro-trincherai`**. La página queda en `https://retro-trincherai.netlify.app`: abrila y fijate que ande.

## 2. Conectar retro.trincherai.com

**En Netlify:**

1. En el proyecto `retro-trincherai`: **Domain management → Add a domain**.
2. Escribí `retro.trincherai.com` y confirmá. Netlify va a decir que falta configurar el DNS: es normal.

**En Namecheap** (ahí está el DNS de trincherai.com):

1. **Domain List → trincherai.com → Manage → Advanced DNS**.
2. **Add new record**:

   | Type | Host | Value | TTL |
   |---|---|---|---|
   | CNAME Record | `retro` | `retro-trincherai.netlify.app` | Automatic |

3. Guardá con el tilde verde. **No toques los registros que ya existen** (los de `@` y `www` son los de trincherai.com).

**De vuelta en Netlify:**

1. En **Domain management**, al lado de `retro.trincherai.com` tocá **Verify DNS configuration**. Puede tardar entre unos minutos y un par de horas en propagarse.
2. En **HTTPS**, Netlify genera el certificado solo. Si no aparece en un rato, tocá **Verify DNS configuration** de nuevo y después **Provision certificate**.

Listo: `https://retro.trincherai.com`.

## 3. Actualizar la página

- **Cuando sacás una versión nueva de la app no hace falta tocar nada.** Los botones apuntan siempre a la última versión de GitHub, y la página muestra el número de versión sola.
- Si cambiás textos o capturas: en Netlify, proyecto `retro-trincherai` → **Deploys** → arrastrá de nuevo la carpeta `web`.
- Para regenerar las capturas y la imagen para compartir: `npm run web:assets`.

## Links cortos para compartir

Funcionan cuando el dominio ya está andando:

| Link | Baja |
|---|---|
| `retro.trincherai.com/windows` | Instalador de Windows |
| `retro.trincherai.com/portable` | Versión portable de Windows |
| `retro.trincherai.com/mac` | Mac con Apple Silicon |
| `retro.trincherai.com/mac-intel` | Mac con Intel |
| `retro.trincherai.com/linux` | .deb (Ubuntu, Debian, Mint) |
| `retro.trincherai.com/linux-rpm` | .rpm (Fedora) |
| `retro.trincherai.com/appimage` | AppImage |
| `retro.trincherai.com/github` | El código |

## 4. Sumarlo a trincherai.com (con ChatGPT)

Pegale esto a ChatGPT junto con tu `index.html` de `web-netlify`:

---

> En mi `index.html` hay una sección de casos/proyectos donde cada uno es un bloque `<div class="caso fade-in">` con `caso-head` / `caso-title`, varios `caso-block` (con `<h4>` "Por qué lo hice", "Stack" con `<span class="chip">`, "Decisiones" con una `<ul>`), un `<div class="nota">` y un `<a class="caso-link">`. Agregá un caso nuevo con **exactamente la misma estructura y clases**, sin cambiar nada más de la página. Todos los elementos con `data-i18n` existentes tienen números; a los nuevos asignales números que **no existan todavía** en el archivo (y si hay un diccionario de traducciones, sumá las entradas en inglés). Contenido:
>
> **Título:** Retro Messenger — WhatsApp con la cara de MSN e ICQ
> **Bajada:** App de escritorio gratuita y de código abierto para Windows, Mac y Linux.
>
> **Por qué lo hice:** Por nostalgia y como ejercicio de ingeniería. Quería volver a usar el zumbido, el «Uh-oh!» de ICQ y el «Juan dice:» de MSN, pero sobre mi WhatsApp de todos los días, sin romper nada ni tocar mis datos. Lo armé en un fin de semana trabajando con asistentes de IA.
>
> **Stack:** Electron · TypeScript · CSS · WebAudio · GitHub Actions · Claude · Codex
>
> **Decisiones:**
> - **WhatsApp Web oficial, sin intermediarios.** La app carga web.whatsapp.com tal cual y le pone una piel encima con CSS. No hay servidores propios ni cuentas nuevas.
> - **Nada sale de tu compu.** El nick, el estado y el ICQ# son decorativos y se guardan local. La app no lee ni manda mensajes por su cuenta: solo escribe ZUMBIDO cuando tocás el botón.
> - **Un solo lugar para lo frágil.** Todas las referencias al HTML de WhatsApp están en un archivo; cuando WhatsApp cambia su web, se arregla ahí.
> - **Tres sistemas desde un mismo código.** GitHub Actions arma el instalador de Windows, el .dmg de Mac y los paquetes de Linux en cada versión.
>
> **Nota:** No tiene firma digital paga, así que Windows y Mac muestran una advertencia la primera vez. Está explicado paso a paso en la página de descarga.
>
> **Link principal:** `<a href="https://retro.trincherai.com" class="caso-link">Descargar y probarlo →</a>`
> **Segundo link** (mismo estilo): `<a href="https://github.com/Lisandro46/retroskin-msn-icq-for-wsp" target="_blank" rel="noopener" class="caso-link">Ver el código en GitHub →</a>`

---

Después de que ChatGPT lo agregue, revisá la página en el navegador antes de subirla a Netlify como siempre.
