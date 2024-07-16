import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Entity()
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @Column({ type: "enum", enum: UserRole })
  role: UserRole;

  // @ManyToOne(() => UserTypes, (userType) => userType.users, {
  //   onDelete: "CASCADE",
  //   nullable: false,
  // })
  // @JoinColumn({
  //   name: "usertype_id",
  // })
  // userTypes: UserTypes;
}
