# Graph Report - eternitysos  (2026-09-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2131 nodes · 3609 edges · 295 communities (121 shown, 140 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.87)
- Token cost: 12,346 input · 13,734 output

## Graph Freshness
- Built from commit: `49f53a51`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Design Accessibility Tests
- API Route Definitions
- Backend Service Endpoints
- Design Token Values
- Payment Processing APIs
- Database Schema Tables
- Entity CRUD API
- Design System Generation
- Vendor Management UI
- Spacing Token Definitions
- Search Stack Validation
- Design Data Contracts
- Contract Management APIs
- Authenticated Service Endpoints
- EternityOS Domain Models
- Corporate Identity Processor
- Slide Design Search
- Tailwind Config Tests
- HTML Token Validation
- Core Search Scripts
- Search Diagnostics Tests
- SVG Icon Generation
- Project Package Configuration
- Design System Generator
- Tailwind Config Generator
- Slide Deck Generation
- Dark Mode Handling
- App Layout and Auth
- BM25 Text Search
- Landing UI Components
- Logo Design Search Engine
- Background Image Generation
- Design Token Colors
- CRM Lead Management
- TypeScript Config Settings
- BM25 Indexing & Suggestions
- Relevance Metric Tests
- Plans and Tenant Settings
- Catalog Refresh Testing
- Project Dependency List
- Font Size Tokens
- Shadcn Installer Tests
- Search Domain Detection
- Color Luminance Testing
- Color Extraction Tools
- Asset Validation Utility
- Tailwind Config Generator
- Decision Reasoning Engine
- Testing Dev Dependencies
- Supabase Client Scripts
- Fiscal Service API
- Design Tokens Schema
- Accessible Color Palette Tests
- Design Token Validation
- Card Style Tokens
- Shadcn UI Component Manager
- Configuration File Generator
- Service Orders Database
- Brand Context Extraction
- Token Embedding Script
- Duration Tokens
- Shadcn Installer Tests
- Shadcn Component Add Tests
- Text Layout Resilience Tests
- FocusNFe API Integration
- Project Scaffold Generator
- Token Generation Script
- Button Style Tokens
- Stack Query Token Processor
- Public Service Orders DB
- Validate Tokens Test Suite
- Brand to Token Sync
- HTML Presentation Renderer
- WhatsApp Integration API
- Carnet Modal Component
- Input Style Tokens
- Radius Tokens
- Public Identity Resolver
- WhatsApp Agent DB Schema
- Theme Conversion Script
- Leads API Routes
- Form Validation Utilities
- Project NPM Scripts
- Theme Contrast Fixer
- Final Isolation Test
- Isolation Test v2
- Tenant Route Tests
- Shadow Tokens
- Client Onboarding Script
- Behavior Inspection Script
- API Test Script
- Isolation Test v3
- Isolation Test v4
- Isolation Test v5
- Isolation Test v6
- Border Tokens
- Component Radius Tokens
- Large Size Tokens
- Supabase Migration Scripts
- Next.js Configuration
- CRM Leads Migration
- Tenant Cleanup Scripts
- Database RLS Tests
- Isolation Fix Tests
- Webhook Events Migration
- Slide Token Validator
- Vertical Padding Utility
- XL Size Token
- Medium Size Token
- None Value Token
- Style Taxonomy Tests
- RLS Definitive Fix
- RLS Isolation Fix
- RLS Part1 Fix
- QR Code Page
- Superadmin Check Script
- Database Table Creation
- CRM Lead Notes
- Holder Enrichment Migration
- User Creation Script
- Roles Diagnostic Script
- RBAC Data Insertion
- Sellers Migration
- Auth Routes Tests
- Brand Token Sync Tests
- Destructive Style Token
- Destructive Foreground Token
- Muted Style Token
- Primary Foreground Token
- Ring Style Token
- Secondary Foreground Token
- Installer Initialization
- Webhook Events Retry
- Holder Status Migration
- Payment Carnet Migration
- Vendor Commission Migration
- CRM Leads Conversion
- Financial Transaction Trace
- Alerts Migration Script
- Full Audit Script
- Policy Detail Diagnostic
- Project Identification Script
- Policy Inspection Script
- Insert Test Three
- Insert Test Four
- Middleware Configuration
- UI Auth Gate Tests
- Add Components No Config Test
- Add Components Already Installed Test
- Add All Components Test
- List Installed Components Test
- Init Default Project Root Test
- Init Dry Run Test
- Check Missing Config Test
- Get Installed With Files Test
- Get Installed No Config Test
- Add Colors Multiple Times Test
- Add Custom Fonts Test
- Add Custom Spacing Test
- Add Custom Breakpoints Test
- Prevent Duplicate Plugins Test
- Plugin Recommendations Test
- Plugin Recommendations Next.js Test
- Generate TypeScript Config Test
- Generate JavaScript Config Test
- Generate Config With Colors Test
- Write Config Test
- Verify Config Content Test
- Default React Content Paths
- Default Next.js Content Paths
- Add Custom Colors Test
- ESLint Config File
- Jest Setup File
- Service Worker Core Script
- Append Route Script
- Orphan Plans Backup
- Data Payload Types
- Accounts Payable Table
- Asaas Customers Table
- Audit Logs Table
- Benefits Partners Table
- Chapel Bookings Table
- Chapel Burial Records
- Collector Route Management
- Commission Tracking
- Contract Management
- Convalescence Items
- Convalescence Loans
- Dependent Records
- Dispatch Audit Logs
- Dispatch Operations
- Emergency Dispatches
- Financial Transactions
- Fleet Vehicle Registry
- Holder Accounts
- Inventory Management
- Payment Carnets
- Payments Processing
- Plan Catalog
- Regulatory Reserves
- Tenant Records
- Thanatopraxy Records
- Vehicle Registry
- Accounts Payable
- Asaas Customers
- System Audit Logs
- Benefits Partners
- Chapel Booking System
- Chapel Burial Records
- Collector Route Management
- Commission Tracking
- Contract Management
- Convalescence Items
- Convalescence Loans
- Dependent Records
- Dispatch Audit Logs
- Dispatch Operations
- Emergency Dispatches
- Financial Transactions
- Fleet Vehicle Registry
- Holder Accounts
- Inventory Management
- Payment Carnets
- Payments Processing
- Plan Catalog
- Regulatory Reserves
- Tenant Records
- Thanatopraxy Records
- Vehicle Registry
- Accounts Payable
- Asaas Customers
- System Audit Logs
- Benefits Partners
- Chapel Bookings
- Chapel Burials
- Collector Routes
- Commission Management
- Contract Management
- Convalescence Items
- Convalescence Loans
- Dependent Records
- Dispatch Audit Logs
- Dispatch Management
- Emergency Dispatches
- Financial Transactions
- Fleet Vehicles
- Holder Records
- Inventory Management
- Payment Carnets
- Payment Processing
- Plan Management
- Regulatory Reserves
- Tenant Management
- Thanatopraxy Records
- Vehicle Management
- Tenant Management
- Payment Carnets
- Contract Management
- Plan Management
- Contract Management
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

