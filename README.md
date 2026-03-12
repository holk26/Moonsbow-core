# Moonsbow-core


Moonsbow Core is a modular, multi-tenant backend platform designed to power multiple SaaS products from a single codebase.

Built with FastAPI, PostgreSQL, and Redis, it provides the foundational infrastructure required to rapidly build and scale software platforms such as LMS systems, restaurant management tools, financial applications, and other vertical SaaS products.

The architecture separates core infrastructure, platform modules, and product plugins, enabling teams to develop independent features while maintaining a stable and scalable foundation.

Key Features

- Multi-tenant architecture for serving multiple organizations
- Plugin-based system for building independent SaaS products
- Modular domain design separating infrastructure and business logic
- Event-driven architecture for automation and workflows
- Scalable API powered by FastAPI
- Secure authentication and tenant management
- Worker system for background processing
- Schema migrations managed with Atlas
- Containerized deployment with Docker

Architecture Overview

Internet
   │
Reverse Proxy
   │
Moonsbow Core API
   │
Modules
 ├ Auth
 ├ Tenants
 ├ Billing
 ├ Events
 └ Notifications
   │
Plugins
 ├ LMS
 ├ Restaurant
 └ Finance

Project Goal

Moonsbow Core aims to function as a SaaS factory, enabling developers to launch multiple scalable products on top of a shared platform while maintaining strong isolation, extensibility, and operational reliability.

License

MIT
