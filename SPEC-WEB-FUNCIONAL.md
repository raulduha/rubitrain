# SPEC-WEB-FUNCIONAL — Documentación de Páginas Web

Descripción completa de cada página, qué muestra y qué hace cada botón/acción.
Usa este archivo para anotar qué funciona, qué falla, y qué cambiar.

---

## `/` — Landing Page

**Qué muestra:**
- Navbar: Logo "RubiTrain" + botones "Iniciar sesión" y "Comenzar gratis"
- Hero: Título, subtítulo, botón "Comenzar gratis" → `/register`, botón "Ver demo" (sin acción aún)
- Sección Features: 6 cards explicando funciones de la app
- Sección "Cómo funciona": 3 pasos con números
- Sección Pricing: 3 planes (Free / Pro $14.990 / Club $44.990 CLP/mes)
- CTA final: Botón "Comenzar gratis hoy"
- Footer

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Iniciar sesión" (navbar) | → `/login` |
| "Comenzar gratis" (navbar) | → `/register` |
| "Comenzar gratis" (hero) | → `/register` |
| "Ver demo" (hero) | Sin acción (pendiente) |
| "Comenzar gratis" (pricing Free) | → `/register` |
| "Suscribirse Pro" (pricing) | → `/register` |
| "Suscribirse Club" (pricing) | → `/register` |
| "Comenzar gratis hoy" (CTA) | → `/register` |

**Estado:** _______________

---

## `/login` — Iniciar Sesión

**Qué muestra:**
- Logo RubiTrain
- Botón "Continuar con Google"
- Separador "o con email"
- Campo Email
- Campo Contraseña
- Botón "Iniciar sesión"
- Link "Crear cuenta" → `/register`
- Botón "¿Olvidaste tu contraseña?"

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Continuar con Google" | Redirige a Google OAuth → callback `/api/auth/callback` → `/dashboard` |
| "Iniciar sesión" (form) | `supabase.signInWithPassword` → si OK: `/dashboard` · si error: muestra "Credenciales incorrectas" |
| "Crear cuenta" | → `/register` |
| "¿Olvidaste tu contraseña?" | Requiere email escrito. Llama `resetPasswordForEmail` → `alert()` diciendo "Revisa tu correo" |

**Validaciones:**
- Email y contraseña son requeridos (HTML required)
- Si Google falla: "Error al conectar con Google. Intenta de nuevo."

**Estado:** _______________

---

## `/register` — Crear Cuenta

**Qué muestra:**
- Logo RubiTrain
- Nota: "Los jugadores solo pueden registrarse por invitación"
- Selector de rol: "Preparador Físico" / "Entrenador" (toggle de 2 botones)
- Botón "Registrarse con Google"
- Separador "o con email"
- Campos: Nombre completo, Email, Contraseña, Confirmar contraseña
- Botón "Crear cuenta"
- Link "Inicia sesión" → `/login`

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Preparador Físico" / "Entrenador" | Cambia el rol que se guardará al crear la cuenta |
| "Registrarse con Google" | Google OAuth → `/api/auth/callback` → `/dashboard` (nota: el rol no se pasa a Google, queda como 'player' por defecto por el trigger — **pendiente corregir**) |
| "Crear cuenta" | `supabase.signUp` con email/contraseña → si OK: redirige a `/verify-email?email=...` · si error: muestra el error |

**Validaciones:**
- Contraseñas deben coincidir → "Las contraseñas no coinciden"
- Contraseña mínimo 8 caracteres → "La contraseña debe tener al menos 8 caracteres"

**Estado:** _______________

---

## `/verify-email` — Verificar Correo

**Qué muestra:**
- Ícono de sobre
- Título "Verifica tu correo"
- Email al que se envió el link (viene por query param `?email=`)
- Instrucción de revisar bandeja de entrada
- Botón "Ya verifiqué → Continuar"
- Botón "Reenviar correo"

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Ya verifiqué → Continuar" | Llama `supabase.getUser()` → si email_confirmed_at existe: → `/dashboard` · si no: mensaje "Tu correo aún no ha sido verificado" |
| "Reenviar correo" | Llama `supabase.auth.resend()` → activa cooldown de 60 segundos, muestra contador |

