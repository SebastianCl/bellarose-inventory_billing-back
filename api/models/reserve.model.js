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
    items: [{ type: Array, read: true, required: true }],
    description: { type: String, required: false },
    reserveDay: { type: Date, required: false, default: gstore.defaultValues.NOW },
    startDate: { type: String, required: true, default: '' },
    endDate: { type: String, required: true, default: '' },
    active: { type: Boolean, required: true }
});

reserveSchema.queries('list');

//Exporto el esquema de base de datos como 'Reserve'
module.exports = gstore.model('Reserve', reserveSchema);
