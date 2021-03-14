/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de roles
* @description Se configura el modelo de roles. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

// Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de rol
*/
const roleSchema = new Schema({
    role: { type: String, required: true },
    description: { type: String, required: true }
});

// Se exporta el esquema de base de datos como 'Role'
module.exports = gstore.model('Role', roleSchema);
