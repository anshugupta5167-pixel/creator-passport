'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Terminal, Copy, Check, ExternalLink, ShieldCheck, Code2, Server } from 'lucide-react';

export default function ApiDocsPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/passport/:id',
      desc: "Retrieve public passport card payload, digital signature, and verification state.",
      exampleResp: `{
  "passportId": "CP-000184",
  "displayName": "Alex",
  "category": "Gaming Creator",
  "status": "VERIFIED",
  "isFounding": true,
  "digitalSignature": "0x8f9b2a71d4e6c0b938501e7492cfa7812be4091a",
  "connectedAccounts": {
    "youtube": { "connected": true, "subscribers": "184K" },
    "discord": { "connected": true, "members": "12.4K" }
  }
}`
    },
    {
      method: 'GET',
      path: '/api/creator/:username',
      desc: "Fetch complete creator profile by handle or CP-ID.",
      exampleResp: `{
  "success": true,
  "creator": {
    "passportId": "CP-000184",
    "username": "alex",
    "displayName": "Alex",
    "category": "Gaming Creator",
    "skills": ["Livestream Production", "Esports Casting"]
  }
}`
    },
    {
      method: 'GET',
      path: '/api/creator/by-discord/:discordId',
      desc: "Direct integration endpoint utilized by the single official Discord bot to query author credentials.",
      exampleResp: `{
  "passportId": "CP-000184",
  "displayName": "Alex",
  "status": "VERIFIED",
  "youtube": { "connected": true, "subscribers": "184K" },
  "discord": { "connected": true, "members": "12.4K" },
  "passportUrl": "https://creatorpassport.network/creator/CP-000184"
}`
    },
    {
      method: 'POST',
      path: '/api/auth/discord',
      desc: "Exchange OAuth2 authorization code for secure creator session.",
      exampleResp: `{
  "success": true,
  "sessionToken": "cp_sess_9a8f10b2...",
  "user": {
    "discordId": "894019280192837492",
    "passportId": "CP-000184"
  }
}`
    },
    {
      method: 'POST',
      path: '/api/verification/discord',
      desc: "Submit Discord guild ownership and member count verification.",
      exampleResp: `{
  "success": true,
  "platform": "DISCORD",
  "status": "VERIFIED",
  "guildId": "89401928",
  "memberCount": "12.4K"
}`
    },
    {
      method: 'POST',
      path: '/api/verification/youtube',
      desc: "Trigger official Google OAuth channel audit for subscriber tiers.",
      exampleResp: `{
  "success": true,
  "platform": "YOUTUBE",
  "status": "VERIFIED",
  "channelId": "UC_alex_gaming_official",
  "subscribers": "184K"
}`
    },
    {
      method: 'GET',
      path: '/api/achievements/:id',
      desc: "Fetch verified milestone badges associated with a Creator Passport.",
      exampleResp: `{
  "passportId": "CP-000184",
  "totalAchievements": 4,
  "achievements": [
    { "name": "Founding Creator", "slug": "founding-creator" },
    { "name": "Verified Creator", "slug": "verified-creator" }
  ]
}`
    },
    {
      method: 'GET',
      path: '/api/creators',
      desc: "Filter and search verified creators with query parameters.",
      exampleResp: `{
  "count": 6,
  "creators": [
    { "passportId": "CP-000184", "displayName": "Alex", "category": "Gaming Creator" }
  ]
}`
    }
  ];

  return (
    <div className="min-h-screen bg-[#08090b] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-400">
              <Code2 className="w-3.5 h-3.5" />
              <span>DEVELOPER PLATFORM</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Creator Passport REST API
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Standardized HTTP endpoints powering the website, public passport queries, and the single official Discord bot.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f1115] border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Architectural Rule: Single Backend Source of Truth</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Both the web application and the single official Discord bot communicate exclusively through these endpoints. Never store passwords, never bypass verification hashing, and never instantiate duplicate bot logic.
            </p>
          </div>

          {/* Endpoints List */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              API Endpoints Reference
            </h2>

            <div className="space-y-4">
              {endpoints.map((ep, idx) => (
                <div
                  key={ep.path}
                  className="rounded-xl bg-[#0d0f13] border border-white/[0.08] overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11141a]">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          ep.method === 'GET'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : ep.method === 'POST'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-sm font-semibold text-white">
                        {ep.path}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(ep.path, ep.path)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-400 hover:text-white border border-white/5 transition-colors self-start sm:self-auto font-mono"
                    >
                      {copiedEndpoint === ep.path ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-sky-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Path</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs text-slate-300">{ep.desc}</p>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                        RESPONSE PAYLOAD EXAMPLE
                      </span>
                      <pre className="p-4 rounded-lg bg-black/60 border border-white/5 text-[11px] font-mono text-sky-300 overflow-x-auto">
                        {ep.exampleResp}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
