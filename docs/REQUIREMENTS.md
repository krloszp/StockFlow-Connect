# 📋 Mis 20 Historias de Usuario para StockFlow Connect (Versión Senior)

# MÓDULO DE AUTENTICACIÓN (3 Historias)

# HU-001: Registro de Administrador

## Narrativa:
**Como** administrador de un comercio,
**Quiero** registrarme en la plataforma ingresando mi nombre, correo electrónico y contraseña,
**Para** disponer de una cuenta de acceso segura, privada y personalizada para gestionar mi negocio.

* **Prioridad**: Alta
* **Estimación**: 5 Story Points
* **Componente**: Autenticación / Backend-Frontend

## Precondiciones:

* El usuario no debe estar autenticado en la plataforma.

* El usuario debe encontrarse en la URL /registro.

## Enlaces de Referencia:

* [Diseño Figma - Pantalla Registro v2] (Pendiente)

* [API Spec - Endpoint /api/auth/register] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Registro exitoso con datos válidos

* **Dado** que el visitante se encuentra en el formulario de registro,

* **Cuando** completa los campos solicitados con un Nombre válido, un Correo no registrado (nuevo@negocio.com), una Contraseña de 8 caracteres y confirma exactamente la misma contraseña, y hace clic en "Crear Cuenta",

* **Entonces** el sistema debe almacenar los datos, encriptar la contraseña mediante hashing seguro (bcrypt), y redirigir al usuario a la pantalla de inicio de sesión (/login) mostrando el mensaje de éxito: "Cuenta creada. Por favor, inicia sesión".

### Escenario 2: Intento de registro con correo duplicado

* **Dado** que el visitante está completando el formulario de registro,

* **Cuando** ingresa un correo electrónico que ya existe en la base de datos de la plataforma y presiona "Crear Cuenta",

* **Entonces** el sistema no debe procesar el registro, debe mantener los datos previamente escritos en el formulario (excepto las contraseñas) y desplegar un mensaje de alerta bajo el campo de correo que indique: "Este correo ya está en uso".

### Escenario 3: Validación estricta de robustez de contraseña

* **Dado** que el usuario ingresa sus datos en el formulario,

* **Cuando** escribe una contraseña menor a 8 caracteres o que no coincida con el campo "Confirmar contraseña",

* **Entonces** el botón de "Crear Cuenta" debe permanecer deshabilitado y se debe mostrar una regla visual en tiempo real indicando los requisitos faltantes.

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: La contraseña nunca debe viajar en texto plano hacia el servidor (usar HTTPS). El sistema debe sanitizar los campos de entrada para prevenir ataques de inyección SQL o XSS. Almacenar contraseñas usando bcrypt con salt de 10 rondas.

* **Rendimiento**: El proceso de validación del registro y redirección no debe demorar más de 1.5 segundos en redes 4G estándar.

* **UX/Accesibilidad**: El botón "Crear Cuenta" debe tener un estado de "Cargando..." mientras se envía la petición para evitar doble clic. Los mensajes de error deben aparecer debajo del campo correspondiente (inline validation).

* **Manejo de Errores**: Si la API del servidor falla (Error 500), el sistema debe mostrar un mensaje amigable: "Tuvimos un problema técnico. Por favor, inténtalo de nuevo en unos minutos", registrando el error en el sistema de logs internos.

* **Regla de Negocio**: El correo electrónico será el identificador único del usuario en todo el sistema.

# HU-002: Inicio de Sesión

## Narrativa:
**Como** administrador registrado,
**Quiero** iniciar sesión con mi correo y contraseña,
**Para** acceder al panel de control de mi tienda de forma segura y privada.

* **Prioridad**: Alta
* **Estimación**: 3 Story Points
* **Componente**: Autenticación / Backend-Frontend

## Precondiciones:

* El usuario debe tener una cuenta creada previamente (HU-001 completada).

* El usuario no debe estar autenticado actualmente.

## Enlaces de Referencia:

* [Diseño Figma - Pantalla Login] (Pendiente)

* [API Spec - Endpoint /api/auth/login] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Inicio de sesión exitoso

**Dado** que el usuario está en la pantalla de login (/login),

**Cuando** ingresa un correo electrónico registrado y su contraseña correcta, y hace clic en "Iniciar Sesión",

**Entonces** el sistema debe validar las credenciales, generar un Token de acceso (JWT) con expiración de 8 horas, almacenarlo en el almacenamiento local del navegador, y redirigir al usuario al Dashboard principal (/dashboard).

### Escenario 2: Contraseña incorrecta

**Dado** que el usuario está en la pantalla de login,

**Cuando** ingresa un correo registrado pero una contraseña incorrecta,

**Entonces** el sistema no debe permitir el acceso, debe mostrar un mensaje de error genérico por seguridad: "Correo o contraseña incorrectos" (sin especificar cuál falló), y limpiar el campo de contraseña.

### Escenario 3: Correo no registrado

**Dado** que el usuario está en la pantalla de login,

**Cuando** ingresa un correo que no existe en la base de datos,

**Entonces** el sistema debe mostrar el mismo mensaje de error genérico: "Correo o contraseña incorrectos" (para evitar que un atacante sepa qué correos están registrados).

### Escenario 4: Bloqueo por múltiples intentos fallidos

**Dado** que el usuario ha fallado 3 intentos consecutivos de inicio de sesión en los últimos 5 minutos,

**Cuando** intenta iniciar sesión por cuarta vez,

**Entonces** el sistema debe mostrar: "Demasiados intentos fallidos. Intenta de nuevo en 5 minutos" y bloquear temporalmente la dirección IP o el usuario durante ese período.

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Usar HTTPS obligatorio. Implementar rate limiting (máximo 5 intentos por minuto por IP). Las contraseñas se comparan usando bcrypt. El JWT debe estar firmado con una clave secreta robusta.

* **Rendimiento**: La respuesta del login no debe superar los 800ms.

* **UX/Accesibilidad**: El botón "Iniciar Sesión" debe mostrar un spinner de carga. Al presionar "Enter" en el campo de contraseña, debe enviar el formulario automáticamente.

* **Manejo de Errores**: Si la base de datos no responde, mostrar: "Servicio no disponible. Intenta más tarde".

* **Regla de Negocio**: Las sesiones expiran automáticamente después de 8 horas de inactividad.

# HU-003: Cerrar Sesión

## Narrativa:
**Como** administrador autenticado,
**Quiero** cerrar mi sesión con un solo clic,
**Para** asegurarme de que nadie más pueda acceder a mi cuenta cuando me alejo del equipo o finalizo mi jornada laboral.

* **Prioridad**: Alta
* **Estimación**: 2 Story Points
* **Componente**: Autenticación / Frontend-Backend

## Precondiciones:

* El usuario debe haber iniciado sesión previamente y tener un token JWT activo.

## Enlaces de Referencia:

* [Diseño Figma - Menú de Usuario] (Pendiente)

* [API Spec - Endpoint /api/auth/logout] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Cierre de sesión exitoso

**Dado** que el administrador está en cualquier página del panel (ej: Dashboard),

**Cuando** hace clic en el botón "Cerrar Sesión" ubicado en el menú superior derecho,

**Entonces** el sistema debe invalidar el token JWT del lado del cliente (eliminarlo del almacenamiento local), redirigir al usuario a la pantalla de inicio de sesión (/login) y mostrar un mensaje: "Sesión cerrada correctamente".

