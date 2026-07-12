# TeamFlow – Use Case Diagram

```mermaid
flowchart TB
  Admin((Administrator))
  PM((Project Manager))
  Member((Team Member))

  Admin -->|Manages| Users[Manage Users]
  Admin -->|Configures| System[Configure System]

  PM -->|Creates| Project[Create Project]
  PM -->|Assigns| Tasks[Assign Tasks]
  PM -->|Tracks| Progress[Track Progress]

  Member -->|Views| ViewTasks[View Tasks]
  Member -->|Updates| UpdateTask[Update Task Status]
  Member -->|Comments| Comment[Comment on Tasks]
```

*Illustrates the primary interactions of each role within the system.*

## Role summary

| Actor | Primary goals |
|-------|----------------|
| Administrator | Full system control: users, roles, all projects/tasks |
| Project Manager | Own projects, membership, task planning |
| Team Member | Execute assigned work and report progress |


```mermaid
flowchart TB
  Admin((Administrator))
  PM((Project Manager))
  Member((Team Member))

  subgraph system [TeamFlow System]
    UC1[Login]
    UC2[Manage users and roles]
    UC3[View all projects]
    UC4[Create and manage projects]
    UC5[Assign project members]
    UC6[Create and manage tasks]
    UC7[View assigned projects]
    UC8[Update task progress]
    UC9[Comment on tasks]
    UC10[View dashboard and activity]
    UC11[Search and filter tasks]
    UC12[Archive projects]
  end

  Admin --> UC1
  Admin --> UC2
  Admin --> UC3
  Admin --> UC4
  Admin --> UC5
  Admin --> UC6
  Admin --> UC9
  Admin --> UC10
  Admin --> UC11
  Admin --> UC12

  PM --> UC1
  PM --> UC4
  PM --> UC5
  PM --> UC6
  PM --> UC9
  PM --> UC10
  PM --> UC11
  PM --> UC12

  Member --> UC1
  Member --> UC7
  Member --> UC8
  Member --> UC9
  Member --> UC10
  Member --> UC11
```

## Role summary

| Actor | Primary goals |
|-------|----------------|
| Administrator | Full system control: users, roles, all projects/tasks |
| Project Manager | Own projects, membership, task planning |
| Team Member | Execute assigned work and report progress |
