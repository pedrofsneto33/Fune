# Code-Ranker - Analise estrutural do projeto

> Gerado em: 2026-09-15 00:10
> Fonte: 20260915-000314-52d.json
> Ferramenta: code-ranker v5.0.4

## Resumo do workspace

- Arquivos TS analisados: 148
- Arestas de dependencia: 476
- Ciclos de dependencia: 0
- Principios aplicaveis: 13

## Top 15 arquivos por complexidade cognitiva

| Arquivo | SLOC | Cognitive | Cyclomatic | MI | Fan-in | Fan-out |
|---|---|---|---|---|---|---|
| {target}/src\app\page.tsx | 4741 | 871 | 884 | -236.0 | 0 | 17 |
| {target}/src\app\api\holders\route.ts | 418 | 150 | 86 | -1.6 | 0 | 4 |
| {target}/src\components\tabs\CrmTab.tsx | 682 | 142 | 170 | -29.6 | 2 | 3 |
| {target}/src\app\api\service-orders\route.ts | 307 | 139 | 82 | 5.8 | 0 | 4 |
| {target}/src\components\tabs\BillingTab.tsx | 752 | 120 | 152 | -27.9 | 1 | 7 |
| {target}/src\app\api\leads\route.ts | 150 | 114 | 64 | 25.3 | 0 | 5 |
| {target}/src\components\tabs\SellersTab.tsx | 416 | 107 | 108 | -4.4 | 1 | 2 |
| {target}/src\components\tabs\LogisticsTab.tsx | 480 | 103 | 97 | -4.2 | 1 | 3 |
| {target}/src\components\modals\ModalCarnets.tsx | 444 | 93 | 124 | -10.6 | 2 | 2 |
| {target}/src\app\api\plans\route.ts | 64 | 93 | 55 | 42.6 | 0 | 3 |
| {target}/src\app\api\payment-carnets\route.ts | 207 | 90 | 56 | 20.3 | 0 | 7 |
| {target}/src\app\api\users\roles\route.ts | 205 | 86 | 56 | 18.6 | 0 | 4 |
| {target}/src\app\api\holders\import\route.ts | 232 | 83 | 58 | 18.3 | 0 | 5 |
| {target}/src\components\tabs\TenantSettingsTab.tsx | 525 | 79 | 100 | -8.4 | 1 | 4 |
| {target}/src\app\api\dependents\route.ts | 201 | 78 | 48 | 23.9 | 0 | 4 |

## Hubs (fan-in >= 10 - cuidado ao alterar)

| Arquivo | Fan-in | Fan-out |
|---|---|---|
| {target}/src\lib\supabaseAdmin.ts | 58 | 0 |
| {target}/src\lib\api-handler.ts | 49 | 3 |
| {target}/src\lib\validation.ts | 36 | 0 |
| {target}/src\lib\notify.ts | 32 | 0 |
| {target}/src\lib\authFetch.ts | 32 | 1 |
| {target}/src\lib\http-error.ts | 17 | 0 |
| {target}/src\lib\rate-limiter.ts | 15 | 0 |
| {target}/src\types\index.ts | 10 | 1 |
| {target}/src\lib\eligibility.ts | 10 | 0 |

## Principios avaliados pelo code-ranker

### CPX - CPX â€” Reduce Complexity

Metrica: `cognitive`

Prompt para IA: These modules are too complex and I want to reduce their complexity. Reduce it by splitting large units into smaller single-responsibility ones, extracting repeated patterns into shared helpers, flattening deeply nested control flow, and breaking large functions into focused helpers.

### ADP - ADP â€” Acyclic Dependencies Principle

Metrica: `cycle`

Prompt para IA: The dependency graph between modules must form a DAG. When module A depends on module B, no chain of dependencies should bring B back to A.  Identify any cycles in the modules below. For each cycle, propose a concrete refactoring (extract a shared abstraction, invert a dependency, split a module) that makes the graph acyclic without breaking existing functionality.  When splitting a module to break a cycle, the new structure should: - Preserve existing API contracts - Minimise coupling in the new structure - Follow the Single Responsibility Principle - Not introduce new dependency cycles

