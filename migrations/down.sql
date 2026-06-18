-- Rollback script for agent runs and steps
DROP INDEX IF EXISTS run_step_idx;
DROP TABLE IF EXISTS agent_steps;
DROP TABLE IF EXISTS agent_runs;
