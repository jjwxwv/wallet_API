import { NextFunction, Request, Response } from "express";
import { Wallet } from "../entities/Wallet";
import { CryptocurrencyWallet } from "../entities/CryptocurrencyWallet";
import { Cryptocurrencies } from "../entities/Cryptocurrencies";
import { FindOptionsWhere } from "typeorm";
import { appDataSource } from "../index";
import { Users } from "../entities/Users";

export const restrictTo = (role: string) => {
  return async (_: Request, res: Response, next: NextFunction, id: number) => {
    try {
      const userType = (await Users.findOneByOrFail({ id })).role;
      if (!userType.includes(role)) {
        return res.status(403).json({
          message: "You don't have a permission ",
        });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

export const checkReqBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const haveCryptoId = req.body.cryptoId;
  const haveBalance = req.body.balance;
  if (haveBalance < 0) {
    return res.status(400).json({
      message: "Balance can't be negative",
    });
  } else if (!haveCryptoId || (!haveBalance && haveBalance != 0)) {
    return res.status(400).json({
      message: "Balance or cryptoId is missing",
    });
  }
  return next();
};

export const checkReqBodyForCrypto = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, symbol, priceUSD } = req.body;
  if (priceUSD < 0) {
    return res.status(400).json({
      message: "Price can't be negative",
    });
  } else if (!title || !symbol || !priceUSD) {
    return res.status(400).json({
      message: "some input value is missing",
    });
  }
  return next();
};

async function findWallet(query: FindOptionsWhere<Wallet>) {
  const wallet = await Wallet.find({
    where: query,
    select: {
      id: true,
      walletName: true,
    },
  });
  return wallet;
}

async function findCryptoWallet(query: FindOptionsWhere<CryptocurrencyWallet>) {
  const cryptoWallet = await CryptocurrencyWallet.find({
    where: query,
    select: {
      id: true,
      wallet: {
        id: true,
      },
      crypto: {
        title: true,
        symbol: true,
      },
      balance: true,
    },
    relations: {
      wallet: true,
      crypto: true,
    },
  });
  return cryptoWallet;
}

function getCrypto(id: string | number, arr: CryptocurrencyWallet[]) {
  return arr
    .filter((cw) => cw.wallet.id === Number(id))
    .map((cw) => ({
      title: cw.crypto.title,
      symbol: cw.crypto.symbol,
      balance: cw.balance,
    }));
}

export const getAllWallet = async (_: Request, res: Response) => {
  try {
    const wallet = await findWallet({});
    const cryptoWallet = await findCryptoWallet({});
    const response = wallet.map((w) => ({
      walletId: w.id,
      walletName: w.walletName,
      cryptocurrency: getCrypto(w.id, cryptoWallet),
    }));
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getWallet = async (req: Request, res: Response) => {
  const { _, walletId } = req.params;
  try {
    const wallet = await Wallet.findOneByOrFail({ id: Number(walletId) });
    const cryptoWallet = await findCryptoWallet({
      wallet: { id: Number(walletId) },
    });
    const filteredcw = getCrypto(walletId, cryptoWallet);
    const response = {
      walletId: wallet.id,
      walletName: wallet.walletName,
      cryptocurrency: filteredcw,
    };
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editCryptoInWallet = async (req: Request, res: Response) => {
  const { _, walletId } = req.params;
  const { cryptoId, balance } = req.body;
  const query: FindOptionsWhere<CryptocurrencyWallet> = {};
  query.wallet = { id: Number(walletId) };
  query.crypto = { id: Number(cryptoId) };
  try {
    await appDataSource.transaction("REPEATABLE READ", async (te) => {
      let cryptoWallet = await te.findOneBy(CryptocurrencyWallet, query);
      if (cryptoWallet) {
        cryptoWallet.balance = Number(balance);
      } else {
        const wallet = await te.findOneByOrFail(Wallet, {
          id: Number(walletId),
        });
        const crypto = await te.findOneByOrFail(Cryptocurrencies, {
          id: Number(cryptoId),
        });
        cryptoWallet = new CryptocurrencyWallet();
        cryptoWallet.crypto = crypto;
        cryptoWallet.balance = Number(balance);
        cryptoWallet.wallet = wallet;
      }
      await te.save(cryptoWallet);
      if (Number(cryptoWallet.balance) === 0) {
        await te.delete(CryptocurrencyWallet, { id: cryptoWallet.id });
      }
    });
    return res.status(201).json({ message: "Updated Success" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editCryptoData = async (req: Request, res: Response) => {
  const { _, cryptoId } = req.params;
  const { title, symbol, priceUSD } = req.body;
  try {
    await appDataSource.transaction("REPEATABLE READ", async (te) => {
      const crypto = await te.findOneByOrFail(Cryptocurrencies, {
        id: Number(cryptoId),
      });
      crypto.title = title;
      crypto.symbol = symbol;
      crypto.price = priceUSD;
      await te.save(Cryptocurrencies, crypto);
    });
    return res.status(201).json({ message: "Edit success!" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "title or symbol already exists" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addNewCryptoData = async (req: Request, res: Response) => {
  const { title, symbol, priceUSD } = req.body;
  const crypto = new Cryptocurrencies();
  crypto.title = title;
  crypto.symbol = symbol;
  crypto.price = priceUSD;
  try {
    await appDataSource.transaction("REPEATABLE READ", async (te) => {
      await te.save(Cryptocurrencies, crypto);
    });
    return res.json({
      message: "Add new data complete!",
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "title or symbol already exists" });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
