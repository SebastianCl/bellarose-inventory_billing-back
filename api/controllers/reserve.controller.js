/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
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
const invoiceService = require('../service/invoice.service');
const articleReserved = require('../service/articleReserved.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
// Validaciones
const validateData = require('../tools/validations/validateData');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getReserves
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

            articles.push({ code: dataAR.code, price: dataAR.price, discount: dataAR.discount });
        }

        dataReserve.articles = articles;
        return res.status(200).send({ resp: true, msg: dataReserve });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

// Validar si el artículo existe o esta disponible
async function articleStatusDate(articles, startDate, endDate) {
    let typeNumError = 0;
    let resp = { resp: false, type: typeNumError, msg: '' };

    let allBad = [];
    let allDataArticles = [];

    for (let value of articles) {
        // Datos de artículo
        const code = value.code;
        const price = value.price;
        const discount = value.discount;

        let filter = { filters: ['code', code] };
        let exist = await commonService.listModelsWithFilter(Article, filter);

        // Validar si el artículo existe
        if (!exist.resp) {
            allBad.push({ code, motive: 'No existe artículo con el codigo indicado.' });
            typeNumError = 1; // FALLA por no existir artículo con código indicado
            break;
        }

        const articleData = exist.msg[0];
        // Validar si hay artículos disponibles
        if (articleData.quantity === 0) {
            let filterAR = { filters: [] };
            filterAR.filters.push(['code', articleData.code]);
            filterAR.filters.push(['active', true]);
            let responseEarlyDate = await commonService.listModelsWithFilter(ArticleReserved, filterAR);
            if (!responseEarlyDate.resp) return { resp: false, msg: 'Fallo al buscar el artículo reservado.' };

            let listAR = responseEarlyDate.msg;

            // Ordenar lista ascendente
            const listARorder = listAR.sort((a, b) => a.dateEnd - b.dateEnd);
            const earlyDate = listARorder[0].dateEnd; // Fecha más cercana en que se devolvera el artículo
            allBad.push({ code, earlyDate });
            typeNumError = 2; // FALLA por no disponibilidad
            break;
        }

        const dataArticleReserved = { id: articleData.id, quantity: articleData.quantity, code, price, discount, dateInit: startDate, dateEnd: endDate };
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

// Permite almacenar un registro de un artículo reservado 
async function createAR(dataArticleReserved) {
    const articleID = dataArticleReserved.id;

    const quantity = dataArticleReserved.quantity - 1;
    let articleNewData = { quantity };

    // Actualizar registros
    const updatedArticle = await commonService.updateModel(Article, articleNewData, articleID);
    if (!updatedArticle.resp) return updatedArticle;

    // Crear registro de artículo reservado
    const dataAR = {
        code: dataArticleReserved.code, price: dataArticleReserved.price, discount: dataArticleReserved.discount,
        dateInit: dataArticleReserved.dateInit, dateEnd: dataArticleReserved.dateEnd
    };

    let createdAR = await commonService.createModel(ArticleReserved, dataAR);

    return createdAR;
}

/**
 * @function calculateCost
 * @description Calcula el costo total de una reserva
 */
function calculateCost(articles) {
    let cost = 0;

    for (let index = 0; index < articles.length; index++) {
        const article = articles[index];

        // Calcular costo de artículo
        let articlePrice = article.price - (article.price * (article.discount / 100));

        cost = cost + articlePrice;
    }

    return cost;
}

/**
 * @function createReserve
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
        let description = data.description ? data.description : '';

        let typeNumError = 0; // Tipo de fallo al crear reserva

        // Validar si se envio el id del cliente
        if (validateData.isEmpty(customerID)) return res.status(400).send({ resp: false, type: typeNumError, msg: 'Debe indicar la identificación del cliente.' });
        // Validar si se envio el id del empleado
        if (validateData.isEmpty(employeeID)) return res.status(400).send({ resp: false, type: typeNumError, msg: 'Debe indicar la identificación del empleado.' });
        // Validar si se envio la fecha de inicio de la reserva
        if (validateData.isEmpty(startDate)) return res.status(400).send({ resp: false, type: typeNumError, msg: 'Debe indicar la fecha de inicio de la reserva.' });
        // Validar si se envio la fecha fin de la reserva
        if (validateData.isEmpty(endDate)) return res.status(400).send({ resp: false, type: typeNumError, msg: 'Debe indicar la fecha fin de la reserva.' });
        // Validar si se envio los artículos
        if (validateData.isEmpty(articles) || articles.length == 0) return res.status(400).send({ resp: false, type: typeNumError, msg: 'Debe indicar los artículos.' });

        // Asignar formato de fecha
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // Validar si existe el cliente
        let respCustomer = await commonService.getModel(Customer, customerID, true);
        if (!respCustomer.resp) return res.status(400).send({ resp: false, type: typeNumError, msg: `No existe el cliente con id ${customerID}.` });
        let customerKey = respCustomer.msg.entityKey;
        let customerName = respCustomer.msg.entityData.name;
        let customerIdentification = respCustomer.msg.entityData.identification;

        // Validar si existe el empleado
        let respEmployee = await commonService.getModel(Employee, employeeID, true);
        if (!respEmployee.resp) return res.status(400).send({ resp: false, type: typeNumError, msg: `No existe el empleado con id ${employeeID}.` });
        let employeeKey = respEmployee.msg.entityKey;
        let employeeName = respEmployee.msg.entityData.name;
        let employeeIdentification = respEmployee.msg.entityData.identification;

        let allId_AR = [];

        let respAS = await articleStatusDate(articles, startDate, endDate);
        if (!respAS.resp) return res.status(400).send(respAS);

        let allDataArticles = respAS.msg;

        for (const dataArticleReserved of allDataArticles) {

            let isCreateAR = await createAR(dataArticleReserved);
            if (!isCreateAR.resp) return res.status(400).send(isCreateAR);
            const idAR = isCreateAR.msg.id; // ID de registro de artículo reservado
            allId_AR.push(idAR);
        }

        // Obtener número de reserva
        let respondeReserve = await reserveService.getLastNumberReserve();
        if (!respondeReserve.resp) return res.status(401).send({ resp: false, typeNumError: 3, msg: 'No se obtuvo el número de reserva.' });

        const reserveNumber = respondeReserve.msg + 1; // Asignar nuevo número de reserva
        let cost = calculateCost(articles); // Obtener costo de reserva

        // Completar datos y crear reserva
        const newReserve = {
            customer: customerKey, employee: employeeKey,
            customerName, customerIdentification, employeeName, employeeIdentification,
            description,
            startDate, endDate,
            reserveNumber,
            articles: allId_AR,
            cost,
            status: 'ACTIVA'
        };
        // Crear reserva
        let createdReserve = await commonService.createModel(Reserve, newReserve);
        if (!createdReserve.resp) return res.status(400).send({ resp: false, typeNumError: 4, msg: createdReserve.msg });

        return res.status(200).send(createdReserve);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function finishReserve
 * @description Permite finalizar una reserva especifica por ID
 */
const finishReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let reserveNumber = req.body.reserveNumber;
        // Validar si envio número de reserva
        if (!reserveNumber) return res.status(400).send({ resp: false, msg: 'Debe enviar el número de la reserva.' });

        let respFinish = await reserveService.finishReserve(reserveNumber);

        if (!respFinish.resp) return res.status(400).send(respFinish);
        return res.status(200).send(respFinish);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function cancelReserve
 * @description Permite cancelar una reserva especifica por ID
 */
const cancelReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let reserveNumber = req.body.reserveNumber;
        // Validar si envio número de reserva
        if (!reserveNumber) return res.status(400).send({ resp: false, msg: 'Debe enviar el número de la reserva.' });

        let respFinish = await reserveService.cancelReserve(reserveNumber);

        if (!respFinish.resp) return res.status(400).send(respFinish);
        return res.status(200).send(respFinish);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function editReserve
 * @description Permite actualizar una reserva especifica por ID
 */
const editReserve = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let reserveID = req.headers['id'];

        // Validar si existe la reserva
        let respReserve = await commonService.getModel(Reserve, reserveID);
        if (!respReserve.resp) return res.status(400).send({ resp: false, msg: 'No existe la reserva.' });

        let dataReserve = respReserve.msg; // Datos de la reserva

        // Validar si la reserva esta activa
        if (!dataReserve.active) return res.status(400).send({ resp: false, msg: 'No se puede editar una reserva cerrada.' });

        let newData = req.body; // Nuevos datos de la reserva

        // Si se actualiza la fecha final
        let endDate = newData.endDate ? new Date(newData.endDate) : dataReserve.endDate;
        // Valida si se actualiza la descripción
        let description = newData.description ? newData.description : dataReserve.description;

        let allId_AR = dataReserve.articles; // IDs de antiguos artículos reservados    
        let newArticles = newData.articles;
        let cost = dataReserve.cost;
        // Validar si se edita la lista de artículos
        if (newArticles) {
            // Borrar registros viejos de artículos reservados y retornar al inventario
            let oldAR = dataReserve.articles;
            for (let index = 0; index < oldAR.length; index++) {
                const idAR = oldAR[index];

                // Validar si existe el artículo reservado            
                let responseAR = await commonService.getModel(ArticleReserved, idAR);
                if (!responseAR.resp) return responseAR;

                // Buscar información del artículo
                let code = responseAR.msg.code;
                let filter = { filters: ['code', code] };
                let respArticle = await commonService.listModelsWithFilter(Article, filter);

                // Retornar artículo al inventario
                let idArticle = respArticle.msg.id;
                let data = { quantity: respArticle.msg.quantity + 1 }
                await commonService.updateModel(Article, data, idArticle);

                // Eliminar artículo reservado
                let respDeleteAR = await commonService.deleteModel(ArticleReserved, idAR);
                if (!respDeleteAR.resp) return respDeleteAR;
            }

            let startDate = dataReserve.startDate;
            let respAS = await articleStatusDate(newArticles, startDate, endDate);
            if (!respAS.resp) return res.status(400).send(respAS);

            let allDataArticles = respAS.msg;

            allId_AR = [];
            for (const dataArticleReserved of allDataArticles) {

                let isCreateAR = await createAR(dataArticleReserved);
                if (!isCreateAR.resp) return res.status(400).send(isCreateAR);
                const idAR = isCreateAR.msg.id; // ID de registro de artículo reservado
                allId_AR.push(idAR);
            }

            // Calcular costo de reserva
            cost = calculateCost(newArticles);
        }

        let newDataReserve = { endDate, description, articles: allId_AR, invoiceNumber: 0, cost };

        // Actualizar reserva
        let response = await commonService.updateModel(Reserve, newDataReserve, reserveID);
        if (!response.resp) return res.status(400).send(response);

        let idInvoice = dataReserve.invoiceNumber;
        await invoiceService.disableInvoice(idInvoice);

        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function deleteReserve
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


/**
 * @function findReserveWithFilter
 * @description Busca los registro de reserves por filtro
 */
const findReserveByDate = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);


        let startDate = req.body.startDate;
        let endDate = req.body.endDate;

        // Asignar formato de fecha
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        const reserveList = await reserveService.findReserveByDate(startDate, endDate);
        if (!reserveList.resp) res.status(400).send(reserveList);

        res.status(200).send(reserveList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

/**
 * @function dataArticlesReserved
 * @description Retorna el detalle de los artículos reservados
 */
const dataArticlesReserved = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let reserveNumber = req.body.reserveNumber;

        if (!reserveNumber) return res.status(400).send({ resp: false, msg: 'Debe indicar el número de la reserva.' });

        let responseAR = await articleReserved.dataArticlesReserved(reserveNumber);

        if (!responseAR.resp) return res.status(400).send(responseAR);

        return res.status(200).send(responseAR);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
};


//Exportar funciones
module.exports = {
    getReserves,
    getReserve,
    createReserve,
    editReserve,
    deleteReserve,
    findReserveWithFilter,
    finishReserve,
    cancelReserve,
    findReserveByDate,
    dataArticlesReserved
};