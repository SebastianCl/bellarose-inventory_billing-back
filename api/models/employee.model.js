/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de empleados
* @description Se configura el modelo de empleados. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

// Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de empleado
*/
const employeeSchema = new Schema({
    name: { type: String, read: true, required: true },
    identification: { type: Number, read: true, required: true }, // cédula
    direction: { type: String, read: true, required: false },
    email: { type: String, read: true, required: false, validate: 'isEmail' },
    telephone: { type: Number, read: true, required: false },
    active: { type: Boolean, read: true, required: true }
});

// Exporto el esquema de base de datos como 'Employee'
module.exports = gstore.model('Employee', employeeSchema);
