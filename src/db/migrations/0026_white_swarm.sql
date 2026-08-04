CREATE TABLE "fabric_prompt_rules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_prompt_rules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_prompts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video_prompt" text,
	"video_prompt_enabled" boolean DEFAULT true NOT NULL,
	"video_duration_seconds" integer DEFAULT 8,
	"video_aspect_ratio" text DEFAULT '9:16',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "fabric_prompt_rules_active_priority_idx" ON "fabric_prompt_rules" USING btree ("is_active","priority");--> statement-breakpoint
CREATE INDEX "fabric_prompt_rules_name_idx" ON "fabric_prompt_rules" USING btree ("name");