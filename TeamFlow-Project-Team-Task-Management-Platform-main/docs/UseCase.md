# Use Case Diagram

```mermaid
%% Use Cases for TeamFlow
usecaseDiagram
    actor Admin
    actor PM
    actor Member

    Admin --> (Manage Users)
    Admin --> (Configure System)
    PM --> (Create Project)
    PM --> (Assign Tasks)
    PM --> (Track Progress)
    Member --> (View Tasks)
    Member --> (Update Task Status)
    Member --> (Comment on Tasks)
```

*Illustrates the primary interactions of each role within the system.*
