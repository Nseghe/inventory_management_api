# Perishable Inventory API in NodeJS
Task 1 of the Deep Consulting Solutions Assessment

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

Production build artifacts are stored in the "dist" folder.

5. To start the production server, use the following command
`
npm run start
`

## Public URL
This API is hosted publicly [here](https://dcs-ta-bem202103.herokuapp.com/)

Please note that the this is hosted via a Hobbyist Heroku account. As such the guaranteed availability is only 99.95%, just in case you encounter any downtime while testing.