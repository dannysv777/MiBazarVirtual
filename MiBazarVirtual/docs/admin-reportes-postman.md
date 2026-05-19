# Admin y reportes para Postman

Este documento resume la logica admin que queda preparada para demostracion sin construir un panel visual. La idea es mostrar que MiBazarVirtual ya contempla una capa de administracion para la empresa, pero que por ahora se prueba desde Postman.

## 1. Credencial admin demo

```text
Email: admin@mibazarvirtual.com
Password: Password123!
```

Primero iniciar sesion:

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "admin@mibazarvirtual.com",
  "password": "Password123!"
}
```

Copiar el `accessToken` y usarlo en los siguientes endpoints:

```text
Authorization: Bearer <accessToken>
```

## 2. Resumen general del sistema

```http
GET /api/admin/reports/overview
```

Devuelve contadores generales para administracion:

- usuarios totales,
- compradores,
- vendedores,
- repartidores,
- tiendas activas/pendientes/suspendidas,
- productos activos/agotados,
- pedidos por estado,
- ingresos entregados,
- fees de delivery,
- registros de pago internos,
- comision acumulada de plataforma,
- payout estimado a vendedores.

Uso para presentacion:

> Este endpoint demuestra que la empresa puede monitorear el estado global del marketplace desde una capa admin, aunque todavia no construimos el dashboard visual.

## 3. Reporte por tienda

```http
GET /api/admin/reports/stores
```

Devuelve una lista por tienda:

- id de tienda,
- nombre de tienda,
- correo del vendedor,
- estado de aprobacion,
- pedidos totales,
- pedidos entregados,
- ventas entregadas,
- cantidad de productos.

Uso para presentacion:

> Este reporte permite ver que vendedores generan mas ventas, que tiendas estan activas y cuales necesitan revision.

## 4. Pedidos desde admin

```http
GET /api/admin/orders?page=0&size=20
```

Filtros opcionales:

```http
GET /api/admin/orders?status=CONFIRMED
GET /api/admin/orders?storeId=1
GET /api/admin/orders?status=DELIVERED&storeId=1
```

Uso para presentacion:

> Admin puede consultar pedidos globalmente, por estado o por tienda, sin depender de la vista del comprador o vendedor.

## 5. Aprobacion de tiendas

```http
PUT /api/admin/stores/{id}/approve
```

Suspender/desactivar tienda:

```http
DELETE /api/admin/stores/{id}
```

Uso para presentacion:

> El administrador puede aprobar vendedores antes de que su tienda quede activa en el marketplace.

## 6. Categorias

Crear categoria:

```http
POST /api/admin/categories
```

Actualizar categoria:

```http
PUT /api/admin/categories/{id}
```

Eliminar categoria:

```http
DELETE /api/admin/categories/{id}
```

## 7. Credencial delivery demo

La migracion `V13__fix_delivery_demo_user.sql` asegura que el usuario demo de repartidor exista y tenga la misma contraseña demo que el resto.

```text
Email: delivery@mibazarvirtual.com
Password: Password123!
```

Endpoints delivery para Postman:

```http
GET /api/delivery/orders/available
GET /api/delivery/orders/mine
PATCH /api/delivery/orders/{orderId}/accept
PATCH /api/delivery/orders/{orderId}/pickup
PATCH /api/delivery/orders/{orderId}/deliver
```

