/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio de artículo reservado
*/

// Modelo
const ArticleReserved = require('../models/articleReserved.model');
const Reserve = require('../models/reserve.model');

// Servicio común
const commonService = require('./common.service');


/**
 * @function dataArticlesReserved
 * @description Retorna el detalle de los artículos 
 */
const dataArticlesReserved = async (reserveNumber) => {
    try {

        if (!reserveNumber) return { resp: false, msg: 'Debe indicar el número de la reserva.' };

        let filter = { filters: [] };
        filter.filters.push(['reserveNumber', reserveNumber])
        let respReserve = await commonService.listModelsWithFilter(Reserve, filter);
        if (!respReserve.resp) return { resp: false, msg: `No existe la reserva número ${reserveNumber}.` };

        let articlesReserved = respReserve.msg[0].articles;

        let allAR = [];
        let subTotal = 0;
        let cost = 0;

        for (let index = 0; index < articlesReserved.length; index++) {
            const idAR = articlesReserved[index];

            let respAR = await commonService.getModel(ArticleReserved, idAR);
            let dataAR = respAR.msg;

            let price = dataAR.price;
            let discount = dataAR.discount;
            allAR.push({ code: dataAR.code, price, discount });
            subTotal = subTotal + price;
            cost = cost + (price - (price * (discount / 100)));
        }

        let details = { articles: allAR, subTotal, cost }

        return { resp: true, msg: details };
    } catch (error) {
        console.log(error.message);
        return { resp: false, msg: error.message };
    }
};


module.exports = {
    dataArticlesReserved
}
