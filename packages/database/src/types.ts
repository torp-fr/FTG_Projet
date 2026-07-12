export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_label: string
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_label: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_label?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_objectives: {
        Row: {
          agent_id: string
          created_at: string
          derived_from: Json
          id: string
          key_results: Json
          objective: string
          progress: number
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          derived_from?: Json
          id?: string
          key_results?: Json
          objective: string
          progress?: number
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          derived_from?: Json
          id?: string
          key_results?: Json
          objective?: string
          progress?: number
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_objectives_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_objectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          code: string
          created_at: string
          default_objectives_template: Json
          description: string | null
          domain: string
          engine_id: string | null
          id: string
          mission: string
          name: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          default_objectives_template?: Json
          description?: string | null
          domain: string
          engine_id?: string | null
          id?: string
          mission: string
          name: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_objectives_template?: Json
          description?: string | null
          domain?: string
          engine_id?: string | null
          id?: string
          mission?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_agents_engine"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "engines"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          activation_status: string
          code: string
          cost_model: string
          created_at: string
          engines_consumers: string[]
          id: string
          licence: string | null
          name: string
          notes: string | null
          priority: string | null
          type: string
          waterfall_level_default: number
        }
        Insert: {
          activation_status?: string
          code: string
          cost_model?: string
          created_at?: string
          engines_consumers?: string[]
          id?: string
          licence?: string | null
          name: string
          notes?: string | null
          priority?: string | null
          type: string
          waterfall_level_default?: number
        }
        Update: {
          activation_status?: string
          code?: string
          cost_model?: string
          created_at?: string
          engines_consumers?: string[]
          id?: string
          licence?: string | null
          name?: string
          notes?: string | null
          priority?: string | null
          type?: string
          waterfall_level_default?: number
        }
        Relationships: []
      }
      decisions: {
        Row: {
          chosen_index: number | null
          created_at: string
          founder_motivation: string | null
          id: string
          milestone_id: string | null
          options: Json
          project_id: string
        }
        Insert: {
          chosen_index?: number | null
          created_at?: string
          founder_motivation?: string | null
          id?: string
          milestone_id?: string | null
          options?: Json
          project_id: string
        }
        Update: {
          chosen_index?: number | null
          created_at?: string
          founder_motivation?: string | null
          id?: string
          milestone_id?: string | null
          options?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_messages: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          intent: string | null
          resolved: boolean
          thread_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          resolved?: boolean
          thread_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          resolved?: boolean
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "deliverable_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_threads: {
        Row: {
          created_at: string
          deliverable_id: string
          id: string
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          id?: string
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_threads_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: true
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          content_ref: string | null
          created_at: string
          engine_run_id: string | null
          id: string
          pedagogy: Json
          project_id: string
          project_milestone_id: string | null
          sources: Json
          status: string
          structured_data: Json
          title: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          content_ref?: string | null
          created_at?: string
          engine_run_id?: string | null
          id?: string
          pedagogy?: Json
          project_id: string
          project_milestone_id?: string | null
          sources?: Json
          status?: string
          structured_data?: Json
          title: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          content_ref?: string | null
          created_at?: string
          engine_run_id?: string | null
          id?: string
          pedagogy?: Json
          project_id?: string
          project_milestone_id?: string | null
          sources?: Json
          status?: string
          structured_data?: Json
          title?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_project_milestone_id_fkey"
            columns: ["project_milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deliverables_engine_run"
            columns: ["engine_run_id"]
            isOneToOne: false
            referencedRelation: "engine_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_runs: {
        Row: {
          agent_id: string | null
          cost_estimate: number | null
          created_at: string
          engine_version_id: string
          finished_at: string | null
          id: string
          input_envelope: Json
          input_structured_validated: boolean
          llm_channel: string
          model_calls: Json
          output_envelope_ref: string | null
          project_id: string
          research_depth: number
          started_at: string | null
          status: string
          task_type: string
        }
        Insert: {
          agent_id?: string | null
          cost_estimate?: number | null
          created_at?: string
          engine_version_id: string
          finished_at?: string | null
          id?: string
          input_envelope: Json
          input_structured_validated?: boolean
          llm_channel: string
          model_calls?: Json
          output_envelope_ref?: string | null
          project_id: string
          research_depth?: number
          started_at?: string | null
          status?: string
          task_type: string
        }
        Update: {
          agent_id?: string | null
          cost_estimate?: number | null
          created_at?: string
          engine_version_id?: string
          finished_at?: string | null
          id?: string
          input_envelope?: Json
          input_structured_validated?: boolean
          llm_channel?: string
          model_calls?: Json
          output_envelope_ref?: string | null
          project_id?: string
          research_depth?: number
          started_at?: string | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "engine_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engine_runs_engine_version_id_fkey"
            columns: ["engine_version_id"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engine_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_versions: {
        Row: {
          config: Json
          created_at: string
          deployed_at: string | null
          engine_id: string
          eval_score: Json
          id: string
          parent_version_id: string | null
          prompt_bundle_ref: string | null
          semver: string
          status: string
        }
        Insert: {
          config?: Json
          created_at?: string
          deployed_at?: string | null
          engine_id: string
          eval_score?: Json
          id?: string
          parent_version_id?: string | null
          prompt_bundle_ref?: string | null
          semver: string
          status?: string
        }
        Update: {
          config?: Json
          created_at?: string
          deployed_at?: string | null
          engine_id?: string
          eval_score?: Json
          id?: string
          parent_version_id?: string | null
          prompt_bundle_ref?: string | null
          semver?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "engine_versions_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "engines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engine_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      engines: {
        Row: {
          code: string
          created_at: string
          current_version_id: string | null
          id: string
          model_routing: Json
          name: string
          quotas_default: Json
          status: string
          task_types: string[]
        }
        Insert: {
          code: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          model_routing?: Json
          name: string
          quotas_default?: Json
          status?: string
          task_types?: string[]
        }
        Update: {
          code?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          model_routing?: Json
          name?: string
          quotas_default?: Json
          status?: string
          task_types?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "fk_engines_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_runs: {
        Row: {
          candidate_version_id: string | null
          id: string
          passed: boolean
          ran_at: string
          scores: Json
          target_id: string | null
          target_type: string
          vs_active: Json
        }
        Insert: {
          candidate_version_id?: string | null
          id?: string
          passed?: boolean
          ran_at?: string
          scores?: Json
          target_id?: string | null
          target_type: string
          vs_active?: Json
        }
        Update: {
          candidate_version_id?: string | null
          id?: string
          passed?: boolean
          ran_at?: string
          scores?: Json
          target_id?: string | null
          target_type?: string
          vs_active?: Json
        }
        Relationships: []
      }
      events: {
        Row: {
          actor: string | null
          created_at: string
          id: string
          payload: Json
          project_id: string | null
          type: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          id?: string
          payload?: Json
          project_id?: string | null
          type: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          id?: string
          payload?: Json
          project_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          captured_at: string
          file_ref: string | null
          hash: string | null
          id: string
          payload: Json
          project_milestone_id: string
          type: string
          verification: Json
          verified: boolean
          weight: number
        }
        Insert: {
          captured_at?: string
          file_ref?: string | null
          hash?: string | null
          id?: string
          payload?: Json
          project_milestone_id: string
          type: string
          verification?: Json
          verified?: boolean
          weight?: number
        }
        Update: {
          captured_at?: string
          file_ref?: string | null
          hash?: string | null
          id?: string
          payload?: Json
          project_milestone_id?: string
          type?: string
          verification?: Json
          verified?: boolean
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidences_project_milestone_id_fkey"
            columns: ["project_milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_profiles: {
        Row: {
          builder_vs_opportunist_reading: string | null
          competencies: Json
          constraints: Json
          engagement: Json
          internal_objectives: Json
          intrinsic_nature: Json
          mantra: string | null
          project_id: string
          resources: Json
          risk_appetite: string | null
          updated_at: string
          validated_at: string | null
          version: number
        }
        Insert: {
          builder_vs_opportunist_reading?: string | null
          competencies?: Json
          constraints?: Json
          engagement?: Json
          internal_objectives?: Json
          intrinsic_nature?: Json
          mantra?: string | null
          project_id: string
          resources?: Json
          risk_appetite?: string | null
          updated_at?: string
          validated_at?: string | null
          version?: number
        }
        Update: {
          builder_vs_opportunist_reading?: string | null
          competencies?: Json
          constraints?: Json
          engagement?: Json
          internal_objectives?: Json
          intrinsic_nature?: Json
          mantra?: string | null
          project_id?: string
          resources?: Json
          risk_appetite?: string | null
          updated_at?: string
          validated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "founder_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_evaluations: {
        Row: {
          computed_scores: Json
          engine_version_refs: Json
          evaluated_at: string
          facts: Json
          gate_id: string
          id: string
          project_id: string
          solution_paths: Json
          verdict: string
        }
        Insert: {
          computed_scores?: Json
          engine_version_refs?: Json
          evaluated_at?: string
          facts?: Json
          gate_id: string
          id?: string
          project_id: string
          solution_paths?: Json
          verdict: string
        }
        Update: {
          computed_scores?: Json
          engine_version_refs?: Json
          evaluated_at?: string
          facts?: Json
          gate_id?: string
          id?: string
          project_id?: string
          solution_paths?: Json
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_evaluations_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gates: {
        Row: {
          code: string
          created_at: string
          critical_floors: Json
          id: string
          milestone_scope: string[]
          name: string
          ref_version_id: string
          threshold: number
          verdict_policy: Json
          weights: Json
        }
        Insert: {
          code: string
          created_at?: string
          critical_floors?: Json
          id?: string
          milestone_scope?: string[]
          name: string
          ref_version_id: string
          threshold: number
          verdict_policy?: Json
          weights?: Json
        }
        Update: {
          code?: string
          created_at?: string
          critical_floors?: Json
          id?: string
          milestone_scope?: string[]
          name?: string
          ref_version_id?: string
          threshold?: number
          verdict_policy?: Json
          weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gates_ref_version_id_fkey"
            columns: ["ref_version_id"]
            isOneToOne: false
            referencedRelation: "referential_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      golden_cases: {
        Row: {
          created_at: string
          expected_qualities: Json
          id: string
          input_fixture: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          expected_qualities?: Json
          id?: string
          input_fixture?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          expected_qualities?: Json
          id?: string
          input_fixture?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      improvement_backlog: {
        Row: {
          created_at: string
          description: string
          id: string
          impact_score: number | null
          signal: string
          status: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          impact_score?: number | null
          signal: string
          status?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          impact_score?: number | null
          signal?: string
          status?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      knowledge_bases: {
        Row: {
          created_at: string
          doc_count: number
          id: string
          project_id: string
          status: string
        }
        Insert: {
          created_at?: string
          doc_count?: number
          id?: string
          project_id: string
          status?: string
        }
        Update: {
          created_at?: string
          doc_count?: number
          id?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          created_at: string
          id: string
          knowledge_base_id: string
          source_ref: string | null
          status: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_base_id: string
          source_ref?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_base_id?: string
          source_ref?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_connections: {
        Row: {
          channel: string
          connected_at: string
          consent_scope: Json
          credential_ref: string | null
          id: string
          owner_org_id: string | null
          owner_user_id: string | null
          provider: string
          status: string
        }
        Insert: {
          channel: string
          connected_at?: string
          consent_scope?: Json
          credential_ref?: string | null
          id?: string
          owner_org_id?: string | null
          owner_user_id?: string | null
          provider: string
          status?: string
        }
        Update: {
          channel?: string
          connected_at?: string
          consent_scope?: Json
          credential_ref?: string | null
          id?: string
          owner_org_id?: string | null
          owner_user_id?: string | null
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_connections_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_connections_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_dependencies: {
        Row: {
          depends_on_milestone_id: string
          hardness: string
          milestone_id: string
        }
        Insert: {
          depends_on_milestone_id: string
          hardness?: string
          milestone_id: string
        }
        Update: {
          depends_on_milestone_id?: string
          hardness?: string
          milestone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_dependencies_depends_on_milestone_id_fkey"
            columns: ["depends_on_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_dependencies_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          branch: string | null
          code: string
          created_at: string
          description: string | null
          flags: Json
          id: string
          irreversible: boolean
          name: string
          phase_id: string
          proof_types_accepted: string[]
          ref_version_id: string
        }
        Insert: {
          branch?: string | null
          code: string
          created_at?: string
          description?: string | null
          flags?: Json
          id?: string
          irreversible?: boolean
          name: string
          phase_id: string
          proof_types_accepted?: string[]
          ref_version_id: string
        }
        Update: {
          branch?: string | null
          code?: string
          created_at?: string
          description?: string | null
          flags?: Json
          id?: string
          irreversible?: boolean
          name?: string
          phase_id?: string
          proof_types_accepted?: string[]
          ref_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_ref_version_id_fkey"
            columns: ["ref_version_id"]
            isOneToOne: false
            referencedRelation: "referential_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          byok_key_ref: string | null
          created_at: string
          id: string
          llm_channel: string
          name: string
          plan: string
          settings: Json
          type: string | null
        }
        Insert: {
          byok_key_ref?: string | null
          created_at?: string
          id?: string
          llm_channel?: string
          name: string
          plan?: string
          settings?: Json
          type?: string | null
        }
        Update: {
          byok_key_ref?: string | null
          created_at?: string
          id?: string
          llm_channel?: string
          name?: string
          plan?: string
          settings?: Json
          type?: string | null
        }
        Relationships: []
      }
      phases: {
        Row: {
          code: string
          created_at: string
          entry_door_variant: string
          id: string
          name: string
          order_hint: number
          ref_version_id: string
        }
        Insert: {
          code: string
          created_at?: string
          entry_door_variant?: string
          id?: string
          name: string
          order_hint: number
          ref_version_id: string
        }
        Update: {
          code?: string
          created_at?: string
          entry_door_variant?: string
          id?: string
          name?: string
          order_hint?: number
          ref_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_ref_version_id_fkey"
            columns: ["ref_version_id"]
            isOneToOne: false
            referencedRelation: "referential_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_journal: {
        Row: {
          actor: string | null
          created_at: string
          digest: string
          event_type: string
          id: string
          payload_ref: string | null
          project_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          digest: string
          event_type: string
          id?: string
          payload_ref?: string | null
          project_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          digest?: string
          event_type?: string
          id?: string
          payload_ref?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_journal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          created_at: string
          done_at: string | null
          forced_reason: string | null
          id: string
          milestone_id: string
          opened_at: string | null
          project_id: string
          quality_score: number | null
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          forced_reason?: string | null
          id?: string
          milestone_id: string
          opened_at?: string | null
          project_id: string
          quality_score?: number | null
          state?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          forced_reason?: string | null
          id?: string
          milestone_id?: string
          opened_at?: string | null
          project_id?: string
          quality_score?: number | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          access_level: string
          access_scope: Json
          ambition_profile: string | null
          created_at: string
          entry_door: string
          gate_mode: string
          geo_lenses: Json
          id: string
          name: string
          org_id: string | null
          owner_user_id: string
          ref_version_id: string
          segment_primary_id: string | null
          segment_secondary_ids: string[]
          status: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          access_scope?: Json
          ambition_profile?: string | null
          created_at?: string
          entry_door: string
          gate_mode?: string
          geo_lenses?: Json
          id?: string
          name: string
          org_id?: string | null
          owner_user_id: string
          ref_version_id: string
          segment_primary_id?: string | null
          segment_secondary_ids?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          access_scope?: Json
          ambition_profile?: string | null
          created_at?: string
          entry_door?: string
          gate_mode?: string
          geo_lenses?: Json
          id?: string
          name?: string
          org_id?: string | null
          owner_user_id?: string
          ref_version_id?: string
          segment_primary_id?: string | null
          segment_secondary_ids?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_ref_version_id_fkey"
            columns: ["ref_version_id"]
            isOneToOne: false
            referencedRelation: "referential_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_segment_primary_id_fkey"
            columns: ["segment_primary_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_reports: {
        Row: {
          created_at: string
          id: string
          improvements: number
          per_engine: Json
          period: string
          regressions_blocked: number
        }
        Insert: {
          created_at?: string
          id?: string
          improvements?: number
          per_engine?: Json
          period: string
          regressions_blocked?: number
        }
        Update: {
          created_at?: string
          id?: string
          improvements?: number
          per_engine?: Json
          period?: string
          regressions_blocked?: number
        }
        Relationships: []
      }
      referential_versions: {
        Row: {
          activated_at: string | null
          changelog: string | null
          created_at: string
          id: string
          semver: string
          status: string
        }
        Insert: {
          activated_at?: string | null
          changelog?: string | null
          created_at?: string
          id?: string
          semver: string
          status?: string
        }
        Update: {
          activated_at?: string | null
          changelog?: string | null
          created_at?: string
          id?: string
          semver?: string
          status?: string
        }
        Relationships: []
      }
      reserves: {
        Row: {
          created_at: string
          description: string
          due_gate_code: string | null
          gate_evaluation_id: string
          id: string
          lift_action: string | null
          status: string
          vector: string
        }
        Insert: {
          created_at?: string
          description: string
          due_gate_code?: string | null
          gate_evaluation_id: string
          id?: string
          lift_action?: string | null
          status?: string
          vector: string
        }
        Update: {
          created_at?: string
          description?: string
          due_gate_code?: string | null
          gate_evaluation_id?: string
          id?: string
          lift_action?: string | null
          status?: string
          vector?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserves_gate_evaluation_id_fkey"
            columns: ["gate_evaluation_id"]
            isOneToOne: false
            referencedRelation: "gate_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      segment_milestone_overrides: {
        Row: {
          action: string
          created_at: string
          id: string
          milestone_id: string | null
          payload: Json
          segment_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          milestone_id?: string | null
          payload?: Json
          segment_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          milestone_id?: string | null
          payload?: Json
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_milestone_overrides_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_milestone_overrides_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          code: string
          config: Json
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      usage_quotas: {
        Row: {
          consumed: Json
          credit_balance: number
          id: string
          included: Json
          module_code: string
          project_id: string
          updated_at: string
        }
        Insert: {
          consumed?: Json
          credit_balance?: number
          id?: string
          included?: Json
          module_code: string
          project_id: string
          updated_at?: string
        }
        Update: {
          consumed?: Json
          credit_balance?: number
          id?: string
          included?: Json
          module_code?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_quotas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_ref: string | null
          created_at: string
          id: string
          profile: Json
        }
        Insert: {
          auth_ref?: string | null
          created_at?: string
          id?: string
          profile?: Json
        }
        Update: {
          auth_ref?: string | null
          created_at?: string
          id?: string
          profile?: Json
        }
        Relationships: []
      }
      watch_alerts: {
        Row: {
          created_at: string
          delivered_at: string | null
          feed_id: string
          id: string
          project_id: string | null
          relevance_score: number | null
          summary: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          feed_id: string
          id?: string
          project_id?: string | null
          relevance_score?: number | null
          summary: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          feed_id?: string
          id?: string
          project_id?: string | null
          relevance_score?: number | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_alerts_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "watch_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_feeds: {
        Row: {
          config: Json
          created_at: string
          id: string
          schedule: string
          scope: string
          source: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          schedule: string
          scope: string
          source: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          schedule?: string
          scope?: string
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ftg_can_access_project: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      ftg_current_user_id: { Args: never; Returns: string }
      ftg_is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      ftg_is_org_member_of_project: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      ftg_is_project_owner: { Args: { p_project_id: string }; Returns: boolean }
      promote_engine_version: {
        Args: {
          p_actor_label: string
          p_regression_ok?: boolean
          p_smoke_details?: Json
          p_smoke_passed: boolean
          p_version_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