### Escenario 2: Intentar acceder a una ruta protegida sin sesión

**Dado** que el usuario ha cerrado sesión previamente,

**Cuando** intenta acceder manualmente a una URL del panel (ej: /dashboard) pegándola en el navegador,

**Entonces** el sistema debe detectar la ausencia del token, no mostrar el contenido del panel, y redirigir automáticamente a la pantalla de login.

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Al cerrar sesión, el token debe ser eliminado del cliente. El backend también debe invalidar el token en su lista negra (si se usa) para evitar reutilización.

* **Rendimiento**: La acción debe ser instantánea (< 300ms), ya que solo implica limpieza local y redirección.

* **UX/Accesibilidad**: El botón debe estar siempre visible en la misma esquina superior derecha, con un ícono de "salida" universalmente reconocido.

* **Manejo de Errores**: Si ocurre un error en el backend al invalidar la sesión, el frontend igual debe eliminar el token local y redirigir (para evitar que el usuario quede atascado).

# MÓDULO DE GESTIÓN DE PRODUCTOS (6 Historias)

# HU-004: Crear Nuevo Producto

## Narrativa:
**Como** administrador de la tienda,
**Quiero** agregar un nuevo producto con su nombre, descripción, precios, imagen, y asociarlo directamente a su proveedor,
**Para** tener un catálogo digital completo y actualizado, y poder contactar al proveedor rápidamente cuando el producto esté por agotarse.

* **Prioridad** : Alta
* **Estimación**: 5 Story Points
* **Componente**: Inventario / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* El administrador debe estar en la sección "Inventario" y hacer clic en "Agregar Producto".

* Debe existir al menos un proveedor registrado en el sistema (para poder seleccionarlo en el desplegable).

## Enlaces de Referencia:

* [Diseño Figma - Formulario Producto] (Pendiente)

* [API Spec - Endpoint /api/products] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Creación exitosa de producto

**Dado** que el administrador está en el formulario de creación de producto,

**Cuando** completa todos los campos obligatorios (Nombre, Precio de compra, Precio de venta, Stock inicial, y selecciona un Proveedor de la lista desplegable), y opcionalmente agrega una descripción, imagen y stock mínimo, y hace clic en "Guardar Producto",

**Entonces** el sistema debe almacenar el producto en la base de datos con el ID del Proveedor vinculado, asignarle un ID único, mostrar un mensaje de éxito ("Producto creado exitosamente") y redirigir a la lista de productos para ver el nuevo elemento.

### Escenario 2: Validación de precios (Venta >= Compra)

**Dado** que el administrador está en el formulario de creación,

**Cuando** ingresa un Precio de venta menor al Precio de compra (ej: compra $100, venta $80),

**Entonces** el sistema debe mostrar un mensaje de error debajo del campo de precio: "El precio de venta no puede ser menor al precio de compra" y no permitir guardar el producto.

### Escenario 3: Validación de stock (número positivo)

**Dado** que el administrador está en el formulario,

**Cuando** ingresa un valor negativo o cero en el campo "Stock inicial",

**Entonces** el sistema debe mostrar: "El stock debe ser un número mayor o igual a 0" y bloquear el envío del formulario.

### Escenario 4: Intento de creación sin seleccionar proveedor (NUEVO - Añadido para cubrir la nueva lógica)

**Dado** que el administrador está en el formulario de creación,

**Cuando** completa todos los demás campos pero deja vacío el campo desplegable de "Proveedor" e intenta guardar,

**Entonces** el sistema debe mostrar un mensaje de error debajo del campo: "Debes seleccionar un proveedor para este producto" y no permitir guardar.

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Sanitizar todos los campos de entrada para evitar inyección SQL. Validar el tipo de archivo de imagen (solo JPG, PNG, WEBP; máximo 2MB).

* **Rendimiento**: La subida de imagen debe procesarse en segundo plano para no bloquear la interfaz.

* **UX/Accesibilidad**: Mostrar una previsualización de la imagen seleccionada antes de subirla. El formulario debe tener marcados los campos obligatorios con un asterisco (*).

* **Manejo de Errores**: Si la imagen no se puede subir por tamaño o formato, mostrar un mensaje claro. Si la BD falla, mostrar: "Error al guardar el producto. Intenta de nuevo".

* **Regla de Negocio 1**: El precio de venta siempre debe ser mayor o igual que el precio de compra (el negocio no puede vender por debajo del costo).

* **Regla de Negocio 2**: El campo "Proveedor" es obligatorio para productos físicos que requieran reabastecimiento. Esto asegura que cuando el producto esté en stock crítico, el sistema pueda mostrar el contacto del proveedor.

# HU-005: Listar y Buscar Productos

## Narrativa:
**Como** administrador de la tienda,
**Quiero** ver una lista paginada de todos mis productos y poder buscarlos por nombre,
**Para** tener una visión general de mi inventario y encontrar productos rápidamente.

* **Prioridad**: Alta
* **Estimación**: 3 Story Points
* **Componente**: Inventario / Frontend-Backend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* La base de datos debe tener al menos un producto registrado para mostrar resultados significativos.

## Enlaces de Referencia:

* [Diseño Figma - Pantalla Lista de Productos] (Pendiente)

* [API Spec - Endpoint GET /api/products] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Visualización de la lista paginada

**Dado** que el administrador está en la sección "Inventario",

**Cuando** la página se carga,

**Entonces** el sistema debe mostrar una tabla con las columnas: Nombre, Precio de Venta, Stock Actual, Estado (Crítico/Normal), y botones de Acción (Editar/Eliminar). Los productos deben mostrarse de 10 en 10 (paginación).

### Escenario 2: Búsqueda por nombre

**Dado** que el administrador está en la lista de productos,

**Cuando** escribe "Camiseta" en el campo de búsqueda y presiona "Buscar" o Enter,

**Entonces** el sistema debe filtrar la lista y mostrar solo los productos cuyo nombre contenga la palabra "Camiseta" (sin distinguir mayúsculas/minúsculas).

### Escenario 3: Lista vacía (sin productos)

**Dado** que el administrador está en la lista de productos,

**Cuando** no hay productos registrados en la tienda,

**Entonces** el sistema debe mostrar un mensaje amigable: "No tienes productos aún. ¡Agrega tu primer producto!" con un botón que redirija al formulario de creación.

## Requerimientos No Funcionales y Regla de Negocio

* **Rendimiento**: La carga de la lista inicial y los resultados de búsqueda no deben superar los 1.5 segundos.

* **UX/Accesibilidad**: La tabla debe ser responsive (adaptarse a móvil). El campo de búsqueda debe tener un ícono de lupa.

* **Manejo de Errores**: Si la API falla, mostrar: "Error al cargar los productos. Recarga la página".

* **Regla de Negocio**: Un producto con stock actual <= stock mínimo debe mostrarse con un fondo rojo o un ícono de advertencia para alertar al administrador.

# HU-006: Editar Producto

## Narrativa:
**Como** administrador,
**Quiero** poder modificar la información de un producto existente (nombre, precio, descripción, imagen),
**Para** mantener mi catálogo siempre actualizado y corregir errores sin tener que eliminar y volver a crear.

* **Prioridad**: Media
* **Estimación**: 3 Story Points
* **Componente**: Inventario / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* Debe existir al menos un producto en la base de datos.

## Enlaces de Referencia:

* [Diseño Figma - Formulario Editar Producto] (Pendiente)

* [API Spec - Endpoint PUT /api/products/:id] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Edición exitosa de producto

