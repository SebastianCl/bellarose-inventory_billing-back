/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de item
* @description Se configura el modelo de item. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

//Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de item
*/
const itemSchema = new Schema({
    ref: { type: String, required: true },
    description: { type: String, required: true },

    retail: { type: Schema.Types.Double, required: true },
    discount: { type: Schema.Types.Double, required: true },
    price: { type: Schema.Types.Double, required: true },
    quantity: { type: Number, required: true },
    total: { type: Schema.Types.Double, required: false },

    quote: { type: String, required: false, default: '' },
    purchaseOrder: { type: String, required: false, default: '' },
    requested: { type: Boolean, required: false, default: null },
    numCO: { type: Number, default: 0, required: false }
});

itemSchema.queries('list');

//Exporto el esquema de base de datos como 'Item'
module.exports = gstore.model('Item', itemSchema);
