# SPEC-06: Deploy — App Store, Google Play y Web

## Contexto
Preparar y publicar la app en las 3 plataformas. Expo EAS para mobile, Vercel para web.

## Prompt para Claude Code

```
Configura el pipeline completo de deploy para las 3 plataformas.

### PARTE 1: WEB — Vercel (Next.js)

**1. Instalar Vercel CLI y configurar:**
```bash
pnpm add -g vercel
cd apps/web
vercel link
```

**2. Variables de entorno en Vercel:**
Configurar en Vercel Dashboard → Settings → Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_PRO
- STRIPE_PRICE_CLUB
- RESEND_API_KEY
- NEXT_PUBLIC_APP_URL=https://tudominio.com

**3. Webhook de Stripe en producción:**
- En Stripe Dashboard → Webhooks → Add endpoint
- URL: https://tudominio.com/api/webhooks/stripe
- Eventos: customer.subscription.created/updated/deleted, invoice.payment_failed

**4. Dominio personalizado:**
- Agregar dominio en Vercel
- Actualizar NEXT_PUBLIC_APP_URL y success_url/cancel_url de Stripe

---

### PARTE 2: MOBILE — Expo EAS Build

**1. Instalar EAS CLI:**
```bash
pnpm add -g eas-cli
eas login
```

**2. Inicializar EAS en el proyecto:**
```bash
cd apps/mobile
eas init
```

**3. Configurar `eas.json`:**
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://xxxx.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "buildType": "release" },
      "android": { "buildType": "app-bundle" },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://xxxx.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu@email.com",
        "ascAppId": "XXXXXXXXXX",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**4. Configurar `app.json`:**
```json
{
  "expo": {
    "name": "CDUC Rugby",
    "slug": "cduc-rugby",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#001e40"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "cl.cduc.rugby",
      "buildNumber": "1",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Para subir fotos de ejercicios",
        "NSCameraUsageDescription": "Para tomar fotos de ejercicios"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#001e40"
      },
      "package": "cl.cduc.rugby",
      "versionCode": 1,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#001e40"
      }]
    ],
    "scheme": "cducrugby",
    "extra": {
      "eas": { "projectId": "TU-EAS-PROJECT-ID" }
    }
  }
}
```

---

### PARTE 3: iOS App Store

**Pre-requisitos:**
- Apple Developer Account ($99/año)
- Xcode instalado (para signing)
- App creada en App Store Connect

**Paso a paso:**

1. Crear App ID en Apple Developer Portal:
   - Bundle ID: cl.cduc.rugby
   - Capabilities: Push Notifications

2. Crear App en App Store Connect:
   - Nombre: "CDUC Rugby"
   - Primary Language: Español
   - Bundle ID: cl.cduc.rugby
   - SKU: CDUC-RUGBY-001

3. Build para producción:
```bash
eas build --platform ios --profile production
```

4. Submit a App Store:
```bash
eas submit --platform ios --profile production
```
O manualmente desde App Store Connect.

5. Completar metadata en App Store Connect:
   - Screenshots (6.7", 6.1", 5.5", iPad si aplica)
   - Descripción (ES + EN)
   - Keywords: rugby, entrenamiento, deportes, preparación física, plantel
   - Categoría: Sports
   - Rating: 4+ (no violencia, no contenido adulto)
   - Privacy Policy URL (obligatorio): https://tudominio.com/privacy
   - Support URL: https://tudominio.com/support

**Descripción para App Store (usar esto como base):**
```
CDUC Rugby — Gestión de Plantel Profesional

La plataforma definitiva para preparadores físicos y entrenadores de rugby.

✓ Gestiona múltiples equipos y categorías
✓ Seguimiento de progreso físico: squat, deadlift, bench
✓ Análisis de partidos con métricas GPS
✓ Planificador de sesiones de entrenamiento
✓ Estado físico y control de lesiones
✓ Invita jugadores por email

