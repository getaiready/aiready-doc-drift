import meta from './living-documentation.meta';
import React from 'react';

const Post = () => (
  <>
    <blockquote>
      Part 3 of our series:{' '}
      <strong>
        &quot;The Self-Correcting Roadmap: From Readiness to Evolution.&quot;
      </strong>
    </blockquote>

    <div className="my-8 max-w-4xl mx-auto">
      <img
        src="/living-documentation-cover.png"
        alt="Living Documentation - cover"
        className="w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800"
      />
    </div>

    <p>
      For decades, &quot;good documentation&quot; meant a wiki that was 6 months
      out of date. In the Eclawnomy, that is a survival risk. If an agent reads
      outdated documentation, it will make outdated decisions.
    </p>

    <p>
      We need <strong>Living Documentation</strong>—docs that aren&apos;t just
      read, but <em>enforced</em>.
    </p>

    <h2>The Law of the Repo</h2>
    <p>
      Imagine a codebase where the documentation is actually an{' '}
      <strong>Active Observer</strong>. It doesn&apos;t just describe the
      architecture; it measures it. If a developer (or an agent) introduces a
      pattern that deviates from the &quot;Law of the Repo,&quot; the
      documentation flags it in real-time.
    </p>

    <p>
      This is how we maintain <strong>Aesthetic Integrity</strong> and{' '}
      <strong>Objectively Measurable Standards</strong> across 1,000
      repositories.
    </p>

    <h2>Enforcement via Measurement</h2>
    <p>
      Using the <strong>9 Metrics of Agency</strong> we discussed in Part 2,
      AIReady acts as the enforcement layer.
    </p>
    <ul className="list-disc pl-6 mb-4 space-y-2">
      <li>
        <strong>Standard Divergence Guard:</strong> Automatically flagging code
        that uses legacy patterns in new modules.
      </li>
      <li>
        <strong>Aesthetic Audit:</strong> Ensuring that visual structure
        (indentation, grouping, naming) remains consistent to prevent agentic
        attention decay.
      </li>
      <li>
        <strong>Contract Validity:</strong> Verifying that API changes
        don&apos;t break the &quot;Implicit Signals&quot; that agents rely on
        for navigation.
      </li>
    </ul>

    <h2>The Documentation as a Coworker</h2>
    <p>
      When your documentation is living, it becomes a Coworker. It helps agents
      &quot;onboard&quot; to a repo in seconds rather than days. It provides the{' '}
      <strong>Contextual Guardrails</strong> that turn a generic LLM into a
      domain-specific expert.
    </p>

    <p>
      In our next entry, we&apos;ll show you how to structure your repository to
      maximize this effect:{' '}
      <strong>Architecting for the &apos;First 5 Minutes&apos;.</strong>
    </p>

    <hr className="my-12 border-slate-200 dark:border-zinc-800" />

    <p>
      <strong>Is your documentation lying to your agents?</strong>
      <br />
      <code>npx @aiready/cli scan --docs</code>
    </p>
  </>
);

export default Post;
