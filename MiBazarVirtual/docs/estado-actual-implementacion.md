# Estado actual de implementacion

Este documento resume lo que MiBazarVirtual tiene integrado hasta este momento y como funcionan los flujos principales. La intencion es que el equipo pueda usarlo para estudiar, explicar la presentacion y coordinar nuevas tareas sin perderse entre frontend, backend y base de datos.

## 1. Vision general

MiBazarVirtual es un marketplace movil para un mercado municipal. La app permite que compradores encuentren productos, compren a varios vendedores en un mismo pedido, hablen por chat, guarden favoritos, reciban notificaciones internas y gestionen una compra semanal. Tambien existe un rol de repartidor para aceptar pedidos confirmados y llevarlos al cliente.

El sistema esta dividido asi:

- Backend: Spring Boot, Java, Spring Security, JWT, JPA/Hibernate, MySQL y Flyway.
- Frontend: React Native con Expo, Context API, Axios, AsyncStorage y navegacion por roles.
- Base de datos: migraciones Flyway desde `V1` hasta `V12`.
- Despliegue: backend en Railway conectado al repositorio GitHub.

## 2. Roles de usuario

El backend maneja estos roles:

```text
BUYER    -> comprador
SELLER   -> vendedor
DELIVERY -> repartidor
ADMIN    -> administracion
```

En el frontend, la navegacion cambia segun el rol:

- Comprador: Inicio, Buscar, Favoritos, Carrito, Pedidos, Mensajes, Perfil.
- Vendedor: Inicio, Mis Productos, Pedidos, Mensajes, Perfil.
- Repartidor: Delivery, Perfil.

Esto evita que un vendedor vea funciones de compra como carrito o favoritos, y que un repartidor entre a pantallas que no corresponden a su trabajo.

## 3. Autenticacion y sesion

La autenticacion usa JWT y refresh tokens.

Flujo principal:

1. El usuario inicia sesion desde el frontend.
2. El backend devuelve `accessToken`, `refreshToken` y datos del usuario.
3. El frontend guarda la sesion y Axios agrega `Authorization: Bearer <token>` a las peticiones protegidas.
4. Las rutas protegidas del backend validan el token con Spring Security.

Ajuste importante ya implementado:

- El interceptor de Axios no agrega un token viejo a `/api/auth/login`.
- Antes de iniciar sesion se limpian tokens anteriores.

Esto corrige el problema donde aparecia "tu sesion expiro" incluso despues de reiniciar.

## 4. Productos, tiendas e imagenes

Los productos tienen datos principales como nombre, descripcion, precio, unidad, stock, categoria, tienda e imagen.

Campos usados para imagen:

```text
coverImage
imageUrl
```

En frontend se normaliza la imagen para que el producto pueda mostrarse tanto en tarjetas como en detalle. Tambien se integro soporte para carga de imagenes con Cloudinary desde el backend.

Cloudinary se usa para:

- Fotos de productos.
- Imagen de portada del producto.
- Preparacion para imagenes de perfil u otros recursos.

La idea es que el backend reciba la imagen, la suba a Cloudinary y guarde la URL publica en la entidad correspondiente.

## 5. Recomendaciones y descubrimiento

Se agrego un modulo de recomendaciones para evitar que la app muestre siempre los mismos productos.

Endpoints principales:

```text
GET /api/recommendations/feed
GET /api/recommendations/stores
GET /api/recommendations/similar
GET /api/recommendations/trending
GET /api/recommendations/for-you
```

La logica busca combinar:

- Productos recientes.
- Tendencias por pedidos.
- Diversidad de categorias.
- Diversidad de tiendas.
- Personalizacion segun historial del comprador.
- Rotacion justa para que no aparezcan siempre los mismos vendedores.

En frontend:

- Home usa recomendaciones para productos destacados y tiendas.
- ProductDetail muestra "Tambien te puede gustar".
- ProductList usa tendencias cuando no hay busqueda activa.
- WeeklyPurchase usa sugerencias relacionadas con productos agregados.

## 6. Favoritos

El comprador puede guardar productos favoritos.

Backend:

```text
POST /api/favorites/{productId}
GET /api/favorites
GET /api/favorites/{productId}/check
```

Frontend:

- `FavoriteButton` muestra corazon lleno o vacio.
- `FavoritesScreen` lista los productos guardados.
- ProductDetail permite marcar o quitar favorito.
- ProductCard puede mostrar corazon cuando la pantalla lo necesita.

Los favoritos tambien sirven para futuras notificaciones, por ejemplo cuando un producto agotado vuelve a tener stock.

## 7. Carrito multi-tienda

Antes el carrito tenia una restriccion de una sola tienda. Ahora permite productos de varios vendedores.

El estado principal vive en `CartContext`.

State principal:

```text
items: [
  {
    id,
    name,
    price,
    unit,
    imageUrl,
    quantity,
    storeId,
    storeName
  }
]
```

Valores calculados con `useMemo`:

```text
itemCount     -> cantidad total de unidades
subtotal      -> suma de precio * cantidad
itemsByStore  -> productos agrupados por tienda
total(type)   -> subtotal + envio si aplica
cartPulseKey  -> activa animacion del tab de carrito
```

Persistencia:

- El carrito se guarda en AsyncStorage por usuario.
- La llave incluye el `userId`, asi cada usuario tiene su propio carrito local.

Reglas del carrito:

- Productos de cualquier tienda pueden coexistir.
- Si hay mas de una tienda, se fuerza delivery.
- Pickup queda visualmente restringido para pedidos multi-vendedor.

## 8. Checkout visual y confirmacion de pedido

El carrito muestra:

- Productos agrupados por tienda.
- Subtotal por vendedor.
- Envio.
- Total general.
- Direccion.
- Notas.
- Metodo de pago visual.

Metodo de pago:

- Contra entrega esta disponible y sigue siendo el metodo real.
- Tarjeta guardada aparece como opcion visual, preparada para Stripe.
- No hay cobro real con tarjeta.

Al confirmar el pedido:

1. El frontend envia productos y cantidades.
2. El backend crea el pedido.
3. El carrito se limpia.
4. El usuario ve `OrderConfirmationScreen`.

La pantalla de confirmacion muestra:

- Numero de pedido.
- Cantidad de productos.
- Cantidad de vendedores.
- Total.
- Tipo de entrega.
- Pasos siguientes del flujo.

## 9. Pedidos multi-vendedor

El modelo de negocio ahora permite que un comprador pida productos de varios vendedores en un solo pedido.

Antes:

```text
Un pedido = una tienda
```

Ahora:

```text
Un pedido = varias tiendas
Cada item sabe a que tienda pertenece
```

### Estados del pedido

El estado general vive en la entidad `Order`.

```text
PENDING
PARTIALLY_CONFIRMED
CONFIRMED
READY_FOR_PICKUP
IN_PROGRESS
DELIVERED
CANCELLED
```

Significado:

- `PENDING`: pedido creado, esperando respuesta de vendedores.
- `PARTIALLY_CONFIRMED`: algunos items ya fueron confirmados, otros siguen pendientes.
- `CONFIRMED`: los vendedores ya respondieron y el pedido puede pasar a delivery.
- `READY_FOR_PICKUP`: un repartidor acepto el pedido.
- `IN_PROGRESS`: el repartidor esta recogiendo o llevando el pedido.
- `DELIVERED`: pedido entregado al cliente.
- `CANCELLED`: pedido cancelado.

### Estados por item

Cada `OrderItem` tiene estado propio:

```text
PENDING
CONFIRMED
REJECTED
```

Esto permite que un vendedor confirme solo sus productos. Si un producto no esta disponible, se rechaza ese item sin romper todo el pedido.

### Flujo general

```text
Comprador crea pedido
  |
  v
Order = PENDING
Items = PENDING
  |
  v
Cada vendedor confirma o rechaza sus items
  |
  v
Si todos respondieron, Order = CONFIRMED
  |
  v
Delivery acepta pedido
  |
  v
READY_FOR_PICKUP -> IN_PROGRESS -> DELIVERED
```

## 10. Panel de pedidos del vendedor

El vendedor tiene una pantalla dedicada:

```text
SellerOrdersScreen
```

Esta pantalla ya no intenta hacer el flujo completo de entrega. El vendedor solo participa en la disponibilidad de sus productos.

Estados visibles para vendedor:

- Todos.
- Pendientes.
- Confirmados.

