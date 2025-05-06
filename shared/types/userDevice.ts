import { mapTo } from "@shared-utils/dataUtils";

export default interface UserDevice {
    device_id: string;
    user_id: number;
}

export const userDeviceKeys: (keyof UserDevice)[] = ['device_id', 'user_id']

export const createUserDevice = (data: any) => mapTo<UserDevice>(data, userDeviceKeys)