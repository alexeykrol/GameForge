# Match-3 Gems Game

## Overview

This is a modern Match-3 puzzle game built as a full-stack web application. Players swap adjacent gems to create matches of 3 or more identical gems, earning points and clearing the board. The game features a React-based frontend with a Canvas-rendered game board, particle effects, and smooth animations, backed by an Express.js server with PostgreSQL database integration.

## Recent Changes (August 2025)

- **Animation System Overhaul**: Implemented proper Match-3 animation sequence based on reference game analysis
- **Input Blocking**: Added `isProcessing` flag to prevent clicks during animations for smooth gameplay
- **Sequential Animation Flow**: Created swap → disappear → fall → cascade cycle with proper timing
- **Swap Animation**: Added visual gem swapping with automatic revert for invalid moves
- **Settings Integration**: Connected user speed preferences (1-5) to animation timing configuration
- **Git Integration**: Successfully pushed complete project to public GitHub repository

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server with hot module replacement
- **Canvas-based rendering** for the game board with custom drawing logic for gems and animations
- **Zustand** for state management with separate stores for game logic, audio, and Match-3 mechanics
- **Radix UI** component library for consistent UI elements and accessibility
- **Tailwind CSS** for styling with a custom design system and dark mode support
- **React Three Fiber** for 3D graphics capabilities (future enhancements)

### Game Engine
- **Custom Match-3 logic** with board generation, match detection, and gem cascading
- **Particle system** for visual effects during gem matches
- **Audio management** with mute/unmute functionality and sound effect triggers
- **Animation system** for smooth gem movements and transitions

### Backend Architecture
- **Express.js** server with TypeScript
- **Modular route handling** with a storage abstraction layer
- **Development/production middleware** with Vite integration for development
- **Error handling** middleware with proper HTTP status codes

### Data Storage Solutions
- **PostgreSQL** database with Neon serverless integration
- **Drizzle ORM** for type-safe database operations and schema management
- **Migration system** for database schema versioning
- **In-memory storage fallback** during development with MemStorage class

### Authentication and Authorization
- **User schema** with username/password fields prepared for future authentication
- **Session management** infrastructure ready with connect-pg-simple
- **Validation layer** using Zod schemas for data integrity

### Build and Development
- **ESBuild** for server-side bundling and production builds
- **TypeScript compilation** with strict mode and path aliases
- **Development workflow** with tsx for server execution and automatic restarts

## External Dependencies

### Database and ORM
- **@neondatabase/serverless** - Serverless PostgreSQL connection
- **drizzle-orm** - Type-safe database toolkit
- **drizzle-kit** - Database migration and introspection tools

### UI and Styling
- **@radix-ui/** components - Accessible, unstyled UI primitives
- **tailwindcss** - Utility-first CSS framework
- **@fontsource/inter** - Web font loading

### State Management and Data Fetching
- **zustand** - Lightweight state management
- **@tanstack/react-query** - Server state management and caching

### Graphics and Animation
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for React Three Fiber
- **@react-three/postprocessing** - Post-processing effects

### Development Tools
- **vite** - Build tool and development server
- **tsx** - TypeScript execution engine
- **@replit/vite-plugin-runtime-error-modal** - Development error handling

### Audio and Media
- **vite-plugin-glsl** - GLSL shader support for advanced graphics
- Support for various audio formats (MP3, OGG, WAV) and 3D models (GLTF, GLB)