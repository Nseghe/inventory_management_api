export interface IPgError {
    name: string;
    message: string;
    code: string
}

export default class PgError extends Error implements IPgError {

    public code: string;

    constructor(code: string) {
        super();
        this.code = code;
    }
}
