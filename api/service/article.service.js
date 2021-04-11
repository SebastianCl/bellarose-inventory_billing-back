/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio de articulo
* @description Script NODEJS que permite realizar operaciones CRUD sobre el modelo Article.
*/

// Modelo
const Article = require('../models/article.model');

// Servicio común
const commonService = require('./common.service');


/**
 * @function saveArticle
 * @param {Array} itemData Articulos a registrar
 * @description Permite registrar varios articulos
 */
const saveArticle = async (itemData) => {
    let res = { resp: false, msg: {}, code: 400 };

    const element = itemData;

    let newItem = {
        type: element.type,
        reference: element.reference,
        brand: element.brand,
        color: element.color,
        size: element.size,
        image: element.image,
        comments: element.comments,
        price: element.price,
        quantity: element.quantity,
        available: element.available
    };

    let saveItemResp = await commonService.createModel(Article, newItem);
    if (!saveItemResp.resp) {
        res.resp = false;
        res.code = 400;
        res.msg = saveItemResp.msg;
    }
    else {
        res.resp = true;
        res.code = 200;
        res.msg = 'Item registrado.';
    }
    return res;
}

module.exports = {
    saveArticle
}
