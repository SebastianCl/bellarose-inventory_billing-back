/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de reserva
* @description Script NODEJS que permite realizar operaciones sobre los reservas registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
// Modelo
const Reserve = require('../models/reserve.model');
const Article = require('../models/article.model');
// Servicio
const commonService = require('../service/common.service');
const reserveService = require('../service/reserve.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
// Validaciones
const validateData = require('../tools/validations/validateData');
const general = require('../tools/utils/general');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getReserves
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite listar todas los reserves
 */
const getReserves = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(Reserve);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getReserve
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite obtener un reserve filtrado por ID.
 */
const getReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);
        let id = req.headers['id'];
        const response = await commonService.getModel(Reserve, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createReserve
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite crear un reserva nueva en el DataStore
 */
const createReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let data = req.body;

        let customerName = data.customerName;
        let employeeName = data.employeeName;
        let startDate = data.startDate;
        let endDate = data.endDate;
        let articles = data.articles;

        // Validar si se envio el nombre del cliente
        if (validateData.isEmpty(customerName)) return res.status(400).send({ resp: false, msg: 'Debe indicar el nombre del cliente.' });
        // Validar si se envio el nombre del empleado
        if (validateData.isEmpty(employeeName)) return res.status(400).send({ resp: false, msg: 'Debe indicar el nombre del empleado.' });
        // Validar si se envio la fecha de inicio de la reserva
        if (validateData.isEmpty(startDate)) return res.status(400).send({ resp: false, msg: 'Debe indicar la fecha de inicio de la reserva.' });
        // Validar si se envio la fecha fin de la reserva
        if (validateData.isEmpty(endDate)) return res.status(400).send({ resp: false, msg: 'Debe indicar la fecha fin de la reserva.' });
        // Validar si se envio los artículos
        if (validateData.isEmpty(articles) || articles.length == 0) return res.status(400).send({ resp: false, msg: 'Debe indicar los artículos.' });

        let allBad = [];
        let allDataArticle = [];
        // Validar si el item existe o esta disponible
        for (let index = 0; index < articles.length; index++) {
            const reference = articles[index];

            let filter = { filters: ['reference', reference] };
            let exist = await commonService.listModelsWithFilter(Article, filter);

            // Validar si el artículo existe
            if (!exist.resp) {
                allBad.push({ reference, motive: 'No existe artículo con la referencia indicada.' });
            }
            else {
                const articleData = exist.msg[0];
                // Validar si el artículo esta disponible
                if (!articleData.available) {
                    allBad.push({ reference, motive: 'No hay artículos disponibles con la referencia indicada.' });
                }
                else {
                    allDataArticle.push(articleData);
                }
            }
        }

        if (allBad.length > 0) return res.status(400).send({ resp: false, msg: allBad });

        // Obtener número de reserva
        let respondeReserve = await reserveService.getLastNumberReserve();

        // Validar si se obtuvo respuesta de las reservas
        if (!respondeReserve.resp) return res.status(401).send({ resp: false, msg: 'No se obtuve el número de reserva.' });

        const reserveNumber = respondeReserve.msg + 1;
        // Completar datos y crear reserva
        const newReserve = {
            customerName, employeeName, startDate, endDate,
            reserveNumber,
            articles: allDataArticle
        };
        let response = await commonService.createModel(Reserve, newReserve);

        // Validar si se registro la reserva
        if (!response.resp) return res.status(400).send(response);

        // Actualizar los artículos
        for (let index = 0; index < allDataArticle.length; index++) {
            const item = allDataArticle[index];
            const itemID = item.id;

            let quantity = item.quantity - 1;
            let available = true;
            if (quantity === 0) available = false;
            let itemNewData = { quantity, available };

            // Actualizar registros
            let updated = await commonService.updateModel(Article, itemNewData, itemID);

            // Validar si se actualizo el item
            if (!updated.resp) return res.status(400).send({ resp: false, msg: allBad });
            // TODO: Asegurar que los artículos que no se actualizarón, se actualicen
        }

        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function finishReserve
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite finalizar una reserva especifica por ID
 */
const finishReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];

        // Validar si existe la reserva
        let respReserve = await commonService.getModel(Reserve, id);
        if (!respReserve.resp) return res.status(400).send(respReserve);

        let articles = respReserve.msg.entityData.articles;

        // Regresar artículos al inventario
        for (let index = 0; index < articles.length; index++) {
            const dataArticle = articles[index];
            const reference = dataArticle.reference;

            // Validar si existe el item
            let filter = { filters: ['reference', reference] };
            let resArticle = await commonService.listModelsWithFilter(Article, filter);
            if (!resArticle.resp) return res.status(400).send(resArticle);

            let item = resArticle.msg[0];
            let itemID = item.id;
            let quantity = item.quantity + 1;
            let available = true;
            let itemNewData = { quantity, available };

            // Actualizar registros
            let updated = await commonService.updateModel(Article, itemNewData, itemID);

            // Validar si se actualizo el item
            if (!updated.resp) return res.status(400).send({ resp: false, msg: allBad });
        }

        // Deshabilitar reserva
        let newData = { active: false };
        let data = Reserve.sanitize(newData);
        let response = await commonService.updateModel(Reserve, data, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateReserve
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite actualizar una reserva especifica por ID
 */
const updateReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let data = Reserve.sanitize(req.body);
        let response = await commonService.updateModel(Reserve, data, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteReserve
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite eliminar un reserve especifico por ID
 */
const deleteReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(Reserve, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findReservesWithFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Busca los registro de reserves por filtro
 */
const findReservesWithFilter = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let options = req.body;
        let filter = { filters: [] };

        if (options.numCO !== undefined && options.numCO !== "") {
            filter.filters.push(['numCO', options.numCO])
        }
        if (options.requested !== undefined && options.requested !== "") {
            filter.filters.push(['requested', options.requested])
        }
        if (options.quote !== undefined && options.quote !== "") {
            filter.filters.push(['quote', options.quote])
        }

        const reserveList = await commonService.listModelsWithFilter(Reserve, filter);
        res.status(200).send(reserveList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

//Exportar funciones
module.exports = {
    getReserves,
    getReserve,
    createReserve,
    updateReserve,
    deleteReserve,
    findReservesWithFilter,
    finishReserve
};