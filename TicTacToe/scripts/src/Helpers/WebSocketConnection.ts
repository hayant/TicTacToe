import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { useState } from "react";

class WebSocketConnection {
    connection: HubConnection | null = null;

    init = (
        uri: string,
        onReceive: (message: string) => void
    ) => {
        
        const connect = async (): Promise<void>  => {
            const conn = new HubConnectionBuilder()
                .withUrl(uri, {
                    withCredentials: true, // ✅ sends cookies!
                })
                .withAutomaticReconnect()
                .build();

            conn.on("ReceiveData", onReceive);

            await conn.start();
            console.log("Connected to SignalR hub");
            this.connection = conn;
        };

        return connect();
    }
    
    send = (message: string): Promise<void> => {
        return this.connection!.send(message);
    }
    
    stop = (): Promise<void> => {
        return this.connection!.stop();
    }
}