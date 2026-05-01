# TrendPulse — Lo que ya hay y lo que viene

Hola! Esta página explica, sin tecnicismos, **qué es TrendPulse**, qué partes ya están funcionando, y qué vamos a ir agregando. Está pensada para que la entienda alguien que nunca haya programado.

Al final hay una sección con **lo que tú vas a diseñar** y cómo usar Claude para mockear las pantallas.

---

## ¿Qué es TrendPulse?

Es una página web (en el dominio `trendpul.se`) donde la gente comparte y vota tendencias de moda — prendas y outfits — antes de que se vuelvan virales. La idea es **detectar** lo que se va a poner de moda dentro de unas semanas, mirando qué cosas suben rápido en cada ciudad del mundo.

Piénsalo como una mezcla entre Pinterest (porque hay imágenes de ropa y looks), Reddit (porque la gente vota lo que le gusta), y la bolsa de valores (porque queremos ver qué tendencias están "subiendo" como si fueran acciones).

**Audiencia:** chicas y chicos entre 13 y 25 años que les importa la moda, ven a famosas en TikTok e Instagram, y quieren ser los primeros en notar tendencias.

---

## Lo que ya funciona (lo que se llama "Phase 1" y "Phase 2 Stage A")

Si entras hoy a https://trendpul.se, esto es lo que ya hay:

### La página principal (home)

- Sale una cuadrícula de tarjetas donde irían las prendas y los outfits.
- Hoy todavía está **vacía** porque nadie ha subido nada — sale un mensaje que dice "No trending pieces in global yet" ("Aún no hay prendas en tendencia").
- Hay un botón para cambiar de ciudad (Tokio, Londres, Nueva York, París, Lagos, Copenhague, Seúl, Ciudad de México, Madrid, Bogotá, Santiago, São Paulo, Lisboa). Cuando alguien suba prendas, podrás ver las que están de moda en cada ciudad por separado.
- Arriba a la derecha hay un selector de idioma (7 idiomas: inglés, español, francés, portugués, danés, japonés, coreano).
- Abajo hay un banner para suscribirse al newsletter semanal.

### Iniciar sesión

- En `/login` hay un formulario con un solo campo: tu correo.
- Le das "Send magic link" y te llega un email con un link.
- Cuando le das clic al link del correo, **automáticamente quedas logueada** sin tener que crear contraseña.
- Si es la primera vez que pones tu correo, te crea una cuenta nueva. Si ya tenías cuenta, te logueas. **No hay diferencia entre "registrarse" y "iniciar sesión"** — es todo el mismo flujo.

### Tu cuenta

- En `/account` (después de loguearte) puedes:
  - Ver tu correo
  - Poner un **nombre que se muestre** (display name)
  - Elegir tu **ciudad principal**
  - **Cerrar sesión**
- El idioma se cambia desde el selector arriba a la derecha (no desde la página de cuenta).

### Páginas legales

- `/privacy` — política de privacidad (texto placeholder por ahora)
- `/terms` — términos de uso (texto placeholder por ahora)

### Lo que NO funciona todavía

- No puedes subir prendas ni outfits
- No puedes votar nada (porque no hay nada que votar)
- No hay foto de perfil
- No hay manera de ver "mis publicaciones"
- No hay aún botón de "Continuar con Google" (solo el magic link por correo)

---

## Lo que sigue — en orden de cuándo se va a hacer

### Fase 2 Stage B (esta semana o la próxima) — pequeñas mejoras

1. **Botón de "Continuar con Google"** en la pantalla de login. Para gente que no quiere esperar el correo del magic link.
2. **Detectar la ciudad automáticamente.** Hoy la app no sabe en qué ciudad estás, así que el feed sale "global" por defecto. Vamos a hacer que detecte tu país por la conexión de internet y elija la ciudad más cercana automáticamente. Si estás en Bogotá, te muestra Bogotá. Si estás en Tokio, te muestra Tokio.

### Fase 3 — Subir prendas y votar (lo más grande que viene)

Aquí TrendPulse empieza a tener sentido de verdad, porque la gente puede empezar a llenar el feed.

**Subir una prenda:**
- Una pantalla `/submit/piece` con un formulario para compartir una prenda que viste.
- Puedes subir una foto **o** pegar un link de Instagram/TikTok.
- Le pones título ("falda cargo gigante con bolsillos"), descripción, categoría (top, bottom, vestido, abrigo, zapatos, bolso, accesorio, joyería, sombrero), y la ciudad donde la viste.
- Opcionalmente puedes pegar un link para comprarla (afiliado).