### Community 0 - "Design Accessibility Tests"
Cohesion: 0.07
Nodes (48): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract() (+40 more)

### Community 1 - "API Route Definitions"
Cohesion: 0.07
Nodes (37): RFC-5322, GET, PATCH, POST, GET, POST, DELETE, GET (+29 more)

### Community 2 - "Backend Service Endpoints"
Cohesion: 0.06
Nodes (38): dynamic, POST, dynamic, GET, POST, dynamic, GET, POST (+30 more)

### Community 3 - "Design Token Values"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 4 - "Payment Processing APIs"
Cohesion: 0.08
Nodes (35): dynamic, POST, POST, BatchResult, contractIsActive(), holderIsInactive(), POST, withTimeout() (+27 more)

### Community 5 - "Database Schema Tables"
Cohesion: 0.11
Nodes (41): auth.users, idx_service_order_items_service, idx_service_orders_burial, idx_service_orders_contract, idx_service_orders_tenant, public.accounts_payable, public.asaas_customers, public.audit_logs (+33 more)

### Community 6 - "Entity CRUD API"
Cohesion: 0.07
Nodes (35): DELETE, GET, PATCH, POST, DELETE, GET, PATCH, POST (+27 more)

### Community 7 - "Design System Generation"
Cohesion: 0.08
Nodes (30): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+22 more)