**Estado:** _______________

---

## `/dashboard` — Panel Principal

**Qué muestra:**
- Saludo "Hola, [Nombre] 👋" + fecha actual
- 3 StatCards: Clubes (cantidad), Equipos (cantidad), Plan ("Free" si es physical_trainer)
- Grid de cards de cada club (nombre, deporte, país)
- Si no hay clubes: card vacía con botón "Crear primer club" → `/dashboard/clubs/new` (**esta ruta no existe aún — pendiente**)

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| Card de club | Solo visual, no es clickeable actualmente |
| "Crear primer club" | → `/dashboard/clubs/new` (ruta no existe) |

**Estado:** _______________

---

## Sidebar (visible en todo el dashboard)

**Qué muestra:**
- Logo RubiTrain
- Ítem "Dashboard" → `/dashboard`
- Ítem "Mis Clubes" → `/dashboard/clubs`
- Ítem "Plantel" → `/dashboard/roster` (**ruta sin teamId, redirige a nada**)
- Ítem "Subir Datos" (desplegable):
  - "Rutinas" → `/dashboard/upload/training`
  - "Métricas de Partido" → `/dashboard/upload/matches`
- Ítem "Reportes" → `/dashboard/reports` (**página no existe aún**)
- Ítem "Suscripción" → `/dashboard/billing`
- Abajo: Avatar + nombre del usuario + botón "Cerrar sesión"

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Subir Datos" | Toggle que muestra/oculta el submenú |
| "Cerrar sesión" | `supabase.auth.signOut()` → `router.push('/login')` |
| Todos los ítems de navegación | Navegan a la ruta indicada |

**Estado:** _______________

---

## `/dashboard/clubs` — Mis Clubes

**Qué muestra:**
- Título "Mis Clubes"
- Botón "Crear Club" (arriba a la derecha)
- Grid de cards por club:
  - Inicial del nombre en círculo oscuro
  - Nombre del club + deporte + país
  - Link "Gestionar →"
  - Stats: número de categorías, número de jugadores
  - Lista de categorías (equipos) con link a su plantel
- Si no hay clubes: card vacía con otro botón "Crear Club"

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Crear Club" | Abre modal con campos Nombre y País → inserta en Supabase → recarga la página |
| "Gestionar →" (en cada club) | → `/dashboard/clubs/[id]` |
| Nombre de categoría (link) | → `/dashboard/roster/[teamId]` |

**Estado:** _______________

---

## `/dashboard/clubs/[id]` — Detalle del Club

**Qué muestra:**
- Breadcrumb "← Clubes / [Nombre del club]"
- Header con inicial, nombre, deporte y país del club
- 2 tabs: "Categorías" y "Entrenadores"

**Tab Categorías:**
- Lista de equipos con nombre
- Botón "Nueva Categoría" → muestra formulario inline con campo Nombre y selector Categoría
- En cada equipo: botón que navega a su plantel

**Tab Entrenadores:**
- Lista de coaches asignados con nombre y equipo
- Botón "Invitar Entrenador" → (actualmente abre el mismo modal de InvitePlayerButton)

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "← Clubes" (breadcrumb) | → `/dashboard/clubs` |
| "Nueva Categoría" | Muestra formulario inline |
| "Crear" (en formulario) | `supabase.insert('teams')` → recarga la página |
| "Cancelar" (en formulario) | Oculta el formulario |
| Nombre de equipo (link) | → `/dashboard/roster/[teamId]` |

**Estado:** _______________

---

## `/dashboard/roster/[teamId]` — Plantel del Equipo

