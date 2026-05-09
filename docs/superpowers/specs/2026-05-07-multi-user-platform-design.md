# Multi-User Platform Design

## Overview
Transform the DC Franchise Simulator from a single-player static site into a multi-user community platform with live spectating.

## Core Experience
- **Community platform** — share seasons, browse others' runs, like/comment/follow
- **Live spectating** — watch someone's simulation in real-time via WebSocket
- **Async community** — season archives, leaderboards, player stats

## Architecture: Modular Monolith
One Node/Express server with PostgreSQL. REST API for community features, WebSocket for live spectating. Simulator engine stays client-side — the server never runs simulations, only stores results and relays live data.

- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Real-time:** WebSocket (ws or Socket.io)
- **Auth:** JWT or session-based, email + OAuth
- **Scale target:** Hundreds to thousands of users
- **Monetization:** Door kept open (premium features, cosmetics, etc.) but not designed upfront

## Sub-Projects (Build Order)

### Sub-Project 1: Auth & User Accounts
The foundation. User registration, login (email + OAuth), profiles, session management. PostgreSQL schema for users. Express API routes. JWT or session-based auth.

### Sub-Project 2: Season Sharing & Community
Save completed seasons to the server. Browse/search other users' seasons. Like, comment, follow. Public season pages with episode recaps. Core community loop.

### Sub-Project 3: Infrastructure & Deployment
Docker containerization, CI/CD pipeline, database migrations, environment config, monitoring. The ops layer for production readiness.

### Sub-Project 4: Live Spectating (WebSocket)
Real-time broadcast of an in-progress simulation. Host runs the sim client-side, WebSocket pushes VP screens to spectators. Chat overlay. Spectator count. The differentiator feature.

### Sub-Project 5: Leaderboards & Stats
Aggregate stats across all shared seasons — most popular players, win rates by archetype, challenge records. Community-wide data that makes the platform feel alive.

## Key Decisions
- Simulator engine remains **client-side** — no server-side simulation
- Modular monolith chosen over microservices (simpler ops, can split later if needed)
- PostgreSQL over MongoDB (relational data: users, seasons, comments, follows)
- WebSocket for live features, REST for everything else

## Status
**Parked** — approach selected, sub-projects defined, detailed design not yet started. Resume with Sub-Project 1 (Auth & User Accounts) when ready.
