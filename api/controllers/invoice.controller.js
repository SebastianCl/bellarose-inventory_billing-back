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

        let exist = await commonService.getEntityKey(Customer, customerID);
        if (!exist.resp) return { resp: false, msg: `No existe el cliente con id ${customerID}` };
        let customer = exist.msg;

        exist = await commonService.getEntityKey(Reserve, reserveID);
        if (!exist.resp) return { resp: false, msg: `No existe la reserva con id ${reserveID}` };
        let reserve = exist.msg;

        exist = await commonService.getEntityKey(Employee, employeeID);
        if (!exist.resp) return { resp: false, msg: `No existe el empleado con id ${employeeID}` };
        let employee = exist.msg;

        let data = {
            customer, reserve, employee, cost, deposit, description, active
        }

        let invoice = Invoice.sanitize(data);
        let response = await commonService.createModel(Invoice, invoice);
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

        let id = req.headers['id'];
        let data = Invoice.sanitize(req.body);
        let response = await commonService.updateModel(Invoice, data, id);
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

// Exportar funciones
module.exports = {
    getInvoice,
    getInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice
};