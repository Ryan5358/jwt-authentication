import mysql, { Pool, PoolOptions } from 'mysql2/promise';

export class MySQLClient {
    private static connPools: Record<string, Pool> = {};

    /**
     * Returns a MySQL connection pool for the given database.
     * @param dbName - The database name for which to retrieve the connection pool.
     * @returns {Pool} - Returns the connection pool for the specified database.
     */
    static getConnectionPool(options: PoolOptions): Pool {
        const dbName = options.database!!

        if (!MySQLClient.connPools[dbName]) {
            MySQLClient.connPools[dbName] = mysql.createPool({
                ...options,
                waitForConnections: true,
                connectionLimit: 10, // Max concurrent connections for each database
                queueLimit: 0,
            });
            console.log(`MySQL connection pool created for database: ${dbName}`);
        }
        return MySQLClient.connPools[dbName];
    }
}