### Community 8 - "Vendor Management UI"
Cohesion: 0.14
Nodes (22): ModalRBAC(), UserRole, ModalWebhookRetry(), Props, WebhookEvent, ModalCobrancaAvulsa(), FiscalConfigData, FiscalSettingsSection() (+14 more)

### Community 9 - "Spacing Token Definitions"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 10 - "Search Stack Validation"
Cohesion: 0.10
Nodes (8): Search stack-specific guidelines, search_stack(), Freshness and migration contracts for native, desktop, and 3D stacks., _rows(), TestNativeDesktopStackFreshness, Freshness and generation-isolation contracts for web stack guidance., _rows(), TestWebStackFreshness

### Community 11 - "Design Data Contracts"
Cohesion: 0.10
Nodes (8): Cross-file semantic contracts for curated design data., read_rows(), split_values(), style_identities(), TestGeneratedCatalogContract, TestLandingAndStackContract, TestReasoningContract, TestStyleIdentityContract

### Community 12 - "Contract Management APIs"
Cohesion: 0.12
Nodes (23): dynamic, POST, dynamic, POST, withTimeout(), POST, dynamic, POST (+15 more)

### Community 13 - "Authenticated Service Endpoints"
Cohesion: 0.12
Nodes (23): GET, GET, dynamic, GET, POST, dynamic, POST, dynamic (+15 more)

### Community 14 - "EternityOS Domain Models"
Cohesion: 0.09
Nodes (26): Burial, BURIAL_STATUS_STYLE, burialStatusClass(), ChapelBooking, Contract, ConvalescenceItem, Dependent, FinancialTransaction (+18 more)

### Community 15 - "Corporate Identity Processor"
Cohesion: 0.12
Nodes (28): detect_domain(), get_cip_brief(), _load_csv(), Generate a comprehensive CIP brief for a brand, CIP Design Core - BM25 search engine for Corporate Identity Program design…, search(), search_all(), _search_csv() (+20 more)

### Community 16 - "Slide Design Search"
Cohesion: 0.13
Nodes (29): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., calculate_pattern_break(), detect_domain() (+21 more)

### Community 17 - "Tailwind Config Tests"
Cohesion: 0.06
Nodes (16): Test TailwindConfigGenerator class., Test initialization with default settings., Test generating config with plugins., Test validating valid configuration., Test validating config with no content paths., Test validating config with empty theme extensions., Test initialization for JavaScript config., Test writing config to invalid path. (+8 more)

### Community 18 - "HTML Token Validation"
Cohesion: 0.12
Nodes (25): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+17 more)

### Community 19 - "Core Search Scripts"
Cohesion: 0.11
Nodes (28): _contains_phrase(), _domain_keywords(), _exact_stack_identifier(), _file_signature(), _get_bm25(), _load_csv(), _load_csv_snapshot(), _load_product_keywords() (+20 more)

### Community 20 - "Search Diagnostics Tests"
Cohesion: 0.11
Nodes (7): Resolve a deprecated in-domain alias, or expose a cross-domain redirect., search(), _style_search_destination(), Stdlib-only regression tests for core.py / design_system.py (unittest, not…, TestDiagnosticsContracts, TestSearchDomains, TestStyleTaxonomy

### Community 21 - "SVG Icon Generation"
Cohesion: 0.11
Nodes (25): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+17 more)

