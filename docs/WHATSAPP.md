# Flujo de pedidos por WhatsApp en instalación local

StockFlow no necesita dominio para este flujo. El PC abre WhatsApp con mensajes listos para que el administrador los revise y envíe.

1. En **Clientes**, abre la ficha del cliente y selecciona **Enviar bienvenida y menú de categorías por WhatsApp**. Así comparte un menú breve aunque el inventario tenga muchos productos.
2. Cuando el cliente elija una categoría, usa **Enviar [categoría]** en esa misma ficha. El mensaje incluye los productos, detalles, precios, existencias y un código corto para cada producto.
3. El cliente arma su selección y responde con un mensaje estructurado, por ejemplo: `SF1|573001234567|ABC123:2,DEF456:1|FIN`. `ABC123` y `DEF456` son los códigos mostrados junto a los productos; las cifras son las cantidades.
4. El administrador copia el mensaje completo y lo pega en **Venta Rápida → Registrar pedido de WhatsApp con código**. StockFlow identifica al cliente por su teléfono registrado, valida los productos y existencias, crea el pedido **PENDIENTE** y muestra el número del pedido. Ingresar de nuevo el mismo código no duplica el pedido.
5. Al preparar el pedido, el administrador lo marca **LISTO** y abre WhatsApp con un aviso preparado. Puede registrar efectivo o transferencia y, cuando el cliente lo recoja, marcarlo como recogido.

Los pedidos pendientes no descuentan existencias. El inventario se descuenta al registrar la venta en POS cuando se entrega el pedido.

## Límite de WhatsApp local

Un programa local no puede leer mensajes entrantes de WhatsApp automáticamente. El cliente selecciona productos respondiendo en el chat, y el administrador copia su código final a Venta Rápida. Para importar el pedido sin copiar el código se requiere una integración de WhatsApp Business con un webhook publicado en una dirección HTTPS accesible desde Internet.

Si el número todavía no está registrado en **Clientes**, registra primero al cliente y su teléfono; StockFlow necesita ese registro para asociar el código con su cuenta.
