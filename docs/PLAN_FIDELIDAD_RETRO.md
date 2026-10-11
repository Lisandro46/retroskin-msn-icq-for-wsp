# Auditoría y plan de fidelidad visual — Retro Messenger para WhatsApp

Fecha: 11/10/2026. Estado: plan original; primera etapa implementada parcialmente. Ver [registro de cambios y validación](ETAPA_1_FIDELIDAD.md).

## Alcance y evidencia de la auditoría inicial

Se revisaron el proyecto local, su estructura, los estilos de ambas skins, el renderer, el preload de WhatsApp, los íconos, la persistencia, los avisos y el proceso principal de Electron. El repositorio remoto consultado corresponde a main, commit 54ca721f587025a2477481e05c48186c26c6e27e; no se verificó que cada archivo local sea idéntico a ese commit.

La terminal no pudo iniciar por un error del entorno. Se leyeron los archivos mediante la herramienta de JavaScript. La aplicación no estaba abierta y la herramienta no consiguió abrir la compilación existente: devolvió “Computer Use app approval timed out”. No se verificó la apariencia del programa en vivo, ni se ejecutaron build o typecheck. No se enviaron mensajes.

Se inspeccionaron visualmente capturas históricas de MSN y una página de época que identifica explícitamente su captura como ICQ 2000b. Las capturas de terceros pueden tener personalizaciones y no bastan para certificar una build específica. Los hallazgos del código están confirmados; las mediciones exactas y la compatibilidad con el DOM actual de WhatsApp siguen pendientes.

## Decisión recomendada

Conservar Electron y WhatsApp Web como motor. Mejorar primero la composición y la densidad, después los recursos gráficos y los estados de interacción. La referencia debe ser una versión concreta, con idioma y tema del sistema definidos. Mantener cada detalle reconocible, ubicado donde corresponde; sumar decoración por nostalgia puede alejar la skin del original.

Objetivo provisional: MSN Messenger 7.5 con Windows XP Luna azul, español; ICQ 2000b con controles Windows clásicos, inglés. La build exacta de ICQ y los recursos de ambas versiones se congelarán antes de cerrar medidas. No mezclar ICQ 2001b/2003b/6 ni Windows Live Messenger con estas referencias.

La arquitectura actual es una BrowserWindow sin marco, un renderer propio para el marco y un único WebContentsView para WhatsApp. No hay un servidor propio que sea necesario rediseñar para este trabajo.

## Lo que conviene conservar

- Marcos XP y Windows clásico separados por skin.
- Mensajes sin globos y encabezados del remitente.
- Fotografías a la derecha en MSN.
- Nick y mensaje personal locales.
- Estados, ícono de bandeja, avisos y soporte para sonidos personales.
- Zumbido de MSN, con cooldown y cuidado del borrador.
- Acceso a WhatsApp original y sesión persistente.
- Los selectores centralizados como intención de diseño; hoy hay referencias al DOM también dentro de los CSS.

## Registro de modificaciones

Prioridades: P0 = referencia o estabilidad necesaria; P1 = fidelidad central; P2 = pulido.
Esfuerzo relativo: S = acotado; M = varias piezas; L = cambio estructural o dependiente del DOM.
Cada entrada conserva la propuesta original. El estado implementado y las limitaciones están en el registro de la primera etapa.

### 01. Congelar las referencias de cada skin — P0 / S

Actual: el nombre de versión aparece en README, pero no existe una especificación visual ni capturas versionadas dentro del proyecto.
Propuesta: una ficha por skin con versión/build, idioma, sistema operativo, personalizaciones y capturas de lista, conversación, menú, opciones y aviso. Etiquetar cualquier adaptación a WhatsApp.
Archivos: nueva documentación de referencia y carpeta de capturas.
Aceptación: cada elemento tiene una referencia identificable o está señalado como adaptación. No inventar dimensiones a partir de recuerdos.

### 02. Registrar la apariencia real antes de tocar CSS — P0 / S

Actual: la auditoría en vivo está pendiente.
Propuesta: capturas con la app actual en login, lista, conversación individual, grupo, menú y opciones, anotando tamaño, escala de Windows y zoom. Usar datos de prueba.
Archivos: documentación y capturas.
Aceptación: comparación antes/después reproducible. No asignar un porcentaje de fidelidad sin medir.

### 03. Separar la identidad de la lista y la conversación — P1 / L

