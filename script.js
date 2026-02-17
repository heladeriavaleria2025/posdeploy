// POS System - JavaScript
class POSSystem {
    constructor() {
        this.currentModule = 'ventas';
        this.cart = [];
        this.editingProductId = null;
        this.initializeData();
        this.initializeEventListeners();
        this.updateDateTime();
        this.renderCurrentModule();
    }

    // Initialize data with localStorage or default values
    initializeData() {
        // Products
        if (!localStorage.getItem('products')) {
            const defaultProducts = [
                {
                    id: 1,
                    code: '001',
                    name: 'Helado de Vainilla',
                    category: 'Helados',
                    cost: 12000.00,
                    price: 25000.00,
                    type: 'preparado',
                    image: '🍦'
                },
                {
                    id: 2,
                    code: '002',
                    name: 'Helado de Chocolate',
                    category: 'Helados',
                    cost: 12000.00,
                    price: 25000.00,
                    type: 'preparado',
                    image: '🍫'
                },
                {
                    id: 3,
                    code: '003',
                    name: 'Malteada de Fresa',
                    category: 'Bebidas',
                    cost: 15000.00,
                    price: 35000.00,
                    type: 'preparado',
                    image: '🥤'
                },
                {
                    id: 4,
                    code: '004',
                    name: 'Cono de Helado',
                    category: 'Helados',
                    cost: 8000.00,
                    price: 15000.00,
                    type: 'preparado',
                    image: '🍨'
                },
                {
                    id: 5,
                    code: '005',
                    name: 'Sundae Especial',
                    category: 'Postres',
                    cost: 20000.00,
                    price: 45000.00,
                    type: 'preparado',
                    image: '🍧'
                },
                {
                    id: 6,
                    code: '006',
                    name: 'Refresco Cola',
                    category: 'Bebidas',
                    cost: 5000.00,
                    price: 12000.00,
                    type: 'inventario',
                    image: '🥤'
                },
                {
                    id: 7,
                    code: '007',
                    name: 'Copa de Frutas',
                    category: 'Postres',
                    cost: 18000.00,
                    price: 30000.00,
                    type: 'preparado',
                    image: '🍓'
                },
                {
                    id: 8,
                    code: '008',
                    name: 'Helado de Limón',
                    category: 'Helados',
                    cost: 12000.00,
                    price: 25000.00,
                    type: 'preparado',
                    image: '🍋'
                }
            ];
            localStorage.setItem('products', JSON.stringify(defaultProducts));
        }

        // Cash Register
        if (!localStorage.getItem('cashRegister')) {
            const defaultCashRegister = {
                isOpen: false,
                initialBalance: 0,
                currentBalance: 0,
                totalSales: 0,
                openDate: null,
                closeDate: null
            };
            localStorage.setItem('cashRegister', JSON.stringify(defaultCashRegister));
        }

        // Sales History
        if (!localStorage.getItem('salesHistory')) {
            localStorage.setItem('salesHistory', JSON.stringify([]));
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                this.switchModule(module);
            });
        });

        // Search products
        document.getElementById('search-product').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Add product button
        document.getElementById('agregar-producto').addEventListener('click', () => {
            this.openProductModal();
        });

        // Product form
        document.getElementById('producto-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Cash register buttons
        document.getElementById('abrir-caja').addEventListener('click', () => {
            this.openOpenCashModal();
        });

        document.getElementById('cerrar-caja').addEventListener('click', () => {
            this.openCloseCashModal();
        });

        // Cash register forms
        document.getElementById('abrir-caja-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.openCashRegister();
        });

        document.getElementById('cerrar-caja-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.closeCashRegister();
        });

        // Finalize sale button
        document.getElementById('finalizar-venta').addEventListener('click', () => {
            this.openFinalizeSaleModal();
        });

        // Finalize sale form
        document.getElementById('finalizar-venta-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.finalizeSale();
        });

        // Payment method change
        document.getElementById('metodo-pago').addEventListener('change', (e) => {
            const montoRecibidoGroup = document.getElementById('monto-recibido-group');
            const cambioGroup = document.getElementById('cambio-group');
            
            if (e.target.value === 'Efectivo') {
                montoRecibidoGroup.style.display = 'block';
            } else {
                montoRecibidoGroup.style.display = 'none';
                cambioGroup.style.display = 'none';
            }
        });

        // Billetes rápidos
        document.querySelectorAll('.billete').forEach(billete => {
            billete.addEventListener('click', () => {
                const value = parseInt(billete.dataset.value);
                const montoRecibidoInput = document.getElementById('monto-recibido');
                const currentValue = parseInt(montoRecibidoInput.value) || 0;
                montoRecibidoInput.value = currentValue + value;
                
                // Toggle selected state
                billete.classList.toggle('selected');
                
                // Calculate change
                this.calculateChange();
            });
        });

        // Amount received input
        document.getElementById('monto-recibido').addEventListener('input', (e) => {
            this.calculateChange();
        });

        // Modal close buttons
        document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Filter sales button
        document.getElementById('filter-sales').addEventListener('click', () => {
            this.filterSales();
        });
    }

    // Module switching
    switchModule(module) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const targetNavItem = document.querySelector(`[data-module="${module}"]`);
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }

        // Update content
        document.querySelectorAll('.module').forEach(m => {
            m.classList.remove('active');
        });
        const targetModule = document.getElementById(`${module}-module`);
        if (targetModule) {
            targetModule.classList.add('active');
        }

        // Update title
        const titles = {
            ventas: 'Ventas (POS)',
            productos: 'Productos',
            stock: 'Stock',
            caja: 'Caja',
            historial: 'Historial de Ventas'
        };
        document.getElementById('module-title').textContent = titles[module];

        this.currentModule = module;
        this.renderCurrentModule();
    }

    // Render current module content
    renderCurrentModule() {
        switch (this.currentModule) {
            case 'ventas':
                this.renderProducts();
                this.renderCart();
                break;
            case 'productos':
                this.renderProductsTable();
                break;

            case 'caja':
                this.renderCashRegister();
                break;
            case 'historial':
                this.renderSalesHistory();
                break;
        }
    }

    // Products rendering for sales
    renderProducts() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;
        
        const products = JSON.parse(localStorage.getItem('products')) || [];
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 40px; grid-column: 1 / -1;">No hay productos disponibles</p>';
            return;
        }
        
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" onclick="pos.addToCart(${product.id})">
                <div class="product-image">${product.image || '📦'}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                <div class="product-type">
                    ${product.type === 'preparado' ? '🍳 Preparado' : '📦 Inventario'}
                </div>
            </div>
        `).join('');
    }

    // Filter products
    filterProducts(searchTerm) {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const productsGrid = document.getElementById('products-grid');
        if (filtered.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No se encontraron productos</p>';
        } else {
            productsGrid.innerHTML = filtered.map(product => `
                <div class="product-card" onclick="pos.addToCart(${product.id})">
                    <div class="product-image">${product.image || '📦'}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    <div class="product-stock ${product.stock <= product.minStock ? 'low' : ''}">
                        Stock: ${product.stock}
                    </div>
                </div>
            `).join('');
        }
    }

    // Add to cart
    addToCart(productId) {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.renderCart();
    }

    // Update cart quantity
    updateCartQuantity(productId, change) {
        const cartItem = this.cart.find(item => item.id === productId);
        if (!cartItem) return;

        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity <= 0) {
            this.cart = this.cart.filter(item => item.id !== productId);
        } else {
            cartItem.quantity = newQuantity;
        }
        
        this.renderCart();
    }

    // Remove from cart
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.renderCart();
    }

    // Render cart
    renderCart() {
        const cartItems = document.getElementById('carrito-items');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">El carrito está vacío</p>';
            if (subtotalEl) subtotalEl.textContent = '$0';
            if (totalEl) totalEl.textContent = '$0';
            return;
        }
        
        cartItems.innerHTML = this.cart.map(item => `
            <div class="carrito-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">$${item.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} c/u</div>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="pos.updateCartQuantity(${item.id}, -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="pos.updateCartQuantity(${item.id}, 1)">+</button>
                    </div>
                    <span class="item-total">$${(item.price * item.quantity).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <button class="quantity-btn" onclick="pos.removeFromCart(${item.id})" style="background: #dc3545; color: white; border-color: #dc3545;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (subtotalEl) subtotalEl.textContent = `$${total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    // Open product modal
    openProductModal(productId = null) {
        const modal = document.getElementById('producto-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('producto-form');
        
        form.reset();
        this.editingProductId = productId;
        
        if (productId) {
            const products = JSON.parse(localStorage.getItem('products')) || [];
            const product = products.find(p => p.id === productId);
            
            if (product) {
                modalTitle.textContent = 'Editar Producto';
                document.getElementById('producto-codigo').value = product.code;
                document.getElementById('producto-nombre').value = product.name;
                document.getElementById('producto-categoria').value = product.category;
                document.getElementById('producto-costo').value = product.cost;
                document.getElementById('producto-precio').value = product.price;
                document.getElementById('producto-imagen').value = product.image;
            }
        } else {
            modalTitle.textContent = 'Agregar Producto';
        }
        
        modal.style.display = 'block';
    }

    // Save product
    saveProduct() {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        
        const productData = {
            code: document.getElementById('producto-codigo').value,
            name: document.getElementById('producto-nombre').value,
            category: document.getElementById('producto-categoria').value,
            cost: parseFloat(document.getElementById('producto-costo').value),
            price: parseFloat(document.getElementById('producto-precio').value),
            type: document.getElementById('producto-tipo').value || 'preparado',
            image: document.getElementById('producto-imagen').value || '📦'
        };
        
        if (this.editingProductId) {
            const index = products.findIndex(p => p.id === this.editingProductId);
            if (index !== -1) {
                products[index] = { ...products[index], ...productData };
            }
        } else {
            const newProduct = {
                ...productData,
                id: Date.now()
            };
            products.push(newProduct);
        }
        
        localStorage.setItem('products', JSON.stringify(products));
        this.closeAllModals();
        this.renderCurrentModule();
    }

    // Delete product
    deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const filtered = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(filtered));
        
        this.renderCurrentModule();
    }

    // Render products table
    renderProductsTable() {
        const tbody = document.getElementById('productos-table');
        if (!tbody) return;
        
        const products = JSON.parse(localStorage.getItem('products')) || [];
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No hay productos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td><div class="product-image" style="width: 40px; height: 40px; margin: 0 auto;">${product.image || '📦'}</div></td>
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${product.cost.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td>$${product.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td>${product.type === 'preparado' ? '🍳 Preparado' : '📦 Inventario'}</td>
                <td>
                    <button class="btn-secondary" onclick="pos.openProductModal(${product.id})" style="margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="pos.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }



    // Render cash register
    renderCashRegister() {
        const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
        const cajaCerrada = document.getElementById('caja-cerrada');
        const cajaAbierta = document.getElementById('caja-abierta');
        
        if (cashRegister.isOpen) {
            cajaCerrada.classList.add('hidden');
            cajaAbierta.classList.remove('hidden');
            
            document.getElementById('saldo-inicial').textContent = `$${cashRegister.initialBalance.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            document.getElementById('total-ventas').textContent = `$${cashRegister.totalSales.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            document.getElementById('saldo-esperado').textContent = `$${(cashRegister.initialBalance + cashRegister.totalSales).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        } else {
            cajaCerrada.classList.remove('hidden');
            cajaAbierta.classList.add('hidden');
        }
    }

    // Open cash modal
    openOpenCashModal() {
        document.getElementById('abrir-caja-modal').style.display = 'block';
    }

    // Open close cash modal
    openCloseCashModal() {
        const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
        const totalSistema = cashRegister.initialBalance + cashRegister.totalSales;
        
        document.getElementById('total-sistema').textContent = `$${totalSistema.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        document.getElementById('cerrar-caja-modal').style.display = 'block';
    }

    // Open cash register
    openCashRegister() {
        const initialBalance = parseFloat(document.getElementById('caja-saldo-inicial').value);
        
        if (isNaN(initialBalance) || initialBalance < 0) {
            alert('Ingrese un saldo inicial válido');
            return;
        }
        
        const cashRegister = {
            isOpen: true,
            initialBalance: initialBalance,
            currentBalance: initialBalance,
            totalSales: 0,
            openDate: new Date().toISOString(),
            closeDate: null
        };
        
        localStorage.setItem('cashRegister', JSON.stringify(cashRegister));
        this.closeAllModals();
        this.renderCurrentModule();
    }

    // Close cash register
    closeCashRegister() {
        const dineroReal = parseFloat(document.getElementById('caja-dinero-real').value);
        const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
        const totalSistema = cashRegister.initialBalance + cashRegister.totalSales;
        const diferencia = dineroReal - totalSistema;
        
        const diferenciaRow = document.getElementById('diferencia-row');
        const diferenciaEl = document.getElementById('diferencia');
        
        diferenciaRow.classList.remove('positive', 'negative');
        if (diferencia > 0) {
            diferenciaRow.classList.add('positive');
            diferenciaEl.textContent = `+${Math.abs(diferencia).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (Sobrante)`;
        } else if (diferencia < 0) {
            diferenciaRow.classList.add('negative');
            diferenciaEl.textContent = `-${Math.abs(diferencia).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (Faltante)`;
        } else {
            diferenciaEl.textContent = `$0 (Exacto)`;
        }
        
        const diferenciaTexto = diferencia >= 0 ? 
            `+$${Math.abs(diferencia).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (Sobrante)` : 
            `-$${Math.abs(diferencia).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (Faltante)`;
        if (confirm(`¿Confirmar cierre de caja?\nDiferencia: ${diferenciaTexto}`)) {
            cashRegister.isOpen = false;
            cashRegister.closeDate = new Date().toISOString();
            cashRegister.difference = diferencia;
            
            localStorage.setItem('cashRegister', JSON.stringify(cashRegister));
            this.closeAllModals();
            this.renderCurrentModule();
        }
    }

    // Update close cash modal values
    updateCloseCashModal() {
        const dineroReal = parseFloat(document.getElementById('caja-dinero-real').value) || 0;
        const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
        const totalSistema = cashRegister.initialBalance + cashRegister.totalSales;
        const diferencia = dineroReal - totalSistema;
        
        document.getElementById('dinero-real-input').textContent = `$${dineroReal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        
        const diferenciaRow = document.getElementById('diferencia-row');
        const diferenciaEl = document.getElementById('diferencia');
        
        diferenciaRow.classList.remove('positive', 'negative');
        if (diferencia > 0) {
            diferenciaRow.classList.add('positive');
            diferenciaEl.textContent = `+${Math.abs(diferencia).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (Sobrante)`;
        } else if (diferencia < 0) {
            diferenciaRow.classList.add('negative');
            diferenciaEl.textContent = `-${Math.abs(diferencia).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (Faltante)`;
        } else {
            diferenciaEl.textContent = `$0 (Exacto)`;
        }
    }

    // Open finalize sale modal
    openFinalizeSaleModal() {
        if (this.cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }
        
        const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
        if (!cashRegister.isOpen) {
            alert('La caja está cerrada. Debe abrir la caja antes de realizar ventas.');
            return;
        }
        
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        document.getElementById('venta-subtotal').textContent = `$${total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        document.getElementById('venta-total').textContent = `$${total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        
        document.getElementById('finalizar-venta-modal').style.display = 'block';
    }

    // Calculate change
    calculateChange() {
        const metodoPago = document.getElementById('metodo-pago').value;
        if (metodoPago !== 'Efectivo') return;
        
        const montoRecibido = parseInt(document.getElementById('monto-recibido').value) || 0;
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const cambio = montoRecibido - total;
        const cambioGroup = document.getElementById('cambio-group');
        const cambioEl = document.getElementById('cambio');
        
        if (montoRecibido >= total) {
            cambioGroup.style.display = 'block';
            cambioEl.textContent = `$${cambio.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        } else {
            cambioGroup.style.display = 'none';
        }
    }

    // Finalize sale
    finalizeSale() {
        const metodoPago = document.getElementById('metodo-pago').value;
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (metodoPago === 'Efectivo') {
            const montoRecibido = parseInt(document.getElementById('monto-recibido').value) || 0;
            if (montoRecibido < total) {
                alert('El monto recibido es insuficiente');
                return;
            }
        }
        }
        

        
        // Update cash register
        const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
        cashRegister.totalSales += total;
        cashRegister.currentBalance += total;
        localStorage.setItem('cashRegister', JSON.stringify(cashRegister));
        
        // Add to sales history
        const salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
        const sale = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: [...this.cart],
            total: total,
            paymentMethod: metodoPago,
            orderId: `ORD-${Date.now()}`
        };
        salesHistory.push(sale);
        localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
        
        // Clear cart and close modal
        this.cart = [];
        this.closeAllModals();
        this.renderCurrentModule();
        
        alert('Venta realizada con éxito');
    }

    // Render sales history
    renderSalesHistory(filterDate = null) {
        const tbody = document.getElementById('historial-table');
        let salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
        
        // Filter by date if specified
        if (filterDate) {
            const filterDateObj = new Date(filterDate + 'T00:00:00');
            const nextDay = new Date(filterDateObj);
            nextDay.setDate(nextDay.getDate() + 1);
            
            salesHistory = salesHistory.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= filterDateObj && saleDate < nextDay;
            });
        }
        
        // Sort by date (newest first)
        salesHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (salesHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No hay ventas registradas</td></tr>';
            return;
        }
        
        tbody.innerHTML = salesHistory.map(sale => {
            const date = new Date(sale.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const itemsCount = sale.items.length;
            
            return `
                <tr>
                    <td>${sale.orderId}</td>
                    <td>${formattedDate}</td>
                    <td>${itemsCount} producto${itemsCount !== 1 ? 's' : ''}</td>
                    <td>$${sale.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td>${sale.paymentMethod}</td>
                    <td>
                        <button class="btn-secondary" onclick="pos.viewSaleDetails(${sale.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Filter sales
    filterSales() {
        const filterDate = document.getElementById('filter-date').value;
        this.renderSalesHistory(filterDate);
    }

    // View sale details
    viewSaleDetails(saleId) {
        const salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
        const sale = salesHistory.find(s => s.id === saleId);
        
        if (!sale) return;
        
        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        let itemsDetails = sale.items.map(item => 
            `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        ).join('\n');
        
        alert(`Orden: ${sale.orderId}
Fecha: ${formattedDate}
Método de pago: ${sale.paymentMethod}

Productos:
${itemsDetails}

Total: $${sale.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    }

    // Update date and time
    updateDateTime() {
        const updateDateTime = () => {
            const now = new Date();
            const dateTimeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            document.getElementById('datetime').textContent = dateTimeString;
        };
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.querySelectorAll('form').forEach(form => {
            form.reset();
        });
    }
}

// Initialize the POS system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando POS...');
    
    // Limpiar localStorage para fresh start
    localStorage.clear();
    
    window.pos = new POSSystem();
    
    // Add event listener for dinero real input (solo si existe)
    const cajaDineroReal = document.getElementById('caja-dinero-real');
    if (cajaDineroReal) {
        cajaDineroReal.addEventListener('input', () => {
            pos.updateCloseCashModal();
        });
    }
    
    // Debug info
    const updateDebugInfo = () => {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const debugProducts = document.getElementById('debug-products');
        const debugModule = document.getElementById('debug-module');
        
        if (debugProducts) {
            debugProducts.textContent = products.length;
        }
        if (debugModule) {
            debugModule.textContent = window.pos.currentModule;
        }
    };
    
    setInterval(updateDebugInfo, 1000);
    updateDebugInfo();
});