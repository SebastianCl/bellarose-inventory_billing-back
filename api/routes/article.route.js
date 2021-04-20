/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de articulo
* @description Permite configurar las rutas de los servicios para la API de articulo
*/
const express = require('express');
const router = express.Router();

const article_controller = require('../controllers/article.controller');


/**************************
 * RUTAS DE ARTÍCULOS    *
 **************************/
router.post('/createArticle', article_controller.createArticle);
router.get('/getArticles', article_controller.getArticles);
router.get('/getArticle', article_controller.getArticle);
router.put('/updateArticle', article_controller.updateArticle);
router.delete('/deleteArticle', article_controller.deleteArticle);
router.post('/findArticlesWithFilter', article_controller.findArticlesWithFilter);

module.exports = router;
