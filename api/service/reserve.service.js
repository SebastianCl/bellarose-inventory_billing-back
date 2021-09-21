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
const Article = require('../models/article.model');
const ArticleReserved = require('../models/articleReserved.model');

// Servicio común
const commonService = require('../service/common.service');

const moraCost = require('../config/config').moraCost;

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

// Devolver artículos al inventario
async function returnArticles(id_AR, isDelete) {
    // Validar si existe el artículo reservado            
    let responseAR = await commonService.getModel(ArticleReserved, id_AR);
    if (!responseAR.resp) return responseAR;

    // Buscar artículo por referencia
    let filter = { filters: ['reference', responseAR.msg.reference] };
    let resArticle = await commonService.listModelsWithFilter(Article, filter);
    if (!resArticle.resp) return resArticle;

    if (!isDelete) {
        let article = resArticle.msg[0];
        let articleID = article.id;
        let quantity = article.quantity + 1;
        let articleNewData = { quantity };

        // Regresar artículo al inventario
        let updatedArticle = await commonService.updateModel(Article, articleNewData, articleID);
        if (!updatedArticle.resp) return updatedArticle;

        // Desactivar artículo reservado
        const AR_NewData = { active: false };
        let updatedAR = await commonService.updateModel(ArticleReserved, AR_NewData, id_AR);
        return updatedAR;
    } else {
        // Eliminar artículo reservado
        let deleteAR = await commonService.deleteModel(ArticleReserved, id_AR);
        return deleteAR;
    }
}

const finishReserve = async (reserveNumber, res) => {
    try {
        // Validar si envio el número de reserva
        if (!reserveNumber) return { resp: false, msg: 'Debe indicar el número de reserva.' };

        // Validar si existe la reserva
        let filter = { filters: ['reserveNumber', reserveNumber] };
        let respReserve = await commonService.listModelsWithFilter(Reserve, filter);
        if (!respReserve.resp) return { resp: false, msg: 'La reserva no existe.' };

        let dataReserve = respReserve.msg[0];
        let id = dataReserve.id;
        let activeReserve = dataReserve.active;
        let articles = dataReserve.articles;

        // Validar si esta activa la reserva
        if (!activeReserve) return { resp: false, msg: 'La reserva no esta activa.' };

        // Regresar artículos al inventario y desactivar artículos reservados
        for (let index = 0; index < articles.length; index++) {
            const id_AR = articles[index];
            // Devolver artículos
            let updatesArticle = await returnArticles(id_AR, false);
            if (!updatesArticle.resp) return res.status(400).send(updatesArticle);
        }

        // Deshabilitar reserva
        let newData = { active: false, status: 'cerrada' };
        let response = await commonService.updateModel(Reserve, newData, id);
        if (!response.resp) return { resp: false, msg: `La reserva ${reserveNumber} no se actualizo.` };
        return { resp: true, msg: 'Reserva finalizada.' };
    } catch (error) {
        console.log(error.message);
        return { resp: false, msg: error.message };
    }
};

const cancelReserve = async (reserveNumber, res) => {
    try {
        // Validar si envio el número de reserva
        if (!reserveNumber) return { resp: false, msg: 'Debe indicar el número de reserva.' };

        // Validar si existe la reserva
        let filter = { filters: ['reserveNumber', reserveNumber] };
        let respReserve = await commonService.listModelsWithFilter(Reserve, filter);
        if (!respReserve.resp) return { resp: false, msg: 'La reserva no existe.' };

        let dataReserve = respReserve.msg[0];
        let id = dataReserve.id;
        let activeReserve = dataReserve.active;
        let articles = dataReserve.articles;

        // Validar si esta activa la reserva
        if (!activeReserve) return { resp: false, msg: 'La reserva no esta activa.' };

        // Regresar artículos al inventario y desactivar artículos reservados
        for (let index = 0; index < articles.length; index++) {
            const id_AR = articles[index];
            // Devolver artículos
            let updatesArticle = await returnArticles(id_AR, false);
            if (!updatesArticle.resp) return res.status(400).send(updatesArticle);
        }

        // Deshabilitar reserva
        let newData = { active: false, status: 'cancelada' };
        let response = await commonService.updateModel(Reserve, newData, id);
        if (!response.resp) return { resp: false, msg: `La reserva ${reserveNumber} no se actualizo.` };
        return { resp: true, msg: 'Reserva cancelada.' };
    } catch (error) {
        console.log(error.message);
        return { resp: false, msg: error.message };
    }
};

const calculateMora = async (endDate) => {
    let todayDate = new Date(); // Fecha actual

    const oneDay = 1000 * 60 * 60 * 24;
    const today = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const end = Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    let moraDays = (end - today) / oneDay; // Calcular total de dias mora

    return moraDays < 0 ? 0 : moraDays * moraCost;
}

const findReserveByDate = async (startDate, endDate) => {
    let res = { resp: false, msg: {} };

    const response = await Reserve.query()
        .filter('reserveDay', '>', startDate)
        .filter('reserveDay', '<', endDate)
        .run();

    // const response = await commonService.getModels(Reserve);
    if (response.entities.length > 0) {
        res.resp = true;
        res.msg = response.entities;
    } else {
        res.resp = true;
        res.msg = 'Sin resultados.';
    }
    return res;
}
module.exports = {
    getLastNumberReserve,
    finishReserve,
    returnArticles,
    findReserveByDate,
    cancelReserve
}
