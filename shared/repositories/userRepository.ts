import { MySQLClient } from "@shared-libs/mysql2/mysqlClient";
import { auth_db_config } from "@shared-constants/dbConstants";
import { createUserData, UserData, UserPlainData } from "@shared-types/user";
import { createQuery, MySQLExecutor } from "@shared-libs/mysql2/mysqlExecutor";
import { UserDataModel } from "models/userModel";
import { MySQLQueryClauses } from "@shared-types/auxMySQL";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt"

const pool = MySQLClient.getConnectionPool(auth_db_config)
const executor = new MySQLExecutor(pool)
const table = "users"

const queryUser = async (clauses?: MySQLQueryClauses) => {
    await executor.execute<UserDataModel>(createQuery(
        "select",
        table,
        clauses
    ))

    const data = executor.getResult<UserDataModel>() as UserDataModel[]

    return data.map(entry => createUserData(entry))
}


export const getUser = async (id: number) => (await queryUser({ 
    where: { 
        predicates: { id }, 
        statement: "[id]" 
    } 
}))[0]


export const findUsers = async (userInfo: Partial<UserData>) => await queryUser({ 
    where: {
        predicates: userInfo,
        statement: Object.keys(userInfo)
    }
})

export const addUser = async (user: Omit<UserData, "id">): Promise<number> => {
    await executor.execute<UserDataModel>(
        createQuery(
            "insert", 
            table, 
            { 
                insert: Object.keys(user), 
                values: Object.values(user) 
            }
        )
    )
    
    return (executor.getResult() as ResultSetHeader).insertId
}

export const updateUser = async (id: number, updatedUser: Partial<Omit<UserData, "id" | "password_hash">>) => {
    await executor.execute<UserDataModel>(
        createQuery(
            "update", 
            table, 
            { 
                where: {
                    predicates: id,
                    statement: "[id]"
                },
                set: updatedUser,
            }
        )
    )
    
    return (executor.getResult() as ResultSetHeader).affectedRows > 0
}

export const updateUserPassword = async (id: number, userPlainData: Pick<UserPlainData, "password">) => {
    await executor.execute<UserDataModel>(
        createQuery(
            "update", 
            table, 
            { 
                where: {
                    predicates: id,
                    statement: "[id]"
                },
                set: {
                    password_hash: await bcrypt.hash(userPlainData.password, 10)
                },
            }
        )
    )
    
    return (executor.getResult() as ResultSetHeader).affectedRows > 0
}

export const deleteUser = async (id: number) => {
    await executor.execute<UserDataModel>(
        createQuery(
            "update", 
            table, 
            { 
                where: {
                    predicates: id,
                    statement: "[id]"
                }
            }
        )
    )

    return (executor.getResult() as ResultSetHeader).affectedRows > 0
}