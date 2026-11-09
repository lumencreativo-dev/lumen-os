/**
 * Meta Graph API Client for Lumen Suite
 * Handles Instagram Content Publishing & Facebook Page Publishing
 * 
 * Safety: Supports META_DRY_RUN mode to simulate requests without altering live accounts.
 */

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface ConnectedMetaAccount {
  facebookPageId: string;
  facebookPageName: string;
  pageAccessToken?: string;
  instagramBusinessAccountId: string | null;
  instagramUsername: string | null;
}

export interface PublishMediaParams {
  instagramBusinessAccountId?: string;
  facebookPageId?: string;
  caption: string;
  mediaUrl: string;
  mediaType?: 'IMAGE' | 'REEL' | 'CAROUSEL' | 'STORY';
  scheduledTimestamp?: number; // UNIX timestamp in seconds
  dryRun?: boolean;
}

export interface PublishResult {
  success: boolean;
  metaPostId?: string;
  scheduled?: boolean;
  details?: Record<string, unknown>;
  error?: string;
}

export function getMetaAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN is not configured in environment variables');
  }
  return token;
}

export function isDryRunActive(paramDryRun?: boolean): boolean {
  if (paramDryRun !== undefined) return paramDryRun;
  return process.env.META_DRY_RUN === 'true';
}

export async function getConnectedMetaAccounts(): Promise<ConnectedMetaAccount[]> {
  const token = getMetaAccessToken();
  const url = `${GRAPH_BASE_URL}/me/accounts?fields=name,id,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to fetch Meta accounts');
  }

  const accounts: ConnectedMetaAccount[] = (data.data || []).map((page: {
    id: string;
    name: string;
    access_token?: string;
    instagram_business_account?: { id: string; username: string };
  }) => ({
    facebookPageId: page.id,
    facebookPageName: page.name,
    pageAccessToken: page.access_token,
    instagramBusinessAccountId: page.instagram_business_account?.id || null,
    instagramUsername: page.instagram_business_account?.username || null,
  }));

  return accounts;
}

export async function publishToInstagram(params: {
  instagramAccountId: string;
  caption: string;
  mediaUrl: string;
  mediaType?: string;
  scheduledTimestamp?: number;
  dryRun?: boolean;
}): Promise<PublishResult> {
  const { instagramAccountId, caption, mediaUrl, scheduledTimestamp, dryRun } = params;

  if (isDryRunActive(dryRun)) {
    return {
      success: true,
      metaPostId: `sim_ig_${Date.now()}`,
      scheduled: !!scheduledTimestamp,
      details: {
        simulated: true,
        instagramAccountId,
        mediaUrl,
        captionSnippet: caption.slice(0, 40),
        scheduledTimestamp,
      },
    };
  }

  const token = getMetaAccessToken();

  const containerParams = new URLSearchParams();
  containerParams.append('access_token', token);
  containerParams.append('caption', caption);
  containerParams.append('image_url', mediaUrl);

  if (scheduledTimestamp) {
    containerParams.append('published', 'false');
    containerParams.append('scheduled_publish_time', scheduledTimestamp.toString());
  }

  const containerUrl = `${GRAPH_BASE_URL}/${instagramAccountId}/media`;
  const containerRes = await fetch(containerUrl, {
    method: 'POST',
    body: containerParams,
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    return {
      success: false,
      error: containerData.error?.message || 'Error creating Instagram media container',
    };
  }

  const creationId = containerData.id;

  if (scheduledTimestamp) {
    return {
      success: true,
      metaPostId: creationId,
      scheduled: true,
      details: containerData,
    };
  }

  const publishParams = new URLSearchParams();
  publishParams.append('access_token', token);
  publishParams.append('creation_id', creationId);

  const publishUrl = `${GRAPH_BASE_URL}/${instagramAccountId}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    body: publishParams,
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    return {
      success: false,
      error: publishData.error?.message || 'Error publishing Instagram media container',
    };
  }

  return {
    success: true,
    metaPostId: publishData.id,
    scheduled: false,
    details: publishData,
  };
}

export async function publishToFacebookPage(params: {
  facebookPageId: string;
  caption: string;
  mediaUrl?: string;
  scheduledTimestamp?: number;
  dryRun?: boolean;
}): Promise<PublishResult> {
  const { facebookPageId, caption, mediaUrl, scheduledTimestamp, dryRun } = params;

  if (isDryRunActive(dryRun)) {
    return {
      success: true,
      metaPostId: `sim_fb_${Date.now()}`,
      scheduled: !!scheduledTimestamp,
      details: {
        simulated: true,
        facebookPageId,
        mediaUrl,
        captionSnippet: caption.slice(0, 40),
        scheduledTimestamp,
      },
    };
  }

  const token = getMetaAccessToken();
  const endpoint = mediaUrl
    ? `${GRAPH_BASE_URL}/${facebookPageId}/photos`
    : `${GRAPH_BASE_URL}/${facebookPageId}/feed`;

  const bodyParams = new URLSearchParams();
  bodyParams.append('access_token', token);

  if (mediaUrl) {
    bodyParams.append('url', mediaUrl);
    bodyParams.append('caption', caption);
  } else {
    bodyParams.append('message', caption);
  }

  if (scheduledTimestamp) {
    bodyParams.append('published', 'false');
    bodyParams.append('scheduled_publish_time', scheduledTimestamp.toString());
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    body: bodyParams,
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    return {
      success: false,
      error: data.error?.message || 'Error publishing to Facebook Page',
    };
  }

  return {
    success: true,
    metaPostId: data.id || data.post_id,
    scheduled: !!scheduledTimestamp,
    details: data,
  };
}