**Dado** que el administrador está en la lista de productos,

**Cuando** hace clic en el botón "Editar" de un producto específico, modifica el nombre, el precio o la descripción, y hace clic en "Actualizar",

**Entonces** el sistema debe validar los datos, actualizar el registro en la base de datos, mostrar un mensaje de éxito ("Producto actualizado") y refrescar la lista de productos con los nuevos datos.

### Escenario 2: Edición de imagen (reemplazo)

**Dado** que el administrador está editando un producto que ya tiene una imagen,

**Cuando** selecciona un nuevo archivo de imagen,

**Entonces** el sistema debe reemplazar la imagen antigua por la nueva, eliminar el archivo anterior del almacenamiento, y mostrar la nueva previsualización.

### Escenario 3: Validación de precios (misma regla)

**Dado** que el administrador está editando un producto,

**Cuando** intenta guardar un precio de venta menor al precio de compra,

**Entonces** el sistema debe mostrar el mismo error de validación y no actualizar el producto.

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Validar que el producto exista y pertenezca al administrador logueado (no puede editar productos de otro).

* **Rendimiento**: La actualización debe reflejarse en menos de 1 segundo.

* **UX**: Si el usuario intenta salir del formulario sin guardar, debe mostrar un mensaje de confirmación: "Tienes cambios sin guardar. ¿Estás seguro de salir?".

* **Manejo de Errores**: Si el producto no existe (ID inválido), mostrar error 404 amigable.

* **Regla de Negocio**: No se puede editar el campo "Stock actual" directamente desde aquí; solo mediante entrada/salida de stock.

# HU-007: Eliminar Producto

## Narrativa:
**Como** administrador,
**Quiero** eliminar un producto que ya no vendo o que ya no necesito en el sistema,
**Para** mantener mi inventario limpio, organizado y sin información obsoleta.

* **Prioridad**: Media
* **Estimación**: 2 Story Points
* **Componente**: Inventario / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* El producto a eliminar debe existir en la base de datos.

## Enlaces de Referencia:

* [API Spec - Endpoint DELETE /api/products/:id] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Eliminación con confirmación

**Dado** que el administrador está en la lista de productos,

**Cuando** hace clic en el botón "Eliminar" (ícono de papelera) de un producto,

**Entonces** el sistema debe mostrar un diálogo de confirmación: "¿Estás seguro de eliminar el producto 'X'? Esta acción no se puede deshacer." con botones "Cancelar" y "Eliminar".

### Escenario 2: Confirmación de eliminación

**Dado** que el administrador vio el diálogo de confirmación,

**Cuando** hace clic en "Eliminar",

**Entonces** el sistema debe eliminar el producto de la base de datos, mostrar un mensaje ("Producto eliminado exitosamente") y actualizar la lista de productos.

### Escenario 3: Cancelación de eliminación

**Dado** que el administrador vio el diálogo de confirmación,

**Cuando** hace clic en "Cancelar",

**Entonces** el sistema debe cerrar el diálogo sin eliminar el producto y mantener la lista de productos intacta.

### Escenario 4: Intento de eliminar producto con ventas asociadas

**Dado** que el administrador intenta eliminar un producto que ya tiene ventas registradas en el sistema,

**Cuando** confirma la eliminación,

**Entonces** el sistema debe bloquear la operación, mostrar un mensaje: "No se puede eliminar un producto con ventas registradas. Puedes desactivarlo o archivarlo en su lugar." y no eliminar el producto.

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Validar que el producto pertenezca al administrador autenticado.

* **Rendimiento**: La eliminación debe ser inmediata.

* **UX**: El botón de eliminar debe tener un color rojo distintivo para alertar al usuario del peligro.

* **Manejo de Errores**: Si el producto no existe, mostrar "Producto no encontrado".

* **Regla de Negocio**: No se permite la eliminación física si el producto tiene transacciones asociadas (integridad referencial). En su lugar, se puede implementar un "borrado lógico" (campo activo: false).

# HU-008: Aumentar Stock (Entrada de Mercancía)
## Narrativa:
**Como** administrador,
**Quiero** registrar la llegada de nueva mercancía seleccionando el producto y la cantidad que ingresa a mi bodega,
**Para** reflejar en el sistema el inventario real que tengo disponible para la venta.

* **Prioridad**: Alta
* **Estimación**: 3 Story Points
* **Componente**: Inventario / Backend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* El producto debe existir en la base de datos.

## Enlaces de Referencia:

* [API Spec - Endpoint POST /api/products/:id/stock/increase] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Entrada exitosa de stock

**Dado** que el administrador está en la lista de productos o en el detalle del producto,

**Cuando** hace clic en "Agregar Stock", ingresa la cantidad (ej: 50) en el modal, y confirma,

**Entonces** el sistema debe sumar 50 al stock actual del producto, guardar la operación en un registro de auditoría con fecha, hora y usuario, y actualizar la vista de la lista de productos mostrando el nuevo stock.

### Escenario 2: Validación de cantidad positiva

**Dado** que el administrador está en el modal de entrada de stock,

**Cuando** ingresa un número negativo, cero, o un valor no numérico (ej: texto),

**Entonces** el sistema debe mostrar un error: "La cantidad debe ser un número positivo mayor a cero" y no procesar la operación.

### Escenario 3: Registro de auditoría

**Dado** que el administrador realizó una entrada de stock,

**Cuando** la operación se completa exitosamente,

**Entonces** el sistema debe crear un registro en la tabla StockMovements con los campos: producto_id, usuario_id, cantidad (+50), fecha_hora, y tipo ("ENTRADA").

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Solo administradores autenticados pueden modificar el stock.

* **Rendimiento**: La operación debe ser atómica (usar transacciones de BD) para evitar inconsistencias.

* **UX**: Mostrar el stock actual antes de la entrada para que el usuario sepa cuánto había.

* **Manejo de Errores**: Si la transacción falla, revertir cualquier cambio y mostrar "Error al actualizar stock. Intenta de nuevo".

* **Regla de Negocio**: Toda entrada de stock debe quedar registrada en un movimiento de inventario para trazabilidad.

# HU-009 DEFINITIVA: Alertas de Stock Mínimo + Contacto Proveedor + Mínimo Dinámico

## Narrativa:
**Como** administrador de la tienda,
**Quiero** ver en el panel principal una lista de los productos que están por debajo de su stock mínimo, que el sistema me muestre el contacto del proveedor al lado, y que me sugiera un nuevo mínimo basado en la velocidad de venta,
**Para** tomar decisiones rápidas de compra, contactar al proveedor sin buscar en otro lado, y ajustar mis pedidos para nunca quedarme sin existencias ni tener excesos innecesarios.

* **Prioridad**: Alta
* **Estimación**: 5 Story Points
* **Componente**: Dashboard / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* El sistema debe tener productos con el campo stock_minimo definido.

* Los productos deben tener un proveedor asociado (desde la HU-004) para que el sistema pueda mostrar el contacto.

## Enlaces de Referencia:

* [Diseño Figma - Dashboard] (Pendiente)

* [API Spec - Endpoint GET /api/products/critical] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Mostrar productos críticos en el Dashboard

**Dado** que el administrador acaba de iniciar sesión y está en el Dashboard,

**Cuando** el sistema carga la página,

