import { MetadataRoute } from 'next';

const BLOG_POSTS = [
  'death-of-the-transient-agent',
  'eventbridge-the-neural-spine',
  'the-reflector-self-critique',
  'sst-ion-coder-loop',
  'ironclad-autonomy-safety-vpc',
  'one-dollar-ai-agent',
  'bridge-pattern-ephemeral-persistent',
  'omni-channel-ai-gateway',
  'surviving-void-ephemeral-persistence',
  'cdk-monorepo-mastery',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://clawmore.getaiready.dev';

  const blogUrls = BLOG_POSTS.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/zh`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...blogUrls,
  ];
}
