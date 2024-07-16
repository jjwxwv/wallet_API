import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { CryptocurrencyWallet } from "./CryptocurrencyWallet";
import { Users } from "./Users";

@Entity()
export class Wallet extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "wallet_name" })
  walletName: string;

  @OneToMany(() => CryptocurrencyWallet, (cryptoWallet) => cryptoWallet.wallet)
  cryptoWallet: Relation<CryptocurrencyWallet[]>;

  @OneToOne(() => Users)
  @JoinColumn({ name: "user_id" })
  users: Relation<Users>;
}
