# MiBazarVirtual

Marketplace de alimentos desarrollado como proyecto de grado de Ingenieria en Sistemas.

## Estado Actual

El backend ya esta desplegado en Railway y expone datos reales de demostracion. El proyecto ya incluye catalogo, recomendaciones, favoritos, chat en tiempo real, notificaciones internas y push Android, carrito multi-tienda, pedidos multi-vendedor, flujo de vendedor, flujo de repartidor y estructura visual de billetera/pagos.

- Backend publico: https://mibazarvirtual-production.up.railway.app
- Health check: https://mibazarvirtual-production.up.railway.app/actuator/health
- Base de datos: MySQL en Railway
- Migraciones: Flyway
- Deploy: Railway conectado al repositorio GitHub
- Resumen detallado para presentacion: `docs/estado-actual-implementacion.md`
- Push Android y prueba de Railway: `docs/push-notifications.md`
- APK Android para demo: `docs/android-apk-build.md`

## Stack

- Backend: Spring Boot 3.5.x, Java 17, Maven
- Base de datos: MySQL 8 compatible
- ORM: Spring Data JPA + Hibernate
- Migraciones: Flyway
- Seguridad: Spring Security + JWT + refresh tokens
- Chat: Spring WebSockets + STOMP
- Frontend: React Native + Expo
- Deploy: Railway

## Resumen Para Exponer

MiBazarVirtual se plantea como un marketplace movil para un mercado municipal. No se limita a mostrar productos: integra compradores, vendedores y repartidores en un mismo flujo.

Puntos fuertes que se pueden demostrar:

- El comprador descubre productos y tiendas con recomendaciones, favoritos y busqueda.
- El carrito acepta productos de varias tiendas y arma un solo pedido multi-vendedor.
- Cada vendedor confirma o rechaza solo sus items; la entrega ya no depende del vendedor.
- El repartidor acepta pedidos confirmados, marca recoleccion y entrega.
- El chat permite conversar en tiempo real sobre productos o pedidos.
- Las notificaciones internas y push avisan mensajes, pedidos y eventos relevantes.
- La billetera y cuenta bancaria dejan estructura lista para pagos futuros sin procesar dinero real todavia.

### Como Se Divide El Sistema

```text
React Native + Expo
  -> pantallas, navegacion por rol, Context API, AsyncStorage, Axios

Spring Boot
  -> reglas de negocio, seguridad JWT, REST, WebSocket/STOMP, notificaciones

MySQL + Flyway
  -> persistencia, migraciones versionadas y datos demo

Railway + Cloudinary + Firebase
  -> despliegue backend, imagenes y push Android
```

### Manejo De Estado En Frontend

El frontend usa `useState` para estado local de cada pantalla y `Context API` cuando varios modulos necesitan compartir datos.

Contextos principales:

| Contexto | Responsabilidad |
| --- | --- |
| `AuthContext` | Sesion, usuario autenticado, rol y login/logout. |
| `CartContext` | Items del carrito, agrupacion por tienda, cantidades, subtotal y total. |
| `ChatContext` | Conexion STOMP, mensajes no leidos y suscripciones a conversaciones. |
| `NotificationContext` | Contador no leido, registro de push tokens y refresco de notificaciones. |
| `ToastContext` | Feedback visual reutilizable para acciones exitosas o errores. |

Persistencia local con `AsyncStorage`:

- Tokens de sesion y refresh.
- Carrito separado por usuario.
- Compra semanal y dia de recordatorio.
- Preferencias simples y apoyo a recomendaciones.

Idea para explicarlo:

> Usamos estado local cuando solo una pantalla lo necesita y contextos cuando el dato debe sobrevivir a la navegacion o afectar varias pantallas, como sesion, carrito, chat y notificaciones.

### Base De Datos

La base es MySQL. El backend usa JPA/Hibernate para mapear entidades y Flyway para evolucionar el esquema sin editar migraciones ya desplegadas.

Tablas y relaciones notorias:

- `users`, `stores`, `products`, `categories` para catalogo y roles.
- `orders` y `order_items` para pedidos multi-vendedor.
- `conversations` y `messages` para chat persistente.
- `notifications` y `push_tokens` para avisos internos y push.
- `favorites`, `saved_cards`, `seller_bank_accounts`, `order_payments` para experiencia de usuario y estructura futura de pagos.

