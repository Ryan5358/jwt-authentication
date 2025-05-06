export const auth_db_config = {
    port: Number(process.env.AUTH_MYSQL_PORT),
    user: process.env.AUTH_MYSQL_USER,
    password: process.env.AUTH_MYSQL_PASSWORD,
    database: process.env.AUTH_MYSQL_DATABASE
}