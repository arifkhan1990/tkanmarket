CREATE TABLE "ai_prompt_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_prompt_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"fabric_id" integer,
	"model" text NOT NULL,
	"prompt" text NOT NULL,
	"system_prompt" text,
	"response_text" text,
	"image_count" integer,
	"video_count" integer,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_prompt_logs" ADD CONSTRAINT "ai_prompt_logs_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_prompt_logs_fabric_id_idx" ON "ai_prompt_logs" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "ai_prompt_logs_source_idx" ON "ai_prompt_logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "ai_prompt_logs_created_at_idx" ON "ai_prompt_logs" USING btree ("created_at");