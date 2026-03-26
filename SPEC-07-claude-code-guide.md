# SPEC-07: Cómo Usar Claude Code con estas Specs

## Qué es Claude Code

Claude Code es una herramienta de línea de comandos que corre Claude directamente en tu terminal con acceso a tu sistema de archivos, para ejecutar comandos, editar archivos, y construir software completo de forma autónoma.

## Instalación

```bash
npm install -g @anthropic/claude-code
claude  # primer uso — te pedirá autenticarse
```

## Cómo Darle las Specs

### Método 1: Pegar el contenido directo (más simple)

```bash
claude
```
Una vez dentro, escribe o pega:
```
Lee el archivo SPEC-01-database.md y ejecuta todo lo que describe.
Cuando termines cada paso, confírmame qué hiciste antes de continuar.
```

### Método 2: Referenciar el archivo (recomendado)

```bash
claude "Lee y ejecuta el archivo /ruta/a/SPEC-01-database.md"
```

### Método 3: Con contexto del proyecto (mejor para specs largas)

```bash
# Desde la carpeta raíz del proyecto
cd ~/rugby-app
claude --add-dir . "Lee SPEC-01-database.md y configura la base de datos"
```

---

## Orden de Ejecución — Paso a Paso

Ejecuta las specs **en este orden exacto**. No saltes pasos.

### 🗄️ PASO 1 — Base de datos
```bash
claude "Lee el archivo SPEC-01-database.md y:
1. Crea las migraciones SQL de Supabase
2. Configura los buckets de Storage
3. Crea el archivo seed.sql con datos de prueba
Confirma cada archivo creado antes de continuar."
```
✅ Validar: `supabase db reset` sin errores

---

### 🏗️ PASO 2 — Estructura y Auth
```bash
claude "Lee el archivo SPEC-02-project-setup.md y:
1. Crea la estructura del monorepo con Turborepo
2. Configura Expo para mobile
3. Configura Next.js para web
4. Implementa auth completo con Supabase
5. Crea los hooks de autenticación
Ejecuta pnpm install al final y confírmame si hay errores."
```
✅ Validar: `pnpm dev` levanta ambas apps

---

### 📱 PASO 3 — Pantallas Mobile
```bash
claude "Lee el archivo SPEC-03-mobile-screens.md y:
1. Crea todos los componentes UI base (PlayerCard, StatCard, etc.)
2. Implementa las 6 pantallas del diseño
3. Conecta cada pantalla a Supabase con los hooks correspondientes
4. Implementa skeletons y empty states
El diseño debe seguir EXACTAMENTE los colores y tipografía del design system 
especificado en el archivo."
```
✅ Validar: app en simulador, navegar todas las pantallas

---

### 💻 PASO 4 — Dashboard Web
```bash
claude "Lee el archivo SPEC-04-web-dashboard.md y:
1. Implementa el layout con sidebar
2. Crea todas las páginas del dashboard
3. Implementa el sistema de upload de Excel con generación de templates
4. Configura el sistema de invitaciones con Resend
Instala las dependencias necesarias y confírmame si algo no está claro."
```
✅ Validar: subir Excel de prueba → datos en Supabase

---

### 💳 PASO 5 — Pagos
```bash
claude "Lee el archivo SPEC-05-payments.md y:
1. Configura Stripe con los productos y precios
2. Implementa el checkout flow
3. Implementa el webhook handler
4. Implementa el feature gating por plan
5. Completa la página de billing
Usa modo test de Stripe. Dame el comando para escuchar webhooks en local."
```
✅ Validar: checkout completo con tarjeta test

---

### 🚀 PASO 6 — Deploy
```bash
claude "Lee el archivo SPEC-06-deploy.md y:
1. Configura EAS para la app mobile
2. Configura el deploy en Vercel para la web
3. Crea el GitHub Actions workflow
4. Genera los assets necesarios (icon, splash, etc.)
No hagas el submit a las stores todavía, solo prepara todo."
```
✅ Validar: build de iOS y Android sin errores

---

## Comandos Útiles de Claude Code

### Ver qué está haciendo
Claude Code te muestra cada acción antes de ejecutarla y te pide confirmación para cambios importantes.

### Modo autónomo (sin confirmaciones)
```bash
claude --dangerously-skip-permissions "ejecuta SPEC-01..."
# ⚠️ Usar con cuidado, ejecuta todo sin preguntar
```

### Continuar una sesión anterior
```bash
claude --continue
```

### Ver historial de lo que hizo
```bash
claude --print
```

---

## Tips para Mejores Resultados

### 1. Dale contexto del proyecto al inicio
Al comenzar cada spec, incluye:
```
"Estoy construyendo una app de gestión de plantel de rugby llamada CDUC.
Stack: Expo + Next.js + Supabase + Stripe.
El código está en ~/rugby-app.
Lee SPEC-XX y ejecuta."
```

### 2. Pide confirmación en puntos clave
```
"Antes de crear archivos, muéstrame la estructura de carpetas que vas a crear"
"Después de instalar dependencias, muéstrame el package.json"
```

### 3. Si algo falla, dale el error completo
```
"El comando pnpm install falló con este error: [pega el error]
¿Cómo lo solucionamos?"
```

### 4. Itera en partes si la spec es muy grande
Si una spec tiene mucho, puedes dividirla:
```
"De SPEC-03, implementa primero solo los componentes UI base (PlayerCard, StatCard, BottomTabBar).
Cuando los tengas listos y funcionando, continuamos con las pantallas."
```

### 5. Pide tests básicos
```
"Después de implementar el auth, crea un test básico que verifique:
- Login exitoso con credenciales correctas
- Error con credenciales incorrectas
- Redirección correcta por rol"
```

---

## Flujo de Git Recomendado

```bash
# Antes de cada spec
git checkout -b spec-01-database
# Claude Code trabaja aquí...
git add -A && git commit -m "feat: spec 01 - database schema completo"
git checkout main && git merge spec-01-database

git checkout -b spec-02-project-setup
# etc...
```

---

## Si Claude Code Se Atasca

Si en algún punto Claude Code no puede avanzar, prueba:

1. **Ser más específico:**
   ```
   "El problema es X. El archivo Y tiene el error Z en la línea N. ¿Cómo lo arreglas?"
   ```

2. **Dividir el problema:**
   ```
   "Olvida lo anterior. Empecemos solo con crear el cliente de Supabase en lib/supabase.ts"
   ```

3. **Darle el contexto de archivos:**
   ```
   "Revisa el archivo actual apps/mobile/src/hooks/useAuth.ts y dime qué le falta"
   ```

4. **Pedir explicación primero:**
   ```
   "Antes de escribir código, explícame cómo vas a implementar el RLS para que un jugador 
   solo pueda ver sus propios datos"
   ```

---

## Estimación de Tiempo por Spec

| Spec | Complejidad | Tiempo estimado con Claude Code |
|------|-------------|----------------------------------|
| SPEC-01 Database | Media | 30-60 min |
| SPEC-02 Setup | Alta | 60-90 min |
| SPEC-03 Mobile | Alta | 2-3 horas |
| SPEC-04 Web | Alta | 2-3 horas |
| SPEC-05 Payments | Media | 60-90 min |
| SPEC-06 Deploy | Baja | 30-60 min |
| **Total** | | **~10-12 horas** |

Esto asumiendo que revisas y validas entre cada spec.