**Entonces** debe mostrar un bloque o tarjeta titulada "Productos con Stock Crítico" que contenga la lista de productos donde stock_actual <= stock_minimo. Por cada producto, debe mostrar: Nombre, Stock Actual, Stock Mínimo, y los Datos del Proveedor (Nombre y Teléfono) con un botón para copiar el número rápidamente.

### Escenario 2: Estado sin productos críticos

**Dado** que el administrador está en el Dashboard,

**Cuando** todos los productos tienen stock superior al mínimo definido,

**Entonces** el bloque debe mostrar un mensaje positivo con ícono verde: "¡Excelente! Todos tus productos tienen stock saludable."

### Escenario 3: Acción rápida desde la alerta

**Dado** que hay productos críticos listados,

**Cuando** el administrador hace clic en el botón "Agregar Stock" asociado a un producto de la lista,

**Entonces** debe abrirse el mismo modal de entrada de stock (HU-008) para resolver la alerta de inmediato.

### Escenario 4: Cálculo y sugerencia de "Stock Mínimo Dinámico" (NUEVO - Añadido para la lógica de negocio)

**Dado** que el administrador está viendo la lista de productos críticos,

**Cuando** el sistema calcula el promedio de ventas de los últimos 7 días para ese producto (ventas_totales / 7),

**Entonces** debe mostrar una etiqueta justo debajo del producto que diga: "Mínimo Sugerido para evitar desabastecimiento: [X] unidades (Basado en tu ritmo de venta de los últimos 7 días)".

* **Ejemplo**: Si en 7 días vendiste 21 camisetas, el promedio diario es 3. Si el proveedor tarda 3 días en surtir, el nuevo mínimo sugerido es 9 unidades.

### Escenario 5: Aceptación del mínimo sugerido (NUEVO - Acción para actualizar automáticamente)

**Dado** que el sistema mostró un mínimo sugerido para un producto crítico,

**Cuando**** el administrador hace clic en el botón "Actualizar Mínimo Automáticamente" al lado de la sugerencia,

**Entonces** el campo stock_minimo del producto en la base de datos se actualiza al nuevo número calculado, la alerta roja desaparece de la lista (porque el nuevo mínimo se ajustó al ritmo de venta), y se muestra un mensaje: "Mínimo actualizado exitosamente".

## Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: Esta consulta debe ser muy rápida (índices en BD). No debe demorar más de 500ms.

* **UX**: Los productos críticos deben estar destacados con color rojo o un ícono de alerta.

* **Manejo de Errores**: Si no se puede cargar la lista, mostrar "No se pudo cargar el estado del inventario" pero el resto del Dashboard debe seguir funcionando.

* **Regla de Negocio 1**: El stock_minimo es opcional al crear producto. Si no tiene valor, el producto nunca aparecerá como crítico.

* **Regla de Negocio 2**: El cálculo de la sugerencia se basa en (promedio_ventas_7dias * 3 días estimados de entrega). Si el producto no tiene ventas en los últimos 7 días, no se mostrará sugerencia (para evitar sugerir 0).

# MÓDULO DE VENTAS (4 Historias)

# HU-010: Registrar Venta Rápida (Punto de Venta)

## Narrativa:

**Como** administrador de la tienda,
**Quiero** registrar una venta en efectivo seleccionando productos, indicar cuánto dinero entrega el cliente para que el sistema calcule el vuelto automáticamente, y seleccionar el método de pago (Efectivo, Nequi, Datafono, etc.),
**Para** agilizar el cobro, evitar errores de devolución, y llevar un control financiero exacto de cómo ingresó el dinero a mi negocio.

* **Prioridad**: Alta
* **Estimación**: 8 Story Points (por la complejidad de manejo de transacciones y concurrencia)
* **Componente**: Ventas / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* Debe haber productos activos con stock disponible (>0) para vender.

## Enlaces de Referencia:

* [Diseño Figma - Pantalla Nueva Venta] (Pendiente)

* [API Spec - Endpoint POST /api/sales] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Venta exitosa con cálculo de vuelto (MODIFICADO - Se añadieron los campos de pago y vuelto)

**Dado** que el administrador está en la pantalla "Nueva Venta" y ya agregó productos al carrito (Total: $50,000),

**Cuando** ingresa en el campo "Monto Recibido" el valor de $60,000, selecciona el Método de Pago (por ejemplo: "Efectivo"), y hace clic en "Finalizar Venta",

**Entonces** el sistema debe:

Calcular y mostrar en grande el "Vuelto: $10,000" antes de confirmar.
Al confirmar, debe crear el registro de la venta, disminuir el stock de forma atómica (usando transacción), y guardar el Monto Recibido, el Vuelto y el Método de Pago en la base de datos.
Mostrar un comprobante o mensaje de éxito: "Venta registrada por $50,000. Vuelto: $10,000".

### Escenario 2: Validación de pago insuficiente (NUEVO - Añadido para cubrir la lógica de cobro)

**Dado** que el total de la venta es $50,000,

**Cuando** el administrador ingresa un "Monto Recibido" de $40,000,

**Entonces** el sistema debe mostrar una alerta en rojo debajo del campo: "El monto recibido es insuficiente. Faltan $10,000" y deshabilitar el botón "Finalizar Venta" hasta que se ingrese un monto igual o superior al total.

### Escenario 3: Venta con múltiples productos (SE MANTIENE IGUAL, solo se le añade la lógica de vuelto al total)

**Dado** que el administrador está en la pantalla "Nueva Venta",

**Cuando** agrega 3 productos diferentes al carrito (Total: $120,000) e ingresa un monto recibido de $150,000 (Efectivo),

**Entonces** el sistema debe calcular el vuelto ($30,000), actualizar el stock de los 3 productos, y registrar el pago correctamente.

### Escenario 4: Validación de stock insuficiente (SE MANTIENE IGUAL)

**Dado** que el administrador está en la pantalla "Nueva Venta",

**Cuando** intenta vender 10 unidades de un producto que solo tiene 3 en stock,

**Entonces** el sistema debe mostrar un error en tiempo real: "Stock insuficiente. Disponible: 3 unidades" y no permitir agregar el producto al carrito.

### Escenario 5: Concurrencia (dos usuarios vendiendo el último producto) (SE MANTIENE IGUAL - Esto es clave de la HU)

**Dado** que un producto tiene 1 unidad en stock,

**Cuando** dos administradores intentan finalizar una venta con ese producto casi al mismo tiempo,

**Entonces** el sistema debe permitir solo una de las ventas (la primera) y la otra debe recibir un mensaje de error de stock agotado, garantizando que el stock nunca sea negativo gracias al bloqueo de fila a nivel de base de datos (SELECT ... FOR UPDATE).

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Las transacciones deben ser ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad) usando PostgreSQL.

* **Rendimiento**: La venta debe procesarse en menos de 2 segundos.

* **UX**: El carrito debe mostrar subtotal actualizado en tiempo real. El campo de búsqueda debe tener autocompletado.

* **Manejo de Errores**: Si la transacción falla (por concurrencia o error de BD), mostrar "Error al procesar la venta. El stock pudo haber sido modificado. Intenta de nuevo".

* **Regla de Negocio**: 
1. Una vez finalizada la venta, no se puede modificar ni cancelar (en esta fase). Debe quedar trazabilidad de qué admin realizó la venta.
2. El campo "Monto Recibido" es obligatorio y debe ser >= Total de la venta.
3. El "Método de Pago" es obligatorio. Las opciones mínimas serán: Efectivo, Nequi, Daviplata, Datafono, Mixto (en caso de combinaciones).
4. El vuelto se calcula únicamente si el método de pago es "Efectivo" o "Mixto" (si aplica).