Actual: src/main/index.ts:347 fija un tamaño inicial de 1040×760 y un mínimo de 720; skins.ts monta perfil, lista/chat y publicidad dentro de un marco común.
Propuesta inicial: dos composiciones reconocibles dentro de la ventana actual, con límites visuales propios. El perfil y las pestañas pertenecen a la lista; la conversación tiene título y herramientas propios.
Archivos: src/renderer/skins.ts, estilos de renderer, src/wa/css y gestión de layout.
Aceptación: cada zona reproduce la jerarquía de su ventana original; sin cabecera de perfil o banner global atravesando el chat.
Dependencia: 01 y 02. La separación en ventanas nativas se decide en 04.

### 04. Probar contactos y conversación en ventanas separadas — P1 / L, prueba previa

Actual: un único WebContentsView muestra todo WhatsApp.
Propuesta: prueba limitada con una ventana de contactos propia y una sola conversación activa usando el motor existente. Comparar ese prototipo con la composición integrada. No prometer varias conversaciones simultáneas.
Límite: un WebContents puede presentarse en un único WebContentsView a la vez; duplicar la sesión no convierte automáticamente los chats en ventanas independientes. [Documentación de Electron](https://www.electronjs.org/docs/latest/api/web-contents-view).
Archivos: src/main/index.ts, preload, contratos compartidos y layout.
Aceptación: abrir/cerrar/cambiar chat sin perder borrador, foco, sesión ni controles de adjuntos. Si esto necesita rehacer el cliente de mensajes, mantener la composición integrada para esta iteración.
Tiempo inicial: prueba de viabilidad de 2–4 horas, estimación sujeta al DOM y al acceso a la app.

### 05. Ajustar densidad sin depender del zoom global — P1 / M–L

Actual: zoom 0.9 en MSN y 0.86 en ICQ (src/main/index.ts:65); los CSS cambian íconos pero no reconstruyen consistentemente la altura de las filas.
Propuesta: métricas por skin para texto, ícono, fila, espaciado y panel. Arrancar con íconos de 16 px como hipótesis y cerrar medidas contra las referencias. Ofrecer escala cómoda adicional.
Límite: WhatsApp virtualiza la lista. Cambiar la altura de una fila con CSS puede desajustar posiciones y scroll; verificarlo antes de usar filas compactas. Si falla, evaluar lista propia de chats visibles, sin asumir acceso a todos los contactos.
Archivos: src/wa/css, src/main/index.ts y, si hace falta, adaptador de lista.
Aceptación: scroll largo sin solapamientos, huecos ni clics sobre otra fila; prueba a 100%, 125% y 150% de escala Windows.

### 06. Unificar tipografía y rasterización — P1 / M

Actual: marco a 11 px; encabezados internos a 13–15 px; cambio de familia amplio dentro de #app.
Propuesta: tamaños y pesos por función: título, menú, fila, estado y mensaje. Tahoma para MSN y una aproximación verificada a MS Sans Serif para ICQ, con fallback explícito.
Límite: Chromium y Windows modernos no garantizan rasterización idéntica a GDI/bitmap. No aplicar pixelado global al texto.
Archivos: estilos de renderer y src/wa/css.
Aceptación: proporciones y saltos de línea coherentes en ambas superficies; legible en HiDPI.

### 07. Rehacer íconos a sus tamaños de uso — P1 / M

Actual: SVG de imitación en src/shared/icons.ts; muchos se escalan desde 32 px; MSN usa muñequitos de 30 px y ICQ flores de 26 px en la lista. La flor actual se construye con siete pétalos.
Propuesta: catálogo por versión y estado, con variantes ópticas de 16/24/32 px; corregir siluetas, pétalos, contorno, brillos y distintivos cotejando los recursos de referencia. Revisar también el ícono de zumbido y la imagen por defecto.
Archivos: src/shared/icons.ts y estilos que los consumen.
Aceptación: comparativa ampliada y a tamaño real; cada estado se reconoce sin necesitar un ícono enorme.
Criterio de recursos: mantener la política actual de imitaciones propias; recursos originales solo si se confirma permiso de distribución.

### 08. Refinar los marcos XP y clásicos — P2 / M

Actual: degradados y glifos CSS aproximados; hay hover en XP y pressed en ICQ, pero no estados completos del marco.
Propuesta: igualar geometría de título, bordes, esquinas y botones; agregar activo/inactivo, pressed, restaurado/maximizado y foco. Radios de MSN solo donde estén en la referencia.
Archivos: src/renderer/styles/shell.css, msn.css, icq.css, eventos de foco del main.
Aceptación: marco consistente al cambiar foco y maximizar, sin contornos recortados ni pérdida de resize.

### 09. Reorganizar el perfil de MSN — P1 / M

Actual: foto y nick en una franja que ocupa el ancho de la aplicación; correo “✉ (0)” fijo.
Propuesta: perfil limitado a la composición de contactos. Rehacer ubicación de foto, estado, mensaje personal y accesos de correo/espacio según la referencia. Reemplazar el carácter de sobre por un recurso gráfico consistente.
Archivos: src/renderer/skins.ts:53, renderer/msn.css.
Aceptación: se reconoce la cabecera de MSN incluso sin el chat. Un contador fijo no debe parecer correo realmente consultado.

### 10. Eliminar duplicaciones de navegación en MSN — P1 / M

Actual: pestañas externas decorativas, barra de búsqueda externa y navegación/búsqueda internas de WhatsApp. La búsqueda externa contiene además un zumbido.
Propuesta: una sola navegación y búsqueda visible; llevar el zumbido a la conversación. Dar a cada pestaña una acción compatible o un estado deshabilitado.
Archivos: src/renderer/skins.ts:47 y 65, src/preload/whatsapp.ts, CSS MSN.
Aceptación: buscar funciona desde el control visible; no hay dos tiras compitiendo ni botones que simulan una función inexistente.

### 11. Completar la cabecera de conversación de MSN — P1 / M

Actual: se añade “Para:” al encabezado de WhatsApp, sin la barra histórica completa.
Propuesta: reconstruir fila de herramientas, separadores, área de destinatario y marca gráfica usando la referencia. Mapear adjuntos y acciones disponibles a controles reales; verificar capacidades antes de ofrecer voz/video. Juegos y guiños sin equivalente quedan deshabilitados con explicación breve.
Archivos: src/preload/whatsapp.ts y src/wa/css/msn.css.
Aceptación: posición y estados se corresponden con la referencia; ninguna acción anuncia una capacidad no comprobada.

### 12. Reorganizar editor, fotos y estado de MSN — P1 / M

Actual: barra overlay sobre el footer y fotos fijas de 100 px.
Propuesta: editor rectangular con altura útil, barra de formato en su lugar, Enviar junto al área de escritura, dos retratos con marcos y desplegables verificados, y estado en el pie correspondiente. Ajustar relaciones de tamaño, no solo los colores.
Archivos: preload, src/wa/css/base.css y msn.css.
Aceptación: texto multilínea, paneles laterales y resize no tapan fotos, botones ni historial.

### 13. Hacer que Fuente cambie la presentación local — P2 / M

Actual: el botón Fuente solo muestra un aviso (preload:87).
Propuesta: diálogo retro para familia, tamaño y color de visualización local, persistido por skin. Aclarar el alcance en opciones; no insertar formatos inexistentes en el mensaje enviado.
Archivos: preload, renderer, shared/types.ts, main/store.ts y CSS MSN.
Aceptación: el control produce un cambio local visible y reversible; copiar/enviar conserva el contenido real.

### 14. Ajustar el banner y su ubicación — P2 / S–M

Actual: banner amarillo/naranja de 468×66 máximo, textos inventados y animaciones de bounce/blink.
Propuesta: medir y ubicar el banner solo donde la referencia lo tenga. Recrear una pieza gráfica de época con composición y ritmo adecuados; mantenerlo opcional. Si se cambia su aspecto o proporción, hacerlo contra referencia.
Archivos: skins.ts:25 y 75, renderer/msn.css:229.
Aceptación: no atraviesa ni reduce innecesariamente la conversación. Conservar el detalle publicitario sin convertirlo en el foco de toda la app.

### 15. Reconstruir la lista principal de ICQ — P1 / M–L

Actual: cabecera grande con flor, ICQ#, nick, Search/Zumbido; lista blanca, pestañas All/Online/Users/Groups y pie amarillo.
Propuesta: tomar como base la captura ICQ 2000b de SimPage: composición angosta gris, cabecera compacta, My Contact List, grupos con contadores, barra de herramientas derecha y pie de estado/System Notice. La captura incluye ActiveList: no copiarla como equivalente automático de grupos de WhatsApp.
Evidencia: [tutorial de época y captura identificada como ICQ 2000b](https://simpage.net/interact/activelist.shtml#join).
Archivos: skins.ts:91–115, renderer/icq.css, src/wa/css/icq.css.
Aceptación: layout rastreable a esa referencia o a otra build elegida. Revisar los botones amarillos; no afirmar que todas las variantes de ICQ 2000b eran iguales.

### 16. Dar sentido a grupos, pestañas y contadores — P1 / M–L

Actual: las pestañas de ICQ son spans y no filtran. Ambas listas muestran un grupo Online/Conectado fijo.
Propuesta: agrupaciones locales verificables: chats, grupos, favoritos y no leídos, representadas como un árbol retro si el adaptador permite una lista propia. Contar únicamente datos conocidos. Distinguir grupos organizativos de conversaciones grupales.
Archivos: skins.ts:102, preload, adaptador de lista, shared/types.ts.
Aceptación: selección, plegado y contador coinciden; no reordenar arbitrariamente nodos gestionados por React.

### 17. Corregir presencia visual y estados decorativos — P0 / M

Actual: todos los avatares de lista usan un ícono online; el encabezado dice Online/Conectado; wasOnline depende del subtítulo del chat abierto.
Propuesta: estado desconocido por defecto para contactos sin dato; presencia real solo donde el DOM la exponga. Si se conserva simulación histórica, que sea una preferencia explícita. Nick, UIN y estado propio siguen locales.
Archivos: preload:144 y 247, CSS de ambas skins, configuración.
Aceptación: no presentar todos los chats como conectados ni interpretar reapertura de un chat como una conexión real.

### 18. Separar el zumbido de ICQ de la reconstrucción histórica — P1 / S

Actual: Zumbido aparece en cabecera, barra y menú de ICQ como función central.
Propuesta: tratarlo como extra de Retro Messenger; por defecto ocultarlo de la composición histórica de ICQ y conservar acceso en opciones o menú de extras. Verificar cualquier sonido o interacción que se quiera presentar como propia de la versión.
Archivos: skins.ts:98, preload, main/index.ts menús.
Aceptación: ICQ se reconoce por su lenguaje propio; MSN conserva su zumbido como característica central.

### 19. Revisar notificación de mensaje e ícono de bandeja ICQ — P1 / M

Actual: una nota amarilla reemplaza la flor y cambia su opacidad; el main reusa el ícono de skin.
Propuesta: reproducir el recurso, alternancia y estados de mensaje pendiente que confirme la build. Coordinar fila y bandeja sin parpadeo genérico.
Archivos: shared/icons.ts, src/wa/css/icq.css:200, preload, renderer/main.ts y main/index.ts.
Aceptación: un mensaje pendiente se distingue, se limpia al leer y no se activa por scroll o por reconstrucción del DOM.

### 20. Quitar animaciones continuas sin referencia — P2 / S

Actual: flor de la cabecera ICQ gira cada ocho segundos; MSN tiene anuncios animados y logos de conexión.
Propuesta: animación vinculada a conexión/carga o eventos documentados; estado estable cuando ya se conectó. Mantener animaciones históricas verificadas.
Archivos: renderer/icq.css:71, renderer/msn.css, CSS login.
Aceptación: no hay movimiento gratuito persistente en la interfaz inactiva.

### 21. Reconstruir la ventana de mensaje de ICQ — P1 / M

Actual: header de WhatsApp con prefijo Message Session y toolbar mínima.
Propuesta: ficha compacta del destinatario, historial y editor hundidos, divisores, herramientas y Send según captura de la build. No rellenar ICQ# o email del destinatario con datos inventados.
Archivos: preload y src/wa/css/icq.css.
Aceptación: geometría validada para conversación individual y grupal; datos no disponibles se omiten o se muestran como desconocidos.
Pendiente: conseguir y fijar una referencia exacta de la ventana de mensajes; la lista de SimPage no prueba todos sus detalles.

### 22. Preservar información y tipos de mensaje — P0 / M–L

Actual: ICQ oculta todo msg-meta; ambas skins aplanan contenedores de mensajes mediante reglas amplias.
Propuesta: conservar hora, entrega/lectura y acciones en una presentación retro discreta. Excluir del aplanado indiscriminado citas, audio, fotos, videos, documentos, stickers, reacciones, encuestas y mensajes de sistema.
Archivos: src/wa/css y marcadores de preload.
Aceptación: cada tipo mantiene contenido, controles y estado; revisar incluso con texto vacío o sin data-pre-plain-text.

### 23. Fortalecer detección de remitente, grupos y eventos — P0 / M

Actual: dirección inferida por tail/previousDir y fallback; grupo inferido por presencia de author; chat y unreadByChat identificados por nombre; detectores de frescura limitados.
Propuesta: identidad estable cuando esté expuesta, marcador explícito de tipo, separación entre historial y evento entrante y deduplicación por mensaje. Tratar como desconocidos los datos que no se puedan derivar.
Archivos: preload:166–218, 279–310 y selectors.ts.
Aceptación: dos chats con el mismo nombre, historial virtualizado, un grupo sin autor visible y medios sin texto no generan nombres falsos ni avisos repetidos.

### 24. Centralizar hooks y detectar pérdida de compatibilidad — P0 / M

Actual: selectors.ts centraliza parte de los hooks, pero muchos data-testid están directamente en CSS; el avatar depende de firstElementChild.firstElementChild.
Propuesta: el adaptador identifica nodos y capacidades; los CSS dependen mayormente de data-wm-*. Añadir diagnóstico local de hooks ausentes y fallback parcial a WhatsApp original para la zona afectada.
Archivos: selectors.ts, preload:292, CSS.
Aceptación: si WhatsApp cambia una estructura, la app sigue usable y no oculta un control vital.

### 25. Estabilizar overlays, foco y cambios de tamaño — P0 / M

Actual: toolbar, estado y fotos usan posiciones fijas; MutationObserver de childList más intervalo de 700 ms; no ResizeObserver local de las zonas del chat.
Propuesta: observar tamaños de main/header/footer, limitar trabajo a las zonas que cambian y controlar box-sizing del overlay. Validar cambios de pestaña, paneles, zoom y escala. No reemplazar el polling sin medir qué actualizaciones cubre.
Archivos: preload:100–131 y 413–437, CSS base.
Aceptación: menús de emoji, adjuntos, teclado, foco y composición multilínea funcionan sin elementos tapados ni saltos.

### 26. Rehacer menús desplegables con la skin — P1 / M–L

Actual: Menu.buildFromTemplate(...).popup en main:312; su apariencia sigue Electron/Chromium en Windows. [Documentación de Menu](https://www.electronjs.org/docs/latest/api/menu).
Propuesta: menús propios con separadores, checks, íconos, shortcuts y hover del tema. Mantener menús nativos de bandeja si resulta conveniente.
Límite: el renderer del marco no puede poner HTML por encima del WebContentsView simplemente aumentando z-index. Inyectar el menú dentro de la superficie adecuada o usar una superficie/ventana dedicada; verificar foco y coordenadas.
Archivos: main/index.ts, renderer, preload/shell.ts, tipos compartidos.
Aceptación: mouse, Alt, flechas, Enter y Escape; el menú queda encima del contenido y ejecuta exactamente la acción elegida.

### 27. Rediseñar opciones y diálogos según programa — P2 / M

Actual: formulario genérico, sombra suave y velo oscuro; opciones MSN también incluyen ICQ#.
Propuesta: opciones de cada skin con distribución de época, groupboxes, pestañas y Aceptar/Cancelar/Aplicar donde corresponda. ICQ# solo en ICQ. Diálogo propio en lugar de ocultar toda la vista WhatsApp y dejar el fondo vacío.
Archivos: skins.ts:136, renderer/main.ts openDialog, shell.css:149, estilos por skin, main.
Aceptación: abrir/cerrar no pierde borrador; foco vuelve al control correcto; cambios cancelados no se guardan.

### 28. Afinar avisos y su interacción — P2 / M

Actual: ambos avisos miden 200×120 y se ubican siempre en el monitor principal; × y Opciones son decoración; clic solo enfoca la app.
Propuesta: composición por skin, iconografía y geometría verificadas, cierre real y monitor coherente con la app. Abrir el chat exacto únicamente si hay identificación fiable; en caso contrario, enfocar la app.
Archivos: src/main/toast.ts, src/renderer/toast.ts, toast.css y contratos.
Aceptación: avisos simultáneos, multimonitor, HiDPI y cierre funcionan sin recortes ni clics ambiguos.

### 29. Completar scrollbars y detalles de interacción — P2 / M

Actual: se estilizan track/thumb, pero no hay reconstrucción completa de flechas, esquinas y estados.
Propuesta: recursos y estilos por skin; foco punteado, tooltips, pulsación y disabled históricos. Comprobar qué partes del scrollbar expone Chromium; no sustituir el scroll nativo sin necesidad.
Archivos: estilos de renderer y WhatsApp.
Aceptación: scroll por rueda, arrastre y teclado; coherencia visual en lista, chat y paneles secundarios.

### 30. Documentar adaptaciones y validar la entrega — P0/P2 / M

Actual: README explica que estados y sonidos son imitaciones, pero no existe matriz de fidelidad/regresión.
Propuesta: registrar por elemento “replicado”, “adaptado a WhatsApp”, “decorativo”, “no disponible”; capturas de resultado y checklist funcional. Login QR debe usar el lenguaje retro pero explicar que vincula WhatsApp; corregir texto “ICQ Network”.
Archivos: README, documentación, CSS login, preload.
Aceptación: lo que la app muestra coincide con sus capacidades y con las excepciones documentadas.

## Arquitectura mínima propuesta

1. Proceso Electron: ventanas, sesión, layout y persistencia.
2. Adaptador WhatsApp: identifica nodos, chats visibles, capacidades y eventos fiables.
3. Presentación por skin: tokens de métricas, recursos propios, componentes del marco, menús y overlays.
4. Validación: datos sintéticos para escenarios visuales y revisión real con sesión de prueba.

Mantener el compositor, adjuntos y mensajes originales de WhatsApp. No crear ahora un backend cloud, una base de mensajes propia ni un cliente completo que obligue a replicar búsqueda, multimedia y sincronización.

## Orden de ejecución

**Etapa A — referencia y diagnóstico:** 01, 02; definir excepciones 17, 18 y 30. Resultado: captura objetivo por skin y listado de adaptaciones.

**Etapa B — primera mejora visible:** 03, 05, 06, 07, 09, 10, 15, 20. Resultado: composición y densidad reconocibles, sin pérdida funcional. Si las filas virtualizadas no toleran densidad propia, resolver ese punto antes de extender CSS.

**Etapa C — estabilidad y conversación:** 22–25 antes de profundizar 11, 12, 16, 19 y 21. Resultado: mensajes y controles fiables en estados difíciles.

**Etapa D — interacción y pulido:** 08, 13, 14, 26–29. Resultado: menús, diálogos y avisos con identidad histórica.

**Prueba estructural separada:** 04. Avanzar a ventanas independientes solo después de cumplir su criterio de viabilidad.

Estimación de trabajo, no compromiso: referencia/capturas 0,5–1 día; primera mejora visual de ambas skins 2–4 días; conversación/compatibilidad 2–4 días; menús/diálogos/avisos 1–3 días. La suma puede aumentar si hacen falta lista propia o ventanas independientes. No estimar clonación completa antes de la prueba 04.

## Validación requerida al implementar

- npm run typecheck y npm run build.
- Comparativa a escala equivalente: lista, conversación, menús, estados de foco y avisos.
- Ventana mínima, restaurada y maximizada; Windows 100/125/150%; dos monitores.
- Chat individual, grupos y nombres duplicados.
- Historial largo y scroll de lista virtualizada.
- Texto multilínea, citas, medios, documentos, audio, stickers, reacciones y estados de entrega.
- Cambio MSN/ICQ/original sin borrador perdido ni nodos ocultos que permanezcan.
- Login QR, sesión caducada, recarga y carga incompleta.
- Zumbido: cooldown, borrador protegido y evento entrante sin duplicación; usar fixtures o sesión de prueba autorizada.
- No considerar una captura estática prueba del funcionamiento real de WhatsApp.

## Fuentes de referencia

- [Repositorio y objetivo declarado](https://github.com/Lisandro46/retroskin-msn-icq-for-wsp).
- [Galería MSN Messenger 7.5 inspeccionada](https://msn-messenger-7-5.en.lo4d.com/screenshots): referencias visuales auxiliares; contiene interfaces personalizadas y posibles variantes, no usar como única certificación de build.
- [Guía de Logitech con capturas y diálogo de versión MSN 7.5](https://www.ophoenix.org/documents/GettingStartedWithVideoConversation.pdf): fuente primaria de uso y capturas.
- [SimPage, captura identificada como ICQ 2000b](https://simpage.net/interact/activelist.shtml#join): fuente de época utilizada para la composición principal; no certifica la build ni todos los diálogos.
- [WebContentsView de Electron](https://www.electronjs.org/docs/latest/api/web-contents-view): restricción de presentación de WebContents.
- [Menu de Electron](https://www.electronjs.org/docs/latest/api/menu): apariencia de menús según plataforma.

Veredicto: **HACER** la mejora visual sobre la arquitectura actual; **PROBAR CHICO** la separación real en ventanas. La prioridad es reproducir jerarquía, densidad y comportamiento antes de sumar nuevas skins o funciones.
