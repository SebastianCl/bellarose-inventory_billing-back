/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio común
* @description Script NODEJS que permite realizar operaciones CRUD sobre el modelo Reserve.
*/

// Modelo
const Reserve = require('../models/reserve.model');

// Actualizar items con el número de CO
const getLastNumberReserve = async () => {
    let res = { resp: false, msg: {} };

    const response = await Reserve.query()
        .order('reserveNumber', { descending: true, })
        .run();
    if (response.entities.length > 0) {
        res.resp = true;
        res.msg = response.entities[0].reserveNumber;
    } else {
        res.resp = true;
        res.msg = 'Sin resultados.';
    }
    return res;
}

module.exports = {
    getLastNumberReserve
}
