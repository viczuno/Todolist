sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Lists",
    "sap/m/MessageToast",
    "todoapp/util/graphql/Client",
    "sap/ui/core/Core",
    "sap/ui/core/ValueState",
    "todoapp/util/graphql/Users",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Lists, MessageToast,
             Client, Core, ValueState, Users, MessageBox) {
    "use strict";

    return Controller.extend("todoapp.controller.AddUserDialog", {

        onInit:function() {
            this.oAccessModel = new JSONModel(this._initialModel());
            this.getView().setModel(this.oAccessModel, "access");
        },

        onOpenDialog: async function () {
            await this.fetchUsers();
            if (!this._oDialog) {
                this._oDialog = this.byId("addUserDialog");
            }

            if (this._oDialog) {
                this._oDialog.open();
            } else {
                console.error("Dialog not found in the view.");
            }
        },

        onSubmitPress: async function () {
            const oModel = this.oAccessModel.getData();
            const selectedUser = oModel.existingUsers.find(user => user.id === oModel.userId);

            if (!selectedUser) {
                MessageToast.show("Selected user not found.");
                return;
            }
            const userRole = selectedUser.role || "READER";

            let result;
            try {
                let query = Lists.addListAccess( {
                    listId: oModel.listId,
                    userId: oModel.userId,
                    role: userRole,
                });

                result = await Client.fetch(query);

                this.byId("addUserDialog").close();
                MessageToast.show("Successfully added new collaborator");
                this.oAccessModel.setProperty("/userId", "");
            } catch (error) {
                console.error("Error adding collaborator to the list: ", error);
                MessageToast.show("Failed to add collaborator");
                this.byId("addUserDialog").close();
            }
        },

        fetchUsers: async function () {
            const oModel = this.oAccessModel.getData();
            try {
                let query = Users.getUsers();
                let result = await Client.fetch(query);

                query = Users.getUsersByList(oModel.listId);
                let collaborators = await Client.fetch(query);

                query = Lists.getAccessesByListID(oModel.listId);
                let accesses = await Client.fetch(query);

                accesses = accesses.filter(access => access.status !== "owner");

                let filteredUsers = result.filter(user =>
                    !collaborators.some(collaborator => collaborator.id === user.id) &&
                    user.id !== oModel.owner
                );

                collaborators = collaborators.filter(user =>
                    user.id !== oModel.owner);

                this.oAccessModel.setProperty("/existingUsers", filteredUsers);
                this.oAccessModel.setProperty("/collaborators", accesses);
                this.oAccessModel.setProperty("/hasUsers", filteredUsers.length > 0);
            } catch (error) {
                console.error("Error fetching users:", error);
                MessageToast.show("Failed to fetch users.");
            }
        },

        onRemoveCollaborator: function (oEvent) {
            const oModel = this.oAccessModel.getData();
            const aCollaborators = this.oAccessModel.getProperty("/collaborators");

            const sPath = oEvent.getSource().getBindingContext("access").getPath();
            const iIndex = parseInt(sPath.split("/").pop(), 10);
            const oCollaborator = aCollaborators[iIndex];

            if (oCollaborator) {
                MessageBox.confirm("Are you sure you want to remove this collaborator?", {
                    title: "Confirm Removal",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: async (sAction) => {
                        if (sAction === MessageBox.Action.OK) {
                            try {
                                let query = Lists.removeCollaborator(oModel.listId, oCollaborator.id);
                                await Client.fetch(query);

                                MessageToast.show("Collaborator removed successfully");
                            } catch (error) {
                                console.error("Error removing collaborator:", error);
                                MessageToast.show("Failed to remove collaborator");
                            }
                        }
                        this.onCancelPress();
                    }
                });
            }
        },


        onCancelPress: function () {
            this.oAccessModel.setProperty("/userId", "");
            this.byId("addUserDialog").close();
        },


        _initialModel: function () {
            return {
                listId: "",
                userId: "",
                role: "",
                owner: "",
                hasUsers: true,
                existingUsers: [],
                collaborators: [],
                listAccesses: null
            }
        }
    });
});