Los items de pedido guardan su tienda y su estado propio. Por eso un pedido puede tener varios vendedores y cada vendedor responde solo por sus productos.

### Mensajeria

La mensajeria mezcla REST y WebSocket:

1. REST crea o recupera conversaciones y carga historial.
2. Al enviar, el backend guarda primero el mensaje en MySQL.
3. STOMP publica el nuevo mensaje al canal de la conversacion para que aparezca en tiempo real.
4. El receptor obtiene contador de no leidos y una notificacion `NEW_MESSAGE`.

Esto permite conservar historial aunque el usuario se desconecte, pero seguir teniendo experiencia en tiempo real cuando esta conectado.

### Notificaciones Internas Y Push

El backend centraliza avisos en `NotificationService`.

Flujo:

1. Una accion de negocio ocurre, por ejemplo mensaje nuevo o cambio de pedido.
2. Se crea una notificacion interna en MySQL.
3. `NotificationContext` actualiza badges y bandeja en frontend.
4. Si el usuario tiene token registrado, el backend intenta push.

Push actual:

- Android registra token nativo FCM y el backend envia con Firebase Admin desde Railway.
- Railway guarda la credencial privada en `FIREBASE_SERVICE_ACCOUNT_JSON` o `FIREBASE_SERVICE_ACCOUNT_BASE64`.
- El endpoint `POST /api/push-tokens/test` permite probar si existe token Android y si Firebase esta configurado.
- iOS conserva la base para integracion futura por Expo/APNs, pero la demo push se enfoca en Android.

### Seguridad Y API

- Spring Security protege endpoints con JWT.
- Axios adjunta `Authorization: Bearer <accessToken>` a rutas protegidas.
- WebSocket valida JWT en el frame STOMP `CONNECT`.
- Las pantallas usan archivos de `frontend/src/api` para llamadas HTTP, de modo que la UI no quede acoplada a Axios directamente.

### Guion Corto De Demo

1. Entrar como comprador, mostrar home, producto, favorito, chat y carrito multi-tienda.
2. Confirmar pedido y mostrar la pantalla de confirmacion.
3. Entrar como vendedor, mostrar productos, tienda y pedidos recibidos; confirmar items.
4. Entrar como delivery, aceptar pedido y avanzar a entrega.
5. Mostrar notificaciones, chat y la estructura de billetera/cuenta bancaria.

## Cloudinary

El backend sube imagenes de productos a Cloudinary desde `POST /api/upload/image`.
Configura estas variables de entorno antes de iniciar la API:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

En Railway, agrega las mismas variables en el servicio del backend. En local puedes definirlas en la terminal antes de ejecutar Spring Boot.

## Estructura

```text
MiBazarVirtual/
  backend/    API Spring Boot
  frontend/   App movil React Native + Expo
  database/   SQL auxiliar
  docs/       Postman, documentacion y entregables
```

## Backend Local

Entrar al backend:

```powershell
cd "C:\Users\Danny\Documents\New project\MiBazarVirtual\backend"
```

Levantar la API:

```powershell
mvn spring-boot:run
```

La API local queda en:

```text
http://localhost:8080
```

El perfil local `dev` usa:

```text
Base local: mibazarvirtual_demo_db
Usuario: root
Password: 12345
```

Flyway crea tablas, aplica cambios incrementales y carga datos demo automaticamente. Las primeras migraciones son:

```text
V1__initial_schema.sql
V2__seed_demo_data.sql
V3__views_and_triggers.sql
```

El esquema actual ya incluye migraciones posteriores para favoritos, notificaciones, pedidos multi-vendedor, delivery, wallet, conversaciones directas y push tokens. Regla del equipo: si una migracion ya se ejecuto en produccion, no se edita; se crea una nueva.

## Endpoints Publicos

Estos endpoints no requieren token:

```text
GET /actuator/health
GET /api/categories
GET /api/stores
GET /api/stores/{storeId}
GET /api/stores/{storeId}/products?page=0&size=20
GET /api/products?page=0&size=20
GET /api/products?q=tomate&page=0&size=20
GET /api/products?categoryId=1&page=0&size=20
GET /api/products/{productId}
```

Ejemplos en produccion:

