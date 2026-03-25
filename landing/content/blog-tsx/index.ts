/**
 * Blog posts registry using lazy loading to reduce change amplification.
 * Each blog post registers itself, decoupling the index from direct imports.
 */

// Registry type definition
type BlogPost<T> = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  readingTime: string;
  cover: string;
  ogImage: string;
  Content: T;
};

// Lazy-loaded post registry - posts register themselves
const postRegistry: Record<string, () => Promise<{ default: any; meta: any }>> =
  {};

/**
 * Register a blog post for lazy loading.
 * This allows posts to be added without modifying the central index.
 */
export function registerPost(
  slug: string,
  loader: () => Promise<{ default: any; meta: any }>
) {
  postRegistry[slug] = loader;
}

/**
 * Get all registered blog posts.
 * Uses dynamic imports to minimize initial bundle size and coupling.
 */
export async function getPosts(): Promise<BlogPost<any>[]> {
  const posts: BlogPost<any>[] = [];

  for (const [slug, loader] of Object.entries(postRegistry)) {
    try {
      const { default: Content, meta } = await loader();
      posts.push({
        slug: meta.slug,
        title: meta.title,
        date: meta.date,
        excerpt: meta.excerpt,
        author: meta.author,
        tags: meta.tags || [],
        readingTime: meta.readingTime,
        cover: meta.cover,
        ogImage: meta.ogImage || meta.cover,
        Content,
      });
    } catch (error) {
      console.error(`Failed to load post: ${slug}`, error);
    }
  }

  // Sort by date descending
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Pre-register all blog posts for static generation compatibility
// These imports are bundled but only loaded on demand
import BeyondTheSidekick from './beyond-the-sidekick';
import beyondTheSidekickMeta from './beyond-the-sidekick.meta';
import TheEconomicMoat from './the-economic-moat';
import theEconomicMoatMeta from './the-economic-moat.meta';
import TheNeuralSpine from './the-neural-spine';
import theNeuralSpineMeta from './the-neural-spine.meta';
import ClosingTheLoop from './closing-the-loop';
import closingTheLoopMeta from './closing-the-loop.meta';
import CognitiveTiering from './cognitive-tiering';
import cognitiveTieringMeta from './cognitive-tiering.meta';
import ResilienceFortress from './resilience-fortress';
import resilienceFortressMeta from './resilience-fortress.meta';
import ObservabilityIntelligence from './observability-intelligence';
import observabilityIntelligenceMeta from './observability-intelligence.meta';
import HumanAgentCoManagement from './human-agent-co-management';
import humanAgentCoManagementMeta from './human-agent-co-management.meta';
import RecursiveSafety from './recursive-safety';
import recursiveSafetyMeta from './recursive-safety.meta';
import RoadmapToAutonomy from './roadmap-to-autonomy';
import roadmapToAutonomyMeta from './roadmap-to-autonomy.meta';
import LivingRepository from './living-repository';
import livingRepositoryMeta from './living-repository.meta';
import TheAgenticWall from './the-agentic-wall';
import theAgenticWallMeta from './the-agentic-wall.meta';
import FutureHumanFriendlyCode from './future-human-friendly-code';
import futureHumanFriendlyCodeMeta from './future-human-friendly-code.meta';
import VisualizingInvisible from './visualizing-invisible';
import visualizingInvisibleMeta from './visualizing-invisible.meta';
import InvisibleCodebase from './invisible-codebase';
import invisibleCodebaseMeta from './invisible-codebase.meta';
import AiCodeDebtTsunami from './ai-code-debt-tsunami';
import aiCodeDebtTsunamiMeta from './ai-code-debt-tsunami.meta';
import MetricsThatMatter from './metrics-that-actually-matter';
import metricsThatMatterMeta from './metrics-that-actually-matter.meta';
import SemanticDuplicateDetection from './semantic-duplicate-detection';
import semanticDuplicateDetectionMeta from './semantic-duplicate-detection.meta';
import HiddenCostImportChains from './hidden-cost-import-chains';
import hiddenCostImportChainsMeta from './hidden-cost-import-chains.meta';
import McpSuperpowersContextAware from './mcp-superpowers-context-aware';
import mcpSuperpowersContextAwareMeta from './mcp-superpowers-context-aware.meta';
import McpSuperpowersCustomTools from './mcp-superpowers-custom-tools';
import mcpSuperpowersCustomToolsMeta from './mcp-superpowers-custom-tools.meta';
import McpSuperpowersOrchestrationLoop from './mcp-superpowers-orchestration-loop';
import mcpSuperpowersOrchestrationLoopMeta from './mcp-superpowers-orchestration-loop.meta';
import AgenticRoiNavigationTax from './agentic-roi-navigation-tax';
import agenticRoiNavigationTaxMeta from './agentic-roi-navigation-tax.meta';
import AgenticRoiTokenRoi from './agentic-roi-token-roi';
import agenticRoiTokenRoiMeta from './agentic-roi-token-roi.meta';
import AgenticRoiTalentMoat from './agentic-roi-talent-moat';
import agenticRoiTalentMoatMeta from './agentic-roi-talent-moat.meta';
import TenMinuteAiAudit from './10-minute-ai-audit';
import tenMinuteAiAuditMeta from './10-minute-ai-audit.meta';
import EclawnomyPart1 from './eclawnomy-part-1';
import eclawnomyPart1Meta from './eclawnomy-part-1.meta';
import EclawnomyPart2 from './eclawnomy-part-2';
import eclawnomyPart2Meta from './eclawnomy-part-2.meta';
import EclawnomyPart3 from './eclawnomy-part-3';
import eclawnomyPart3Meta from './eclawnomy-part-3.meta';
import EclawnomyPart4 from './eclawnomy-part-4';
import eclawnomyPart4Meta from './eclawnomy-part-4.meta';
import TheTokenTax from './the-token-tax';
import theTokenTaxMeta from './the-token-tax.meta';
import The9Metrics from './the-9-metrics';
import the9MetricsMeta from './the-9-metrics.meta';
import LivingDocumentation from './living-documentation';
import livingDocumentationMeta from './living-documentation.meta';
import ArchitectingForAgents from './architecting-for-agents';
import architectingForAgentsMeta from './architecting-for-agents.meta';
import TheReadinessScorecard from './the-readiness-scorecard';
import readinessScorecardMeta from './readiness-scorecard.meta';

/**
 * Static posts array for static generation.
 * This is kept for backward compatibility but uses the helper function.
 */
function createPostEntry<T>(
  meta: {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    author: string;
    tags?: string[];
    readingTime: string;
    cover: string;
    ogImage?: string;
  },
  Content: T
) {
  return {
    slug: meta.slug,
    title: meta.title,
    date: meta.date,
    excerpt: meta.excerpt,
    author: meta.author,
    tags: meta.tags || [],
    readingTime: meta.readingTime,
    cover: meta.cover,
    ogImage: meta.ogImage || meta.cover,
    Content,
  };
}

export const posts = [
  createPostEntry(beyondTheSidekickMeta, BeyondTheSidekick),
  createPostEntry(theEconomicMoatMeta, TheEconomicMoat),
  createPostEntry(theNeuralSpineMeta, TheNeuralSpine),
  createPostEntry(closingTheLoopMeta, ClosingTheLoop),
  createPostEntry(cognitiveTieringMeta, CognitiveTiering),
  createPostEntry(resilienceFortressMeta, ResilienceFortress),
  createPostEntry(observabilityIntelligenceMeta, ObservabilityIntelligence),
  createPostEntry(humanAgentCoManagementMeta, HumanAgentCoManagement),
  createPostEntry(recursiveSafetyMeta, RecursiveSafety),
  createPostEntry(roadmapToAutonomyMeta, RoadmapToAutonomy),
  createPostEntry(livingRepositoryMeta, LivingRepository),
  createPostEntry(theAgenticWallMeta, TheAgenticWall),
  createPostEntry(futureHumanFriendlyCodeMeta, FutureHumanFriendlyCode),
  createPostEntry(visualizingInvisibleMeta, VisualizingInvisible),
  createPostEntry(invisibleCodebaseMeta, InvisibleCodebase),
  createPostEntry(aiCodeDebtTsunamiMeta, AiCodeDebtTsunami),
  createPostEntry(metricsThatMatterMeta, MetricsThatMatter),
  createPostEntry(semanticDuplicateDetectionMeta, SemanticDuplicateDetection),
  createPostEntry(hiddenCostImportChainsMeta, HiddenCostImportChains),
  createPostEntry(mcpSuperpowersContextAwareMeta, McpSuperpowersContextAware),
  createPostEntry(mcpSuperpowersCustomToolsMeta, McpSuperpowersCustomTools),
  createPostEntry(
    mcpSuperpowersOrchestrationLoopMeta,
    McpSuperpowersOrchestrationLoop
  ),
  createPostEntry(agenticRoiNavigationTaxMeta, AgenticRoiNavigationTax),
  createPostEntry(agenticRoiTokenRoiMeta, AgenticRoiTokenRoi),
  createPostEntry(agenticRoiTalentMoatMeta, AgenticRoiTalentMoat),
  createPostEntry(tenMinuteAiAuditMeta, TenMinuteAiAudit),
  createPostEntry(eclawnomyPart1Meta, EclawnomyPart1),
  createPostEntry(eclawnomyPart2Meta, EclawnomyPart2),
  createPostEntry(eclawnomyPart3Meta, EclawnomyPart3),
  createPostEntry(eclawnomyPart4Meta, EclawnomyPart4),
  createPostEntry(theTokenTaxMeta, TheTokenTax),
  createPostEntry(the9MetricsMeta, The9Metrics),
  createPostEntry(livingDocumentationMeta, LivingDocumentation),
  createPostEntry(architectingForAgentsMeta, ArchitectingForAgents),
  createPostEntry(readinessScorecardMeta, TheReadinessScorecard),
];
