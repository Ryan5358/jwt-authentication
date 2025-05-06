import { Pool, QueryResult, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { MySQLGenericClause, MySQLQuery, MySQLQueryClauses, MySQLValuesClause, MySQLWhereClause } from "types/auxMySQL";

export function createQuery(
    operation: "select" | "insert" | "update" | "delete", 
    table: string, 
    clauses?: MySQLQueryClauses
): MySQLQuery {
    if (!table) throw new Error("Table name is required.");

    let query = "";

    switch (operation) {
        case "select":
            query = `SELECT ${clauses?.select ? (clauses.select as string[]).join(", ") : "*"} FROM ${table}`;
            break;
        case "insert":
            if (!clauses?.insert || !clauses?.values) {
                throw new Error("INSERT requires 'insert' and 'values' clauses.");
            }
            query = buildInsertQuery(table, clauses.insert as string[], clauses.values as MySQLValuesClause);
            break;
        case "update":
            query = `UPDATE ${table}`;
            break;
        case "delete":
            query = `DELETE FROM ${table}`;
            break;
        default:
            throw new Error(`Invalid operation: ${operation}.`);
    }

    if (clauses && operation !== "insert") {
        const { where, ...otherClauses } = clauses as { where: MySQLWhereClause }
        if (Object.keys(otherClauses).length > 0) query += ` ${buildOtherClauses(otherClauses)}`
        if (where) query += ` WHERE ${buildWhereClause(where)}`
    }

    return { operation, query }
}

function buildInsertQuery(table: string, columns: string[], values: MySQLValuesClause): string {
    const cols = columns.join(", ");
    const vals = Array.isArray(values[0])
        ? (values as (string | number)[][]).map(row => `(${row.map(escapeValue).join(", ")})`).join(", ")
        : `(${(values as (string | number)[]).map(escapeValue).join(", ")})`;
    return `INSERT INTO ${table} (${cols}) VALUES ${vals}`;
}

function buildWhereClause(where: MySQLWhereClause): string {
    const statement = where.statement
    let statementStr: string
    if (typeof(statement) === "string") {
        statementStr = statement.replace(/\b(and|or)\b/gi, match => match.toUpperCase())
    } else {
        statementStr = statement.map(key => `[${key}]`).join(" AND ")
    }

    const validPattern = /^(\[[^\]]*\]|\([^\)]*\))(\s+(AND|OR)\s+(\[[^\]]*\]|\([^\)]*\)))*$/;
    const isValidStatement = validPattern
        .test(statementStr)
    
        if (!isValidStatement) throw new Error (`Invalid statement: ${statementStr}.`)

    Object.entries(where.predicates).map(([key, predicate]) => {
        const oldStatement = statementStr
        let predicateString

        // If condition is an array (e.g., ['>', 5]), handle the operator and value
        if (Array.isArray(predicate)) {
            const [operator, value] = statement;
            predicateString = `${escapeKeyValue(key)} ${escapeKeyValue(operator)} ${escapeValue(value)}`;
        } else {
            // If it's a direct value, assume equality (e.g., `age` or `5`)
            predicateString = `${escapeKeyValue(key)} = ${escapeValue(predicate)}`
        }

        statementStr = statementStr.replaceAll(`[${key}]`, predicateString)

        if (statementStr === oldStatement) throw new Error (`Invalid predicate key: ${key}`)
    })

    return statementStr
}

function escapeKeyValue(value: string): string {
    return value.replace(/`/g, "``"); // Escape backticks in column names
}

function buildOtherClauses(clauses: MySQLGenericClause): string {
    return Object.entries(clauses).map(([key, value]) => `${key.toUpperCase()} ${(typeof(value) === 'object' ? Object.entries(value).map(([sub, stm]) => `${escapeKeyValue(sub)} = ${escapeValue(stm)}`).join(", ") : escapeValue(value))}`).join(" ");
}

function escapeValue(value: string | number): string {
    return typeof value === "number" ? value.toString() : `'${value.replace(/'/g, "''")}'`;
}


export class MySQLExecutor {
    private pool: Pool
    private results:  QueryResult | null = null

    constructor(pool: Pool) {
        this.pool = pool
    }

    async execute<T extends RowDataPacket>(queryObj: MySQLQuery) {
        try {
            if (queryObj.operation == "select") {
                // Use the connection
                const [results] = await this.pool.query<T[]>(queryObj.query);
                this.results = results as RowDataPacket[]         
            } else {
                const [results] = await this.pool.query<ResultSetHeader>(queryObj.query);
                this.results = results
            }            

        } catch (error) {
            console.error('Error with MySQL operations:', error);
            throw error
        }
    }

    getResult<T extends RowDataPacket>(): T[] | ResultSetHeader | null {
        const data = this.results
        let result: T | T[] | ResultSetHeader | null = null;

        if(Array.isArray(data)) {
            result = data as T[]
        } else {
            result = data as ResultSetHeader
        }

        return result as ResultSetHeader | null
    }

}