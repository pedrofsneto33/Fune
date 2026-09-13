# Graph Report - eternitysos  (2026-09-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2131 nodes · 3609 edges · 295 communities (121 shown, 140 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.87)
- Token cost: 3,264 input · 6,565 output

## Graph Freshness
- Built from commit: `49f53a51`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- validate_data.py
- sanitizeString
- supabaseAdmin.ts
- gray
- checkRateLimit
- eternityos_schema.sql
- isValidUUID
- design_system.py
- notifyError
- spacing
- search_stack
- test_data_contracts.py
- eligibility.ts
- withAuth
- app/page.tsx
- cip/core.py
- slide_search_core.py
- TestTailwindConfigGenerator
- html-token-validator.py
- scripts/core.py
- search
- icon/generate.py
- package.json
- DesignSystemGenerator
- TailwindConfigGenerator
- generate-slide.py
- test_design_system_mode.py
- app/layout.tsx
- BM25
- react
- logo/core.py
- fetch-background.py
- color
- CrmTab.tsx
- compilerOptions
- BM25
- TestThresholdGate
- TenantSettingsTab.tsx
- CatalogRefreshTest
- dependencies
- fontSize
- TestShadcnInstaller
- detect_domain
- _palette_is_dark
- extract-colors.cjs
- validate-asset.cjs
- test_tailwind_config_gen.py
- parse_decision_rules
- devDependencies
- @supabase/supabase-js
- cancel/route.ts
- design-tokens-starter.json
- _select_palette_for_mode
- validate-tokens.cjs
- card
- .check_shadcn_config
- .generate_config_string
- service_orders
- inject-brand-context.cjs
- embed-tokens.cjs
- primitive
- ShadcnInstaller
- patch
- test_text_layout_resilience.py
- focusnfe.ts
- ._base_config
- generate-tokens.cjs
- button
- _normalize
- public.fiscal_invoices
- _run
- sync-brand-to-tokens.cjs
- render-html.py
- whatsapp/route.ts
- ModalCarnets.tsx
- Form Input Styling
- Radius Utilities
- Public Identity Resolution
- WhatsApp Dispatch Schema
- Theme Conversion Script
- Leads API Routes
- Form Validation Logic
- Project NPM Scripts
- Theme Contrast Fix Script
- Isolation Test Final
- Isolation Test V2
- Tenant Route Tests
- Shadow Utilities
- Client Onboarding Script
- Behavior Inspection Script
- API Test Script
- Isolation Test V3
- Isolation Test V4
- Isolation Test V5
- Isolation Test V6
- Border Utilities
- Radius Settings
- Large Size Utilities
- Supabase Plans Migration
- Next.js Configuration
- Leads Migration Script
- Tenant Cleanup Script
- Database RLS Test
- Isolation Post-Fix Test
- Webhook Events Migration
- Slide Token Validator
- Vertical Padding Utilities
- Extra Large Size Utilities
- Medium Size Utilities
- None Option Utilities
- Style Taxonomy Tests
- RLS Fix Definitive
- RLS Isolation Fix
- RLS Fix Part 1
- QR Code Page
- Superadmin Check Script
- Create Tables Script
- Lead Notes Migration
- Holders Enrichment Migration
- Create Users Script
- Roles Diagnostic Script
- RBAC Insert Script
- Sellers Migration
- Auth Routes Tests
- Brand Sync Tests
- Destructive Utilities
- Destructive Foreground Utilities
- Muted Utilities
- Primary Foreground Utilities
- Ring Utilities
- Secondary Foreground Utilities
- Installer Initialization
- Webhook Events Retry
- Add Holder Status Migration
- Payment Carnets Migration
- Vendor Commission Migration
- Leads Conversion Migration
- Financial Transaction Trace Migration
- Alerts Migration Script
- Full Audit Script
- Policy Detail Diagnostic
- Project Identification Script
- Policy Inspection Script
- Insert Test 3
- Insert Test 4
- Middleware Configuration
- UI Auth Gate Test
- Add Components No Config Test
- Add Components Already Installed Test
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Configuration Management Tests
- Config File Write Tests
- Config File Write Tests
- Default Content Paths Tests
- Default Content Paths Tests
- Custom Colors Test
- ESLint Configuration
- Jest Setup
- Service Worker Core
- Route Append Script
- SQL Migration Scripts
- Type Definitions
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Public Tables
- Chapel Bookings
- Chapel Burials
- Collector Routes
- Commissions
- Contracts
- Convalescence Items
- Convalescence Loans
- Dependents
- Dispatch Audit Logs
- Dispatches
- Emergency Dispatches
- Financial Transactions
- Fleet Vehicles
- Holders
- Inventory
- Payment Carnets
- Payments
- Plans
- Regulatory Reserves
- Tenants
- Thanatopraxy Records
- Vehicles
- Accounts Payable
- Asaas Customers
- Audit Logs
- Benefits Partners
- Chapel Bookings
- Chapel Burials
- Collector Routes
- Commissions
- Contracts
- Convalescence Items
- Convalescence Loans
- Dependents
- Dispatch Audit Logs
- Dispatches
- Emergency Dispatches
- Financial Transactions
- Fleet Vehicles
- Holders
- Inventory
- Payment Carnets
- Payments
- Plans
- Regulatory Reserves
- Tenants
- Thanatopraxy Records
- Vehicles
- Tenants
- Payment Carnets
- Contracts
- Plans
- Contracts
- Storage Objects

