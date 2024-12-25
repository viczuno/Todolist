sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Client",
    "todoapp/util/graphql/Lists",
    "sap/ui/core/Core",
    "todoapp/formatter/Formatter"
], function (Controller, MessageToast, JSONModel, Client, Lists, Core, Formatter) {
    "use strict";

    return Controller.extend("todoapp.controller.Invites", {

        onInit: async function () {
            if (!Formatter.hasCookie()) {
                MessageToast.show("Please log in first.")
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }

            this.oInviteModel = new JSONModel();
            this.getView().setModel(this.oInviteModel, "invites");

            await this.setUpInvites();
        },

        setUpInvites: async function () {
            try {
                const inviteQuery = Lists.getListsPending();
                const result = await Client.fetch(inviteQuery);

                this.oInviteModel.setData({data: result});
            } catch (error) {
                console.error("Error fetching invites:", error);
                MessageToast.show("Failed to load invites.");
            }
        },

        onAcceptPress: async function (oEvent) {
            let oButton = oEvent.getSource();
            let oContext = oButton.getParent().getBindingContext("invites");
            let listId = oContext.getProperty("id");
            try {
                const sQuery = Lists.acceptListAccess(listId);
                const aResult = await Client.fetch(sQuery);
                this.removeInviteFromModel(listId);
                Core.getEventBus().publish("todoapp", "listAccepted", aResult);
                Core.getEventBus().publish("todoapp", "pendingListChange", null);
            } catch (error) {
                console.error("Error while accepting invitation");
            }
        },
        onRejectPress: async function (oEvent) {
            let oButton = oEvent.getSource();
            let oContext = oButton.getParent().getBindingContext("invites");
            let listId = oContext.getProperty("id");

            try {
                const sQuery = Lists.removeListAccess(listId);
                const aResult = await Client.fetch(sQuery);
                this.removeInviteFromModel(listId);
                Core.getEventBus().publish("todoapp", "pendingListChange", null);
            } catch (error) {
                console.error("Error while rejecting invitation");
                MessageToast.show("Failed to reject invitation");
            }
        },
        removeInviteFromModel: function (listId) {
            let aData = this.oInviteModel.getData().data;

            let iIndex = aData.findIndex(item => item.id === listId);

            if (iIndex > -1) {
                aData.splice(iIndex, 1);
                this.oInviteModel.setData({data: aData});
            }
        }
    });
});