# HU-011: Total en Tiempo Real en el Carrito
## Narrativa:
**Como** administrador,
**Quiero** ver el total de la venta actualizarse automáticamente mientras agrego o elimino productos del carrito,
**Para** cobrar el monto exacto al cliente sin errores de cálculo y de forma ágil.

* **Prioridad**: Media
* **Estimación**: 2 Story Points
* **Componente**: Ventas / Frontend

## Precondiciones:

* El administrador debe estar en la pantalla "Nueva Venta".

* Debe haber al menos un producto en el carrito.

## Enlaces de Referencia:

* [Diseño Figma - Carrito de Ventas] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Actualización al agregar producto

**Dado** que el administrador tiene un carrito vacío,

**Cuando** agrega un producto con precio de $5,000,

**Entonces** el total del carrito debe mostrar $5,000.

### Escenario 2: Actualización al modificar cantidad

**Dado** que el administrador tiene un producto de $5,000 en el carrito,

**Cuando** incrementa la cantidad de 1 a 3,

**Entonces** el total debe actualizarse a $15,000.

### Escenario 3: Actualización al eliminar producto

**Dado** que el administrador tiene 3 productos en el carrito con un total de $12,000,

**Cuando** elimina uno de los productos que costaba $2,000,

**Entonces** el total debe actualizarse a $10,000.

### Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: Los cálculos deben ser instantáneos (< 100ms).

* **UX**: El total debe mostrarse con formato de moneda (COP) en un tamaño de fuente grande y llamativo.

* **Manejo de Errores**: Si un precio de producto cambia en la BD mientras está en el carrito, el sistema debe mostrar un aviso y recalcular el total basado en los precios actuales al momento de finalizar la venta.

# HU-012: Historial de Ventas
## Narrativa:
**Como** administrador,
**Quiero** acceder a un historial completo de todas las ventas realizadas con fecha, monto y productos,
**Para** llevar un control financiero detallado y poder responder consultas de mis clientes o de la DIAN.

* **Prioridad**: Media
* **Estimación**: 3 Story Points
* **Componente**: Ventas / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* Debe existir al menos una venta en la base de datos.

## Enlaces de Referencia:

* [Diseño Figma - Pantalla Historial de Ventas] (Pendiente)

* [API Spec - Endpoint GET /api/sales] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Visualización de la lista de ventas

**Dado** que el administrador está en la sección "Historial de Ventas",

**Cuando** la página se carga,

**Entonces** debe mostrar una tabla con columnas: ID de Venta, Fecha/Hora, Total, Estado (Completada), y un botón "Ver Detalle".

### Escenario 2: Filtrado por fecha

**Dado** que el administrador está en el historial,

**Cuando** selecciona el filtro "Últimos 7 días",

**Entonces** la lista debe mostrar solo las ventas realizadas en esa semana.

### Escenario 3: Detalle de una venta específica

**Dado** que el administrador está en el historial,

**Cuando** hace clic en "Ver Detalle" de una venta,

**Entonces** debe abrir un modal o página con los productos vendidos (nombre, cantidad, subtotal), el total, la fecha, y el nombre del administrador que procesó la venta.

## Requerimientos No Funcionales y Reglas de Negocio

* *Rendimiento**: Las consultas deben usar índices por fecha para ser rápidas incluso con muchos datos.

* **UX**: Los filtros de fecha deben tener botones de acceso rápido (Hoy, Ayer, Esta semana, Este mes).

* **Manejo de Errores**: Si no hay ventas, mostrar "No se han registrado ventas aún".

* **Regla de Negocio**: Las ventas son inmutables; no se pueden editar. Solo se pueden consultar.

# HU-013: Cálculo de Ganancias
## Narrativa:
**Como** administrador,
**Quiero** visualizar mis ganancias totales en un período de tiempo, desglosando ventas, costos y utilidad,
**Para** saber si mi negocio está siendo rentable y tomar decisiones de compra e inversión.

* **Prioridad**: Media
* **Estimación**: 5 Story Points
* **Componente**: Reportes / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* Deben existir ventas registradas para el período seleccionado.

## Enlaces de Referencia:

* [Diseño Figma - Módulo de Ganancias] (Pendiente)

* [API Spec - Endpoint GET /api/reports/profits] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Visualización de ganancias del día

**Dado** que el administrador está en el Dashboard,

**Cuando** selecciona el período "Hoy",

**Entonces** debe mostrar tres cifras claras: Total de Ventas, Total en Costos (suma de costos de los productos vendidos) y Ganancia Total (Ventas - Costos).

### Escenario 2: Filtrado por rango personalizado

**Dado** que el administrador está en la sección de reportes,

**Cuando** selecciona un rango de fechas del 1 al 15 de julio,

**Entonces** el sistema debe recalcular y mostrar las cifras correspondientes solo a ese período.

### Escenario 3: Período sin ventas

**Dado** que el administrador selecciona un rango de fechas sin ventas,

**Cuando** el sistema no encuentra datos,

**Entonces** debe mostrar: "No hay ventas en este período" con todas las cifras en $0.

## Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: Los cálculos deben realizarse a nivel de base de datos (SUM, GROUP BY) para evitar procesar grandes volúmenes en el backend.

* **U**X: Mostrar las cifras en formato de moneda y con colores distintivos (verde para ganancia, rojo para pérdida).

* **Manejo de Errores**: Si falla la consulta, mostrar "Error al calcular las ganancias".

* **Regla de Negocio**: La fórmula es Ganancia = Suma(PrecioVenta - PrecioCompra). Si un producto tiene diferentes precios de compra en el tiempo, se debe usar el precio de compra registrado en la venta (no el precio actual del producto).

# MÓDULO PORTAL CLIENTES (B2C - 3 Historias)
# HU-014: Ver Catálogo Público (Cliente)
## Narrativa:
**Como** cliente final de la tienda,
**Quiero** ver el catálogo de productos disponibles sin necesidad de registrarme,
**Para** conocer la oferta de la tienda y decidir qué productos quiero comprar.

* **Prioridad**: Media
* **Estimación**: 3 Story Points
* **Componente**: B2C / Frontend

## Precondiciones:

* El administrador debe haber creado productos activos.

* El visitante no necesita estar autenticado.

## Enlaces de Referencia:

* [Diseño Figma - Catálogo Público] (Pendiente)

* [API Spec - Endpoint GET /api/public/products] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Visualización del catálogo

**Dado** que un visitante entra a la URL pública de la tienda (/tienda),

**Cuando** la página carga,

**Entonces** debe mostrar una cuadrícula de productos con imagen, nombre, precio de venta y un botón "Agregar al carrito".

### Escenario 2: Búsqueda de productos

**Dado** que el visitante está en el catálogo,

**Cuando** escribe "Zapatos" en el buscador,

**Entonces** debe mostrar solo los productos cuyo nombre contenga "Zapatos".

### Escenario 3: Catálogo vacío

**Dado** que el administrador no ha creado productos públicos o los ha desactivado,

**Cuando** el visitante carga la página,

**Entonces** debe mostrar un mensaje: "No hay productos disponibles en este momento. Vuelve pronto."

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: No se requiere autenticación. Limitar la cantidad de productos devueltos por consulta para evitar sobrecarga (paginación).

* **Rendimiento**: La carga del catálogo no debe superar los 2 segundos. Usar caché de imágenes (CDN si es posible).

