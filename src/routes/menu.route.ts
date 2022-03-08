import express from "express";
import * as controller from "../controllers/menu.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";

const router = express.Router();

router.route("/")
    .get(controller.list)

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .post(controller.create);

router.route("/:menuId")
    .get(controller.getById)
    .put(controller.updateById)
    .delete(controller.deleteById);

export default router;