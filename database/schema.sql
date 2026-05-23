-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  Id text NOT NULL,
  Name text NOT NULL,
  Type text NOT NULL DEFAULT 'Cash'::text,
  Balance numeric NOT NULL DEFAULT 0,
  Currency text NOT NULL DEFAULT 'USD'::text,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.companies (
  Id text NOT NULL,
  CompanyName text NOT NULL,
  BusinessRegistrationNumber text NOT NULL UNIQUE,
  CompanyType text NOT NULL,
  IndustryType text NOT NULL,
  CompanyAddress text NOT NULL,
  TaxIdentificationNumber text,
  CompanyEmail text NOT NULL UNIQUE,
  PasswordHash text NOT NULL,
  ResetCode text,
  ResetCodeExpiresAt timestamp with time zone,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.product_material_requirements (
  RequirementId text NOT NULL,
  ProductId text NOT NULL,
  MaterialId text NOT NULL,
  MaterialName text NOT NULL,
  RequiredQuantity numeric NOT NULL DEFAULT 0,
  MaterialUnitCost numeric NOT NULL DEFAULT 0,
  LineTotal numeric NOT NULL DEFAULT 0,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_material_requirements_pkey PRIMARY KEY (RequirementId),
  CONSTRAINT product_material_requirements_ProductId_fkey FOREIGN KEY (ProductId) REFERENCES public.product_recipes(ProductId),
  CONSTRAINT product_material_requirements_MaterialId_fkey FOREIGN KEY (MaterialId) REFERENCES public.raw_materials(MaterialId)
);
CREATE TABLE public.product_recipes (
  ProductId text NOT NULL,
  ProductName text NOT NULL,
  UnitCost numeric NOT NULL DEFAULT 0,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_recipes_pkey PRIMARY KEY (ProductId)
);
CREATE TABLE public.purchase_requests (
  RequestId text NOT NULL,
  SupplierId text NOT NULL,
  SupplierName text NOT NULL,
  SupplierLocation text NOT NULL DEFAULT ''::text,
  RawMaterialName text NOT NULL,
  RequestedQuantity numeric NOT NULL DEFAULT 0,
  Unit text NOT NULL DEFAULT 'kg'::text,
  Notes text NOT NULL DEFAULT ''::text,
  Status text NOT NULL DEFAULT 'Pending'::text,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  Feedback text NOT NULL DEFAULT ''::text,
  action_token uuid DEFAULT gen_random_uuid(),
  token_expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  token_used boolean NOT NULL DEFAULT false,
  CONSTRAINT purchase_requests_pkey PRIMARY KEY (RequestId),
  CONSTRAINT purchase_requests_SupplierId_fkey FOREIGN KEY (SupplierId) REFERENCES public.suppliers(SupplierId)
);
CREATE TABLE public.raw_materials (
  MaterialId text NOT NULL,
  MaterialName text NOT NULL,
  ReorderLevel numeric NOT NULL DEFAULT 0,
  CurrentQuantity numeric NOT NULL DEFAULT 0,
  Unit text NOT NULL DEFAULT 'kg'::text,
  UnitCost numeric NOT NULL DEFAULT 0,
  TotalCost numeric NOT NULL DEFAULT 0,
  Status text NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT raw_materials_pkey PRIMARY KEY (MaterialId)
);
CREATE TABLE public.stock_intakes (
  IntakeId text NOT NULL,
  MaterialId text NOT NULL,
  MaterialName text NOT NULL,
  SupplierId text,
  SupplierName text NOT NULL DEFAULT ''::text,
  Quantity numeric NOT NULL DEFAULT 0,
  Unit text NOT NULL DEFAULT 'kg'::text,
  UnitPrice numeric NOT NULL DEFAULT 0,
  TotalCost numeric NOT NULL DEFAULT 0,
  IntakeDate timestamp with time zone NOT NULL DEFAULT now(),
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_intakes_pkey PRIMARY KEY (IntakeId),
  CONSTRAINT stock_intakes_MaterialId_fkey FOREIGN KEY (MaterialId) REFERENCES public.raw_materials(MaterialId),
  CONSTRAINT stock_intakes_SupplierId_fkey FOREIGN KEY (SupplierId) REFERENCES public.suppliers(SupplierId)
);
CREATE TABLE public.stock_issues (
  IssueId text NOT NULL,
  MaterialId text NOT NULL,
  MaterialName text NOT NULL,
  Quantity numeric NOT NULL DEFAULT 0,
  Unit text NOT NULL DEFAULT 'kg'::text,
  UnitPrice numeric NOT NULL DEFAULT 0,
  TotalCost numeric NOT NULL DEFAULT 0,
  IssueDate timestamp with time zone NOT NULL DEFAULT now(),
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_issues_pkey PRIMARY KEY (IssueId),
  CONSTRAINT stock_issues_MaterialId_fkey FOREIGN KEY (MaterialId) REFERENCES public.raw_materials(MaterialId)
);
CREATE TABLE public.supplier_materials (
  MaterialLinkId text NOT NULL,
  SupplierId text NOT NULL,
  MaterialName text NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT supplier_materials_pkey PRIMARY KEY (MaterialLinkId),
  CONSTRAINT supplier_materials_SupplierId_fkey FOREIGN KEY (SupplierId) REFERENCES public.suppliers(SupplierId)
);
CREATE TABLE public.suppliers (
  SupplierId text NOT NULL,
  SupplierName text NOT NULL,
  Location text NOT NULL DEFAULT ''::text,
  Email text NOT NULL,
  PhoneNumber text NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (SupplierId)
);
CREATE TABLE public.transactions (
  Id text NOT NULL,
  AccountId text NOT NULL,
  CategoryId text NOT NULL,
  Amount numeric NOT NULL,
  IsExpense boolean NOT NULL DEFAULT true,
  Date timestamp with time zone NOT NULL DEFAULT now(),
  Notes text NOT NULL DEFAULT ''::text,
  Currency text NOT NULL DEFAULT 'USD'::text,
  CONSTRAINT transactions_pkey PRIMARY KEY (Id)
);
