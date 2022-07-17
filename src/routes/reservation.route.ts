import express from "express";
import * as controller from "../controllers/reservation.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";
import * as authController from "../controllers/auth.controller"

const router = express.Router();

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .get(authController.verifyAdmin, controller.list)
    .post(controller.create);


router.route("/nextReservation/:userId")
    .get(controller.getLastById);

router.route("/userReservations/:userId")
    .get(controller.getAllByUserId);


router.route("/:reservationId")
    .get(controller.getById)
    .put(controller.updateById)
    .delete(controller.deleteById)

router.route("/:reservationId/participants")
    .post(controller.updateParticipants)




export default router;