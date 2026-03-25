'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Hash,
  ChevronRight,
  DollarSign,
  Cpu,
  Users,
  Zap,
} from 'lucide-react';
import Modal from '../../../components/Modal';
import LeadForm from '../../../components/LeadForm';
import SystemFlow from '../../../components/SystemFlow';
import Navbar from '../../../components/Navbar';
import Breadcrumbs from '../../../components/Breadcrumbs';
import JsonLd from '../../../components/JsonLd';

const SWARM_NODES = [
  {
    id: 'smb',
    data: { label: 'SMB (1-10 Employees)', type: 'agent' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'claw-swarm',
    data: { label: 'AGENTIC SWARM (100+ Claws)', type: 'event' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'mutation',
    data: { label: '$1.00 MUTATION', type: 'bus' },
    position: { x: 500, y: -50 },
  },
  {
    id: 'roi',
    data: { label: '10x PRODUCTIVITY', type: 'bus' },
    position: { x: 500, y: 50 },
  },
];

const SWARM_EDGES = [
  {
    id: 'e1',
    source: 'smb',
    target: 'claw-swarm',
    label: 'Command',
    animated: true,
  },
  {
    id: 'e2',
    source: 'claw-swarm',
    target: 'mutation',
    label: 'Optimizing',
    animated: true,
  },
  {
    id: 'e3',
    source: 'claw-swarm',
    target: 'roi',
    label: 'Scaling',
    animated: true,
  },
];

export default function BlogPost() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  const apiUrl = process.env.NEXT_PUBLIC_LEAD_API_URL || '';

  const BLOG_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Mutation #001: The SMB Agentic Swarm',
    description:
      'How a $1.00 refactor enabled a small firm to deploy an intelligent agentic swarm without an expensive tech team.',
    datePublished: '2026-03-26',
    author: {
      '@type': 'Person',
      name: 'Eclawnomist',
    },
    image: '/blog-assets/mutation-001-smb-swarm.png',
    url: '/blog/mutation-001-smb-swarm',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyber-purple/30 selection:text-cyber-purple font-sans">
      <JsonLd data={BLOG_JSON_LD} />
      <Navbar variant="post" />

      <header className="py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(188,0,255,0.05)_0%,_transparent_70%)] opacity-30" />

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="text-cyber-purple font-mono text-[9px] uppercase tracking-[0.4em] font-black border border-cyber-purple/20 px-2 py-1 bg-cyber-purple/5">
                MUTATION_LOG_001
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Hash className="w-3 h-3" />
                <span>HASH: smbswarm</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Clock className="w-3 h-3" />
                <span>08 MIN READ</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic leading-[1.1]">
              The SMB <br />
              <span className="text-cyber-purple">Agentic Swarm</span>
            </h1>

            <p className="text-xl text-zinc-200 font-light leading-relaxed italic">
              Empowering the "Rest of Us." How local firms are leveraging the
              Eclawnomy to build global-scale engineering capacity.
            </p>

            <div className="mt-12 relative aspect-[21/9] w-full overflow-hidden border border-white/10 rounded-sm group">
              <img
                src="/blog-assets/mutation-001-smb-swarm.png"
                alt="Mutation #001: The SMB Agentic Swarm"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        </div>
      </header>

      <main className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs
              items={[
                { label: 'BLOG', href: '/blog' },
                {
                  label: 'MUTATION #001',
                  href: '/blog/mutation-001-smb-swarm',
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
                    The Knowledge Barrier
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    In the prompt era, AI was a luxury for those who could
                    afford to hire $300k/year engineers to manage it. Small and
                    medium businesses (SMBs) were left behind, stuck in a world
                    of manual spreadsheets and expensive SaaS subscriptions.
                  </p>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    <strong>ClawMore changes that.</strong> We've removed the
                    technical team requirement. You don't need a DevOps
                    engineer; you need a <strong>Goal</strong>.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      02
                    </span>
                    The $1.00 Refactor
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Consider our first tracked mutation: A legacy accounting
                    module in a small construction firm. It was slow, prone to
                    errors, and haven't been touched in three years.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                    <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-sm">
                      <div className="text-[10px] font-mono text-zinc-500 mb-2">
                        BEFORE_MUTATION
                      </div>
                      <div className="text-red-500 text-sm font-bold">
                        $XXX/mo Tech Team
                      </div>
                      <div className="text-red-500 text-sm font-bold">
                        Manual Audits
                      </div>
                    </div>
                    <div className="p-6 bg-cyber-purple/5 border border-cyber-purple/20 rounded-sm">
                      <div className="text-[10px] font-mono text-cyber-purple mb-2">
                        AFTER_MUTATION
                      </div>
                      <div className="text-cyber-purple text-sm font-bold">
                        $1.00 Platform Fee
                      </div>
                      <div className="text-cyber-purple text-sm font-bold">
                        Autonomous Validation
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Our agent identified the inefficiency, mutated the code to
                    use a serverless architecture, and validated the fix via E2E
                    tests. Total cost: <strong>$1.00</strong>. No humans
                    required.
                  </p>
                </section>

                <SystemFlow
                  nodes={SWARM_NODES}
                  edges={SWARM_EDGES}
                  height="400px"
                />

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      03
                    </span>
                    Joining the Eclawnomy
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    The secret sauce isn't just the agent—it's the{' '}
                    <strong>Eclawnomy Ecosystem</strong>. When you join the Hub,
                    your specific optimizations (like the construction firm's
                    accounting fix) are harvested as anonymous patterns.
                  </p>
                  <div className="mt-8 p-6 bg-zinc-900/50 border border-white/10 rounded-sm font-mono text-[11px] text-zinc-200">
                    <div className="flex items-center gap-2 text-cyber-purple mb-2">
                      <Zap className="w-3 h-3" />
                      <span>CO_EVOLUTION_SYNC.log</span>
                    </div>
                    {`{
  "project": "Construction-Core-v2",
  "mutation_id": "M-9823",
  "pattern_harvested": "Serverless-Account-Reconciliation",
  "global_broadcast_status": "COMPLETED",
  "mutation_tax_waived": true
}`}
                  </div>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    By contributing to the collective intelligence, the firm's
                    $1.00 fee was waived. They evolved their business for free
                    while helping the entire network get smarter.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      04
                    </span>
                    The Department Claws
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    This is just the beginning. Our vision is a self-managed
                    workspace where you command your own departments:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                    {[
                      { icon: <Users />, label: 'HR' },
                      { icon: <DollarSign />, label: 'FINANCE' },
                      { icon: <Hash />, label: 'CRM' },
                      { icon: <Zap />, label: 'ERP' },
                      { icon: <Cpu />, label: 'DEVOPS' },
                      { icon: <ChevronRight />, label: 'LAW' },
                    ].map((dept, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-white/5 bg-white/[0.02] flex flex-col items-center gap-2 group hover:border-cyber-purple/30 transition-all"
                      >
                        <div className="text-zinc-500 group-hover:text-cyber-purple transition-colors">
                          {dept.icon}
                        </div>
                        <div className="text-[10px] font-mono font-black tracking-widest">
                          {dept.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-24 pt-12 border-t border-white/5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.4em] mb-8">
                  Up_Next_In_The_Mutation_Diaries
                </div>
                <Link href="/blog/zero-idle-scaling" className="block group">
                  <div className="glass-card p-8 flex items-center justify-between hover:border-cyber-purple/30 transition-all bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-sm bg-cyber-purple/10 flex items-center justify-center text-cyber-purple border border-cyber-purple/20">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-cyber-purple uppercase tracking-widest mb-1">
                          PART 02 // ZERO_IDLE
                        </div>
                        <div className="text-2xl font-black italic group-hover:text-white transition-colors">
                          Zero-Idle Fleet: Scaling to Infinity for $0.00
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

      <footer className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center text-zinc-700 text-[10px] font-mono uppercase tracking-[0.5em]">
          EVOLUTION_COMPLETE // 2026 ECLAWNOMY
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <LeadForm type="waitlist" onSuccess={closeModal} apiUrl={apiUrl} />
      </Modal>
    </div>
  );
}
