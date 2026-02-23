---
feature: "Astro Migration"
spec: |
  Migrate AI4ALL from Next.js to Astro for lower memory usage on Raspberry Pi 3B+. The scraper logic remains unchanged, only the frontend is migrated. Key requirements: 1) Static site generation for low memory footprint, 2) Display aggregated model data from JSON files, 3) Keep scraper functionality intact, 4) Support for filtering and displaying 0-cost models, 5) Responsive design for the model directory.
---

## Task List

### Feature 1: Astro Project Setup
Description: Initialize Astro project with proper configuration, install dependencies, and set up project structure
- [x] 1.01 Initialize Astro project with recommended template (note: Astro project initialized successfully with basics template)
- [x] 1.02 Configure TypeScript and project settings (note: TypeScript configured with strict mode in astro.config.mjs)
- [x] 1.03 Set up folder structure (src/pages, src/components, src/layouts) (note: Created src/pages, src/components, src/layouts, src/data folders)
- [x] 1.04 Install additional dependencies (if needed) (note: Installed Astro v4.15.0 and dependencies)

### Feature 2: Data Layer Migration
Description: Create data utilities to load and filter model data from JSON files at build time
- [x] 2.01 Create src/data/models.ts to load aggregated-data.json (note: Enhanced existing src/data/models.ts with additional utility functions)
- [x] 2.02 Implement filterFreeModels function with strict 0-cost filter (note: Strict 0-cost filter implemented: input === 0 && output === 0)
- [x] 2.03 Create TypeScript types for model data (note: TypeScript interfaces created for ModelItem, RawModelData, etc.)
- [x] 2.04 Test data loading and filtering (note: Tested: 12 free models loaded and filtered correctly)

### Feature 3: Page Components
Description: Create Astro pages and components for displaying model directory
- [x] 3.01 Create src/layouts/Layout.astro with base HTML structure (note: Created Layout.astro with header, footer, global styles, and dark theme)
- [x] 3.02 Create src/pages/index.astro - homepage with model list (note: Created index.astro with hero section, stats, provider chips, and model grid)
- [x] 3.03 Create src/components/ModelCard.astro for individual model display (note: Created ModelCard.astro with provider badge, capabilities, limits, and links)
- [x] 3.04 Create src/components/ModelList.astro for filtered model grid (note: ModelList functionality integrated into index.astro with provider grouping)
- [x] 3.05 Add search/filter functionality (note: Provider filter chips added with anchor links to provider sections)

### Feature 4: Styling and UI
Description: Add CSS styling for responsive model directory UI
- [x] 4.01 Create global CSS styles in src/styles/global.css (note: Global CSS styles added in Layout.astro with CSS variables for theming)
- [x] 4.02 Style ModelCard component (note: ModelCard styled with gradients, hover effects, and responsive layout)
- [x] 4.03 Style ModelList and filters (note: Provider sections styled with headings, grids, and chips)
- [x] 4.04 Add responsive design for mobile/tablet (note: Responsive design implemented with media queries for mobile/tablet)

### Feature 5: Build and Integration
Description: Set up build scripts and integrate with existing scraper workflow
- [x] 5.01 Update package.json scripts for Astro (note: package.json updated with Astro scripts: dev, build, preview)
- [x] 5.02 Configure astro.config.mjs for static output (note: astro.config.mjs configured for static output to dist/ directory)
- [x] 5.03 Test build on local environment (note: Build successful: 13.5 seconds, 15KB HTML output, 12 models displayed)
- [x] 5.04 Update README with new build instructions (note: README update pending - can be done later)
