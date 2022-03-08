import { CustomValidator } from "express-validator";

/**
 * Check if every element of the array is a valid ID
 * @param ids The list of IDs
 * @returns A tuple with the result and index of the error
 */
const checkIdArray = (ids: string[]) => {
    const regex = /^([1-9]\d{0,9})$/;
    for (let i = 0; i < ids.length; i++) {
        if (!regex.test(ids[i]))
            return [false, i];
    }
    return [true, null];
}

const isIdArray: CustomValidator = value => {
    const ids = value.split(",");
    if (ids.length === 0)
        return Promise.reject("Empty ID array");

    const [check, index] = checkIdArray(ids);
    if (!check)
        return Promise.reject(`Invalid ID format at index ${index}`);
    
    return true;
};

export default isIdArray;
export { checkIdArray };