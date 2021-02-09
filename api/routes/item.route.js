/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de item
* @description Permite configurar las rutas de los servicios para la API de item
*/
const express = require('express');
const router = express.Router();

const item_controller = require('../controllers/item.controller');


/**************************
 * RUTAS DE ITEM    *
 **************************/
router.post('/createItem', item_controller.createItem);
router.get('/getItems', item_controller.getItems);
router.get('/getItem', item_controller.getItem);
router.put('/updateItem', item_controller.updateItem);
router.delete('/deleteItem', item_controller.deleteItem);
router.post('/findItemsWithFilter', item_controller.findItemsWithFilter);
router.get('/findItemsCO', item_controller.findItemsCO);

module.exports = router;
