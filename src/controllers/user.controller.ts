import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { isIdArray } from "../custom-validators";
import sequelize, { Op } from "../sequelize";



/**
 * Search for users
 * @route GET /api/v1/users
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await query("page", "Page cannot be less than 1").optional().isInt({ min: 1 }).run(req);
    await query("pageSize", "Page size cannot be less than 1").optional().isInt({ min: 1 }).run(req);
    await query("ids", "User ids cannot be empty or less than 1").optional().custom(isIdArray).run(req);
    await query("firstName", "First name cannot be empty").optional().not().isEmpty().trim().escape().run(req);
    await query("lastName", "Last name cannot be empty").optional().not().isEmpty().trim().escape().run(req);
    await query("email", "Email is missing or is not a valid email address").optional().trim().escape().isEmail().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    const page = req.query.page ? +req.query.page : undefined;
    const pageSize = req.query.pageSize ? +req.query.pageSize : undefined;
    const ids = req.query.ids as string[];
    const firstName = req.query.firstName;
    const lastName = req.query.lastName;
    const email = req.query.email as string;

    try {
        const users = await sequelize.models.user.findAll({
            attributes: { exclude: ["roleId", "hashedPassword", "createdAt", "updatedAt", "deletedAt"] },
            limit: page && pageSize,
            offset: page && pageSize && (page - 1) * pageSize,
            ...(ids && {
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            }),
            ...((firstName || lastName) && {
                where: {
                    [Op.or]: [
                        {
                            firstName: {
                                [Op.like]: `%${firstName || ''}%`
                            }
                        },
                        {
                            lastName: {
                                [Op.like]: `%${lastName || ''}%`
                            }
                        }
                    ]
                },
            }),
            ...(email && {
                where: {
                    email: {
                        [Op.like]: `${email}`
                    }
                },
                limit: 1
            }),
            include: sequelize.models.role
        });

        res.status(200).json(users);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Search for a user by its id
 * @route GET /api/v1/users/:userId
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("userId", "User id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const user = await sequelize.models.user.findByPk(req.params.userId, {
            attributes: { exclude: ["roleId", "hashedPassword", "createdAt", "updatedAt", "deletedAt"] },
            include: sequelize.models.role
        });

        if (!user) {
            next({ status: 404, message: `User with id ${req.params.userId} not found` });
            return;
        }

        res.status(200).json(user);
    }
    catch (err) {
        next(err);
    }
}
/**
 * Search for a user by its email
 * @route GET /api/v1/users/:userEmail
 */

export const getByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await query("userEmail", "First name cannot be empty").optional().not().isEmpty().trim().escape().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const user = await sequelize.models.user.findOne({
            where:{email:req.params.userEmail},
            attributes: { exclude: ["roleId", "hashedPassword", "createdAt", "updatedAt", "deletedAt"] },
          
        });

        if (!user) {
            next({ status: 404, message: `User with id ${req.params.userEmail} not found` });
            return;
        }

        res.status(200).json(user);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Update a user by its id
 * @route PUT /api/v1/users/:userId
 */
export const updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("userId", "Dish id cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("firstName", "First name is missing or cannot be empty").not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);
    await body("lastName", "Last name is missing or cannot be empty").not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const [affectedRows] = await sequelize.models.user.update({
            firstName: req.body.firstName,
            lastName: req.body.lastName
        }, {
            where: {
                id: req.params.userId
            }
        });
        
        if (!affectedRows) {
            next({ status: 404, message: `User with id ${req.params.userId} not found` });
            return;
        }
        
        res.status(200).send({ message: `User with id ${req.params.userId} UPDATED!` });
        
      
    }
    catch (err) {
        next(err);
    }
}

/**
 * Delete a user by its id
 * @route DELETE /api/v1/users/:userId
 */
export const deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("userId", "User id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const destroyedRows = await sequelize.models.user.destroy({
            where: {
                id: req.params.userId
            },
            force:true //hard-delete user
        });
        
        if (!destroyedRows) {
            next({ status: 404, message: `User with id ${req.params.userId} not found` });
            return;
        }

        res.status(200).send(`User with id ${req.params.userId} DELETED!`);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Update the reference to the user's avatar
 * @route PATCH /api/v1/users/:userId/avatar
 */
export const updateAvatarById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("userId", "User id cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("avatarReference", "Invalid reference").not().isEmpty().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const [affectedRows] = await sequelize.models.user.update({
            avatarReference: req.body.avatarReference
        }, {
            where: {
                id: req.params.userId
            }
        });
        
        if (!affectedRows) {
            next({ status: 404, message: `User with id ${req.params.userId} not found` });
            return;
        }

        res.status(200).send(`User with id ${req.params.userId} UPDATED!`);
    }
    catch (err) {
        next(err);
    }
}




