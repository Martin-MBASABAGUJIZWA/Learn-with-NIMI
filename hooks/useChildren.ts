import { useState, useEffect, useCallback } from "react";
import supabase from "@/lib/supabaseClient";
import type { Child, Activity } from "@/components/parent/child-types";

export function useChildren(parentId?: string) {
  const [children, setChildren] = useState<Child[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Columns needed for the parent dashboard
  const childColumns = [
    "id",
    "name",
    "avatar",
    "age",
    "screenTimeLimit",
    "bedtimeMode",
    "contentLock",
    "activities",
    "created_at"
  ];

  const fetchChildren = useCallback(async () => {
    if (!parentId) {
      setChildren([]);
      setIsReady(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("children")
        .select(childColumns.join(", "))
        .eq("parent_id", parentId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Failed to fetch children:", error);
      setChildren([]);
    } finally {
      setIsReady(true);
    }
  }, [parentId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const addChild = async (name: string) => {
    if (!parentId) return null;
    
    try {
      const newChild: Partial<Child> = {
        name,
        parent_id: parentId,
        avatar: "",
        age: "2-4 years",  // Default age range
        screenTimeLimit: 60,
        bedtimeMode: false,
        contentLock: true,
        activities: [],
        streak: 0,
        level: 1,
        points: 0
      };

      const { data, error } = await supabase
        .from("children")
        .insert([newChild])
        .select(childColumns.join(", "))
        .single();

      if (error) throw error;
      setChildren(prev => [...prev, data as Child]);
      return data.id;
    } catch (error) {
      console.error("Error adding child:", error);
      return null;
    }
  };

  const updateChild = async (childId: string, updates: Partial<Child>) => {
    if (!parentId) return;
    
    try {
      // First update local state for immediate UI feedback
      setChildren(prev => 
        prev.map(child => 
          child.id === childId ? { ...child, ...updates } : child
        )
      );
      
      // Then send update to database
      const { error } = await supabase
        .from("children")
        .update(updates)
        .match({ id: childId, parent_id: parentId });

      if (error) throw error;
    } catch (error) {
      console.error("Error updating child:", error);
      // Revert local state on error
      fetchChildren();
    }
  };

  return { children, addChild, updateChild, isReady, fetchChildren };
}