import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, API_BASE } from "@/context/AuthContext";

const EVENT_KEYS: Record<string, string[]> = {
  attendance_update:   ["att-stats", "inventory-simple", "inv-stats"],
  inventory_update:    ["inventory-simple", "inv-stats", "my-inventory", "student-inv"],
  checkin_update:      ["att-stats", "student-checkin-history"],
  student_update:      ["master-students", "hostel-students", "student-detail", "hostel-student-counts"],
  staff_update:        ["staff-all", "staff-all-home", "staff", "my-status", "staff-status-me"],
  announcement_update: ["announcements", "notifications"],
  lostitem_update:     ["lostitems"],
};

export function useLiveSync() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef("");
  const lastIndexRef = useRef(0);

  useEffect(() => {
    if (!token || !user) return;

    let alive = true;

    function parseChunk(chunk: string) {
      bufferRef.current += chunk;
      const lines = bufferRef.current.split("\n");
      bufferRef.current = lines.pop() ?? "";

      let eventName = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventName = line.slice(7).trim();
        } else if (line === "" && eventName) {
          const keys = EVENT_KEYS[eventName];
          if (keys) {
            keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
          }
          eventName = "";
        } else if (line.startsWith("data: ") && eventName) {
          const keys = EVENT_KEYS[eventName];
          if (keys) {
            keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
          }
          eventName = "";
        }
      }
    }

    function connect() {
      if (!alive) return;

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      lastIndexRef.current = 0;
      bufferRef.current = "";

      xhr.open("GET", `${API_BASE}/events?token=${encodeURIComponent(token)}`);
      xhr.setRequestHeader("Accept", "text/event-stream");
      xhr.setRequestHeader("Cache-Control", "no-cache");

      xhr.onprogress = () => {
        const newText = xhr.responseText.slice(lastIndexRef.current);
        lastIndexRef.current = xhr.responseText.length;
        if (newText) parseChunk(newText);
      };

      xhr.onloadend = () => {
        xhrRef.current = null;
        if (alive) {
          retryRef.current = setTimeout(connect, 5000);
        }
      };

      xhr.onerror = () => {
        xhrRef.current = null;
        if (alive) {
          retryRef.current = setTimeout(connect, 8000);
        }
      };

      xhr.send(null);
    }

    connect();

    return () => {
      alive = false;
      xhrRef.current?.abort();
      xhrRef.current = null;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [token, user?.id]);
}
