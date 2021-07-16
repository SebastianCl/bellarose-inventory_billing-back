/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de empleado
* @description Script NODEJS que permite realizar operaciones sobre los empleados registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
// Modelo
const ArticleReserved = require('../models/articleReserved.model');
// Servicio
const commonService = require('../service/common.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getArticleReserveds
 * @description Permite listar todas los artículos reservados
 */
const getArticleReserveds = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(ArticleReserved);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getArticleReserved
 * @description Permite obtener un artículo reservado filtrado por ID.
 */
const getArticleReserved = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.getModel(ArticleReserved, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createArticleReserved
 * @description Permite crear un artículo reservado nueva en el DataStore
 */
const createArticleReserved = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let data = ArticleReserved.sanitize(req.body);
        let response = await commonService.createModel(ArticleReserved, data);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateArticleReserved
 * @description Permite actualizar un artículo reservado especifico por ID
 */
const updateArticleReserved = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let data = ArticleReserved.sanitize(req.body);
        let response = await commonService.updateModel(ArticleReserved, data, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteArticleReserved
 * @description Permite eliminar un artículo reservado especifico por ID
 */
const deleteArticleReserved = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(ArticleReserved, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findArticleReservedsWithFilter
 * @description Busca los registro de artículos reservados por filtro
 */
const findArticleReservedsWithFilter = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let options = req.body;
        let filter = { filters: [] };

        if (options.reference !== undefined && options.reference !== "") {
            filter.filters.push(['reference', options.reference])
        }
        if (options.dateInit !== undefined && options.dateInit !== "") {
            filter.filters.push(['dateInit', options.dateInit])
        }
        if (options.dateEnd !== undefined && options.dateEnd !== "") {
            filter.filters.push(['dateEnd', options.dateEnd])
        }
        if (options.active !== undefined && options.active !== "") {
            filter.filters.push(['active', options.active])
        }

        const articleReservedList = await commonService.listModelsWithFilter(ArticleReserved, filter);
        res.status(200).send(articleReservedList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

// Exportar funciones
module.exports = {
    getArticleReserveds,
    getArticleReserved,
    createArticleReserved,
    updateArticleReserved,
    deleteArticleReserved,
    findArticleReservedsWithFilter
};