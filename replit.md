# Overview

DroneFolio is a modern full-stack web application designed for drone photography and videography portfolios. The application allows administrators to upload and manage various types of media content (4K photos, 180° panoramas, 360° panoramas, and YouTube videos) while providing a sleek public-facing portfolio interface for showcasing aerial photography work.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built using React 18 with TypeScript and follows a modern component-based architecture. The application uses Vite as the build tool and development server, providing fast hot module replacement and optimized builds. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, ensuring accessibility and consistent design patterns.

**Key Frontend Design Decisions:**
- **Component Structure**: Modular components organized by feature (admin, portfolio, layout)
- **State Management**: React Query for server state management and local React state for UI interactions
- **Styling**: Tailwind CSS with a dark theme design system using CSS custom properties
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
The server is built with Express.js and follows a RESTful API design pattern. The architecture separates concerns between route handling, data storage, and server configuration.

**Key Backend Design Decisions:**
- **API Design**: RESTful endpoints for media items and settings management
- **Storage Abstraction**: Interface-based storage layer allowing for different implementations (currently in-memory)
- **Development Setup**: Custom Vite integration for seamless full-stack development
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions
The application uses a dual-approach to data persistence:

**Database Layer:**
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: PostgreSQL-compatible schema with tables for users, media items, and settings
- **Migrations**: Drizzle Kit for database schema management

**Development Storage:**
- **In-Memory Storage**: MemStorage class implementing the IStorage interface
- **Data Initialization**: Automatic setup of default settings and configurations

**Schema Design Rationale:**
- Media items table supports multiple content types through a unified structure
- Settings table provides flexible key-value configuration storage
- User table enables future authentication features

## Authentication and Authorization
The current implementation includes a basic foundation for authentication:
- User schema defined in the database layer
- Storage methods for user management
- Admin modal components prepared for login functionality

**Future Authentication Considerations:**
- Password hashing and session management not yet implemented
- Admin routes currently accessible without authentication
- Foundation exists for implementing JWT or session-based auth

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with latest features and concurrent rendering
- **Express.js**: Node.js web framework for API development
- **TypeScript**: Type safety across the entire application stack

## Database and ORM
- **Drizzle ORM**: Type-safe database operations and schema management
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless environments
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool and development server with HMR
- **React Query**: Server state management and data fetching
- **Zod**: Runtime type validation for forms and API data
- **Wouter**: Lightweight routing library for single-page applications

## File Upload and Media Handling
- **Google Cloud Storage**: Cloud storage service for media files
- **Uppy**: File upload library with drag-and-drop interface
- **File Input Components**: Multiple file upload strategies (dashboard, drag-drop, file input)

## Future Integration Considerations
- Google Cloud Storage integration prepared but not fully implemented
- YouTube API integration for video content management
- Social media link management through settings system