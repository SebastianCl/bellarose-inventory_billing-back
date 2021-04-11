/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de articlo
* @description Se configura el modelo de articulo. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

//Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de articulo
*/
const articleSchema = new Schema({
    type: { type: String, required: true },
    reference: { type: String, required: true },
    brand: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    imageURL: { type: String, required: true },
    comments: { type: String, required: false },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reserved: { type: Number, required: false },
    available: { type: Boolean, required: true }
});

articleSchema.queries('list');

//Exporto el esquema de base de datos como 'Item'
module.exports = gstore.model('Article', articleSchema);
