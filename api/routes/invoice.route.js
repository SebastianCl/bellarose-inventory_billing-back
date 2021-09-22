/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de factura
* @description Permite configurar las rutas de los servicios para la API de factura
*/
const express = require('express');
const router = express.Router();

const invoice_controller = require('../controllers/invoice.controller');


/**************************
 * RUTAS DE FACTURA    *
 **************************/
router.post('/createInvoice', invoice_controller.createInvoice);
router.get('/getInvoices', invoice_controller.getInvoices);
router.get('/getInvoice', invoice_controller.getInvoice);
router.put('/payInvoice', invoice_controller.payInvoice);
router.post('/disableInvoice', invoice_controller.disableInvoice);
router.post('/findInvoiceWithFilter', invoice_controller.findInvoiceWithFilter);

module.exports = router;
