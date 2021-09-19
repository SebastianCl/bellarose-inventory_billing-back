/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de empleado
* @description Script NODEJS que permite realizar operaciones sobre los clientes registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
// Modelo
const Customer = require('../models/customer.model');
// Servicio
const commonService = require('../service/common.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getCustomer
 * @description Permite listar todas los clientes
 */
const getCustomers = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(Customer);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getCustomer
 * @description Permite obtener un clientes filtrado por ID.
 */
const getCustomer = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.getModel(Customer, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createCustomer
 * @description Permite crear un clientes nueva en el DataStore
 */
const createCustomer = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let customerData = req.body;
        let customerID = customerData.identification;
        if (customerID === undefined) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar la cédula del cliente.' });

        let filter = { filters: ['identification', customerID] };
        let respCustomer = await commonService.listModelsWithFilter(Customer, filter);
        if (respCustomer.resp) return res.status(400).send({ resp: false, msg: `Ya existe un cliente registrado con cédula: ${customerID}` });

        let data = Customer.sanitize(customerData);
        let response = await commonService.createModel(Customer, data);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateCustomer
 * @description Permite actualizar un clientes especifico por ID
 */
const updateCustomer = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let data = Customer.sanitize(req.body);
        let response = await commonService.updateModel(Customer, data, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteCustomer
 * @description Permite eliminar un clientes especifico por ID
 */
const deleteCustomer = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(Customer, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findCustomerWithFilter
 * @description Buscas clientes por filtro
 */
const findCustomerWithFilter = async (req, res) => {
    try {
        // Validar el token
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let options = req.body;
        let filter = { filters: [] };

        if (options.name !== undefined && options.name !== "") {
            filter.filters.push(['name', options.name])
        }
        if (options.identification !== undefined && options.identification !== "") {
            filter.filters.push(['identification', options.identification])
        }

        const customerList = await commonService.listModelsWithFilter(Customer, filter);
        res.status(200).send(customerList);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
}

// Exportar funciones
module.exports = {
    getCustomer,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomerWithFilter
};