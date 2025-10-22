export class HttpHelpers {
    private constructor() {}
    
    static makeRequest= (
        uri: string,
        method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE",
        body: any = {},
        credentials: RequestCredentials = "include",
        headers: HeadersInit = { "Content-Type": "application/json" }
    ): Promise<Response> => {
        return fetch(uri, {
            method: method,
            body: JSON.stringify(body),
            credentials: credentials,
            headers: headers
        });
    }
}