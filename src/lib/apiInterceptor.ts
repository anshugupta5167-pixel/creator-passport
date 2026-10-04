import { ApiStore } from './apiStore';
import { formatSubscriberCount } from './youtube';

export function setupApiInterceptor() {
  if (typeof window === 'undefined') return;

  let originalFetch: typeof window.fetch;
  try {
    originalFetch = window.fetch ? window.fetch.bind(window) : fetch;
  } catch (e) {
    originalFetch = fetch;
  }

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept relative or local /api/* routes
    if (!urlString.includes('/api/')) {
      return originalFetch(input, init);
    }

    let url: URL;
    try {
      url = new URL(urlString, window.location.origin);
    } catch (e) {
      return originalFetch(input, init);
    }

    const pathname = url.pathname;
    const method = (init?.method || 'GET').toUpperCase();

    const makeJsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    };

    let bodyData: any = {};
    if (init?.body && typeof init.body === 'string') {
      try {
        bodyData = JSON.parse(init.body);
      } catch (e) {
        bodyData = {};
      }
    }

    try {
      // 1. /api/creators
      if (pathname === '/api/creators') {
        const check = url.searchParams.get('check');
        if (check) {
          const creators = ApiStore.getCreators();
          const cleanCheck = check.toLowerCase().replace(/^@/, '');
          const match = creators.find(c => (c.slug || c.username || '').toLowerCase() === cleanCheck);
          return makeJsonResponse({ claimed: Boolean(match), creator: match || null });
        }

        if (method === 'GET') {
          const q = url.searchParams.get('q');
          let creators = ApiStore.getCreators();
          if (q) {
            const cleanQ = q.toLowerCase();
            creators = creators.filter(c =>
              c.displayName.toLowerCase().includes(cleanQ) ||
              c.username.toLowerCase().includes(cleanQ) ||
              (c.category && c.category.toLowerCase().includes(cleanQ))
            );
          }
          return makeJsonResponse({ count: creators.length, creators });
        }

        if (method === 'POST') {
          const saved = ApiStore.saveCreator(bodyData);
          return makeJsonResponse({ success: true, creator: saved });
        }

        if (method === 'DELETE') {
          const slug = url.searchParams.get('slug') || bodyData.slug;
          if (slug) {
            ApiStore.deleteCreator(slug);
            return makeJsonResponse({ success: true, message: `Creator @${slug} permanently deleted.` });
          }
          return makeJsonResponse({ error: 'Slug required' }, 400);
        }
      }

      // 2. /api/auth/signin
      if (pathname === '/api/auth/signin' && method === 'POST') {
        const identifier = (bodyData.identifier || bodyData.emailOrUsername || bodyData.email || bodyData.username || bodyData.staffId || '').toString().trim();
        const cleanId = identifier.toLowerCase().replace(/^@/, '');
        
        // Admin staff login fast-path
        if (cleanId === 'admin' || cleanId === 'admin@creatorhq.fun' || cleanId === 'staff' || cleanId === 'anshu') {
          const adminUser = ApiStore.getUsers().find(u => u.role === 'ADMIN') || {
            id: 'usr_admin_system_001',
            email: 'admin@creatorhq.fun',
            username: 'admin',
            displayName: 'CreatorHQ Staff Admin',
            role: 'ADMIN' as const,
            emailVerified: true,
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
          };
          ApiStore.setSession(adminUser);
          ApiStore.addAuditLog('STAFF_SIGNIN', 'Staff Admin', 'Admin authenticated into staff console');
          return makeJsonResponse({
            success: true,
            message: 'Signed in as Staff Admin successfully.',
            user: adminUser,
            creator: null,
          });
        }

        // Creator user login
        const users = ApiStore.getUsers();
        const found = users.find(u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId);
        if (found) {
          ApiStore.setSession(found);
          const creators = ApiStore.getCreators();
          const creator = creators.find(c =>
            (c.userId && c.userId === found.id) ||
            (c.slug && c.slug.toLowerCase() === found.username.toLowerCase()) ||
            (c.username && c.username.toLowerCase() === found.username.toLowerCase()) ||
            (c.contactEmail && c.contactEmail.toLowerCase() === found.email.toLowerCase())
          );
          return makeJsonResponse({
            success: true,
            message: 'Signed in successfully.',
            user: {
              ...found,
              displayName: creator?.displayName || found.displayName,
              avatarUrl: creator?.avatarUrl || found.avatarUrl,
            },
            creator: creator || null,
          });
        }

        // Create new user session
        const newUser = {
          id: `usr_${Date.now()}`,
          email: identifier.includes('@') ? identifier : `${cleanId}@creatorhq.fun`,
          username: cleanId,
          displayName: identifier,
          role: 'CREATOR' as const,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        ApiStore.setSession(newUser);
        return makeJsonResponse({
          success: true,
          user: newUser,
          creator: null,
        });
      }

      // 3. /api/auth/me
      if (pathname === '/api/auth/me') {
        const user = ApiStore.getCurrentUser();
        if (user) {
          const creators = ApiStore.getCreators();
          const creator = creators.find(c =>
            (c.userId && c.userId === user.id) ||
            (c.slug && c.slug.toLowerCase() === user.username.toLowerCase()) ||
            (c.username && c.username.toLowerCase() === user.username.toLowerCase()) ||
            (c.contactEmail && c.contactEmail.toLowerCase() === user.email.toLowerCase())
          );
          return makeJsonResponse({
            authenticated: true,
            user: {
              ...user,
              displayName: creator?.displayName || user.displayName,
              avatarUrl: creator?.avatarUrl || user.avatarUrl,
            },
            creator: creator || null,
          });
        }
        return makeJsonResponse({ authenticated: false, user: null, creator: null });
      }

      // 4. /api/auth/signout
      if (pathname === '/api/auth/signout') {
        ApiStore.clearSession();
        return makeJsonResponse({ success: true, message: 'Signed out successfully.' });
      }

      // 5. /api/auth/signup
      if (pathname === '/api/auth/signup' && method === 'POST') {
        const email = (bodyData.email || '').toString().toLowerCase().trim();
        const username = (bodyData.username || '').toString().toLowerCase().replace(/^@/, '').trim();
        const displayName = bodyData.displayName || username;

        const newUser = {
          id: `usr_${Date.now()}`,
          email,
          username,
          displayName,
          role: 'CREATOR' as const,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const users = ApiStore.getUsers();
        users.push(newUser);
        ApiStore.setSession(newUser);
        return makeJsonResponse({ success: true, user: newUser });
      }

      // 6. /api/verification/review
      if (pathname === '/api/verification/review' && method === 'POST') {
        const { creatorSlug, slug, action, rejectionReason } = bodyData;
        const target = creatorSlug || slug;
        const isApproved = action === 'APPROVE';

        const updated = ApiStore.verifyCreator(target, isApproved);
        if (updated) {
          const verification = ApiStore.saveVerification({
            id: `vrf_${updated.slug}`,
            creatorSlug: updated.slug,
            creatorName: updated.displayName,
            creatorAvatar: updated.avatarUrl,
            category: updated.category,
            status: isApproved ? 'VERIFIED' : 'REJECTED',
            submittedAt: updated.issuedAt || new Date().toISOString(),
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin',
            rejectionReason: !isApproved ? (rejectionReason || 'Proof inconclusive') : undefined,
          });

          return makeJsonResponse({
            success: true,
            creator: updated,
            verification,
          });
        }
        return makeJsonResponse({ error: 'Creator not found' }, 404);
      }

      // 7. /api/verification/submit
      if (pathname === '/api/verification/submit') {
        if (method === 'GET') {
          return makeJsonResponse({ verifications: ApiStore.getVerifications() });
        }
        if (method === 'POST') {
          const submission = ApiStore.saveVerification({
            id: `vrf_${bodyData.creatorSlug || Date.now()}`,
            creatorSlug: bodyData.creatorSlug || 'creator',
            creatorName: bodyData.creatorName || 'Creator',
            creatorAvatar: bodyData.creatorAvatar,
            category: bodyData.category || 'Creator',
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            proofDocuments: bodyData.proofDocuments || [],
            connectedPlatforms: bodyData.connectedPlatforms || {},
          });
          return makeJsonResponse({ success: true, submission });
        }
      }

      // 8. /api/admin/audit-logs
      if (pathname === '/api/admin/audit-logs') {
        return makeJsonResponse({ logs: ApiStore.getAuditLogs() });
      }

      // 9. /api/youtube/detect, /api/discord/detect, /api/instagram/detect, /api/channels/add
      if (
        pathname === '/api/youtube/detect' ||
        pathname === '/api/discord/detect' ||
        pathname === '/api/instagram/detect' ||
        pathname === '/api/channels/add'
      ) {
        try {
          const serverRes = await originalFetch(input, init);
          if (serverRes.ok) return serverRes;
        } catch (e) {}
      }

      // 10. /api/ip
      if (pathname === '/api/ip') {
        return makeJsonResponse({ ip: '127.0.0.1' });
      }

      // 13. /api/creator/:username
      if (pathname.startsWith('/api/creator/')) {
        const target = pathname.replace('/api/creator/', '').replace(/^@/, '');
        const creators = ApiStore.getCreators();
        const creator = creators.find(c =>
          (c.slug && c.slug.toLowerCase() === target.toLowerCase()) ||
          (c.username && c.username.toLowerCase() === target.toLowerCase()) ||
          (c.passportId && c.passportId.toLowerCase() === target.toLowerCase())
        );
        if (creator) {
          return makeJsonResponse({ success: true, creator });
        }
        return makeJsonResponse({ error: 'Creator not found' }, 404);
      }

      // Fallback to original fetch
      return originalFetch(input, init);
    } catch (err: any) {
      console.warn('[API Interceptor Notice]:', err);
      return originalFetch(input, init);
    }
  };

  // Safely define on window / Window.prototype without throwing if read-only
  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      writable: true,
      configurable: true,
    });
  } catch (e1) {
    try {
      Object.defineProperty(Window.prototype, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
    } catch (e2) {
      // In environments where window.fetch cannot be redefined, Vite dev server handles /api/*
      console.info('[CreatorHQ] Browser window.fetch is sealed; falling back to server endpoints.');
    }
  }
}
