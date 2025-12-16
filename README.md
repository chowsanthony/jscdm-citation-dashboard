# JSCDM Editorial Dashboard

An interactive analytics dashboard for the Journal of the Society for Clinical Data Management (JSCDM) editorial board. This application visualizes publication impact, citation metrics, and section performance to support data-driven editorial decisions.

## Features

- **Interactive KPIs**: Track total publications, total citations, and average citations per paper.
- **Dynamic Filtering**: 
  - Filter by Journal Issue (e.g., "Fall 2025", "Special Collections").
  - Filter by Article Section (e.g., "Original Research", "Opinion Papers").
- **Visual Analytics**:
  - **Citation Impact by Section**: Bar chart visualizing volume and impact per section.
  - **Top Publications**: Ranked list of the top 10 most cited papers.
- **Data Management**:
  - Pre-loaded with current publication data.
  - **CSV Upload**: Interface to upload and analyze fresh data exports.
- **Detailed Data View**: Searchable and sortable table of all publications.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd jscdm-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Asset Management

For production builds, please ensure the banner image `collection-banner.png` is placed in the `public/` directory of your project (e.g., `public/collection-banner.png`). This ensures it is correctly copied to the build output.

## CSV Data Format

To analyze new data, upload a CSV file with the following headers (case-insensitive):

- **DOI**: Digital Object Identifier
- **Title**: Article title
- **Section** (or `Category`): Article section
- **Featured In** (or `Issue`, `Journal Issue`): Issue or collection name
- **Max Citations**: Maximum citation count
- **Crossref**: Crossref citation count
- **Semantic Scholar**: Semantic Scholar citation count
- **OpenCitations**: OpenCitations citation count

## Built With

- **React 18**: UI Library
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library
- **Lucide React**: Icon set
- **TypeScript**: Static type checking
