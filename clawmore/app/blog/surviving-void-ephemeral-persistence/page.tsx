'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Hash,
  Terminal,
  Activity,
  Zap,
  ChevronRight,
  Database,
  HardDrive,
  RefreshCcw,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import Modal from '../../../components/Modal';
import LeadForm from '../../../components/LeadForm';
import SystemFlow from '../../../components/SystemFlow';
import Navbar from '../../../components/Navbar';
import Breadcrumbs from '../../../components/Breadcrumbs';
import JsonLd from '../../../components/JsonLd';

const PERSISTENCE_NODES = [
  {
    id: 'event',
    data: { label: 'INBOUND_EVENT', type: 'event' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'compute',
    data: { label: '[EPHEMERAL_COMPUTE]', type: 'agent' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'dynamo',
    data: { label: 'DYNAMODB_TASK_STATE', type: 'bus' },
    position: { x: 500, y: -50 },
  },
  {
    id: 's3',
    data: { label: 'S3_LONG_TERM_MEMORY', type: 'bus' },
    position: { x: 500, y: 50 },
  },
  {
    id: 'done',
    data: { label: 'STATE_SYNCHRONIZED', type: 'event' },
    position: { x: 750, y: 0 },
  },
];

const PERSISTENCE_EDGES = [
  {
    id: 'e1',
    source: 'event',
    target: 'compute',
    label: 'Spin up',
    animated: true,
  },
  {
    id: 'e2',
    source: 'compute',
    target: 'dynamo',
    label: 'Re-hydrate',
    animated: true,
  },
  {
    id: 'e3',
    source: 'compute',
    target: 's3',
    label: 'Backup',
    animated: true,
  },
  {
    id: 'e4',
    source: 'dynamo',
    target: 'done',
    label: 'Persist',
    animated: true,
  },
];

export default function BlogPost() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const apiUrl = process.env.NEXT_PUBLIC_LEAD_API_URL || '';

  const POST_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Surviving the Void: Cross-Lifecycle Memory',
    description:
      'How do you keep an AI agent from forgetting its purpose when its runtime is destroyed every 15 minutes? Exploring the S3 + DynamoDB state backbone.',
    datePublished: '2026-03-26',
    author: {
      '@type': 'Organization',
      name: 'ClawMore',
    },
    image: '/blog-assets/surviving-void-ephemeral-persistence.png',
    url: '/blog-assets/surviving-void-ephemeral-persistence',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyber-purple/30 selection:text-cyber-purple font-sans">
      <JsonLd data={POST_JSON_LD} />
      <Navbar variant="post" />
      {/* Navigation */}

      {/* Article Header */}
      <header className="py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(188,0,255,0.05)_0%,_transparent_70%)] opacity-30" />

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="text-cyber-purple font-mono text-[9px] uppercase tracking-[0.4em] font-black border border-cyber-purple/20 px-2 py-1 bg-cyber-purple/5">
                EPHEMERAL_PERSISTENCE
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Hash className="w-3 h-3" />
                <span>HASH: state-void</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Clock className="w-3 h-3" />
                <span>07 MIN READ</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic leading-[1.1]">
              Surviving the Void: <br />
              <span className="text-cyber-purple">Cross-Lifecycle Memory</span>
            </h1>

            <p className="text-xl text-zinc-200 font-light leading-relaxed italic">
              How do you keep an AI agent from forgetting its purpose when its
              runtime is destroyed every 15 minutes? Exploring the S3 + DynamoDB
              state backbone.
            </p>

            <div className="mt-12 relative aspect-[21/9] w-full overflow-hidden border border-white/10 rounded-sm group">
              <img
                src="/blog-assets/surviving-void-ephemeral-persistence.png"
                alt="Surviving the Void: Cross-Lifecycle Memory"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs
              items={[
                { label: 'BLOG', href: '/blog' },
                {
                  label: 'SURVIVING THE VOID',
                  href: '/blog/surviving-void-ephemeral-persistence',
                },
              ]}
            />
            <article className="prose prose-invert prose-zinc max-w-none">
              <div className="space-y-12">
                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      01
                    </span>
                    The Amnesia Risk
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    In a "Scale-to-Zero" architecture, the compute instance (AWS
                    Fargate) is ephemeral. It spins up to handle a request and
                    spins down when idle. For a traditional application, this is
                    fine. For an AI agent, it's a disaster.
                  </p>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    If the agent loses its volatile memory, it loses the context
                    of the conversation, the status of its current background
                    tasks, and its sense of "identity."
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      02
                    </span>
                    The Multi-Tiered Memory Stack
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    `serverlessclaw` solves this through a multi-tiered
                    persistence stack. We use **DynamoDB** for high-frequency
                    task state and **S3** for long-term "reflective memory."
                    Every time the container spins up, its first act is a
                    "Memory Re-hydration" cycle.
                  </p>
                </section>

                <SystemFlow
                  nodes={PERSISTENCE_NODES}
                  edges={PERSISTENCE_EDGES}
                  height="350px"
                />

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      03
                    </span>
                    Atomic Task Syncing
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    When an agent initiates a complex task—like migrating a
                    database—it writes an atomic entry to DynamoDB. If the
                    container crashes mid-task, the *next* instance that spins
                    up detects the unfinished task and resumes execution from
                    the last verified checkpoint.
                  </p>
                  <div className="mt-8 p-6 bg-zinc-900/50 border border-white/10 rounded-sm font-mono text-[11px] text-zinc-200">
                    <div className="flex items-center gap-2 text-cyber-purple mb-2">
                      <Database className="w-3 h-3" />
                      <span>STATE_SNAPSHOT.json</span>
                    </div>
                    {`{
  "task_id": "MUTATION_v4.2.9",
  "status": "IN_PROGRESS",
  "checkpoint": "SYNTHESIS_COMPLETE",
  "next_step": "GIT_COMMIT_PENDING",
  "context_hash": "bd95a79...f1e",
  "ttl": 1710331200
}`}
                  </div>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      04
                    </span>
                    Memory as Infrastructure
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    By decoupling memory from compute, we ensure that
                    `serverlessclaw` is truly indestructible. You can delete the
                    entire Fargate cluster, and the agent will "wake up" in a
                    new one with its context perfectly intact.
                  </p>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    In our final entry of the series, **CDK Monorepo Mastery**,
                    we'll look at how we package all these moving parts into a
                    single, deployable blueprint.
                  </p>
                </section>
              </div>

              {/* Series Navigation */}
              <div className="mt-24 pt-12 border-t border-white/5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.4em] mb-8">
                  Up_Next_In_The_Minimalist
                </div>
                <Link href="/blog/cdk-monorepo-mastery" className="block group">
                  <div className="glass-card p-8 flex items-center justify-between hover:border-cyber-purple/30 transition-all bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-sm bg-cyber-purple/10 flex items-center justify-center text-cyber-purple border border-cyber-purple/20">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-cyber-purple uppercase tracking-widest mb-1">
                          PART 10 // INFRA_AS_CODE
                        </div>
                        <div className="text-2xl font-black italic group-hover:text-white transition-colors">
                          Infrastructure as Code: CDK Monorepo Mastery
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-cyber-purple group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center text-zinc-700 text-[10px] font-mono uppercase tracking-[0.5em]">
          TERMINAL_LOCKED // 2026 PERPETUAL_EVOLUTION
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <LeadForm type="waitlist" onSuccess={closeModal} apiUrl={apiUrl} />
      </Modal>
    </div>
  );
}
