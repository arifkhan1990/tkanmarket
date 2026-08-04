CREATE TABLE "wholesale_pricing_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wholesale_pricing_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fabric_id" integer NOT NULL,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sim_base_unit_cost_usd" numeric(12, 4),
	"sim_min_target_margin_percent" numeric(6, 2),
	"sim_volume_decay_factor" numeric(6, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "system_maintenance_config" ALTER COLUMN "body" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "wholesale_pricing_profiles" ADD CONSTRAINT "wholesale_pricing_profiles_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wholesale_pricing_profiles_fabric_id_uq" ON "wholesale_pricing_profiles" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "wholesale_pricing_profiles_fabric_id_idx" ON "wholesale_pricing_profiles" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "wholesale_pricing_profiles_deleted_at_idx" ON "wholesale_pricing_profiles" USING btree ("deleted_at");