import type { NextRequest } from 'next/server'
import { fail, handleRoute, ok } from '@/lib/validation'
import { getServerSupabase, requireRole } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* DELETE /api/crop-history/[id] — farmer removes a logged crop entry.        */
/* Ownership checked via .eq('farmer_id', ...) same as listings delete.       */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params
    const farmer = await requireRole('farmer')

    const supabase = await getServerSupabase()

    const { data, error } = await supabase
      .from('farmer_crop_history')
      .delete()
      .eq('id', id)
      .eq('farmer_id', farmer.id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[crop-history:delete]', error)
      return fail('Could not delete this entry.', 500)
    }

    if (!data) {
      return fail('Crop history entry not found.', 404)
    }

    return ok({ deleted: true })
  })
}
