# Configuración de MongoDB para Sistema POS Heladería

## 📋 Instalación de MongoDB

### 1. Prerrequisitos
```bash
# Instalar MongoDB
# Ubuntu/Debian:
sudo apt update
sudo apt install -y mongodb

# Windows (usando MongoDB Atlas):
# Configurar variables de entorno
```

### 2. Configuración de Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/heladeria_pos
MONGODB_USER=heladeria_admin
MONGODB_PASSWORD=tu_contraseña_secreta
MONGODB_DB_NAME=heladeria_pos
```

### 3. Conexión a MongoDB Atlas (Recomendado)
```env
# MongoDB Atlas - más fácil para producción
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/heladeria_pos?retryWrites=true&w=majority
```

### 4. Estructura de Base de Datos
```javascript
// Colecciones en MongoDB
- products: { id: ObjectId, code: String, name: String, category: String, price: Number, type: String, image: String, timestamp: Date }
- sales: { id: ObjectId, date: Date, items: Array, total: Number, paymentMethod: String, orderId: String, timestamp: Date }
- cashRegister: { id: ObjectId, isOpen: Boolean, initialBalance: Number, totalSales: Number, openDate: Date, closeDate: Date, difference: Number, finalCash: Number, timestamp: Date }
- salidas: { id: ObjectId, concepto: String, categoria: String, monto: Number, metodoPago: String, responsable: String, comprobante: Boolean, timestamp: Date }
- activeCart: { id: ObjectId, products: Array, total: Number, timestamp: Date }
- metrics: { id: ObjectId, period: String, ingresos: Object, egresos: Object, fecha: Date, timestamp: Date }
```

## 🚀 Ejecutar el Sistema

### Opción 1: Solo MongoDB
```bash
# Instalar dependencias
npm install

# Ejecutar con MongoDB
node pos-mongodb.js
```

### Opción 2: Modo Híbrido (MongoDB + Local Fallback)
```bash
# Para desarrollo con respaldo local
node pos-mongodb.js --fallback-local
```

## 🔧 Características Implementadas

### 📊 Gestión de Datos con MongoDB
- ✅ **Conexión Automática**: Conexión persistente a MongoDB
- ✅ **Cache Local**: Los datos se cachean localmente para rendimiento
- ✅ **Sincronización Bidireccional**: MongoDB ↔ localStorage
- ✅ **Transacciones ACID**: Garantía de consistencia de datos
- ✅ **Consultas Indexadas**: Búsqueda optimizada en MongoDB
- ✅ **Auditoría**: Todas las operaciones registran en MongoDB

### 🎯 Migración desde LocalStorage
- ✅ **Migración Automática**: Al iniciar, detecta si hay datos en MongoDB
- ✅ **Preservación de Datos**: Mantiene datos locales como backup
- ✅ **Mapeo de Datos**: Conversión automática de formato localStorage → MongoDB

### 🔄 Sistema de Cache Inteligente
```javascript
// Estrategia de cache implementada
1. Intentar MongoDB primero (rápido)
2. Si falla, usar localStorage (confiable)
3. Sincronizar datos cuando se restauran
```

## 📱 Configuración de Credenciales

### 🔐 Variables de Entorno Seguras
```bash
# Development
MONGODB_URI=mongodb://localhost:27017/heladeria_pos
MONGODB_ENVIRONMENT=development

# Production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/heladeria_pos
MONGODB_ENVIRONMENT=production
```

### 🛡️ Mejoras de Seguridad
- ✅ **Autenticación**: Requerida para MongoDB
- ✅ **Connection Pooling**: Gestión automática de conexiones
- ✅ **Retry Logic**: Reintentos automáticos en fallos
- ✅ **Indexing**: Índices optimizados para consultas rápidas

## 🎯 Beneficios de MongoDB vs localStorage

### 💾 **Persistencia Superior**
- **Datos Centralizados**: Todos los usuarios comparten misma BD
- **Respaldo Automático**: MongoDB maneja persistencia
- **Concurrencia**: Múltiples usuarios sin conflictos
- **Historial Completo**: Registro permanente de todas las operaciones

### 📈 **Escalabilidad**
- **Sharding**: Facil para dividir carga entre servidores
- **Replica Sets**: Alta disponibilidad y lectura
- **Aggregation Framework**: Análisis complejo en BD
- **Change Streams**: Tiempo real de sincronización

## 🔄 Proceso de Implementación

### 📦 Paso 1: Configurar MongoDB
```bash
# 1. Crear usuario administrador
use heladeria_pos
db.createUser({
  user: "heladeria_admin",
  pwd: password("secure_password_hash"),
  roles: ["readWrite", "dbAdmin"]
})

# 2. Crear índices para rendimiento
db.products.createIndex({ "code": 1 }, { unique: true })
db.products.createIndex({ "category": 1 })
db.sales.createIndex({ "date": -1 })
db.salidas.createIndex({ "timestamp": -1 })
```

### 📦 Paso 2: Actualizar el Código
- Reemplazar todas las llamadas a `localStorage` con métodos MongoDB
- Mantener lógica existente como fallback
- Añadir manejo de errores robusto

### 📦 Paso 3: Probar en Desarrollo
```bash
# Iniciar el sistema con MongoDB
node pos-mongodb.js

# Verificar conexión en MongoDB Compass
# Probar todas las operaciones CRUD
```

## 🎯 Archivos Creados

1. **database-mongo.js**: Capa de acceso a MongoDB
2. **pos-mongodb.js**: Sistema POS adaptado para MongoDB
3. **package.json**: Dependencias y configuración del proyecto
4. **README-MongoDB.md**: Instrucciones detalladas de implementación

## 🚀 Inicio Rápido

Para comenzar a usar MongoDB inmediatamente:

```bash
# Instalar dependencias y ejecutar
npm install
node pos-mongodb.js
```

El sistema detectará automáticamente si hay conexión a MongoDB y se ajustará. Si no hay conexión, usará localStorage como respaldo.