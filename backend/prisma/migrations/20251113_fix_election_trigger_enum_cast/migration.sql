-- Fix LOWER() function calls on ElectionStatus enum
-- The trigger was trying to call LOWER() on an enum type without casting to text first
-- This was causing "function lower(\"ElectionStatus\") does not exist" errors

CREATE OR REPLACE FUNCTION update_election_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment total elections
    UPDATE "SystemStats"
    SET value = jsonb_set(
                  jsonb_set(value, '{count}', to_jsonb((value->>'count')::int + 1)),
                  '{timestamp}', to_jsonb(NOW())
                ),
        "updatedAt" = NOW()
    WHERE key = 'total_elections';

    -- Increment status-specific count
    -- FIX: Cast enum to text before calling LOWER()
    UPDATE "SystemStats"
    SET value = jsonb_set(
                  jsonb_set(value, '{count}', to_jsonb((value->>'count')::int + 1)),
                  '{timestamp}', to_jsonb(NOW())
                ),
        "updatedAt" = NOW()
    WHERE key = LOWER(NEW.status::text) || '_elections';

  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change
    IF OLD.status <> NEW.status THEN
      -- Decrement old status count
      -- FIX: Cast enum to text before calling LOWER()
      UPDATE "SystemStats"
      SET value = jsonb_set(
                    jsonb_set(value, '{count}', to_jsonb((value->>'count')::int - 1)),
                    '{timestamp}', to_jsonb(NOW())
                  ),
          "updatedAt" = NOW()
      WHERE key = LOWER(OLD.status::text) || '_elections';

      -- Increment new status count
      -- FIX: Cast enum to text before calling LOWER()
      UPDATE "SystemStats"
      SET value = jsonb_set(
                    jsonb_set(value, '{count}', to_jsonb((value->>'count')::int + 1)),
                    '{timestamp}', to_jsonb(NOW())
                  ),
          "updatedAt" = NOW()
      WHERE key = LOWER(NEW.status::text) || '_elections';
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement total elections
    UPDATE "SystemStats"
    SET value = jsonb_set(
                  jsonb_set(value, '{count}', to_jsonb((value->>'count')::int - 1)),
                  '{timestamp}', to_jsonb(NOW())
                ),
        "updatedAt" = NOW()
    WHERE key = 'total_elections';

    -- Decrement status-specific count
    -- FIX: Cast enum to text before calling LOWER()
    UPDATE "SystemStats"
    SET value = jsonb_set(
                  jsonb_set(value, '{count}', to_jsonb((value->>'count')::int - 1)),
                  '{timestamp}', to_jsonb(NOW())
                ),
        "updatedAt" = NOW()
    WHERE key = LOWER(OLD.status::text) || '_elections';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
