import { useEffect, useRef } from "react";
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
  const onChangeRef = useRef(onChange);
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  useEffect(() => {
    onChangeRef.current = onChange;
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
  }, [onChange, onInsert, onUpdate, onDelete]);

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
            if (onChangeRef.current) {
              onChangeRef.current(payload);
            } else {
              switch (payload.eventType) {
                case "INSERT":
                  onInsertRef.current?.(payload);
                  break;
                case "UPDATE":
                  onUpdateRef.current?.(payload);
                  break;
                case "DELETE":
                  onDeleteRef.current?.(payload);
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
  }, [table, event, schema]);
};
