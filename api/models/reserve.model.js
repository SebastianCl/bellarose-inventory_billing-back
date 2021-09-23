/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
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
    customer: { type: Schema.Types.Key, read: true, ref: 'Customer', required: true },
    employee: { type: Schema.Types.Key, read: true, ref: 'Employee', required: true },
    customerName: { type: String, required: true },
    customerIdentification: { type: String, required: true },
    employeeIdentification: { type: String, required: true },
    employeeName: { type: String, required: true },
    articles: [{ type: Array, read: true, required: true }],
    description: { type: String, required: false, default: '' },
    reserveDay: { type: Date, required: false, default: gstore.defaultValues.NOW },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reserveNumber: { type: Number, required: true },
    invoiceNumber: { type: Number, required: false, default: 0 },
    active: { type: Boolean, required: false, default: true },
    cost: { type: Number, required: true },
    status: { type: String, required: true }
});

reserveSchema.queries('list');

//Exporto el esquema de base de datos como 'Reserve'
module.exports = gstore.model('Reserve', reserveSchema);
