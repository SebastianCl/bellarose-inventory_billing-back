/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de facturas
* @description Se configura el modelo de facturas. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

// Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de factura
*/
const invoiceSchema = new Schema({
    reserve: { type: Schema.Types.Key, read: true, ref: 'Reserve', required: true },
    customerName: { type: String, required: true },
    customerIdentification: { type: String, required: true },
    employeeName: { type: String, required: true },
    reserveNumber: { type: Number, required: true },
    invoiceNumber: { type: Number, required: true },
    subTotal: { type: Number, read: true, required: true },
    cost: { type: Number, read: true, required: true },
    deposit: { type: Number, read: true, required: true },
    payment: { type: Number, read: true, required: true },
    description: { type: String, read: true, required: true },
    date: { type: Date, required: false, default: gstore.defaultValues.NOW },
    active: { type: Boolean, read: true, default: true }, // false: al pagar el total de la factura
    disable: { type: Boolean, read: true, default: false }, // true: si se solicita deshabilitar
    type: { type: String, required: false } // Reserva:1, Venta:2, Daños:3
});

// Exportar el esquema de base de datos como 'Invoice'
module.exports = gstore.model('Invoice', invoiceSchema);
