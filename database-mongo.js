// Configuración de MongoDB
const MONGODB_CONFIG = {
    development: {
        uri: 'mongodb://localhost:27017/heladeriapos',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    production: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/heladeriapos',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    }
};

// Data Access Layer - MongoDB Operations
class MongoDBDataAccess {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const { MongoClient } = require('mongodb');
            this.client = new MongoClient(MONGODB_CONFIG.development.uri, MONGODB_CONFIG.development.options);
            
            await this.client.connect();
            this.db = this.client.db();
            this.isConnected = true;
            
            console.log('✅ Conectado a MongoDB');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('🔌 Desconectado de MongoDB');
        }
    }

    // Operaciones CRUD para cada colección
    async saveDocument(collection, document) {
        if (!this.isConnected) {
            console.warn('⚠️ No conectado a MongoDB');
            return false;
        }

        try {
            const result = await this.db.collection(collection).insertOne(document);
            console.log(`✅ Guardado en ${collection}:`, result.insertedId);
            return result;
        } catch (error) {
            console.error(`❌ Error guardando en ${collection}:`, error.message);
            throw error;
        }
    }

    async updateDocument(collection, filter, update) {
        if (!this.isConnected) {
            console.warn('⚠️ No conectado a MongoDB');
            return false;
        }

        try {
            const result = await this.db.collection(collection).updateOne(filter, { $set: update });
            console.log(`✅ Actualizado en ${collection}:`, result.modifiedCount);
            return result;
        } catch (error) {
            console.error(`❌ Error actualizando en ${collection}:`, error.message);
            throw error;
        }
    }

    async findDocuments(collection, filter = {}, options = {}) {
        if (!this.isConnected) {
            console.warn('⚠️ No conectado a MongoDB');
            return [];
        }

        try {
            const result = await this.db.collection(collection).find(filter, options).toArray();
            console.log(`📋 Encontrados ${result.length} documentos en ${collection}`);
            return result;
        } catch (error) {
            console.error(`❌ Error buscando en ${collection}:`, error.message);
            return [];
        }
    }

    async deleteDocument(collection, filter) {
        if (!this.isConnected) {
            console.warn('⚠️ No conectado a MongoDB');
            return false;
        }

        try {
            const result = await this.db.collection(collection).deleteOne(filter);
            console.log(`🗑️ Eliminado de ${collection}:`, result.deletedCount);
            return result;
        } catch (error) {
            console.error(`❌ Error eliminando de ${collection}:`, error.message);
            throw error;
        }
    }

    async aggregateDocuments(collection, pipeline) {
        if (!this.isConnected) {
            console.warn('⚠️ No conectado a MongoDB');
            return [];
        }

        try {
            const result = await this.db.collection(collection).aggregate(pipeline).toArray();
            console.log(`📊 Agregación completada en ${collection}:`, result.length);
            return result;
        } catch (error) {
            console.error(`❌ Error agregando en ${collection}:`, error.message);
            return [];
        }
    }
}

// Adaptador para migrar del localStorage a MongoDB
class DataMigrationAdapter {
    constructor(mongoDB) {
        this.mongoDB = mongoDB;
    }

    async migrateFromLocalStorage() {
        console.log('🔄 Iniciando migración desde localStorage a MongoDB...');
        
        try {
            // Productos
            const products = JSON.parse(localStorage.getItem('products')) || [];
            if (products.length > 0) {
                await this.mongoDB.saveDocument('products', {
                    migration: true,
                    timestamp: new Date().toISOString(),
                    data: products
                });
            }

            // Ventas
            const sales = JSON.parse(localStorage.getItem('salesHistory')) || [];
            if (sales.length > 0) {
                await this.mongoDB.saveDocument('sales', {
                    migration: true,
                    timestamp: new Date().toISOString(),
                    data: sales
                });
            }

            // Caja
            const cashRegister = JSON.parse(localStorage.getItem('cashRegister')) || {};
            await this.mongoDB.saveDocument('cashRegister', {
                migration: true,
                timestamp: new Date().toISOString(),
                data: cashRegister
            });

            // Salidas
            const salidas = JSON.parse(localStorage.getItem('salidas')) || [];
            if (salidas.length > 0) {
                await this.mongoDB.saveDocument('salidas', {
                    migration: true,
                    timestamp: new Date().toISOString(),
                    data: salidas
                });
            }

            // Carrito activo
            const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            if (cart.length > 0) {
                await this.mongoDB.saveDocument('activeCart', {
                    migration: true,
                    timestamp: new Date().toISOString(),
                    data: cart
                });
            }

            console.log('✅ Migración completada a MongoDB');
            
            // Limpiar localStorage después de migración exitosa
            // localStorage.clear();
            // sessionStorage.clear();
            
            return true;
        } catch (error) {
            console.error('❌ Error en migración:', error.message);
            return false;
        }
    }

    async saveToMongoDB(collection, data) {
        try {
            const documentWithTimestamp = {
                ...data,
                timestamp: new Date().toISOString(),
                sessionId: this.generateSessionId()
            };

            const result = await this.mongoDB.saveDocument(collection, documentWithTimestamp);
            console.log(`💾 Guardado en MongoDB ${collection}:`, result.insertedId);
            return result;
        } catch (error) {
            console.error(`❌ Error guardando en MongoDB ${collection}:`, error.message);
            throw error;
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export { MongoDBDataAccess, DataMigrationAdapter, MONGODB_CONFIG };