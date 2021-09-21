/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio de articulo
* @description Script NODEJS que permite realizar operaciones CRUD sobre el modelo Article.
*/

// Modelo
const Article = require('../models/article.model');
const ArticleReserved = require('../models/articleReserved.model');

// Servicio común
const commonService = require('./common.service');


/**
 * @function saveArticle
 * @param {Array} itemData Articulos a registrar
 * @description Permite registrar varios articulos
 */
const saveArticle = async (itemData) => {
    let res = { resp: false, msg: {}, code: 400 };

    const element = itemData;

    let newItem = {
        type: element.type,
        reference: element.reference,
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

    for (let reference of articles) {

        reference = reference.price ? reference.ref : reference;

        let filter = { filters: ['reference', reference] };
        let exist = await commonService.listModelsWithFilter(Article, filter);

        // Validar si el artículo existe
        if (!exist.resp) {
            allBad.push({ reference, motive: 'No existe artículo con la referencia indicada.' });
            typeNumError = 1; // FALLA por no existir artículo con referencia indicada
            break;
        }

        const articleData = exist.msg[0];
        // Si no hay articulos disponibles se busca la fecha más cercana
        if (articleData.quantity === 0) {
            let filterAR = { filters: [] };
            filterAR.filters.push(['reference', articleData.reference]);
            filterAR.filters.push(['active', true]);
            let responseEarlyDate = await commonService.listModelsWithFilter(ArticleReserved, filterAR);
            if (!responseEarlyDate.resp) return { resp: false, msg: 'Fallo al buscar el artículo reservado.' };

            let listAR = responseEarlyDate.msg; // Lista de articulos reservados
            // Ordenar lista ascendente
            const listARorder = listAR.sort((a, b) => a.dateEnd - b.dateEnd);
            const earlyDate = listARorder[0].dateEnd; // Fecha más cercana en que se devolvera el artículo

            allBad.push({ reference, earlyDate });
            typeNumError = 2; // FALLA por no disponibilidad
            break;
        }

        const dataArticleReserved = { id: articleData.id, reference, quantity: articleData.quantity };
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
 * @description Permite registrar varios articulos
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
        if (!updatedArticle.resp) allBad.push({ reference: articleData.reference, error: updatedArticle.msg });
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
