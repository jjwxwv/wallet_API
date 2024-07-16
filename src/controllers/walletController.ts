import { NextFunction, Request, Response } from "express";
import { Wallet } from "../entities/Wallet";
import { CryptocurrencyWallet } from "../entities/CryptocurrencyWallet";
import { FindOptionsWhere } from "typeorm";
import { Cryptocurrencies } from "../entities/Cryptocurrencies";
import { appDataSource } from "../index";

export const checkReqBodyforTransfer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { walletId } = req.params;
  const { destWalletId, cryptoId, transferedToCryptoId, amount } = req.body;
  if (!destWalletId || !cryptoId || !transferedToCryptoId || !amount) {
    return res.status(400).json({
      message: "missing some inut value or amount must greater than 0",
    });
  } else if (Number(walletId) === destWalletId) {
    return res.status(400).json({
      message: "Destination wallet ID must not same as your wallet ID",
    });
  }
  return next();
};

export const transfer = async (req: Request, res: Response) => {
  const { walletId } = req.params;
  const { destWalletId, cryptoId, transferedToCryptoId, amount } = req.body;
  const cryptoWalletQuery: FindOptionsWhere<CryptocurrencyWallet> = {};
  cryptoWalletQuery.wallet = { id: Number(walletId) };
  cryptoWalletQuery.crypto = { id: Number(cryptoId) };
  const destCryptoWalletQuery: FindOptionsWhere<CryptocurrencyWallet> = {};
  destCryptoWalletQuery.wallet = { id: Number(destWalletId) };
  destCryptoWalletQuery.crypto = { id: Number(transferedToCryptoId) };
  try {
    await appDataSource.transaction("SERIALIZABLE", async (te) => {
      const [destWallet, myCrypto, destCrypto, myCryptoWallet] =
        await Promise.all([
          te.findOneBy(Wallet, { id: Number(destWalletId) }),
          te.findOneByOrFail(Cryptocurrencies, { id: Number(cryptoId) }),
          te.findOneByOrFail(Cryptocurrencies, {
            id: Number(transferedToCryptoId),
          }),
          te.findOneByOrFail(CryptocurrencyWallet, cryptoWalletQuery),
        ]);
      if (!destWallet) throw new Error("Destination Wallet not found");
      //calculate rate
      const rate = myCrypto.price / destCrypto.price;
      const amountToTransfer = amount * rate;

      // decrease owner crypto value
      if (myCryptoWallet.balance < Number(amount)) {
        throw new Error("You don't have enough balance");
      }
      myCryptoWallet.balance -= Number(amount);
      await te.save(myCryptoWallet);
      if (myCryptoWallet.balance === 0) {
        await te.delete(CryptocurrencyWallet, { id: myCryptoWallet.id });
      }

      //increase destination crypto value
      let destCryptoWallet = await te.findOneBy(
        CryptocurrencyWallet,
        destCryptoWalletQuery
      );
      if (destCryptoWallet) {
        destCryptoWallet.balance =
          amountToTransfer + Number(destCryptoWallet.balance);
      } else {
        destCryptoWallet = new CryptocurrencyWallet();
        destCryptoWallet.balance = amountToTransfer;
        destCryptoWallet.crypto = destCrypto;
        destCryptoWallet.wallet = destWallet;
      }
      await te.save(destCryptoWallet);
    });
    return res.status(201).json({ message: "Transaction success!" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
