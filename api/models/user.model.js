/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de usuarios
* @description Se configura el modelo de usuarios. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

// Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de usuario
*/
const userSchema = new Schema({
    firstname: { type: String, read: true, required: true },
    lastname: { type: String, read: true, required: true },
    email: { type: String, read: true, required: true, validate: 'isEmail' },
    password: { type: String, read: true, required: true },
    active: { type: Boolean, read: true, required: true }
});

//Exporto el esquema de base de datos como 'User'
module.exports = gstore.model('User', userSchema);
