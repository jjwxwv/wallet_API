import express from "express";
import {
  checkReqBodyforTransfer,
  transfer,
} from "../controllers/walletController";

const router = express.Router();

router.route("/:walletId/transaction").post(checkReqBodyforTransfer, transfer);

export { router as walletRouter };
