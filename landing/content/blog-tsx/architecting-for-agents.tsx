import meta from './architecting-for-agents.meta';
import React from 'react';

const Post = () => (
  <>
    <blockquote>
      Part 4 of our series:{' '}
      <strong>
        &quot;The Self-Correcting Roadmap: From Readiness to Evolution.&quot;
      </strong>
    </blockquote>

    <div className="my-8 max-w-4xl mx-auto">
      <img
        src="/series-4-semantic-duplicate-detection.png"
        alt="Architecting for Agents - cover"
        className="w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800"
      />
    </div>

    <p>
      In the human world, &quot;onboarding&quot; involves weeks of meetings,
      documentation reading, and environment setup. In the Eclawnomy, an agent
      is &quot;hired&quot; and starts &quot;working&quot; in milliseconds.
    </p>

    <p>
      But if your repository isn&apos;t architected for those{' '}
      <strong>First 5 Minutes</strong>, high-performance agents will flounder.
      They will hit the &quot;Agentic Wall&quot; before they even write their
      first line of code.
    </p>

    <h2>The Zero-Shot Repository</h2>
    <p>
      A high-velocity repo is a <strong>Zero-Shot Repository</strong>. This
      means an agent can understand:
    </p>
    <ul className="list-disc pl-6 mb-4 space-y-2">
      <li>
        <strong>Entry Points:</strong> Where does the application start?
      </li>
      <li>
        <strong>Domain Boundaries:</strong> Where does one feature end and
        another begin?
      </li>
      <li>
        <strong>Contract Discovery:</strong> How do components talk to each
        other?
      </li>
    </ul>

    <p>
      ...all by simply reading the root directory and the first level of
      subdirectories.
    </p>

    <h2>The Hub-and-Spoke Pattern</h2>
    <p>
      As we use in the <strong>AIReady</strong> monorepo itself, the
      Hub-and-Spoke pattern is ideal for agents.
    </p>
    <ul className="list-disc pl-6 mb-4 space-y-2">
      <li>
        <strong>The Hub (Core):</strong> Centralized types, utilities, and
        config. The agent reads this once and understands the entire
        system&apos;s &quot;DNA.&quot;
      </li>
      <li>
        <strong>The Spokes (Tools):</strong> Independent components that only
        depend on the Core. This prevents the &quot;Deep Import Chain&quot;
        problem.
      </li>
    </ul>

    <h2>Self-Mapping &amp; Discovery</h2>
    <p>
      We recommend using a <code>doc-mapping.json</code> or a similar manifest
      at the root. This is a &quot;GPS Map&quot; for agents. It tells them:
      &quot;If you want to fix the UI, look in <code>package/components</code>.
      If you want to change the API, look in <code>package/core</code>.&quot;
    </p>

    <p>
      By reducing the <strong>Discovery Phase</strong> from minutes to
      milliseconds, you increase the ROI of every token spent on that agent.
    </p>

    <hr className="my-12 border-slate-200 dark:border-zinc-800" />

    <p>
      <em>
        In our final entry, we&apos;ll look at the{' '}
        <strong>Readiness Scorecard</strong>: How to put all these pieces
        together to measure your team&apos;s Agentic Velocity.
      </em>
    </p>

    <p>
      <strong>Is your repo ready for the first 5 minutes?</strong>
      <br />
      <code>npx @aiready/cli scan --score</code>
    </p>
  </>
);

export default Post;
