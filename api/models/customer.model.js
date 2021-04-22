/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de clientes
* @description Se configura el modelo de clientes. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

// Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de cliente
*/
const customerSchema = new Schema({
    name: { type: String, read: true, required: true },
    identification: { type: String, read: true, required: true }, // cédula
    direction: { type: String, read: true, required: true },
    email: { type: String, read: true, required: false, validate: 'isEmail', default: '' },
    telephone1: { type: String, read: true, required: true },
    telephone2: { type: String, read: true, required: true },
    telephone3: { type: String, read: true, required: false, default: '' }
});

// Exporto el esquema de base de datos como 'Customer'
module.exports = gstore.model('Customer', customerSchema);
