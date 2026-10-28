-- ==============================================================================
-- VITALNEX Migration P7: share token revoke guard (PROMPTS P7 step 4)
-- Version: 20261028000001
--
-- The P1 policy "share_tokens: owner revokes" lets the owner UPDATE their own share rows
-- through PostgREST. Without a column guard an owner could also extend expires_at past
-- 7 days, un-revoke a link, or change its scope after handing it out. User requests may
-- now only set revoked_at once (NULL -> timestamp). The service role is not restricted.
-- Earlier migrations are left unchanged.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_share_token_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') AND (
        NEW.id IS DISTINCT FROM OLD.id
        OR NEW.token_hash IS DISTINCT FROM OLD.token_hash
        OR NEW.user_id IS DISTINCT FROM OLD.user_id
        OR NEW.scope IS DISTINCT FROM OLD.scope
        OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
        OR OLD.revoked_at IS NOT NULL
        OR NEW.revoked_at IS NULL
    ) THEN
        RAISE EXCEPTION 'a share link can only be revoked'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_share_token_columns ON share_tokens;
CREATE TRIGGER protect_share_token_columns
    BEFORE UPDATE ON share_tokens
    FOR EACH ROW EXECUTE FUNCTION public.protect_share_token_columns();
