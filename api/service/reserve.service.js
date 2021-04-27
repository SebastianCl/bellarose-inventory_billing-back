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

// Obtener el último número registrado de una reserva
const getLastNumberReserve = async () => {
    try {
        let res = { resp: true, msg: 0 };

        const response = await Reserve.query()
            .order('reserveNumber', { descending: true, })
            .run();
        if (response.entities.length > 0) {
            res.msg = response.entities[0].reserveNumber;
        }
        return res;

    } catch (error) {
        console.log(error);
        res.resp = false;
        res.msg = error.message;
        return res;
    }
}

module.exports = {
    getLastNumberReserve
}
