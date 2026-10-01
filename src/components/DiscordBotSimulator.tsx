'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, Terminal, Check, Bot, ExternalLink, Sparkles } from 'lucide-react';
import { getCreatorByPassportId } from '@/lib/data';

export default function DiscordBotSimulator() {
  const [selectedCommand, setSelectedCommand] = useState<string>('/passport');
  const [userInput, setUserInput] = useState<string>('/passport');
  const [activeTab, setActiveTab] = useState<'preview' | 'architecture' | 'commands'>('preview');

  // Live created pass data (from DB or local storage)
  const [activeCreator, setActiveCreator] = useState({
    passportId: 'creator',
    displayName: 'Creator Pass',
    username: 'creator',
    category: 'Gaming Creator',
    digitalSignature: '0x8f9b2a71d4e6c0b938501e7492cfa7812be4091a',
    youtubeMetric: '184K subscribers',
    discordMetric: '12.4K members',
  });

  React.useEffect(() => {
    try {
      const savedCard = localStorage.getItem('creatorhq_user_card');
      if (savedCard) {
        const parsed = JSON.parse(savedCard);
        setActiveCreator({
          passportId: parsed.slug || parsed.username || 'creator',
          displayName: parsed.displayName || 'Creator Pass',
          username: parsed.username || 'creator',
          category: parsed.category || 'Gaming Creator',
          digitalSignature: parsed.digitalSignature || '0x8f9b2a71d4e6c0b938501e7492cfa7812be4091a',
          youtubeMetric: `${parsed.connections?.youtube?.metricValue || '100K'} subscribers`,
          discordMetric: `${parsed.connections?.discord?.metricValue || '15K'} members`,
        });
      } else {
        fetch('/api/creators')
          .then(res => res.json())
          .then(d => {
            if (d.creators && d.creators.length > 0) {
              const c = d.creators[0];
              setActiveCreator({
                passportId: c.passportId,
                displayName: c.displayName,
                username: c.username,
                category: c.category,
                digitalSignature: c.digitalSignature || '0x8f9b2a71d4e6c0b938501e7492cfa7812be4091a',
                youtubeMetric: `${c.connections?.youtube?.metricValue || '100K'} subscribers`,
                discordMetric: `${c.connections?.discord?.metricValue || '15K'} members`,
              });
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, []);

  const commandsList = [
    { cmd: '/passport', desc: "Displays your own verified Creator Passport & credentials" },
    { cmd: `/passport view @${activeCreator.username}`, desc: "View any creator's public verified Passport" },
    { cmd: '/verify', desc: "Initiate OAuth2 verification or check status" },
    { cmd: '/profile', desc: "Display quick summary profile card" },
    { cmd: '/help', desc: "List all official Creator Passport bot commands" },
  ];

  const handleCommandSelect = (cmd: string) => {
    setSelectedCommand(cmd);
    setUserInput(cmd);
  };

  return (
    <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-[#5865F2]/70 via-indigo-500/30 to-purple-600/20 shadow-2xl hover:shadow-[0_0_50px_-5px_rgba(88,101,242,0.4)] transition-all">
      <div className="w-full rounded-[23px] bg-gradient-to-b from-[#0e122b] via-[#090c1f] to-[#04060e] overflow-hidden">
        {/* Top Discord Terminal Bar */}
        <div className="px-5 py-4 bg-[#121633]/90 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-white tracking-wide">
              Official Discord Bot • Interactive Shell
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'preview'
                ? 'bg-sky-500/20 text-sky-400 font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Embed
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'architecture'
                ? 'bg-sky-500/20 text-sky-400 font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Architecture
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8">
        {activeTab === 'preview' && (
          <div className="space-y-6">
            
            {/* Quick Command Selector Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Test Command:</span>
              {commandsList.map((item) => (
                <button
                  key={item.cmd}
                  onClick={() => handleCommandSelect(item.cmd)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs transition-all ${
                    selectedCommand === item.cmd
                      ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.4)]'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/5'
                  }`}
                >
                  {item.cmd}
                </button>
              ))}
            </div>

            {/* Discord Simulated Chat Window */}
            <div className="rounded-xl bg-[#16181d] border border-white/[0.06] p-5 space-y-4 font-sans">
              
              {/* User Command Line */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {activeCreator.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{activeCreator.displayName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Today at 8:24 PM</span>
                  </div>
                  <div className="inline-block mt-1 px-2.5 py-1 rounded bg-black/40 border border-white/5 text-sky-300 text-xs font-mono">
                    {selectedCommand}
                  </div>
                </div>
              </div>

              {/* Bot Response Embed (Single Official Bot Spec) */}
              <div className="flex items-start gap-3 pl-2 border-l-2 border-sky-500/80">
                <div className="w-9 h-9 rounded-full bg-[#0e1217] border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-xs shrink-0 shadow-[0_0_10px_rgba(14,165,233,0.3)]">
                  CP
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Creator Passport</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-[9px] font-bold text-white tracking-wide">
                      APP
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Today at 8:24 PM</span>
                  </div>

                  {/* The Embed Box */}
                  <div className="max-w-lg rounded-lg bg-[#0e1014] border-l-4 border-sky-400 p-4 border border-white/[0.06] shadow-xl space-y-3">
                    
                    {/* Embed Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <div>
                        <div className="text-[10px] font-mono tracking-widest uppercase text-sky-400 font-semibold">
                          CREATOR PASSPORT
                        </div>
                        <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                          <span>{activeCreator.displayName}</span>
                          <span className="text-xs font-mono text-slate-400">({activeCreator.passportId})</span>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>VERIFIED CREATOR</span>
                      </div>
                    </div>

                    {/* Embed Fields */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          CATEGORY
                        </span>
                        <span className="font-semibold text-slate-200">{activeCreator.category}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          MEMBERSHIP
                        </span>
                        <span className="font-semibold text-amber-300">FOUNDING CREATOR</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          YOUTUBE
                        </span>
                        <span className="font-mono text-slate-200">{activeCreator.youtubeMetric} ✓</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          DISCORD
                        </span>
                        <span className="font-mono text-slate-200">{activeCreator.discordMetric} ✓</span>
                      </div>
                    </div>

                    {/* Verification Hash Stamp */}
                    <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Hash: {activeCreator.digitalSignature.substring(0, 18)}...</span>
                      <span className="text-sky-400 font-bold">Status: Authenticated</span>
                    </div>

                    {/* Discord Action Button: "View Full Creator ID" */}
                    <div className="pt-2">
                      <Link
                        href={`/creator/${activeCreator.passportId}`}
                        className="inline-flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#2b2f38] hover:bg-[#353b47] text-white text-xs font-semibold transition-all border border-white/10 group"
                      >
                        <span>View Full Creator ID</span>
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Architecture Tab */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Single Bot Ecosystem Architecture</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                As required by design principles, there is <strong>strictly ONE official Discord bot</strong> for the entire platform. The bot contains zero independent business logic; it acts as a thin interface communicating with the centralized REST API.
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="p-6 rounded-xl bg-[#090b0e] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
              
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-center w-full md:w-36">
                <div className="text-[10px] text-slate-400">INTERFACE</div>
                <div className="font-bold text-indigo-300">Website UI</div>
                <div className="text-[9px] text-slate-400">Next.js App</div>
              </div>

              <div className="text-sky-400 font-bold hidden md:block">→</div>
              <div className="text-sky-400 font-bold md:hidden">↓</div>

              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/40 text-center w-full md:w-44 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                <div className="text-[10px] text-slate-400">CENTRAL HUB</div>
                <div className="font-bold text-sky-300">Backend API</div>
                <div className="text-[9px] text-slate-400">Auth, Passports, Verif</div>
              </div>

              <div className="text-sky-400 font-bold hidden md:block">↔</div>
              <div className="text-sky-400 font-bold md:hidden">↕</div>

              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-center w-full md:w-40">
                <div className="text-[10px] text-slate-400">STORAGE</div>
                <div className="font-bold text-sky-300">Database</div>
                <div className="text-[9px] text-slate-400">PostgreSQL + Prisma</div>
              </div>

              <div className="text-sky-400 font-bold hidden md:block">←</div>
              <div className="text-sky-400 font-bold md:hidden">↓</div>

              <div className="p-3 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 text-center w-full md:w-40">
                <div className="text-[10px] text-slate-400">SINGLE CLIENT</div>
                <div className="font-bold text-[#5865F2]">Discord Bot</div>
                <div className="text-[9px] text-slate-400">discord.js / API calls</div>
              </div>

            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-400" />
                <span>Zero multi-bot fragmentation: One verified Discord Bot across all communities.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-400" />
                <span>Zero Discord password collection: Authenticates strictly via Discord OAuth2.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
