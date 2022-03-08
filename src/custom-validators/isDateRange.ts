import { CustomValidator } from "express-validator";

const isBetween: CustomValidator = value => {
    const range = value.split(",");
    if (range.length !== 2)
        return Promise.reject("Invalid range format");

    const regex = /^(20[2-9][1-9]|2[1-9]\d\d)-(0[1-9]|1[0-2])-(0[1-9]|1\d|2\d|3[0-1])$/;
    for (const element of range) {
        if (!regex.test(element))
            return Promise.reject("Invalid date format");
    }

    if (range[0] > range[1])
        return Promise.reject("Invalid range");
    
    return true;
};

export default isBetween;