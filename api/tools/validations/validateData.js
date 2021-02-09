/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
* @description Script para declear funciones de validación
*/

/**
 * @function isEmpty
 * @param {String} data Dato que se desa validar
 * @description Valida si un dato no es vacio
 */
const isEmpty = (data) => {
    return (data === '' || data === undefined);
}

module.exports = {
    isEmpty
}