Acciones del vendedor:

- Confirmar item disponible.
- Marcar item como no disponible con nota opcional.

Ya se removio de la experiencia del vendedor la accion de marcar como "en camino" o "entregado", porque eso pertenece al repartidor.

## 11. Rol delivery

Se agrego el rol `DELIVERY` para repartidores.

Endpoint base:

```text
/api/delivery
```

Endpoints principales:

```text
GET /api/delivery/orders/available
GET /api/delivery/orders/mine
PATCH /api/delivery/orders/{orderId}/accept
PATCH /api/delivery/orders/{orderId}/pickup
PATCH /api/delivery/orders/{orderId}/deliver
```

Flujo del repartidor:

1. Ve pedidos disponibles con estado `CONFIRMED`.
2. Acepta uno.
3. El pedido pasa a `READY_FOR_PICKUP`.
4. Marca pickup/en camino.
5. El pedido pasa a `IN_PROGRESS`.
6. Marca entregado.
7. El pedido pasa a `DELIVERED`.

El frontend tiene pantalla:

```text
DeliveryOrdersScreen
```

Credencial demo:

```text
Email: delivery@mibazarvirtual.com
Password: password
```

## 12. Notificaciones internas

Se agrego un modulo real de notificaciones internas.

Endpoints:

```text
GET /api/notifications
GET /api/notifications/unread-count
PATCH /api/notifications/read-all
PATCH /api/notifications/{id}/read
DELETE /api/notifications/{id}
```

Tipos de notificacion:

```text
ORDER_CONFIRMED
ORDER_IN_PROGRESS
ORDER_DELIVERED
ORDER_CANCELLED
NEW_MESSAGE
NEW_ORDER_RECEIVED
REVIEW_RECEIVED
PRODUCT_BACK_IN_STOCK
DELIVERY_AVAILABLE
```

Frontend:

- `NotificationContext` mantiene `unreadCount`.
- Home muestra badge en la campana.
- `NotificationsScreen` lista, marca como leida y permite eliminar.

Uso esperado:

- Avisar al comprador cambios en su pedido.
- Avisar al vendedor cuando recibe pedido.
- Avisar al repartidor cuando hay un pedido disponible.
- Avisar mensajes nuevos y futuras novedades.

## 13. Chat

El chat ya esta documentado con mas detalle en:

```text
docs/chat-backend.md
```

Resumen:

- REST se usa para crear conversaciones, listar conversaciones y cargar historial.
- WebSocket/STOMP se usa para mensajes en tiempo real.
- Los mensajes se guardan primero en MySQL y luego se publican al canal WebSocket.
- El JWT se valida tambien al conectar WebSocket.
- Hay contador de mensajes no leidos.

## 14. Compra semanal

La compra semanal permite que el comprador arme una lista recurrente de productos.

Estado local:

```text
weekly_purchase
weekly_delivery_day
weekly_subscription_active
```

Comportamiento:

- El usuario puede activar un recordatorio semanal visual.
- Puede elegir dia programado.
- Puede agregar productos sugeridos.
- Puede mandar todos los productos al carrito.

La suscripcion todavia es visual/local. Sirve para presentar el flujo y queda lista para conectarse despues con notificaciones push o jobs programados.

## 15. Billetera y pagos visuales

Se agrego estructura de wallet sin procesamiento real de pagos.

Backend:

```text
GET    /api/wallet/cards
POST   /api/wallet/cards
DELETE /api/wallet/cards/{id}
PATCH  /api/wallet/cards/{id}/default
GET    /api/wallet/bank-account
POST   /api/wallet/bank-account
```

Tablas nuevas:

```text
saved_cards
seller_bank_accounts
order_payments
```

Comprador:

- Puede registrar una tarjeta visualmente.
- Solo se guardan alias, marca, ultimos 4 digitos y vencimiento.
- No se guardan datos sensibles.
- La primera tarjeta queda como principal.

Vendedor:

- Puede registrar cuenta bancaria.
- La cuenta se muestra enmascarada.
- Se deja lista la estructura para pagos semanales.

Pedidos:

- Cada pedido crea un registro en `order_payments`.
- Metodo actual: `CASH_ON_DELIVERY`.
- Comision visual/contable: 3%.
- No hay Stripe activo todavia.

