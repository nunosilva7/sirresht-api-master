import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { isDatetime, isParticipantsArray } from "../custom-validators";
import sequelize, { Op } from "../sequelize";
import reservationStatusModel from "../sequelize/models/reservationStatus.model";

/**
 * Search for reservations
 * @route GET /api/v1/reservations
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await query("date", "Queried date is not valid").optional().isDate().run(req);
    await query("userId", "Queried user id cannot be less than 1").optional().isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    const date = (typeof req.query.date === "string") ? new Date(req.query.date) : undefined;

    try {
        const rows = await sequelize.models.reservation.findAll({
            attributes: { exclude: ["reservationStatusId", "statusId", "updatedAt", "deletedAt"] },
            ...(date && {
                where: {
                    startDate: {
                        [Op.lt]: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                        [Op.gte]: new Date(date)
                    }
                }
            }),
            include: [
                {
                    model: sequelize.models.reservationStatus,
                    as: 'status',
                    attributes: ["id", "desc"]
                },
                {
                    model: sequelize.models.participant,
                    as: 'participants',
                    attributes: { exclude: ["reservationId", "createdAt", "updatedAt", "deletedAt"] },
                    ...(req.query.userId && {
                        where: {
                            userId: {
                                [Op.eq]: +req.query.userId as any
                            }
                        }
                    }),
                    include: [
                        {
                            model: sequelize.models.dish,
                            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
                            through: {
                                attributes: []
                            }
                        },
                        {
                            model: sequelize.models.discount
                        },
                        {
                            
                                model: sequelize.models.user,
                                as: 'user',
                                attributes: ["avatarReference" ]
                            
                        }
                    ]
                }
            ]
        });

        res.status(200).json(rows);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Create a new reservation
 * @route POST /api/v1/reservation
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("startDate", "Start date is missing or is not a valid date").custom(isDatetime).run(req);
    await body("endDate", "End date is missing or is not a valid date").custom(isDatetime).run(req);
    await body("reservationPrice", "Reservation price is missing, is negative, or is not in a valid decimal format")
        .isFloat({ min: 0 }).isDecimal({ force_decimal: true, decimal_digits: "1,2" }).run(req);
    await body("message", "Message cannot be empty").optional().not().isEmpty({ ignore_whitespace: true }).trim().escape().run(req);
    await body("isTableCommunal", "The table being communal is missing or is not a boolean").isBoolean().run(req);
    await body("participants").custom(isParticipantsArray).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        await sequelize.transaction(async t => {
            const newReservation = await sequelize.models.reservation.create({
                ...(req.body.message && { message: req.body.message }),
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                reservationPrice: req.body.reservationPrice,
                isTableCommunal: req.body.isTableCommunal
            }, {
                transaction: t
            });
            for (const p of req.body.participants) {
                const newParticipant = await sequelize.models.participant.create({
                    ...(p.userId && { userId: p.userId }),
                    ...(p.userId && {
                        name: p.name,
                        email: p.email,
                    }),
                    ...(p.discountId && { discountId: p.discountId }),
                    reservationPrice: p.reservationPrice
                }, {
                    transaction: t
                });
                // @ts-ignore
                await newParticipant.addDishes(p.dishesIds, {
                    transaction: t
                });
                // @ts-ignore
                await newReservation.addParticipant(newParticipant, {
                    transaction: t
                });
            };

            t.afterCommit(() => {
                // @ts-ignore
                res.status(201).json({ location: `/api/v1/reservations/${newReservation.id}` });
            });
        });
    }
    catch (err) {
        next(err);
    }
}

/**
 * Search for a reservation by its id
 * @route GET /api/v1/reservations/:reservationId
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("reservationId", "Reservation id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const reservation = await sequelize.models.reservation.findByPk(req.params.reservationId, {
            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
            include: [
                {
                    model: sequelize.models.reservationStatus,
                    as: 'status',
                    attributes: ["id", "desc"]
                },
                {
                    model: sequelize.models.participant,
                    as: 'participants',
                    attributes: { exclude: ["reservationId", "createdAt", "updatedAt", "deletedAt"] },
                    include: [
                        {
                            model: sequelize.models.dish,
                            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
                            through: {
                                attributes: []
                            }
                        },
                        {
                            model: sequelize.models.discount
                        },
                        {
                            
                            model: sequelize.models.user,
                            as: 'user',
                            attributes: ["avatarReference" ]
                        
                    }
                    ]
                }
            ]
        });

        if (!reservation) {
            next({ status: 404, message: `Reservation with id ${req.params.reservationId} not found` });
            return;
        }

        res.status(200).json(reservation);
    }
    catch (err) {
        next(err);
    }
}

/**
 * Update a reservation status by its id
 * @route PUT /api/v1/reservations/:reservationId
 */
