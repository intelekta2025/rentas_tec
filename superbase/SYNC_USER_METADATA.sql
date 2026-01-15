-- FUNCTION: sync_user_metadata
-- Purpose: Syncs role and unit/client info from profile tables to auth.users metadata
-- permitting 0-latency role checks on frontend.

CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_unit_id uuid;
  v_client_id uuid;
  v_meta jsonb;
BEGIN
  -- Determine source table and extract data
  IF TG_TABLE_NAME = 'system_users' THEN
    v_role := NEW.role;
    v_unit_id := NEW.unit_id;
    v_meta := jsonb_build_object(
      'role', v_role,
      'unit_id', v_unit_id,
      'is_staff', true
    );
  ELSIF TG_TABLE_NAME = 'client_portal_users' THEN
    v_role := 'Client'; -- Hardcoded or fetch from column if exists
    v_client_id := NEW.client_id;
    v_meta := jsonb_build_object(
      'role', v_role,
      'client_id', v_client_id,
      'is_client', true
    );
  END IF;

  -- Update auth.users
  -- Uses raw_app_meta_data which is secure (only writable by service role/postgres)
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || v_meta
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: system_users
DROP TRIGGER IF EXISTS on_system_user_update ON public.system_users;
CREATE TRIGGER on_system_user_update
  AFTER INSERT OR UPDATE ON public.system_users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_metadata();

-- TRIGGER: client_portal_users
DROP TRIGGER IF EXISTS on_client_portal_user_update ON public.client_portal_users;
CREATE TRIGGER on_client_portal_user_update
  AFTER INSERT OR UPDATE ON public.client_portal_users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_metadata();