## 16. Estado abierto/cerrado de tiendas

Se agrego utilidad para interpretar horarios de tienda:

```text
utils/storeSchedule.js
```

Componentes:

```text
StoreStatusBadge
```

Uso:

- StoreCard muestra si la tienda esta abierta o cerrada.
- StoreDetail muestra estado completo y horario.
- ProductDetail avisa si la tienda esta cerrada.
- Home ordena tiendas abiertas primero, sin ocultar las cerradas.

## 17. Pantallas principales implementadas

Comprador:

- Home con recomendaciones, tendencias, categorias, tiendas y campana.
- ProductList con busqueda y tendencias.
- ProductDetail con imagen, favoritos, similares y tienda.
- FavoritesScreen.
- CartScreen multi-tienda.
- OrderConfirmationScreen.
- OrdersScreen y OrderDetailScreen.
- WeeklyPurchaseScreen.
- NotificationsScreen.
- ConversationsScreen y ChatScreen.
- ProfileScreen con accesos a billetera, pedidos y favoritos.

Vendedor:

- SellerProductsScreen.
- Create/Edit/ProductForm.
- SellerStoreScreen.
- SellerOrdersScreen.
- ProfileScreen con acceso a tienda, pedidos recibidos y cuenta bancaria.

Repartidor:

- DeliveryOrdersScreen.
- ProfileScreen.

## 18. Manejo de estado en frontend

Contextos principales:

```text
AuthContext          -> usuario, token, login/logout, sesion
CartContext          -> carrito, agrupacion por tienda, totales
ChatContext          -> no leidos de chat y refresco
NotificationContext  -> no leidos de notificaciones internas
ToastContext         -> feedback visual global
```

AsyncStorage:

- Sesion del usuario.
- Carrito por usuario.
- Compra semanal.
- Preferencias simples como recordatorio semanal.

Pantallas:

- Usan `loading`, `refreshing`, `error` y estados locales para filtros.
- Las llamadas a API estan centralizadas en `src/api`.
- Las pantallas no deberian llamar Axios directamente.

## 19. Migraciones actuales

Migraciones principales del proyecto:

```text
V1  -> esquema inicial
V2  -> datos demo
V3  -> vistas/triggers auxiliares
V8  -> favoritos
V9  -> notificaciones
V10 -> refactor de pedidos multi-vendedor y delivery
V11 -> usuario demo delivery
V12 -> wallet, tarjetas, cuenta bancaria y pagos internos
```

Regla importante:

No modificar migraciones ya aplicadas en produccion. Si se necesita cambiar estructura, crear una nueva migracion.

## 20. Verificacion tecnica reciente

Antes del ultimo push a GitHub se valido:

```text
mvn clean test
expo export --platform android
```

Ambos pasaron correctamente.

Ultimo commit subido:

```text
f6ac414 feat: add multi-vendor orders delivery and wallet
```

## 21. Puntos importantes para la presentacion

Frase corta para explicar el avance:

> MiBazarVirtual ya no es solo un catalogo. Ahora funciona como un marketplace movil con compradores, vendedores y repartidores. Permite pedidos multi-vendedor, confirmacion por item, flujo de delivery, carrito agrupado por tienda, recomendaciones, favoritos, notificaciones internas, chat en tiempo real y una estructura visual de billetera preparada para pagos reales en el futuro.

Lo mas fuerte para demostrar:

- Comprar productos de varias tiendas en un solo carrito.
- Ver el pedido confirmado y enviado a vendedores.
- Entrar como vendedor y confirmar items recibidos.
- Entrar como delivery y aceptar/entregar pedidos.
- Mostrar favoritos, recomendaciones y notificaciones.
- Mostrar billetera/cuenta bancaria como preparacion para pagos.

## 22. Pendientes recomendados

Pendientes tecnicos razonables:

- Probar el flujo completo en dispositivos reales: comprador, vendedor y delivery.
- Revisar detalles visuales pequenos de OrderDetail y SellerOrders.
- Conectar notificaciones push cuando el equipo encargado lo implemente.
- Endurecer pruebas automatizadas para pedidos multi-vendedor.
- Agregar reportes reales para vendedores.
- Integrar Stripe u otro proveedor de pagos cuando el flujo visual ya este aprobado.

