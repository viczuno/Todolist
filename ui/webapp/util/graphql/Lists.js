sap.ui.define([], function() {
    "use strict";

    return {
        getListsGlobal: () => JSON.stringify({
            query:
                `query ListGlobal {
                result:listsGlobal {
                    id
                    name
                    description
                    tags
                    owner {
                    id
                    email }
                    visibility
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                    }
                }`,
            variables: {}
        }),

        getListByID: (id) => JSON.stringify({
            query:
                `query GetList ($id: ID!){ 
                result:list(id: $id) {
                    id
                    name
                    description
                    tags
                    visibility
                    createdAt
                    updatedAt
                    owner {
                    id}
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                }
                }`,
            variables: {
                id: id
            }
        }),

        createList: (list) => JSON.stringify({
            query:
            `mutation CreateList {
                result:createList(input: {
                    name: "${list.name}"
                    description: "${list.description}"
                    visibility: ${list.visibility}
                    tags: ${JSON.stringify(list.tags)}
                }) {
                    id
                    name
                    description
                    tags
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                    createdAt
                    updatedAt
                }
            }`
        }),

        updateList: (id, list) => JSON.stringify({
            query:
                `mutation UpdateList ($id: ID!){
                result:updateList(id: $id, input: {
                    name: "${list.name}"
                    description: "${list.description}"
                    visibility: ${list.visibility}
                    tags: ${JSON.stringify(list.tags)}
                }) {
                    id
                    name
                    description
                    visibility
                    tags
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                    createdAt
                    updatedAt
                }
            }
            `,
            variables: {
                id: id
            }
        }),

        getLists: () => JSON.stringify({
            query:
                `query Lists {
                result:lists {
                    id
                    name
                    description
                    tags
                    visibility
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                    }
                }`,
            variables: {}
        }),

        getAcceptedLists: () => JSON.stringify({
            query:
                `query Lists {
                result:listsAccepted {
                    id
                    name
                    description
                    tags
                    visibility
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                    }
                }`,
            variables: {}
        }),

        getListsPending: () => JSON.stringify({
            query:
                `query Lists {
                result:listsPending {
                    id
                    name
                    description
                    tags
                    visibility
                    createdAt
                    updatedAt
                    owner {
                    email
                    }
                    collaborators {
                      user {
                        email
                      }
                    }
                    todos {
                      title
                      description
                    }
                    }
                }`,
            variables: {}
        }),

        updateListName: (id, name) => JSON.stringify({
            query:
                `mutation UpdateListName($id: ID!, $name: String!){
                result:updateListName (id: $id, name: $name){
                    name
                    description
                }`,
            variables: {
                id: id,
                name: name
            }

        }),

        updateListDescription: (id, description) => JSON.stringify({
            query:
                `mutation UpdateListDescription ($id: ID!, $description: String!){
                result:updateListDescription (id: $id, description: $description){
                    name
                    description
                }`,
            variables: {
                id: id,
                name: description
            }

        }),

        deleteList: (id) => JSON.stringify({
            query:
                `mutation DeleteList ($id: ID!){
                result:deleteList (id: $id){
                    id
                    name
                    description
                }
                }`,
            variables: {
                id: id
            }
        }),

        addListAccess: (access) => JSON.stringify({
            query: `mutation AddListAccess {
                result:addListAccess(input: {
                    listId: "${access.listId}"
                    userId: "${access.userId}"
                    accessLevel: ${access.role}
                }) {
                    list{
                    id
                    }
                    user {
                    id
                    }
                    status
                }
            }`

        }),

        removeListAccess: (listId) => JSON.stringify({
            query: `mutation RemoveListAccess ($listId: ID!){
                result:removeListAccess(listId: $listId) {
                    list{
                    id
                    }
                    user {
                    id
                    }
                    status
                }
            }`,
            variables: {
                listId: listId
            }

        }),

        removeCollaborator: (listId, userId) => JSON.stringify({
            query: `mutation RemoveCollaborator ($listId: ID!, $userId: ID!){
                result:removeCollaborator(listId: $listId, userId: $userId) {
                    list{
                    id
                    }
                    user {
                    id
                    }
                    status
                }
            }`,
            variables: {
                listId: listId,
                userId: userId
            }

        }),

        acceptListAccess: (listId) => JSON.stringify({
            query: `mutation AcceptListAccess ($listId: ID!){
                result:acceptList(listId: $listId) 
                  
            }`,
            variables: {
                listId: listId
            }

        }),

        getAccessesByListID: (listId) => JSON.stringify({
            query: `query GetAccessesByListID ($listId: ID!){
                result:getListAccesses(listId: $listId) {
                  list{
                    id
                    name
                    }
                    user {
                    id
                    email
                    role
                    }
                    status
                    }
            }`,
            variables: {
                listId: listId
            }
        })
    };
});