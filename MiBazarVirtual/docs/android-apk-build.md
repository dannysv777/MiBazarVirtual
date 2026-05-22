# APK Android

## Estado

El perfil `preview` de `frontend/eas.json` genera un APK instalable para pruebas y presentacion:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Primer build

Desde `frontend`:

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

En el primer build EAS puede pedir:

1. Vincular o crear el proyecto Expo/EAS. Aceptar.
2. Generar credenciales Android/keystore si no existen. Aceptar para APK de prueba.
3. Confirmar que se suba el proyecto al build remoto.

Cuando termine, EAS muestra un enlace para descargar el APK. Ese APK se instala directamente en un Android.

## Antes de probar push

1. Railway debe tener `FIREBASE_SERVICE_ACCOUNT_JSON` o `FIREBASE_SERVICE_ACCOUNT_BASE64`.
2. Instalar el APK Android generado por EAS.
3. Iniciar sesion y aceptar notificaciones.
4. Ejecutar `POST /api/push-tokens/test`.
5. Confirmar que la respuesta tenga:
   - `push.androidNativeTokens` mayor que `0`.
   - `push.firebaseConfigured` en `true`.

## Build de Play Store

El perfil `production` de `frontend/eas.json` queda reservado para `app-bundle`. Ese artefacto `.aab` sirve para Google Play; para instalar en un telefono de prueba se usa el APK `preview`.
