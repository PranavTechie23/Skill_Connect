CREATE TABLE "agent_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"agent_type" text NOT NULL,
	"goal" text NOT NULL,
	"status" text NOT NULL,
	"result_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"tool_name" text,
	"input_json" jsonb DEFAULT '{}'::jsonb,
	"output_json" jsonb DEFAULT '{}'::jsonb,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "run_step_idx" ON "agent_steps" USING btree ("run_id","step_order");