### Community 22 - "Project Package Configuration"
Cohesion: 0.08
Nodes (24): name, private, version, autoprefixer, clsx, date-fns, eslint, eslint-config-next (+16 more)

### Community 23 - "Design System Generator"
Cohesion: 0.12
Nodes (10): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None. (+2 more)

### Community 24 - "Tailwind Config Generator"
Cohesion: 0.09
Nodes (12): Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message), Add custom colors to theme. Args: colors: Dict of color_name: color_value Value… (+4 more)

### Community 25 - "Slide Deck Generation"
Cohesion: 0.14
Nodes (20): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+12 more)

### Community 26 - "Dark Mode Handling"
Cohesion: 0.14
Nodes (11): _filter_anti_patterns_for_mode(), _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., Drop "avoid dark mode" advice once dark mode is the resolved answer., _resolve_color_mode(), _style_is_dark_primary() (+3 more)

### Community 27 - "App Layout and Auth"
Cohesion: 0.12
Nodes (12): sonner, inter, metadata, viewport, AuthGuard(), isPublicRoute(), PUBLIC_ROUTES, ServiceWorkerRegister() (+4 more)

### Community 28 - "BM25 Text Search"
Cohesion: 0.16
Nodes (7): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, BM25, BM25

### Community 29 - "Landing UI Components"
Cohesion: 0.12
Nodes (13): lucide-react, react, recharts, ADDONS, FAQ, MODULES, PLANS, FinancialSummary (+5 more)

### Community 30 - "Logo Design Search Engine"
Cohesion: 0.15
Nodes (17): Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results, detect_domain(), _load_csv(), Logo Design Core - BM25 search engine for logo design guidelines (+9 more)

### Community 31 - "Background Image Generation"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 32 - "Design Token Colors"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 33 - "CRM Lead Management"
Cohesion: 0.19
Nodes (16): CrmTab(), EMPTY_FORM, fmtBRL(), histNoteRow, isOverdue(), Lead, FLOW, LEAD_SOURCE_LABELS (+8 more)

### Community 34 - "TypeScript Config Settings"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 35 - "BM25 Indexing & Suggestions"
Cohesion: 0.14
Nodes (5): BM25, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, All indexed terms, for suggestion/typo-recovery purposes., TestBm25CoreBehavior, TestTokenizer

### Community 36 - "Relevance Metric Tests"
Cohesion: 0.12
Nodes (4): Unit tests for metric math and relevance fixture validation., TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 37 - "Plans and Tenant Settings"
Cohesion: 0.16
Nodes (13): EMPTY_FORM, fmtBrl(), Plan, PlansTab(), Tenant, TenantSettingsTab(), notifyInfo(), COMMERCIAL_PLANS (+5 more)

### Community 39 - "Project Dependency List"
Cohesion: 0.12
Nodes (17): dependencies, autoprefixer, clsx, date-fns, lucide-react, next, postcss, qrcode (+9 more)

### Community 40 - "Font Size Tokens"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 41 - "Shadcn Installer Tests"
Cohesion: 0.13
Nodes (9): Test adding components in dry run mode., Test ShadcnInstaller class., Create temporary project structure., Test listing installed components when they exist., Test checking for existing shadcn config., Test getting installed components when none exist., Test adding components with empty list., TestShadcnInstaller (+1 more)

### Community 42 - "Search Domain Detection"
Cohesion: 0.23
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 43 - "Color Luminance Testing"
Cohesion: 0.18
Nodes (7): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), The exact reproduction from issue #428., TestEndToEndCoherence, TestLuminance

### Community 44 - "Color Extraction Tools"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 45 - "Asset Validation Utility"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 46 - "Tailwind Config Generator"
Cohesion: 0.16
Nodes (10): main(), Tailwind CSS Configuration Generator Generate tailwind.config.js/ts with custom…, Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object() (+2 more)

