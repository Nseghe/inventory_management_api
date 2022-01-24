# Perishable Inventory API in NodeJS (TypeScript)
Perishable Inventory Management API in TypeScript/NodeJS.

Endpoints:
- /:item/quantity - get quantity of "item" in DB 
- /:item/add - add specified quantiy of "item" to DB
- /:item/sell - sell specified quantity of "item" in DB
Expired items are deleted from DB by a cron job running once daily.

Reach out to me for more details.


## Usage
1. This API is fed from a POSTGRESQL Database. The connection string for this Databse is read from the "DATABASE_URL" environment variable which should be provided in the deployment environment. The API is designed to inititialize all its required DB utilities (in code) including creating an "items" table (if none exists). For this reason, if you are connecting a DB to this API for the first time, please make sure no "items" table already exists in the Database. The API will not overwrite this table and will instead attempt to feed from it which may lead to unnecessary errors.

2. To run the development server, use the following command
`
npm run start:dev
`.

3. To run the Unit and Integration tests, use the following command
`
npm run test
`.

4. To create production build artifacts, use the following command
`
npm run build
`.

5. To start the production server, use the following command
`
npm run start
`.
