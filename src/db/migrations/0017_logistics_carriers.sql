DO $$ BEGIN
	CREATE TYPE "public"."logistics_carrier_health" AS ENUM('OPERATIONAL', 'DELAYED', 'MAINTENANCE');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."logistics_carrier_service_type" AS ENUM('EXPRESS', 'ECONOMY', 'FREIGHT');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logistics_carriers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logistics_carriers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"carrier_code" text NOT NULL,
	"logo_url" text,
	"region_tag" text,
	"service_type" "logistics_carrier_service_type" DEFAULT 'EXPRESS' NOT NULL,
	"health" "logistics_carrier_health" DEFAULT 'OPERATIONAL' NOT NULL,
	"reliability_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"avg_transit_days" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "logistics_carriers_carrier_code_unique" UNIQUE("carrier_code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logistics_carriers_health_idx" ON "logistics_carriers" USING btree ("health");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logistics_carriers_service_type_idx" ON "logistics_carriers" USING btree ("service_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logistics_carriers_deleted_at_idx" ON "logistics_carriers" USING btree ("deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logistics_carrier_lanes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logistics_carrier_lanes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"carrier_id" integer NOT NULL,
	"lane_code" text NOT NULL,
	"avg_transit_days" numeric(5, 2) DEFAULT '0' NOT NULL,
	"reliability_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "logistics_carrier_lanes" ADD CONSTRAINT "logistics_carrier_lanes_carrier_id_logistics_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."logistics_carriers"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logistics_carrier_lanes_carrier_id_idx" ON "logistics_carrier_lanes" USING btree ("carrier_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logistics_carrier_lanes_lane_code_idx" ON "logistics_carrier_lanes" USING btree ("lane_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logistics_carrier_lanes_deleted_at_idx" ON "logistics_carrier_lanes" USING btree ("deleted_at");
