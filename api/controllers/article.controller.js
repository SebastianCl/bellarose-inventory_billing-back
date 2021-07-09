/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de article
* @description Script NODEJS que permite realizar operaciones sobre los articles registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
// Modelo
const Article = require('../models/article.model');
// Servicio
const commonService = require('../service/common.service');
const articleService = require('../service/article.service');
const storageService = require('../service/storage.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
// Validaciones
const validateData = require('../tools/validations/validateData'); // Scripts de validaciones>
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getArticles
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite listar todas los articles
 */
const getArticles = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(Article);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getArticle
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite obtener un articulo filtrado por ID.
 */
const getArticle = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);
        let id = req.headers['id'];
        const response = await commonService.getModel(Article, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createArticle
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite crear un articulo nueva en el DataStore
 */
const createArticle = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        // Obtener caracteristicas del artículo, sin espacios en blanco y la referencia en mayusculas
        let data = req.body;
        let quantity = data.quantity;
        let price = data.price;
        let comments = data.comments ? data.comments : '';
        let type = data.type.trim();
        let brand = data.brand.trim();
        let color = data.color.trim();
        let size = data.size.trim();
        size = size.toUpperCase();
        let reference = data.reference.trim();
        reference = reference.toUpperCase();
        let imageBase64 = data.imageBase64;
        let available = data.available;


        // Validar si se envio la cantidad de articulos
        if (validateData.isEmpty(type)) return res.status(400).send({ resp: false, msg: 'Debe enviar la cantidad.' });
        // Validar si se envio el precio del articulo
        if (validateData.isEmpty(type)) return res.status(400).send({ resp: false, msg: 'Debe enviar el precio.' });
        // Validar si se envio el tipo articulo
        if (validateData.isEmpty(type)) return res.status(400).send({ resp: false, msg: 'Debe enviar el tipo.' });
        // Validar si se envio la marca
        if (validateData.isEmpty(brand)) return res.status(400).send({ resp: false, msg: 'Debe enviar la marca.' });
        // Validar si se envio el color
        if (validateData.isEmpty(color)) return res.status(400).send({ resp: false, msg: 'Debe enviar el color.' });
        // Validar si se envio la talla
        if (validateData.isEmpty(size)) return res.status(400).send({ resp: false, msg: 'Debe enviar la talla' });
        // Validar si se envio la referencia
        if (validateData.isEmpty(reference)) return res.status(400).send({ resp: false, msg: 'Debe enviar la referencia.' });
        // Validar si se envio imagen
        if (validateData.isEmpty(imageBase64)) return res.status(400).send({ resp: false, msg: 'Debe enviar la imagen.' });
        // Validar si se indicó el estado de disponibilidad
        if (validateData.isEmpty(available)) return res.status(400).send({ resp: false, msg: 'Debe indicar el estado de disponibilidad.' });

        // Buscar si existe un artículo con la referencia enviada
        let filter = { filters: ['reference', reference] };
        let respFilter = await commonService.listModelsWithFilter(Article, filter);
        if (respFilter.resp) return res.status(400).send({ resp: false, msg: `Ya existe un artículo de referencia ${reference}` });

        let imageData = {
            nameFile: reference,
            routeFile: `${type}/${brand}/${color}/${size}`,
            imageBase64,
            available
        };

        let responseStorage = await storageService.uploadToStorage(imageData);
        if (!responseStorage.resp) return res.status(400).send(responseStorage);

        let imageURL = responseStorage.msg.msg;

        let dataArticle = { quantity, price, comments, type, brand, color, size, reference, available, imageURL };

        let response = await commonService.createModel(Article, dataArticle);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateArticle
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite actualizar un articulo especifico por ID
 */
const updateArticle = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        if (validateData.isEmpty(id)) return res.status(400).send({ resp: false, msg: 'Debe enviar el id del articulo.' });

        let respArticle = await commonService.getModel(Article, id);
        if (!respArticle.resp) return res.status(400).send({ resp: false, msg: 'No existe el articulo.' });

        let dataArticle = respArticle.msg;

        let newData = req.body;
        let quantity = newData.quantity ? newData.quantity : dataArticle.quantity;
        let price = newData.price ? newData.price : dataArticle.price;
        let comments = newData.comments ? newData.comments : dataArticle.comments;
        let type = newData.type ? newData.type : dataArticle.type;
        let brand = newData.brand ? newData.brand.trim() : dataArticle.brand;
        let color = newData.color ? newData.color.trim() : dataArticle.color;
        let size = newData.size ? newData.size.trim() : dataArticle.size;
        size = size.toUpperCase();
        let reference = newData.reference ? newData.reference.trim() : dataArticle.reference;
        reference = reference.toUpperCase();
        let available = newData.available === undefined ? dataArticle.available : newData.available;


        let imageBase64 = newData.imageBase64;

        // Actualizar imagen
        let imageURL = dataArticle.imageURL;
        if (imageBase64) {
            let imageData = {
                nameFile: reference,
                routeFile: `${type}/${brand}/${color}/${size}`,
                imageBase64,
                available
            };
            let responseStorage = await storageService.uploadToStorage(imageData);

            if (!responseStorage.resp) return res.status(400).send(responseStorage);

            imageURL = responseStorage.msg.msg;

            // Eliminar imagen anterior
            let oldFilePathName = dataArticle.imageURL;
            responseStorage = await storageService.deleteFile(oldFilePathName);
            console.log(responseStorage);
        }

        // Actualizar ruta de imagen
        if (newData.type || newData.brand || newData.color || newData.size || newData.reference) {

            let oldFilePathName = dataArticle.imageURL;
            let newFilePathName = `${type}/${brand}/${color}/${size}/${reference}.png`;
            let respRename = await storageService.renameFile(oldFilePathName, newFilePathName);
            imageURL = newFilePathName;
            console.log(respRename);
        }

        let newDataArticle = { quantity, price, comments, type, brand, color, size, reference, available, imageURL };

        let response = await commonService.updateModel(Article, newDataArticle, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteArticle
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite eliminar un articulo especifico por ID
 */
const deleteArticle = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(Article, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findArticlesWithFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Busca los registro de articles por filtro
 */
const findArticlesWithFilter = async (req, res) => {
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

        const articleList = await commonService.listModelsWithFilter(Article, filter);
        res.status(200).send(articleList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

//Exportar funciones
module.exports = {
    getArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    findArticlesWithFilter
};