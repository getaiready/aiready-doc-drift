import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const repo = await getRepository(repoId);

    if (!repo) {
      return new NextResponse('Repository not found', { status: 404 });
    }

    const score = repo.aiScore || 0;

    // Choose color based on score
    let color = '#ef4444'; // Red (<60)
    if (score >= 90)
      color = '#6366f1'; // Indigo (90+)
    else if (score >= 75)
      color = '#06b6d4'; // Cyan (75+)
    else if (score >= 60) color = '#f59e0b'; // Amber (60+)

    const label = 'AI READY';
    const value = `${score}/100`;

    // Calculate widths (rough estimates for SVG rendering)
    const labelWidth = label.length * 7 + 10;
    const valueWidth = value.length * 7 + 10;
    const totalWidth = labelWidth + valueWidth;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return new NextResponse(
        'Repository not found (Database not configured)',
        { status: 404 }
      );
    }
    console.error('Badge API error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
