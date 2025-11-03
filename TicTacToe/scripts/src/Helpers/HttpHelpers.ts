export class HttpHelpers {
    private constructor() {}
    
    static makeRequest = async<T>(
        uri: string,
        method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE",
        body: any = undefined,
        credentials: RequestCredentials = "include",
        headers: HeadersInit = { "Content-Type": "application/json" }
    ): Promise<T> => {
        const response = await fetch(uri, {
            method: method,
            body: body ? JSON.stringify(body) : undefined,
            credentials: credentials,
            headers: headers
        });

        if (!response.ok) {
            const message: string = (await response.json())?.message?.toString() ?? "";
            throw new Error(message !== "" ? message : `${response.status}: ${response.statusText}`);
            // throw new Error(`${response.status}`);
        }

        return (await response.json()) as T;
    }
}