import { RowDataPacket } from "mysql2";
import UserDevice from "@shared-types/userDevice";

export interface UserDeviceModel extends UserDevice, RowDataPacket {}