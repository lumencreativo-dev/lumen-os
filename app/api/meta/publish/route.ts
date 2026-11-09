import { NextRequest, NextResponse } from 'next/server';
import { publishToInstagram, publishToFacebookPage, isDryRunActive } from '@/lib/meta';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      itemId,
      clientId,
      caption = '',
      mediaUrl = '',
      mediaType = 'IMAGE',
      targetChannels = ['instagram'],
      scheduledTime = null,
      customIgId = null,
      customFbId = null,
      dryRun,
    } = body;

    const safeDryRun = isDryRunActive(dryRun);
    const results: Record<string, unknown> = {};
    let isScheduled = false;
    let scheduledTimestamp: number | undefined;

    if (scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      const now = new Date();
      if (scheduledDate > now) {
        scheduledTimestamp = Math.floor(scheduledDate.getTime() / 1000);
        isScheduled = true;
      }
    }

    // 1. Instagram publishing
    if (targetChannels.includes('instagram')) {
      const igId = customIgId || process.env.LUMEN_IG_ACCOUNT_ID;
      if (!igId) {
        return NextResponse.json(
          { error: 'No hay una cuenta de Instagram configurada para esta publicación.' },
          { status: 400 }
        );
      }

      if (!mediaUrl) {
        return NextResponse.json(
          { error: 'Instagram requiere obligatoriamente una imagen o video para publicar.' },
          { status: 400 }
        );
      }

      const igResult = await publishToInstagram({
        instagramAccountId: igId,
        caption,
        mediaUrl,
        mediaType,
        scheduledTimestamp,
        dryRun: safeDryRun,
      });

      results.instagram = igResult;
      if (!igResult.success) {
        return NextResponse.json(
          { error: `Fallo en Instagram: ${igResult.error}`, results },
          { status: 500 }
        );
      }
    }

    // 2. Facebook publishing
    if (targetChannels.includes('facebook')) {
      const fbId = customFbId || process.env.LUMEN_FB_PAGE_ID;
      if (!fbId) {
        return NextResponse.json(
          { error: 'No hay una página de Facebook configurada para esta publicación.' },
          { status: 400 }
        );
      }

      const fbResult = await publishToFacebookPage({
        facebookPageId: fbId,
        caption,
        mediaUrl: mediaUrl || undefined,
        scheduledTimestamp,
        dryRun: safeDryRun,
      });

      results.facebook = fbResult;
      if (!fbResult.success) {
        return NextResponse.json(
          { error: `Fallo en Facebook: ${fbResult.error}`, results },
          { status: 500 }
        );
      }
    }

    // 3. Update Supabase if Supabase client is available and itemId is given
    try {
      const supabase = await createClient();
      const metaPostId =
        (results.instagram as { metaPostId?: string })?.metaPostId ||
        (results.facebook as { metaPostId?: string })?.metaPostId ||
        `meta_${Date.now()}`;

      if (itemId) {
        await supabase
          .from('planner_items')
          .update({
            status: isScheduled ? 'Programado' : 'Publicado',
            meta_post_id: metaPostId,
            published_link: isScheduled
              ? undefined
              : `https://instagram.com/p/${metaPostId}`,
          })
          .eq('id', itemId);
      }
    } catch {
      // Continue even if table doesn't have custom columns
    }

    const metaPostId =
      (results.instagram as { metaPostId?: string })?.metaPostId ||
      (results.facebook as { metaPostId?: string })?.metaPostId ||
      `meta_${Date.now()}`;

    return NextResponse.json({
      success: true,
      dryRun: safeDryRun,
      isScheduled,
      metaPostId,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al procesar publicación';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
