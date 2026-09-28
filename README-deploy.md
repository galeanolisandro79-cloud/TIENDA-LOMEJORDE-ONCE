# LO MEJOR DE ONCE — Ahora en Zona Sur (tienda pública)

Esta es la tienda online, un servicio **separado** del Sistema de GENET (admin +
punto de venta), pero que **comparte la misma base de datos**: el catálogo de
productos es uno solo, y los pedidos que entran acá se ven en la pestaña
"Pedidos" del sistema de administración.

Nada de esto necesita login — cualquiera que entre a la tienda puede ver los
productos y hacer un pedido dejando su nombre, teléfono y dirección. El pago
se coordina después (transferencia, efectivo, como prefieras), no se cobra
online.

## Antes de desplegar: actualizá primero el sistema de administración

Este cambio agregó fotos de producto y una tabla nueva de pedidos. Subí primero
los archivos de la carpeta `genet-admin` (que están en este mismo paquete) a tu
repositorio de GitHub existente del Sistema de GENET, reemplazando lo que ya
tenías, y dejalo redesplegado y funcionando antes de seguir con la tienda.

## Paso a paso para desplegar la tienda

### 1. Creá un repositorio de GitHub nuevo
Uno distinto al del Sistema de GENET — son dos servicios separados. Subí ahí
todos los archivos de la carpeta `tienda-lomejor`:
```
server.js
db.js
package.json
.gitignore
public/index.html
```

### 2. Creá un nuevo Web Service en Render
- Dashboard → **New +** → **Web Service**.
- Conectá el repositorio nuevo que acabás de crear.
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Conectala a la MISMA base de datos que ya tenés
No crees una base de datos nueva — este servicio tiene que usar la misma
donde ya están tus productos.
- Andá a tu base de datos Postgres existente (la que usa el Sistema de GENET) → **Connections** → copiá la **Internal Database URL** (si da el mismo error de conexión que tuvimos antes, usá la **External Database URL**).
- En este nuevo Web Service → **Environment** → agregá `DATABASE_URL` con ese mismo valor.

No hacen falta `ADMIN_USER`, `ADMIN_PASSWORD` ni `JWT_SECRET` acá — la tienda no tiene login.

### 4. Desplegá
Al arrancar vas a ver en los logs:
```
Tienda LO MEJOR DE ONCE corriendo en el puerto XXXX
```

### 5. Probala
- Abrí la URL que te da Render para este servicio — ahí está la tienda.
- Los productos que ya cargaste en el admin (con o sin foto) van a aparecer automáticamente.
- Hacé un pedido de prueba, y confirmá que aparece en la pestaña **Pedidos** del Sistema de GENET.

## Cómo se reparten los datos

| | Sistema de GENET (admin) | Tienda LO MEJOR DE ONCE |
|---|---|---|
| Carga y edita productos (con foto) | ✅ | ❌ (solo lectura) |
| Vende por mostrador, descuenta stock | ✅ | — |
| Ve y gestiona pedidos online | ✅ (pestaña Pedidos) | — |
| Cliente navega y hace pedidos | — | ✅ (sin login) |
| Base de datos | Misma | Misma |

## Cuando tengas un dominio propio

Arrancamos con el link gratuito de Render (`algo.onrender.com`). Cuando
compres un dominio (ej: lomejordeonceonline.com.ar), en Render → tu Web
Service → **Settings → Custom Domain**, lo agregás ahí y seguís las
instrucciones para apuntar el DNS. Avisame cuando lo tengas y te ayudo con
ese paso.

## Próximos pasos posibles (opcionales)

- **Cobro online con Mercado Pago**: se puede agregar más adelante sin rehacer la tienda.
- **Costo de envío por zona**: hoy no se calcula, el pedido llega sin costo de envío incluido — se puede sumar si lo necesitás.
- **Notificación automática** (WhatsApp o email) cuando entra un pedido nuevo, en vez de tener que revisar la pestaña de Pedidos manualmente.
