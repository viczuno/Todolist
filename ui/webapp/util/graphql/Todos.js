sap.ui.define([], function() {
    "use strict";

    return {
        getTodosGlobal: () => JSON.stringify({
            query:
                `query TodosGlobal {
                result:todosGlobal {
                    id
                    title
                    description
                    priority
                    completed
                    createdAt
                    updatedAt
                    list {
                    id
                    name
                    description
                    visibility
                    tags
                    owner {
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                    createdAt
                    updatedAt
                    }
                    startDate
                    dueDate
                    tags
                    assignedTo {
                    id
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                }
        }`,
            variables: {}
        }),

        getTodoByID: (id) => JSON.stringify({
            query:
                `query GetTodo ($id: ID!) { 
                    result:todo(id: $id) {
                     id
                    title
                    priority
                }
                }`,
            variables: {
                id
            }
        }),

        createTodo: (todo) => JSON.stringify({
            query:
                `mutation CreateTodo {
            result: createTodo(input: {
                title: "${todo.title}" 
                description: "${todo.description}"
                priority: ${todo.priority}
                tags: ${JSON.stringify(todo.tags)} 
                listId: "${todo.listID}" 
                assignedTo: "${todo.assignedTo}" 
                startDate: "${todo.startDateTime}"
                dueDate: "${todo.endDateTime}"
                completed: ${todo.completed}
            }) {
                id
                    title
                    description
                    priority
                    completed
                    createdAt
                    updatedAt
                    list {
                    id
                    name
                    description
                    visibility
                    tags
                    owner {
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                    createdAt
                    updatedAt
                    }
                    startDate
                    dueDate
                    tags
                    assignedTo {
                    id
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
            }
        }`
        }),

        deleteTodo: (id) => JSON.stringify({
            query:
                `mutation DeleteTodo ($id: ID!) {
                result:deleteTodo (id: $id){
                    id
                    title
                    description
                }
        }`,
            variables: {
                id: id
            }
        }),

        updateTodo: (id, todo) => JSON.stringify({
            query:
                `mutation UpdateTodo ($id: ID!){
                result:updateTodo(id: $id, input: {
                    title: "${todo.title}" 
                description: "${todo.description}"
                priority: ${todo.priority}
                tags: ${JSON.stringify(todo.tags)} 
                assignedTo: "${todo.assignedTo}" 
                startDate: "${todo.startDateTime}"
                dueDate: "${todo.endDateTime}"
           
                completed: ${todo.completed}
                }) {
                    id
                    title
                    description
                    priority
                    completed
                    createdAt
                    updatedAt
                    list {
                    id
                    name
                    description
                    visibility
                    tags
                    owner {
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                    createdAt
                    updatedAt
                    }
                    startDate
                    dueDate
                    tags
                    assignedTo {
                    id
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                }
            }`,
            variables: {
                id: id
            }
        }),

        getTodos: () => JSON.stringify({
            query:
                `query GetTodos {
                result:todos {
                    id
                    title
                    description
                    priority
                    completed
                    createdAt
                    updatedAt
                    list {
                    id
                    name
                    description
                    visibility
                    tags
                    owner {
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                    createdAt
                    updatedAt
                    }
                    startDate
                    dueDate
                    tags
                    assignedTo {
                    id
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                }
        }`,
            variables: {}
        }),

        updateTodoTitle: (id, title) => JSON.stringify({
            query:
                `mutation UpdateTodoTitle ($id: ID!, $title: String!) {
                result:updateTodoTitle (id: $id, title: $title){
                    title
                    description
                }
        }`,
            variables: {
                id: id,
                title: title
            }

        }),

        updateTodoDescription: (id, description) => JSON.stringify({
            query:
                `mutation UpdateTodoDescription ($id: ID!, $description: String!) {
                result:updateTodoDescription (id: $id, description: $description){
                    title
                    description
                }
        }`,
            variables: {
                id: id,
                description: description
            }
        }),

        updateTodoPriority: (id, priority) => JSON.stringify({
            query:
                `mutation UpdateTodoPriority ($id: ID!, $priority: String!) {
                result:updateTodoPriority (id: $id, priority: $priority){
                    title
                    description
                }
        }`,
            variables: {
                id: id,
                priority: priority
            }
        }),

        updateTodoAssignTo: (id, assignTo) => JSON.stringify({
            query:
                `mutation UpdateTodoAssignTo ($id: ID!, $assignTo: String!) {
                result:updateTodoAssignTo (id: $id, assignTo: $assignTo){
                    title
                    description
                }
        }`,
            variables: {
                id: id,
                assignTo: assignTo
            }
        }),

        completeTodo: (id) => JSON.stringify({
            query:
                `mutation CompleteTodo ($id: ID!) {
                result:completeTodo (id: $id){
                    id
                    title
                    description
                    completed
                }
        }`,
            variables: {
                id: id
            }
        }),

        getTodosByList: (id) => JSON.stringify({
            query:
                `query GetTodosByList ($id: ID!){
                result:todosByList (id: $id) {
                    id
                    title
                    description
                    priority
                    completed
                    createdAt
                    updatedAt
                    list {
                    id
                    name
                    description
                    visibility
                    tags
                    owner {
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                    createdAt
                    updatedAt
                    }
                    startDate
                    dueDate
                    tags
                    assignedTo {
                    id
                    email
                    githubID
                    role
                    createdAt
                    updatedAt}
                }
        }`,
            variables: {
                id: id
            }
        }),
    };
});