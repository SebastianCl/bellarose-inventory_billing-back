/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de item
* @description Script NODEJS que permite realizar operaciones sobre los items registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
// Modelo
const Item = require('../models/item.model');
// Servicio
const commonService = require('../service/common.service');
const itemService = require('../service/item.service');
const storageService = require('../service/storage.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
// Validaciones
const validateData = require('../tools/validations/validateData'); // Scripts de validaciones>
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getItems
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite listar todas los items
 */
const getItems = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(Item);
        if (response.resp === false) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getItem
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite obtener un item filtrado por ID.
 */
const getItem = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);
        let id = req.headers['id'];
        const response = await commonService.getModel(Item, id);
        if (response.resp === false) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createItem
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite crear un item nueva en el DataStore
 */
const createItem = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let data = req.body;

        // Validar si se envio imagen
        let imageBase64 = data.imageBase64;
        if (validateData.isEmpty(imageBase64)) return res.status(400).send({ resp: false, msg: 'Debe enviar la imagen.' });

        let imageData = {
            nameFile: data.reference,
            routeFile: `${data.type}/${data.brand}/${data.color}/${data.size}`,
            imageBase64
        };

        let respondeStorage = await storageService.uploadToStorage(imageData);
        if (!respondeStorage.resp) return res.status(400).send(respondeStorage);


        data.imageURL = respondeStorage.msg.msg;
        let dataItem = Item.sanitize(data);

        let response = await commonService.createModel(Item, dataItem);
        if (response.resp === false) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateItem
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite actualizar un item especifico por ID
 */
const updateItem = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let data = Item.sanitize(req.body);
        let response = await commonService.updateModel(Item, data, id);
        if (response.resp === false) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteItem
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite eliminar un item especifico por ID
 */
const deleteItem = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(Item, id);
        if (response.resp === false) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findItemsWithFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Busca los registro de items por filtro
 */
const findItemsWithFilter = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let options = req.body;
        let filter = { filters: [] };

        if (options.type !== undefined && options.type !== "") {
            filter.filters.push(['type', options.type])
        }
        if (options.reference !== undefined && options.reference !== "") {
            filter.filters.push(['reference', options.reference])
        }
        if (options.brand !== undefined && options.brand !== "") {
            filter.filters.push(['brand', options.brand])
        }
        if (options.color !== undefined && options.color !== "") {
            filter.filters.push(['color', options.color])
        }
        if (options.size !== undefined && options.size !== "") {
            filter.filters.push(['size', options.size])
        }
        if (options.available !== undefined && options.available !== "") {
            filter.filters.push(['available', options.available])
        }

        const itemList = await commonService.listModelsWithFilter(Item, filter);
        res.status(200).send(itemList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

const findItemsCO = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        const respList = await itemService.findItemsCO();
        res.status(respList.code).send({ resp: respList.resp, msg: respList.msg });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

//Exportar funciones
module.exports = {
    getItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    findItemsWithFilter,
    findItemsCO
};