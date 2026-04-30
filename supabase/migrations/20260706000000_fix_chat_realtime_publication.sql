-- ============================================================================
-- Migration: Enable Supabase Realtime for chat tables
-- Version: 20260706000000
-- Problem: chat_messages, chat_participants, chat_conversations, and
--          chat_typing_indicators were NOT added to the supabase_realtime
--          PostgreSQL publication, so postgres_changes subscriptions in
--          useChat.ts received zero events — real-time chat updates were
--          completely broken between users.
-- Fix:
--   1. Set REPLICA IDENTITY FULL on each table so that row-level filters
--      (e.g. filter: "conversation_id=eq.<id>" and "user_id=eq.<id>") work
--      correctly for all event types (INSERT / UPDATE / DELETE).
--   2. Add each table to the supabase_realtime publication.
-- ============================================================================

-- Step 1: REPLICA IDENTITY FULL — required for filtered subscriptions
--         on non-primary-key columns (conversation_id, user_id, etc.)
ALTER TABLE public.chat_messages          REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants      REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations     REPLICA IDENTITY FULL;
ALTER TABLE public.chat_typing_indicators REPLICA IDENTITY FULL;

-- Step 2: Add tables to the supabase_realtime publication.
--         Without this, Supabase Realtime ignores all changes to these tables.
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_indicators;
