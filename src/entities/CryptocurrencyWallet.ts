import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Cryptocurrencies } from "./Cryptocurrencies";
import { Wallet } from "./Wallet";

@Entity()
export class CryptocurrencyWallet extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "decimal", scale: 8, precision: 20 })
  balance: number;

  @ManyToOne(() => Cryptocurrencies, (crypto) => crypto.cryptoWallet, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({
    name: "crypto_id",
  })
  crypto: Relation<Cryptocurrencies>;

  @ManyToOne(() => Wallet, (wallet) => wallet.cryptoWallet, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({
    name: "wallet_id",
  })
  wallet: Relation<Wallet>;
}
