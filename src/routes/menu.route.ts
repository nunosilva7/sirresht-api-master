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




router.route("/:menuId")
    .get(controller.getById)
    .put(authController.verifyAdmin, controller.updateById)
    .delete(authController.verifyAdmin, controller.deleteById);

export default router;