**Subir un outfit:**
- Una pantalla `/submit/outfit` parecida, pero para todo el look completo.
- Puedes etiquetar prendas individuales que ya estén en TrendPulse para conectar el outfit con sus prendas.

**Votar:**
- Cada tarjeta de prenda y outfit tiene 👍 y 👎 (perdón por el emoji, va sin emoji en realidad).
- Puedes votar tanto si te gusta como si no.
- El número de votos sube y baja en tiempo real.
- Las cosas con muchos votos suben en el ranking de "trending". Las que llevan rato sin que nadie las vote bajan.

**Ver mis publicaciones:**
- Pantalla `/account/submissions` donde ves todo lo que tú has subido y en qué estado está (pendiente de aprobación, aprobada, rechazada).

**Antes de aparecer en el feed:**
- Cuando alguien sube una prenda, no aparece **inmediatamente** en el feed de todos. Primero queda **"pendiente"** y un moderador (al principio tú o yo) le da clic en aprobar o rechazar. Esto es para que no se llene de spam o cosas inapropiadas.

### Fase 4 — Moderación y empezar con contenido

**Panel de admin:**
- Una pantalla solo para admins en `/admin` donde se ven todas las prendas/outfits pendientes de aprobación.
- Puedes aprobar o rechazar varias a la vez.
- Si rechazas, puedes poner una razón.

**Seed inicial de 50 tendencias:**
- Vamos a llenar el feed con 50 tendencias reales de arranque (entre prendas y outfits) para que cuando llegue el primer usuario, no vea una página vacía.
- Tú puedes ayudar a elegir las 50 — fotos de TikTok, Instagram, magazines de moda — y ponerle título/descripción a cada una.

### Fase 5 — Premium y newsletter

**TrendPulse Premium ($5/mes o algo así):**
- Acceso a tendencias **48 horas antes** que el resto.
- Reportes detallados por ciudad ("qué subió esta semana en Tokio").
- Exportar todo a CSV para gente que hace análisis.
- Pantalla de "Únete a la lista de espera" antes de que esté listo (`/premium`).

**Newsletter semanal:**
- Cada lunes mandamos un correo con las 5 mejores tendencias de la semana.
- La gente se suscribe desde el banner del home.
- Lo manejamos con una herramienta llamada Beehiiv (no tienes que entender cómo funciona).

### Fase 6 — Detalles de cuenta más completos

- **Foto de perfil:** subir una imagen, recortarla.
- **Cambiar tu @ (handle):** elegir un usuario único tipo `@oct`.
- **Eliminar cuenta:** botón rojo de "borrar todo lo mío". Anonimiza tus prendas (no se borran porque otros ya las votaron) pero quita tu nombre de ellas.
- **Configurar idioma preferido como dato fijo de cuenta** (hoy se guarda en una cookie del navegador, así que si te cambias de computadora se reinicia).

### Fase 7 — Que las cosas no se rompan en silencio

- **Sentry:** una herramienta que detecta cuando algo se rompe en la web y nos avisa. Como un detector de incendios para el código.
- **PostHog:** una herramienta que cuenta cuánta gente entra, qué botones aprietan, en qué pantallas pasan más tiempo. Para entender si la app sirve y dónde mejorar.

---

## Lo que tú vas a diseñar

OK, aquí entras tú. Necesitamos diseñar las pantallas de **Fase 3** principalmente — lo que la gente va a ver cuando subir prendas, votar, y ver sus cosas.

### Las pantallas que faltan diseñar

**1. Subir una prenda (`/submit/piece`)**
- Foto grande arriba (con opción de subir desde el celular o pegar link de Instagram/TikTok).
- Título — placeholder: "¿Qué estamos viendo?"
- Descripción — placeholder: "Cuéntanos por qué es interesante…"
- Selector de ciudad
- Selector de categoría (top, bottom, vestido, abrigo, zapatos, bolso, accesorio, joyería, sombrero)
- Campo opcional: "¿Dónde se puede comprar? (link)"
- Botón "Enviar para revisión"
- Después de enviar, mensaje: "Tu publicación está en revisión. Aparecerá en el feed una vez aprobada."

**2. Subir un outfit (`/submit/outfit`)**
- Igual que la de prendas pero más sencilla:
- Foto del outfit completo
- Título y descripción
- Ciudad
- Sección abajo para etiquetar prendas individuales (un buscador donde puedes encontrar prendas que ya están en TrendPulse y agregarlas al outfit).

**3. Tarjeta con votación**
- Foto de la prenda (cuadrada, grande).
- Título debajo.
- Botón 👍 con número de votos a la izquierda.
- Botón 👎 con número de votos a la derecha.
- Etiqueta "Hot" o "Fresh" o "Breaking" en la esquina (depende de qué tan reciente y popular sea).
- Al hacer hover/clic, se ve la categoría, ciudad, y autor.

