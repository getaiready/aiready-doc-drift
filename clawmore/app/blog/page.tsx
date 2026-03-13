'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  Layers,
  RefreshCcw,
  Zap,
  Code,
  ShieldCheck,
} from 'lucide-react';
import BlogHero from '../../components/BlogHero';
import BlogCard from '../../components/BlogCard';
import Modal from '../../components/Modal';
import LeadForm from '../../components/LeadForm';
import Navbar from '../../components/Navbar';
import Breadcrumbs from '../../components/Breadcrumbs';
import JsonLd from '../../components/JsonLd';

const BLOG_POSTS = [
  {
    slug: 'death-of-the-transient-agent',
    title: 'The Death of the Transient Agent',
    excerpt:
      'Why stateless chat with infrastructure is a dead end. Introducing the case for mutable logic state that persists to source control.',
    date: 'MAR 13, 2026',
    readTime: '06 MIN',
    hash: '5086da9',
    category: 'CORE_ENGINE',
    image: '/blog/death-of-the-transient-agent.png',
  },
  {
    slug: 'eventbridge-the-neural-spine',
    title: 'EventBridge: The Neural Spine',
    excerpt:
      'Mapping the ClawFlow mesh. How asynchronous events allow decoupled agents to coordinate without a central controller.',
    date: 'MAR 11, 2026',
    readTime: '08 MIN',
    hash: '915c10e',
    category: 'NETWORK_SPINE',
    image: '/blog/eventbridge-the-neural-spine.png',
  },
  {
    slug: 'the-reflector-self-critique',
    title: 'The Reflector: Machines that Self-Critique',
    excerpt:
      'Most AI systems wait for humans to find bugs. Claw finds them itself using autonomous Gap Detection Loops.',
    date: 'MAR 09, 2026',
    readTime: '05 MIN',
    hash: 'bd95a79',
    category: 'SAFETY_GUARDS',
    image: '/blog/the-reflector-self-critique.png',
  },
  {
    slug: 'sst-ion-coder-loop',
    title: 'SST Ion & The Coder Loop',
    excerpt:
      'Closing the gap between LLM reasoning and Pulumi-based deployment. How we achieve sub-second infrastructure mutations.',
    date: 'MAR 07, 2026',
    readTime: '07 MIN',
    hash: 'a2eb83b',
    category: 'JIT_INFRASTRUCTURE',
    image: '/blog/sst-ion-coder-loop.png',
  },
  {
    slug: 'ironclad-autonomy-safety-vpc',
    title: 'Ironclad Autonomy: Safety & VPCs',
    excerpt:
      'Explaining our multi-layered approach to recursion guards and context isolation to ensure autonomous systems never run away.',
    date: 'MAR 05, 2026',
    readTime: '06 MIN',
    hash: 'bd95a79',
    category: 'SAFETY_GUARDS',
    image: '/blog/ironclad-autonomy-safety-vpc.png',
  },
  {
    slug: 'one-dollar-ai-agent',
    title: 'The $1/Month AI Agent',
    excerpt:
      'Breaking the 24/7 hosting trap. How to run a multi-channel AI backbone for the price of a single coffee.',
    date: 'MAR 03, 2026',
    readTime: '06 MIN',
    hash: '1dollarai',
    category: 'MINIMALIST_ARCHITECT',
    image: '/blog/one-dollar-ai-agent.png',
  },
  {
    slug: 'bridge-pattern-ephemeral-persistent',
    title: 'The Bridge Pattern: HTTP to WebSocket',
    excerpt:
      'Solving the "Persistent connection" problem in a serverless world. How we connect ephemeral Lambda triggers to long-running AI streams.',
    date: 'MAR 01, 2026',
    readTime: '07 MIN',
    hash: 'bridge-proto',
    category: 'PROTOCOL_BRIDGE',
    image: '/blog/bridge-pattern-ephemeral-persistent.png',
  },
  {
    slug: 'omni-channel-ai-gateway',
    title: 'Omni-Channel Command: One Agent, Six Interfaces',
    excerpt:
      'Integrating Telegram, Discord, Slack, and even iMessage into a unified AI spine. How we built a multi-platform agent that never misses a pulse.',
    date: 'FEB 27, 2026',
    readTime: '06 MIN',
    hash: 'omni-gate',
    category: 'OMNI_CHANNEL',
    image: '/blog/omni-channel-ai-gateway.png',
  },
  {
    slug: 'surviving-void-ephemeral-persistence',
    title: 'Surviving the Void: Cross-Lifecycle Memory',
    excerpt:
      'How do you keep an AI agent from forgetting its purpose when its runtime is destroyed every 15 minutes? Exploring the S3 + DynamoDB state backbone.',
    date: 'FEB 25, 2026',
    readTime: '07 MIN',
    hash: 'state-void',
    category: 'EPHEMERAL_PERSISTENCE',
    image: '/blog/surviving-void-ephemeral-persistence.png',
  },
  {
    slug: 'cdk-monorepo-mastery',
    title: 'Infrastructure as Code: CDK Monorepo Mastery',
    excerpt:
      'Organizing a complex AI backbone into a single, deployable blueprint. How we use AWS CDK and npm workspaces to manage the serverlessclaw monorepo.',
    date: 'FEB 23, 2026',
    readTime: '06 MIN',
    hash: 'cdk-master',
    category: 'INFRA_AS_CODE',
    image: '/blog/cdk-monorepo-mastery.png',
  },
];