Para clubes y entrenadores que exigen el máximo rendimiento.
```

**Política de pagos (importante para App Review):**
- En la descripción mencionar que los pagos se gestionan en la web
- No mencionar precios en la app
- Cumple con App Store Guidelines 3.1.3(b)

---

### PARTE 4: Google Play Store

**Pre-requisitos:**
- Google Play Developer Account ($25 único)
- Cuenta de servicio para EAS Submit

**Crear Service Account:**
1. Google Play Console → Setup → API access
2. Crear service account con rol "Release manager"
3. Descargar JSON key → guardar como `apps/mobile/google-service-account.json`
4. Agregar a `.gitignore`

**Build para producción:**
```bash
eas build --platform android --profile production
# Genera .aab (Android App Bundle)
```

**Submit:**
```bash
eas submit --platform android --profile production
```

**Metadata en Google Play Console:**
- Nombre: "CDUC Rugby"
- Descripción corta (80 chars): "Gestión profesional de plantel y entrenamiento de rugby"
- Descripción larga: similar a App Store
- Categoría: Sports
- Screenshots: phone (mínimo 2), tablet (opcional)
- Feature graphic: 1024x500px
- Content rating: Everyone

---

### PARTE 5: Assets necesarios

**Crear los siguientes assets antes del submit:**

```
apps/mobile/assets/
├── icon.png              # 1024x1024px, sin transparencia, fondo #001e40
├── adaptive-icon.png     # 1024x1024px, solo el logo, con transparencia
├── splash.png            # 1284x2778px, fondo #001e40, logo centrado
├── notification-icon.png # 96x96px, blanco sobre transparente
└── feature-graphic.png   # 1024x500px (para Google Play)

apps/web/public/
├── favicon.ico
├── og-image.png          # 1200x630px (Open Graph)
└── apple-touch-icon.png  # 180x180px
```

**Generar con script:**
```bash
# Instalar sharp para manipulación de imágenes
pnpm add -D sharp
# Crear script que genera todas las variantes desde un PNG maestro 1024x1024
```

---

### PARTE 6: OTA Updates con EAS Update

Para actualizar la app sin pasar por review (solo JS, no código nativo):

```bash
# Publicar update
eas update --branch production --message "Corrección de bug en plantel"
```

Configurar en `app.json`:
```json
"updates": {
  "enabled": true,
  "fallbackToCacheTimeout": 0,
  "url": "https://u.expo.dev/TU-PROJECT-ID"
}
```

---

### PARTE 7: CI/CD con GitHub Actions

Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter web build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  eas-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && eas update --branch production --auto
```

---

### CHECKLIST FINAL ANTES DE LANZAR

**Supabase:**
- [ ] RLS habilitado en todas las tablas
- [ ] Backups automáticos activados
- [ ] Plan pagado (no free tier para producción)

**Stripe:**
- [ ] Cuenta en modo live (no test)
- [ ] Webhook configurado con URL de producción
- [ ] Política de reembolso definida

**App Store:**
- [ ] Privacy Policy publicada en URL pública
- [ ] Terms of Service publicados
- [ ] Screenshots en todos los tamaños requeridos
- [ ] App Review Information completada

**Google Play:**
- [ ] Privacy Policy URL en el listing
- [ ] Content rating completado
- [ ] Target API level 34+ (Android 14)

**Web:**
- [ ] HTTPS con certificado válido
- [ ] robots.txt y sitemap.xml
- [ ] Meta tags y OG tags

**General:**
- [ ] Probar flujo completo en producción con usuario real
- [ ] Probar invite → registro → primer login
- [ ] Probar upload Excel completo
- [ ] Verificar notificaciones push en dispositivo real
```

## Output esperado
- `eas.json` configurado correctamente
- `app.json` completo con todos los campos
- Script de generación de assets
- GitHub Actions workflow
- Checklist de lanzamiento completado

## Validación
- `eas build --platform ios --profile preview` compila sin errores
- `eas build --platform android --profile preview` compila sin errores
- App instalable en dispositivo físico vía TestFlight / Play Internal
