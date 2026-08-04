CREATE TABLE "fabric_text_prompt_rules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_text_prompt_rules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enrichment_system_prompt" text,
	"enrichment_user_template" text,
	"translation_system_prompt" text,
	"translation_user_template" text,
	"social_system_prompt" text,
	"social_user_template" text,
	"blog_system_prompt" text,
	"blog_user_template" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "fabric_text_rules_active_priority_idx" ON "fabric_text_prompt_rules" USING btree ("is_active","priority");--> statement-breakpoint
CREATE INDEX "fabric_text_rules_name_idx" ON "fabric_text_prompt_rules" USING btree ("name");