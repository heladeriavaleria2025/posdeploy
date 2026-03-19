-- Script para crear la base de datos del sistema POS
-- Heladería/Frozen

CREATE DATABASE IF NOT EXISTS pos_heladeria;
USE pos_heladeria;

-- Tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    type ENUM('preparado', 'inventario', 'adicion') DEFAULT 'preparado',
    image VARCHAR(50) DEFAULT '📦',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de caja
CREATE TABLE IF NOT EXISTS caja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_open BOOLEAN DEFAULT FALSE,
    initial_balance DECIMAL(12,2) DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_salidas DECIMAL(12,2) DEFAULT 0,
    opened_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'mixto') NOT NULL,
    cantidad_items INT NOT NULL DEFAULT 0,
    estado ENUM('completada', 'anulada', 'pendiente') DEFAULT 'completada',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items de venta (detalle de cada venta)
CREATE TABLE IF NOT EXISTS venta_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    venta_id BIGINT NOT NULL,
    producto_id INT,
    nombre_producto VARCHAR(200) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    es_personalizado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- Tabla de salidas de dinero
CREATE TABLE IF NOT EXISTS salidas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    concepto VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') DEFAULT 'efectivo',
    responsable VARCHAR(100),
    tiene_comprobante BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion) VALUES 
('Helados', 'Helados de diferentes sabores'),
('Bebidas', 'Bebidas frías y calientes'),
('Postres', 'Postres y wafles'),
('Adiciones', 'Adiciones extras para helados'),
('Vasitos', 'Vasitos con bolas de helado'),
('Copas', 'Copas especiales'),
('Personalizado', 'Productos personalizados');

-- Insertar productos por defecto
INSERT INTO productos (code, name, category, price, cost, type, image) VALUES
-- Helados (1-8)
('001', 'Cono de 1 bola', 'Helados', 4000, 0, 'preparado', '🍦'),
('002', 'Cono de 2 bolas', 'Helados', 7000, 0, 'preparado', '🍦'),
('003', 'Bola adicional', 'Helados', 3500, 0, 'preparado', '🍨'),
('004', 'Cucurucho 1 bola + salsa', 'Helados', 5000, 0, 'preparado', '🍧'),
('005', 'Cucurucho 2 bolas + salsa', 'Helados', 8000, 0, 'preparado', '🍧'),
('006', 'Cucurucho 3 bolas + salsa', 'Helados', 10000, 0, 'preparado', '🍧'),
('007', 'Concha de 2 bolas', 'Helados', 12000, 0, 'preparado', '🥐'),
('008', 'Concha de 3 bolas', 'Helados', 14000, 0, 'preparado', '🥐'),
('009', 'Concha de 4 bolas', 'Helados', 17000, 0, 'preparado', '🥐'),
('010', 'Helado con queso', 'Helados', 11000, 0, 'preparado', '🧀'),

-- Bebidas (11-17)
('011', 'Salpicón 8oz', 'Bebidas', 6000, 0, 'preparado', '🥤'),
('012', 'Salpicón 12oz', 'Bebidas', 7000, 0, 'preparado', '🥤'),
('013', 'Salpicón con helado 12oz', 'Bebidas', 9000, 0, 'preparado', '🥤'),
('014', 'Salpicón con helado 16oz', 'Bebidas', 12000, 0, 'preparado', '🥤'),
('015', 'Banana split', 'Postres', 17500, 0, 'preparado', '🍌'),
('021', 'Malteada sencilla', 'Bebidas', 14000, 0, 'preparado', '🥤'),
('022', 'Malteada especial', 'Bebidas', 17000, 0, 'preparado', '🥤'),
('023', 'Jugo en agua', 'Bebidas', 5500, 0, 'preparado', '🧃'),
('024', 'Jugo en leche', 'Bebidas', 7500, 0, 'preparado', '🥛'),
('025', 'Sodas saborizadas', 'Bebidas', 11000, 0, 'preparado', '🧋'),
('026', 'Limonada', 'Bebidas', 10000, 0, 'preparado', '🍋'),
('027', 'Café granizado', 'Bebidas', 9500, 0, 'preparado', '☕'),
('028', 'Afogatto', 'Bebidas', 7000, 0, 'preparado', '☕'),

