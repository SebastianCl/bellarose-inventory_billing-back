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
const Customer = require('../models/customer.model');
const Invoice = require('../models/invoice.model');
const Employee = require('../models/employee.model');
const Reserve = require('../models/reserve.model');
// Servicio
const commonService = require('../service/common.service');
const invoiceService = require('../service/invoice.service');
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

        let customerID = req.body.customer;
        let reserveID = req.body.reserve;
        let employeeID = req.body.employee;
        let cost = req.body.cost;
        let deposit = req.body.deposit;
        let description = req.body.description;
        let active = true;

        // Obtener último número de factura
        let respondeInvoice = await invoiceService.getLastNumberInvoice();
        // Validar si se obtuvo respuesta de las reservas
        if (!respondeInvoice.resp) return res.status(400).send({ resp: false, msg: 'No se obtuvo el último número de factura.' });

        // Asignar nuevo número de factura
        const invoiceNumber = respondeInvoice.msg + 1;

        // Validar si existe el cliente
        let exist = await commonService.getEntityKey(Customer, customerID);
        if (!exist.resp) return res.status(400).send({ resp: false, msg: `No existe el cliente con id ${customerID}.` });
        let customer = exist.msg;

        exist = await commonService.getModel(Customer, customerID);
        if (!exist.resp) return res.status(400).send({ resp: false, msg: `No existe el cliente con id ${customerID}.` });
        let customerIdentification = exist.msg.identification;

        // Validar si existe el empleado
        exist = await commonService.getEntityKey(Employee, employeeID);
        if (!exist.resp) return res.status(400).send({ resp: false, msg: `No existe el empleado con id ${employeeID}.` });
        let employee = exist.msg;

        // Validar si existe la reserva
        exist = await commonService.getModel(Reserve, reserveID);
        if (!exist.resp) return res.status(400).send({ resp: false, msg: `No existe la reserva con id ${reserveID}.` });
        // Validar si la reserva esta activa
        if (!exist.msg.active) return res.status(400).send({ resp: false, msg: 'La reserva esta inactiva.' });
        // Validar si la reserva esta asociada a una factura
        if (exist.msg.invoiceNumber !== 0) return res.status(400).send({ resp: false, msg: 'La reserva ya tiene una factura asociada.' });

        const dataReserve = exist.msg;
        let reserveNumber = dataReserve.reserveNumber;
        let customerName = dataReserve.customerName;
        let employeeName = dataReserve.employeeName;

        let data = {
            customer, employee, customerName, customerIdentification, employeeName, reserveNumber, invoiceNumber,
            cost, deposit, description, active
        }

        // Crear factura
        let invoice = Invoice.sanitize(data);
        let response = await commonService.createModel(Invoice, invoice);
        if (!response.resp) return res.status(400).send(response);

        // Actualizar reserva con número de factura
        let newDataReserve = { invoiceNumber };
        response = await commonService.updateModel(Reserve, newDataReserve, reserveID);

        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
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
        let lastPayment = invoiceData.deposit;
        let remaining = total - lastPayment;
        let active = true;

        // Validar si el pago sobrepasa lo faltante
        if (payment > remaining) return res.status(400).send({ resp: false, msg: 'Sobrepasa el total de la factura.' });

        let newPayment = lastPayment + payment; // Sumar ultimo pago con el nuevo deposito

        if (total === newPayment) active = false; // Desactivar factura si se completo el pago total

        let newDataInvoice = { deposit: newPayment, active };

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