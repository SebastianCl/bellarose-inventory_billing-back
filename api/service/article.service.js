/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio de artículo
*/

// Modelo
const Article = require('../models/article.model');
const ArticleReserved = require('../models/articleReserved.model');

// Servicio común
const commonService = require('./common.service');


/**
 * @function saveArticle
 * @param {Array} itemData Articulos a registrar
 * @description Permite registrar varios artículos
 */
const saveArticle = async (itemData) => {
    let res = { resp: false, msg: {}, code: 400 };

    const element = itemData;

    let newItem = {
        type: element.type,
        code: element.code,
        brand: element.brand,
        color: element.color,
        size: element.size,
        image: element.image,
        comments: element.comments,
        price: element.price,
        quantity: element.quantity,
        available: element.available
    };

    let saveItemResp = await commonService.createModel(Article, newItem);
    if (!saveItemResp.resp) {
        res.resp = false;
        res.code = 400;
        res.msg = saveItemResp.msg;
    }
    else {
        res.resp = true;
        res.code = 200;
        res.msg = 'Item registrado.';
    }
    return res;
}

// Validar si los artículos existen o estan disponible
const articleStatus = async (articles) => {
    let typeNumError = 0;
    let resp = { resp: false, type: typeNumError, msg: '' };

    let allBad = [];
    let allDataArticles = [];

    for (let code of articles) {

        code = code.price ? code.code : code;

        let filter = { filters: ['code', code] };
        let exist = await commonService.listModelsWithFilter(Article, filter);

        // Validar si el artículo existe
        if (!exist.resp) {
            allBad.push({ code, motive: 'No existe artículo con el código indicado.' });
            typeNumError = 1; // FALLA por no existir artículo con referencia indicada
            break;
        }

        const articleData = exist.msg[0];
        // Si no hay artículos disponibles se busca la fecha más cercana
        if (articleData.quantity === 0) {
            let filterAR = { filters: [] };
            filterAR.filters.push(['code', articleData.code]);
            filterAR.filters.push(['active', true]);
            let responseEarlyDate = await commonService.listModelsWithFilter(ArticleReserved, filterAR);
            if (!responseEarlyDate.resp) return { resp: false, msg: 'Fallo al buscar el artículo reservado.' };

            let listAR = responseEarlyDate.msg; // Lista de artículos reservados
            // Ordenar lista ascendente
            const listARorder = listAR.sort((a, b) => a.dateEnd - b.dateEnd);
            const earlyDate = listARorder[0].dateEnd; // Fecha más cercana en que se devolvera el artículo

            allBad.push({ code, earlyDate });
            typeNumError = 2; // FALLA por no disponibilidad
            break;
        }

        const dataArticleReserved = { id: articleData.id, code, quantity: articleData.quantity };
        allDataArticles.push(dataArticleReserved);
    }
    if (allBad.length > 0) {
        resp.msg = allBad;
        resp.type = typeNumError;
    }
    else {
        resp.msg = allDataArticles;
        resp.resp = true;
    }
    return resp;
}

/**
 * @function removeArticles
 * @param {Array} articles Articulos a registrar
 * @description Permite registrar varios artículos
 */
const removeArticles = async (articles) => {
    let res = { resp: false, msg: {} };

    let allBad = [];

    for (let index = 0; index < articles.length; index++) {
        const articleData = articles[index];

        const articleID = articleData.id;
        const quantity = articleData.quantity - 1;
        const articleNewData = { quantity };

        // Actualizar registros
        const updatedArticle = await commonService.updateModel(Article, articleNewData, articleID);
        if (!updatedArticle.resp) allBad.push({ code: articleData.code, error: updatedArticle.msg });
    }

    if (allBad.length === 0) {
        res.resp = true;
        res.msg = 'Articulos removidos.'
    }
    else {
        res.msg = allBad;
    }

    return res;
}

module.exports = {
    saveArticle,
    articleStatus,
    removeArticles
}
