/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de empleado
* @description Script NODEJS que permite realizar operaciones sobre los factura registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
// Modelos
const Invoice = require('../models/invoice.model');
const Reserve = require('../models/reserve.model');
const ArticleReserved = require('../models/articleReserved.model');
// Servicio
const commonService = require('../service/common.service');
const invoiceService = require('../service/invoice.service');
const reserveService = require('../service/reserve.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getInvoice
 * @description Permite listar todas los facturas
 */
const getInvoices = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(Invoice);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getInvoice
 * @description Permite obtener una factura filtrado por ID.
 */
const getInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.getModel(Invoice, id);

        let dataInvoice = response.msg;

        let articlesID = dataInvoice.reserve.articles;
        let articles = [];

        for (let index = 0; index < articlesID.length; index++) {
            const articleReservedID = articlesID[index];
            const respAR = await commonService.getModel(ArticleReserved, articleReservedID);
            if (!respAR.resp) return res.status(400).send(respAR);
            const dataAR = respAR.msg;

            articles.push({ reference: dataAR.reference, price: dataAR.price, discount: dataAR.discount });
        }

        dataInvoice.articles = articles;

        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
};

const getNewNumberInvoice = async () => {

    let res = { resp: false, msg: 'No se obtuvo el último número de factura.' };

    // Obtener último número de factura
    let respondeInvoice = await invoiceService.getLastNumberInvoice();
    // Validar si se obtuvo respuesta de la ultima factura
    if (!respondeInvoice.resp) return res;

    const newInvoiceNumber = respondeInvoice.msg + 1; // Asignar nuevo número de factura
    res.resp = true;
    res.msg = newInvoiceNumber;

    return res;
}

/**
 * @function createInvoiceReserve
 * @description Permite crear una factura de una reserva
 */
const createInvoiceReserve = async (body) => {
    try {
        let res = { code: 400, msg: { resp: false, msg: '' } };

        let reserveID = body.reserve;
        let deposit = body.deposit;
        let payment = body.payment;
        let description = body.description ? body.description : '';

        if (!reserveID) return res.status(400).send({ resp: false, msg: 'Debe indicar el número de la reserva.' });
        if (!deposit) return res.status(400).send({ resp: false, msg: 'Debe indicar el deposito.' });
        if (!payment) return res.status(400).send({ resp: false, msg: 'Debe indicar el pago.' });

        let respInvoiceNumber = await getNewNumberInvoice(); // Obtener nuevo número de reserva
        if (!respInvoiceNumber.resp) {
            res.msg.msg = 'No se pudo obtener el nuevo número de factura';
            return res;
        }

        let invoiceNumber = respInvoiceNumber.msg; // Nuevo número de factura

        // Validar si existe la reserva
        let respReserve = await commonService.getModel(Reserve, reserveID, true);
        if (!respReserve.resp) return res.status(400).send({ resp: false, msg: `No existe la reserva con id ${reserveID}.` });
        let dataReserve = respReserve.msg.entityData;
        let keyReserve = respReserve.msg.entityKey;

        // Validar si la reserva esta activa
        if (!dataReserve.active) {
            res.msg.msg = 'La reserva esta inactiva.';
            return res;
        }

        // Validar si la reserva esta asociada a una factura
        if (dataReserve.invoiceNumber !== 0) {
            res.msg.msg = 'La reserva ya tiene una factura asociada.';
            return res;
        }

        let customerName = dataReserve.customerName;
        let customerIdentification = dataReserve.customerIdentification;
        let employeeName = dataReserve.employeeName;
        let cost = dataReserve.cost;

        let data = {
            reserve: keyReserve, customerName, customerIdentification, employeeName, invoiceNumber,
            cost, deposit, payment, description, active: true, type: 1
        }

        // Crear factura
        let respInvoice = await commonService.createModel(Invoice, data);
        if (!respInvoice.resp) {
            res.msg = respInvoice;
            return res;
        }

        // Actualizar reserva con número de factura
        let newDataReserve = { invoiceNumber };
        let updateReserve = await commonService.updateModel(Reserve, newDataReserve, reserveID);
        if (!updateReserve.resp) {
            res.msg = updateReserve;
            return res;
        }

        res.code = 200;
        res.msg = respInvoice;
        return res;
    } catch (error) {
        console.log(error.message);
        res.code = 500;
        resp.msg.msg = error.message
        return res;
    }
};

