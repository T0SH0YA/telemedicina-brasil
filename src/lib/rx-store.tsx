import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  patients as seedPatients,
  seedPrescriptions,
  generateCode,
  type Patient,
  type Prescription,
  type PrescriptionItem,
  type PrescriptionType,
} from "./mock-data";

interface NewPrescriptionInput {
  patient: Patient;
  type: PrescriptionType;
  items: PrescriptionItem[];
  notes?: string;
}

interface RxStore {
  patients: Patient[];
  prescriptions: Prescription[];
  createPrescription: (input: NewPrescriptionInput) => Prescription;
  markSent: (id: string, channel: string) => void;
  cancel: (id: string) => void;
}

const RxContext = createContext<RxStore | null>(null);

export function RxProvider({ children }: { children: ReactNode }) {
  const [patients] = useState<Patient[]>(seedPatients);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(seedPrescriptions);

  const store = useMemo<RxStore>(
    () => ({
      patients,
      prescriptions,
      createPrescription: (input) => {
        const rx: Prescription = {
          id: `rx-${Date.now()}`,
          code: generateCode(),
          patientId: input.patient.id,
          patientName: input.patient.name,
          type: input.type,
          items: input.items,
          notes: input.notes,
          createdAt: new Date().toISOString(),
          status: "emitida",
        };
        setPrescriptions((prev) => [rx, ...prev]);
        return rx;
      },
      markSent: (id, channel) =>
        setPrescriptions((prev) =>
          prev.map((rx) => (rx.id === id ? { ...rx, status: "enviada", sentTo: channel } : rx)),
        ),
      cancel: (id) =>
        setPrescriptions((prev) =>
          prev.map((rx) => (rx.id === id ? { ...rx, status: "cancelada" } : rx)),
        ),
    }),
    [patients, prescriptions],
  );

  return <RxContext.Provider value={store}>{children}</RxContext.Provider>;
}

export function useRx(): RxStore {
  const ctx = useContext(RxContext);
  if (!ctx) throw new Error("useRx deve ser usado dentro de RxProvider");
  return ctx;
}
