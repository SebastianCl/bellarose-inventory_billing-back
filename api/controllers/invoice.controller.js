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
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
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
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getInvoice
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
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
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createInvoice
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite crear una factura nueva en el DataStore
 */
const createInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let reserveID = req.body.reserve;
        let subTotal = req.body.subTotal;
        let cost = req.body.cost;
        let deposit = req.body.deposit;
        let payment = req.body.payment;
        let description = req.body.description;
        let active = true;

        // Obtener último número de factura
        let respondeInvoice = await invoiceService.getLastNumberInvoice();
        // Validar si se obtuvo respuesta de la ultima factura
        if (!respondeInvoice.resp) return res.status(400).send({ resp: false, msg: 'No se obtuvo el último número de factura.' });

        // Asignar nuevo número de factura
        const invoiceNumber = respondeInvoice.msg + 1;

        // Validar si existe la reserva
        let respReserve = await commonService.getModel(Reserve, reserveID, true);
        if (!respReserve.resp) return res.status(400).send({ resp: false, msg: `No existe la reserva con id ${reserveID}.` });
        let dataReserve = respReserve.msg.entityData;
        let keyReserve = respReserve.msg.entityKey;
        // Validar si la reserva esta activa
        if (!dataReserve.active) return res.status(400).send({ resp: false, msg: 'La reserva esta inactiva.' });
        // Validar si la reserva esta asociada a una factura
        if (dataReserve.invoiceNumber !== 0) return res.status(400).send({ resp: false, msg: 'La reserva ya tiene una factura asociada.' });

        let customerName = dataReserve.customerName;
        let customerIdentification = dataReserve.customerIdentification;
        let employeeName = dataReserve.employeeName;
        let reserveNumber = dataReserve.reserveNumber;

        let data = {
            reserve: keyReserve, customerName, customerIdentification, employeeName, reserveNumber, invoiceNumber,
            subTotal, cost, deposit, payment, description, active
        }

        // Crear factura
        let respInvoice = await commonService.createModel(Invoice, data);
        if (!respInvoice.resp) return res.status(400).send(respInvoice);

        // Actualizar reserva con número de factura
        let newDataReserve = { invoiceNumber };
        let updateReserve = await commonService.updateModel(Reserve, newDataReserve, reserveID);
        if (!updateReserve.resp) return res.status(400).send(updateReserve);

        return res.status(200).send(respInvoice);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateInvoice
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite actualizar una factura especifico por ID
 */
const updateInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let invoiceNumber = req.body.invoiceNumber;
        let payment = req.body.payment;

        // Validar datos
        if (invoiceNumber === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el número de la factura.' });
        if (payment === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el abono de la factura.' });

        let filter = { filters: [] };
        filter.filters.push(['invoiceNumber', invoiceNumber]);
        // Buscar si existe factura con el número enviado
        let respIsInvoice = await commonService.listModelsWithFilter(Invoice, filter);
        if (!respIsInvoice.resp) return res.status(400).send({ resp: false, msg: `No existe la factura ${invoiceNumber}.` });

        let invoiceData = respIsInvoice.msg[0]; // Datos de factura

        // Validar si la factura esta activa
        if (!invoiceData.active) return res.status(400).send({ resp: false, msg: `La factura ${invoiceNumber} esta inactiva.` });

        let id = invoiceData.id;
        let total = invoiceData.cost;
        let lastPayment = invoiceData.payment;
        let remaining = total - lastPayment;
        let active = true;

        // Validar si el pago sobrepasa lo faltante
        if (payment > remaining) return res.status(400).send({ resp: false, msg: 'Sobrepasa el total de la factura.' });

        let newPayment = lastPayment + payment; // Sumar ultimo pago con el nuevo abono

        // Desactivar factura si se completo el pago total
        if (total === newPayment) {
            active = false;
            const reserveNumber = invoiceData.reserveNumber;
            // Finalizar reserva
            let respFinish = await reserveService.finishReserve(reserveNumber);
            if (!respFinish.resp) return res.status(400).send(respFinish);
        }

        let newDataInvoice = { payment: newPayment, active };

        // Actualizar factura
        let response = await commonService.updateModel(Invoice, newDataInvoice, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteInvoice
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite eliminar una factura especifico por ID
 */
const deleteInvoice = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(Invoice, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findInvoiceWithFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
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
        res.status(500).send({ resp: false, msg: error.message });
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
        res.status(500).send({ resp: false, msg: error.message });
    }
}


// Exportar funciones
module.exports = {
    getInvoice,
    getInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    findInvoiceWithFilter,
    test
};