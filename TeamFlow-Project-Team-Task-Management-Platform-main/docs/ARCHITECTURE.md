# System Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (Next.js)"]
        FE[React Components]
    end
    subgraph Backend[Backend (Node.js/Express)]
        BE[Express Server]
        DB[(MySQL Database)]
    end
    subgraph Auth[Authentication]
        JWT[JWT Tokens]
    end
    FE -->|API Calls| BE
    BE -->|Queries| DB
    BE -->|Issues JWT| JWT
    JWT -->|Validated by| BE
```

*Shows the high‑level flow between the frontend, backend, database, and authentication layer.*