* **UX**: La cuadrícula debe ser responsive (adaptarse a móviles y tablets).

* **Manejo de Errores**: Si el servidor no responde, mostrar "Servicio no disponible. Intenta más tarde".

* *Regla de Negocio**: Solo se muestran productos con stock > 0.

# HU-015: Gestionar Carrito de Compras (Cliente)
## Narrativa:
**Como** cliente,
**Quiero** agregar productos a un carrito de compras, modificar cantidades y eliminar productos,
**Para** decidir mi compra final antes de hacer el pedido.

* **Prioridad**: Media
* **Estimación**: 3 Story Points
* **Componente**: B2C / Frontend

## Precondiciones:

* El cliente debe estar navegando en el catálogo.

* Debe haber productos con stock disponible.

## Enlaces de Referencia:

* [Diseño Figma - Carrito B2C] (Pendiente)

* Criterios de Aceptación (Formato BDD)

### Escenario 1: Agregar producto al carrito

**Dado** que el cliente está viendo el catálogo,

**Cuando** hace clic en "Agregar al carrito" en un producto,

**Entonces** el ícono del carrito debe actualizarse mostrando el número total de productos agregados, y debe aparecer un mensaje breve: "Producto agregado".

### Escenario 2: Modificar cantidad desde el carrito

**Dado** que el cliente tiene un producto en el carrito,

**Cuando** abre el carrito y cambia la cantidad de 1 a 3,

**Entonces** el total del carrito debe actualizarse, y el sistema debe verificar que la cantidad solicitada no supere el stock disponible.

### Escenario 3: Eliminar producto del carrito

**Dado** que el cliente tiene productos en el carrito,

**Cuando** hace clic en "Eliminar" o "X" en un producto del carrito,

**Entonces** ese producto debe desaparecer del carrito, y el total debe recalcularse.

## Requerimientos No Funcionales y Reglas de Negocio

* **UX**: El carrito debe ser visible siempre (flotante o en esquina). Mostrar el total acumulado.

* **Manejo de Errores**: Si se intenta agregar más stock del disponible, mostrar mensaje: "Stock máximo disponible: X".

* **Regla de Negocio** : El carrito es efímero (se almacena en LocalStorage del navegador). Si el cliente cierra el navegador, se pierde el carrito (en esta fase inicial).

# HU-016: Enviar Pedido (Cliente)
## Narrativa:
**Como** cliente,
**Quiero** enviar mi pedido con mis datos de contacto y dirección,
**Para** que el administrador reciba mi solicitud y se comunique conmigo para coordinar la entrega.

* **Prioridad**: Media
* **Estimación**: 3 Story Points
* **Componente**: B2C / Backend

## Precondiciones:

* El cliente debe tener al menos un producto en el carrito.

* El cliente debe estar en la pantalla de checkout.

## Enlaces de Referencia:

* [Diseño Figma - Checkout B2C] (Pendiente)

* [API Spec - Endpoint POST /api/public/orders] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Envío exitoso del pedido

**Dado** que el cliente está en el carrito,

**Cuando** hace clic en "Realizar Pedido", completa el formulario con Nombre, Teléfono y Dirección, y presiona "Enviar Pedido",

**Entonces** el sistema debe almacenar el pedido en la base de datos, mostrar un mensaje de éxito: "¡Gracias! El administrador recibió tu pedido y se comunicará contigo.", y enviar al administrador una notificación (por correo o en su panel).

### Escenario 2: Validación de campos obligatorios

**Dado** que el cliente está en el checkout,

**Cuando** intenta enviar el pedido sin llenar el Teléfono,

**Entonces** el sistema debe mostrar: "El teléfono es obligatorio" y no enviar el pedido.

### Escenario 3: Carrito vacío al llegar al checkout

**Dado** que el cliente no tiene productos en el carrito,

**Cuando** intenta acceder a la página de checkout,

**Entonces** debe ser redirigido al catálogo con un mensaje: "Tu carrito está vacío. Agrega productos para continuar."

## Requerimientos No Funcionales y Reglas de Negocio

* **Seguridad**: Sanitizar los datos de entrada (nombre, teléfono) para evitar inyecciones. No guardar información de pago (ya que el pago se hace en efectivo contra entrega).

* **Rendimiento**: El envío del pedido debe ser rápido (< 1.5s).

* **UX**: Mostrar un resumen del pedido (productos y total) antes de confirmar.

* **Manejo de Errores**: Si la notificación al admin falla, el pedido igual debe guardarse. El admin verá los pedidos pendientes en su panel.

* **Regla de Negocio**: Un pedido crea un registro de "Pedido Pendiente" que el administrador debe revisar y convertir en una Venta (HU-010) manualmente si confirma la entrega.

# MÓDULO DE DASHBOARD Y REPORTES (4 Historias)

# HU-017: Dashboard de Administrador

## Narrativa:
**Como** administrador,
**Quiero** ver un panel de control con indicadores clave como total de productos, ventas del día y stock crítico,
**Para** tener una fotografía instantánea del estado de mi negocio al iniciar la jornada.

* **Prioridad**: Alta
* **Estimación**: 5 Story Points
* **Componente**: Dashboard / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

## Enlaces de Referencia:

* [Diseño Figma - Dashboard] (Pendiente)

* [API Spec - Endpoint GET /api/dashboard/summary] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Carga completa del Dashboard

**Dado** que el administrador acaba de iniciar sesión,

**Cuando** se redirige al Dashboard,

**Entonces** debe ver 3 tarjetas principales: "Total de Productos" (ej: 45), "Ventas de Hoy" (ej: $350,000), "Productos Críticos" (ej: 3), además de la lista de productos críticos y las últimas 5 ventas realizadas.

### Escenario 2: Actualización de datos en tiempo real (opcional)

**Dado** que el administrador está viendo el Dashboard,

**Cuando** pasa 1 minuto sin actividad,

**Entonces** el sistema NO actualiza automáticamente (requiere recarga manual para evitar sobrecarga en esta fase). Esto puede implementarse con un botón "Refrescar".

### Escenario 3: El negocio está recién creado (datos vacíos)

**Dado** que el administrador no tiene productos ni ventas,

**Cuando** carga el Dashboard,

**Entonces** las tarjetas deben mostrar $0 y 0 productos, y un mensaje motivacional: "¡Bienvenido! Comienza agregando tus primeros productos."

## Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: La consulta del Dashboard debe agregar datos en una sola consulta SQL (usando COUNT, SUM) para no hacer múltiples viajes a la BD.

* **UX**: Las tarjetas deben tener íconos representativos y colores distintos.

* **Manejo de Errores**: Si algún componente del Dashboard falla (ej: ventas de hoy), debe cargarse con un mensaje de error, pero el resto del Dashboard debe mostrarse.

* **Regla de Negocio**: Los datos mostrados siempre deben reflejar la última transacción confirmada (consistencia eventual).

# HU-018: Reporte de Productos Más Vendidos

## Narrativa:
**Como** administrador,
**Quiero** ver un ranking de los productos más vendidos en un período de tiempo,
**Para** identificar los artículos estrella y tomar decisiones informadas de compra y promoción.

* **Prioridad**: Media
* **Estimación**: 5 Story Points
* **Componente**: Reportes / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* Deben existir ventas registradas.

## Enlaces de Referencia:

* [Diseño Figma - Reporte Top Productos] (Pendiente)

* [API Spec - Endpoint GET /api/reports/top-products] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Ranking de los 5 más vendidos

