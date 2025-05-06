export interface MySQLQuery {
    operation: "select" | "insert" | "update" | "delete"
    query: string
}

export type MySQLQueryClauses = { 
        select?: string[];
        insert?: string[];
        values?: MySQLValuesClause
        where?: MySQLWhereClause;
} | {
    [key: string]: MySQLGenericClause;
}

export type MySQLValuesClause = (string | number)[] | (string | number)[][]
export type MySQLWhereClause = {
    predicates: Record<string, string | number | [string, string | number]>;
    statement: string | string[]
};
export type MySQLGenericClause = Record<string, string | number | Record<string, string | number>>