### Community 47 - "Decision Reasoning Engine"
Cohesion: 0.19
Nodes (9): Find matching reasoning rule for a category., Apply reasoning rules to search results., apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), Return deterministic mutations and an audit trail; never execute data., Closed, non-executable grammar for design-system decision rules., Parse the canonical condition -> action-array representation. (+1 more)

### Community 48 - "Testing Dev Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-next, jest, jest-environment-jsdom, @testing-library/jest-dom, @testing-library/react, ts-jest (+6 more)

### Community 49 - "Supabase Client Scripts"
Cohesion: 0.14
Nodes (10): @supabase/supabase-js, admin, env, admin, env, admin, env, admin (+2 more)

### Community 50 - "Fiscal Service API"
Cohesion: 0.21
Nodes (10): dynamic, POST, dynamic, POST, dynamic, POST, FiscalEnvironment, FiscalProvider (+2 more)

### Community 51 - "Design Tokens Schema"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 52 - "Accessible Color Palette Tests"
Cohesion: 0.22
Nodes (7): _contrast_ratio(), _derive_dark_palette(), WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces., Pick the highest-ranked palette matching the resolved mode. Only the dark case…, _select_palette_for_mode(), TestPaletteSelection

### Community 53 - "Design Token Validation"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 54 - "Card Style Tokens"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 55 - "Shadcn UI Component Manager"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 56 - "Configuration File Generator"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 57 - "Service Orders Database"
Cohesion: 0.27
Nodes (10): chapel_burials, contracts, inventory, idx_service_order_items_service, idx_service_orders_burial, idx_service_orders_contract, idx_service_orders_tenant, service_order_items (+2 more)

### Community 58 - "Brand Context Extraction"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 59 - "Token Embedding Script"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 60 - "Duration Tokens"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 61 - "Shadcn Installer Tests"
Cohesion: 0.22
Nodes (7): main(), Handle shadcn/ui component installation., shadcn/ui Component Installer Add shadcn/ui components to project with…, ShadcnInstaller, Tests for shadcn_add.py, Test listing installed components when none exist., Test initialization with custom project root.

### Community 62 - "Shadcn Component Add Tests"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 63 - "Text Layout Resilience Tests"
Cohesion: 0.20
Nodes (4): Canonical regression contracts for resilient UI text layouts., read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 64 - "FocusNFe API Integration"
Cohesion: 0.33
Nodes (10): basicAuth(), detectEnvironment(), focusnfeCancel(), focusnfeEmit(), focusnfeGet(), FocusNFePayload, FocusNFeResponse, focusnfeTest() (+2 more)

### Community 65 - "Project Scaffold Generator"
Cohesion: 0.22
Nodes (6): Any, Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework.

### Community 66 - "Token Generation Script"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 67 - "Button Style Tokens"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 68 - "Stack Query Token Processor"
Cohesion: 0.22
Nodes (9): _exact_match_diagnostic(), _legacy_successor_guidance(), _normalize(), Apply longest-first synonym substitution at token boundaries., Whether a stack query explicitly targets an older framework generation., Choose one coherent applicability generation for stack retrieval., Prefer the explicit successor row for a brand-new app on legacy-only stacks., _stack_query_requests_legacy() (+1 more)

### Community 69 - "Public Service Orders DB"
Cohesion: 0.36
Nodes (9): public.service_orders, idx_fiscal_invoices_created_at, idx_fiscal_invoices_nfse_number, idx_fiscal_invoices_service_order, idx_fiscal_invoices_status, idx_fiscal_invoices_tenant, public.fiscal_invoices, public.v_service_orders_without_nfse (+1 more)

