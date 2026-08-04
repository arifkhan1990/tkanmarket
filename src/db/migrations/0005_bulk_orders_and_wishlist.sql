CREATE TYPE "public"."bulk_order_status" AS ENUM('PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "public"."supplier_tier" AS ENUM('PLATINUM', 'GOLD', 'SILVER', 'STANDARD');--> statement-breakpoint
CREATE TABLE "bulk_orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bulk_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_reference" text NOT NULL,
	"buyer_company_name" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"supplier_tier" "supplier_tier" DEFAULT 'STANDARD' NOT NULL,
	"total_meters" numeric(14, 2) NOT NULL,
	"estimated_value_usd" numeric(14, 2),
	"status" "bulk_order_status" DEFAULT 'PROCESSING' NOT NULL,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bulk_orders_order_reference_unique" UNIQUE("order_reference")
);
--> statement-breakpoint
CREATE TABLE "buyer_wishlist_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "buyer_wishlist_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"fabric_id" integer NOT NULL,
	"collection_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bulk_orders" ADD CONSTRAINT "bulk_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_wishlist_items" ADD CONSTRAINT "buyer_wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_wishlist_items" ADD CONSTRAINT "buyer_wishlist_items_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bulk_orders_supplier_id_idx" ON "bulk_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "bulk_orders_status_idx" ON "bulk_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bulk_orders_ordered_at_desc_idx" ON "bulk_orders" USING btree ("ordered_at");--> statement-breakpoint
CREATE INDEX "bulk_orders_deleted_at_idx" ON "bulk_orders" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "buyer_wishlist_items_user_id_idx" ON "buyer_wishlist_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buyer_wishlist_items_fabric_id_idx" ON "buyer_wishlist_items" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "buyer_wishlist_items_deleted_at_idx" ON "buyer_wishlist_items" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "buyer_wishlist_items" ADD CONSTRAINT "buyer_wishlist_user_fabric_uq" UNIQUE("user_id","fabric_id");
