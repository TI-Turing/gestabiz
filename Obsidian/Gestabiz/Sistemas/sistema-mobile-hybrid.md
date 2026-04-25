---
date: 2026-04-25
tags: [mobile, expo, webview, hybrid, react-native, eas]
status: completed
---

# Sistema Mobile Híbrido (Expo + WebView)

Gestabiz tiene una **app móvil híbrida** que reusa ~95% del código web mediante un WebView, con una capa nativa fina (~5%) para autenticación segura, almacenamiento, push notifications y bridging con APIs nativas. La carpeta es `src/mobile/`.

## Estrategia: Expo Hybrid WebView

En vez de duplicar la lógica de la web en React Native puro, la app móvil:

1. Carga la URL de producción (`https://gestabiz.com`) o un build local en un `WebView`.
2. Una **shell nativa** (Expo) maneja:
   - Autenticación con `expo-secure-store` (almacenamiento encriptado del refresh token).
   - Push notifications nativas via Expo Push.
   - Permisos de cámara, ubicación, archivos.
   - Status bar, splash screen, deep links.
3. La web detecta que está dentro de un WebView (`window.IS_MOBILE_APP`) y ajusta UI: oculta header, ajusta padding, usa gestos nativos.

## Auth bridging WebView ↔ SecureStore

Para evitar que el token viva solo en cookies de WebView (vulnerable a clearing), la auth se bridgea:

1. Al hacer login en la web (dentro del WebView), un `postMessage` envía el `refresh_token` al shell nativo.
2. El shell guarda el token en `SecureStore` (Keychain en iOS, EncryptedSharedPreferences en Android).
3. Al abrir la app, el shell inyecta el token al WebView mediante `injectedJavaScript`:
   ```js
   window.localStorage.setItem('sb-refresh-token', '...');
   window.dispatchEvent(new Event('mobile-auth-ready'));
   ```
4. Logout limpia ambas capas.

## Health checks: `useServiceStatus`

Hook que valida que los servicios críticos (Supabase, Edge Functions, Catalog API) responden. Si alguno está caído, muestra una pantalla de mantenimiento en lugar del WebView para evitar errores confusos.

## Build artifacts (EAS Build)

| Plataforma | Artefacto | Uso |
|-----------|-----------|-----|
| Android | `.aab` | Subida a Play Store |
| Android | `.apk` | Sideload / testing interno |
| iOS | `.ipa` | App Store + TestFlight |

Builds gestionados con **EAS Build** (Expo Application Services). Profiles: `development`, `preview`, `production` en `eas.json`.

## Versionado

`APP_CONFIG.VERSION` en `src/constants/index.ts` se referencia en `src/main.tsx:103-107` para mostrar la versión actual en footer y al reportar bugs. La app móvil sincroniza `app.json` (`expo.version`, `expo.android.versionCode`, `expo.ios.buildNumber`) con esta misma constante en cada release.

## Push notifications

- Registro del device token al login → guardado en `profiles.push_token`.
- Edge Function `send-notification` envía push via Expo Push API si el canal `in-app` está habilitado y hay token registrado.
- Tap en push abre la URL específica del recurso (ej: cita, conversación) mediante deep linking.

## Deep linking

Esquema `gestabiz://` + universal links de `https://gestabiz.com`:
- `gestabiz://appointment/:id`
- `gestabiz://chat/:conversationId`
- `gestabiz://negocio/:slug`

## Limitaciones del enfoque

- Pull-to-refresh y gestos nativos requieren ajustes específicos.
- Performance percibida depende de la conexión (es web cargada en WebView).
- Algunas APIs (compartir, geolocalización en background) requieren bridges adicionales.

## Notas relacionadas

- [[stack-tecnologico]] — React Native / Expo
- [[sistema-autenticacion]] — Auth singleton compartido con web
- [[sistema-notificaciones]] — Push notifications
