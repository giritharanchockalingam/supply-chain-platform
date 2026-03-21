'use client';

import { useState } from 'react';
import {
  Layers, Target, Building2, Server, Database, Globe, Shield, Zap,
  ChevronRight, CheckCircle, Clock, Circle, ExternalLink,
  GitBranch, BarChart3, MessageSquare, Monitor, FileText,
  Cpu, Lock, Eye, Palette, Brain, Package, Truck, LineChart,
  ArrowRight, Boxes, Network, Cloud, Workflow
} from 'lucide-react';

// ==================== ADM PHASES ====================
type ADMPhase = {
  id: string;
  phase: string;
  title: string;
  status: 'complete' | 'in_progress' | 'planned';
  description: string;
  artifacts: string[];
  domain: 'vision' | 'business' | 'information' | 'technology' | 'opportunities' | 'migration' | 'governance' | 'change';
  color: string;
};

const admPhases: ADMPhase[] = [
  {
    id: 'preliminary', phase: 'Preliminary', title: 'Architecture Framework & Principles',
    status: 'complete', domain: 'vision', color: 'from-violet-500 to-purple-600',
    description: 'Established TOGAF-aligned framework for supply chain digital transformation. Defined architecture principles, governance model, and stakeholder map.',
    artifacts: ['Architecture Principles Catalog', 'Stakeholder Map', 'Governance Framework', 'Tool & Method Selection'],
  },
  {
    id: 'phase-a', phase: 'Phase A', title: 'Architecture Vision',
    status: 'complete', domain: 'vision', color: 'from-blue-500 to-indigo-600',
    description: 'Unified yard management and demand planning under a single AI-driven command center. Vision: real-time visibility, predictive operations, zero-touch automation.',
    artifacts: ['Architecture Vision Document', 'Value Chain Diagram', 'Solution Concept Diagram', 'Business Capability Map'],
  },
  {
    id: 'phase-b', phase: 'Phase B', title: 'Business Architecture',
    status: 'complete', domain: 'business', color: 'from-emerald-500 to-teal-600',
    description: 'Modeled yard operations (gate-to-dock flow, priority engine, exception handling) and demand planning (forecast, replenish, ingest) as connected business processes.',
    artifacts: ['Business Process Model', 'Use Case Catalog', 'Actor/Role Matrix', 'Business Service Map'],
  },
  {
    id: 'phase-c-app', phase: 'Phase C', title: 'Application Architecture',
    status: 'complete', domain: 'information', color: 'from-cyan-500 to-blue-600',
    description: 'Next.js 16 App Router SPA with MCP-based AI orchestration (31 tools), multi-LLM routing (Claude/OpenAI/Groq), and domain-specific components.',
    artifacts: ['Application Portfolio Catalog', 'Interface Catalog', 'Application Communication Diagram', 'MCP Tool Registry'],
  },
  {
    id: 'phase-c-data', phase: 'Phase C', title: 'Data Architecture',
    status: 'complete', domain: 'information', color: 'from-amber-500 to-orange-600',
    description: 'Supabase PostgreSQL with supply_chain schema (21+ tables), pgvector for RAG embeddings, PostgREST API layer, and real-time subscriptions.',
    artifacts: ['Data Entity/Relationship Diagram', 'Data Migration Diagram', 'Data Lifecycle Catalog', 'Schema Definition (DDL)'],
  },
  {
    id: 'phase-d', phase: 'Phase D', title: 'Technology Architecture',
    status: 'complete', domain: 'technology', color: 'from-rose-500 to-pink-600',
    description: 'Vercel Edge Network for global CDN, Supabase cloud for managed Postgres + Auth + Storage, multi-provider LLM inference with circuit breaker failover.',
    artifacts: ['Technology Standards Catalog', 'Platform Decomposition Diagram', 'Infrastructure Topology', 'Network & Comms Diagram'],
  },
  {
    id: 'phase-e', phase: 'Phase E', title: 'Opportunities & Solutions',
    status: 'in_progress', domain: 'opportunities', color: 'from-yellow-500 to-amber-600',
    description: 'Evaluating IoT gate sensors, autonomous dock assignment, and predictive demand signals from EDI/POS feeds as next-phase capabilities.',
    artifacts: ['Consolidated Gap Analysis', 'Solution Building Blocks', 'Interoperability Matrix', 'Implementation Factor Catalog'],
  },
  {
    id: 'phase-f', phase: 'Phase F', title: 'Migration Planning',
    status: 'in_progress', domain: 'migration', color: 'from-lime-500 to-green-600',
    description: 'Phased rollout: MVP (current), Phase 2 (real-time IoT + WMS), Phase 3 (multi-DC federation + ML models). Transition architecture defined.',
    artifacts: ['Architecture Roadmap', 'Transition Architecture', 'Implementation & Migration Plan', 'Risk Register'],
  },
  {
    id: 'phase-g', phase: 'Phase G', title: 'Implementation Governance',
    status: 'planned', domain: 'governance', color: 'from-slate-500 to-gray-600',
    description: 'Planned: architecture compliance reviews, deployment gates, security audits, and performance benchmarking across all platform releases.',
    artifacts: ['Architecture Contract', 'Compliance Assessment', 'Change Request Log', 'Implementation Governance Model'],
  },
];

