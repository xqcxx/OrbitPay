"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { isConnected as freighterIsConnected, getPublicKey, requestAccess } from "@stellar/freighter-api";

interface FreighterContextType {
    publicKey: string | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    checkConnection: () => Promise<void>;
}

const FreighterContext = createContext<FreighterContextType | undefined>(undefined);

export function FreighterProvider({ children }: { children: ReactNode }) {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const checkConnection = useCallback(async () => {
        setIsLoading(true);
        try {
            const connected = await freighterIsConnected();
            if (connected) {
                const key = await getPublicKey();
                if (key) {
                    setPublicKey(key);
                    setIsConnected(true);
                }
            } else {
                setIsConnected(false);
                setPublicKey(null);
            }
        } catch (err: any) {
            console.error("Error checking Freighter connection", err);
            setError(err?.message || "Failed to check Freighter connection.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    const connectWallet = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const access = await requestAccess();
            if (access) {
                await checkConnection();
            } else {
                setError("Connection aborted or Freighter not installed.");
            }
        } catch (err: any) {
            console.error("Error connecting to Freighter", err);
            setError(err?.message || "Failed to prompt connection request.");
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setPublicKey(null);
        setIsConnected(false);
        setError(null);
    };

    return (
        <FreighterContext.Provider
            value={{
                publicKey,
                isConnected,
                isLoading,
                error,
                connectWallet,
                disconnectWallet,
                checkConnection,
            }}
        >
            {children}
        </FreighterContext.Provider>
    );
}

export function useFreighter() {
    const context = useContext(FreighterContext);
    if (!context) {
        throw new Error("useFreighter must be used within a FreighterProvider");
    }
    return context;
}
