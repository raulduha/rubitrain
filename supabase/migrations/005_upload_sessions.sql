-- Add upload_id to group all rows from a single Excel upload together
alter table performance_logs add column if not exists upload_id uuid;
alter table match_metrics    add column if not exists upload_id uuid;

create index if not exists idx_performance_logs_upload_id on performance_logs(upload_id);
create index if not exists idx_match_metrics_upload_id    on match_metrics(upload_id);
