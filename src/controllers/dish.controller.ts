import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { OrderItem } from "sequelize/types";
import sequelize, { Op } from "../sequelize";

/**
 * Search for dishes
 * @route GET /api/v1/dishes
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await query("page", "Page cannot be less than 1").optional().isInt({ min: 1 }).run(req);
    await query("pageSize", "Page size cannot be less than 1").optional().isInt({ min: 1 }).run(req);
    await query("name", "Name cannot be empty").optional().not().isEmpty().trim().escape().run(req);
    await query("order", "Order must be one of: 'asc'; 'desc'; 'newest'; 'oldest'")
        .optional().isIn(["asc", "desc", "newest", "oldest"]).run(req);
    await query("course", "Course must be one of: 'starter'; 'main'; 'dessert'")
        .optional().isIn(["starter", "main", "dessert"]).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    const page = req.query.page ? +req.query.page : undefined;
    const pageSize = req.query.pageSize ? +req.query.pageSize : undefined;
    const name = req.query.name;
    const order = req.query.order;
    const course = req.query.course;

    try {
        const rowsAndCount = await sequelize.models.dish.findAndCountAll({
            attributes: { exclude: ["courseId", "createdAt", "updatedAt", "deletedAt"] },
            limit: page && pageSize,
            offset: page && pageSize && (page - 1) * pageSize,
            ...(name && {
                where: {
                    name: {
                        [Op.like]: `%${name}%`
                    }
                }
            }),
            order: [
                ((): OrderItem => {
                    switch (order) {
                        case 'asc':
                            return ["name", "ASC"]
                        case 'desc':
                            return ["name", "DESC"]
                        case 'newest':
                            return ["createdAt", "DESC"]
                        case 'oldest':
                            return ["createdAt", "ASC"]
                        default:
                            return ["name", "ASC"]
                    }
                })()
            ],
            include: [{
                model: sequelize.models.course,
                attributes: ["id", "name"],
                ...(course && {
                    where: {
                        name: {
                            [Op.like]: `${course}`
                        }
                    }
                })
            }]
        });

        res.status(200).json({
            rows: rowsAndCount.rows,
            totalPages: (pageSize && Math.ceil(rowsAndCount.count / pageSize)) || 1
        });
    }
    catch (err) {
        next(err);
    }
}

/**
 * Create a new dish
 * @route POST /api/v1/dishes
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("name", "Name is missing or cannot be empty").not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);
    await body("courseId", "Course id is missing or does not match any existing courses").isIn(["1", "2", "3"]).run(req);
    await body("isALaCarte", "Being à la carte is missing or is not a boolean").isBoolean().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const newDish = await sequelize.models.dish.create({
            name: req.body.name,
            courseId: req.body.courseId,
            isALaCarte: req.body.isALaCarte
        });

        // @ts-ignore
        res.status(201).json({ location: `/api/v1/dishes/${newDish.id}` });
    }
    catch (err) {
        next(err);
    }
}

/**
 * Search for a dish by its id
 * @route GET /api/v1/dishes/:dishId
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("dishId", "Dish id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const dish = await sequelize.models.dish.findByPk(req.params.dishId, {
            attributes: { exclude: ["courseId", "createdAt", "updatedAt", "deletedAt"] },
            include: {
                model: sequelize.models.course,
                attributes: ["id", "name"]
            }
        });

        if (!dish) {
            next({ status: 404, message: `Dish with id ${req.params.dishId} not found` });
            return;
        }

        res.status(200).json(dish);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Update a dish by its id, or create a new dish based on the old one
 * @route PUT /api/v1/dishes/:dishId
 * 
 * @todo create a new dish if the current one is/was already part of a Menu
 */
export const updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("dishId", "Dish id cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("name", "Name is missing or cannot be empty").not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);
    await body("courseId", "Course id is missing or does not match any existing courses").isIn(["1", "2", "3"]).run(req);
    await body("isALaCarte", "Being à la carte is missing or is not a boolean").isBoolean().run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const [affectedRows] = await sequelize.models.dish.update({
            name: req.body.name,
            courseId: req.body.courseId,
            isALaCarte: req.body.isALaCarte
        }, {
            where: {
                id: req.params.dishId
            }
        });
        
        if (!affectedRows) {
            next({ status: 404, message: `Dish with id ${req.params.dishId} not found` });
            return;
        }

        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}

/**
 * Delete a dish by its id
 * @route DELETE /api/v1/dishes/:dishId
 */
export const deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("dishId", "Dish id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const destroyedRows = await sequelize.models.dish.destroy({
            where: {
                id: req.params.dishId
            }
        });
        
        if (!destroyedRows) {
            next({ status: 404, message: `Dish with id ${req.params.dishId} not found` });
            return;
        }

        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}