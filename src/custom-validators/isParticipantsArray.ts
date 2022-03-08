import { CustomValidator } from "express-validator";
import validator from "validator";
import { checkIdArray } from "./isIdArray";

const isParticipantsArray: CustomValidator = value => {
    const isArray = Array.isArray(value);
    if (!isArray)
        return Promise.reject("Not an array");
    if (value.length === 0)
        return Promise.reject("Empty participants array");

    for (let i = 0; i < value.length; i++) {
        if (
            // check if the element is not an object
            // (in Javascript an array, a function or 'null' are also objects,
            // so validate that the element is not any of those either)
            typeof value[i] !== "object" ||
            typeof value[i] === "function" ||
            Array.isArray(value[i]) ||
            value[i] === null
        ) {
            return Promise.reject(`Invalid participant at index ${i}`);
        }

        if (
            value[i].userId === undefined &&
            (typeof value[i].name !== "string" || typeof value[i].email !== "string")
        ) {
            return Promise.reject(`Invalid participant at index ${i}. Invalid name or email`);
        }

        if (
            (value[i].name === undefined || value[i].email === undefined) &&
            typeof value[i].userId !== "number"
        ) {
            return Promise.reject(`Invalid participant at index ${i}. Invalid user id`);
        }

        if (
            value[i].reservationPrice === undefined ||
            !validator.isFloat(value[i].reservationPrice, { min: 0 }) ||
            !validator.isDecimal(value[i].reservationPrice, { force_decimal: true, decimal_digits: "1,2" })
        ) {
            return Promise.reject(`Invalid participant at index ${i}. Invalid reservation price`);
        }

        if (value[i].dishesIds === undefined) {
            return Promise.reject(`Invalid participant at index ${i}. Missing dishes IDs array`);
        }

        const [check, index] = checkIdArray(value[i].dishesIds);
        if (!check) {
            return Promise.reject(`Invalid participant at index ${i}. Invalid dish ID at index ${index}`);
        }
    }
    
    return true;
};

export default isParticipantsArray;