**4. Mis publicaciones (`/account/submissions`)**
- Lista de todas las cosas que esa persona ha subido.
- Cada entrada muestra: foto pequeña, título, estado (pendiente/aprobada/rechazada), fecha.
- Si está rechazada, muestra la razón.

**5. Panel de admin (`/admin`)**
- Lista de cosas pendientes de aprobación.
- Cada fila tiene: foto, título, autor, ciudad, fecha, botones "Aprobar" y "Rechazar".
- Si rechazas, sale un cuadrito para poner la razón.
- Filtros arriba: por ciudad, por categoría, solo prendas o solo outfits.

**6. Página de Premium (`/premium`)**
- Hero arriba: "TrendPulse Premium — coming soon".
- Tres beneficios grandes: "48 horas antes", "Reportes por ciudad", "Exportar CSV".
- Botón de "Únete a la lista de espera" + campo de correo.
- Mensaje de confirmación cuando se inscriben.

### El estilo visual de TrendPulse

Para que las pantallas nuevas se sientan parte del mismo sitio, sigue este estilo:

- **Colores:** rosa pastel (`#f9a8d4` es el rosa principal), fondo blanco crema, acentos en negro suave.
- **Tipografía:** la fuente principal es serif (estilo magazine de moda) para títulos. Los textos pequeños son sans-serif.
- **Esquinas:** todo es muy redondeado — botones tipo "pill" (super redondeados), tarjetas con esquinas redondeadas tipo `rounded-2xl`/`rounded-3xl`.
- **Estética:** y2k suave, polkadots como fondo decorativo (los puntitos rosa).
- **Animaciones:** poquitas. Cuando algo carga, un fade-in suave. Cuando das un voto, el número sube con una animación rápida. No estilo TikTok hipertrabado.

### Cómo trabajar con Claude para diseñar

Tienes dos formas de mockear las pantallas con Claude:

**Opción A — Claude.ai (la más fácil):**

1. Entra a https://claude.ai y abre una conversación nueva.
2. Pégale este plan completo (o el link de GitHub a este archivo).
3. Pídele algo como:
   > "Por favor diseña la pantalla de 'Subir una prenda' para TrendPulse siguiendo el estilo del sitio que está descrito arriba (rosa pastel, esquinas redondas, fuente serif para títulos). Muéstrame el diseño en HTML+CSS dentro de un artifact para que pueda verlo renderizado."
4. Claude te va a generar la pantalla en un panel a la derecha (eso se llama "artifact"), donde puedes verlo en vivo, decirle cambios ("hazlo más grande", "mueve el botón de subir foto a la izquierda"), e iterar.
5. Cuando te guste, le pides que te dé el código final y se lo pasamos a Octavio para integrarlo.

**Opción B — Figma con Claude:**

Si te quieres meter en Figma directamente, también vale. Pero al principio Opción A es más rápida.

### Qué pantallas hacer primero

Yo arrancaría en este orden de prioridad:

1. **Tarjeta con votación** (porque es lo que más se va a ver — todo el feed son tarjetas). Esto define cómo se ve la app entera.
2. **Subir una prenda** (porque sin esto nadie puede llenar el feed).
3. **Mis publicaciones** (cuando alguien sube algo, quiere poder ver qué pasó).
4. **Subir un outfit** (variante de #2, así que es más fácil después de hacer la prenda).
5. **Panel de admin** (no se ve mucho, solo lo usaremos tú/Octavio/yo para moderar).
6. **Premium** (esto lo dejamos para más adelante).

Para cada una, diseña dos versiones: **mobile (celular)** y **desktop (computadora)**. La gente va a usar TrendPulse principalmente desde el celular, así que el mobile es más importante.

### Lo que necesitas para empezar

- Una cuenta en Claude.ai (gratis tiene cupo limitado pero alcanza para empezar; si te quedas corta, Octavio puede darte acceso a la cuenta paga).
- Mira el sitio actual https://trendpul.se desde tu celular y desde la computadora, para entender el "feel" antes de empezar a diseñar.
- Lee la página de login y la de account para ver el estilo de los formularios — los inputs, los botones, los textos.

### Cuando termines un diseño

Hazle screenshots desde Claude.ai y mándaselos a Octavio por chat. Si Claude te dio el código HTML/CSS, también copia ese código y mándaselo. Octavio lo va a usar como referencia para implementar la pantalla de verdad.

---

## Cualquier duda

Escríbele a Octavio (o a Claude — Claude está de tu lado, puedes preguntarle cualquier cosa que no entiendas de este documento).
