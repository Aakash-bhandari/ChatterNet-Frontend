import React, { createContext, useContext, useMemo } from "react";
import io from "socket.io-client";
const SocketContext = createContext(null);

export const SocketProvider = (props) => {
    const socketInstance = io.connect("https://chatternet-backend.onrender.com");
    console.log(socketInstance);
    return (
        <SocketContext.Provider value={{socketInstance}}>
            {props.children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
}