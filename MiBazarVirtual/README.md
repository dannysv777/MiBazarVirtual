# MiBazarVirtual

Marketplace de alimentos desarrollado como proyecto de grado de Ingenieria en Sistemas.

## Estado Actual

El backend ya esta desplegado en Railway y expone datos reales de demostracion. El proyecto ya incluye catalogo, recomendaciones, favoritos, chat, notificaciones internas, carrito multi-tienda, pedidos multi-vendedor, flujo de vendedor, flujo de repartidor y estructura visual de billetera/pagos.

- Backend publico: https://mibazarvirtual-production.up.railway.app
- Health check: https://mibazarvirtual-production.up.railway.app/actuator/health
- Base de datos: MySQL en Railway
- Migraciones: Flyway
- Deploy: Railway conectado al repositorio GitHub
- Resumen para presentacion: `docs/estado-actual-implementacion.md`

## Stack

- Backend: Spring Boot 3.5.x, Java 17, Maven
- Base de datos: MySQL 8 compatible
- ORM: Spring Data JPA + Hibernate
- Migraciones: Flyway
- Seguridad: Spring Security + JWT + refresh tokens
- Chat: Spring WebSockets + STOMP
- Frontend: React Native + Expo
- Deploy: Railway

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

Flyway crea tablas y carga los datos demo automaticamente:

```text
V1__initial_schema.sql
V2__seed_demo_data.sql
V3__views_and_triggers.sql
```

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

El servicio backend debe usar:

```text
Root Directory: MiBazarVirtual/backend
Build Command: mvn clean package -DskipTests
Start Command: java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Variables del backend:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:mysql://<host>:<port>/<database>?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DATABASE_USERNAME=<mysql_user>
DATABASE_PASSWORD=<mysql_password>
JWT_SECRET=<secret_largo_minimo_32_caracteres>
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
```

En Railway no usar `MYSQL_URL` directamente como `DATABASE_URL`, porque suele venir como `mysql://...`. Spring Boot necesita formato JDBC: `jdbc:mysql://...`.

## Pendientes Proximos

- Probar el flujo completo comprador -> vendedor -> delivery en dispositivos reales.
- Conectar notificaciones push cuando se implemente el modulo correspondiente.
- Agregar reportes reales para vendedores.
- Endurecer pruebas automatizadas para pedidos multi-vendedor.
- Integrar Stripe u otro proveedor cuando se active pago real.
