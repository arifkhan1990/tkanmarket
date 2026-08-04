ALTER TABLE "ai_prompt_logs" ADD COLUMN "actor_id" integer;--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD COLUMN "prompt_token_count" integer;--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD COLUMN "candidates_token_count" integer;--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD COLUMN "total_token_count" integer;--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD COLUMN "cost_usd" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD CONSTRAINT "ai_prompt_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_prompt_logs_actor_idx" ON "ai_prompt_logs" USING btree ("actor_id");