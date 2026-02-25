"use client";

import { useState, useRef, useEffect } from "react";
import { useFreighter } from "@/contexts/FreighterContext";
import { Wallet, Loader2, AlertCircle, ChevronDown, Copy, LogOut } from "lucide-react";

export default function WalletButton() {
  const { isConnected, isLoading, error, publicKey, connectWallet, disconnectWallet } = useFreighter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setDropdownOpen(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg bg-sky-500/50 px-4 py-2 font-medium text-slate-950 cursor-not-allowed"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (error && !isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-500/10 px-4 py-2 font-medium text-red-500 transition-colors hover:bg-red-500/20"
        title={error}
      >
        <AlertCircle className="h-4 w-4" />
        Retry Connection
      </button>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-slate-800"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {truncateAddress(publicKey)}
          <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-800 bg-slate-900 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <button
                onClick={handleCopy}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Copy className="h-4 w-4" />
                Copy Address
              </button>
              <button
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-sky-400"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </button>
  );
}
