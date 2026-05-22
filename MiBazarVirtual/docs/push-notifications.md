# Notificaciones push

## Estado actual

La app ya queda preparada para notificaciones push con Expo/Firebase:

- `frontend/google-services.json` conectado al package Android `com.services`.
- `frontend/GoogleService-Info.plist` conectado al bundle iOS `com.serviceaccount`.
- `expo-notifications`, `expo-device` y `expo-constants` instalados.
- La app pide permiso de notificaciones cuando el usuario inicia sesion.
- El token del dispositivo se registra en `POST /api/push-tokens`.
- El backend guarda tokens en la tabla `push_tokens`.
- Cada notificacion interna tambien intenta enviar push al usuario correspondiente.
- Android registra token Expo y token nativo FCM cuando el dispositivo los entrega.
- iOS no registra token nativo APNs en esta demo; se deja para una integracion APNs/EAS posterior.

## Flujo

1. Usuario inicia sesion.
2. `NotificationContext` llama a `getPushTokens()`.
3. Si el permiso fue concedido, registra el token en backend:

```http
POST /api/push-tokens
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "ExponentPushToken[...]",
  "tokenType": "EXPO",
  "platform": "android",
  "deviceId": "..."
}
```

4. Cuando el backend crea una notificacion interna, `NotificationService` llama a `PushNotificationService`.
5. Si el token es Expo, se envia por `https://exp.host/--/api/v2/push/send`.
6. Si el token es nativo Android, se envia con Firebase Admin cuando Railway tiene la credencial de servidor.

## Importante para la demo

Para recibir push reales en Android/iOS no basta con Expo Go en todos los casos. Lo mas estable es generar una development build o APK con EAS usando estos archivos Firebase.

Los archivos `docs/*firebase-adminsdk*.json` son credenciales privadas. No se suben a Git.

### Railway

Para que el backend envie notificaciones nativas Android con Firebase:

1. Abre Railway > backend > Variables.
2. Crea **una** de estas variables:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: pega el contenido completo de un `firebase-adminsdk*.json`.
   - `FIREBASE_SERVICE_ACCOUNT_BASE64`: pega el mismo JSON codificado en Base64.
3. Redespliega backend.

El backend no necesita que el archivo privado quede dentro del repo. Los archivos publicos `google-services.json` y `GoogleService-Info.plist` conectan la app, pero el JSON Admin autoriza al servidor a mandar mensajes.

### iOS y Expo

El token nativo de iOS es APNs. La ruta nativa de este backend se enfoca en FCM Android; para evitar falsos positivos, la app ya no registra tokens APNs nativos en esta demo. Para iOS se conserva el envio por token Expo cuando exista. Si el `ExpoPushToken` no aparece, hay que vincular el proyecto con EAS y tener `extra.eas.projectId` disponible en la configuracion de Expo.

### Checklist Android

1. Instalar una APK/development build Android que incluya `google-services.json`; Expo Go Android no es la prueba final para push remotas.
2. Iniciar sesion y aceptar el permiso de notificaciones.
3. Confirmar que existe el canal Android `default`; la app lo crea antes de pedir token.
4. Ejecutar `POST /api/push-tokens/test`.
5. La respuesta debe tener:
   - `push.androidNativeTokens` mayor que `0`.
   - `push.firebaseConfigured` en `true`.
6. Probar con la app en segundo plano y luego cerrada.

## Prueba rapida

1. Instalar/build de la app con Firebase configurado.
2. Iniciar sesion y aceptar permisos de notificaciones.
3. Revisar en backend que se cree un registro en `push_tokens`.
4. Generar una accion: nuevo mensaje, pedido confirmado o pedido disponible para delivery.
5. Confirmar que aparece notificacion interna y push en el dispositivo.

Si estas probando solo con un usuario, usa Postman:

```http
POST /api/push-tokens/test
Authorization: Bearer <accessToken del login>
Content-Type: application/json

{
  "title": "Prueba push",
  "body": "Mensaje de prueba desde Postman"
}
```

La respuesta incluye:

- `push.activePushTokens`: cantidad total de tokens registrados.
- `push.expoTokens`: tokens que salen por Expo.
- `push.nativeTokens`: tokens nativos, FCM en Android.
- `push.androidNativeTokens`: tokens Android que el backend envia por Firebase Admin.
- `push.iosNativeTokens`: tokens iOS heredados; no se usan en esta demo sin APNs.
- `push.firebaseConfigured`: `true` cuando Railway ya tiene la credencial Admin Firebase.

Si `activePushTokens` devuelve `0`, la app aun no registro el token de ese usuario en ese dispositivo. Si hay `nativeTokens` pero `firebaseConfigured` es `false`, falta el secreto Firebase en Railway.
