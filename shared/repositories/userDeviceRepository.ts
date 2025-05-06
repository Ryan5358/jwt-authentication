import { auth_db_config } from "@shared-constants/dbConstants";
import { MySQLClient } from "@shared-libs/mysql2/mysqlClient";
import { MySQLExecutor, createQuery } from "@shared-libs/mysql2/mysqlExecutor";
import { UserDeviceModel } from "@shared-models/userDeviceModel";
import { MySQLQueryClauses } from "types/auxMySQL";
import UserDevice, { createUserDevice } from "@shared-types/userDevice";

const pool = MySQLClient.getConnectionPool(auth_db_config)
const executor = new MySQLExecutor(pool)
const table = "user_devices"

const queryUserDevice = async (clauses?: MySQLQueryClauses) => {
    await executor.execute<UserDeviceModel>(createQuery(
        "select",
        table,
        clauses
    ))

    const data = executor.getResult<UserDeviceModel>() as UserDeviceModel[]

    return data.map(entry => createUserDevice(entry))
}

export const isOwnedBy = async (deviceId: string, userId: number) => {
    const queryClauses: MySQLQueryClauses = { where: {
            predicates: { user_id: userId },
            statement: "[user_id]"
        }
    }
    const rows = await queryUserDevice(queryClauses)
    return rows.some(row => row.device_id == deviceId && row.user_id == userId)
}

export const addUserDevice = async (userDevice: UserDevice) => {    
    await executor.execute<UserDeviceModel>(
        createQuery(
            "insert", 
            table, 
            { 
                insert: Object.keys(userDevice), 
                values: Object.values(userDevice) 
            }
        )
    )
}