-- Disk IO check: read-only, changes nothing. Paste into Supabase -> SQL Editor -> Run, then send Claude the results
-- of each block (the editor shows one result at a time: run them one by one if needed).

-- 1. Biggest tables (rows and size on disk)
select relname as table_name, n_live_tup as rows, pg_size_pretty(pg_total_relation_size(relid)) as total_size,
       seq_scan as full_scans, idx_scan as index_scans
from pg_stat_user_tables order by pg_total_relation_size(relid) desc limit 12;

-- 2. Heaviest queries since stats were last reset (total time spent)
select round(total_exec_time::numeric/1000, 1) as total_seconds, calls,
       round(mean_exec_time::numeric, 1) as avg_ms, shared_blks_read as blocks_read_from_disk,
       left(regexp_replace(query, '\s+', ' ', 'g'), 160) as query
from pg_stat_statements order by shared_blks_read desc limit 15;

-- 3. Events per day for the last week (how fast the events log grows)
select created_at::date as day, count(*) as events from events
where created_at > now() - interval '7 days' group by 1 order by 1;

-- 4. Busiest event names in the last 24 hours
select name, count(*) from events where created_at > now() - interval '1 day' group by 1 order by 2 desc limit 20;
