// Set the env file, must be first
import dotenv from 'dotenv';

const result = dotenv.config({
    path: `./src/pre-start/env/test.env`,
});

if (result.error) {
    throw result.error;
}
