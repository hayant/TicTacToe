export class HttpHelpers {
    private constructor() {}

    static makeRequest = async <T>(
        uri: string,
        method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE",
        body: any = undefined,
        credentials: RequestCredentials = "include",
        headersInit: HeadersInit = { "Content-Type": "application/json" }
    ): Promise<T> => {
        const headers = new Headers(headersInit);

        // For GET requests, don't set Content-Type header
        if (method === "GET") {
            headers.delete("Content-Type");
        }

        // Prepare body: pass through FormData / Blob / URLSearchParams; stringify objects when JSON
        let requestBody: BodyInit | undefined = undefined;
        if (body !== undefined && body !== null) {
            if (body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
                requestBody = body;
                // Let the browser set content-type for FormData
                if (body instanceof FormData) {
                    headers.delete("Content-Type");
                }
            } else {
                // Default to JSON if content-type contains json or no content-type provided
                const contentType = headers.get("Content-Type") ?? "";
                if (contentType.includes("application/json") || contentType === "") {
                    headers.set("Content-Type", "application/json");
                    requestBody = JSON.stringify(body);
                } else {
                    // Fallback: attempt to send as string
                    requestBody = String(body);
                }
            }
        }

        const response = await fetch(uri, {
            method,
            body: requestBody,
            credentials,
            headers
        });

        // Helper to safely parse JSON or fallback to text
        const parseBody = async () => {
            const contentType = response.headers.get("Content-Type") ?? "";
            if (response.status === 204 || contentType === "") {
                return undefined as unknown as T;
            }
            if (contentType.includes("application/json")) {
                return (await response.json()) as T;
            }
            // Non-JSON body -> return text
            return (await response.text()) as unknown as T;
        };

        if (!response.ok) {
            // Compute a useful message inside try/catch but do NOT throw there
            let message = `${response.status}: ${response.statusText}`;
            try {
                const ct = response.headers.get("Content-Type") ?? "";
                if (ct.includes("application/json")) {
                    const obj = await response.json();
                    message = typeof obj === "string" ? obj : JSON.stringify(obj);
                } else {
                    const text = await response.text();
                    if (text) message = text;
                }
            } catch {
                // parsing failed — keep the default message
            }

            throw new Error(message !== "" ? message : `${response.status}: ${response.statusText}`);
        }

        return await parseBody();
    }
}