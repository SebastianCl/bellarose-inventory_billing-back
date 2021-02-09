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
 * @function deleteItems
 * @param {Array} itemsSavedID IDs de items a borrar
 * @description Permite borrar varios items
 */
const deleteItems = async (itemsSavedID) => {
    itemsSavedID.forEach(async element => {
        const itemID = element.id;
        await commonService.deleteModel(Item, itemID);
    });
}

/**
 * @function saveItems
 * @param {Array} items Items a registrar
 * @description Permite registrar varios items
 */
const saveItems = async (items, quote) => {
    let res = { resp: false, msg: {}, code: 400 };
    let itemsSavedID = [];

    for (let index = 0; index < items.length; index++) {
        const element = items[index];

        let newItem = {
            quote,
            ref: element.ref,
            description: element.description,

            retail: element.retail,
            discount: element.discount,
            price: element.price,
            quantity: element.quantity,
            total: element.total
        };

        let saveItem = await commonService.createModel(Item, newItem);
        if (!saveItem.resp) {
            res.resp = false;
            res.code = 400;
            res.msg = saveItem.msg;
            // Eliminar items que si se registraron
            await deleteItems(itemsSavedID);
            break;
        }
        itemsSavedID.push(res.msg.id);
        res.resp = true;
        res.code = 200;
        res.msg = 'Item registrado.';
    }
    return res;
}


// Devolver los items a cotización
const itemsToQuote = async (items) => {
    let res = { resp: false, msg: {}, code: 400 };
    for (let index = 0; index < items.length; index++) {
        const element = items[index];
        let id = element.id;
        let newData = { requested: null, numCO: 0 };
        let saveItem = await commonService.updateModel(Item, newData, id);
        if (!saveItem.resp) {
            res.resp = false;
            res.code = 400;
            res.msg = saveItem.msg;
            break;
        }
        res.resp = true;
        res.code = 200;
        res.msg = 'Item actualizado.';
    }
    return res;
}

// Actualizar items con el número de CO
const itemsToCO = async (items, numCO) => {
    let res = { resp: false, msg: {}, code: 400 };
    for (let index = 0; index < items.length; index++) {
        const element = items[index];
        let id = element.id;
        let newData = { requested: false, numCO };
        let saveItem = await commonService.updateModel(Item, newData, id);
        if (!saveItem.resp) {
            res.resp = false;
            res.code = 400;
            res.msg = saveItem.msg;
            break;
        }
        res.resp = true;
        res.code = 200;
        res.msg = 'Item actualizado.';
    }
    return res;
}

// Actualizar items con el número de CO
const findItemsCO = async () => {
    let res = { resp: false, msg: {}, code: 400 };

    const response = await Item.query()
        .filter('numCO', '>', 0)
        //.filter('purchaseOrder', '=', '')
        .run();
    if (response.entities.length > 0) {
        res.code = 200;
        res.resp = true;
        res.msg = response.entities;
    } else {
        res.code = 200;
        res.resp = true;
        res.msg = 'Sin resultados.';
    }
    return res;
}

module.exports = {
    itemsToCO,
    itemsToQuote,
    saveItems,
    findItemsCO
}
