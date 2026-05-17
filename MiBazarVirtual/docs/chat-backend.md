# Documentacion del backend del chat

Este documento explica como esta implementado el chat de MiBazarVirtual desde el backend. La idea principal es que el chat usa dos formas de comunicacion:

- REST: para crear conversaciones, listar conversaciones, cargar historial y contar mensajes no leidos.
- WebSocket con STOMP: para enviar y recibir mensajes en tiempo real.

## 1. Que problema resuelve el chat

El chat permite que un comprador hable con un vendedor sobre un producto. Por ejemplo:

1. El comprador entra al detalle de un producto.
2. Presiona el boton para chatear con el vendedor.
3. La app crea o recupera una conversacion existente.
4. Se abre la pantalla del chat.
5. Los mensajes se guardan en la base de datos.
6. Si ambos usuarios estan conectados, el mensaje llega en tiempo real.

Esto es mas complejo que una pantalla normal porque no basta con guardar datos. Tambien hay que mantener una conexion abierta para recibir mensajes al instante.

## 2. Archivos principales

Los archivos mas importantes del backend son:

- `chat/ChatController.java`: recibe las peticiones REST y los eventos WebSocket.
- `chat/ChatService.java`: contiene la logica de negocio del chat.
- `config/WebSocketConfig.java`: configura STOMP, los canales y el endpoint `/ws`.
- `config/JwtChannelInterceptor.java`: valida el JWT cuando un usuario se conecta por WebSocket.
- `entity/Conversation.java`: representa una conversacion.
- `entity/Message.java`: representa un mensaje individual.
- `repository/ConversationRepository.java`: consultas de conversaciones.
- `repository/MessageRepository.java`: consultas de mensajes, mensajes no leidos y limpieza.
- `chat/dto/*`: objetos simples que entran o salen hacia el frontend.

## 3. Modelo de datos

### Conversation

Una conversacion representa el hilo entre un comprador y un vendedor.

Campos principales:

- `buyer`: usuario comprador.
- `seller`: usuario vendedor.
- `product`: producto que dio origen al chat.
- `createdAt`: fecha de creacion.
- `updatedAt`: fecha de ultima actividad.

La tabla tiene una restriccion unica por:

```text
buyer_id + seller_id + product_id
```

Eso evita duplicar conversaciones iguales para el mismo comprador, vendedor y producto.

En la logica actual de la app, cuando el comprador ya tiene un chat con el vendedor, se reutiliza la conversacion mas reciente entre ambos. El producto se conserva como contexto inicial del chat.

### Message

Un mensaje pertenece a una conversacion.

Campos principales:

- `conversation`: conversacion a la que pertenece.
- `sender`: usuario que envio el mensaje.
- `content`: texto del mensaje.
- `read`: indica si el receptor ya lo leyo.
- `createdAt`: fecha en que fue enviado.

Cada mensaje se guarda en MySQL. WebSocket solo se usa para avisar en tiempo real, no reemplaza la base de datos.

## 4. Flujo para iniciar un chat

Cuando el comprador toca el boton de chat en un producto, el frontend llama:

```http
POST /api/conversations/start
```

Con un cuerpo parecido a:

```json
{
  "productId": 1,
  "sellerId": 2
}
```

El backend hace esto:

1. Identifica al comprador usando el JWT.
2. Busca si ya existe una conversacion entre comprador y vendedor.
3. Si existe, la devuelve.
4. Si no existe, crea una nueva conversacion.
5. Antes de crearla, verifica que el vendedor realmente sea dueño del producto.

Esa verificacion es importante porque evita que un cliente malicioso diga: "quiero abrir chat con este vendedor sobre un producto que no le pertenece".

El resultado es un `ConversationDTO`, que tiene los datos necesarios para abrir la pantalla del chat.

## 5. Flujo para cargar conversaciones

Para mostrar la bandeja de mensajes, el frontend llama:

```http
GET /api/conversations
```

El backend busca todas las conversaciones donde el usuario participa como:

- comprador, o
- vendedor.

Luego las ordena por `updatedAt`, para que la conversacion mas reciente aparezca arriba.

Cada conversacion se convierte en `ConversationDTO`, que incluye:

- id de la conversacion,
- comprador,
- vendedor,
- producto,
- ultimo mensaje,
- fecha del ultimo mensaje,
- cantidad de no leidos,
- nombre del otro participante.

Esto evita que el frontend tenga que hacer calculos complicados.

## 6. Flujo para cargar mensajes

Cuando se abre una conversacion, el frontend llama:

```http
GET /api/conversations/{conversationId}/messages
```

Ejemplo:

```http
GET /api/conversations/5/messages?page=0&size=30
```

El backend hace esto:

1. Busca la conversacion.
2. Valida que el usuario actual participe en esa conversacion.
3. Devuelve los mensajes ordenados del mas antiguo al mas reciente.
4. Marca como leidos los mensajes enviados por la otra persona.

La validacion de participante es clave. Aunque alguien adivine el ID de una conversacion, no puede leerla si no es comprador o vendedor dentro de ese chat.

## 7. Envio de mensajes en tiempo real

