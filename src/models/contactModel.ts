// src/models/contactModel.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { LinkPrecedence } from "../types";

@Entity("contacts")
export class ContactEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: true })
  phoneNumber?: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column({ type: "int", nullable: true })
  linkedId?: number;

  @Column({
    type: "enum",
    enum: LinkPrecedence,
    default: LinkPrecedence.PRIMARY
  })
  linkPrecedence!: LinkPrecedence;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}