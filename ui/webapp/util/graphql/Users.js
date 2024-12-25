sap.ui.define([], function() {
    "use strict";

    return {
        getUsers: () => JSON.stringify({
            query:
                `query GetUsers {
                result:users {
                    id
                    email
                    role
                }
                }`,
            variables: {}
        }),

        getUserByID: (id) => JSON.stringify({
            query:
                `query GetUserByID {
                   result:user($id: ID!) {
                        id
                     email
                     role
                }
                }`,
            variables: {
                id: id
            }
        }),

        getUser: () => JSON.stringify({
           query:
               `query GetUserByEmail {
                   result:userByEmail {
                        id
                     email
                     role
                }
                }`,
        }),

        createUser: (user) => JSON.stringify({
            query:
                `mutation CreateUser {
                result:createUser(input: {
                    email: "${user.email}"
                    githubID: "${user.githubID}
                    role: "${user.role}"
                }) {
                    id
                    createdAt
                    updatedAt
                }
            }`
        }),

        deleteUser: (id) => JSON.stringify({
            query:
                `mutation DeleteUser ($id: ID!){
                result:deleteUser (id: $id){
                    id
                }`,
            variables: {
                id: id
            }
        }),

        updateUser: (id, user) => JSON.stringify({
            query:
                `mutation UpdateTodo {
                result:updateUser($id: ID!, input: {
                   email: "${user.email}"
                    githubID: "${user.githubID}
                    role: "${user.role}"
                }) {
                    id
                    createdAt
                    updatedAt
                }
            }`,
            variables: {
                id: id
            }
        }),

        getUsersByList: (id) => JSON.stringify( {
            query:
                `query GetUsersByList ($id: ID!) {
                result:usersByList (id: $id) {
                      id
                     email
                     role
                }
            }`,
            variables: {
                id: id
            }
        })
    };
});