# HR Workflow Designer

An interactive drag-and-drop workflow builder for HR teams, built using React and ReactFlow. Create, test, and export HR workflows such as onboarding, approvals, and automated actions.

![React](https://img.shields.io/badge/React-18.x-blue)
![ReactFlow](https://img.shields.io/badge/ReactFlow-11.x-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

The HR Workflow Designer allows users to visually build workflows, configure nodes, simulate processes, and export workflows in multiple formats. It supports five node types, workflow insights, theming, and real-time configuration.

## Features

- Drag-and-drop workflow canvas
- Node types: Start, Task, Approval, Automated, End
- Node configuration panel
- Simulation/testing mode
- Import/export (JSON, JPEG, PDF)
- MiniMap, zoom, and canvas controls
- Light/Dark theme
- Insights panel with metrics
- Smooth animations and modern UI

## Architecture

### Component Structure (Simplified)

```
HRWorkflowDesigner
├── FlowCanvas
│   ├── Header
│   ├── NodeLibrarySidebar
│   ├── ReactFlow Canvas
│   ├── InsightsPanel
│   ├── NodeConfigPanel
│   ├── ExportMenu
│   └── SimulationPanel
```

### Tech Stack

- React 18
- ReactFlow 11
- Tailwind CSS
- Lucide React
- html-to-image (image export)
- jsPDF (PDF export)

## How to Run

### Installation

```bash
git clone <repo-url>
cd hr-workflow-designer
npm install
npm run dev
```

Runs at `http://localhost:3000`.

### Build

```bash
npm run build
```

## Usage

1. Add nodes from the left sidebar
2. Connect nodes
3. Configure them using the panel
4. Test workflow
5. Export as JSON/JPEG/PDF
6. Import saved workflows

## Design Principles

- Gradient-based node colors for clarity
- Glassmorphism + subtle animations
- Local state + ReactFlow for efficient canvas management
- Reusable components and clean architecture

## Future Enhancements

- Backend integration
- User authentication & roles
- Real-time collaboration
- Version history and rollback
- Conditional/parallel/loop node types
- Advanced analytics dashboard
- BPMN and workflow engine exports
