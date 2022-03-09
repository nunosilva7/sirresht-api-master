import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import sequelize, { Op } from "../sequelize";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {RequestWithAuthentication} from "../middleware/auth/authenticateJwt";

const saltRounds = 10;

/**
 * Create a new user
 * @route POST /api/v1/auth/signup
 */
export const signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("firstName", "First name is missing or cannot be empty").not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);
    await body("lastName", "Last name is missing or cannot be empty").not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);
    await body("email", "Email is missing or is not a valid email address").trim().escape().isEmail().run(req);
    await body("password", "Password is missing or is too weak").isStrongPassword().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const emailFound = await sequelize.models.user.findOne({
            where: {
                email: {
                    [Op.eq]: req.body.email
                }
            }
        });

        if (emailFound !== null)
            next({ status: 422, message: `Email already taken` });

        const newUser = await sequelize.models.user.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            hashedPassword: await bcrypt.hash(req.body.password, saltRounds)
        });

        // @ts-ignore
        res.status(201).json({ location: `/api/v1/users/${newUser.id}` });
    }
    catch (err) {
        next(err);
    }
}

/**
 * Authenticate an existing user
 * @route POST /api/v1/auth/signin
 */
export const signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("email", "Email is missing or is not a valid email address").trim().escape().isEmail().run(req);
    await body("password", "Password is missing or is too weak").isStrongPassword().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const user = await sequelize.models.user.findOne({
            where: {
                email: req.body.email,
            },
            include: sequelize.models.role
        });

        if (!user) {
            next({ status: 401, message: `Authentication failed` });
            return;
        }

        // @ts-ignore
        const passwordsMatch = await bcrypt.compare(req.body.password, user.hashedPassword);
        
        if (passwordsMatch) {
            // @ts-ignore
            const accessToken = jwt.sign({ userId: user.id, role: user.role.desc}, process.env.ACCESS_TOKEN_SECRET)
            res.status(200).json({ accessToken: accessToken });
        }
        else {
            next({ status: 401, message: `Authentication failed` });
        }
    }
    catch (err) {
        next(err);
    }
}

/**
 * Search for the owner of a valid access token
 * @route POST /api/v1/auth/validAccessToken/owner
 */
 export const getValidAccessTokenOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await sequelize.models.user.findByPk((req as RequestWithAuthentication).userId, {
            attributes: { exclude: ["roleId", "hashedPassword", "createdAt", "updatedAt", "deletedAt"] },
            include: sequelize.models.role
        });

        if (!user) {
            next({ status: 404, message: `Owner of access token not found: ${req.headers.authorization}` });
            return;
        }

        res.status(200).json(user);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Delete a user by its id
 * @route POST /api/v1/auth/deleteAccount
 */
export const deleteAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    //await body("id", "User id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const destroyedRows = await sequelize.models.user.destroy({
            where: {
                id: (req as RequestWithAuthentication).userId
            }
        });
        
        if (!destroyedRows) {
            next({ status: 404, message: `User with id ${req.body.id} not found` });
            return;
        }

        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}

/**
 * Update the user's password
 * @route POST /api/v1/auth/updatePassword
 */
export const updatePasswordByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("email", "Email is missing or is not a valid email address").trim().escape().isEmail().run(req);
    await body("password", "Password is missing or is too weak").isStrongPassword().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const [affectedRows] = await sequelize.models.user.update({
            hashedPassword: await bcrypt.hash(req.body.password, saltRounds)
        }, {
            where: {
                email: req.body.email
            }
        });
        
        if (!affectedRows) {
            next({ status: 404, message: `User with email ${req.body.email} not found` });
            return;
        }

        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}

/**
 * Send an email for password recovery
 * @route POST /api/v1/auth/resetPassword
 */
export const resetPasswordByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("email", "Email is missing or is not a valid email address").trim().escape().isEmail().run(req);
    await body("password", "Password is missing or is too weak").isStrongPassword().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
    }
    catch (err) {
        next(err);
    }
}

export const verifyAdmin = async(req:Request, res:Response, next:NextFunction): Promise<void> =>{
    let role = (req as RequestWithAuthentication).role
    if(!role){
        next({ status: 404, message: `No Token provided!` });
        return;
    }
    else if(role!="admin"){
        next({ status: 403, message: `You are not admin` });
        return;
       
    }
    else{
        console.log(role)
        next();
    }
    
    
}
