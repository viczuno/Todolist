sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Lists",
    "sap/m/MessageToast",
    "todoapp/util/graphql/Client",
    "sap/ui/core/Core",
    "sap/ui/core/ValueState",
], function (Controller, JSONModel, Lists, MessageToast, Client, Core, ValueState) {
    "use strict";

    return Controller.extend("todoapp.controller.CreateListDialog", {

        onInit:function() {
            this.oListModel = new JSONModel(this._initialModel());
            this.getView().setModel(this.oListModel, "listModel");
        },

        onSubmitPress: async function () {
            const oModel = this.oListModel.getData();

            this._validateName(oModel.name);
            this._validateVisibility(oModel.visibility);

            const isInvalid = this.isModelInvalid(oModel);
            if (isInvalid) {
                return;
            }

            let result;
            const isEditMode = !!oModel.id;

            try {
                let query;
                if (isEditMode) {
                    query = Lists.updateList(oModel.id, {
                        name: oModel.name,
                        description: oModel.description,
                        visibility: oModel.visibility,
                        tags: oModel.tags,
                    });
                } else {
                    query = Lists.createList({
                        name: oModel.name,
                        description: oModel.description,
                        visibility: oModel.visibility,
                        tags: oModel.tags,
                    });
                }

                result = await Client.fetch(query);
                if (isEditMode) {
                    Core.getEventBus().publish("todoapp", "listUpdated", result)
                    Core.getEventBus().publish("todoapp", "updated", result);
                } else {
                    Core.getEventBus().publish("todoapp", "listAdded", result);
                }

                this.byId("createListDialog").close();
                MessageToast.show(`List ${isEditMode ? "updated" : "created"} with name: ${oModel.name}`);
            } catch (error) {
                console.error(`Error ${isEditMode ? "updating" : "creating"} list:`, error);
                MessageToast.show(`Failed to ${isEditMode ? "update" : "create"} list.`);
            }
        },

        onNameChange: function (oEvent) {
            const newValue = oEvent.getParameter("value");

            if (newValue.trim().length > 0) {
                this.oListModel.setProperty("/validation/name/type", "None");
                this.oListModel.setProperty("/validation/name/text", "");
            }
        },

        onVisibilityChange: function (oEvent) {
            const selectedItem = oEvent.getParameter("selectedItem");
            if (selectedItem) {
                const selectedKey = selectedItem.getKey();
                this.oListModel.setProperty("/visibility", selectedKey);
                this.oListModel.setProperty("/validation/visibility", this._emptyValidation())
            }
        },

        onSelectionChange: function(oEvent) {
            let oMultiComboBox = this.byId("createListTagsMultiComboBox");
            let aSelectedKeys = oMultiComboBox.getSelectedKeys();

            if (aSelectedKeys.length > 6) {
                let sKeyToRemove = oEvent.getParameter("changedItem").getKey();
                let iKeyIndex = aSelectedKeys.indexOf(sKeyToRemove);

                if (iKeyIndex > -1) {
                    aSelectedKeys.splice(iKeyIndex, 1);
                }

                oMultiComboBox.setSelectedKeys(aSelectedKeys);

                MessageToast.show("You can select a maximum of 6 tags.");
            }
        },


        formatTitle: function(bIsEditMode) {
          return bIsEditMode ? "Edit List" : "Create List";
        },

        onCancelPress: function () {
            this.byId("createListDialog").close();
        },

        onAfterClose: function () {
            this.resetModels();
        },

        isModelInvalid: function (oModel) {
            return Object.values(oModel.validation).some((oValidation) => {
                return oValidation.type === ValueState.Error
            })
        },

        resetModels: function() {
            this.oListModel.setData(this._initialModel());
        },

        _emptyValidation: function () {
            return {
                text: "",
                type: ValueState.None
            }
        },

        _validateName: function (sName) {
            const oValidated = {
                text: "",
                type: ValueState.None,
            }
            if (sName.length <= 3) {
                oValidated.text = "List name should be long at least 3 letters";
                oValidated.type = ValueState.Error
            } else if (sName.length > this.MAX_NAME_LENGTH) {
                oValidated.text = `List name should not exceed ${this.MAX_NAME_LENGTH} symbols`;
                oValidated.type = ValueState.Error
            }

            this.oListModel.setProperty("/validation/name/text", oValidated.text);
            this.oListModel.setProperty("/validation/name/type", oValidated.type);
        },

        _validateVisibility: function (sVisibility) {
            const oValidated = {
                text: "",
                type: ValueState.None,
            }
            if (sVisibility.length === 0) {
                oValidated.text = "List visibility should not be empty";
                oValidated.type = ValueState.Error
            }

            this.oListModel.setProperty("/validation/visibility/text", oValidated.text);
            this.oListModel.setProperty("/validation/visibility/type", oValidated.type);
        },

        _initialModel: function () {
            return {
                isEditMode: false,
                id: "",
                name: "",
                description: "",
                visibility: "",
                tags: [],
                validation: {
                    name: {
                        text: "",
                        type: ValueState.None
                    },
                    visibility: {
                        text: "",
                        type: ValueState.None
                    }
                },
            }
        }
    });
});
