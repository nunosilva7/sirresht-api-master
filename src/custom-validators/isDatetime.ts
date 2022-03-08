import { CustomValidator } from "express-validator";

const isDatetime: CustomValidator = value => {
    const regex = /^(20[2-9][1-9]|2[1-9]\d\d)-(0[1-9]|1[0-2])-(0[1-9]|1\d|2\d|3[0-1]) (0\d|1\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(value))
        return Promise.reject("Invalid date format");
    
    return true;
};

export default isDatetime;