**Dado** que el administrador está en la sección de reportes,

**Cuando** selecciona "Top Productos" y el período "Último mes",

**Entonces** debe mostrar una lista de los 5 productos con mayor cantidad vendida, mostrando: Nombre, Cantidad vendida y Total de dinero generado.

### Escenario 2: Selección de período

**Dado** que el administrador está en el reporte,

**Cuando** cambia el filtro a "Última semana",

**Entonces** el ranking debe recalcularse exclusivamente con las ventas de esa semana.

### Escenario 3: Sin datos en el período

**Dado** que el administrador selecciona un período sin ventas,

**Cuando** no hay datos,

**Entonces** debe mostrar: "No hay ventas en este período."

## Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: Usar índices en ventas.fecha y detalles_venta.producto_id para consultas rápidas.

* **UX**: Mostrar los resultados en una tabla ordenada descendentemente y, si es posible, en un gráfico de barras simple.

* **Manejo de Errores**: Si falla la consulta, mostrar "Error al cargar el reporte".

* **Regla de Negocio**: El "Total de dinero generado" se calcula como suma(cantidad * precio_venta) de ese producto en las ventas.

# HU-019: Exportar Reporte (Excel/CSV)

## Narrativa:
**Como** administrador,
**Quiero** exportar los reportes de ventas o inventario a un archivo CSV o Excel,
**Para*** compartir la información con mi contador, hacer análisis externos o tener respaldos físicos.

* **Prioridad**: Baja
* **Estimación**: 3 Story Points
* **Componente**: Reportes / Backend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* Debe estar en una sección de reporte que permita exportar (ej: Ventas o Inventario).

## Enlaces de Referencia:

* [API Spec - Endpoint GET /api/reports/sales/export] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Exportación exitosa de ventas

**Dado** que el administrador está en el historial de ventas,

**Cuando** hace clic en "Exportar a Excel",

**Entonces** el sistema debe generar un archivo CSV con el nombre ventas_YYYY-MM-DD.csv y comenzar la descarga automática. El archivo debe contener: ID, Fecha, Total, Estado.

### Escenario 2: Exportación de inventario

**Dado** que el administrador está en la lista de productos,

**Cuando** hace clic en "Exportar Inventario",

**Entonces** el sistema debe generar un CSV con Nombre, Precio de venta, Stock actual, Stock mínimo.

### Escenario 3: Archivo descargable correcto

**Dado** que el administrador descarga el archivo,

**Cuando** lo abre en Excel o en un editor de texto,

**Entonces** los datos deben estar correctamente estructurados (columnas separadas por comas y con encabezados claros).

## Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: Para volúmenes grandes de datos, la exportación debe ejecutarse en segundo plano (fase futura). Por ahora, con < 1000 registros, debe ser rápida.

* **UX**: El botón de exportar debe tener un ícono de descarga.

* **Manejo de Errores**: Si no hay datos, mostrar "No hay datos para exportar".

* **Regla de Negocio**: El formato será CSV (compatible con Excel) para simplificar.

# HU-020: Gestión de Proveedores (Básico)

## Narrativa:
**Como** administrador,
**Quiero** registrar y gestionar la información de mis proveedores (nombre, contacto, teléfono),
**Para** tener un directorio de mis fuentes de suministro y contactarlos rápidamente cuando un producto esté en stock crítico.

* **Prioridad**: Baja (se puede mover a Fase II)
* **Estimación**: 3 Story Points
* **Componente**: Proveedores / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

## Enlaces de Referencia:

* [Diseño Figma - Gestión Proveedores] (Pendiente)

* [API Spec - CRUD /api/providers] (Pendiente)

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Crear un nuevo proveedor

**Dado** que el administrador está en la sección "Proveedores",

**Cuando** hace clic en "Agregar Proveedor", completa los campos (Nombre, Contacto, Teléfono, Correo) y guarda,

**Entonces** el proveedor debe quedar registrado y aparecer en la lista.

### Escenario 2: Listar proveedores

**Dado** que el administrador está en la sección de proveedores,

**Cuando** la página carga,

**Entonces** debe mostrar una tabla con los proveedores registrados y sus datos de contacto.

### Escenario 3: Eliminar proveedor

**Dado** que el administrador está en la lista,

**Cuando** hace clic en "Eliminar" en un proveedor,

**Entonces** debe mostrar confirmación y eliminarlo si confirma.

## Requerimientos No Funcionales y Reglas de Negocio

UX: Debe ser un CRUD sencillo, similar al de productos.

Manejo de Errores: Si se intenta eliminar un proveedor asociado a productos, mostrar: "No se puede eliminar un proveedor con productos vinculados."

Regla de Negocio: La relación entre proveedores y productos se implementará en una Fase II (por ahora es solo un directorio).

# HU-021: Cálculo de Velocidad de Venta (Días para agotarse)

## Narrativa:
**Como** administrador de la tienda,
**Quiero** ver un indicador que calcule cuántos días me quedan de stock basado en mi ritmo actual de ventas,
**Para** anticipar mis compras con mayor precisión y evitar desabastecimientos inesperados.

* **Prioridad**: Media
* **Estimación**: 3 Story Points
* **Componente**: Reportes / Backend-Frontend

## Precondiciones:

* El administrador debe haber iniciado sesión.

* El producto debe tener al menos 7 días de historial de ventas para que el cálculo sea significativo.

## Criterios de Aceptación (Formato BDD)

### Escenario 1: Cálculo exitoso de días de cobertura

**Dado** que el administrador está viendo el detalle de un producto o el Dashboard,

**Cuando** el sistema consulta el stock actual y el promedio de ventas de los últimos 7 días,

**Entonces** debe calcular y mostrar la fórmula: (Stock Actual / Promedio de Ventas Diario) y mostrar el resultado con un mensaje: "Días estimados de cobertura: 4.5 días".

### Escenario 2: Producto sin ventas recientes

**Dado** que el administrador está viendo un producto que no ha tenido ventas en los últimos 7 días,

**Cuando** el sistema intenta calcular el promedio,

**Entonces** debe mostrar un mensaje en lugar de un número: "Sin ventas recientes para calcular cobertura".

### Escenario 3: Producto con stock agotado (0)

**Dado** que el administrador está viendo un producto con stock = 0,

**Cuando** el sistema calcula la cobertura,

**Entonces** debe mostrar: "¡AGOTADO! Solicita reabastecimiento urgente" en color rojo.

## Requerimientos No Funcionales y Reglas de Negocio

* **Rendimiento**: El cálculo debe ejecutarse en la misma consulta SQL que trae el producto (usando subconsultas o JOINs) para no hacer llamadas adicionales.

* **UX**: El indicador debe mostrarse con un ícono de reloj ⏳ y con un color de fondo:

1. Verde: Si la cobertura es > 10 días.

2. Amarillo: Si la cobertura está entre 3 y 10 días.

3. Rojo: Si la cobertura es < 3 días o stock = 0.

* **Manejo de Errores**: Si no se puede calcular por falta de datos históricos, no mostrar error, solo mostrar el mensaje "Datos insuficientes".

* **Regla de Negocio**: El promedio de ventas se calcula como: (Suma de unidades vendidas en los últimos 7 días) / 7.


## 🚀 FASES FUTURAS (Backlog 2.0 - Mejoras de Alta Categoría)

*Estas historias representan las funcionalidades que llevarán a StockFlow al siguiente nivel. Se implementarán después del MVP exitoso.*

