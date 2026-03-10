import { useBusiness } from "../../../context/BusinessProvider";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function JournalEntries() {
  const { business } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!business?.id) return;
    supabase
      .from("journal_entries")
      .select("*")
      .eq("business_id", business.id)
      .order("entry_date", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setRows(data ?? []);
      });
  }, [business?.id]);

  return (
    <div>
      <h2>Journal Entries</h2>
      <pre>{JSON.stringify(rows, null, 2)}</pre>
    </div>
  );
}