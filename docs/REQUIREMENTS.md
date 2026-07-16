# StockFlow Connect - Historias de Usuario + Criterios de Aceptación

## Módulo de Autenticación y Seguridad


# HU-001: Registro de Administrador

**Como** administrador de un comercio,
**Quiero** registrarme en la plataforma ingresando mi nombre, correo electrónico y contraseña,
**Para** disponer de una cuenta de acceso segura, privada y personalizada para gestionar mi negocio.

 Prioridad: Alta
Estimación: 5 Story Points
Componente: Autenticación / Backend-Frontend

Precondiciones:
El usuario no debe estar autenticado en la plataforma.

Debe encontrarse en la URL /registro.

Debe tener conexión a Internet.

Enlaces de Referencia:

[Diseño Figma - Pantalla Registro v2] (pendiente de definir)

[API Spec - Endpoint /api/auth/register] (se definirá en el diseño de la API)

**Criterios de Aceptación** (Formato BDD)

Escenario 1: Registro exitoso con datos válidos

Dado (Given) que el visitante se encuentra en el formulario de registro,

Cuando (When) completa los campos solicitados con un Nombre válido, un Correo no registrado (nuevo@negocio.com), una Contraseña de 8 caracteres y confirma exactamente la misma contraseña, y hace clic en "Crear Cuenta",

Entonces (Then) el sistema debe almacenar los datos, encriptar la contraseña mediante hashing seguro (ej. bcrypt), enviar un correo de verificación y redirigir al usuario a la pantalla de inicio de sesión (/login) mostrando el mensaje de éxito: "Cuenta creada. Por favor, verifica tu correo".

Escenario 2: Intento de registro con correo duplicado

Dado que el visitante está completando el formulario de registro,

Cuando ingresa un correo electrónico que ya existe en la base de datos de la plataforma y presiona "Crear Cuenta",

Entonces el sistema no debe procesar el registro, debe mantener los datos previamente escritos en el formulario (excepto las contraseñas) y desplegar un mensaje de alerta bajo el campo de correo que indique: "Este correo ya está en uso".

Escenario 3: Validación de robustez de contraseña

Dado que el usuario ingresa sus datos en el formulario,

Cuando escribe una contraseña menor a 8 caracteres o que no coincida con el campo "Confirmar contraseña",

Entonces el botón de "Crear Cuenta" debe permanecer deshabilitado y se debe mostrar una regla visual en tiempo real indicando los requisitos faltantes.

Escenario 4: Errores de red o servidor

Dado que el usuario ha completado el formulario correctamente,

Cuando ocurre un error de red o el servidor responde con un código 500,

Entonces el sistema debe mostrar un mensaje amigable: "Tuvimos un problema técnico. Por favor, inténtalo de nuevo en unos minutos", y registrar el error en los logs internos.

Requerimientos No Funcionales y Reglas de Negocio

Seguridad Crítica: La contraseña nunca debe viajar en texto plano hacia el servidor (usar HTTPS TLS 1.3). El sistema debe sanitizar los campos de entrada para prevenir ataques de inyección SQL o XSS.

Rendimiento: El proceso de validación del registro y redirección no debe demorar más de 1.5 segundos en redes 4G estándar.

Manejo de Errores Genéricos: Si la API del servidor falla (Error 500), el sistema debe mostrar un mensaje amigable, registrando el error en el sistema de logs internos.

Privacidad: Los datos personales del usuario deben ser tratados conforme a la ley de protección de datos (Ley 1581 de 2012 en Colombia).

# HU-002: Inicio de sesión

## Descripción de la Historia

**Como** administrador, **quiero** poder iniciar sesión con mi correo y contraseña, **para** acceder al panel de control de mi tienda de forma segura.

## Criterios de Aceptación:

* El sistema debe tener un formulario de inicio de sesión con campos: Correo y Contraseña.

* Si las credenciales son incorrectas, debe mostrar: "Correo o contraseña incorrectos".

* Después de 3 intentos fallidos, debe bloquear la cuenta por 5 minutos (para evitar ataques de fuerza bruta).

* Al iniciar sesión correctamente, debe redirigir al Dashboard principal.

# HU-003: Cerrar sesión

## Descripción de la Historia

**Como** administrador, **quiero** poder cerrar mi sesión con solo un clic, **para** asegurarme de que nadie más pueda acceder a mi cuenta cuando me alejo del equipo.

## Criterios de Aceptación:

* Debe haber un botón "Cerrar sesión" visible en todo momento en la interfaz (generalmente en la esquina superior derecha).
* Al hacer clic, debe destruir la sesión y redirigir a la pantalla de inicio de sesión.
* Después de cerrar sesión, no se debe poder acceder a ninguna ruta del panel sin volver a iniciar sesión.

# HU-004: Agregar nuevo producto

## Descripción

**Como** administrador, **quiero** poder agregar un nuevo producto con su nombre, descripción, precio de compra, precio de venta y una imagen, **para** tener un catálogo digital completo de todo lo que vendo.