Para enviar mensajes en tiempo real se usa WebSocket con STOMP.

La conexion WebSocket se abre en:

```text
/ws
```

STOMP organiza la comunicacion con destinos. En este proyecto usamos:

```text
/app/chat.sendMessage
```

para enviar mensajes al backend.

Y usamos:

```text
/topic/conversation/{conversationId}
```

para que los clientes reciban mensajes nuevos.

Ejemplo conceptual:

1. Carlos y Pedro se suscriben a:

```text
/topic/conversation/5
```

2. Carlos envia un mensaje a:

```text
/app/chat.sendMessage
```

3. El backend recibe el mensaje en `ChatController`.
4. `ChatService` guarda el mensaje en MySQL.
5. El backend publica el mensaje guardado en:

```text
/topic/conversation/5
```

6. Pedro lo recibe inmediatamente.

La parte importante es esta:

```text
El mensaje primero se guarda y luego se publica.
```

Asi no dependemos solo del tiempo real. Si el receptor no esta conectado, despues puede abrir la conversacion y cargar el historial desde la base de datos.

## 8. Indicador "esta escribiendo"

El chat tambien tiene un evento para avisar que un usuario esta escribiendo:

```text
/app/chat.typing
```

Ese evento se publica en:

```text
/topic/conversation/{conversationId}/typing
```

A diferencia de los mensajes normales, este evento no se guarda en la base de datos. Es temporal. Solo sirve para mostrar algo como:

```text
Pedro esta escribiendo...
```

## 9. Seguridad con JWT en WebSocket

En peticiones REST normales, Spring Security valida el JWT con filtros HTTP.

Pero WebSocket funciona diferente. Despues de abrir la conexion, los mensajes ya no pasan igual por los filtros HTTP normales.

Por eso existe:

```text
JwtChannelInterceptor
```

Este interceptor revisa el primer frame STOMP `CONNECT`.

El frontend manda el token en un header como:

```text
Authorization: Bearer eyJ...
```

o:

```text
token: Bearer eyJ...
```

El interceptor:

1. Extrae el token.
2. Lo valida con `JwtTokenService`.
3. Crea un objeto de autenticacion.
4. Lo guarda como usuario de la sesion STOMP.

Gracias a eso, cuando llega un mensaje a:

```java
@MessageMapping("/chat.sendMessage")
```

el backend puede saber que usuario lo envio.

## 10. Mensajes no leidos

El sistema maneja mensajes no leidos con el campo:

```java
read
```

Cuando un mensaje se crea, nace con:

```java
read = false
```

Cuando el receptor abre la conversacion, el backend ejecuta una actualizacion para marcar como leidos los mensajes de la otra persona.

Tambien existe este endpoint:

```http
GET /api/conversations/unread-count
```

Devuelve algo como:

```json
{
  "unreadCount": 3
}
```

Eso sirve para mostrar badges o indicadores en el frontend.

## 11. Limpieza automatica de mensajes

El archivo:

```text
MessageRetentionScheduler.java
```

ejecuta una tarea programada todos los dias a las 3:00 AM.

Su funcion es eliminar mensajes con mas de 7 dias.

Esto se hizo para evitar que la tabla de mensajes crezca indefinidamente.

## 12. Resumen corto para explicarlo oralmente

Puedes explicarlo asi:

> El chat esta dividido en dos partes. Primero usamos endpoints REST para crear o recuperar una conversacion, listar conversaciones, cargar historial y contar mensajes no leidos. Despues usamos WebSocket con STOMP para que los mensajes lleguen en tiempo real. Cuando un usuario envia un mensaje, el backend valida que sea participante de la conversacion, guarda el mensaje en MySQL y luego lo publica en un canal `/topic/conversation/{id}`. Los usuarios conectados a ese canal lo reciben inmediatamente. Si no estan conectados, el mensaje queda guardado y lo pueden ver despues al cargar el historial. La seguridad del WebSocket se maneja con un interceptor que valida el JWT en el frame `CONNECT`.

## 13. Por que esta parte es de las mas complicadas

El chat es mas complicado que otros modulos porque combina:

- persistencia en base de datos,
- seguridad con JWT,
- validacion de participantes,
- endpoints REST,
- WebSocket en tiempo real,
- eventos temporales como "esta escribiendo",
- contador de mensajes no leidos,
- limpieza automatica de mensajes antiguos.

En un CRUD normal, el cliente pide datos y el servidor responde. En el chat, el servidor tambien tiene que empujar datos hacia clientes conectados en ese momento.

Esa es la diferencia principal.

## 14. Mapa mental del flujo

```text
Producto
  |
  | POST /api/conversations/start
  v
Conversacion creada o recuperada
  |
  | GET /api/conversations/{id}/messages
  v
Historial cargado
  |
  | WebSocket CONNECT /ws con JWT
  v
Cliente suscrito a /topic/conversation/{id}
  |
  | SEND /app/chat.sendMessage
  v
Backend guarda Message en MySQL
  |
  | publish /topic/conversation/{id}
  v
Otro usuario recibe el mensaje en tiempo real
```