```text
https://mibazarvirtual-production.up.railway.app/api/products
https://mibazarvirtual-production.up.railway.app/api/categories
https://mibazarvirtual-production.up.railway.app/api/stores
```

## Autenticacion

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

El login devuelve:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 7,
    "username": "carlos_buyer",
    "email": "carlos.lopez@gmail.com",
    "fullName": "Carlos Lopez",
    "role": "BUYER"
  }
}
```

Para endpoints protegidos usar:

```text
Authorization: Bearer <accessToken>
```

## Credenciales Demo

Password para todos los usuarios seed:

```text
Password123!
```

Usuarios compradores:

```text
carlos.lopez@gmail.com
maria.perez@gmail.com
jose.ramos@gmail.com
```

Usuarios vendedores:

```text
pedro.gonzalez@gmail.com
rosa.martinez@gmail.com
rancho.verde@gmail.com
sanjose.pan@gmail.com
altiplano.lacteos@gmail.com
```

Admin:

```text
admin@mibazarvirtual.com
```

## Chat

REST:

```text
POST /api/conversations/start
GET /api/conversations
GET /api/conversations/{conversationId}/messages?page=0&size=30
GET /api/conversations/unread-count
```

WebSocket/STOMP:

```text
Endpoint: /ws
App prefix: /app
Broker prefix: /topic
Send message: /app/chat.sendMessage
Typing: /app/chat.typing
Subscribe conversation: /topic/conversation/{conversationId}
Subscribe typing: /topic/conversation/{conversationId}/typing
```

El WebSocket requiere JWT en el frame `CONNECT` usando header `Authorization` o `token`.

## Notificaciones

Notificaciones internas:

```text
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/read-all
PATCH  /api/notifications/{notificationId}/read
DELETE /api/notifications/{notificationId}
```

Push tokens:

```text
POST   /api/push-tokens
DELETE /api/push-tokens
POST   /api/push-tokens/test
```

Tipos de aviso importantes:

```text
NEW_MESSAGE
NEW_ORDER_RECEIVED
ORDER_CONFIRMED
ORDER_IN_PROGRESS
ORDER_DELIVERED
DELIVERY_AVAILABLE
PRODUCT_BACK_IN_STOCK
```

## Postman

Coleccion:

```text
docs/postman/MiBazarVirtual.postman_collection.json
```

Cambiar la variable `baseUrl` segun ambiente:

```text
Local:      http://localhost:8080
Railway:   https://mibazarvirtual-production.up.railway.app
```

## Railway

El servicio backend debe usar la carpeta raiz del backend. El repo incluye `backend/Procfile` con limites JVM para Railway:

```text
Root Directory: MiBazarVirtual/backend
Build Command: mvn clean package -DskipTests
Procfile: java -Xms96m -Xmx256m -XX:MaxMetaspaceSize=160m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -jar target/backend-0.0.1-SNAPSHOT.jar
```

Si Railway tiene un `Start Command` manual en el panel, ese comando puede reemplazar el `Procfile`. En ese caso usar el mismo comando con limites JVM o dejar el Start Command vacio para que Railpack tome el `Procfile`.

Variables del backend:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:mysql://<host>:<port>/<database>?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DATABASE_USERNAME=<mysql_user>
DATABASE_PASSWORD=<mysql_password>
JWT_SECRET=<secret_largo_minimo_32_caracteres>
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
FIREBASE_SERVICE_ACCOUNT_JSON=<json_admin_firebase_para_push_android>
# Alternativa si Railway requiere una sola linea:
FIREBASE_SERVICE_ACCOUNT_BASE64=<json_admin_firebase_en_base64>
```

En Railway no usar `MYSQL_URL` directamente como `DATABASE_URL`, porque suele venir como `mysql://...`. Spring Boot necesita formato JDBC: `jdbc:mysql://...`.

## Pendientes Proximos

- Probar el flujo completo comprador -> vendedor -> delivery en dispositivos reales.
- Validar push Android en la APK final de presentacion.
- Completar push iOS con Expo/APNs si la demo futura lo requiere.
- Agregar reportes reales para vendedores.
- Endurecer pruebas automatizadas para pedidos multi-vendedor.
- Integrar Stripe u otro proveedor cuando se active pago real.
