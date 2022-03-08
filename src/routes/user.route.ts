import express from "express";
import * as controller from "../controllers/user.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";

const router = express.Router();

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/")
    .get(controller.list)

router.route("/:userId")
    .get(controller.getById)
    .put(controller.updateById)
    .delete(controller.deleteById);

router.route("/:userId/avatar")
    .patch(controller.updateAvatarById);

export default router;