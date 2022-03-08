import express from "express";
import * as controller from "../controllers/dish.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";
import * as authController from "../controllers/auth.controller"


const router = express.Router();

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .get(authController.verifyAdmin,controller.list)
    .post(controller.create);

router.route("/:dishId")
    .get(controller.getById)
    .put(controller.updateById)
    .delete(controller.deleteById);

export default router;