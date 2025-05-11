# Sankey Diagram Builder

A modern web application for creating and visualizing Sankey diagrams, built with Next.js and TypeScript.

## Features

- Create and edit Sankey diagrams with an intuitive interface
- Add flows between nodes with source, target, and value
- Preview diagrams in real-time
- Save and load diagrams
- Import data from CSV files
- Export diagrams as PNG (coming soon)
- Responsive design for all devices

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- D3.js for visualization

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd sankeymatic-next
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app` - Next.js app router pages
  - `/builder` - Diagram builder page
  - `/view` - Diagram viewer page
- `/components` - React components
  - `/ui` - Reusable UI components
  - `/sankey-diagram` - Sankey diagram visualization component
- `/lib` - Utility functions and helpers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