/**
 * @function createInvoiceSale
 * @description Permite crear una factura nueva de tipo venta
 */
const createInvoiceSale = async (body) => {
    try {
        let res = { code: 400, msg: { resp: false, msg: '' } };

        let cost = body.cost;
        let customerName = body.customerName;
        let customerIdentification = body.customerIdentification;
        let employeeName = body.employeeName;
        let description = body.description ? body.description : '';

        if (!cost) {
            res.msg.msg = 'Debe indicar el costo.';
            return res;
        }
        if (!customerName) {
            res.msg.msg = 'Debe indicar el nombre del cliente.';
            return res;
        }
        if (!customerIdentification) {
            res.msg.msg = 'Debe indicar la identificación del cliente.';
            return res;
        }
        if (!employeeName) {
            res.msg.msg = 'Debe indicar el nombre del empleado.';
            return res;
        }

        let respInvoiceNumber = await getNewNumberInvoice(); // Obtener nuevo número de reserva
        if (!respInvoiceNumber.resp) {
            res.msg.msg = 'No se pudo obtener el nuevo número de factura';
            return res;
        }

        let invoiceNumber = respInvoiceNumber.msg;

        let data = {
            customerName, customerIdentification, employeeName, invoiceNumber,
            cost, description, active: true, type: 2
        }

        // Crear factura
        let respInvoice = await commonService.createModel(Invoice, data);
        if (!respInvoice.resp) {
            res.msg = respInvoice;
            return res;
        }

        //TODO: Retirar item del inventario

        res.code = 200;
        res.msg = respInvoice;
        return res;
    } catch (error) {
        res.code = 500;
        resp.msg.msg = error.message
        return res;
    }
}

/**
 * @function createInvoiceDemage
 * @description Permite crear una factura nueva de tipo daño
 */
const createInvoiceDemage = async (body) => {
    try {
        let res = { code: 400, msg: { resp: false, msg: '' } };

        let cost = body.cost;
        let customerName = body.customerName;
        let customerIdentification = body.customerIdentification;
        let employeeName = body.employeeName;
        let description = body.description ? body.description : '';

        if (!cost) return res.status(400).send({ resp: false, msg: 'Debe indicar el costo.' });
        if (!customerName) return res.status(400).send({ resp: false, msg: 'Debe indicar el nombre del cliente.' });
        if (!customerIdentification) return res.status(400).send({ resp: false, msg: 'Debe indicar la identificación del cliente.' });
        if (!employeeName) return res.status(400).send({ resp: false, msg: 'Debe indicar el nombre del empleado.' });

        let respInvoiceNumber = await getNewNumberInvoice(); // Obtener nuevo número de reserva
        if (!respInvoiceNumber.resp) {
            res.msg.msg = 'No se pudo obtener el nuevo número de factura';
            return res;
        }

        let invoiceNumber = respInvoiceNumber.msg;


        let data = {
            reserve: keyReserve, customerName, customerIdentification, employeeName, invoiceNumber,
            cost, description, active: true, type: 3
        }

        // Crear factura
        let respInvoice = await commonService.createModel(Invoice, data);
        if (!respInvoice.resp) {
            res.msg = respInvoice;
            return res;
        }

        res.code = 200;
        res.msg = respInvoice;
        return res;
    } catch (error) {
        res.code = 500;
        resp.msg.msg = error.message
        return res;
    }
}


/**
 * @function createInvoiceSale
 * @description Permite crear una factura nueva de tipo venta
 */
const createInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let body = req.body;
        let type = req.headers['type'];
        let respInvoice;

        switch (type) {
            case '1':
                respInvoice = await createInvoiceReserve(body);
                break;
            case '2':
                respInvoice = await createInvoiceSale(body);
                break;
            case '3':
                respInvoice = await createInvoiceDemage(body);
                break;
            case '4':
                respInvoice = await createInvoiceDemage(body);
                break;
            default:
                return res.status(400).send({ resp: false, msg: 'Debe indicar el tipo de factura.' });
        }

        return res.status(respInvoice.code).send(respInvoice.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
}

/**
 * @function payInvoice
 * @description Permite pagar una factura especifico por ID
 */
const payInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let invoiceNumber = req.body.invoiceNumber;
        let payment = req.body.payment;

        // Validar si envio datos
        if (invoiceNumber === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el número de la factura.' });
        if (payment === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el abono de la factura.' });

        let filter = { filters: [] };
        filter.filters.push(['invoiceNumber', invoiceNumber]);
        // Buscar si existe factura con el número enviado
        let respIsInvoice = await commonService.listModelsWithFilter(Invoice, filter);
        if (!respIsInvoice.resp) return res.status(400).send({ resp: false, msg: `No existe la factura ${invoiceNumber}.` });

        let invoiceData = respIsInvoice.msg[0]; // Datos de factura

        // Validar si la factura esta activa
        if (!invoiceData.active || invoiceData.disable) return res.status(400).send({ resp: false, msg: `La factura ${invoiceNumber} esta inactiva.` });

        let id = invoiceData.id;
        let cost = invoiceData.cost;
        let lastPayment = invoiceData.payment;
        let remaining = cost - lastPayment;
        let active = true;

        // Validar si el pago sobrepasa lo faltante
        if (payment > remaining) return res.status(400).send({ resp: false, msg: 'Sobrepasa el costo total de la factura.' });

        let newPayment = lastPayment + payment; // Sumar ultimo pago con el nuevo abono

        // Desactivar factura si se completo el pago total
        if (cost === newPayment) active = false;

        let newDataInvoice = { payment: newPayment, active };

        // Actualizar factura
        let response = await commonService.updateModel(Invoice, newDataInvoice, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function disableInvoice
 * @description Permite deshabilitar una factura especifica por ID
 */
const disableInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let invoiceNumber = req.body.invoiceNumber;

        let response = await invoiceService.disableInvoice(invoiceNumber);

        return res.status(response.code).send(response.msg);
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
}

/**
 * @function findInvoiceWithFilter
 * @description Busca los registro de facturas por filtro
 */
const findInvoiceWithFilter = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let options = req.body;
        let filter = { filters: [] };

        if (options.customerName !== undefined && options.customerName !== "") {
            filter.filters.push(['customerName', options.customerName])
        }
        if (options.customerID !== undefined && options.customerID !== "") {
            filter.filters.push(['customerID', options.customerID])
        }
        if (options.employeeName !== undefined && options.employeeName !== "") {
            filter.filters.push(['employeeName', options.employeeName])
        }
        if (options.reserveNumber !== undefined && options.reserveNumber !== "") {
            filter.filters.push(['reserveNumber', options.reserveNumber])
        }
        if (options.invoiceNumber !== undefined && options.invoiceNumber !== "") {
            filter.filters.push(['invoiceNumber', options.invoiceNumber])
        }
        if (options.active !== undefined && options.active !== "") {
            filter.filters.push(['active', options.active])
        }

        const reserveList = await commonService.listModelsWithFilter(Invoice, filter);
        res.status(200).send(reserveList);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
}



const test = async (req, res) => {
    try {
        /*
        const query = await Invoice.query()
            .filter('__key__', '>', Invoice.key(['Customer', '5080330100801536']))
            .run();*/

        const query = await Invoice.query()
            .filter('__key__', '=', 5632499082330112)
            .limit(1)
            .run();

        console.log(query);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
}


// Exportar funciones
module.exports = {
    getInvoice,
    getInvoices,
    createInvoice,
    payInvoice,
    disableInvoice,
    findInvoiceWithFilter,
    test
};