### SRP - SRP â€” Single Responsibility Principle

Metrica: `sloc`

Prompt para IA: A module should have one reason to change â€” it should serve one actor and encapsulate one coherent set of decisions.  For each module below, identify whether it has more than one responsibility. Propose how to split responsibilities so each module changes for only one reason, and specify the new module boundaries.

### OCP - OCP â€” Open/Closed Principle

Metrica: `cyclomatic`

Prompt para IA: A module should be open for extension but closed for modification: new behaviour should be addable without editing existing, working code.  For each module below, identify extension points that currently require editing existing code (e.g. growing match/switch/if-else chains). Propose an extension mechanism (polymorphism, strategy, plug-in registration) so new cases can be added without modifying these modules.

### LSP - LSP â€” Liskov Substitution Principle

Metrica: `hk`

Prompt para IA: Every implementation of an interface must honour its full contract â€” return-value invariants, error/exception behaviour, side effects, and resource ownership â€” not just the method signatures. A subtype must be substitutable for its base without surprising callers.  Identify the interface implementations in the modules below. For each, check it can replace any other implementation of the same interface without breaking callers. Flag violations and propose fixes.

### ISP - ISP â€” Interface Segregation Principle

Metrica: `items`

Prompt para IA: Clients should not be forced to depend on methods they do not use. Prefer several small, focused interfaces over one wide interface.  Identify interfaces in the modules below that are wider than their consumers need. Propose how to split them into narrower interfaces so each consumer depends only on what it actually uses.

### DIP - DIP â€” Dependency Inversion Principle

Metrica: `fan_out`

Prompt para IA: High-level modules should not depend on low-level modules; both should depend on abstractions, and abstractions should not depend on details.  Find places in the modules below where a high-level module depends directly on a concrete low-level type. Propose an abstraction (interface) to invert each such dependency, and specify where the concrete implementation should be wired in.

### DRY - DRY â€” Don't Repeat Yourself

Metrica: `sloc`

Prompt para IA: Every piece of knowledge must have a single authoritative representation. DRY is about knowledge duplication, not just code duplication.  Identify concepts, rules, or policies that are duplicated across the modules below. For each duplication, propose a canonical location and the refactoring needed to consolidate it.

### KISS - KISS â€” Keep It Simple

Metrica: `cognitive`

Prompt para IA: When two designs solve the same problem, prefer the simpler one â€” fewer abstractions, fewer indirection layers, fewer moving parts.  Identify over-engineered or needlessly complex constructs in the modules below. For each, describe the simpler alternative and estimate the risk of simplifying.

### LoD - Law of Demeter â€” Principle of Least Knowledge

Metrica: `fan_out`

Prompt para IA: A method should only call methods on: itself, its direct fields, its parameters, and objects it constructs locally. Avoid `x.foo().bar().baz()` chains that traverse object graphs.  Identify method chains or deep field traversals in the modules below that violate LoD. For each, propose a narrow accessor or a facade that exposes only what the caller needs, reducing coupling.

### MISU - MISU â€” Make Invalid States Unrepresentable

Metrica: `cyclomatic`

Prompt para IA: Move correctness from runtime checks into the type system, so invalid states cannot be constructed and fail at compile time rather than at runtime.  Identify data structures or function signatures in the modules below where invalid states are representable at runtime. For each, propose a type-level encoding (sum type / enum, newtype, typestate) that makes the invalid state unrepresentable by construction.

### CoI - CoI â€” Composition Over Inheritance

Metrica: `items`

Prompt para IA: Build behaviour by composing small, focused pieces rather than through deep inheritance hierarchies.  Identify large types that accumulate behaviour in the modules below. Propose how to decompose them into smaller composable parts, and show how consumers would assemble the behaviour they need.

### YAGNI - YAGNI â€” You Aren't Gonna Need It

Metrica: `sloc`

Prompt para IA: Build for the problem you have now, not one you imagine you might have later. Don't add an abstraction, a generic parameter, or a public API for a hypothetical future use.  Identify abstractions, generics, or public APIs in the modules below that were added speculatively. For each, assess whether multiple real callers use it today, and propose simplification if not.


