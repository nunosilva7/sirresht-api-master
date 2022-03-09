import express from "express";
import * as controller from "../controllers/dish.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";
import * as authController from "../controllers/auth.controller"


const router = express.Router();

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .get(controller.list)
    .post(authController.verifyAdmin,controller.create);

router.route("/:dishId")
    .get(controller.getById)
    .put(authController.verifyAdmin,controller.updateById)
    .delete(authController.verifyAdmin,controller.deleteById);

export default router;