### Community 70 - "Validate Tokens Test Suite"
Cohesion: 0.28
Nodes (8): CompletedProcess, Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 71 - "Brand to Token Sync"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 72 - "HTML Presentation Renderer"
Cohesion: 0.31
Nodes (8): generate_html(), get_deliverable_info(), get_image_base64(), main(), Convert image to base64 for embedding in HTML, Extract deliverable type from filename and get info, Generate HTML presentation from CIP images, CIP HTML Presentation Renderer Generates a professional HTML presentation from…

### Community 73 - "WhatsApp Integration API"
Cohesion: 0.42
Nodes (7): POST(), findTenantByWhatsAppNumber(), processIncomingMessage(), sendWhatsApp(), STEPS, TriageData, validateWebhookToken()

### Community 74 - "Carnet Modal Component"
Cohesion: 0.31
Nodes (8): brl(), CarnetRow, contractIsActive(), HolderContract, holderIsInactive(), HolderRow, ModalCarnets(), STATUS_STYLE

### Community 75 - "Input Style Tokens"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 76 - "Radius Tokens"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 77 - "Public Identity Resolver"
Cohesion: 0.25
Nodes (8): _exact_row_identity(), Suggest complete public identities so a retry can bypass score thresholds., Return non-empty public identities from ordinary and alias fields., Resolve an explicit style identity without opening generic variant ranking., Return one row whose stable public identity exactly matches the query., _row_identities(), _style_identity(), _suggest_identities()

### Community 78 - "WhatsApp Agent DB Schema"
Cohesion: 0.36
Nodes (7): idx_emergency_dispatches_tenant, idx_tenant_whatsapp_number, idx_whatsapp_sessions_tenant_phone, public.tenant_whatsapp_numbers, public.whatsapp_agent_sessions, public.emergency_dispatches, public.tenants

### Community 79 - "Theme Conversion Script"
Cohesion: 0.25
Nodes (5): files, fs, MAP, path, ROOT

### Community 80 - "Leads API Routes"
Cohesion: 0.39
Nodes (7): DELETE, dynamic, GET, PATCH, POST, isValidLeadSource(), isValidLeadStage()

### Community 81 - "Form Validation Utilities"
Cohesion: 0.32
Nodes (6): FieldErrors, FieldValidation, getFieldLabel(), validateField(), validateForm(), ValidationRule

### Community 82 - "Project NPM Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, test:watch

### Community 83 - "Theme Contrast Fixer"
Cohesion: 0.29
Nodes (5): files, fs, path, ROOT, STRONG

### Community 84 - "Final Isolation Test"
Cohesion: 0.29
Nodes (4): admin, anon, clienteUser, env

### Community 85 - "Isolation Test v2"
Cohesion: 0.29
Nodes (4): admin, anon, clienteUser, env

### Community 86 - "Tenant Route Tests"
Cohesion: 0.29
Nodes (4): ALLOWLIST, API_DIR, INTENTIONAL_CROSS_TENANT, NO_TENANT_SCOPE

### Community 87 - "Shadow Tokens"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 88 - "Client Onboarding Script"
Cohesion: 0.33
Nodes (4): env, [name, cnpj, ownerEmail], owner, supabase

### Community 89 - "Behavior Inspection Script"
Cohesion: 0.33
Nodes (4): admin, env, isoTen, targetHold

### Community 91 - "Isolation Test v3"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 92 - "Isolation Test v4"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 93 - "Isolation Test v5"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 94 - "Isolation Test v6"
Cohesion: 0.33
Nodes (3): admin, anon, env

### Community 95 - "Border Tokens"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 96 - "Component Radius Tokens"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 97 - "Large Size Tokens"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 98 - "Supabase Migration Scripts"
Cohesion: 0.40
Nodes (4): idx_holders_tenant_id, idx_user_roles_tenant_id, public.holders, public.user_roles

### Community 100 - "CRM Leads Migration"
Cohesion: 0.70
Nodes (4): idx_leads_created, idx_leads_followup, idx_leads_stage, public.leads

### Community 101 - "Tenant Cleanup Scripts"
Cohesion: 0.40
Nodes (4): emails, env, supabase, tenantIds

