/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio item
* @description Script NODEJS que permite realizar operaciones CRUD sobre el modleo Item.
*/

// Modelo
const Item = require('../models/item.model');

// Servicio común
const commonService = require('../service/common.service');


/**
 * @function saveItems
 * @param {Array} items Items a registrar
 * @description Permite registrar varios items
 */
const saveItem = async (itemData) => {
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

    let saveItemResp = await commonService.createModel(Item, newItem);
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
    saveItem
}
