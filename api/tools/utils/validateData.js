/**
 * @version 2.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 * @description Script para declarar funciones de validación
 */

/**
* @function validateImagePNG
* @param {String} type Tipo de archivo que se desea subir
* @description Valida si el tipo del archivo es png
*/
const validateImagePNG = (type) => {
    return (type === 'png');
}

/**
 * @function validateImageType
 * @param {String} type Tipo de archivo que se desea subir
 * @description Valida si el tipo del archivo es png, jpg/jpeg
 */
const validateImageType = (type) => {
    return (type === 'png' || type === 'jpg' || type === 'jpeg');
}

/**
 * @function isEmpty
 * @param {String} data Dato que se desea validar
 * @description Valida si un dato no es vacio
 */
const isEmpty = (data) => {
    return (data === '' || data === undefined);
}

/**
 * @function isOnlyNumbers
 * @param {String} data Dato que se desea validar
 * @description Validar si una cadena contiene solo números
 */
const isOnlyNumbers = (data) => {
    let regex = /^([0-9])*$/;
    return regex.test(data);
}

/**
 * @function validateFilter
 * @param {String} options Opciones del filtro
 * @description Valida que campos se envian para el filtro
 */
const validateFilter = (options) => {
    let filter = { filters: [] };
    // Valida si se filtra por categoría
    if (options.category !== undefined && options.category !== "") {
        filter.filters.push(['category', options.category]);
    }
    // Valida si se filtra por línea
    if (options.line !== undefined && options.line !== "") {
        filter.filters.push(['line', options.line]);
    }
    // Valida si se filtra por marca
    if (options.brand !== undefined && options.brand !== "") {
        filter.filters.push(['brand', options.brand]);
    }
    // Valida si se filtra por gtin
    if (options.gtin !== undefined && options.gtin !== "") {
        filter.filters.push(['gtin', options.gtin]);
    }
    // Valida si se filtra por codigo SAP
    if (options.codSap !== undefined && options.codSap !== "") {
        filter.filters.push(['codSap', options.codSap]);
    }
    return filter;
}

/**
 * @function validateGreaterThan
 * @param {String} initialDate Fecha inicial
 * @param {String} finalDate Fecha final
 * @description Validar si fecha inicial es menor a fecha final
 */
const validateGreaterThan = (initialDate, finalDate) => {
    let valuesStart = initialDate.split('/');
    let valuesEnd = finalDate.split('/');
    let dateStart = new Date(valuesStart[2], (valuesStart[0] - 1), valuesStart[1]);
    let dateEnd = new Date(valuesEnd[2], (valuesEnd[0] - 1), valuesEnd[1]);
    if (dateEnd > dateStart) return true;
    return false;
}

/**
 * @function validateDateDMY
 * @param {String} date Fecha para validar
 * @description Validar si una fecha tiene el formato m/d/y
 */
const validateDateDMY = (date) => {
    try {
        let dateDMY = date.split('/');
        if (dateDMY.length !== 3) return false;
        if (dateDMY[0].length !== 2) return false;
        if (dateDMY[1].length !== 2) return false;
        if (dateDMY[2].length !== 4) return false;
        if (!isOnlyNumbers(dateDMY[0]) || !isOnlyNumbers(dateDMY[1]) || !isOnlyNumbers(dateDMY[2])) return false;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = {
    validateImageName,
    validateImagePNG,
    validateImageType,
    validateRoute,
    isEmpty,
    isOnlyNumbers,
    validateFilter,
    validateGreaterThan,
    validateDateDMY
}
