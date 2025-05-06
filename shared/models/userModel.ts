import { RowDataPacket } from "mysql2";
import { UserData } from "types/user";

export interface UserDataModel extends UserData, RowDataPacket {}
