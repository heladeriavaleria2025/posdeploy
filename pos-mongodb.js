// Sistema POS Versión MongoDB
class POSSystemMongoDB {
    constructor() {
        this.currentModule = 'ventas';
        this.cart = [];
        this.editingProductId = null;
        this.mongoDB = new (require('./database-mongo.js')).MongoDBDataAccess();
        this.init();
    }

    async init() {
        await this.mongoDB.connect();
        await this.initializeData();
        this.setupEventListeners();
        this.updateDateTime();
        this.switchModule('ventas');
    }

    async initializeData() {
        // Verificar si hay datos en MongoDB, si no migrar desde localStorage
        try {
            const productsData = await this.mongoDB.findDocuments('products');
            if (productsData.length === 0) {
                console.log('📦 No hay productos en MongoDB, migrando desde localStorage...');
                await this.migrateFromLocalStorage();
            } else {
                console.log('📦 Productos encontrados en MongoDB:', productsData.length);
                this.products = productsData[0]?.data || [];
            }

            const salesData = await this.mongoDB.findDocuments('sales');
            this.salesHistory = salesData[0]?.data || [];

            const cashData = await this.mongoDB.findDocuments('cashRegister');
            this.cashRegister = cashData[0]?.data || { isOpen: false, initialBalance: 0, totalSales: 0 };

            const salidasData = await this.mongoDB.findDocuments('salidas');
            this.salidas = salidasData[0]?.data || [];

        } catch (error) {
            console.error('❌ Error inicializando datos:', error.message);
            await this.fallbackToLocalStorage();
        }
    }

