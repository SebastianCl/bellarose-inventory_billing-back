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

const customer_controller = require('../controllers/employee.controller');


/**************************
 * RUTAS DE EMPLEADO    *
 **************************/
router.post('/createEmployee', customer_controller.createEmployee);
router.get('/getEmployees', customer_controller.getEmployees);
router.get('/getEmployee', customer_controller.getEmployee);
router.put('/updateEmployee', customer_controller.updateEmployee);
router.delete('/deleteEmployee', customer_controller.deleteEmployee);
router.post('/findEmployeesWithFilter', customer_controller.findEmployeesWithFilter);

module.exports = router;
