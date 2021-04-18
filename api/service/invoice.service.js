/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio común
* @description Script NODEJS que permite realizar operaciones CRUD sobre el modelo Invoice.
*/

// Modelo
const Invoice = require('../models/invoice.model');

// Obtener el último número registrado de una factura
const getLastNumberInvoice = async () => {
    let res = { resp: false, msg: {} };

    const response = await Invoice.query()
        .order('invoiceNumber', { descending: true, })
        .run();
    if (response.entities.length > 0) {
        res.resp = true;
        res.msg = response.entities[0].invoiceNumber;
    } else {
        res.resp = true;
        res.msg = 'Sin resultados.';
    }
    return res;
}

module.exports = {
    getLastNumberInvoice
}