**Qué muestra:**
- Breadcrumb: Clubes → [Nombre del club] → [Nombre del equipo]
- Header: nombre del equipo, categoría, temporada, cantidad de jugadores
- Botón "Invitar Jugador"
- Filtros: búsqueda por nombre/posición, toggle Todos/Forwards/Backs
- Tabla de jugadores:
  - Columnas: #, Nombre, Posición, Peso, Altura, Edad, Estado físico, Acciones
  - Badge de estado físico (Apto verde / Limitado amarillo / Lesionado rojo / Recuperación naranja)
  - Acciones: link "Ver perfil" → `/dashboard/player/[id]`

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Invitar Jugador" | Abre modal con campo Email + selector Rol + campo Mensaje (opcional) → POST `/api/invitations` → envía email con Resend → muestra confirmación |
| "Ver perfil" (en cada jugador) | → `/dashboard/player/[id]` |
| Búsqueda | Filtra la tabla en tiempo real por nombre o posición |
| Toggle Todos / Forwards / Backs | Filtra por `position_group` |

**Estado:** _______________

---

## `/dashboard/player/[id]` — Perfil del Jugador

**Qué muestra:**
- Breadcrumb: Clubes → [Nombre del jugador]
- Card de header: avatar (inicial), nombre, posición, grupo, badge de estado físico actual
- Stats: camiseta, peso, altura, nombre del equipo
- 3 tabs: Rendimiento, Partidos, Estado Físico

**Tab Rendimiento:**
- Gráfico de línea (Recharts `LineChart`): Sentadilla / Peso Muerto / Press de Banca últimos meses
- Si no hay datos: mensaje vacío

**Tab Partidos:**
- Gráfico de barras (Recharts `BarChart`): Velocidad máx y metros recorridos por partido
- Tabla con todos los partidos: fecha, rival, vel. máx, metros, sprints, HSR, estado

**Tab Estado Físico:**
- Lista cronológica de estados con fecha, estado (badge color) y notas

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "← Clubes" (breadcrumb) | → `/dashboard/clubs` |
| Tabs (Rendimiento / Partidos / Estado Físico) | Cambia la vista del tab |

**Estado:** _______________

---

## `/dashboard/upload/training` — Cargar Rutinas

**Flujo de 3 pasos con indicador visual:**

**Paso 1 — Template:**
- Descripción de las columnas del Excel
- Botón "Descargar Template Excel" → descarga desde `/api/templates/training`
- Botón "Ya tengo el archivo →" → avanza al paso 2

**Paso 2 — Subir:**
- Zona drag & drop (acepta `.xlsx` y `.csv`)
- Al soltar archivo: lee las primeras 5 filas y muestra preview en tabla
- Campo "ID del Equipo" (texto libre — el UUID del equipo)
- Botón "← Atrás" → vuelve al paso 1
- Botón "Procesar y Cargar" → POST `/api/upload/training` con el archivo y teamId

**Paso 3 — Confirmación:**
- Si éxito: ✅ + contadores: "X sesiones creadas", "Y ejercicios importados", "Z errores"
- Si errores: ⚠️ + lista de errores con número de fila y descripción
- Botón "Cargar otro archivo" → reinicia todo al paso 1

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Descargar Template Excel" | GET `/api/templates/training` → descarga `template_rutinas.xlsx` |
| "Ya tengo el archivo →" | Avanza a paso 2 sin necesitar descargar |
| Zona drag & drop / clic | Abre selector de archivos o recibe archivo arrastrado |
| "← Atrás" | Vuelve al paso 1 |
| "Procesar y Cargar" | POST `/api/upload/training` → va al paso 3 con resultados |
| "Cargar otro archivo" | Resetea todo, vuelve al paso 1 |

**Nota:** El campo "ID del Equipo" es un UUID que el usuario debe copiar de la URL del plantel. Pendiente mejorar con un selector de equipo.

**Estado:** _______________

---

## `/dashboard/upload/matches` — Cargar Métricas de Partido

**Mismo flujo de 3 pasos que rutinas.**

