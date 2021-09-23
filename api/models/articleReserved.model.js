/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Modelo de articlo
* @description Se configura el modelo de artículo reservado. Se configura la tabla NoSQL de la base de datos para el esquema.
*/

//Dependencias
const { instances } = require('gstore-node');

// Recupera la instancia para gstore
const gstore = instances.get('unique-id');
const { Schema } = gstore;

/**
 * Creando el esquema para el modelo de artículo
*/
const articleReservedSchema = new Schema({
    reference: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
    dateInit: { type: Date, required: true },
    dateEnd: { type: Date, required: true },
    active: { type: Boolean, required: false, default: true }
});

articleReservedSchema.queries('list');

//Exporto el esquema de base de datos como 'ArticleReserved'
module.exports = gstore.model('ArticleReserved', articleReservedSchema);
