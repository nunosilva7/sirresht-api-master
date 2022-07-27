import express from "express";
import * as controller from "../controllers/menu.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";
import * as authController from "../controllers/auth.controller"

const router = express.Router();

router.route("/")
    .get(controller.list)

router.route("/nextMenu")
    .get(controller.getLastById);

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .post(authController.verifyAdmin, controller.create)

router.route("/menuDish")
    .get(authController.verifyAdmin, controller.menuDish)

router.route("/menuDish/:id")
    .get(authController.verifyAdmin, controller.menuDishById)

router.route("/menuDish/:id/dish/:dishId")
    .put(authController.verifyAdmin, controller.decrementMenuDishQuantity)
    




router.route("/:menuId")
    .get(controller.getById)
    .put(authController.verifyAdmin, controller.updateById)
    .delete(authController.verifyAdmin, controller.deleteById);

router.route("/:menuId/reservations")
    .put(authController.verifyAdmin, controller.decrementMenuOpenReservations)

export default router;