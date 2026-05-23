import { Router } from "express";
import { addToUserHistory, login, register, getUserHistory } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity/:userId").post(addToUserHistory);
router.route("/get_all_activity/:userId").get(getUserHistory);

export default router;