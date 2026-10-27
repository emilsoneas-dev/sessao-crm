import { useEffect } from 'react';
import { supabase } from '../services/supabase/supabaseClient.js';

const LEADS_TABLE = 'leads_formularios';

export function useLeadsRealtime({ onNewLead, onLeadUpdated }) {
  useEffect(() => {
    const channel = supabase
      .channel('crm-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: LEADS_TABLE,
        },
        (payload) => {
          onNewLead?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: LEADS_TABLE,
        },
        (payload) => {
          onLeadUpdated?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewLead, onLeadUpdated]);
}