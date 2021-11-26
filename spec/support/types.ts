import { Response } from 'supertest';


export interface IResponse extends Response {
    body: {
        quantity: number;
        validTill: number | null;
        error: string;
    };
    status: number
}

export interface IReqBody {
    quantity?: number | string;
    expiry?: number | string;
}
