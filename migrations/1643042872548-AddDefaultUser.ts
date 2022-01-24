import bcrypt from "bcrypt";
import { MigrationInterface, QueryRunner } from "typeorm";
import { passwordStrength } from "../src/api";

export class AddDefaultUser1643042872548 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO User (username, password) VALUES (?, ?)`, [
      "admin",
      await bcrypt.hash("batata", passwordStrength)
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM User WHERE username = ?`, ["admin"]);
  }

}
