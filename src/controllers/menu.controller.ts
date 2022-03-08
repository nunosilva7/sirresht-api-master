import { Request, Response, NextFunction, raw } from "express";
import { body, param, query, validationResult } from "express-validator";
import { isDatetime, isDateRange } from "../custom-validators";
import sequelize, { Op } from "../sequelize";

/**
 * Search for menus
 * @route GET /api/v1/menus
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await query("date", "Queried date is not valid").optional().isDate().run(req);
    await query("between", "Queried range is not valid").optional().custom(isDateRange).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    // convert query params to JS date objects
    const date = (typeof req.query.date === "string") ? new Date(req.query.date) : undefined;
    const between = (() => {
        if (typeof req.query.between !== "string")
            return undefined;
        
        const range = req.query.between.split(",");
        return [new Date(range[0]), new Date(range[1])]
    })();

    try {
        const rows = await sequelize.models.menu.findAll({
            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
            ...(date && {
                where: {
                    startDate: {
                        [Op.lt]: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                        [Op.gte]: new Date(date)
                    }
                }
            }),
            ...(between && !date && {
                where: {
                    startDate: {
                        [Op.lt]: new Date(between[1].getTime() + 24 * 60 * 60 * 1000),
                        [Op.gte]: new Date(between[0])
                    }
                }
            }),
            include: {
                model: sequelize.models.dish,
                attributes: { exclude: ["courseId", "createdAt", "updatedAt", "deletedAt"] },
                include: {
                    // @ts-ignore
                    model: sequelize.models.course,
                    attributes: ["id", "name"]
                },
                through: {
                    attributes: ["dishQuantity"]
                }
            }
        });

        res.status(200).json(rows);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Create a new menu
 * @route POST /api/v1/menus
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("startDate", "Start date is missing or is not a valid date").custom(isDatetime).run(req);
    await body("endDate", "End date is missing or is not a valid date").custom(isDatetime).run(req);
    await body("price", "Price is missing, is negative, or is not in a valid decimal format").isFloat({ min: 0 })
        .isDecimal({ force_decimal: true, decimal_digits: "1,2" }).run(req);
    await body("openReservations", "Open reservations is missing or is not an integer between 1 and 99")
        .isInt({ min: 1, max: 99 }).run(req);
    // await body("dishes", "(to do)").run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        await sequelize.transaction(async t => {
            const newMenu = await sequelize.models.menu.create({
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                price: req.body.price,
                openReservations: req.body.openReservations
            }, {
                transaction: t
            });

            for (const dish of req.body.dishes) {
                const {id, menuDish} = dish;
                // @ts-ignore
                await newMenu.addDish(id, {
                    through: {
                        dishQuantity: menuDish.dishQuantity,
                    },
                    transaction: t
                });
            }

            t.afterCommit(() => {
                // @ts-ignore
                res.status(201).json({ location: `/api/v1/menus/${newMenu.id}` });
            });
        });
    }
    catch (err) {
        next(err);
    }
}

/**
 * Search for a menu by its id
 * @route GET /api/v1/menus/:menuId
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("menuId", "Menu id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const menu = await sequelize.models.menu.findByPk(req.params.menuId, {
            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
            include: {
                model: sequelize.models.dish,
                attributes: { exclude: ["courseId", "createdAt", "updatedAt", "deletedAt"] },
                include: {
                    // @ts-ignore
                    model: sequelize.models.course,
                    attributes: ["id", "name"]
                },
                through: {
                    attributes: ["dishQuantity"]
                }
            }
        });

        if (!menu) {
            next({ status: 404, message: `Menu with id ${req.params.menuId} not found` });
            return;
        }

        res.status(200).json(menu);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Update a menu by its id
 * @route PUT /api/v1/menus/:menuId
 */
export const updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("menuId", "Menu id cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("startDate", "Start date is missing or is not a valid date").custom(isDatetime).run(req);
    await body("endDate", "End date is missing or is not a valid date").custom(isDatetime).run(req);
    await body("price", "Price is missing, is negative, or is not in a valid decimal format").isFloat({ min: 0 })
        .isDecimal({ force_decimal: true, decimal_digits: "1,2" }).run(req);
    await body("openReservations", "Open reservations is missing or is not an integer between 1 and 99")
        .isInt({ min: 1, max: 99 }).run(req);
    // await body("dishes", "(to do)").run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        await sequelize.transaction(async t => {
            const [affectedRows] = await sequelize.models.menu.update({
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                price: req.body.price,
                openReservations: req.body.openReservations
            }, {
                where: {
                    id: req.params.menuId
                },
                transaction: t
            });

            if (!affectedRows) {
                throw { status: 404, message: `Menu with id ${req.params.menuId} not found` };
            }

            const menu = await sequelize.models.menu.findByPk(req.params.menuId, { transaction: t });
            // @ts-ignore
            await menu.setDishes([], { transaction: t });

            for (const dish of req.body.dishes) {
                const {id, menuDish} = dish;
                // @ts-ignore
                await menu.addDish(id, {
                    through: {
                        dishQuantity: menuDish.dishQuantity,
                    },
                    transaction: t
                });
            }

            t.afterCommit(() => {
                res.status(204).end();
            });
        });
    }
    catch (err) {
        next(err);
    }
}

/**
 * Delete a menu by its id
 * @route DELETE /api/v1/menus/:menuId
 */
export const deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("menuId", "Menu id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const destroyedRows = await sequelize.models.menu.destroy({
            where: {
                id: req.params.menuId
            }
        });

        if (!destroyedRows) {
            next({ status: 404, message: `Menu with id ${req.params.menuId} not found` });
            return;
        }

        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}