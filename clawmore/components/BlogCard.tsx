'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock, Hash } from 'lucide-react';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  hash: string;
  category: string;
  image: string;
}

export default function BlogCard({
  slug,
  title,
  excerpt,
  date,
  readTime,
  hash,
  category,
  image,
}: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="block group h-full">
      <div className="glass-card h-full border-white/10 hover:border-cyber-green/40 transition-all bg-black hover:bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden border-b border-white/5">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="p-10 flex flex-col flex-grow">
          {/* Neon Glow on Hover */}
          <div className="absolute inset-0 bg-cyber-green/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-8">
            <div className="text-cyber-purple font-mono text-[9px] uppercase tracking-[0.4em] font-black">
              {category}
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] group-hover:text-cyber-purple transition-colors">
              <Hash className="w-3 h-3" />
              <span>{hash}</span>
            </div>
          </div>

          <h3 className="text-3xl font-black mb-6 tracking-tighter italic leading-tight group-hover:text-cyber-purple transition-colors">
            {title}
          </h3>

          <p className="text-zinc-300 text-[15px] leading-relaxed mb-10 flex-grow font-light">
            {excerpt}
          </p>

          <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/10">
            <div className="flex items-center gap-4 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>{readTime}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span>{date}</span>
            </div>

            <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center text-white/60 group-hover:bg-cyber-green group-hover:text-black transition-all">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
