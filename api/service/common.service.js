/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio común
* @description Script NODEJS que permite realizar operaciones CRUD sobre un modelo. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

const getModels = async (Model) => {
    let res = { resp: false, msg: '' };
    await Model.list()
        .populate()
        .then((entities) => {
            res.resp = true;
            res.msg = entities.entities;
        })
        .catch(err => { res.msg = err; })
    return res;
}

const getModel = async (Model, id) => {
    let res = { resp: false, msg: '' };
    let modelId = Number(id);
    await Model.get(modelId)
        .populate()
        .then((entity) => {
            res.resp = true;
            res.msg = entity;//.plain();
        })
        .catch(err => { res.msg = err; })
    return res;
}

const createModel = async (Model, data) => {
    let res = { resp: false, msg: '' };
    const entityData = Model.sanitize(data);
    const model = new Model(entityData);
    await model.save()
        .then((entities) => {
            res.resp = true;
            res.msg = entities.plain();
        })
        .catch(err => { res.msg = err; })
    return res;
}

const updateModel = async (Model, data, id) => {
    let res = { resp: false, msg: '' };
    let modelId = Number(id);
    const entityData = Model.sanitize(data);
    await Model.update(modelId, entityData)
        .then((entities) => {
            res.resp = true;
            res.msg = entities.plain();
        })
        .catch(err => { res.msg = err; })
    return res;
}

const deleteModel = async (Model, id) => {
    let res = { resp: false, msg: 'No eliminado' };
    let modelId = Number(id);
    await Model.delete(modelId)
        .then((entities) => {
            if (entities.success) {
                res = { resp: true, msg: "Eliminado" }
            }
        })
        .catch(err => { res.msg = err; })
    return res;
}

const listModelsWithFilter = async (Model, filter) => {
    let res = { resp: false, msg: 'Sin resultados.' };
    await Model.list(filter)
        .populate()
        .then((entities) => {
            if (entities.entities.length > 0) {
                res.resp = true;
                res.msg = entities.entities;
            }
        })
        .catch(err => { res.msg = err; })
    return res;
}


//Exportar funciones
module.exports = {
    getModels,
    getModel,
    createModel,
    updateModel,
    deleteModel,
    listModelsWithFilter
};
