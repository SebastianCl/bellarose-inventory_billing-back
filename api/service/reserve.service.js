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
const Invoice = require('../models/invoice.model');
const Article = require('../models/article.model');
const ArticleReserved = require('../models/articleReserved.model');

// Servicio común
const commonService = require('../service/common.service');

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
        let invoiceNumber = dataReserve.invoiceNumber;

        // Validar si esta activa
        if (!activeReserve) return { resp: false, msg: 'La reserva no esta activa.' };

        // Validar la factura        
        filter = { filters: ['invoiceNumber', invoiceNumber] };
        let respInvoice = await commonService.listModelsWithFilter(Invoice, filter);
        if (!respInvoice.resp) return { resp: false, msg: `La factura ${invoiceNumber} no existe.` };

        let dataInvoice = respInvoice.msg[0];
        let activeInvoice = dataInvoice.active;
        if (!activeInvoice) return { resp: false, msg: `La factura ${invoiceNumber} no esta activa.` };

        // Regresar artículos al inventario y desactivar artículos reservados
        for (let index = 0; index < articles.length; index++) {
            const id_AR = articles[index];

            // Devolver artículos
            let updatesArticle = await returnArticles(id_AR, false);
            if (!updatesArticle.resp) return res.status(400).send(updatesArticle);
        }

        // Deshabilitar reserva
        let newData = { active: false };
        let response = await commonService.updateModel(Reserve, newData, id);
        if (!response.resp) return { resp: false, msg: `La reserva ${invoiceNumber} no se actualizo.` };
        return { resp: true, msg: 'Reserva finalizada.' };
    } catch (error) {
        console.log(error.message);
        return { resp: false, msg: error.message };
    }
};

module.exports = {
    getLastNumberReserve,
    finishReserve,
    returnArticles
}