### Community 103 - "Isolation Fix Tests"
Cohesion: 0.50
Nodes (3): check(), __dirname, main()

### Community 104 - "Webhook Events Migration"
Cohesion: 0.60
Nodes (4): idx_webhook_events_payment, idx_webhook_events_tenant_time, public.webhook_events, public.tenants

### Community 105 - "Slide Token Validator"
Cohesion: 0.50
Nodes (3): main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides.

### Community 106 - "Vertical Padding Utility"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 107 - "XL Size Token"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 108 - "Medium Size Token"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 109 - "None Value Token"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 111 - "RLS Definitive Fix"
Cohesion: 0.67
Nodes (3): public.get_user_tenant_id(), public.is_superadmin(), public.user_roles

### Community 112 - "RLS Isolation Fix"
Cohesion: 0.67
Nodes (3): public.get_user_tenant_id(), public.is_superadmin(), public.user_roles

### Community 113 - "RLS Part1 Fix"
Cohesion: 0.67
Nodes (3): public.get_user_tenant_id(), public.is_superadmin(), public.user_roles

### Community 115 - "Superadmin Check Script"
Cohesion: 0.50
Nodes (3): env, supabase, user

### Community 117 - "CRM Lead Notes"
Cohesion: 0.67
Nodes (3): idx_lead_notes_lead, public.lead_notes, public.leads

### Community 118 - "Holder Enrichment Migration"
Cohesion: 0.67
Nodes (3): idx_holders_tenant_birth, idx_holders_tenant_state, public.holders

### Community 119 - "User Creation Script"
Cohesion: 0.50
Nodes (3): env, supabase, USERS

### Community 120 - "Roles Diagnostic Script"
Cohesion: 0.50
Nodes (3): emails, env, supabase

### Community 122 - "Sellers Migration"
Cohesion: 0.67
Nodes (3): idx_sellers_tenant, public.sellers, public.tenants

### Community 126 - "Destructive Style Token"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 127 - "Destructive Foreground Token"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 128 - "Muted Style Token"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 129 - "Primary Foreground Token"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 130 - "Ring Style Token"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 131 - "Secondary Foreground Token"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **442 isolated node(s):** `ParsedRow`, `Props`, `EligibilityResult`, `Burial`, `ChapelBooking` (+437 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 943 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **140 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `search()` connect `Search Diagnostics Tests` to `Design Accessibility Tests`, `Stack Query Token Processor`, `Design System Generation`, `Search Domain Detection`, `Public Identity Resolver`, `Style Taxonomy Tests`, `Core Search Scripts`, `Design System Generator`, `Logo Design Search Engine`, `Text Layout Resilience Tests`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `Supabase Client Scripts` to `Backend Service Endpoints`, `Full Audit Script`, `Policy Detail Diagnostic`, `Project Identification Script`, `Insert Test Three`, `Insert Test Four`, `Project Package Configuration`, `App Layout and Auth`, `Final Isolation Test`, `Isolation Test v2`, `Client Onboarding Script`, `Behavior Inspection Script`, `API Test Script`, `Isolation Test v3`, `Isolation Test v4`, `Isolation Test v5`, `Isolation Test v6`, `Tenant Cleanup Scripts`, `Database RLS Tests`, `Isolation Fix Tests`, `Superadmin Check Script`, `Database Table Creation`, `User Creation Script`, `Roles Diagnostic Script`, `RBAC Data Insertion`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Main search function with auto-domain detection` connect `Logo Design Search Engine` to `Slide Design Search`, `Search Diagnostics Tests`, `Corporate Identity Processor`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ParsedRow`, `Props`, `EligibilityResult` to the rest of the system?**
  _442 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design Accessibility Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.0726775956284153 - nodes in this community are weakly interconnected._
- **Should `API Route Definitions` be split into smaller, more focused modules?**
  _Cohesion score 0.06516290726817042 - nodes in this community are weakly interconnected._