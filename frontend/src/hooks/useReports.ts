'use client'

import { useState, useCallback, useEffect } from 'react';
import { CONTRACTS, NETWORK } from '@/lib/network';
import { getSorobanServer } from '@/lib/soroban';
import { xdr, Address, scValToNative } from '@stellar/stellar-sdk';

export type ActivityModule = 'treasury' | 'payroll' | 'vesting';

export interface ActivityEvent {
  id: string;
  module: ActivityModule;
  type: string;
  timestamp: number;
  ledger: number;
  details: any;
}

export function useReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const fetchAllEvents = useCallback(async (limit: number = 100) => {
    setIsLoading(true);
    const server = getSorobanServer();
    const contractIds = [
      CONTRACTS.treasury,
      CONTRACTS.payrollStream,
      CONTRACTS.vesting
    ].filter(Boolean) as string[];

    try {
      const eventsResponse = await server.getEvents({
        startLedger: 1,
        filters: [{
          contractIds: contractIds,
        }],
        limit,
      });

      const parsedEvents: ActivityEvent[] = eventsResponse.events.map((event) => {
        const topic = event.topic;
        const value = event.value;
        const eventSymbol = topic[0].sym().toString();
        if (!event.contractId) return null;
        const contractId = event.contractId.toString();

        let module: ActivityModule = 'treasury';
        if (contractId === CONTRACTS.treasury) module = 'treasury';
        else if (contractId === CONTRACTS.payrollStream) module = 'payroll';
        else if (contractId === CONTRACTS.vesting) module = 'vesting';

        let details: any = {};
        let type = eventSymbol;

        // Unified parsing logic
        try {
            if (module === 'treasury') {
                switch (eventSymbol) {
                    case 'deposit':
                        details.recipient = Address.fromScVal(topic[1]).toString();
                        details.amount = scValToNative(value).toString();
                        break;
                    case 'w_create':
                        details.proposer = Address.fromScVal(topic[1]).toString();
                        details.proposalId = scValToNative(value);
                        break;
                    case 'w_exec':
                        details.recipient = Address.fromScVal(topic[1]).toString();
                        details.amount = scValToNative(value).toString();
                        break;
                    default:
                        details = scValToNative(value);
                }
            } else if (module === 'payroll') {
                switch (eventSymbol) {
                    case 's_create':
                        details.sender = Address.fromScVal(topic[1]).toString();
                        details.streamId = scValToNative(value);
                        break;
                    case 'claim':
                        details.recipient = Address.fromScVal(topic[1]).toString();
                        details.amount = scValToNative(value).toString();
                        break;
                    case 'cancel':
                        details.sender = Address.fromScVal(topic[1]).toString();
                        details.streamId = scValToNative(value);
                        break;
                }
            } else if (module === 'vesting') {
                switch (eventSymbol) {
                    case 'v_create':
                        details.grantor = Address.fromScVal(topic[1]).toString();
                        details.beneficiary = Address.fromScVal(topic[2]).toString();
                        const v_vals = scValToNative(value);
                        details.amount = v_vals[0].toString();
                        break;
                    case 'v_claim':
                        details.beneficiary = Address.fromScVal(topic[1]).toString();
                        details.scheduleId = scValToNative(topic[2]);
                        details.amount = scValToNative(value).toString();
                        break;
                    case 'v_revoke':
                        details.grantor = Address.fromScVal(topic[1]).toString();
                        details.scheduleId = scValToNative(topic[2]);
                        details.amountRecovered = scValToNative(value).toString();
                        break;
                }
            }
        } catch (e) {
            console.warn(`Failed to parse event ${eventSymbol} for ${module}`, e);
        }

        return {
          id: event.id,
          module,
          type: eventSymbol,
          timestamp: event.ledgerClosedAt ? new Date(event.ledgerClosedAt).getTime() / 1000 : Date.now() / 1000,
          ledger: event.ledger,
          details,
        };
      }).filter((e): e is ActivityEvent => e !== null);

      setEvents(parsedEvents.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error fetching activity events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportToCSV = (data: ActivityEvent[]) => {
    const headers = ['ID', 'Module', 'Type', 'Timestamp', 'Ledger', 'Details'];
    const rows = data.map(e => [
      e.id,
      e.module,
      e.type,
      new Date(e.timestamp * 1000).toISOString(),
      e.ledger,
      JSON.stringify(e.details).replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbitpay_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  return {
    events,
    isLoading,
    fetchAllEvents,
    exportToCSV,
  };
}
