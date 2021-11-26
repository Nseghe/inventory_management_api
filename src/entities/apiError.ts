export interface IAPIError {
    name: string
    message: string;
    code: string | null;
}

class APIError extends Error implements IAPIError {

    public name: string;
    public message: string;
    public code: string;

    constructor(message: string, name?: string,  code?: string) {
        super();
        this.message = message;
        this.code = code ? code : '';
        this.name = name ? name : '';
    }
}

export default APIError;