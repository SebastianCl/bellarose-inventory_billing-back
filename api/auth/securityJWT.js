/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const config = require('../config/config');

/**
 * @function validateUser
 * @param {Object} user Usuario que intenta loguerse
 * @param {String} password Clave enviada por el usuario
 * @description Valida sí el hash corresponde a la clave que envia el usuario
 */
function validateUser(user, password) {
    let resp = { resp: false, msg: "Bad password." };
    const hash = user.password; //Se obtiene el Hash de la clave encriptada
    let result = bcrypt.compareSync(password, hash); //Se valida si el Hash corresponde a la clave
    if (result === true) {
        //Generacion Token JWT
        let token = jwt.sign({ id: user }, config.secret, config.configJWT);
        //Se retorna el ID para poder ser utilizado en consultas de actualización. Mejora el rendimiento a la hora de consutlar por Id de usuario
        resp = { resp: true, msg: { token, user } };
    }
    return resp;
}

/**
 * @function verifyToken
 * @param {Request} req Obtener parametros de cabecera
 * @description Valida: 
 *  -Sí se ingresa el token 
 *  -Sí el token tiene un formato correcto 
 *  -Sí el token no ha caducado
 */
function verifyToken(req) {
    let resp = { resp: true, msg: 'Token correcto.' };
    //Obtiene el token de la cabecera del servicio
    let token = req.headers['x-access-token'];
    if (!token) return { resp: false, msg: 'Ingrese un Token.' };
    jwt.verify(token, config.secret, function (err) {
        //Si el token es incorrecto, se valida y se muestra un mensaje de error
        if (err) resp = { resp: false, msg: err.message };
    });
    return resp;
}

module.exports = {
    validateUser,
    verifyToken
};
