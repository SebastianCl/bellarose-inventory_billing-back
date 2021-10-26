/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de factura
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
const Employee = require('../models/employee.model');
const Customer = require('../models/customer.model');
// Servicio
const commonService = require('../service/common.service');
const invoiceService = require('../service/invoice.service');
const articleService = require('../service/article.service');
const articleReserved = require('../service/articleReserved.service');
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
        if (!id) return res.status(400).send({ resp: false, msg: 'Debe indicar el id.' });

        let response = await commonService.getModel(Invoice, id);
        if (!response.resp) return res.status(400).send({ resp: false, msg: `No existe factura con id: ${id}.` });

        let dataInvoice = response.msg;

        // Agregar información de artículos reservados
        if (dataInvoice.type == 1) {
            let AR_IDs = dataInvoice.reserve.articles;
            let articlesReserved = [];

            for (let index = 0; index < AR_IDs.length; index++) {
                const articleReservedID = AR_IDs[index];
                const respAR = await commonService.getModel(ArticleReserved, articleReservedID);
                if (!respAR.resp) return res.status(400).send(respAR);

                const dataAR = respAR.msg;
                articlesReserved.push({ code: dataAR.code, price: dataAR.price, discount: dataAR.discount });
            }
            dataInvoice.articles = articlesReserved; // Agregar información de todos los artículos reservados a la info de la factura
        }

        return res.status(200).send({ resp: true, msg: dataInvoice });
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
        let depositState = body.depositState;
        let payment = body.payment;
        let transfer = body.transfer;
        let cash = body.cash;
        let description = body.description ? body.description : '';

        // Validar si envio los datos de la factura

        if (!reserveID) {
            res.msg.msg = 'Debe indicar el número de la reserva.';
            return res;
        }
        if (!deposit) {
            res.msg.msg = 'Debe indicar el deposito.';
            return res;
        }
        if (depositState === undefined) {
            res.msg.msg = 'Debe indicar si canceló el deposito.';
            return res;
        }
        if (!payment) {
            res.msg.msg = 'Debe indicar el pago.';
            return res;
        }
        if (!transfer && !cash) {
            res.msg.msg = 'Debe indicar el medio de pago.';
            return res;
        }

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

        // Obtener nuevo número de factura
        let respInvoiceNumber = await getNewNumberInvoice();
        if (!respInvoiceNumber.resp) {
            res.msg.msg = 'No se pudo obtener el nuevo número de factura';
            return res;
        }
        let invoiceNumber = respInvoiceNumber.msg; // Nuevo número de factura

        let reserveNumber = dataReserve.reserveNumber;
        let responseAR = await articleReserved.dataArticlesReserved(reserveNumber);
        if (!responseAR.resp) return res.status(400).send({ resp: false, msg: 'Fallo al buscar detalle de artículos reservados.' });
        let articles = responseAR.msg;

        // Datos de factura
        let customerName = dataReserve.customerName;
        let customerIdentification = dataReserve.customerIdentification;
        let customerDirection = dataReserve.customer.direction;
        let customerEmail = dataReserve.customer.email;
        let employeeName = dataReserve.employeeName;
        let cost = dataReserve.cost;

        let data = {
            reserve: keyReserve, reserveNumber, customerName, customerIdentification, customerDirection, customerEmail, employeeName, invoiceNumber,
            cost, deposit, depositState, payment, description, active: true, type: '1', articles, transfer, cash
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
    let res = { code: 400, msg: { resp: false, msg: '' } };
    try {

        let customerID = body.customerID;
        let employeeID = body.employeeID;
        let articles = body.articles;
        let description = body.description ? body.description : '';
        let transfer = body.transfer;
        let cash = body.cash;

        // Validar si envia ID del cliente
        if (!customerID) {
            res.msg.msg = 'Debe indicar el id del cliente.';
            return res;
        }
        // Validar si envia ID del empleado
        if (!employeeID) {
            res.msg.msg = 'Debe indicar el id del empleado.';
            return res;
        }
        // Validar si envia los artículos
        if (!articles || articles.length === 0) {
            res.msg.msg = 'Debe indicar los artículos.';
            return res;
        }
        // Validar si envia el medio de de pago
        if (transfer === undefined && cash === undefined) {
            res.msg.msg = 'Debe indicar el medio de pago.';
            return res;
        }


        let respCustomer = await commonService.getModel(Customer, customerID);
        if (!respCustomer.resp) {
            res.msg.msg = 'No existe el cliente.'
            return res;
        }

        let respEmployee = await commonService.getModel(Employee, employeeID);
        if (!respEmployee.resp) {
            res.msg.msg = 'No existe el empleado.'
            return res;
        }

        let respStatus = await articleService.articleStatus(articles);
        if (!respStatus.resp) {
            res.msg.msg = respStatus.msg;
            return res;
        }

        let subTotal = 0;
        let cost = 0;
        for (let index = 0; index < articles.length; index++) {
            const dataArticle = articles[index];

            let price = dataArticle.price;
            let discount = dataArticle.discount;

            subTotal = subTotal + price;
            cost = cost + (price - (price * (discount / 100)));
        }
        const payment = cost;


        let respInvoiceNumber = await getNewNumberInvoice(); // Obtener nuevo número de reserva
        if (!respInvoiceNumber.resp) {
            res.msg.msg = 'No se pudo obtener el nuevo número de factura.';
            return res;
        }

        // Datos de la factura
        let invoiceNumber = respInvoiceNumber.msg;
        let customerName = respCustomer.msg.name;
        let customerIdentification = respCustomer.msg.identification;
        let customerDirection = respCustomer.msg.direction;
        let customerEmail = respCustomer.msg.email;
        let employeeName = respEmployee.msg.name;

        let data = {
            customerName, customerIdentification, customerDirection, customerEmail, employeeName, invoiceNumber,
            cost, payment, description, active: true, type: '2', articles, transfer, cash
        }

        // Crear factura
        let respInvoice = await commonService.createModel(Invoice, data);
        if (!respInvoice.resp) {
            res.msg = respInvoice;
            return res;
        }

        // Remover artículos vendidos del inventario
        let dataArticles = respStatus.msg;
        let respRemove = await articleService.removeArticles(dataArticles);
        if (!respRemove.resp) console.log(respRemove.msg);

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

        let customerID = body.customerID;
        let employeeID = body.employeeID;
        let cost = body.cost;
        let description = body.description ? body.description : '';
        let transfer = body.transfer;
        let cash = body.cash;

        // Validar si envia ID del cliente
        if (!customerID) {
            res.msg.msg = 'Debe indicar el id del cliente.';
            return res;
        }
        // Validar si envia ID del empleado
        if (!employeeID) {
            res.msg.msg = 'Debe indicar el id del empleado.';
            return res;
        }
        // Validar si envia el costo
        if (!cost) {
            res.msg.msg = 'Debe indicar el costo.';
            return res;
        }
        // Validar si envia el tipo de pago
        if (transfer === undefined && cash === undefined) {
            res.msg.msg = 'Debe indicar el medio de pago.';
            return res;
        }

        const payment = cost;

        let respCustomer = await commonService.getModel(Customer, customerID);
        if (!respCustomer.resp) {
            res.msg.msg = 'No existe el cliente.'
            return res;
        }

        let respEmployee = await commonService.getModel(Employee, employeeID);
        if (!respEmployee.resp) {
            res.msg.msg = 'No existe el empleado.'
            return res;
        }

        let respInvoiceNumber = await getNewNumberInvoice(); // Obtener nuevo número de factura
        if (!respInvoiceNumber.resp) {
            res.msg.msg = 'No se pudo obtener el nuevo número de factura';
            return res;
        }

        // Datos de la factura
        let invoiceNumber = respInvoiceNumber.msg;
        let customerName = respCustomer.msg.name;
        let customerIdentification = respCustomer.msg.identification;
        let customerDirection = respCustomer.msg.direction;
        let customerEmail = respCustomer.msg.email;
        let employeeName = respEmployee.msg.name;

        let data = {
            customerName, customerIdentification, customerDirection, customerEmail, employeeName, invoiceNumber,
            cost, payment, description, active: true, type: '3', transfer, cash
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