**Diferencias:**
- Template descarga desde `/api/templates/matches`
- Columnas: Email_Jugador, Fecha_Partido, Rival, Vel_Max_kmh, Metros_Totales, Sprints, Metros_HSR, Estado
- El backend busca al jugador por email dentro del equipo
- El estado (optimal/fatigue/alert) se calcula automáticamente si no se provee

**Botones:** (idénticos a Cargar Rutinas, cambia el endpoint)

| Botón | Acción actual |
|-------|---------------|
| "Descargar Template Excel" | GET `/api/templates/matches` → descarga `template_metricas_partido.xlsx` |
| "Procesar y Cargar" | POST `/api/upload/matches` → resultados en paso 3 |

**Estado:** _______________

---

## `/dashboard/billing` — Suscripción

**Qué muestra:**

**Sección "Plan actual":**
- Nombre del plan (Free / Pro / Club) + badge de estado (Activo / Pago pendiente / Free)
- Fecha próxima renovación (si tiene suscripción activa)
- Barra de progreso de jugadores activos vs límite del plan
- Advertencia amarilla si se supera el 80% del límite

**Sección "Cambiar plan":**
- 3 cards: Free / Pro ($14.990 CLP/mes) / Club ($44.990 CLP/mes)
- Card del plan actual marcada con badge "Plan actual"
- En planes no activos (Pro y Club): 2 botones de pago

**Sección "Plan del Club":**
- Lista de cada organización del usuario
- Si la org ya tiene plan: badge verde con el plan
- Si la org no tiene plan: 2 botones para activarle un plan

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "MercadoPago" (plan personal Pro/Club) | → `/api/billing/mp-subscribe?plan=pro` (ruta **no implementada aún**) |
| "WebPay" (plan personal Pro/Club) | → `/api/billing/webpay-init?plan=pro` (ruta **no implementada aún**) |
| "Activar Pro" (plan del club) | → `/api/billing/mp-subscribe?plan=pro&billingType=organization&orgId=...` (ruta **no implementada aún**) |
| "Activar Club" (plan del club) | → `/api/billing/mp-subscribe?plan=club&billingType=organization&orgId=...` (ruta **no implementada aún**) |

**Estado:** _______________

---

## `/join?token=XXX` — Aceptar Invitación

**El token viene por query param. Si el token es inválido o expirado (7 días) muestra pantalla de error.**

**Si el token es válido muestra:**
- Mensaje "Te invitaron a unirte como [rol] al equipo [nombre] en [club]"

**Caso A — Usuario NO está logueado:**
- Formulario: Nombre completo + Email (bloqueado, pre-cargado con el email invitado) + Contraseña
- Botón "Crear cuenta y unirse" → `supabase.signUp` → acepta invitación via API → `/verify-email`

**Caso B — Usuario SÍ está logueado:**
- Muestra email actual de la sesión
- Botón "Aceptar invitación" → POST `/api/invitations/[token]/accept` → `/dashboard`

**Botones:**
| Botón | Acción actual |
|-------|---------------|
| "Crear cuenta y unirse" | Crea cuenta con el email invitado + acepta invitación + → `/verify-email` |
| "Aceptar invitación" | Acepta invitación (si ya está logueado) → `/dashboard` |

**Estado:** _______________

---

## Notas Generales

**Cosas pendientes de implementar en la web:**
- `/dashboard/clubs/new` — se menciona pero no existe (debería redirigir a `/dashboard/clubs` y abrir el modal)
- `/dashboard/roster` sin teamId — el sidebar lo linkea pero no tiene sentido sin un equipo específico
- `/dashboard/reports` — mencionado en sidebar pero la página no existe
- Rutas de pagos: `/api/billing/mp-subscribe` y `/api/billing/webpay-init` (SPEC-05 pendiente)
- Rol en Google OAuth no se pasa correctamente al crear cuenta por primera vez
- El campo "ID del Equipo" en upload es un UUID manual — mejorar con dropdown de equipos
