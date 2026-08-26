-- ============================================================================
-- Insurer list cleanup — 26 Aug 2026
-- ============================================================================
--
-- schema.sql drops and recreates everything, so it CANNOT be re-run against
-- the live database. This migration applies the same insurer changes in place.
--
-- HOW TO RUN
-- ----------
-- Paste into the Supabase SQL editor and run. Safe to run more than once:
-- every statement matches on the old name, so a second run changes nothing.
--
-- WHAT IT DOES
--   1. Renames insurers to their full trading names (the "Select Insurer"
--      field showed abbreviations like "CBZ" and "AFC").
--   2. Removes Doves, Ecosure, Nyaradzo, Zimnat and First Mutual.
--      "Zimnat" is the standalone row only — "Zimnat Lion Insurance" stays.
-- ============================================================================

begin;

-- --- 1. Full trading names -------------------------------------------------
update organizations set name = 'AFC Insurance'            where name = 'AFC'                 and type = 'partner_insurer';
update organizations set name = 'Alliance Insurance'       where name = 'Alliance'            and type = 'partner_insurer';
update organizations set name = 'Allied Insurance'         where name = 'Allied'              and type = 'partner_insurer';
update organizations set name = 'CBZ Insurance'            where name = 'CBZ'                 and type = 'partner_insurer';
update organizations set name = 'CELL Insurance'           where name = 'CELL'                and type = 'partner_insurer';
update organizations set name = 'Champions Insurance'      where name = 'Champions'           and type = 'partner_insurer';
update organizations set name = 'Clarion Insurance'        where name = 'Clarion'             and type = 'partner_insurer';
update organizations set name = 'Credsure Insurance'       where name = 'Credsure'            and type = 'partner_insurer';
update organizations set name = 'ECGC Insurance'           where name = 'ECGC'                and type = 'partner_insurer';
update organizations set name = 'Econet Insurance'         where name = 'Econet'              and type = 'partner_insurer';
update organizations set name = 'Empaya Insurance'         where name = 'Empaya'              and type = 'partner_insurer';
update organizations set name = 'Evolution Insurance'      where name = 'Evolution'           and type = 'partner_insurer';
update organizations set name = 'FBC Insurance'            where name = 'FBC'                 and type = 'partner_insurer';
update organizations set name = 'Misty Insurance'          where name = 'Misty'               and type = 'partner_insurer';
update organizations set name = 'Nicoz Diamond Insurance'  where name = 'Nicoz Diamond'       and type = 'partner_insurer';
update organizations set name = 'Old Mutual Insurance'     where name = 'Old Mutual Zimbabwe' and type = 'partner_insurer';
update organizations set name = 'Quality Insurance'        where name = 'Quality'             and type = 'partner_insurer';
update organizations set name = 'Safel Insurance'          where name = 'Safel'               and type = 'partner_insurer';
update organizations set name = 'Sanctuary Insurance'      where name = 'Sanctuary'           and type = 'partner_insurer';
update organizations set name = 'Zimnat Lion Insurance'    where name = 'Zimnat Lion'         and type = 'partner_insurer';
-- 'Hamilton' is already correct and stays as-is.

-- The primary underwriter, listed by trading name like everyone else.
update organizations set name = 'Motions Microinsurance'
 where id = '22222222-2222-2222-2222-222222222222';

-- --- 2. Removals -----------------------------------------------------------
-- Retire first: an insurer already carrying a policy, owning a product or
-- employing an agent cannot be deleted without breaking those references.
-- 'terminated' drops it out of /api/insurers (which filters status =
-- 'active') either way, so the list is correct even where the row survives.
update organizations
   set status = 'terminated'
 where type = 'partner_insurer'
   and name in ('Doves', 'Ecosure', 'Nyaradzo', 'Zimnat', 'First Mutual');

-- Then delete the ones nothing points at, so they're gone for good.
delete from organizations o
 where o.type = 'partner_insurer'
   and o.name in ('Doves', 'Ecosure', 'Nyaradzo', 'Zimnat', 'First Mutual')
   and not exists (select 1 from insurance_products p where p.provider_id     = o.id)
   and not exists (select 1 from policies          p where p.underwriter_id   = o.id)
   and not exists (select 1 from agents            a where a.organization_id  = o.id);

commit;

-- --- Verify ----------------------------------------------------------------
-- Should list exactly what the "Select Insurer" field will show.
select name, type
  from organizations
 where type in ('microinsurer', 'partner_insurer')
   and status = 'active'
 order by name;