// ==================== INTEGRATION CATALOG ====================
type IntegrationStatus = 'connected' | 'available' | 'coming_soon' | 'placeholder';

type Integration = {
  name: string;
  description: string;
  status: IntegrationStatus;
  tier: 'Free' | 'Freemium' | 'Paid' | 'Enterprise' | 'Built-in';
  capabilities: string[];
  category: string;
  url?: string;
};

const integrationCategories = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'data-platform', label: 'Data Platform', icon: Database },
  { id: 'ai-ml', label: 'AI / ML', icon: Brain },
  { id: 'supply-chain', label: 'Supply Chain', icon: Truck },
  { id: 'cloud-infra', label: 'Cloud & Infra', icon: Cloud },
  { id: 'devops', label: 'DevOps & CI/CD', icon: GitBranch },
  { id: 'monitoring', label: 'Monitoring', icon: Monitor },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'erp-wms', label: 'ERP & WMS', icon: Building2 },
  { id: 'analytics', label: 'Analytics & BI', icon: BarChart3 },
];

const integrations: Integration[] = [
  // Data Platform
  { name: 'Supabase', description: 'Managed PostgreSQL with PostgREST API, real-time subscriptions, pgvector for RAG embeddings', status: 'connected', tier: 'Freemium', capabilities: ['PostgreSQL', 'Real-time', 'Vector Search', 'Auth'], category: 'data-platform', url: 'https://supabase.com' },
  { name: 'Apache Kafka', description: 'Distributed event streaming for real-time yard events, WMS signals, and IoT telemetry', status: 'coming_soon', tier: 'Enterprise', capabilities: ['Event Streaming', 'Pub/Sub', 'Replay', 'Partitioning'], category: 'data-platform' },
  { name: 'Snowflake', description: 'Cloud data warehouse for historical analytics, demand modeling, and forecast training data', status: 'placeholder', tier: 'Enterprise', capabilities: ['Data Warehouse', 'Time Travel', 'Data Sharing', 'ML Features'], category: 'data-platform' },
  { name: 'Redis', description: 'In-memory cache for session state, real-time truck positions, and LLM response caching', status: 'available', tier: 'Freemium', capabilities: ['Caching', 'Pub/Sub', 'Geo Queries', 'Rate Limiting'], category: 'data-platform' },

  // AI / ML
  { name: 'Anthropic Claude', description: 'Primary LLM for complex supply chain queries, exception analysis, and multi-step reasoning', status: 'connected', tier: 'Freemium', capabilities: ['Complex Reasoning', 'Tool Use', 'Long Context', 'Code Gen'], category: 'ai-ml', url: 'https://anthropic.com' },
  { name: 'OpenAI GPT-4o', description: 'Secondary LLM for medium-complexity queries, summaries, and structured data extraction', status: 'connected', tier: 'Freemium', capabilities: ['Chat', 'Function Calling', 'Vision', 'Embeddings'], category: 'ai-ml', url: 'https://openai.com' },
  { name: 'Groq (LPU)', description: 'Ultra-fast inference for simple queries, real-time suggestions, and high-throughput operations', status: 'connected', tier: 'Free', capabilities: ['Fast Inference', 'Low Latency', 'Streaming', 'OpenAI Compatible'], category: 'ai-ml', url: 'https://groq.com' },
  { name: 'Google Gemini', description: 'Multimodal AI for dock image analysis, document OCR, and camera feed processing', status: 'available', tier: 'Free', capabilities: ['Multimodal', 'Vision', 'Code Gen', 'Long Context'], category: 'ai-ml' },
  { name: 'Mistral AI', description: 'Open-weight models for on-premise deployment, data-sovereign customers, and edge inference', status: 'placeholder', tier: 'Free', capabilities: ['Code Generation', 'On-Premise', 'Open Weights', 'Fast'], category: 'ai-ml' },

  // Supply Chain
  { name: 'MCP Yard Server', description: 'Model Context Protocol server with 17 tools for truck, dock, gate, and exception management', status: 'connected', tier: 'Built-in', capabilities: ['Truck Status', 'Dock Assignment', 'Gate Events', 'Yard Metrics'], category: 'supply-chain' },
  { name: 'MCP Planning Server', description: 'Model Context Protocol server with 14 tools for forecasts, replenishment, inventory, and ingestion', status: 'connected', tier: 'Built-in', capabilities: ['Forecasts', 'Replenishment', 'Inventory Signals', 'Planning Metrics'], category: 'supply-chain' },
  { name: 'EDI Gateway (X12)', description: 'ANSI X12 EDI translator for 850/856/810 transactions with trading partner onboarding', status: 'coming_soon', tier: 'Enterprise', capabilities: ['X12 Parsing', 'Partner Setup', 'AS2 Transport', 'Acknowledgments'], category: 'supply-chain' },
  { name: 'IoT Sensor Hub', description: 'Real-time telemetry from gate cameras, reefer temperature probes, and dock sensors', status: 'placeholder', tier: 'Enterprise', capabilities: ['MQTT', 'Camera OCR', 'Temperature', 'Proximity'], category: 'supply-chain' },

  // Cloud & Infra
  { name: 'Vercel', description: 'Edge deployment platform with global CDN, serverless functions, and instant rollbacks', status: 'connected', tier: 'Freemium', capabilities: ['Edge CDN', 'Serverless', 'Preview Deploys', 'Analytics'], category: 'cloud-infra', url: 'https://vercel.com' },
  { name: 'AWS', description: 'Amazon Web Services for S3 storage, Lambda functions, and SQS message queuing', status: 'available', tier: 'Paid', capabilities: ['S3', 'Lambda', 'SQS', 'CloudWatch'], category: 'cloud-infra' },
  { name: 'GCP Cloud Run', description: 'Google Cloud for containerized microservices, Cloud Build, and BigQuery analytics', status: 'placeholder', tier: 'Freemium', capabilities: ['Containers', 'Cloud Build', 'BigQuery', 'Pub/Sub'], category: 'cloud-infra' },

  // DevOps
  { name: 'GitHub', description: 'Source control, pull requests, GitHub Actions CI/CD, and issue tracking', status: 'connected', tier: 'Free', capabilities: ['Git Repos', 'Pull Requests', 'Actions CI/CD', 'Issues'], category: 'devops', url: 'https://github.com' },
  { name: 'Jenkins', description: 'Self-hosted CI/CD for enterprise build pipelines and multi-stage deployments', status: 'available', tier: 'Free', capabilities: ['Build Pipelines', 'Multi-Stage', 'Plugin Ecosystem', 'Distributed'], category: 'devops' },
  { name: 'ArgoCD', description: 'GitOps continuous delivery for Kubernetes-based supply chain microservices', status: 'placeholder', tier: 'Free', capabilities: ['GitOps', 'K8s Deploy', 'Sync Policies', 'Rollbacks'], category: 'devops' },

  // Monitoring
  { name: 'Vercel Analytics', description: 'Built-in web vitals, performance metrics, and audience insights', status: 'connected', tier: 'Freemium', capabilities: ['Web Vitals', 'Performance', 'Audience', 'Real User Monitoring'], category: 'monitoring' },
  { name: 'Datadog', description: 'Full-stack observability with APM, log management, infrastructure monitoring', status: 'coming_soon', tier: 'Paid', capabilities: ['APM', 'Logs', 'Dashboards', 'Alerts'], category: 'monitoring' },
  { name: 'Grafana + Prometheus', description: 'Open-source metrics visualization and alerting for yard operations SLAs', status: 'available', tier: 'Free', capabilities: ['Dashboards', 'Alerts', 'PromQL', 'Annotations'], category: 'monitoring' },
  { name: 'PagerDuty', description: 'Incident management and on-call scheduling for critical supply chain disruptions', status: 'placeholder', tier: 'Paid', capabilities: ['Incidents', 'On-Call', 'Escalation', 'Runbooks'], category: 'monitoring' },

  // Communication
  { name: 'Activity Feed', description: 'Built-in real-time notifications for truck arrivals, exceptions, forecast alerts', status: 'connected', tier: 'Built-in', capabilities: ['Real-time', 'Truck Alerts', 'Exception Alerts', 'Forecast Alerts'], category: 'communication' },
  { name: 'Slack', description: 'Team messaging with channels for yard ops, planning, and automated alert routing', status: 'available', tier: 'Freemium', capabilities: ['Channels', 'Webhooks', 'Bot Commands', 'Threads'], category: 'communication' },
  { name: 'Microsoft Teams', description: 'Enterprise communication for multi-DC coordination and management reporting', status: 'coming_soon', tier: 'Paid', capabilities: ['Channels', 'Chat', 'Meetings', 'Adaptive Cards'], category: 'communication' },

  // Security
  { name: 'Supabase Auth (RLS)', description: 'Row-level security with role-based access control for multi-tenant operations', status: 'connected', tier: 'Built-in', capabilities: ['RLS Policies', 'JWT Auth', 'MFA', 'SSO'], category: 'security' },
  { name: 'Snyk', description: 'Dependency vulnerability scanning, container scanning, and license compliance', status: 'available', tier: 'Freemium', capabilities: ['Dependency Scan', 'Container Scan', 'IaC Scan', 'License'], category: 'security' },
  { name: 'Vault (HashiCorp)', description: 'Secrets management for API keys, DB credentials, and service-to-service auth tokens', status: 'placeholder', tier: 'Enterprise', capabilities: ['Secret Storage', 'Dynamic Secrets', 'PKI', 'Encryption'], category: 'security' },

  // ERP & WMS
  { name: 'SAP ERP', description: 'Enterprise resource planning integration for purchase orders, material masters, and financials', status: 'placeholder', tier: 'Enterprise', capabilities: ['Purchase Orders', 'Material Master', 'Financials', 'RFC/BAPI'], category: 'erp-wms' },
  { name: 'Manhattan WMS', description: 'Warehouse management for receiving, putaway, pick/pack, and shipment confirmation', status: 'placeholder', tier: 'Enterprise', capabilities: ['Receiving', 'Putaway', 'Pick/Pack', 'Shipping'], category: 'erp-wms' },
  { name: 'Blue Yonder TMS', description: 'Transportation management for carrier selection, route optimization, and freight audit', status: 'placeholder', tier: 'Enterprise', capabilities: ['Carrier Select', 'Route Optimize', 'Freight Audit', 'Visibility'], category: 'erp-wms' },

  // Analytics
  { name: 'Recharts (Built-in)', description: 'React charting library for real-time yard dashboards, throughput charts, and forecast visualizations', status: 'connected', tier: 'Built-in', capabilities: ['Bar Charts', 'Line Charts', 'Area Charts', 'Composable'], category: 'analytics' },
  { name: 'Power BI', description: 'Microsoft business intelligence for executive dashboards and cross-DC reporting', status: 'available', tier: 'Paid', capabilities: ['Dashboards', 'DAX Measures', 'Embedded Reports', 'Row-Level Security'], category: 'analytics' },
  { name: 'Tableau', description: 'Advanced analytics and data visualization for supply chain performance optimization', status: 'placeholder', tier: 'Enterprise', capabilities: ['Visualizations', 'Data Prep', 'Predictions', 'Embedded'], category: 'analytics' },
];

