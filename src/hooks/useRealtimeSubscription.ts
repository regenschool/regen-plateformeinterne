import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type SubscriptionConfig = {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
};

export const useRealtimeSubscription = ({
  table,
  event = "*",
  schema = "public",
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: SubscriptionConfig) => {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`${table}-changes`)
        .on(
          "postgres_changes" as any,
          {
            event,
            schema,
            table,
          },
          (payload: any) => {
            // Call the appropriate handler based on event type
            if (onChange) {
              onChange(payload);
            } else {
              switch (payload.eventType) {
                case "INSERT":
                  onInsert?.(payload);
                  break;
                case "UPDATE":
                  onUpdate?.(payload);
                  break;
                case "DELETE":
                  onDelete?.(payload);
                  break;
              }
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, schema, onInsert, onUpdate, onDelete, onChange]);
};