export const updateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("reservationId", "ReservationId  cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("statusId", "statusId  cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("reservationStatusId", "reservationStatusId  cannot be less than 1").isInt({ min: 1 }).run(req);
    
    

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const [affectedRows] = await sequelize.models.reservation.update({
            
            statusId: req.body.statusId,
            reservationStatusId: req.body.reservationStatusId,
           
        }, {
            where: {
                id: req.params.reservationId
            }
        });

        if (!affectedRows) {
            next({ status: 404, message: `Reservation with id ${req.params.reservationId} not found` });
            return;
        }

        res.status(200).send({ message: `Reservation with id ${req.params.reservationId} UPDATED!` });
    }
    catch (err) {
        next(err);
    }
}
/**
 * Increment supplements of a rerservation
 * @route PUT api/v1/reservations/:reservationId
 */

 export const incrementSupplements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("reservationId", "ReservationId  cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("supplements", "supplements is missing, is negative, or is not in a valid decimal format").isFloat({ min: 0 })
    .isDecimal({ force_decimal: true, decimal_digits: "1,2" }).run(req);
   
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }
   
    
    try {
        const affectedRows = await sequelize.models.reservation.update({
            
            supplementsPrice: req.body.supplements
            
        },{
            where:{
                id: req.params.reservationId
            }
        });
          
        if (affectedRows==null) {
          
            next({ status: 404, message: `Reservation with id ${req.params.reservationId} not found` });
            return;
        }
        
        res.status(200).send({ message: `Reservation with id ${req.params.reservationId} UPDATED!` });
    }
    catch (err) {
        next(err);
    }
}

export const payment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("reservationId", "ReservationId  cannot be less than 1").isInt({ min: 1 }).run(req);
    await param("participantId", "participantId  cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("amountPaid", "supplements is missing, is negative, or is not in a valid decimal format").isFloat({ min: 0 })
    .isDecimal({ force_decimal: true, decimal_digits: "1,2" }).run(req);
   
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }
   
    
    try {
        const affectedRows = await sequelize.models.participant.update({
            
            amountPaid: req.body.amountPaid
            
        },{
            where:{
                id: req.params.participantId
            }
        });
         await sequelize.models.reservation.increment("amountReceived",{by: req.body.amountPaid, where:{id:req.params.reservationId}})
          
        if (affectedRows==null ) {
          
            next({ status: 404, message: `Reservation with id ${req.params.reservationId} not found` });
            return;
        }
        
        res.status(200).send({ message: `Reservation with id ${req.params.reservationId} UPDATED!` });
    }
    catch (err) {
        next(err);
    }
}




/**
 * Update the participants of a reservation
 * @route PATCH /api/v1/reservations/:reservationId/participants
 */
export const updateParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("reservationId", "Reservation id cannot be less than 1").isInt({ min: 1 }).run(req);
    await body("participants").custom(isParticipantsArray).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const reservation = await sequelize.models.reservation.findByPk(req.params.reservationId);

        if (!reservation) {
            next({ status: 404, message: `Reservation with id ${req.params.reservationId} not found` });
            return;
        }
        
      

        // @ts-ignore
        await reservation.setParticipants(participants);

        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}

/**
 * Delete a reservation by its id
 * @route DELETE /api/v1/reservations/:reservationId
 */
export const deleteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("reservationId", "Reservation id cannot be less than 1").isInt({ min: 1 }).run(req);

    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(422).json({ errors: result.array({ onlyFirstError: true }) });
        return;
    }

    try {
        const destroyedRows = await sequelize.models.reservation.destroy({
            where: {
                id: req.params.reservationId
            },

        });
        await sequelize.models.participant.destroy({
            where: {
                reservation_id: req.params.reservationId
            },

        })

        if (!destroyedRows) {
            next({ status: 404, message: `Reservation with id ${req.params.reservationId} not found` });
            return;
        }


        res.status(200).send({ message: `Reservation with id ${req.params.reservationId} DELETED!` });
    }
    catch (err) {
        next(err);
    }
}

export const getLastById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("userId", "Dish id cannot be less than 1").isInt({ min: 1 }).run(req);
    try {
        const reservation = await sequelize.models.reservation.findOne({
            order: [['id', 'DESC']],
            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
            include: [
                {
                    model: sequelize.models.reservationStatus,
                    as: 'status',
                    attributes: ["id", "desc"]
                },
                {
                    model: sequelize.models.participant,
                   where: { userId: req.params.userId },
                    as: 'participants',
                    attributes: { exclude: ["reservationId", "createdAt", "updatedAt", "deletedAt"] },
                    include: [
                        {
                            model: sequelize.models.dish,
                            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
                            through: {
                                attributes: []
                            }
                        },
                        {
                            model: sequelize.models.discount
                        }
                    ]
                }
            ]
        });
        



        res.status(200).json(reservation);
    }
    catch (err) {
        next(err);
    }
}

export const getAllByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await param("userId", "Dish id cannot be less than 1").isInt({ min: 1 }).run(req);
    try {
        const reservation = await sequelize.models.reservation.findAll({
            order: [['id', 'DESC']],
            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
            include: [
                {
                    model: sequelize.models.reservationStatus,
                    as: 'status',
                    attributes: ["id", "desc"]
                },
                {
                    model: sequelize.models.participant,
                    where: { userId: req.params.userId },
                    as: 'participants',
                    attributes: { exclude: ["reservationId", "createdAt", "updatedAt", "deletedAt"] },
                    include: [
                        {
                            model: sequelize.models.dish,
                            attributes: { exclude: ["createdAt", "updatedAt", "deletedAt"] },
                            through: {
                                attributes: []
                            }
                        },
                        {
                            model: sequelize.models.discount
                        }
                    ]
                }
            ]
        });


        res.status(200).json(reservation);
    }
    catch (err) {
        next(err);
    }
}