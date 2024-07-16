import express from "express";
import {
  addNewCryptoData,
  checkReqBody,
  checkReqBodyForCrypto,
  editCryptoData,
  editCryptoInWallet,
  getAllWallet,
  getWallet,
  restrictTo,
} from "../controllers/adminController";

const router = express.Router();

router.param("userId", restrictTo("admin"));

router.route("/:userId/wallet").get(getAllWallet);

router
  .route("/:userId/wallet/:walletId")
  .get(getWallet)
  .put(checkReqBody, editCryptoInWallet);

router.route("/:userId/crypto").post(checkReqBodyForCrypto, addNewCryptoData);
router
  .route("/:userId/crypto/:cryptoId")
  .put(checkReqBodyForCrypto, editCryptoData);

export { router as adminRouter };