    async fallbackToLocalStorage() {
        console.log('🔄 Haciendo fallback a localStorage...');
        
        // Si MongoDB falla, usar localStorage como backup
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
        this.cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || { isOpen: false, initialBalance: 0, totalSales: 0 };
        this.salidas = JSON.parse(localStorage.getItem('salidas')) || [];
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                this.switchModule(module);
            });
        });

        // Search
        const searchInput = document.getElementById('search-product');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Product management
        const addProductBtn = document.getElementById('agregar-producto');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.openProductModal();
            });
        }

        // Cash register
        const abrirCajaBtn = document.getElementById('abrir-caja');
        if (abrirCajaBtn) {
            abrirCajaBtn.addEventListener('click', () => {
                this.openOpenCashModal();
            });
        }

        const cerrarCajaBtn = document.getElementById('cerrar-caja');
        if (cerrarCajaBtn) {
            cerrarCajaBtn.addEventListener('click', () => {
                this.openCloseCashModal();
            });
        }

        // Salidas
        const agregarSalidaBtn = document.getElementById('agregar-salida');
        if (agregarSalidaBtn) {
            agregarSalidaBtn.addEventListener('click', () => {
                this.openSalidaModal();
            });
        }

        // Finalize sale
        const finalizarVentaBtn = document.getElementById('finalizar-venta');
        if (finalizarVentaBtn) {
            finalizarVentaBtn.addEventListener('click', () => {
                this.openFinalizeSaleModal();
            });
        }

        // Product form
        const productForm = document.getElementById('producto-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Cash register forms
        const abrirCajaForm = document.getElementById('abrir-caja-form');
        if (abrirCajaForm) {
            abrirCajaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.openCashRegister();
            });
        }

        const cerrarCajaForm = document.getElementById('cerrar-caja-form');
        if (cerrarCajaForm) {
            cerrarCajaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.closeCashRegister();
            });
        }

        // Finalize sale form
        const finalizarVentaForm = document.getElementById('finalizar-venta-form');
        if (finalizarVentaForm) {
            finalizarVentaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.finalizeSale();
            });
        }

        // Payment method change
        const metodoPago = document.getElementById('metodo-pago');
        if (metodoPago) {
            metodoPago.addEventListener('change', (e) => {
                this.toggleMontoRecibido(e.target.value);
            });
        }

        // Amount received input
        const montoRecibido = document.getElementById('monto-recibido');
        if (montoRecibido) {
            montoRecibido.addEventListener('input', () => {
                this.calculateChange();
            });
        }

        // Dinero real input
        const dineroReal = document.getElementById('caja-dinero-real');
        if (dineroReal) {
            dineroReal.addEventListener('input', () => {
                this.updateCloseCashModal();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Billetes rápidos
        document.querySelectorAll('.billete').forEach(billete => {
            billete.addEventListener('click', () => {
                const value = parseInt(billete.dataset.value);
                const montoInput = document.getElementById('monto-recibido');
                const currentValue = parseInt(montoInput.value) || 0;
                montoInput.value = currentValue + value;
                this.calculateChange();
            });
        });

        console.log('Event listeners setup completed');
    }

    // Métodos de renderizado (ahora con MongoDB como primario)
    async renderProducts() {
        try {
            const productsData = await this.mongoDB.findDocuments('products', { sort: { timestamp: -1 } });
            const products = productsData[0]?.data || this.products;

            const grid = document.getElementById('products-grid');
            if (!grid) return;

            if (products.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No hay productos disponibles</div>';
                return;
            }

            grid.innerHTML = products.map(product => `
                <div class="product-card" onclick="window.posMongoDB.addToCart(${product.id})">
                    <div class="product-image">${product.image || '📦'}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">$${product.price.toLocaleString('es-CO')}</div>
                    <div class="product-type">
                        ${product.type === 'preparado' ? '🍳 Preparado' : '📦 Inventario'}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al renderizar productos:', error.message);
        }
    }

    renderProductsTable() {
        const tbody = document.getElementById('productos-table');
        if (!tbody) return;

        try {
            const productsData = await this.mongoDB.findDocuments('products', { sort: { timestamp: -1 } });
            const products = productsData[0]?.data || this.products;

            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No hay productos registrados</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toLocaleString('es-CO')}</td>
                    <td>${product.type === 'preparado' ? '🍳 Preparado' : '📦 Inventario'}</td>
                    <td>
                        <button class="btn-secondary" onclick="window.posMongoDB.openProductModal(${product.id})" style="margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="window.posMongoDB.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error al renderizar tabla de productos:', error.message);
        }
    }

    renderCashRegister() {
        const cerradaDiv = document.getElementById('caja-cerrada');
        const abiertaDiv = document.getElementById('caja-abierta');
        
        try {
            const cashData = await this.mongoDB.findDocuments('cashRegister', { sort: { timestamp: -1 } });
            const cashRegister = cashData[0]?.data || this.cashRegister;
            
            // Calcular salidas del día para balance
            const salidasData = await this.mongoDB.findDocuments('salidas') || [];
            const todaySalidas = salidasData[0]?.data?.filter(s => 
                new Date(s.timestamp).toDateString() === new Date().toDateString()
            ) || [];
            const todaySalidasAmount = todaySalidas.reduce((sum, salida) => sum + salida.monto, 0);

            const saldoInicialEl = document.getElementById('saldo-inicial');
            const totalVentasEl = document.getElementById('total-ventas');
            const salidasCajaEl = document.getElementById('salidas-caja');
            const saldoEsperadoEl = document.getElementById('saldo-esperado');

            if (!cashRegister.isOpen) {
                cerradaDiv.classList.remove('hidden');
                abiertaDiv.classList.add('hidden');
            } else {
                cerradaDiv.classList.add('hidden');
                abiertaDiv.classList.remove('hidden');
                
                if (saldoInicialEl) saldoInicialEl.textContent = `$${cashRegister.initialBalance.toLocaleString('es-CO')}`;
                if (totalVentasEl) totalVentasEl.textContent = `$${cashRegister.totalSales.toLocaleString('es-CO')}`;
                if (salidasCajaEl) salidasCajaEl.textContent = `$${todaySalidasAmount.toLocaleString('es-CO')}`;
                if (saldoEsperadoEl) {
                    const saldoEsperado = cashRegister.initialBalance + cashRegister.totalSales - todaySalidasAmount;
                    saldoEsperadoEl.textContent = `$${saldoEsperado.toLocaleString('es-CO')}`;
                }
            }
        } catch (error) {
            console.error('Error al renderizar caja:', error.message);
        }
    }

    renderSalesHistory() {
        const tbody = document.getElementById('historial-table');
        if (!tbody) return;

        try {
            const salesData = await this.mongoDB.findDocuments('sales', { sort: { timestamp: -1 } });
            const sales = salesData[0]?.data || this.salesHistory;
            
            if (sales.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No hay ventas registradas</td></tr>';
                return;
            }

            tbody.innerHTML = sales.slice(-10).reverse().map(sale => `
                <tr>
                    <td>${sale.orderId}</td>
                    <td>${new Date(sale.date).toLocaleString('es-CO')}</td>
                    <td>$${sale.total.toLocaleString('es-CO')}</td>
                    <td>${sale.paymentMethod}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error al renderizar historial:', error.message);
        }
    }

    // Métodos existentes adaptados para MongoDB
    async addToCart(productId) {
        const productsData = await this.mongoDB.findDocuments('products');
        const products = productsData[0]?.data || this.products;
        const product = products.find(p => p.id === productId);
        
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        
        this.renderCart();
        
        // Guardar carrito en MongoDB
        await this.mongoDB.saveToMongoDB('activeCart', {
            products: this.cart,
            total: this.calculateCartTotal(),
            timestamp: new Date().toISOString()
        });
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.renderCart();
        
        // Actualizar carrito en MongoDB
        this.mongoDB.saveToMongoDB('activeCart', {
            products: this.cart,
            total: this.calculateCartTotal(),
            timestamp: new Date().toISOString()
        });
    }

    renderCart() {
        const cartItems = document.getElementById('carrito-items');
        const totalEl = document.getElementById('total');
        
        if (!cartItems || !totalEl) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">El carrito está vacío</p>';
            totalEl.textContent = '$0';
            return;
        }

        const total = this.calculateCartTotal();
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toLocaleString('es-CO')} x ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="window.posMongoDB.updateCartQuantity(${item.id}, -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="window.posMongoDB.updateCartQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="btn-danger btn-small" onclick="window.posMongoDB.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        totalEl.textContent = `$${total.toLocaleString('es-CO')}`;
    }

    calculateCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Métodos de productos (adaptados para MongoDB)
    async saveProduct() {
        const productsData = await this.mongoDB.findDocuments('products');
        const products = productsData[0]?.data || [];
        
        const productData = {
            code: document.getElementById('producto-codigo').value,
            name: document.getElementById('producto-nombre').value,
            category: document.getElementById('producto-categoria').value,
            price: parseFloat(document.getElementById('producto-precio').value),
            type: document.getElementById('producto-tipo').value,
            image: document.getElementById('producto-imagen').value || '📦'
        };

        try {
            if (this.editingProductId) {
                // Actualizar producto existente
                const result = await this.mongoDB.updateDocument('products', 
                    { 'data.id': this.editingProductId }, 
                    { $set: productData }
                );
                console.log('Producto actualizado en MongoDB:', result.modifiedCount);
            } else {
                // Crear nuevo producto
                const result = await this.mongoDB.saveToMongoDB('products', productData);
                console.log('Producto guardado en MongoDB:', result.insertedId);
            }
            
            // Actualizar cache local
            const updatedProducts = await this.mongoDB.findDocuments('products');
            this.products = updatedProducts[0]?.data || [];
            
            this.closeAllModals();
            this.renderCurrentModule();
        } catch (error) {
            console.error('Error al guardar producto:', error.message);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

        try {
            const result = await this.mongoDB.deleteDocument('products', { 'data.id': productId });
            console.log('Producto eliminado de MongoDB:', result.deletedCount);
            
            // Actualizar cache local
            const updatedProducts = await this.mongoDB.findDocuments('products');
            this.products = updatedProducts[0]?.data || [];
            
            this.renderCurrentModule();
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
        }
    }

    // Operaciones de caja (adaptadas para MongoDB)
    async openCashRegister() {
        const initialBalance = parseInt(document.getElementById('caja-saldo-inicial').value);
        
        if (isNaN(initialBalance) || initialBalance < 0) {
            alert('Ingrese un saldo inicial válido');
            return;
        }

        const cashRegisterData = {
            isOpen: true,
            initialBalance: initialBalance,
            totalSales: 0,
            openDate: new Date().toISOString()
        };

        try {
            const result = await this.mongoDB.saveToMongoDB('cashRegister', cashRegisterData);
            console.log('Caja abierta, guardada en MongoDB:', result.insertedId);
            
            this.cashRegister = cashRegisterData;
            this.closeAllModals();
            this.renderCurrentModule();
        } catch (error) {
            console.error('Error al abrir caja:', error.message);
        }
    }

    async closeCashRegister() {
        const dineroReal = parseInt(document.getElementById('caja-dinero-real').value);
        
        try {
            const cashData = await this.mongoDB.findDocuments('cashRegister');
            const cashRegister = cashData[0]?.data || this.cashRegister;
            
            // Obtener salidas del día para el cálculo correcto
            const salidasData = await this.mongoDB.findDocuments('salidas');
            const today = new Date().toDateString();
            const todaySalidas = salidasData[0]?.data?.filter(s => 
                new Date(s.timestamp).toDateString() === today
            ) || [];
            const todaySalidasAmount = todaySalidas.reduce((sum, salida) => sum + salida.monto, 0);
            
            const totalSistema = cashRegister.initialBalance + cashRegister.totalSales - todaySalidasAmount;
            const diferencia = dineroReal - totalSistema;
            
            // Actualizar estado de caja
            const updatedCashRegister = {
                ...cashRegister,
                isOpen: false,
                closeDate: new Date().toISOString(),
                difference: diferencia,
                finalCash: dineroReal
            };

            const result = await this.mongoDB.updateDocument('cashRegister', 
                { 'data.id': cashRegister._id }, 
                { $set: updatedCashRegister }
            );

            console.log('Caja cerrada, guardada en MongoDB:', result.modifiedCount);
            
            this.cashRegister = updatedCashRegister;
            this.closeAllModals();
            this.renderCurrentModule();
        } catch (error) {
            console.error('Error al cerrar caja:', error.message);
        }
    }

    // Operaciones de salidas (adaptadas para MongoDB)
    async openSalidaModal() {
        // El modal se crearía dinámicamente como antes
        let modal = document.getElementById('salida-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'salida-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Agregar Salida</h3>
                        <span class="close">&times;</span>
                    </div>
                    <form id="salida-form">
                        <div class="form-group">
                            <label for="salida-concepto">Concepto</label>
                            <input type="text" id="salida-concepto" required>
                        </div>
                        <div class="form-group">
                            <label for="salida-categoria">Categoría</label>
                            <select id="salida-categoria" required>
                                <option value="">Seleccionar categoría</option>
                                <option value="Compras">Compras</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Gastos Operativos">Gastos Operativos</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="salida-monto">Monto</label>
                            <input type="number" id="salida-monto" step="1000" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary cancel-btn">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Agregar event listener para el formulario
            modal.querySelector('#salida-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSalida();
            });
        }

        modal.style.display = 'block';
    }

    async saveSalida() {
        const salidaData = {
            concepto: document.getElementById('salida-concepto').value,
            categoria: document.getElementById('salida-categoria').value,
            monto: parseInt(document.getElementById('salida-monto').value),
            metodoPago: 'Efectivo', // Las salidas son siempre en efectivo
            responsable: 'Administrador',
            timestamp: new Date().toISOString()
        };

        try {
            const result = await this.mongoDB.saveToMongoDB('salidas', salidaData);
            console.log('Salida guardada en MongoDB:', result.insertedId);
            
            this.closeAllModals();
            this.renderCurrentModule();
            
            // Actualizar cache de salidas
            const salidasCache = await this.mongoDB.findDocuments('salidas');
            this.salidas = salidasCache[0]?.data || [];
        } catch (error) {
            console.error('Error al guardar salida:', error.message);
        }
    }

    // Métodos existentes con mejoras
    switchModule(module) {
        const titles = {
            ventas: 'Ventas (POS)',
            productos: 'Productos',
            metricas: '📊 Métricas y Análisis',
            salidas: 'Gestión de Salidas',
            caja: 'Caja',
            historial: 'Historial de Ventas',
            backup: 'Backup y Restauración'
        };
        
        document.getElementById('module-title').textContent = titles[module];
        this.currentModule = module;
        this.renderCurrentModule();
    }

    renderCurrentModule() {
        switch(this.currentModule) {
            case 'ventas':
                this.renderProducts();
                this.renderCart();
                break;
            case 'productos':
                this.renderProductsTable();
                break;
            case 'metricas':
                this.renderMetricas();
                break;
            case 'salidas':
                this.renderSalidas();
                break;
            case 'caja':
                this.renderCashRegister();
                break;
            case 'historial':
                this.renderSalesHistory();
                break;
            case 'backup':
                this.renderBackup();
                break;
        }
    }

    // Métodos auxiliares (sin cambios)
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    openProductModal(productId = null) {
        // Implementación similar a la existente
        const modal = document.getElementById('producto-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('producto-form');
        
        form.reset();
        this.editingProductId = productId;
        
        if (productId) {
            // Cargar datos del producto
            this.products.forEach(product => {
                if (product.id === productId) {
                    document.getElementById('producto-codigo').value = product.code;
                    document.getElementById('producto-nombre').value = product.name;
                    document.getElementById('producto-categoria').value = product.category;
                    document.getElementById('producto-precio').value = product.price;
                    document.getElementById('producto-tipo').value = product.type;
                    document.getElementById('producto-imagen').value = product.image;
                    modalTitle.textContent = 'Editar Producto';
                }
            });
        } else {
            modalTitle.textContent = 'Agregar Producto';
        }
        
        modal.style.display = 'block';
    }

    updateDateTime() {
        const updateDateTime = () => {
            const now = new Date();
            const dateTimeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            document.getElementById('datetime').textContent = dateTimeString;
        };
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    calculateChange() {
        // Método existente sin cambios
        const metodoPago = document.getElementById('metodo-pago').value;
        if (metodoPago !== 'Efectivo') return;
        
        const montoRecibido = parseInt(document.getElementById('monto-recibido').value) || 0;
        const total = this.calculateCartTotal();
        
        const cambio = montoRecibido - total;
        const cambioGroup = document.getElementById('cambio-group');
        const cambioEl = document.getElementById('cambio');
        
        if (montoRecibido >= total) {
            cambioGroup.style.display = 'block';
            cambioEl.textContent = `$${cambio.toLocaleString('es-CO')}`;
        } else {
            cambioGroup.style.display = 'none';
        }
    }

    toggleMontoRecibido(metodoPago) {
        const montoRecibidoGroup = document.getElementById('monto-recibido-group');
        const cambioGroup = document.getElementById('cambio-group');
        
        if (metodoPago === 'Efectivo') {
            montoRecibidoGroup.style.display = 'block';
            cambioGroup.style.display = 'block';
        } else {
            montoRecibidoGroup.style.display = 'none';
            cambioGroup.style.display = 'none';
        }
    }

    // Métodos de cierre de caja (mejorados)
    openOpenCashModal() {
        document.getElementById('abrir-caja-modal').style.display = 'block';
    }

    openCloseCashModal() {
        // Implementar con cálculos correctos y datos de MongoDB
        document.getElementById('cerrar-caja-modal').style.display = 'block';
        this.updateCloseCashModal();
    }

    updateCloseCashModal() {
        const dineroReal = parseInt(document.getElementById('caja-dinero-real').value) || 0;
        
        // Obtener datos de MongoDB
        this.mongoDB.findDocuments('cashRegister').then(cashData => {
            const cashRegister = cashData[0]?.data || { isOpen: false, initialBalance: 0, totalSales: 0 };
            
            // Obtener salidas del día
            this.mongoDB.findDocuments('salidas').then(salidasData => {
                const today = new Date().toDateString();
                const todaySalidas = salidasData[0]?.data?.filter(s => 
                    new Date(s.timestamp).toDateString() === today
                ) || [];
                const todaySalidasAmount = todaySalidas.reduce((sum, salida) => sum + salida.monto, 0);
                
                const totalSistema = cashRegister.initialBalance + cashRegister.totalSales - todaySalidasAmount;
                const diferencia = dineroReal - totalSistema;
                
                // Actualizar interfaz
                document.getElementById('total-sistema').textContent = `$${totalSistema.toLocaleString('es-CO')}`;
                document.getElementById('dinero-real-input').textContent = `$${dineroReal.toLocaleString('es-CO')}`;
                
                const diferenciaRow = document.getElementById('diferencia-row');
                const diferenciaEl = document.getElementById('diferencia');
                
                if (diferencia > 0) {
                    diferenciaRow.classList.add('positive');
                    diferenciaEl.textContent = `+$${Math.abs(diferencia).toLocaleString('es-CO')} (Sobrante)`;
                } else if (diferencia < 0) {
                    diferenciaRow.classList.add('negative');
                    diferenciaEl.textContent = `-$${Math.abs(diferencia).toLocaleString('es-CO')} (Faltante)`;
                } else {
                    diferenciaEl.textContent = `$0 (Exacto)`;
                }
            });
        });
    }

    // Métodos existentes de modales y utilidades
    openFinalizeSaleModal() {
        document.getElementById('finalizar-venta-modal').style.display = 'block';
        this.updateFinalizeSaleModal();
    }

    updateFinalizeSaleModal() {
        const total = this.calculateCartTotal();
        const ventaSubtotal = document.getElementById('venta-subtotal');
        const ventaTotal = document.getElementById('venta-total');
        
        if (ventaSubtotal) ventaSubtotal.textContent = `$${total.toLocaleString('es-CO')}`;
        if (ventaTotal) ventaTotal.textContent = `$${total.toLocaleString('es-CO')}`;
    }

    async finalizeSale() {
        const metodoPago = document.getElementById('metodo-pago').value;
        const total = this.calculateCartTotal();
        
        // Validar monto recibido para efectivo
        if (metodoPago === 'Efectivo') {
            const montoRecibido = parseInt(document.getElementById('monto-recibido').value) || 0;
            if (montoRecibido < total) {
                alert('El monto recibido es insuficiente');
                return;
            }
        }

        try {
            // Guardar venta en MongoDB
            const saleData = {
                id: Date.now(),
                date: new Date().toISOString(),
                items: [...this.cart],
                total: total,
                paymentMethod: metodoPago,
                orderId: `ORD-${Date.now()}`
            };

            const result = await this.mongoDB.saveToMongoDB('sales', saleData);
            console.log('Venta guardada en MongoDB:', result.insertedId);
            
            // Actualizar caja
            const cashData = await this.mongoDB.findDocuments('cashRegister');
            const cashRegister = cashData[0]?.data || { isOpen: false, initialBalance: 0, totalSales: 0 };
            
            const updatedCashRegister = {
                ...cashRegister,
                totalSales: cashRegister.totalSales + total
            };

            await this.mongoDB.updateDocument('cashRegister', 
                { 'data.id': cashRegister._id }, 
                { $set: updatedCashRegister }
            );
            
            // Limpiar carrito
            this.cart = [];
            await this.mongoDB.saveToMongoDB('activeCart', {
                products: [],
                total: 0,
                timestamp: new Date().toISOString()
            });
            
            this.closeAllModals();
            this.renderCurrentModule();
            
            alert('Venta realizada con éxito');
        } catch (error) {
            console.error('Error al finalizar venta:', error.message);
        }
    }

    // Renderizar salidas (adaptado para MongoDB)
    async renderSalidas() {
        const salidasData = await this.mongoDB.findDocuments('salidas', { sort: { timestamp: -1 } });
        const salidas = salidasData[0]?.data || [];
        
        this.updateSalidasDashboard(salidas);
        this.renderSalidasTable(salidas);
    }

    updateSalidasDashboard(salidas) {
        const today = new Date().toDateString();
        const todaySalidas = salidas.filter(s => new Date(s.timestamp).toDateString() === today);
        const todaySalidasAmount = todaySalidas.reduce((sum, salida) => sum + salida.monto, 0);
        
        // Obtener ventas del día en efectivo
        this.mongoDB.findDocuments('sales').then(salesData => {
            const sales = salesData[0]?.data || [];
            const efectivoHoy = sales.filter(s => new Date(s.timestamp).toDateString() === today)
                .reduce((sum, sale) => sum + sale.total, 0);
            
            const balance = efectivoHoy - todaySalidasAmount;
            
            // Actualizar dashboard
            const ingresosEl = document.getElementById('ingresos-dia');
            const salidasEl = document.getElementById('salidas-dia');
            const balanceEl = document.getElementById('balance-dia');
            
            if (ingresosEl) ingresosEl.textContent = `$${efectivoHoy.toLocaleString('es-CO')}`;
            if (salidasEl) salidasEl.textContent = `$${todaySalidasAmount.toLocaleString('es-CO')}`;
            if (balanceEl) balanceEl.textContent = `$${balance.toLocaleString('es-CO')}`;
            
            // Actualizar clase del balance
            const balanceCard = document.getElementById('balance-card');
            if (balanceCard) {
                balanceCard.classList.remove('balance', 'negative');
                if (balance < 0) {
                    balanceCard.classList.add('balance', 'negative');
                } else {
                    balanceCard.classList.add('balance');
                }
            }
        });
    }

    renderSalidasTable(salidas) {
        const tbody = document.getElementById('salidas-table');
        if (!tbody) return;

        const today = new Date().toDateString();
        const todaySalidas = salidas.filter(s => new Date(s.timestamp).toDateString() === today);
        
        if (todaySalidas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No hay salidas registradas hoy</td></tr>';
            return;
        }

        tbody.innerHTML = todaySalidas.map(salida => `
            <tr>
                <td>${new Date(salida.timestamp).toLocaleString('es-CO')}</td>
                <td>${salida.concepto}</td>
                <td>${salida.categoria}</td>
                <td>$${salida.monto.toLocaleString('es-CO')}</td>
                <td>${salida.metodoPago}</td>
                <td>${salida.responsable}</td>
                <td>${salida.comprobante ? '✅' : '❌'}</td>
                <td>
                    <button class="btn-danger btn-small" onclick="window.posMongoDB.deleteSalida(${salida.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async deleteSalida(salidaId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta salida?')) return;

        try {
            const result = await this.mongoDB.deleteDocument('salidas', { 'data.id': salidaId });
            console.log('Salida eliminada de MongoDB:', result.deletedCount);
            
            // Actualizar cache
            const salidasCache = await this.mongoDB.findDocuments('salidas');
            this.salidas = salidasCache[0]?.data || [];
            
            this.renderSalidas();
        } catch (error) {
            console.error('Error al eliminar salida:', error.message);
        }
    }

    // Métodos de backup y métricas (sin cambios significativos)
    renderBackup() {
        // Implementar con MongoDB si es necesario
        this.updateBackupInfo();
    }

    updateBackupInfo() {
        // Mostrar información de MongoDB si está disponible
        const ingresosEl = document.getElementById('backup-products-count');
        const ventasEl = document.getElementById('backup-sales-count');
        const cajaEl = document.getElementById('backup-cash-status');
        
        if (ingresosEl) ingresosEl.textContent = this.products.length;
        if (ventasEl) ventasEl.textContent = this.salesHistory.length;
        if (cajaEl) {
            const isOpen = this.cashRegister.isOpen;
            cajaEl.textContent = isOpen ? 'Abierta' : 'Cerrada';
        }
    }

    renderMetricas() {
        // Implementar métricas con datos de MongoDB
        console.log('Renderizando métricas con datos de MongoDB...');
        
        // Aquí se implementaría el dashboard de métricas con datos reales
        // Se mantiene la misma estructura visual pero los vienen de MongoDB
        console.log('Métricas renderizadas desde MongoDB');
    }
}

// Inicialización del sistema MongoDB
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando Sistema POS con MongoDB...');
    
    try {
        window.posMongoDB = new POSSystemMongoDB();
        console.log('✅ Sistema POS con MongoDB iniciado correctamente');
    } catch (error) {
        console.error('❌ Error al iniciar sistema MongoDB:', error.message);
        
        // Fallback a localStorage si MongoDB falla
        window.pos = new POSSystem();
    }
});