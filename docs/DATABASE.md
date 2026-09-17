# 🗄️ MODELO Y ESQUEMA DE BASE DE DATOS - STOCKFLOW CONNECT

StockFlow Connect utiliza **PostgreSQL** como motor de base de datos relacional y **Prisma** como ORM.

---

## 📐 Diagrama Entidad-Relación (Mermaid)

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    SUPPLIER {
        string id PK
        string name
        string contactName
        string phone
        string email
        string address
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        string id PK
        string name
        string description
        float costPrice
        float sellingPrice
        int stock
        int minStock
        string image
        string supplierId FK
        datetime createdAt
        datetime updatedAt
    }

    SALE {
        string id PK
        float totalAmount
        enum paymentMethod "EFECTIVO | TRANSFERENCIA | TARJETA"
        float cashGiven
        float changeGiven
        datetime createdAt
    }

    SALE_ITEM {
        string id PK
        string saleId FK
        string productId FK
        int quantity
        float unitPrice
        float subtotal
    }

    ORDER {
        string id PK
        string customerName
        string customerPhone
        float totalAmount
        enum status "PENDIENTE | COMPLETADO | CANCELADO"
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        float unitPrice
        float subtotal
    }

    SUPPLIER ||--o{ PRODUCT : "provee"
    SALE ||--|{ SALE_ITEM : "contiene"
    PRODUCT ||--o{ SALE_ITEM : "se vende en"
    ORDER ||--|{ ORDER_ITEM : "contiene"
    PRODUCT ||--o{ ORDER_ITEM : "se solicita en"
```

---

## 📋 Resumen de Tablas y Entidades

1. **`User` (Usuarios Administradores)**:
   - Almacena las credenciales de acceso. El `email` es único. `passwordHash` utiliza algoritmo `bcrypt` con 10 salt rounds.

2. **`Supplier` (Proveedores)**:
   - Entidad obligatoria para la trazabilidad de reabastecimiento de productos físicos.

3. **`Product` (Productos del Inventario)**:
   - Contiene precios de costo (`costPrice`) y de venta (`sellingPrice`). Cumple la regla de negocio $sellingPrice \ge costPrice$.
   - Vinculado mediante clave foránea `supplierId` a la tabla `Supplier`.

4. **`Sale` & `SaleItem` (Ventas POS)**:
   - Registra cada transacción en punto de venta con método de pago, efectivo recibido y cambio entregado.

5. **`Order` & `OrderItem` (Pedidos Portal B2C)**:
   - Registra los pedidos realizados por clientes finales a través del catálogo público.
