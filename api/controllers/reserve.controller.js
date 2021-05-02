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
const Invoice = require('../models/invoice.model');
const ArticleReserved = require('../models/articleReserved.model');
const Customer = require('../models/customer.model');
const Employee = require('../models/employee.model');
// Servicios
const commonService = require('../service/common.service');
const reserveService = require('../service/reserve.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
// Validaciones
const validateData = require('../tools/validations/validateData');
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
        const respReserve = await commonService.getModel(Reserve, id);
        if (!respReserve.resp) return res.status(400).send(respReserve);
        let dataReserve = respReserve.msg;

        let articlesID = dataReserve.articles;
        let articles = [];

        for (let index = 0; index < articlesID.length; index++) {
            const articleReservedID = articlesID[index];
            const respAR = await commonService.getModel(ArticleReserved, articleReservedID);
            if (!respAR.resp) return res.status(400).send(respAR);
            const dataAR = respAR.msg;

            articles.push({ reference: dataAR.reference, price: dataAR.price, discount: dataAR.discount });
        }

        dataReserve.articles = articles;
        return res.status(200).send({ resp: true, msg: dataReserve });
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

        let customerID = data.customerID;
        let employeeID = data.employeeID;
        let startDate = data.startDate;
        let endDate = data.endDate;
        let articles = data.articles;

        let typeNum = 0; // Tipo de fallo al crear reserva

        // Validar si se envio el id del cliente
        if (validateData.isEmpty(customerID)) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar la identificación del cliente.' });
        // Validar si se envio el id del empleado
        if (validateData.isEmpty(employeeID)) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar la identificación del empleado.' });
        // Validar si se envio la fecha de inicio de la reserva
        if (validateData.isEmpty(startDate)) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar la fecha de inicio de la reserva.' });
        // Validar si se envio la fecha fin de la reserva
        if (validateData.isEmpty(endDate)) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar la fecha fin de la reserva.' });
        // Validar si se envio los artículos
        if (validateData.isEmpty(articles) || articles.length == 0) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar los artículos.' });

        // Asignar formato de fecha
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // Validar si existe el cliente
        let respKey = await commonService.getEntityKey(Customer, customerID);
        if (!respKey.resp) return res.status(400).send({ resp: false, msg: `No existe el cliente con id ${customerID}.` });
        let customer = respKey.msg;
        let respCustomer = await commonService.getModel(Customer, customerID);
        let customerName = respCustomer.msg.name;
        let customerIdentification = respCustomer.msg.identification;

        // Validar si existe el empleado
        respKey = await commonService.getEntityKey(Employee, employeeID);
        if (!respKey.resp) return res.status(400).send({ resp: false, msg: `No existe el empleado con id ${employeeID}.` });
        let employee = respKey.msg;
        let respEmployee = await commonService.getModel(Employee, employeeID);
        let employeeName = respEmployee.msg.name;

        let allBad = [];
        let allId_AR = [];
        // Validar si el artículo existe o esta disponible
        for (let index = 0; index < articles.length; index++) {
            const reference = articles[index].ref;
            const price = articles[index].price;
            const discount = articles[index].discount;

            let filter = { filters: ['reference', reference] };
            let exist = await commonService.listModelsWithFilter(Article, filter);

            // Validar si el artículo existe
            if (!exist.resp) {
                allBad.push({ reference, motive: 'No existe artículo con la referencia indicada.' });
                typeNum = 1;
                break;
            }
            else {
                const articleData = exist.msg[0];
                // Validar si hay artículos disponibles
                if (articleData.quantity === 0) {
                    let filterAR = { filters: [] };
                    filterAR.filters.push(['reference', articleData.reference]);
                    filterAR.filters.push(['active', true]);
                    let responseearlyDate = await commonService.listModelsWithFilter(ArticleReserved, filterAR);
                    if (!responseearlyDate.resp) return res.status(400).send({ resp: false, msg: 'Fallo al buscar el artículo reservado.' });

                    let listAR = responseearlyDate.msg;

                    // Ordenar lista ascendente
                    const listARorder = listAR.sort((a, b) => a.dateEnd - b.dateEnd);
                    const earlyDate = listARorder[0].dateEnd; // Fecha más cercana en que se devolvera el artículo
                    allBad.push({ reference, earlyDate });
                    typeNum = 2;
                    break;
                }
                else {
                    const dataArticleReserved = { reference, price, discount, dateInit: startDate, dateEnd: endDate };
                    let isCreateAR = await createAR(articleData, dataArticleReserved);
                    if (!isCreateAR.resp) return res.status(400).send(isCreateAR);
                    const idAR = isCreateAR.msg.id;
                    allId_AR.push(idAR);
                }
            }
        }

        if (allBad.length > 0) {
            if (typeNum === 2) {
                for (let index = 0; index < allId_AR.length; index++) {
                    const id_AR = allId_AR[index];
                    // Eliminar registros de artículos reservados
                    await reserveService.returnArticles(id_AR, true);
                }
            }
            return res.status(400).send({ resp: false, type: typeNum, msg: allBad });
        }

        // Obtener número de reserva
        let respondeReserve = await reserveService.getLastNumberReserve();
        if (!respondeReserve.resp) return res.status(401).send({ resp: false, typeNum: 3, msg: 'No se obtuvo el número de reserva.' });

        const reserveNumber = respondeReserve.msg + 1; // Asignar nuevo número de reserva
        // Completar datos y crear reserva
        const newReserve = {
            customer, employee, customerName, customerIdentification, employeeName,
            startDate, endDate, reserveNumber,
            articles: allId_AR
        };
        let createdReserve = await commonService.createModel(Reserve, newReserve);
        if (!createdReserve.resp) return res.status(400).send({ resp: false, typeNum: 4, msg: createdReserve.msg });

        return res.status(200).send(createdReserve);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

async function createAR(article, dataArticleReserved) {
    const articleID = article.id;

    const quantity = article.quantity - 1;
    let articleNewData = { quantity };

    // Actualizar registros
    const updatedArticle = await commonService.updateModel(Article, articleNewData, articleID);
    if (!updatedArticle.resp) return updatedArticle;

    // Crear registro de artículo reservado
    const dataAR = dataArticleReserved;
    let createdAR = await commonService.createModel(ArticleReserved, dataAR);

    return createdAR;
}

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

        let reserveNumber = req.body.reserveNumber;

        let respFinish = await reserveService.finishReserve(reserveNumber);

        if (!respFinish.resp) return res.status(400).send(respFinish);
        return res.status(200).send(respFinish);
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
        let data = req.body;

        // Validar si existe la reserva
        let respReserve = await commonService.getModel(Reserve, reservID);
        if (!respReserve.resp) return res.status(400).send({ resp: false, msg: 'No existe la reserva' });


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
        let respReserve = await commonService.commonService(Reserve, id);
        if (!respReserve.resp) return res.status(400).send(respReserve);

        let dataReserve = respReserve.msg;
        let articles = dataReserve.articles;
        let invoiceNumber = dataReserve.invoiceNumber;

        // Buscar factura        
        if (invoiceNumber > 0) {
            let filter = { filters: ['invoiceNumber', invoiceNumber] };
            let respFilter = await commonService.listModelsWithFilter(Invoice, filter);
            if (!respFilter.resp) return res.status(400).send({ resp: false, msg: `No existe factura con número ${invoiceNumber}` });
        }

        // Regresar artículos al inventario y desactivar artículos reservados
        for (let index = 0; index < articles.length; index++) {
            const id_AR = articles[index];

            // Devolver artículos
            let updatesArticle = await reserveService.returnArticles(id_AR, false);
            if (!updatesArticle.resp) return res.status(400).send(updatesArticle);
        }

        let respDelete = await commonService.deleteModel(Reserve, id);
        if (!respDelete.resp) return res.status(400).send(respDelete);
        return res.status(200).send(respDelete);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findReserveWithFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Busca los registro de reserves por filtro
 */
const findReserveWithFilter = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let options = req.body;
        let filter = { filters: [] };

        if (options.customerName !== undefined && options.customerName !== "") {
            filter.filters.push(['customerName', options.customerName])
        }
        if (options.customerID !== undefined && options.customerID !== "") {
            filter.filters.push(['customerID', options.customerID])
        }
        if (options.employeeName !== undefined && options.employeeName !== "") {
            filter.filters.push(['employeeName', options.employeeName])
        }
        if (options.reserveNumber !== undefined && options.reserveNumber !== "") {
            filter.filters.push(['reserveNumber', options.reserveNumber])
        }
        if (options.invoiceNumber !== undefined && options.invoiceNumber !== "") {
            filter.filters.push(['invoiceNumber', options.invoiceNumber])
        }
        if (options.active !== undefined && options.active !== "") {
            filter.filters.push(['active', options.active])
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
    findReserveWithFilter,
    finishReserve
};