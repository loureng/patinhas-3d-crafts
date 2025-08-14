# Production Queue Migration

## Purpose

This migration was added to fix the PGRST205 error occurring in the admin UI when accessing `/admin/production-queue`.

## Problem

After commit "feat: Implementa integração completa admin-to-frontend com real-time sync #318", the admin UI started throwing PostgREST errors with message: "Could not find the table 'public.production_queue' in the schema cache".

## Root Cause

The existing `production_queue` table had a complex structure with relationships to `order_id` and `order_item_id` that didn't match what the frontend expected. The admin UI requires a simpler table structure with direct references to `product_id`, `user_id`, and basic production queue fields.

## Solution

This migration:

1. **Drops** the existing complex `production_queue` table
2. **Creates** a new simplified `production_queue` table with:
   - Direct `product_id` reference to products
   - Direct `user_id` reference to auth.users  
   - Simple `quantity`, `status`, `priority` fields
   - Proper RLS policies for authenticated users
   - Index on `(status, priority)` for performance
   - Trigger to update `updated_at` timestamp

## Related Files

- **Migration**: `20250814225116_c3b0fca0-017c-484e-ae01-77eb7f310e9c.sql`
- **Logs reference**: Error logs captured in `logs-2025-08-14T22_34_53.813Z.json`

## Impact

This fixes the admin UI production queue page and allows administrators to:
- View production queue items
- Add new items to the queue
- Update status and priority
- Delete items from the queue

The RLS policies are permissive to avoid breaking admin workflows. Maintainers can tighten access control later if needed.