export default function BlogIndex() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // We need the apiUrl from an environment variable or a linked resource
  // Since this is a client component, we'll try to get it from process.env
  // (In a real production app, we'd pass this down from a server component)
  const apiUrl = process.env.NEXT_PUBLIC_LEAD_API_URL || '';

  const BLOG_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ClawMore Reflective Neural Journal',
    description:
      'Logging the mutations, failures, and autonomous breakthroughs of the serverlessclaw engine.',
    url: 'https://clawmore.getaiready.dev/blog',
    blogPost: BLOG_POSTS.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      image: `https://clawmore.getaiready.dev${post.image}`,
      url: `https://clawmore.getaiready.dev/blog/${post.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyber-purple/30 selection:text-cyber-purple font-sans">
      <JsonLd data={BLOG_JSON_LD} />
      <Navbar />

      <BlogHero />

      <section className="py-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: 'BLOG', href: '/blog' }]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Footer */}
      <section className="py-32 border-t border-white/5 bg-cyber-purple/[0.01]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cyber-purple/5 blur-3xl -z-10" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-cyber-purple/20 bg-cyber-purple/5 text-cyber-purple text-[8px] font-mono uppercase tracking-[0.4em] mb-6">
              <RefreshCcw className="w-3 h-3 animate-spin-slow" />
              <span>SYNC_WITH_EVOLUTION</span>
            </div>

            <h2 className="text-4xl font-black mb-6 tracking-tighter italic">
              Subscribe to Neural Updates
            </h2>
            <p className="text-zinc-300 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
              Get notified every time the{' '}
              <span className="text-white">serverlessclaw</span> engine mutates
              its own architecture or releases a new technical reflective log.
            </p>

            <button
              onClick={openModal}
              className="px-12 py-5 rounded-sm bg-cyber-purple text-black hover:bg-cyber-purple/90 transition-all font-black uppercase tracking-widest flex items-center gap-3 mx-auto shadow-[0_0_50px_rgba(188,0,255,0.2)]"
            >
              Join the Mutation List
              <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black/40">
        <div className="container mx-auto px-4 text-center text-zinc-400 text-[10px] font-mono uppercase tracking-[0.3em]">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="opacity-50"
            />
            <span className="text-white/40 italic font-black">
              ClawMore // Reflective_Journal
            </span>
          </div>
          © 2026 PERPETUAL_EVOLUTION. TERMINAL_LOCKED.
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <LeadForm type="waitlist" onSuccess={closeModal} apiUrl={apiUrl} />
      </Modal>
    </div>
  );
}
