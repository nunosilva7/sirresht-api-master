import express from "express";
import * as controller from "../controllers/auth.controller";
import authenticateJwt from "../middleware/auth/authenticateJwt";

const router = express.Router();

router.route("/signUp")
    .post(controller.signUp);

router.route("/signIn")
    .post(controller.signIn);

// require JWT authentication for the routes below
router.use(authenticateJwt);

router.route("/deleteAccount")
    .post(controller.deleteAccountById);

router.route("/updatePassword")
    .post(controller.updatePasswordByEmail);

router.route("/resetPassword")
    .post(controller.resetPasswordByEmail);

router.route("/validAccessToken/owner")
    .get(controller.getValidAccessTokenOwner);

export default router;