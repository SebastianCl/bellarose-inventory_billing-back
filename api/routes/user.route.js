/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de rutas API para las funcionalidades de usuarios
* @description Permite configurar las rutas de los servicios para la API de usuario y su gestion
*/
const express = require('express');
const router = express.Router();

const user_controller = require('../controllers/user.controller');


/**************************
 * RUTAS DE USUARIO    *
 **************************/
router.post('/login', user_controller.getLogin);
router.post('/createUser', user_controller.createUser);
router.get('/getUsers', user_controller.getUsers);
router.get('/getUser', user_controller.getUser);
router.put('/updateUser', user_controller.updateUser);
router.delete('/deleteUser', user_controller.deleteUser);


/**************************
 * RUTAS DE ROL    *
 **************************/
router.post('/createRole', user_controller.createRole);
router.get('/getRoles', user_controller.getRoles);
router.get('/getRole', user_controller.getRole);
router.delete('/deleteRole', user_controller.deleteRole);

module.exports = router;