---

### HU-022: Gestión de Múltiples Sucursales (Expansión de Negocio)

**Narrativa:**
Como **administrador con varios locales**,
Quiero **poder crear y administrar diferentes sucursales dentro de la misma cuenta**,
Para **gestionar el inventario y las ventas de cada tienda por separado, pero viendo todo desde un solo panel de control**.

**Prioridad:** Media (Alta para negocios en crecimiento)  
**Estimación:** 8 Story Points  
**Componente:** Backend / Frontend / Base de Datos

**Precondiciones:**
1. El administrador debe haber iniciado sesión.
2. El administrador debe tener el rol de "Super Administrador" para gestionar sucursales.

**Criterios de Aceptación:**

**Escenario 1: Creación de una nueva sucursal**
- **Dado** que el administrador está en la sección "Configuración > Sucursales",
- **Cuando** hace clic en "Agregar Sucursal", ingresa el nombre, dirección y teléfono, y guarda,
- **Entonces** el sistema debe crear la sucursal y permitir al administrador cambiar entre sucursales desde el menú superior.

**Escenario 2: Inventario independiente por sucursal**
- **Dado** que el administrador está trabajando en la "Sucursal A",
- **Cuando** agrega un producto (HU-004) o registra una venta (HU-010),
- **Entonces** esos movimientos solo afectan el stock de la "Sucursal A", manteniendo el stock de la "Sucursal B" intacto.

**Requerimientos No Funcionales:**
- **Regla de Negocio:** Los precios de los productos pueden variar entre sucursales (precios regionales).

---

### HU-023: Ventas a Crédito (El "Fiado" Digital)

**Narrativa:**
Como **administrador de una tienda de barrio**,
Quiero **registrar una venta sin cobro inmediato, asociándola al nombre y teléfono de un cliente**,
Para **llevar un control digital de la "libreta de fiados" y recordar quién me debe y cuánto**.

**Prioridad:** Alta (para el contexto colombiano)  
**Estimación:** 8 Story Points  
**Componente:** Ventas / Backend-Frontend

**Precondiciones:**
1. El administrador debe haber iniciado sesión.
2. El cliente debe existir en el sistema (registro rápido durante la venta).

**Criterios de Aceptación:**

**Escenario 1: Registrar una venta a crédito**
- **Dado** que el administrador está en la pantalla "Nueva Venta",
- **Cuando** selecciona productos, en lugar de "Efectivo" selecciona el método de pago **"Crédito / Fiado"**, ingresa el nombre y teléfono del cliente (o lo selecciona de una lista), y finaliza,
- **Entonces** el sistema debe descontar el stock, crear una deuda asociada al cliente, y mostrar un mensaje: "Venta a crédito registrada. Cliente 'Ana' debe $15,000".

**Escenario 2: Lista de clientes con deudas**
- **Dado** que el administrador está en el Dashboard,
- **Cuando** hace clic en la sección "Clientes con Deudas",
- **Entonces** debe mostrar una lista con: Nombre del cliente, Teléfono, Total adeudado, y Fecha de la última compra, ordenados por los que deben más.

**Escenario 3: Registrar un abono o pago total**
- **Dado** que el administrador está viendo el detalle de un cliente deudor,
- **Cuando** ingresa un monto en el campo "Abono" y guarda,
- **Entonces** el sistema debe reducir la deuda del cliente y, si llega a $0, marcarlo como "Deuda saldada".

**Requerimientos No Funcionales:**
- **Seguridad:** Los datos de los clientes (teléfono) deben viajar cifrados (HTTPS).
- **UX:** Mostrar una alerta en el Dashboard si hay clientes con deudas superiores a $100,000.

---

### HU-024: Envío de Comprobante por WhatsApp

**Narrativa:**
Como **administrador**,
Quiero **enviar el comprobante de una venta o pedido directamente a través de WhatsApp al cliente**,
Para **mejorar la experiencia de compra y tener un registro digital de la transacción en el teléfono del cliente**.

**Prioridad:** Media  
**Estimación:** 5 Story Points  
**Componente:** Frontend / Integración Externa

**Precondiciones:**
1. La venta o pedido debe haber sido completado exitosamente.
2. El cliente debe tener un número de teléfono registrado.

**Criterios de Aceptación:**

**Escenario 1: Envío manual del comprobante**
- **Dado** que el administrador acaba de finalizar una venta,
- **Cuando** hace clic en el botón "Enviar por WhatsApp",
- **Entonces** el sistema debe generar un mensaje con el detalle de la compra (Productos, Cantidad, Total) y abrir la aplicación de WhatsApp (Web o Móvil) con ese texto precargado y el número del cliente.

**Requerimientos No Funcionales:**
- **Seguridad:** No se almacenan mensajes en el sistema; solo se usa la API de WhatsApp para abrir el chat.

---

### HU-025: Escáner de Código de Barras (Pistola Lectora)

**Narrativa:**
Como **administrador en el punto de venta**,
Quiero **pasar un código de barras con un lector USB o la cámara del celular para agregar productos a la venta**,
Para **reducir el tiempo de cobro de 1 minuto a solo 3 segundos**.

**Prioridad:** Alta (Mejora radical la velocidad)  
**Estimación:** 3 Story Points  
**Componente:** Frontend / Ventas

**Precondiciones:**
1. Los productos deben tener un campo "Código de Barras" registrado (extensión de HU-004).
2. El administrador debe estar en la pantalla "Nueva Venta".

**Criterios de Aceptación:**

**Escenario 1: Lectura con teclado (Lector USB)**
- **Dado** que el administrador está en la pantalla de ventas y el cursor está en el campo de búsqueda,
- **Cuando** pasa el producto por el lector de código de barras (que se comporta como un teclado),
- **Entonces** el sistema debe detectar el código, buscar el producto y agregarlo automáticamente al carrito sin necesidad de presionar "Enter" ni "Agregar".

**Escenario 2: Lectura con cámara (Móvil)**
- **Dado** que el administrador está usando la versión móvil/PWA,
- **Cuando** hace clic en el ícono de la cámara y enfoca un código QR o de barras,
- **Entonces** el sistema debe leerlo, buscar el producto y agregarlo al carrito.

**Requerimientos No Funcionales:**
- **Rendimiento:** La búsqueda por código de barras debe ser instantánea (< 200ms).

---

### HU-026: Ticket / Factura Imprimible (PDF)

**Narrativa:**
Como **administrador**,
Quiero **generar un ticket en formato PDF con el detalle de la venta, incluyendo el vuelto y el método de pago**,
Para **entregar un comprobante físico profesional al cliente y llevar un control fiscal de mis ventas**.

**Prioridad:** Media  
**Estimación:** 3 Story Points  
**Componente:** Frontend / Reportes

**Precondiciones:**
1. La venta debe estar registrada en el sistema.

**Criterios de Aceptación:**

**Escenario 1: Generar y descargar ticket**
- **Dado** que el administrador está viendo el detalle de una venta en el historial,
- **Cuando** hace clic en el botón "Imprimir Ticket",
- **Entonces** el sistema debe generar un PDF con el nombre de la tienda (configurable), los productos, cantidades, total, vuelto y método de pago, y descargarlo automáticamente o abrirlo en una nueva pestaña para imprimir.

**Requerimientos No Funcionales:**
- **UX:** El diseño del ticket debe ser limpio, legible y adaptado a papel térmico (80mm de ancho).

---