## God Nodes (most connected - your core abstractions)
1. `isValidUUID()` - 81 edges
2. `supabaseAdmin` - 69 edges
3. `sanitizeString()` - 67 edges
4. `withAuth()` - 62 edges
5. `TailwindConfigGenerator` - 58 edges
6. `search()` - 43 edges
7. `TestTailwindConfigGenerator` - 35 edges
8. `DesignSystemGenerator` - 35 edges
9. `search_stack()` - 35 edges
10. `ShadcnInstaller` - 34 edges

## Surprising Connections (you probably didn't know these)
- `POST` --calls--> `getAsaasConfigForTenant()`  [EXTRACTED]
  billing/pix/route.ts → src/lib/asaasClient.ts
- `POST` --calls--> `getAsaasConfigForTenant()`  [EXTRACTED]
  payments/pix/route.ts → src/lib/asaasClient.ts
- `TestReasoningContract` --uses--> `DesignSystemGenerator`  [INFERRED]
  .continue/skills/ui-ux-pro-max/scripts/tests/test_data_contracts.py → .continue/skills/ui-ux-pro-max/scripts/design_system.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .continue/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .continue/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestEndToEndCoherence` --uses--> `DesignSystemGenerator`  [INFERRED]
  .continue/skills/ui-ux-pro-max/scripts/tests/test_design_system_mode.py → .continue/skills/ui-ux-pro-max/scripts/design_system.py

## Import Cycles
- None detected.

## Communities (295 total, 140 thin omitted)

### Community 0 - "validate_data.py"
Cohesion: 0.07
Nodes (48): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract() (+40 more)

### Community 1 - "sanitizeString"
Cohesion: 0.07
Nodes (37): RFC-5322, GET, PATCH, POST, GET, POST, DELETE, GET (+29 more)

### Community 2 - "supabaseAdmin.ts"
Cohesion: 0.06
Nodes (38): dynamic, POST, dynamic, GET, POST, dynamic, GET, POST (+30 more)

### Community 3 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 4 - "checkRateLimit"
Cohesion: 0.08
Nodes (35): dynamic, POST, POST, BatchResult, contractIsActive(), holderIsInactive(), POST, withTimeout() (+27 more)

### Community 5 - "eternityos_schema.sql"
Cohesion: 0.11
Nodes (41): auth.users, idx_service_order_items_service, idx_service_orders_burial, idx_service_orders_contract, idx_service_orders_tenant, public.accounts_payable, public.asaas_customers, public.audit_logs (+33 more)

### Community 6 - "isValidUUID"
Cohesion: 0.07
Nodes (35): DELETE, GET, PATCH, POST, DELETE, GET, PATCH, POST (+27 more)

### Community 7 - "design_system.py"
Cohesion: 0.08
Nodes (30): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+22 more)

### Community 8 - "notifyError"
Cohesion: 0.14
Nodes (22): ModalRBAC(), UserRole, ModalWebhookRetry(), Props, WebhookEvent, ModalCobrancaAvulsa(), FiscalConfigData, FiscalSettingsSection() (+14 more)

### Community 9 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 10 - "search_stack"
Cohesion: 0.10
Nodes (8): Search stack-specific guidelines, search_stack(), Freshness and migration contracts for native, desktop, and 3D stacks., _rows(), TestNativeDesktopStackFreshness, Freshness and generation-isolation contracts for web stack guidance., _rows(), TestWebStackFreshness

### Community 11 - "test_data_contracts.py"
Cohesion: 0.10
Nodes (8): Cross-file semantic contracts for curated design data., read_rows(), split_values(), style_identities(), TestGeneratedCatalogContract, TestLandingAndStackContract, TestReasoningContract, TestStyleIdentityContract

### Community 12 - "eligibility.ts"
Cohesion: 0.12
Nodes (23): dynamic, POST, dynamic, POST, withTimeout(), POST, dynamic, POST (+15 more)

### Community 13 - "withAuth"
Cohesion: 0.12
Nodes (23): GET, GET, dynamic, GET, POST, dynamic, POST, dynamic (+15 more)

### Community 14 - "app/page.tsx"
Cohesion: 0.09
Nodes (26): Burial, BURIAL_STATUS_STYLE, burialStatusClass(), ChapelBooking, Contract, ConvalescenceItem, Dependent, FinancialTransaction (+18 more)

### Community 15 - "cip/core.py"
Cohesion: 0.12
Nodes (28): detect_domain(), get_cip_brief(), _load_csv(), Generate a comprehensive CIP brief for a brand, CIP Design Core - BM25 search engine for Corporate Identity Program design…, search(), search_all(), _search_csv() (+20 more)

### Community 16 - "slide_search_core.py"
Cohesion: 0.13
Nodes (29): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., calculate_pattern_break(), detect_domain() (+21 more)

### Community 17 - "TestTailwindConfigGenerator"
Cohesion: 0.06
Nodes (16): Test TailwindConfigGenerator class., Test initialization with default settings., Test generating config with plugins., Test validating valid configuration., Test validating config with no content paths., Test validating config with empty theme extensions., Test initialization for JavaScript config., Test writing config to invalid path. (+8 more)

### Community 18 - "html-token-validator.py"
Cohesion: 0.12
Nodes (25): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+17 more)

### Community 19 - "scripts/core.py"
Cohesion: 0.11
Nodes (28): _contains_phrase(), _domain_keywords(), _exact_stack_identifier(), _file_signature(), _get_bm25(), _load_csv(), _load_csv_snapshot(), _load_product_keywords() (+20 more)

### Community 20 - "search"
Cohesion: 0.11
Nodes (7): Resolve a deprecated in-domain alias, or expose a cross-domain redirect., search(), _style_search_destination(), Stdlib-only regression tests for core.py / design_system.py (unittest, not…, TestDiagnosticsContracts, TestSearchDomains, TestStyleTaxonomy

### Community 21 - "icon/generate.py"
Cohesion: 0.11
Nodes (25): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+17 more)

### Community 22 - "package.json"
Cohesion: 0.08
Nodes (24): name, private, version, autoprefixer, clsx, date-fns, eslint, eslint-config-next (+16 more)

### Community 23 - "DesignSystemGenerator"
Cohesion: 0.12
Nodes (10): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None. (+2 more)

### Community 24 - "TailwindConfigGenerator"
Cohesion: 0.09
Nodes (12): Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message), Add custom colors to theme. Args: colors: Dict of color_name: color_value Value… (+4 more)

### Community 25 - "generate-slide.py"
Cohesion: 0.14
Nodes (20): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+12 more)

### Community 26 - "test_design_system_mode.py"
Cohesion: 0.14
Nodes (11): _filter_anti_patterns_for_mode(), _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., Drop "avoid dark mode" advice once dark mode is the resolved answer., _resolve_color_mode(), _style_is_dark_primary() (+3 more)

### Community 27 - "app/layout.tsx"
Cohesion: 0.12
Nodes (12): sonner, inter, metadata, viewport, AuthGuard(), isPublicRoute(), PUBLIC_ROUTES, ServiceWorkerRegister() (+4 more)

### Community 28 - "BM25"
Cohesion: 0.16
Nodes (7): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, BM25, BM25

### Community 29 - "react"
Cohesion: 0.12
Nodes (13): lucide-react, react, recharts, ADDONS, FAQ, MODULES, PLANS, FinancialSummary (+5 more)

### Community 30 - "logo/core.py"
Cohesion: 0.15
Nodes (17): Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results, detect_domain(), _load_csv(), Logo Design Core - BM25 search engine for logo design guidelines (+9 more)

### Community 31 - "fetch-background.py"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 32 - "color"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 33 - "CrmTab.tsx"
Cohesion: 0.19
Nodes (16): CrmTab(), EMPTY_FORM, fmtBRL(), histNoteRow, isOverdue(), Lead, FLOW, LEAD_SOURCE_LABELS (+8 more)

### Community 34 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 35 - "BM25"
Cohesion: 0.14
Nodes (5): BM25, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, All indexed terms, for suggestion/typo-recovery purposes., TestBm25CoreBehavior, TestTokenizer

### Community 36 - "TestThresholdGate"
Cohesion: 0.12
Nodes (4): Unit tests for metric math and relevance fixture validation., TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 37 - "TenantSettingsTab.tsx"
Cohesion: 0.16
Nodes (13): EMPTY_FORM, fmtBrl(), Plan, PlansTab(), Tenant, TenantSettingsTab(), notifyInfo(), COMMERCIAL_PLANS (+5 more)

### Community 39 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, autoprefixer, clsx, date-fns, lucide-react, next, postcss, qrcode (+9 more)

### Community 40 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 41 - "TestShadcnInstaller"
Cohesion: 0.13
Nodes (9): Test adding components in dry run mode., Test ShadcnInstaller class., Create temporary project structure., Test listing installed components when they exist., Test checking for existing shadcn config., Test getting installed components when none exist., Test adding components with empty list., TestShadcnInstaller (+1 more)

### Community 42 - "detect_domain"
Cohesion: 0.23
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 43 - "_palette_is_dark"
Cohesion: 0.18
Nodes (7): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), The exact reproduction from issue #428., TestEndToEndCoherence, TestLuminance

### Community 44 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 45 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 46 - "test_tailwind_config_gen.py"
Cohesion: 0.16
Nodes (10): main(), Tailwind CSS Configuration Generator Generate tailwind.config.js/ts with custom…, Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object() (+2 more)

### Community 47 - "parse_decision_rules"
Cohesion: 0.19
Nodes (9): Find matching reasoning rule for a category., Apply reasoning rules to search results., apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), Return deterministic mutations and an audit trail; never execute data., Closed, non-executable grammar for design-system decision rules., Parse the canonical condition -> action-array representation. (+1 more)

### Community 48 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, jest, jest-environment-jsdom, @testing-library/jest-dom, @testing-library/react, ts-jest (+6 more)

### Community 49 - "@supabase/supabase-js"
Cohesion: 0.14
Nodes (10): @supabase/supabase-js, admin, env, admin, env, admin, env, admin (+2 more)

### Community 50 - "cancel/route.ts"
Cohesion: 0.21
Nodes (10): dynamic, POST, dynamic, POST, dynamic, POST, FiscalEnvironment, FiscalProvider (+2 more)

### Community 51 - "design-tokens-starter.json"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 52 - "_select_palette_for_mode"
Cohesion: 0.22
Nodes (7): _contrast_ratio(), _derive_dark_palette(), WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces., Pick the highest-ranked palette matching the resolved mode. Only the dark case…, _select_palette_for_mode(), TestPaletteSelection

### Community 53 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 54 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 55 - ".check_shadcn_config"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 56 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 57 - "service_orders"
Cohesion: 0.27
Nodes (10): chapel_burials, contracts, inventory, idx_service_order_items_service, idx_service_orders_burial, idx_service_orders_contract, idx_service_orders_tenant, service_order_items (+2 more)

### Community 58 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 59 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 60 - "primitive"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 61 - "ShadcnInstaller"
Cohesion: 0.22
Nodes (7): main(), Handle shadcn/ui component installation., shadcn/ui Component Installer Add shadcn/ui components to project with…, ShadcnInstaller, Tests for shadcn_add.py, Test listing installed components when none exist., Test initialization with custom project root.

### Community 62 - "patch"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 63 - "test_text_layout_resilience.py"
Cohesion: 0.20
Nodes (4): Canonical regression contracts for resilient UI text layouts., read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 64 - "focusnfe.ts"
Cohesion: 0.33
Nodes (10): basicAuth(), detectEnvironment(), focusnfeCancel(), focusnfeEmit(), focusnfeGet(), FocusNFePayload, FocusNFeResponse, focusnfeTest() (+2 more)

### Community 65 - "._base_config"
Cohesion: 0.22
Nodes (6): Any, Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework.

### Community 66 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 67 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 68 - "_normalize"
Cohesion: 0.22
Nodes (9): _exact_match_diagnostic(), _legacy_successor_guidance(), _normalize(), Apply longest-first synonym substitution at token boundaries., Whether a stack query explicitly targets an older framework generation., Choose one coherent applicability generation for stack retrieval., Prefer the explicit successor row for a brand-new app on legacy-only stacks., _stack_query_requests_legacy() (+1 more)

### Community 69 - "public.fiscal_invoices"
Cohesion: 0.36
Nodes (9): public.service_orders, idx_fiscal_invoices_created_at, idx_fiscal_invoices_nfse_number, idx_fiscal_invoices_service_order, idx_fiscal_invoices_status, idx_fiscal_invoices_tenant, public.fiscal_invoices, public.v_service_orders_without_nfse (+1 more)

### Community 70 - "_run"
Cohesion: 0.28
Nodes (8): CompletedProcess, Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 71 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 72 - "render-html.py"
Cohesion: 0.31
Nodes (8): generate_html(), get_deliverable_info(), get_image_base64(), main(), Convert image to base64 for embedding in HTML, Extract deliverable type from filename and get info, Generate HTML presentation from CIP images, CIP HTML Presentation Renderer Generates a professional HTML presentation from…

### Community 73 - "whatsapp/route.ts"
Cohesion: 0.42
Nodes (7): POST(), findTenantByWhatsAppNumber(), processIncomingMessage(), sendWhatsApp(), STEPS, TriageData, validateWebhookToken()

### Community 74 - "ModalCarnets.tsx"
Cohesion: 0.31
Nodes (8): brl(), CarnetRow, contractIsActive(), HolderContract, holderIsInactive(), HolderRow, ModalCarnets(), STATUS_STYLE

### Community 75 - "Form Input Styling"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 76 - "Radius Utilities"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 77 - "Public Identity Resolution"
Cohesion: 0.25
Nodes (8): _exact_row_identity(), Suggest complete public identities so a retry can bypass score thresholds., Return non-empty public identities from ordinary and alias fields., Resolve an explicit style identity without opening generic variant ranking., Return one row whose stable public identity exactly matches the query., _row_identities(), _style_identity(), _suggest_identities()

### Community 78 - "WhatsApp Dispatch Schema"
Cohesion: 0.36
Nodes (7): idx_emergency_dispatches_tenant, idx_tenant_whatsapp_number, idx_whatsapp_sessions_tenant_phone, public.tenant_whatsapp_numbers, public.whatsapp_agent_sessions, public.emergency_dispatches, public.tenants

### Community 79 - "Theme Conversion Script"
Cohesion: 0.25
Nodes (5): files, fs, MAP, path, ROOT

### Community 80 - "Leads API Routes"
Cohesion: 0.39
Nodes (7): DELETE, dynamic, GET, PATCH, POST, isValidLeadSource(), isValidLeadStage()

### Community 81 - "Form Validation Logic"
Cohesion: 0.32
Nodes (6): FieldErrors, FieldValidation, getFieldLabel(), validateField(), validateForm(), ValidationRule

### Community 82 - "Project NPM Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, test:watch

### Community 83 - "Theme Contrast Fix Script"
Cohesion: 0.29
Nodes (5): files, fs, path, ROOT, STRONG

### Community 84 - "Isolation Test Final"
Cohesion: 0.29
Nodes (4): admin, anon, clienteUser, env

### Community 85 - "Isolation Test V2"
Cohesion: 0.29
Nodes (4): admin, anon, clienteUser, env

### Community 86 - "Tenant Route Tests"
Cohesion: 0.29
Nodes (4): ALLOWLIST, API_DIR, INTENTIONAL_CROSS_TENANT, NO_TENANT_SCOPE

### Community 87 - "Shadow Utilities"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 88 - "Client Onboarding Script"
Cohesion: 0.33
Nodes (4): env, [name, cnpj, ownerEmail], owner, supabase

### Community 89 - "Behavior Inspection Script"
Cohesion: 0.33
Nodes (4): admin, env, isoTen, targetHold

### Community 91 - "Isolation Test V3"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 92 - "Isolation Test V4"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 93 - "Isolation Test V5"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 94 - "Isolation Test V6"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 95 - "Border Utilities"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 96 - "Radius Settings"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 97 - "Large Size Utilities"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 98 - "Supabase Plans Migration"
Cohesion: 0.40
Nodes (4): idx_holders_tenant_id, idx_user_roles_tenant_id, public.holders, public.user_roles

### Community 100 - "Leads Migration Script"
Cohesion: 0.70
Nodes (4): idx_leads_created, idx_leads_followup, idx_leads_stage, public.leads

### Community 101 - "Tenant Cleanup Script"
Cohesion: 0.40
Nodes (4): emails, env, supabase, tenantIds

### Community 103 - "Isolation Post-Fix Test"
Cohesion: 0.50
Nodes (3): check(), __dirname, main()

### Community 104 - "Webhook Events Migration"
Cohesion: 0.60
Nodes (4): idx_webhook_events_payment, idx_webhook_events_tenant_time, public.webhook_events, public.tenants

### Community 105 - "Slide Token Validator"
Cohesion: 0.50
Nodes (3): main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides.

### Community 106 - "Vertical Padding Utilities"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 107 - "Extra Large Size Utilities"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 108 - "Medium Size Utilities"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 109 - "None Option Utilities"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 111 - "RLS Fix Definitive"
Cohesion: 0.67
Nodes (3): public.get_user_tenant_id(), public.is_superadmin(), public.user_roles

### Community 112 - "RLS Isolation Fix"
Cohesion: 0.67
Nodes (3): public.get_user_tenant_id(), public.is_superadmin(), public.user_roles

### Community 113 - "RLS Fix Part 1"
Cohesion: 0.67
Nodes (3): public.get_user_tenant_id(), public.is_superadmin(), public.user_roles

### Community 115 - "Superadmin Check Script"
Cohesion: 0.50
Nodes (3): env, supabase, user

### Community 117 - "Lead Notes Migration"
Cohesion: 0.67
Nodes (3): idx_lead_notes_lead, public.lead_notes, public.leads

### Community 118 - "Holders Enrichment Migration"
Cohesion: 0.67
Nodes (3): idx_holders_tenant_birth, idx_holders_tenant_state, public.holders

### Community 119 - "Create Users Script"
Cohesion: 0.50
Nodes (3): env, supabase, USERS

### Community 120 - "Roles Diagnostic Script"
Cohesion: 0.50
Nodes (3): emails, env, supabase

### Community 122 - "Sellers Migration"
Cohesion: 0.67
Nodes (3): idx_sellers_tenant, public.sellers, public.tenants

### Community 126 - "Destructive Utilities"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 127 - "Destructive Foreground Utilities"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 128 - "Muted Utilities"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 129 - "Primary Foreground Utilities"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 130 - "Ring Utilities"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 131 - "Secondary Foreground Utilities"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **442 isolated node(s):** `ParsedRow`, `Props`, `EligibilityResult`, `Burial`, `ChapelBooking` (+437 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 943 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **140 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `search()` connect `search` to `validate_data.py`, `_normalize`, `design_system.py`, `detect_domain`, `Public Identity Resolution`, `Style Taxonomy Tests`, `scripts/core.py`, `DesignSystemGenerator`, `logo/core.py`, `test_text_layout_resilience.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `supabaseAdmin.ts`, `Full Audit Script`, `Policy Detail Diagnostic`, `Project Identification Script`, `Insert Test 3`, `Insert Test 4`, `package.json`, `app/layout.tsx`, `Isolation Test Final`, `Isolation Test V2`, `Client Onboarding Script`, `Behavior Inspection Script`, `API Test Script`, `Isolation Test V3`, `Isolation Test V4`, `Isolation Test V5`, `Isolation Test V6`, `Tenant Cleanup Script`, `Database RLS Test`, `Isolation Post-Fix Test`, `Superadmin Check Script`, `Create Tables Script`, `Create Users Script`, `Roles Diagnostic Script`, `RBAC Insert Script`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Main search function with auto-domain detection` connect `logo/core.py` to `slide_search_core.py`, `search`, `cip/core.py`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ParsedRow`, `Props`, `EligibilityResult` to the rest of the system?**
  _442 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `validate_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0726775956284153 - nodes in this community are weakly interconnected._
- **Should `sanitizeString` be split into smaller, more focused modules?**
  _Cohesion score 0.06516290726817042 - nodes in this community are weakly interconnected._