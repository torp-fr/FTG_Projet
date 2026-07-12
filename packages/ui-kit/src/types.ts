/** Types de vue partagés par les composants ui-kit (JC-09). Sans dépendance app/DB. */

export interface JalonNode {
  code: string;
  state: string;
  quality: number | null;
  recommended: boolean;
  reason?: string;
}

export interface PhaseNode {
  code: string;
  name: string;
  state: "done" | "in_progress" | "available" | "locked";
  reason?: string;
  jalons: JalonNode[];
}

export interface AgentOutput {
  label: string;
  deliverableId: string | null;
}

export interface AgentView {
  persona: string;
  code: string;
  latestRunStatus: string | null;
  runsCount: number;
  outputs: AgentOutput[];
}

export interface DeliverableInput {
  type: string;
  data: Record<string, unknown>;
}
