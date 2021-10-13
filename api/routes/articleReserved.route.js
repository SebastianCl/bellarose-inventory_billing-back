/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de artículo
* @description Permite configurar las rutas de los servicios para la API de artículos reservados
*/
const express = require('express');
const router = express.Router();

const articleReserved_controller = require('../controllers/articleReserved.controller');


/**************************
 * RUTAS DE ARTÍCULOS    *
 **************************/
router.post('/createArticleReserved', articleReserved_controller.createArticleReserved);
router.get('/getArticleReserveds', articleReserved_controller.getArticleReserveds);
router.get('/getArticleReserved', articleReserved_controller.getArticleReserved);
router.put('/updateArticleReserved', articleReserved_controller.updateArticleReserved);
router.delete('/deleteArticleReserved', articleReserved_controller.deleteArticleReserved);
router.post('/findArticleReservedsWithFilter', articleReserved_controller.findArticleReservedsWithFilter);

module.exports = router;