// ==================== COMPONENT ====================
export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'adm' | 'integrations' | 'diagrams'>('overview');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [integrationFilter, setIntegrationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IntegrationStatus>('all');

  const completedPhases = admPhases.filter(p => p.status === 'complete').length;
  const inProgressPhases = admPhases.filter(p => p.status === 'in_progress').length;
  const totalIntegrations = integrations.length;
  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status === 'available').length;
  const comingSoonCount = integrations.filter(i => i.status === 'coming_soon').length;

  const filteredIntegrations = integrations.filter(i => {
    const catMatch = integrationFilter === 'all' || i.category === integrationFilter;
    const statusMatch = statusFilter === 'all' || i.status === statusFilter;
    return catMatch && statusMatch;
  });

  const statusBadge = (status: ADMPhase['status']) => {
    switch (status) {
      case 'complete': return <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold"><CheckCircle size={14} /> Complete</span>;
      case 'in_progress': return <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold"><Clock size={14} /> In Progress</span>;
      case 'planned': return <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold"><Circle size={14} /> Planned</span>;
    }
  };

  const integrationStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Connected</span>;
      case 'available': return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">Available</span>;
      case 'coming_soon': return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">Coming Soon</span>;
      case 'placeholder': return <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full border border-slate-500/30">Placeholder</span>;
    }
  };

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'Free': 'text-emerald-300', 'Freemium': 'text-blue-300', 'Paid': 'text-amber-300',
      'Enterprise': 'text-purple-300', 'Built-in': 'text-cyan-300',
    };
    return <span className={`text-[10px] font-bold uppercase tracking-wider ${colors[tier] || 'text-slate-400'}`}>{tier}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Enterprise Architecture
              </h1>
              <p className="text-slate-400 text-sm">TOGAF ADM — Supply Chain Command Center</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: 'ADM Phases', value: `${completedPhases}/9`, sub: 'Complete', color: 'from-emerald-500 to-green-600' },
              { label: 'In Progress', value: inProgressPhases, sub: 'Phases', color: 'from-amber-500 to-orange-600' },
              { label: 'Integrations', value: totalIntegrations, sub: 'Total', color: 'from-blue-500 to-indigo-600' },
              { label: 'Connected', value: connectedCount, sub: 'Live', color: 'from-cyan-500 to-teal-600' },
              { label: 'ADRs', value: 6, sub: 'Decisions', color: 'from-purple-500 to-violet-600' },
              { label: 'Diagrams', value: 4, sub: 'Domains', color: 'from-rose-500 to-pink-600' },
            ].map((stat, i) => (
              <div key={i} className="flex-1 min-w-[140px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'adm', label: 'ADM Tracker', icon: Workflow },
            { id: 'integrations', label: 'Integrations', icon: Network },
            { id: 'diagrams', label: 'Diagrams', icon: Boxes },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Architecture Vision Card */}
            <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Target size={20} className="text-blue-400" />
                Architecture Vision
              </h2>
              <p className="text-slate-300 leading-relaxed max-w-3xl">
                A unified, AI-driven supply chain command center that provides real-time yard visibility,
                predictive demand planning, and autonomous operational decision-making. The platform integrates
                multi-LLM intelligence (Claude, GPT-4o, Groq) with domain-specific MCP tools to deliver
                actionable insights across the entire distribution center lifecycle — from gate check-in
                through dock operations to replenishment execution.
              </p>
              <div className="flex gap-6 mt-6">
                {['Yard Management', 'Demand Planning', 'AI Intelligence', 'Integration Hub'].map((cap, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-blue-300">
                    <ChevronRight size={14} />
                    {cap}
                  </div>
                ))}
              </div>
            </div>

            {/* ADM Phase Ring */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-slate-200">ADM Phase Progress</h2>
              <div className="grid grid-cols-3 lg:grid-cols-9 gap-3">
                {admPhases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => { setSelectedPhase(phase.id); setActiveTab('adm'); }}
                    className={`relative group bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 ${
                      phase.status === 'complete' ? 'ring-1 ring-emerald-500/30' :
                      phase.status === 'in_progress' ? 'ring-1 ring-amber-500/30' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center mb-2 shadow-lg`}>
                      {phase.status === 'complete' ? <CheckCircle size={18} /> :
                       phase.status === 'in_progress' ? <Clock size={18} /> :
                       <Circle size={18} />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{phase.phase}</p>
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{phase.title}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Coverage */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-slate-200">Integration Coverage</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Connected', count: connectedCount, total: totalIntegrations, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { label: 'Available', count: availableCount, total: totalIntegrations, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'Coming Soon', count: comingSoonCount, total: totalIntegrations, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                  { label: 'Placeholder', count: totalIntegrations - connectedCount - availableCount - comingSoonCount, total: totalIntegrations, color: 'from-slate-500 to-gray-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-5 backdrop-blur-sm`}>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{item.label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.count}</span>
                      <span className="text-slate-500 text-sm">/ {item.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all`}
                        style={{ width: `${(item.count / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Domains */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-slate-200">Architecture Domains</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { domain: 'Business', icon: Building2, color: 'from-emerald-500 to-teal-600', desc: 'Yard operations value stream, demand planning processes, gate-to-dock workflows, and exception handling procedures.', artifacts: 4 },
                  { domain: 'Application', icon: Boxes, color: 'from-cyan-500 to-blue-600', desc: 'Next.js 16 SPA, MCP AI Orchestrator (31 tools), multi-LLM routing, and domain component library.', artifacts: 4 },
                  { domain: 'Data', icon: Database, color: 'from-amber-500 to-orange-600', desc: 'Supabase PostgreSQL (21+ tables), supply_chain schema, pgvector embeddings, and PostgREST API layer.', artifacts: 4 },
                  { domain: 'Technology', icon: Server, color: 'from-rose-500 to-pink-600', desc: 'Vercel Edge CDN, Supabase Cloud, multi-provider LLM inference, and CI/CD pipeline with GitHub Actions.', artifacts: 4 },
                ].map((d, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-gradient-to-br ${d.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                        <d.icon size={22} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{d.domain} Architecture</h3>
                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{d.desc}</p>
                        <p className="text-xs text-slate-500 mt-2">{d.artifacts} artifacts defined</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ADM TRACKER TAB ==================== */}
        {activeTab === 'adm' && (
          <div className="space-y-4">
            {admPhases.map((phase) => (
              <div
                key={phase.id}
                className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all ${
                  selectedPhase === phase.id ? 'ring-1 ring-blue-500/50' : ''
                }`}
              >
                <button
                  onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    {phase.status === 'complete' ? <CheckCircle size={20} /> :
                     phase.status === 'in_progress' ? <Clock size={20} /> :
                     <Circle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 uppercase">{phase.phase}</span>
                      {statusBadge(phase.status)}
                    </div>
                    <h3 className="font-bold text-white mt-0.5">{phase.title}</h3>
                  </div>
                  <div className="text-xs text-slate-500">{phase.artifacts.length} artifacts</div>
                  <ChevronRight size={18} className={`text-slate-500 transition-transform ${selectedPhase === phase.id ? 'rotate-90' : ''}`} />
                </button>

                {selectedPhase === phase.id && (
                  <div className="border-t border-white/10 p-5 bg-white/[0.02]">
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{phase.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {phase.artifacts.map((artifact, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 rounded-lg px-3 py-2">
                          <FileText size={14} className="text-blue-400 flex-shrink-0" />
                          {artifact}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ==================== INTEGRATIONS TAB ==================== */}
        {activeTab === 'integrations' && (
          <div className="flex gap-6">
            {/* Category Sidebar */}
            <div className="w-56 flex-shrink-0 space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Categories</h3>
              {integrationCategories.map(cat => {
                const count = cat.id === 'all' ? integrations.length : integrations.filter(i => i.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setIntegrationFilter(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      integrationFilter === cat.id
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <cat.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                );
              })}

              <div className="border-t border-white/10 mt-4 pt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Status</h3>
                {[
                  { id: 'all', label: 'All Status', count: totalIntegrations },
                  { id: 'connected', label: 'Connected', count: connectedCount },
                  { id: 'available', label: 'Available', count: availableCount },
                  { id: 'coming_soon', label: 'Coming Soon', count: comingSoonCount },
                  { id: 'placeholder', label: 'Placeholder', count: totalIntegrations - connectedCount - availableCount - comingSoonCount },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id as typeof statusFilter)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      statusFilter === s.id
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex-1 text-left">{s.label}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{s.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Cards */}
            <div className="flex-1 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredIntegrations.map((integ, i) => (
                <div key={i} className={`bg-white/5 border rounded-xl p-5 backdrop-blur-sm transition-all hover:bg-white/8 hover:scale-[1.02] ${
                  integ.status === 'connected' ? 'border-emerald-500/20' :
                  integ.status === 'available' ? 'border-blue-500/20' :
                  'border-white/10'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {integ.name}
                        {integ.url && <ExternalLink size={12} className="text-slate-500" />}
                      </h3>
                      {tierBadge(integ.tier)}
                    </div>
                    {integrationStatusBadge(integ.status)}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{integ.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {integ.capabilities.map((cap, j) => (
                      <span key={j} className="px-2 py-0.5 bg-white/5 text-[10px] text-slate-300 rounded-md border border-white/10">{cap}</span>
                    ))}
                  </div>
                  {integ.status === 'connected' && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Zap size={10} /> Live</span>
                      <button className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">Disconnect</button>
                    </div>
                  )}
                  {integ.status === 'available' && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <button className="w-full text-xs font-medium bg-blue-600/20 text-blue-300 rounded-lg py-1.5 hover:bg-blue-600/30 transition-colors border border-blue-500/30">
                        Configure & Connect
                      </button>
                    </div>
                  )}
                  {(integ.status === 'coming_soon' || integ.status === 'placeholder') && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-[10px] text-slate-500 text-center">
                        {integ.status === 'coming_soon' ? 'Coming in a future release' : 'Planned for Phase 3'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== DIAGRAMS TAB ==================== */}
        {activeTab === 'diagrams' && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              {['All', 'Business', 'Application', 'Data', 'Technology'].map(domain => (
                <button
                  key={domain}
                  className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  {domain}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  domain: 'Business',
                  title: 'Supply Chain Value Stream',
                  phase: 'Phase B',
                  desc: 'End-to-end value delivery from gate arrival through dock operations to replenishment execution',
                  color: 'from-emerald-500 to-teal-600',
                  icon: Building2,
                  diagram: (
                    <svg viewBox="0 0 1000 300" className="w-full h-auto">
                      <defs>
                        <linearGradient id="businessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#0d9488" />
                        </linearGradient>
                        <filter id="shadow">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                        </filter>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                        </marker>
                      </defs>

                      {/* Main flow boxes */}
                      {[
                        { x: 50, label: 'Gate\nCheck-In' },
                        { x: 200, label: 'Priority\nEngine' },
                        { x: 350, label: 'Dock\nAssignment' },
                        { x: 500, label: 'Unloading' },
                        { x: 650, label: 'WMS\nConfirm' },
                        { x: 800, label: 'Departure' }
                      ].map((box, i) => (
                        <g key={i}>
                          <rect x={box.x} y="40" width="120" height="80" rx="8" fill="url(#businessGrad)" filter="url(#shadow)" opacity="0.9" />
                          <text x={box.x + 60} y="90" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{box.label}</text>
                        </g>
                      ))}

                      {/* Connecting arrows */}
                      {[50, 200, 350, 500, 650].map((x, i) => (
                        <line key={`arrow-${i}`} x1={x + 120} y1="80" x2={x + 140} y2="80" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      ))}

                      {/* Bottom flow - Exception & AI */}
                      <g>
                        <rect x="50" y="180" width="120" height="80" rx="8" fill="url(#businessGrad)" filter="url(#shadow)" opacity="0.9" />
                        <text x="110" y="225" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Exception\nEngine</text>
                      </g>

                      <g>
                        <rect x="650" y="180" width="120" height="80" rx="8" fill="url(#businessGrad)" filter="url(#shadow)" opacity="0.9" />
                        <text x="710" y="225" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">AI Command\nCenter</text>
                      </g>

                      {/* Vertical connectors */}
                      <line x1="110" y1="120" x2="110" y2="180" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      <line x1="710" y1="120" x2="710" y2="180" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    </svg>
                  )
                },
                {
                  domain: 'Application',
                  title: 'Platform Application Architecture',
                  phase: 'Phase C',
                  desc: 'Next.js SPA with MCP orchestration layer, multi-LLM routing, and domain service components',
                  color: 'from-cyan-500 to-blue-600',
                  icon: Boxes,
                  diagram: (
                    <svg viewBox="0 0 1000 400" className="w-full h-auto">
                      <defs>
                        <linearGradient id="appGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <filter id="shadow2">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                        </filter>
                        <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                        </marker>
                      </defs>

                      {/* Next.js App Router - top layer */}
                      <rect x="100" y="20" width="800" height="80" rx="8" fill="url(#appGrad)" filter="url(#shadow2)" opacity="0.85" />
                      <text x="500" y="55" textAnchor="middle" fill="white" fontSize="15" fontWeight="700">Next.js 16 App Router</text>

                      {/* Module boxes */}
                      {[
                        { x: 150, label: 'Yard\nModule' },
                        { x: 400, label: 'Planning\nModule' },
                        { x: 650, label: 'AI Command\nCenter' }
                      ].map((box, i) => (
                        <g key={i}>
                          <rect x={box.x} y="110" width="120" height="70" rx="6" fill="url(#appGrad)" filter="url(#shadow2)" opacity="0.75" />
                          <text x={box.x + 60} y="150" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{box.label}</text>
                        </g>
                      ))}

                      {/* Connectors down from modules */}
                      {[210, 460, 710].map((x, i) => (
                        <line key={`down-${i}`} x1={x} y1="180" x2={x} y2="210" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                      ))}

                      {/* MCP Orchestrator */}
                      <rect x="200" y="210" width="600" height="90" rx="8" fill="url(#appGrad)" filter="url(#shadow2)" opacity="0.9" />
                      <text x="500" y="245" textAnchor="middle" fill="white" fontSize="15" fontWeight="700">MCP Orchestrator</text>
                      <text x="500" y="270" textAnchor="middle" fill="white" fontSize="12" opacity="0.9">(31 Tools)</text>

                      {/* LLM Provider boxes */}
                      {[
                        { x: 150, label: 'Claude' },
                        { x: 400, label: 'GPT-4o' },
                        { x: 650, label: 'Groq' }
                      ].map((box, i) => (
                        <g key={i}>
                          <line x1={box.x + 60} y1="300" x2={box.x + 60} y2="330" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                          <rect x={box.x} y="330" width="120" height="60" rx="6" fill="url(#appGrad)" filter="url(#shadow2)" opacity="0.85" />
                          <text x={box.x + 60} y="365" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{box.label}</text>
                        </g>
                      ))}
                    </svg>
                  )
                },
                {
                  domain: 'Data',
                  title: 'Supply Chain Data Model',
                  phase: 'Phase C',
                  desc: 'PostgreSQL supply_chain schema with 21+ tables, pgvector embeddings, and PostgREST API',
                  color: 'from-amber-500 to-orange-600',
                  icon: Database,
                  diagram: (
                    <svg viewBox="0 0 1000 380" className="w-full h-auto">
                      <defs>
                        <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                        <filter id="shadow3">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                        </filter>
                        <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                        </marker>
                      </defs>

                      {/* Top row */}
                      {[
                        { x: 100, label: 'distribution\n_centers' },
                        { x: 380, label: 'docks\n(dock_number)' },
                        { x: 660, label: 'trucks\n(license_plate)' }
                      ].map((box, i) => (
                        <g key={i}>
                          <rect x={box.x} y="20" width="140" height="80" rx="6" fill="url(#dataGrad)" filter="url(#shadow3)" opacity="0.85" />
                          <text x={box.x + 70} y="65" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{box.label}</text>
                          {i < 2 && <line x1={box.x + 140} y1="60" x2={box.x + 160} y2="60" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead3)" />}
                        </g>
                      ))}

                      {/* Middle row */}
                      {[
                        { x: 100, label: 'products\n(sku, name)' },
                        { x: 380, label: 'forecasts\n(forecast_qty)' },
                        { x: 660, label: 'bills_of_lading\n(bol_number)' }
                      ].map((box, i) => (
                        <g key={i}>
                          <rect x={box.x} y="180" width="140" height="80" rx="6" fill="url(#dataGrad)" filter="url(#shadow3)" opacity="0.85" />
                          <text x={box.x + 70} y="225" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{box.label}</text>
                          {i < 2 && <line x1={box.x + 140} y1="220" x2={box.x + 160} y2="220" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead3)" />}
                        </g>
                      ))}

                      {/* Connections from top to middle */}
                      <line x1="240" y1="100" x2="150" y2="180" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead3)" />
                      <line x1="730" y1="100" x2="730" y2="180" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead3)" />

                      {/* Bottom row */}
                      {[
                        { x: 100, label: 'replenishments\n(recommended_qty)' },
                        { x: 380, label: 'inventory\n_signals\n(on_hand_qty)' },
                        { x: 660, label: 'yard_exceptions\n(exception_type)' }
                      ].map((box, i) => (
                        <g key={i}>
                          <rect x={box.x} y="320" width="140" height="80" rx="6" fill="url(#dataGrad)" filter="url(#shadow3)" opacity="0.85" />
                          <text x={box.x + 70} y="368" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{box.label}</text>
                        </g>
                      ))}

                      {/* Connections from middle to bottom */}
                      <line x1="170" y1="260" x2="170" y2="320" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead3)" />
                      <line x1="450" y1="260" x2="450" y2="320" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead3)" />
                    </svg>
                  )
                },
                {
                  domain: 'Technology',
                  title: 'Platform Decomposition',
                  phase: 'Phase D',
                  desc: 'Vercel Edge + Supabase Cloud + Multi-LLM Provider architecture with CI/CD pipeline',
                  color: 'from-rose-500 to-pink-600',
                  icon: Server,
                  diagram: (
                    <svg viewBox="0 0 1000 380" className="w-full h-auto">
                      <defs>
                        <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <filter id="shadow4">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                        </filter>
                        <marker id="arrowhead4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                        </marker>
                      </defs>

                      {/* Tier 1 - Client */}
                      <rect x="80" y="20" width="180" height="80" rx="6" fill="url(#techGrad)" filter="url(#shadow4)" opacity="0.85" />
                      <text x="170" y="45" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">Client Tier</text>
                      <text x="170" y="65" textAnchor="middle" fill="white" fontSize="11">Browser (React)</text>
                      <text x="170" y="82" textAnchor="middle" fill="white" fontSize="11">Tailwind + Charts</text>

                      {/* Tier 2 - Edge */}
                      <rect x="380" y="20" width="180" height="80" rx="6" fill="url(#techGrad)" filter="url(#shadow4)" opacity="0.85" />
                      <text x="470" y="45" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">Edge Tier</text>
                      <text x="470" y="65" textAnchor="middle" fill="white" fontSize="11">Vercel Edge CDN</text>
                      <text x="470" y="82" textAnchor="middle" fill="white" fontSize="11">Serverless Funcs</text>

                      {/* Arrow from Client to Edge */}
                      <line x1="260" y1="60" x2="380" y2="60" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead4)" />

                      {/* Tier 3 - API */}
                      <rect x="80" y="180" width="180" height="80" rx="6" fill="url(#techGrad)" filter="url(#shadow4)" opacity="0.85" />
                      <text x="170" y="205" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">API Tier</text>
                      <text x="170" y="225" textAnchor="middle" fill="white" fontSize="11">PostgREST API</text>
                      <text x="170" y="242" textAnchor="middle" fill="white" fontSize="11">(supply_chain)</text>

                      {/* Tier 4 - AI API */}
                      <rect x="380" y="180" width="180" height="80" rx="6" fill="url(#techGrad)" filter="url(#shadow4)" opacity="0.85" />
                      <text x="470" y="205" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">AI API Routes</text>
                      <text x="470" y="225" textAnchor="middle" fill="white" fontSize="11">/api/ai/chat</text>
                      <text x="470" y="242" textAnchor="middle" fill="white" fontSize="11">Multi-LLM</text>

                      {/* Arrows from Edge/Client down to API */}
                      <line x1="170" y1="100" x2="170" y2="180" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead4)" />
                      <line x1="470" y1="100" x2="470" y2="180" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead4)" />

                      {/* Tier 5 - Database */}
                      <rect x="80" y="340" width="180" height="80" rx="6" fill="url(#techGrad)" filter="url(#shadow4)" opacity="0.85" />
                      <text x="170" y="365" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">Supabase</text>
                      <text x="170" y="385" textAnchor="middle" fill="white" fontSize="11">PostgreSQL</text>
                      <text x="170" y="402" textAnchor="middle" fill="white" fontSize="11">+ pgvector + Auth</text>

                      {/* Tier 6 - LLM */}
                      <rect x="380" y="340" width="180" height="80" rx="6" fill="url(#techGrad)" filter="url(#shadow4)" opacity="0.85" />
                      <text x="470" y="365" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">LLM Providers</text>
                      <text x="470" y="385" textAnchor="middle" fill="white" fontSize="11">Claude/GPT/Groq</text>
                      <text x="470" y="402" textAnchor="middle" fill="white" fontSize="11">Multi-Model</text>

                      {/* Arrows from API tiers down to resources */}
                      <line x1="170" y1="260" x2="170" y2="340" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead4)" />
                      <line x1="470" y1="260" x2="470" y2="340" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead4)" />
                    </svg>
                  )
                },
              ].map((d, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                  <div className={`bg-gradient-to-r ${d.color} p-5`}>
                    <div className="flex items-center gap-2 mb-1">
                      <d.icon size={18} />
                      <span className="text-xs font-bold uppercase opacity-80">{d.domain}</span>
                    </div>
                    <h3 className="text-lg font-bold">{d.title}</h3>
                    <p className="text-xs opacity-80 mt-1">{d.phase} — {d.desc}</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                    {d.diagram}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
