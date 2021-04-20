/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de reserva
* @description Permite configurar las rutas de los servicios para la API de reserva
*/
const express = require('express');
const router = express.Router();

const reserve_controller = require('../controllers/reserve.controller');


/**************************
 * RUTAS DE RESERVA    *
 **************************/
router.post('/createReserve', reserve_controller.createReserve);
router.get('/getReserves', reserve_controller.getReserves);
router.get('/getReserve', reserve_controller.getReserve);
router.put('/updateReserve', reserve_controller.updateReserve);
router.delete('/deleteReserve', reserve_controller.deleteReserve);
router.post('/findReserveWithFilter', reserve_controller.findReserveWithFilter);
router.post('/finishReserve', reserve_controller.finishReserve);

module.exports = router;
