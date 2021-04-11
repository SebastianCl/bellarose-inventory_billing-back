/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de reserve
* @description Se configura el modelo de reserve. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

//Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de reserve
*/
const reserveSchema = new Schema({
    customerName: { type: String, required: false, default: '' },
    employeeName: { type: String, required: false, default: '' },
    articles: [{ type: Array, read: true, required: true }],
    description: { type: String, required: false, default: '' },
    active: { type: Boolean, required: false, default: true },
    reserveDay: { type: Date, required: false, default: gstore.defaultValues.NOW },
    startDate: { type: String, required: true, default: '' },
    endDate: { type: String, required: true, default: '' },
    reserveNumber: { type: Number, required: true },
    invoiceNumber: { type: Number, required: false, default: 0 }
});

reserveSchema.queries('list');

//Exporto el esquema de base de datos como 'Reserve'
module.exports = gstore.model('Reserve', reserveSchema);
