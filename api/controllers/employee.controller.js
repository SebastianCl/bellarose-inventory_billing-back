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
const Employee = require('../models/employee.model');
// Servicio
const commonService = require('../service/common.service');
// Autenticación JWT
const auth = require('../auth/securityJWT');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/

/**
 * @function getEmployees
 * @description Permite listar todas los employees
 */
const getEmployees = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let response = await commonService.getModels(Employee);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getEmployee
 * @description Permite obtener un employee filtrado por ID.
 */
const getEmployee = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.getModel(Employee, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createEmployee
 * @description Permite crear un employee nueva en el DataStore
 */
const createEmployee = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let employeeData = req.body;
        let employeeID = employeeData.identification;
        if (employeeID === undefined) return res.status(400).send({ resp: false, type: typeNum, msg: 'Debe indicar la cédula del empleado.' });

        let filter = { filters: ['identification', employeeID] };
        let respemployee = await commonService.listModelsWithFilter(Employee, filter);
        if (respemployee.resp) return res.status(400).send({ resp: false, msg: `Ya existe un empleado registrado con cédula: ${employeeID}` });

        let data = Employee.sanitize(employeeData);
        let response = await commonService.createModel(Employee, data);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function updateEmployee
 * @description Permite actualizar un employee especifico por ID
 */
const updateEmployee = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let data = Employee.sanitize(req.body);
        let response = await commonService.updateModel(Employee, data, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteEmployee
 * @description Permite eliminar un employee especifico por ID
 */
const deleteEmployee = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        let response = await commonService.deleteModel(Employee, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function findEmployeesWithFilter
 * @description Busca los registro de employees por filtro
 */
const findEmployeesWithFilter = async (req, res) => {
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

        const employeeList = await commonService.listModelsWithFilter(Employee, filter);
        res.status(200).send(employeeList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
}

// Exportar funciones
module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    findEmployeesWithFilter
};