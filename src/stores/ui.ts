"use client";
import { create } from "zustand";
import type { SlotStatus } from "@/schemas";

type ModalKey = "addInvitees" | "editCapacity" | "reschedule";

type UIState = {
  // Filters for /slots dashboard
  status: SlotStatus | null;
  propertyId: string | null;
  dateISO: string | null; // YYYY-MM-DD for local filter UI
  timeRange: "today" | "this_week" | "this_month" | "past" | null;

  // Simple modal toggles
  modals: Record<ModalKey, boolean>;
};

type UIActions = {
  setStatus: (status: UIState["status"]) => void;
  setPropertyId: (propertyId: string | null) => void;
  setDateISO: (dateISO: string | null) => void;
  setTimeRange: (range: UIState["timeRange"]) => void;
  resetFilters: () => void;

  openModal: (key: ModalKey) => void;
  closeModal: (key: ModalKey) => void;
};

const initialModals: UIState["modals"] = {
  addInvitees: false,
  editCapacity: false,
  reschedule: false,
};

const initialState: UIState = {
  status: null,
  propertyId: null,
  dateISO: null,
  timeRange: null,
  modals: initialModals,
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setPropertyId: (propertyId) => set({ propertyId }),
  setDateISO: (dateISO) => set({ dateISO }),
  setTimeRange: (timeRange) => set({ timeRange }),
  resetFilters: () => set({ status: null, propertyId: null, dateISO: null, timeRange: null }),
  openModal: (key) => set((s) => ({ modals: { ...s.modals, [key]: true } })),
  closeModal: (key) => set((s) => ({ modals: { ...s.modals, [key]: false } })),
}));
