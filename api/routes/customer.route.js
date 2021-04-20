/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de empleado
* @description Permite configurar las rutas de los servicios para la API de empleado
*/
const express = require('express');
const router = express.Router();

const customer_controller = require('../controllers/customer.controller');


/**************************
 * RUTAS DE CLIENTE    *
 **************************/
router.post('/createCustomer', customer_controller.createCustomer);
router.get('/getCustomers', customer_controller.getCustomers);
router.get('/getCustomer', customer_controller.getCustomer);
router.put('/updateCustomer', customer_controller.updateCustomer);
router.delete('/deleteCustomer', customer_controller.deleteCustomer);

module.exports = router;
