import meta from './the-9-metrics.meta';
import React from 'react';

const Post = () => (
  <>
    <blockquote>
      Part 2 of our series:{' '}
      <strong>
        &quot;The Self-Correcting Roadmap: From Readiness to Evolution.&quot;
      </strong>
    </blockquote>

    <div className="my-8 max-w-4xl mx-auto">
      <img
        src="/series-3-metrics-that-matters.png"
        alt="The 9 Metrics - cover"
        className="w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800"
      />
    </div>

    <p>
      For decades, we&apos;ve used linters and static analysis to tell us if our
      code is &quot;good.&quot; We measured cyclomatic complexity, test
      coverage, and line length. But these metrics were designed for{' '}
      <strong>human eyes</strong>.
    </p>

    <p>
      When an autonomous agent (an &quot;Agentic Dev&quot;) enters your repo, it
      doesn&apos;t care about your pretty indentation or your 80-character line
      limits. It cares about <strong>Signal-to-Noise Ratio</strong> and{' '}
      <strong>Contextual Density</strong>.
    </p>

    <p>
      At AIReady, we&apos;ve identified the <strong>9 Metrics of Agency</strong>
      . These are the indicators that determine whether an agent will finish a
      task in 5 minutes or fail after 5 hours of hallucinations.
    </p>

    <h2>1. Semantic Scannability</h2>
    <p>
      How quickly can an LLM identify the <em>purpose</em> of a module without
      reading the implementation? This is driven by naming conventions that act
      as &quot;GPS coordinates&quot; for context. If your filenames are{' '}
      <code>util.ts</code> or <code>helper.ts</code>, your scannability is near
      zero.
    </p>

    <h2>2. Navigation Tax (The Jump Ratio)</h2>
    <p>
      The number of files an agent must read to understand a single function. If
      changing a button color requires reading 5 different CSS/TS files, you are
      charging a 500% Navigation Tax.
    </p>

    <h2>3. Token ROI (Information Density)</h2>
    <p>
      The ratio of &quot;Logic per Token.&quot; Boilerplate-heavy code (like
      legacy Redux or verbose Java-style patterns) forces the agent to waste its
      limited context window on non-functional noise.
    </p>

    <h2>4. Explicit Signal Clarity</h2>
    <p>
      Are side effects documented in the type signatures? An agent
      shouldn&apos;t have to guess if a function writes to a database or
      triggers a webhook.
    </p>

    <h2>5. Dependency Fragmentation</h2>
    <p>
      How scattered are the dependencies for a single feature? High
      fragmentation leads to the &quot;Context Window Crisis&quot; we discussed
      in Part 1.
    </p>

    {/* Section for the other 4 metrics */}
    <h2>6-9: The Hidden Infrastructure</h2>
    <ul className="list-disc pl-6 mb-4 space-y-2">
      <li>
        <strong>Standard Divergence:</strong> How much a specific file deviates
        from the repo&apos;s established patterns.
      </li>
      <li>
        <strong>Aesthetic Consistency:</strong> Yes, agents are sensitive to
        visual structure. Messy formatting leads to attention decay in the
        model.
      </li>
      <li>
        <strong>Reasoning Breadth:</strong> The horizontal scope of a change.
      </li>
      <li>
        <strong>Validation Readiness:</strong> Are there existing tests that an
        agent can run and interpret without human help?
      </li>
    </ul>

    <p>
      In our next entries, we&apos;ll look at how <strong>AIReady</strong> uses
      these metrics to generate a &quot;Readiness Score&quot; that is
      objectively measurable and enforceable.
    </p>

    <hr className="my-12 border-slate-200 dark:border-zinc-800" />

    <p>
      <em>
        In Part 3, we&apos;ll explore{' '}
        <strong>The Living &amp; Lawful Documentation</strong>: How to turn
        these metrics into a self-enforcing standard.
      </em>
    </p>

    <p>
      <strong>How do your metrics stack up?</strong>
      <br />
      <code>npx @aiready/cli scan --metrics</code>
    </p>
  </>
);

export default Post;
