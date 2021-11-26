import pg from 'pg';


const connectionString: string = String(process.env.DATABASE_URL)


// DB CONFIGURATION PARAMS
const connectionPool: pg.Pool = new pg.Pool({
    connectionString: connectionString,

    /*
        For hosting on Heroku. Should be properly configured on production instance
        for better security.
    */
    // ssl: {
    //     rejectUnauthorized: false
    // }
});


const dBConnectionPool = {
    async query(
        queryString: string,
        queryParams?: Array<string | number>
    ): Promise<pg.QueryResult> {
        try {
            const results: pg.QueryResult = await connectionPool.query(queryString, queryParams);
            return Promise.resolve(results);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

export default dBConnectionPool;
