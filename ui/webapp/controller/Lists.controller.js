sap.ui.define([
    "sap/ui/core/mvc/XMLView",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Lists",
    "sap/m/MessageToast",
    "sap/ui/core/Core",
    "todoapp/util/graphql/Client",
    "todoapp/formatter/Formatter",
], function (XMLView, Controller, JSONModel, Lists, MessageToast, Core, Client, Formatter) {
    "use strict";

    return Controller.extend("todoapp.controller.Lists", {
        formatter: Formatter,
        onInit: async function () {
            if (!Formatter.hasCookie()) {
                this.getOwnerComponent().getRouter().navTo("login");
                MessageToast.show("Please log in first.")
                return;
            }

            Core.getEventBus().subscribe("todoapp", "listAdded", this.handleListAdded, this);
            Core.getEventBus().subscribe("todoapp", "listUpdated", this.handleUpdatedList, this);
            Core.getEventBus().subscribe("todoapp", "listDeleted", this.handleDeletedList, this);
            Core.getEventBus().subscribe("todoapp", "listAccepted", this.handleListAccepted, this);

            this.oListsModel = new JSONModel();
            this.getView().setModel(this.oListsModel, "lists")
            this.oAcceptedListsModel = new JSONModel();
            this.getView().setModel(this.oAcceptedListsModel, "accepted")
            await this.setUpLists();
        },

        setUpLists: async function () {

            try {
                let sQuery = Lists.getLists();
                if (Formatter.isAdmin()) {
                    sQuery = Lists.getListsGlobal();
                }
                const aResult = await Client.fetch(sQuery);

                sQuery = Lists.getAcceptedLists();
                const aAccepted = await Client.fetch(sQuery);

                this.oListsModel.setData({data: aResult});
                this.oAcceptedListsModel.setData({data: aAccepted});
            } catch (error) {
                console.error("Error fetching lists:", error);
                MessageToast.show("Failed to load lists.");
            }
        },

        handleListAccepted: async function (ns, ev, eventData) {
            await this.setUpLists();
        },

        handleDeletedList: function(ns, ev, eventData) {
            const currentData = this.oListsModel.getData().data || [];
            const updatedData = currentData.filter(list => list.id !== eventData.id);
            this.oListsModel.setData({data: updatedData});
            this.oListsModel.updateBindings();
            this.oListsModel.refresh(true);
        },

        handleListAdded: function(ns, ev, eventData) {
            const currentData = this.oListsModel.getData().data || [];
            currentData.push(eventData);
            this.oListsModel.setData({ data: currentData });
            this.oListsModel.updateBindings();
            this.oListsModel.refresh(true);
        },

        handleUpdatedList: async function (ns, ev, eventData) {
            try {
                await this.setUpLists();
            } catch (error) {
                console.error("Error updating list:", error);
                MessageToast.show("Failed to update lists.");
            }
        },

        onTilePress: function (oEvent) {
            const oTile = oEvent.getSource();
            const oList = oTile.getBindingContext("lists").getObject();
            this.getOwnerComponent().getRouter().navTo("list", {
                listId:oList.id,
            });
        },

        onTileAcceptedPress: function (oEvent) {
            const oTile = oEvent.getSource();
            const oList = oTile.getBindingContext("accepted").getObject();
            this.getOwnerComponent().getRouter().navTo("list", {
                listId:oList.id,
            });
        },

        onAddList: async function (oEvent) {
            if (!this.addListDialog) {
                this.addListDialog = await XMLView.create({
                    id: "addListDialogView",
                    viewName: "todoapp.view.CreateListDialog"
                });
                this.getView().addDependent(this.addListDialog);
            }
            const oListModel = this.addListDialog.getModel("listModel");
            oListModel.setProperty("/dialogTitle", "Create List");
            this.addListDialog.byId("createListDialog").open();
        },
    });
});
