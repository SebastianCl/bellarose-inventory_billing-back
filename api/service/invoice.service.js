/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio común
* @description Script NODEJS que permite realizar operaciones CRUD sobre el modelo Factura.
*/

// Modelo
const Invoice = require('../models/invoice.model');

// Servicio común
const commonService = require('./common.service');

// Obtener el último número registrado de una factura
const getLastNumberInvoice = async () => {
    let res = { resp: true, msg: 0 };
    try {
        // Buscar factura de mayor a menor
        let response = await Invoice.query()
            .order('invoiceNumber', { descending: true, })
            .run();
        if (response.entities.length > 0) {
            // Obtener último número de factura
            res.msg = response.entities[0].invoiceNumber;
        }
        return res;
    } catch (error) {
        console.log(error);
        res.resp = false;
        res.msg = error.message;
        return res;
    }
}

// Permite deshabilitar una factura
const disableInvoice = async (invoiceNumber) => {
    let response = { code: 400, msg: { resp: false, msg: '' } };
    try {
        // Validar datos
        if (invoiceNumber === undefined) {
            response.msg.msg = 'Debe indicar el número de la factura.';
            return response;
        }

        let filter = { filters: [] };
        filter.filters.push(['invoiceNumber', invoiceNumber]);
        // Buscar si existe factura con el número enviado
        let respIsInvoice = await commonService.listModelsWithFilter(Invoice, filter);
        if (!respIsInvoice.resp) {
            response.msg.msg = `No existe la factura ${invoiceNumber}.`;
            return response;
        }

        let invoiceData = respIsInvoice.msg[0]; // Datos de factura

        let id = invoiceData.id;
        let disable = true;

        let newDataInvoice = { disable };

        // Deshabilitar factura
        let respUpdate = await commonService.updateModel(Invoice, newDataInvoice, id);
        if (!respUpdate.resp) {
            response.msg.msg = 'Fallo al intentar actualizar la factura.'
            return response;
        }
        response.code = 200;
        response.msg.resp = true;
        response.msg.msg = `Factura ${invoiceNumber} inhabilitada.`
        return response;
    }
    catch (error) {
        response.code = 500;
        response.msg.msg = error.message;
        console.log(error.message);
        return response;
    }
}

module.exports = {
    getLastNumberInvoice,
    disableInvoice
}
