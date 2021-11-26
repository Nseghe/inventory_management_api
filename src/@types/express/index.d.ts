import { IUser } from "@entities/User";

declare module 'express' {
    export interface Request {
        body: {
            quantity: number;
            expiry: number | null;
        };
    }
}