-- Postres (18-31)
('016', 'Ensalada de frutas pequeña sencilla', 'Postres', 12000, 0, 'preparado', '🍓'),
('017', 'Ensalada grande sencilla', 'Postres', 14500, 0, 'preparado', '🥗'),
('018', 'Ensalada pequeña especial', 'Postres', 16000, 0, 'preparado', '🥗'),
('019', 'Ensalada grande especial', 'Postres', 18000, 0, 'preparado', '🥗'),
('020', 'Obleas', 'Postres', 7500, 0, 'preparado', '🍪'),
('029', 'Fresas con crema 8oz', 'Postres', 9000, 0, 'preparado', '🍓'),
('030', 'Fresas con crema 12oz', 'Postres', 13000, 0, 'preparado', '🍓'),
('031', 'Fresas con crema 16oz', 'Postres', 16000, 0, 'preparado', '🍓'),
('032', 'Agua 250ml', 'Bebidas', 2000, 0, 'inventario', '💧'),
('033', 'Gaseosa 250ml', 'Bebidas', 2800, 0, 'inventario', '🥤'),
('034', 'Soda 350ml', 'Bebidas', 2800, 0, 'inventario', '🍾'),
('035', 'Wafle salado doble porción de queso', 'Postres', 17000, 0, 'preparado', '🧇'),
('036', 'Wafle fresa y crema de avellanas', 'Postres', 19000, 0, 'preparado', '🧇'),
('037', 'Wafle banano y arequipe', 'Postres', 17000, 0, 'preparado', '🧇'),
('038', 'Wafle frutas', 'Postres', 19000, 0, 'preparado', '🧇'),
('039', 'Wafle doble queso con arequipe', 'Postres', 19000, 0, 'preparado', '🧇'),
('040', 'Wafle Valeria', 'Postres', 19000, 0, 'preparado', '🧇'),
('041', 'Wafle amor', 'Postres', 15500, 0, 'preparado', '❤️'),
('042', 'Waffles personajes', 'Postres', 15500, 0, 'preparado', '🎭'),
('043', 'Waffles infantiles', 'Postres', 13500, 0, 'preparado', '🎈'),
('044', 'Helados infantiles', 'Helados', 10000, 0, 'preparado', '🍦'),
('045', 'Gusanito infantil', 'Postres', 12000, 0, 'preparado', '🐛'),
('046', 'Copas especiales', 'Postres', 17000, 0, 'preparado', '🍧'),
('047', 'Copa banano fresa', 'Postres', 17500, 0, 'preparado', '🍌'),
('048', 'Copa frutos rojos', 'Postres', 17500, 0, 'preparado', '🍓'),
('049', 'Copa fresa y crema de chocolate', 'Postres', 17500, 0, 'preparado', '🍓'),
('050', 'Copa pasión de chocolate', 'Postres', 18000, 0, 'preparado', '🍫'),

-- Adiciones (51-66)
('051', 'Adición Bola de helado', 'Adiciones', 3500, 0, 'adicion', '🍦'),
('052', 'Adición Porción de queso', 'Adiciones', 4000, 0, 'adicion', '🧀'),
('053', 'Adición Porción de Chantilly', 'Adiciones', 3500, 0, 'adicion', '🍦'),
('054', 'Adición Barquillos x2', 'Adiciones', 500, 0, 'adicion', '🍪'),
('055', 'Adición Porción salsa', 'Adiciones', 500, 0, 'adicion', '🥫'),
('056', 'Adición Gomitas x3', 'Adiciones', 500, 0, 'adicion', '🍬'),
('057', 'Adición M&M', 'Adiciones', 1000, 0, 'adicion', '🍫'),
('058', 'Adición Chicles', 'Adiciones', 900, 0, 'adicion', '🍬'),
('059', 'Adición Cono x1', 'Adiciones', 600, 0, 'adicion', '🧇'),
('060', 'Adición Cucurucho x1', 'Adiciones', 800, 0, 'adicion', '🧇'),
('061', 'Adición Brownie', 'Adiciones', 4000, 0, 'adicion', '🍰'),
('062', 'Adición Oreo', 'Adiciones', 2500, 0, 'adicion', '🍪'),
('063', 'Adición Galletas chips', 'Adiciones', 2000, 0, 'adicion', '🍪'),
('064', 'Adición Fresas', 'Adiciones', 2500, 0, 'adicion', '🍓'),
('065', 'Adición Durazno', 'Adiciones', 3000, 0, 'adicion', '🍑'),
('066', 'Adición Bananos', 'Adiciones', 1500, 0, 'adicion', '🍌'),

-- Vasitos (67-68)
('067', 'Vasos 1 bola', 'Vasitos', 4000, 0, 'preparado', '🍨'),
('068', 'Vasos 2 bolas', 'Vasitos', 7000, 0, 'preparado', '🍨'),

-- Copas (69-73)
('069', 'Copa queso', 'Copas', 17000, 0, 'preparado', '🧀'),
('070', 'Copa oreo', 'Copas', 17000, 0, 'preparado', '🍪'),
('071', 'Copa mango', 'Copas', 17000, 0, 'preparado', '🥭'),
('072', 'Copa durazno', 'Copas', 17000, 0, 'preparado', '🍑'),
('073', 'Copa cereza', 'Copas', 17000, 0, 'preparado', '🍒');

-- Crear índice para búsquedas frecuentes
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX idx_salidas_fecha ON salidas(fecha);
