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

## Flujo

1. Usuario inicia sesion.
2. `NotificationContext` llama a `getPushToken()`.
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
6. Si el token es nativo, queda guardado, pero el envio por Firebase Admin queda pendiente.

## Importante para la demo

Para recibir push reales en Android/iOS no basta con Expo Go en todos los casos. Lo mas estable es generar una development build o APK con EAS usando estos archivos Firebase.

Los archivos `docs/*firebase-adminsdk*.json` son credenciales privadas. No se suben a Git. Para activar envio nativo directo por Firebase Admin en el futuro, se deben convertir a variables de entorno en Railway o montar el archivo como secreto.

## Prueba rapida

1. Instalar/build de la app con Firebase configurado.
2. Iniciar sesion y aceptar permisos de notificaciones.
3. Revisar en backend que se cree un registro en `push_tokens`.
4. Generar una accion: nuevo mensaje, pedido confirmado o pedido disponible para delivery.
5. Confirmar que aparece notificacion interna y push en el dispositivo.
