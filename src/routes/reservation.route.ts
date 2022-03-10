import express from "express";
import * as controller from "../controllers/reservation.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";

const router = express.Router();

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .get(controller.list)
    .post(controller.create);

router.route("/:reservationId")
    .get(controller.getById)
    .put(controller.updateById)
    .delete(controller.deleteById)

router.route("/:reservationId/participants")
    .post(controller.updateParticipants)

export default router;