import { Column, Entity, OneToMany, Relation } from "typeorm";
import { Common } from "./utils/Common";
import { CryptocurrencyWallet } from "./CryptocurrencyWallet";

@Entity()
export class Cryptocurrencies extends Common {
  @Column({ unique: true })
  symbol: string;

  @Column({ name: "price(USD)", type: "decimal", scale: 8, precision: 20 })
  price: number;

  @OneToMany(() => CryptocurrencyWallet, (cryptoWallet) => cryptoWallet.crypto)
  cryptoWallet: Relation<CryptocurrencyWallet[]>;
}