## Criterios de Aceptación:

* El formulario debe tener campos: Nombre (obligatorio), Descripción, Precio de compra (obligatorio), Precio de venta (obligatorio), Stock inicial (obligatorio, número positivo), Stock mínimo (opcional), e Imagen (opcional).
* El precio de venta no puede ser menor que el precio de compra (debe mostrar advertencia si es menor).
* La imagen debe poder subirse desde el computador y mostrar una previsualización.
* Al guardar, el producto debe aparecer en la lista de productos.

# HU-005: Listar productos

## Descripción

**Como** administrador, **quiero** poder ver una lista de todos mis productos con su información más importante, **para** tener una visión general de mi inventario.

## Criterios de Aceptación:

* La lista debe mostrar: Nombre, Precio de venta, Stock actual y un ícono de "Stock crítico" (rojo) si está por debajo del stock mínimo.
* Debe tener un campo de búsqueda por nombre para filtrar productos.
* La lista debe ser paginada (mostrar 10 productos por página).
* Cada fila debe tener botones de "Editar" y "Eliminar".

# HU-006: Editar producto

## Descripción

**Como** administrador, **quiero** poder editar la información de un producto existente (como su precio o descripción), **para** mantener mi catálogo siempre actualizado.

## Criterios de Aceptación:

* Al hacer clic en "Editar", debe abrirse un formulario con los datos actuales del producto precargados.
* Se deben poder modificar todos los campos excepto el ID del producto.
* Al guardar, los cambios deben reflejarse inmediatamente en la lista de productos y en el detalle del producto.
* Si se cambia el precio de venta, debe validar que no sea menor al precio de compra.

## HU-007: Eliminar producto

## Descripción

**Como** administrador, **quiero** poder eliminar un producto que ya no vendo, **para** mantener mi inventario limpio y sin información obsoleta.

## Criterios de Aceptación:

* Antes de eliminar, debe mostrar un mensaje de confirmación: "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
* Si el producto tiene ventas asociadas, no debe permitir eliminar y mostrar: "No se puede eliminar un producto con ventas registradas. Desactívalo en su lugar."
* Al confirmar, el producto debe desaparecer de la lista.

# HU-008: Aumentar stock (entrada de mercancía)

## Descripción

**Como** administrador, **quiero** poder aumentar el stock de un producto (por ejemplo, cuando llega una nueva compra), **para** reflejar la mercancía real que tengo en la tienda.

## Criterios de Aceptación:

* Desde la lista de productos, debe haber un botón "+" o "Entrada de stock".
* Debe abrir un modal con el nombre del producto y un campo "Cantidad a agregar" (número positivo).
* Al guardar, el stock actual debe incrementarse en esa cantidad.
* Debe quedar registro de quién y cuándo hizo la entrada (para auditoría).

# HU-009: Disminuir stock (venta en efectivo)

## Descripción

**Como** administrador, **quiero** poder disminuir el stock de un producto (por ejemplo, cuando hago una venta en efectivo), **para** que el inventario siempre esté sincronizado con la realidad.

## Criterios de Aceptación:

* Desde la lista de productos, debe haber un botón "-" o "Salida de stock".
* Debe abrir un modal con el nombre del producto y un campo "Cantidad a retirar" (número positivo).
* No debe permitir retirar más stock del que existe (validación: cantidad <= stock actual).
* Al guardar, el stock debe disminuirse.

# HU-010: Alertas de stock mínimo

## Descripción 

**Como** administrador, **quiero** ver en el panel principal una alerta o lista de los productos que están por debajo de su stock mínimo, **para** saber qué debo pedir a mis proveedores con urgencia.

## Criterios de Aceptación:

* En el Dashboard, debe haber una sección llamada "Productos con stock crítico".
* Solo deben aparecer productos donde stock_actual <= stock_minimo.
* Cada producto debe mostrarse con su nombre, stock actual y un botón "Ver producto".
* Si no hay productos críticos, debe mostrar: "¡Todos tus productos tienen stock saludable!" con un ícono verde.

# Módulo de Gestión de Ventas (Punto de Venta)

# HU-011: Registrar venta rápida

## Descripción

**Como** administrador, **quiero** poder registrar una venta rápida seleccionando los productos y cantidades que un cliente lleva, **para** agilizar el cobro en la tienda.

## Criterios de Aceptación:

* Debe haber un botón "Nueva Venta" en el menú principal.
* Se debe abrir una pantalla con: buscador de productos, lista de productos agregados al carrito y total a pagar.
* Al buscar un producto, debe mostrarse el nombre, precio de venta y stock disponible.
* Al agregar al carrito, el sistema debe validar que la cantidad no supere el stock disponible.

# HU-012: Total en tiempo real

## Descripción

**Como** administrador, **quiero** ver el total de la venta actualizarse en tiempo real mientras agrego productos, **para** poder cobrar el monto exacto sin errores.

## Criterios de Aceptación:

* Cada vez que se agregue o elimine un producto del carrito, el total debe actualizarse automáticamente.
* El total debe mostrar: subtotal, IVA (si aplica) y total final.
* El total debe mostrarse en formato de moneda (ej: $ 15,000.00 COP).

# HU-013: Historial de ventas

## Descripción  

**Como** administrador, **quiero** poder ver un historial de todas las ventas que he realizado, con la fecha, los productos y el total, **para** llevar un control financiero de mi negocio.

## Criterios de Aceptación:

* Debe haber un enlace "Historial de Ventas" en el menú.
* La lista debe mostrar: Fecha, Hora, Cliente (si está registrado), Total y Estado (Completada / Pendiente / Cancelada).
* Cada venta debe ser expandible para ver los productos vendidos (nombre, cantidad, subtotal).
* Debe tener filtros por fecha (hoy, esta semana, este mes) y por estado.

# HU-014: Cálculo de ganancias

## Descripción

**Como** administrador, **quiero** poder calcular mis ganancias totales en un periodo de tiempo (ej: hoy, esta semana, este mes), **para** saber si mi negocio está siendo rentable.

## Criterios de Aceptación:

* En el Dashboard, debe haber un resumen de ganancias con un selector de periodo (Hoy, Esta semana, Este mes, Personalizado).
* Debe mostrar: Total de ventas, Total en costos de productos vendidos y Ganancia total.
* La fórmula debe ser: Ganancia = Suma(PrecioVenta - PrecioCompra) de todos los productos vendidos en el periodo.

# Módulo de Portal para Clientes (B2C)

# HU-015: Ver catálogo público

## Descripción

**Como** cliente, **quiero** poder ver el catálogo de productos de la tienda sin necesidad de registrarme, **para** explorar lo que ofrecen de forma rápida y sencilla.

## Criterios de Aceptación:

* La página de inicio del portal debe mostrar todos los productos activos.
* Cada producto debe mostrar: imagen, nombre, precio de venta y un botón "Agregar al carrito".
* Debe tener un buscador y filtros por categoría (si se implementan).

# HU-016: Carrito de compras (cliente)

## Descripción

**Como** cliente, **quiero** poder agregar productos a un carrito de compras y modificar las cantidades, **para** decidir qué quiero comprar antes de hacer el pedido.

## Criterios de Aceptación:

* El carrito debe estar accesible desde cualquier página (ícono en la esquina).
* Debe permitir incrementar, decrementar o eliminar productos del carrito.
* El total del carrito debe actualizarse automáticamente.

# HU-017: Enviar pedido (cliente)

## Descripción

**Como** cliente, **quiero** poder enviar mi pedido con mis datos de contacto, **para** que el administrador sepa qué productos quiero y pueda contactarme para la entrega.

## Criterios de Aceptación:

* El carrito debe tener un botón "Realizar pedido".
* Debe abrir un formulario con: Nombre, Teléfono, Dirección (opcional) y un campo de observaciones.
* Al enviar, debe mostrar un mensaje de éxito: "¡Gracias! El administrador recibirá tu pedido y se comunicará contigo."
* El administrador debe recibir una notificación en su panel (o correo) con el detalle del pedido.

# Módulo de Reportes y Dashboard (Visión General)

# HU-018: Dashboard de administrador

## Descripción

**Como** administrador, **quiero** ver en el panel principal un resumen con el total de productos, las ventas del día y los productos con stock crítico, **para** tener una foto instantánea de la salud de mi negocio.

## Criterios de Aceptación:

* El Dashboard debe tener 3 tarjetas principales: "Total de productos", "Ventas de hoy" (en dinero) y "Productos críticos" (cantidad).
* Debajo de las tarjetas, debe mostrar las últimas 5 ventas realizadas.
* La página debe cargar rápidamente (consultas optimizadas).

# HU-019: Reporte de productos más vendidos

## Descripción

**Como** administrador, **quiero** poder generar un reporte de los productos más vendidos, **para** saber cuáles son mis artículos estrella y enfocar mis compras en ellos.

# Criterios de Aceptación:

* En la sección de reportes, debe haber una opción "Productos más vendidos".
* Debe mostrar una lista o gráfico con: Nombre del producto, Cantidad total vendida y Total de dinero generado.
* Debe permitir filtrar por rango de fechas.

# HU-020: Exportar reporte (Excel/CSV)

## Descripción

**Como** administrador, **quiero** poder exportar un reporte de ventas o de inventario (por ejemplo, a un archivo Excel), **para** poder hacer análisis más detallados o compartir la información con mi contador.

## Criterios de Aceptación:

* Cada reporte (ventas, inventario, etc.) debe tener un botón "Exportar a Excel".
* El archivo descargado debe tener el nombre: reporte_ventas_YYYY-MM-DD.csv.
* El contenido debe ser legible (columnas con nombres claros) y usar separación por comas (CSV) o formato Excel.
* La exportación no debe afectar el rendimiento de la página (ejecutarse en segundo plano).
